const express = require('express');
const router = express.Router();

const validate = require('../middleware/validate');
const {
  createTodoSchema,
  updateTodoSchema,
  deleteTodoSchema,
} = require('../schemas/todoSchemas');
const {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  clearCompleted,
} = require('../controllers/todoController');

router.get('/', getTodos);
router.post('/', validate(createTodoSchema), createTodo);
// Must stay above '/:id' so "completed" is not treated as an id
router.delete('/completed', clearCompleted);
router.put('/:id', validate(updateTodoSchema), updateTodo);
router.delete('/:id', validate(deleteTodoSchema), deleteTodo);

module.exports = router;
