/**
 * OpenAPI documentation for the routes in todoRoutes.js.
 *
 * Keep this file in step with todoRoutes.js: when you add or change a route
 * there, add or change its registerPath() call here. Request schemas are the
 * same objects validate() uses, so the documented input can't drift from what
 * the API actually accepts.
 */
const { registry, json, errorResponses } = require('../openapi/registry');
const {
  todoIdParams,
  createTodoBody,
  updateTodoBody,
  reorderTodosBody,
} = require('../schemas/todoSchemas');
const {
  todoSchema,
  todoListSchema,
  messageSchema,
  clearCompletedSchema,
} = require('../schemas/responseSchemas');

const tags = ['Todos'];
const jsonBody = (schema) => ({
  required: true,
  content: { 'application/json': { schema } },
});

// router.get('/', getTodos)
registry.registerPath({
  method: 'get',
  path: '/api/todos',
  operationId: 'listTodos',
  tags,
  summary: 'List todos',
  description: 'Returns all todos in their saved order (ascending `position`).',
  responses: {
    200: json(todoListSchema, 'All todos'),
    500: errorResponses.server,
  },
});

// router.post('/', validate(createTodoSchema), createTodo)
registry.registerPath({
  method: 'post',
  path: '/api/todos',
  operationId: 'createTodo',
  tags,
  summary: 'Create a todo',
  description: 'The new todo is placed at the top of the list.',
  request: { body: jsonBody(createTodoBody) },
  responses: {
    201: json(todoSchema, 'The created todo'),
    400: errorResponses.validation,
    500: errorResponses.server,
  },
});

// router.delete('/completed', clearCompleted)
registry.registerPath({
  method: 'delete',
  path: '/api/todos/completed',
  operationId: 'clearCompletedTodos',
  tags,
  summary: 'Delete all completed todos',
  responses: {
    200: json(clearCompletedSchema, 'Number of todos deleted'),
    500: errorResponses.server,
  },
});

// router.put('/reorder', validate(reorderTodosSchema), reorderTodos)
registry.registerPath({
  method: 'put',
  path: '/api/todos/reorder',
  operationId: 'reorderTodos',
  tags,
  summary: 'Save the order of all todos',
  description:
    'Send every todo ID in the new order. Positions are rewritten in one transaction.',
  request: { body: jsonBody(reorderTodosBody) },
  responses: {
    200: json(todoListSchema, 'All todos in their new order'),
    400: errorResponses.validation,
    409: errorResponses.conflict,
    500: errorResponses.server,
  },
});

// router.put('/:id', validate(updateTodoSchema), updateTodo)
registry.registerPath({
  method: 'put',
  path: '/api/todos/{id}',
  operationId: 'updateTodo',
  tags,
  summary: 'Update a todo',
  request: { params: todoIdParams, body: jsonBody(updateTodoBody) },
  responses: {
    200: json(todoSchema, 'The updated todo'),
    400: errorResponses.validation,
    404: errorResponses.notFound,
    500: errorResponses.server,
  },
});

// router.delete('/:id', validate(deleteTodoSchema), deleteTodo)
registry.registerPath({
  method: 'delete',
  path: '/api/todos/{id}',
  operationId: 'deleteTodo',
  tags,
  summary: 'Delete a todo',
  request: { params: todoIdParams },
  responses: {
    200: json(messageSchema, 'Confirmation message'),
    400: errorResponses.validation,
    404: errorResponses.notFound,
    500: errorResponses.server,
  },
});
