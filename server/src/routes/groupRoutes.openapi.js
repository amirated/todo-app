/**
 * OpenAPI documentation for the routes in groupRoutes.js.
 * Keep in step with groupRoutes.js.
 */
const { registry, json, errorResponses } = require('../openapi/registry');
const { groupIdParams, createGroupBody, updateGroupBody } = require('../schemas/groupSchemas');
const {
  groupSchema,
  groupListSchema,
  deleteGroupResponseSchema,
  errorResponseSchema,
} = require('../schemas/responseSchemas');

const tags = ['Tabs'];
const jsonBody = (schema) => ({
  required: true,
  content: { 'application/json': { schema } },
});

// router.get('/', getGroups)
registry.registerPath({
  method: 'get',
  path: '/api/groups',
  operationId: 'listGroups',
  tags,
  summary: 'List tabs',
  responses: {
    200: json(groupListSchema, 'All tabs, in order'),
    500: errorResponses.server,
  },
});

// router.post('/', validate(createGroupSchema), createGroup)
registry.registerPath({
  method: 'post',
  path: '/api/groups',
  operationId: 'createGroup',
  tags,
  summary: 'Create a tab',
  description: 'The new tab is added at the end. Names are unique, ignoring case.',
  request: { body: jsonBody(createGroupBody) },
  responses: {
    201: json(groupSchema, 'The created tab'),
    400: errorResponses.validation,
    409: json(errorResponseSchema, 'A tab with that name already exists'),
    500: errorResponses.server,
  },
});

// router.put('/:id', validate(updateGroupSchema), updateGroup)
registry.registerPath({
  method: 'put',
  path: '/api/groups/{id}',
  operationId: 'renameGroup',
  tags,
  summary: 'Rename a tab',
  request: { params: groupIdParams, body: jsonBody(updateGroupBody) },
  responses: {
    200: json(groupSchema, 'The renamed tab'),
    400: errorResponses.validation,
    404: errorResponses.tabNotFound,
    409: json(errorResponseSchema, 'A tab with that name already exists'),
    500: errorResponses.server,
  },
});

// router.delete('/:id', validate(deleteGroupSchema), deleteGroup)
registry.registerPath({
  method: 'delete',
  path: '/api/groups/{id}',
  operationId: 'deleteGroup',
  tags,
  summary: 'Delete a tab and all of its todos',
  request: { params: groupIdParams },
  responses: {
    200: json(deleteGroupResponseSchema, 'How many todos were deleted with the tab'),
    400: errorResponses.validation,
    404: errorResponses.tabNotFound,
    409: json(errorResponseSchema, "The tab is the only one left and can't be deleted"),
    500: errorResponses.server,
  },
});
