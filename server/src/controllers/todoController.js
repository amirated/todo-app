const pool = require('../config/db');
const AppError = require('../utils/AppError');
const withTransaction = require('../utils/withTransaction');
const { isForeignKeyViolation } = require('../utils/pgErrors');

// Input has already been validated by the validate() middleware and is read
// from req.validated. Errors thrown here (including rejected DB queries) are
// forwarded to the centralized error handler automatically by Express 5.

const tabNotFound = () => new AppError(404, 'Tab not found');

// Throws 404 if the tab doesn't exist. `lockClause` lets a transaction hold
// the row (e.g. 'FOR SHARE') so the tab can't be deleted mid-operation.
async function assertGroupExists(db, groupId, lockClause = '') {
  const { rowCount } = await db.query(
    `SELECT 1 FROM task_groups WHERE id = $1 ${lockClause}`,
    [groupId]
  );

  if (rowCount === 0) throw tabNotFound();
}

// GET /api/todos?groupId=
async function getTodos(req, res) {
  const { groupId } = req.validated.query;

  await assertGroupExists(pool, groupId);

  const result = await pool.query(
    `SELECT * FROM todos
     WHERE group_id = $1
     ORDER BY position ASC, created_at DESC`,
    [groupId]
  );

  res.json(result.rows);
}

// POST /api/todos
async function createTodo(req, res) {
  const { groupId, title } = req.validated.body;

  try {
    const result = await pool.query(
      // New todos go to the top of their tab: one position above its first item.
      `INSERT INTO todos (group_id, title, position)
       VALUES (
         $1,
         $2,
         (SELECT COALESCE(MIN(position), 0) - 1 FROM todos WHERE group_id = $1)
       )
       RETURNING *`,
      [groupId, title]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    // The foreign key rejects a groupId that doesn't exist.
    if (isForeignKeyViolation(error)) throw tabNotFound();
    throw error;
  }
}

// PUT /api/todos/:id
async function updateTodo(req, res) {
  const { id } = req.validated.params;
  const { title, completed } = req.validated.body;

  const result = await pool.query(
    `UPDATE todos
     SET title = COALESCE($1, title),
         completed = COALESCE($2, completed),
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [title ?? null, completed ?? null, id]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Todo not found');
  }

  res.json(result.rows[0]);
}

// DELETE /api/todos/:id
async function deleteTodo(req, res) {
  const { id } = req.validated.params;

  const result = await pool.query(
    'DELETE FROM todos WHERE id = $1 RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Todo not found');
  }

  res.json({ message: 'Todo deleted successfully' });
}

// DELETE /api/todos/completed?groupId=
async function clearCompleted(req, res) {
  const { groupId } = req.validated.query;

  await assertGroupExists(pool, groupId);

  const result = await pool.query(
    'DELETE FROM todos WHERE group_id = $1 AND completed = TRUE',
    [groupId]
  );

  res.json({
    message: 'Completed todos deleted successfully',
    deletedCount: result.rowCount,
  });
}

// PUT /api/todos/reorder
async function reorderTodos(req, res) {
  const { groupId } = req.validated.body;
  // Postgres returns UUIDs in lowercase; normalise so the set comparison matches.
  const orderedIds = req.validated.body.orderedIds.map((id) => id.toLowerCase());

  const rows = await withTransaction(async (client) => {
    // Hold the tab so it can't be deleted, and lock its todos so concurrent
    // reorders/creates/deletes in this tab can't interleave.
    await assertGroupExists(client, groupId, 'FOR SHARE');

    const current = await client.query(
      'SELECT id FROM todos WHERE group_id = $1 FOR UPDATE',
      [groupId]
    );

    // The client must send exactly the tab's current todos. A mismatch means
    // its list is stale (e.g. a todo was added or deleted in another browser tab).
    const requested = new Set(orderedIds);
    const matches =
      current.rows.length === orderedIds.length &&
      current.rows.every((row) => requested.has(row.id));

    if (!matches) {
      throw new AppError(
        409,
        'The todo list has changed since it was loaded. Refresh and try again.'
      );
    }

    // One statement: each ID's index in the array becomes its position.
    await client.query(
      `UPDATE todos AS t
       SET position = o.ord - 1
       FROM unnest($1::uuid[]) WITH ORDINALITY AS o(id, ord)
       WHERE t.id = o.id AND t.group_id = $2`,
      [orderedIds, groupId]
    );

    const result = await client.query(
      `SELECT * FROM todos
       WHERE group_id = $1
       ORDER BY position ASC, created_at DESC`,
      [groupId]
    );

    return result.rows;
  });

  res.json(rows);
}

module.exports = {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  clearCompleted,
  reorderTodos,
};
