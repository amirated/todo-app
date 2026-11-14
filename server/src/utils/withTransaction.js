const pool = require('../config/db');

/**
 * Runs `work(client)` inside a transaction on one pooled connection.
 * Commits if it resolves, rolls back and rethrows if it throws, and always
 * releases the connection.
 */
async function withTransaction(work) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = withTransaction;
