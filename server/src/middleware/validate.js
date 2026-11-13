const AppError = require('../utils/AppError');

/**
 * Builds middleware that validates the request against a Zod schema shaped
 * like { body?, params?, query? }.
 *
 * On success the parsed (trimmed, unknown-keys-stripped) data is stored on
 * req.validated so controllers never touch raw input. On failure a 400
 * AppError is forwarded to the centralized error handler.
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body ?? {}, // Express 5 leaves req.body undefined when there is no JSON body
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        location: issue.path[0], // 'body' | 'params' | 'query'
        field: issue.path.slice(1).join('.') || null,
        message: issue.message,
      }));

      return next(new AppError(400, 'Validation failed', details));
    }

    // req.query is a read-only getter in Express 5, so validated data lives here.
    req.validated = result.data;
    next();
  };
}

module.exports = validate;
