const { z } = require('../lib/zod');

// Response shapes. These are used only for the OpenAPI docs; the controllers
// return database rows and the error handler builds error bodies directly.

const todoSchema = z
  .object({
    id: z.uuid(),
    group_id: z.uuid().openapi({ description: 'The tab (task group) this todo belongs to' }),
    title: z.string(),
    completed: z.boolean(),
    position: z.number().int().openapi({
      description: 'Sort order. Lower values appear first; values can be negative and have gaps.',
    }),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime(),
  })
  .openapi('Todo', {
    example: {
      id: '3f1c9a3e-8a6b-4c2e-9f61-2d5b7c8e1a90',
      group_id: '7d2a4c1e-5b3f-4e8a-9c6d-1f0e2b3a4c5d',
      title: 'Buy milk',
      completed: false,
      position: 0,
      created_at: '2026-11-14T06:00:00.000Z',
      updated_at: '2026-11-14T06:00:00.000Z',
    },
  });

const todoListSchema = z.array(todoSchema).openapi('TodoList');

const messageSchema = z
  .object({ message: z.string() })
  .openapi('MessageResponse', { example: { message: 'Todo deleted successfully' } });

const clearCompletedSchema = z
  .object({ message: z.string(), deletedCount: z.number().int() })
  .openapi('ClearCompletedResponse', {
    example: { message: 'Completed todos deleted successfully', deletedCount: 2 },
  });

const groupSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    position: z.number().int().openapi({ description: 'Tab order, lowest first' }),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime(),
  })
  .openapi('TaskGroup', {
    description: 'A tab that groups todos',
    example: {
      id: '7d2a4c1e-5b3f-4e8a-9c6d-1f0e2b3a4c5d',
      name: 'My Tasks',
      position: 0,
      created_at: '2026-11-14T06:00:00.000Z',
      updated_at: '2026-11-14T06:00:00.000Z',
    },
  });

const groupListSchema = z.array(groupSchema).openapi('TaskGroupList');

const deleteGroupResponseSchema = z
  .object({ message: z.string(), deletedTodoCount: z.number().int() })
  .openapi('DeleteGroupResponse', {
    example: { message: 'Tab deleted successfully', deletedTodoCount: 3 },
  });

const healthSchema = z
  .object({ status: z.literal('ok'), database: z.literal('connected') })
  .openapi('HealthResponse');

const errorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      message: z.string(),
      details: z.array(
        z.object({
          location: z.enum(['body', 'params', 'query']),
          field: z.string().nullable(),
          message: z.string(),
        })
      ),
      debug: z
        .object({
          message: z.string(),
          code: z.string().optional(),
          stack: z.string().optional(),
        })
        .optional()
        .openapi({ description: 'Only on 5xx responses when NODE_ENV is not "production".' }),
    }),
  })
  .openapi('ErrorResponse', {
    example: {
      success: false,
      error: {
        message: 'Validation failed',
        details: [{ location: 'body', field: 'title', message: 'Title is required' }],
      },
    },
  });

module.exports = {
  todoSchema,
  todoListSchema,
  messageSchema,
  clearCompletedSchema,
  groupSchema,
  groupListSchema,
  deleteGroupResponseSchema,
  healthSchema,
  errorResponseSchema,
};
