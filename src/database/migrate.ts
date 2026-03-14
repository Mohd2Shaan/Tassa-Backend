import { query, getClient } from '../config/database';
import { logger } from '../config/logger';
import path from 'path';
import fs from 'fs';

// ============================================================
// Database Migration System
// ============================================================
// Simple, file-based migration system.
// Migrations are SQL files in src/database/migrations/
// Named: 001_create_users.sql, 002_create_restaurants.sql, etc.
// Tracks applied migrations in a `_migrations` table.

const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');

/**
 * Ensure the migrations tracking table exists.
 */
async function ensureMigrationsTable(): Promise<void> {
    await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

/**
 * Get list of applied migration names.
 */
async function getAppliedMigrations(): Promise<string[]> {
    const result = await query<{ name: string }>(
        'SELECT name FROM _migrations ORDER BY id',
    );
    return result.rows.map((row) => row.name);
}

/**
 * Get list of pending migration files.
 */
function getMigrationFiles(): string[] {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
        fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
        return [];
    }
    return fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort(); // Alphabetical sort ensures order by prefix (001_, 002_, etc.)
}

/**
 * Run all pending migrations.
 */
async function runMigrations(): Promise<void> {
    await ensureMigrationsTable();

    const applied = await getAppliedMigrations();
    const files = getMigrationFiles();
    const pending = files.filter((f) => !applied.includes(f));

    if (pending.length === 0) {
        logger.info('No pending migrations');
        return;
    }

    logger.info(`Found ${pending.length} pending migration(s)`);

    for (const file of pending) {
        const filePath = path.join(MIGRATIONS_DIR, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        const client = await getClient();
        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
            await client.query('COMMIT');
            logger.info(`✅ Applied migration: ${file}`);
        } catch (err) {
            await client.query('ROLLBACK');
            logger.error(`❌ Migration failed: ${file}`, {
                error: err instanceof Error ? err.message : err,
            });
            throw err;
        } finally {
            client.release();
        }
    }

    logger.info('All migrations applied successfully');
}

// ---- CLI entry point ----
// Run via: npm run migrate
runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
