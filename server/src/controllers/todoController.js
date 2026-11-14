const pool = require('../config/db');
const AppError = require('../utils/AppError');

// Input has already been validated by the validate() middleware and is read
// from req.validated. Errors thrown here (including rejected DB queries) are
// forwarded to the centralized error handler automatically by Express 5.

// GET /api/todos
async function getTodos(req, res) {
  const result = await pool.query(
    'SELECT * FROM todos ORDER BY position ASC, created_at DESC'
  );

  res.json(result.rows);
}

// POST /api/todos
async function createTodo(req, res) {
  const { title } = req.validated.body;

  const result = await pool.query(
    // New todos go to the top: one position above the current first item.
    `INSERT INTO todos (title, position)
     VALUES ($1, (SELECT COALESCE(MIN(position), 0) - 1 FROM todos))
     RETURNING *`,
    [title]
  );

  res.status(201).json(result.rows[0]);
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

// DELETE /api/todos/completed
async function clearCompleted(req, res) {
  const result = await pool.query(
    'DELETE FROM todos WHERE completed = TRUE RETURNING id'
  );

  res.json({
    message: 'Completed todos deleted successfully',
    deletedCount: result.rowCount,
  });
}

// PUT /api/todos/reorder
async function reorderTodos(req, res) {
  // Postgres returns UUIDs in lowercase; normalise so the set comparison matches.
  const orderedIds = req.validated.body.orderedIds.map((id) => id.toLowerCase());
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock every row so concurrent reorders/creates/deletes can't interleave.
    const { rows } = await client.query('SELECT id FROM todos FOR UPDATE');

    // The client must send exactly the current set of todos. A mismatch means
    // its list is stale (e.g. a todo was added or deleted in another tab).
    const requested = new Set(orderedIds);
    const matches =
      rows.length === orderedIds.length && rows.every((row) => requested.has(row.id));

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
       WHERE t.id = o.id`,
      [orderedIds]
    );

    const result = await client.query(
      'SELECT * FROM todos ORDER BY position ASC, created_at DESC'
    );

    await client.query('COMMIT');
    res.json(result.rows);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error; // forwarded to the centralized error handler
  } finally {
    client.release();
  }
}

module.exports = {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  clearCompleted,
  reorderTodos,
};
