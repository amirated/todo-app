const { z } = require('zod');

const TITLE_MAX_LENGTH = 255;
const REORDER_MAX_ITEMS = 1000;

// Each schema describes the parts of the request it cares about:
// { body?, params?, query? }. Parts that are left out are not validated.

const titleSchema = (emptyMessage) =>
  z
    .string({
      error: (issue) =>
        issue.input === undefined ? 'Title is required' : 'Title must be a string',
    })
    .trim()
    .min(1, emptyMessage)
    .max(TITLE_MAX_LENGTH, `Title must be at most ${TITLE_MAX_LENGTH} characters`);

const todoIdParams = z.object({
  id: z.uuid({ error: 'Todo ID must be a valid UUID' }),
});

// POST /api/todos
const createTodoSchema = z.object({
  body: z.object({
    title: titleSchema('Title is required'),
  }),
});

// PUT /api/todos/:id — partial update: title and/or completed
const updateTodoSchema = z.object({
  params: todoIdParams,
  body: z
    .object({
      title: titleSchema('Title cannot be empty').optional(),
      completed: z.boolean({ error: 'Completed must be a boolean' }).optional(),
    })
    .refine((body) => body.title !== undefined || body.completed !== undefined, {
      message: 'Nothing to update',
    }),
});

// DELETE /api/todos/:id
const deleteTodoSchema = z.object({
  params: todoIdParams,
});

// PUT /api/todos/reorder — the complete list of todo IDs in their new order
const reorderTodosSchema = z.object({
  body: z.object({
    orderedIds: z
      .array(z.uuid({ error: 'Each ID must be a valid UUID' }), {
        error: 'orderedIds must be an array of todo IDs',
      })
      .max(REORDER_MAX_ITEMS, `orderedIds can contain at most ${REORDER_MAX_ITEMS} IDs`)
      .transform((ids) => ids.map((id) => id.toLowerCase()))
      .refine((ids) => new Set(ids).size === ids.length, {
        message: 'orderedIds must not contain duplicates',
      }),
  }),
});

module.exports = {
  TITLE_MAX_LENGTH,
  REORDER_MAX_ITEMS,
  createTodoSchema,
  updateTodoSchema,
  deleteTodoSchema,
  reorderTodosSchema,
};
