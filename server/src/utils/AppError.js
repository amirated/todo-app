/**
 * An expected, client-facing error (404, 400, ...).
 * Its message is safe to send to the client; anything that is NOT an
 * AppError is treated as an unexpected 500 by the error handler.
 */
class AppError extends Error {
  constructor(statusCode, message, details = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = AppError;
