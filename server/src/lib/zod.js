/**
 * The project's Zod instance.
 *
 * extendZodWithOpenApi() adds the `.openapi()` method to every Zod schema.
 * It must run once, before any schema is defined, so every schema file
 * imports `z` from here instead of from 'zod' directly. CommonJS `require`
 * is synchronous and cached, so this runs exactly once per process.
 */
const { z } = require('zod');
const { extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi');

extendZodWithOpenApi(z);

module.exports = { z };
