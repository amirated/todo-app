/**
 * Minimal SQL migration runner.
 *
 * Applies every db/migrations/*.sql file that has not been applied yet, in
 * filename order. Each file runs inside its own transaction together with its
 * bookkeeping row in schema_migrations, so a failing migration leaves the
 * database untouched and can simply be fixed and re-run.
 *
 * Usage: npm run migrate
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name        TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rows } = await client.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((row) => row.name));

    const pending = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql') && !applied.has(file))
      .sort();

    if (pending.length === 0) {
      console.log('Database is up to date.');
      return;
    }

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`Applied ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed and was rolled back: ${error.message}`);
      }
    }
  } finally {
    await client.end();
  }
}

migrate().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
