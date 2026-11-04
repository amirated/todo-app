
const express = require('express');
const router = express.Router();

const {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  clearCompleted,
} = require('../controllers/todoController');

router.get('/', getTodos);
router.post('/', createTodo);
router.delete('/completed', clearCompleted);
router.put('/:id', updateTodo);
router.delete('/:id', deleteTodo);

module.exports = router;
