// PostgreSQL error codes the controllers translate into client errors.
// https://www.postgresql.org/docs/current/errcodes-appendix.html
const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

const isUniqueViolation = (error) => error?.code === UNIQUE_VIOLATION;
const isForeignKeyViolation = (error) => error?.code === FOREIGN_KEY_VIOLATION;

module.exports = { isUniqueViolation, isForeignKeyViolation };
