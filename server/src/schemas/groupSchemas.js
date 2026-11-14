const { z } = require('../lib/zod');

const GROUP_NAME_MAX_LENGTH = 50;

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

// Request schemas for validate(): { body?, params?, query? }
const createGroupSchema = z.object({ body: createGroupBody });
const updateGroupSchema = z.object({ params: groupIdParams, body: updateGroupBody });
const deleteGroupSchema = z.object({ params: groupIdParams });

module.exports = {
  GROUP_NAME_MAX_LENGTH,
  groupIdParams,
  createGroupBody,
  updateGroupBody,
  createGroupSchema,
  updateGroupSchema,
  deleteGroupSchema,
};
