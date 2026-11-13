const pool = require('../config/db');
const AppError = require('../utils/AppError');

// Input has already been validated by the validate() middleware and is read
// from req.validated. Errors thrown here (including rejected DB queries) are
// forwarded to the centralized error handler automatically by Express 5.

// GET /api/todos
async function getTodos(req, res) {
  const result = await pool.query(
    'SELECT * FROM todos ORDER BY created_at DESC'
  );

  res.json(result.rows);
}

// POST /api/todos
async function createTodo(req, res) {
  const { title } = req.validated.body;

  const result = await pool.query(
    'INSERT INTO todos (title) VALUES ($1) RETURNING *',
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

module.exports = {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  clearCompleted,
};
