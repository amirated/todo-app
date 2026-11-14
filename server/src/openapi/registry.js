const { OpenAPIRegistry } = require('@asteasolutions/zod-to-openapi');

const { errorResponseSchema } = require('../schemas/responseSchemas');

/**
 * The single OpenAPI registry for the API.
 *
 * It only collects definitions. It does not import Express, the database
 * pool or dotenv, so the spec can be generated in CI without booting the
 * server, touching a database or needing any secrets.
 */
const registry = new OpenAPIRegistry();

// Helpers for responses that most routes share.
const json = (schema, description) => ({
  description,
  content: { 'application/json': { schema } },
});

const errorResponses = {
  validation: json(errorResponseSchema, 'Validation failed or malformed JSON'),
  notFound: json(errorResponseSchema, 'Todo not found'),
  tabNotFound: json(errorResponseSchema, 'Tab not found'),
  conflict: json(errorResponseSchema, 'The todo list changed since it was loaded'),
  server: json(errorResponseSchema, 'Unexpected server error'),
};

module.exports = { registry, json, errorResponses };
