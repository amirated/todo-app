const { z } = require('../lib/zod');

const TITLE_MAX_LENGTH = 255;
const REORDER_MAX_ITEMS = 1000;

// ---------------------------------------------------------------------------
// Building blocks. Exported individually so the OpenAPI docs reuse exactly the
// same definitions that the validate() middleware enforces.
// ---------------------------------------------------------------------------

const titleSchema = (emptyMessage) =>
  z
    .string({
      error: (issue) =>
        issue.input === undefined ? 'Title is required' : 'Title must be a string',
    })
    .trim()
    .min(1, emptyMessage)
    .max(TITLE_MAX_LENGTH, `Title must be at most ${TITLE_MAX_LENGTH} characters`)
    .openapi({ example: 'Buy milk' });

// The tab (task group) a todo belongs to.
const groupIdSchema = z
  .uuid({
    error: (issue) =>
      issue.input === undefined ? 'groupId is required' : 'groupId must be a valid UUID',
  })
  .openapi({ example: '7d2a4c1e-5b3f-4e8a-9c6d-1f0e2b3a4c5d' });

// ?groupId=... on list and clear-completed
const groupQuery = z.object({
  groupId: groupIdSchema.openapi({ param: { description: 'Tab (task group) ID' } }),
});

const todoIdParams = z.object({
  id: z
    .uuid({ error: 'Todo ID must be a valid UUID' })
    .openapi({
      param: { description: 'Todo ID' },
      example: '3f1c9a3e-8a6b-4c2e-9f61-2d5b7c8e1a90',
    }),
});

const createTodoBody = z
  .object({
    groupId: groupIdSchema,
    title: titleSchema('Title is required'),
  })
  .openapi('CreateTodoRequest');

const updateTodoBody = z
  .object({
    title: titleSchema('Title cannot be empty').optional(),
    completed: z.boolean({ error: 'Completed must be a boolean' }).optional(),
  })
  .refine((body) => body.title !== undefined || body.completed !== undefined, {
    message: 'Nothing to update',
  })
  .openapi('UpdateTodoRequest', {
    description: 'Partial update. At least one of `title` or `completed` is required.',
    example: { completed: true },
  });

const reorderTodosBody = z
  .object({
    groupId: groupIdSchema,
    orderedIds: z
      .array(z.uuid({ error: 'Each ID must be a valid UUID' }), {
        error: 'orderedIds must be an array of todo IDs',
      })
      .max(REORDER_MAX_ITEMS, `orderedIds can contain at most ${REORDER_MAX_ITEMS} IDs`)
      .refine((ids) => new Set(ids.map((id) => id.toLowerCase())).size === ids.length, {
        message: 'orderedIds must not contain duplicates',
      })
      .openapi({
        description:
          "Every todo ID in the tab, in the new order. Must match the tab's current todos exactly.",
      }),
  })
  .openapi('ReorderTodosRequest');

// ---------------------------------------------------------------------------
// Request schemas for the validate() middleware: { body?, params?, query? }
// ---------------------------------------------------------------------------

// GET /api/todos?groupId=
const listTodosSchema = z.object({ query: groupQuery });

// DELETE /api/todos/completed?groupId=
const clearCompletedSchema = z.object({ query: groupQuery });

// POST /api/todos
const createTodoSchema = z.object({ body: createTodoBody });

// PUT /api/todos/:id
const updateTodoSchema = z.object({ params: todoIdParams, body: updateTodoBody });

// DELETE /api/todos/:id
const deleteTodoSchema = z.object({ params: todoIdParams });

// PUT /api/todos/reorder
const reorderTodosSchema = z.object({ body: reorderTodosBody });

module.exports = {
  TITLE_MAX_LENGTH,
  REORDER_MAX_ITEMS,
  // building blocks (used by the OpenAPI docs)
  groupQuery,
  todoIdParams,
  createTodoBody,
  updateTodoBody,
  reorderTodosBody,
  // request schemas (used by validate())
  listTodosSchema,
  clearCompletedSchema,
  createTodoSchema,
  updateTodoSchema,
  deleteTodoSchema,
  reorderTodosSchema,
};
