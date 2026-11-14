const express = require('express');
const router = express.Router();

const validate = require('../middleware/validate');
const {
  listTodosSchema,
  clearCompletedSchema,
  createTodoSchema,
  updateTodoSchema,
  deleteTodoSchema,
  reorderTodosSchema,
} = require('../schemas/todoSchemas');
const {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  clearCompleted,
  reorderTodos,
} = require('../controllers/todoController');

router.get('/', validate(listTodosSchema), getTodos);
router.post('/', validate(createTodoSchema), createTodo);
// Static paths must stay above '/:id' so they are not treated as ids
router.delete('/completed', validate(clearCompletedSchema), clearCompleted);
router.put('/reorder', validate(reorderTodosSchema), reorderTodos);
router.put('/:id', validate(updateTodoSchema), updateTodo);
router.delete('/:id', validate(deleteTodoSchema), deleteTodo);

module.exports = router;
