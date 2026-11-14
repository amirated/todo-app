const { OpenApiGeneratorV3 } = require('@asteasolutions/zod-to-openapi');

const { registry, json } = require('./registry');
const { healthSchema } = require('../schemas/responseSchemas');
const { version } = require('../../package.json');

// Each *.openapi.js file registers its routes on the shared registry when it
// is required. Add new route documentation files here.
require('../routes/todoRoutes.openapi');

// GET /health lives in server.js, so it is documented here.
registry.registerPath({
  method: 'get',
  path: '/health',
  operationId: 'getHealth',
  tags: ['Health'],
  summary: 'Server and database health check',
  responses: {
    200: json(healthSchema, 'Server is up and the database is reachable'),
    500: {
      description: 'Database connection failed',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'error' },
              message: { type: 'string', example: 'Database connection failed' },
            },
          },
        },
      },
    },
  },
});

function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Todo API',
      version,
      description: 'REST API for the todo app. Generated from the Zod schemas.',
    },
    // Postman turns this into the {{baseUrl}} collection variable.
    // The API has no authentication; declare that explicitly.
    security: [],
    servers: [{ url: 'http://localhost:5001', description: 'Local development' }],
    tags: [
      { name: 'Todos', description: 'Create, update, delete and reorder todos' },
      { name: 'Health', description: 'Service status' },
    ],
  });
}

module.exports = { generateOpenApiDocument };
