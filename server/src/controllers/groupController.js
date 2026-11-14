const pool = require('../config/db');
const AppError = require('../utils/AppError');
const withTransaction = require('../utils/withTransaction');
const { isUniqueViolation } = require('../utils/pgErrors');

const duplicateName = (name) => new AppError(409, `A tab named "${name}" already exists`);

// GET /api/groups
async function getGroups(req, res) {
  const result = await pool.query(
    'SELECT * FROM task_groups ORDER BY position ASC, created_at ASC'
  );

  res.json(result.rows);
}

// POST /api/groups — new tabs are added at the end
async function createGroup(req, res) {
  const { name } = req.validated.body;

  try {
    const result = await pool.query(
      `INSERT INTO task_groups (name, position)
       VALUES ($1, (SELECT COALESCE(MAX(position), -1) + 1 FROM task_groups))
       RETURNING *`,
      [name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (isUniqueViolation(error)) throw duplicateName(name);
    throw error;
  }
}

// PUT /api/groups/:id — rename
async function updateGroup(req, res) {
  const { id } = req.validated.params;
  const { name } = req.validated.body;

  try {
    const result = await pool.query(
      `UPDATE task_groups
       SET name = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [name, id]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Tab not found');
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (isUniqueViolation(error)) throw duplicateName(name);
    throw error;
  }
}

// DELETE /api/groups/:id — deletes the tab and all of its todos
async function deleteGroup(req, res) {
  const { id } = req.validated.params;

  const deletedTodoCount = await withTransaction(async (client) => {
    // Lock all tabs so two concurrent deletes can't remove the last two.
    const { rows } = await client.query('SELECT id FROM task_groups FOR UPDATE');

    if (!rows.some((row) => row.id === id)) {
      throw new AppError(404, 'Tab not found');
    }

    if (rows.length === 1) {
      throw new AppError(409, "You can't delete your only tab");
    }

    // Deleted explicitly (rather than only via ON DELETE CASCADE) to get the count.
    const todos = await client.query('DELETE FROM todos WHERE group_id = $1', [id]);
    await client.query('DELETE FROM task_groups WHERE id = $1', [id]);

    return todos.rowCount;
  });

  res.json({ message: 'Tab deleted successfully', deletedTodoCount });
}

module.exports = {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
};
