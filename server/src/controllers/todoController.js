
const pool = require('../config/db');

// GET /api/todos
async function getTodos(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM todos ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ message: 'Failed to fetch todos' });
  }
}

// POST /api/todos
async function createTodo(req, res) {
  try {
    const { title } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const result = await pool.query(
      'INSERT INTO todos (title) VALUES ($1) RETURNING *',
      [title.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ message: 'Failed to create todo' });
  }
}

// PUT /api/todos/:id
async function updateTodo(req, res) {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      return res.status(400).json({ message: 'Title cannot be empty' });
    }

    if (completed !== undefined && typeof completed !== 'boolean') {
      return res.status(400).json({ message: 'Completed must be a boolean' });
    }

    if (title === undefined && completed === undefined) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    const result = await pool.query(
      `UPDATE todos
       SET title = COALESCE($1, title),
           completed = COALESCE($2, completed),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [
        title === undefined ? null : title.trim(),
        completed === undefined ? null : completed,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ message: 'Failed to update todo' });
  }
}

// DELETE /api/todos/:id
async function deleteTodo(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM todos WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ message: 'Failed to delete todo' });
  }
}

// DELETE /api/todos/completed
async function clearCompleted(req, res) {
  try {
    const result = await pool.query(
      'DELETE FROM todos WHERE completed = TRUE RETURNING id'
    );

    res.json({
      message: 'Completed todos deleted successfully',
      deletedCount: result.rowCount,
    });
  } catch (error) {
    console.error('Error clearing completed todos:', error);
    res.status(500).json({ message: 'Failed to clear completed todos' });
  }
}

module.exports = {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  clearCompleted,
};
