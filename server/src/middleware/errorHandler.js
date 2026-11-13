const AppError = require('../utils/AppError');

// Catch-all for requests that matched no route.
function notFound(req, res, next) {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Centralized error handler. Express recognises it by its 4 arguments.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const isProduction = process.env.NODE_ENV === 'production';

  let statusCode = 500;
  let message = 'Internal server error';
  let details = [];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.type === 'entity.parse.failed') {
    // Thrown by express.json() for malformed JSON
    statusCode = 400;
    message = 'Malformed JSON in request body';
  } else if (err.expose && err.status >= 400 && err.status < 500) {
    // Other client errors from body-parser (e.g. 413 payload too large)
    statusCode = err.status;
    message = err.message;
  }

  if (statusCode >= 500) {
    // Full error (stack, SQL error codes, ...) is always logged server-side.
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  const body = {
    success: false,
    error: { message, details },
  };

  // Outside production, expose the underlying error to speed up debugging.
  if (!isProduction && statusCode >= 500) {
    body.error.debug = {
      message: err.message,
      code: err.code,
      stack: err.stack,
    };
  }

  res.status(statusCode).json(body);
}

module.exports = { notFound, errorHandler };
