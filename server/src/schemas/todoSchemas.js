const { z } = require('zod');

const TITLE_MAX_LENGTH = 255;

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

module.exports = {
  TITLE_MAX_LENGTH,
  createTodoSchema,
  updateTodoSchema,
  deleteTodoSchema,
};
