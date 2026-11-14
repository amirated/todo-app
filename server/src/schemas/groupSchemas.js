const { z } = require('../lib/zod');

const GROUP_NAME_MAX_LENGTH = 50;
const REORDER_MAX_GROUPS = 100;

const groupNameSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined ? 'Tab name is required' : 'Tab name must be a string',
  })
  .trim()
  .min(1, 'Tab name is required')
  .max(GROUP_NAME_MAX_LENGTH, `Tab name must be at most ${GROUP_NAME_MAX_LENGTH} characters`)
  .openapi({ example: 'Work' });

const groupIdParams = z.object({
  id: z.uuid({ error: 'Tab ID must be a valid UUID' }).openapi({
    param: { description: 'Tab (task group) ID' },
    example: '7d2a4c1e-5b3f-4e8a-9c6d-1f0e2b3a4c5d',
  }),
});

const createGroupBody = z.object({ name: groupNameSchema }).openapi('CreateGroupRequest');
const updateGroupBody = z.object({ name: groupNameSchema }).openapi('UpdateGroupRequest');

const reorderGroupsBody = z
  .object({
    orderedIds: z
      .array(z.uuid({ error: 'Each tab ID must be a valid UUID' }), {
        error: 'orderedIds must be an array of tab IDs',
      })
      .max(REORDER_MAX_GROUPS, `orderedIds can contain at most ${REORDER_MAX_GROUPS} IDs`)
      .refine((ids) => new Set(ids.map((id) => id.toLowerCase())).size === ids.length, {
        message: 'orderedIds must not contain duplicates',
      })
      .openapi({
        description: 'Every tab ID, in the new order. Must match the current set of tabs exactly.',
      }),
  })
  .openapi('ReorderGroupsRequest');

// Request schemas for validate(): { body?, params?, query? }
const createGroupSchema = z.object({ body: createGroupBody });
const updateGroupSchema = z.object({ params: groupIdParams, body: updateGroupBody });
const deleteGroupSchema = z.object({ params: groupIdParams });
const reorderGroupsSchema = z.object({ body: reorderGroupsBody });

module.exports = {
  GROUP_NAME_MAX_LENGTH,
  REORDER_MAX_GROUPS,
  groupIdParams,
  createGroupBody,
  updateGroupBody,
  reorderGroupsBody,
  createGroupSchema,
  updateGroupSchema,
  deleteGroupSchema,
  reorderGroupsSchema,
};
