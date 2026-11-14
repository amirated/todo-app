/**
 * Writes the OpenAPI spec to server/openapi.json.
 *
 * Runs without starting the HTTP server, connecting to the database or
 * reading .env: it only loads Zod schemas and the OpenAPI registry.
 *
 * Usage: npm run generate:openapi [-- <output path>]
 */
const fs = require('fs');
const path = require('path');

const { generateOpenApiDocument } = require('../src/openapi/document');

const outputPath = path.resolve(process.argv[2] ?? path.join(__dirname, '..', 'openapi.json'));
const document = generateOpenApiDocument();

fs.writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);

const operationCount = Object.values(document.paths).reduce(
  (count, operations) => count + Object.keys(operations).length,
  0
);
console.log(`OpenAPI spec written to ${outputPath} (${operationCount} operations)`);
