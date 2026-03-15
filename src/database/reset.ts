import { query, closePool } from '../config/database';
import { logger } from '../config/logger';
import { execSync } from 'child_process';
import path from 'path';

// ============================================================
// Database Reset Script
// ============================================================
// Drops ALL user-created schema objects (tables, types, sequences,
// functions) in the public schema, then re-runs migrations and seed.
//
// USE WITH CAUTION — this destroys all data!
// Run: npm run db:reset

async function reset(): Promise<void> {
    logger.info('🔄 Starting database reset...');

    // Use DROP SCHEMA CASCADE + recreate — cleanest approach
    // This drops everything including types, functions, tables, sequences
    // but NOT extensions (they're reinstalled by migrations with IF NOT EXISTS)
    await query(`DROP SCHEMA public CASCADE`);
    await query(`CREATE SCHEMA public`);
    await query(`GRANT ALL ON SCHEMA public TO public`);

    logger.info('✅ Schema dropped and recreated');

    // Close pool before running child processes
    await closePool();

    // Re-run migrations
    logger.info('🔄 Running migrations...');
    const projectRoot = path.resolve(__dirname, '..', '..');
    execSync('npx tsx src/database/migrate.ts', { cwd: projectRoot, stdio: 'inherit' });

    // Re-run seed
    logger.info('🔄 Running seed...');
    execSync('npx tsx src/database/seed.ts', { cwd: projectRoot, stdio: 'inherit' });

    logger.info('✅ Database reset complete!');
}

reset()
    .then(() => process.exit(0))
    .catch((err) => {
        logger.error('Database reset failed', { error: err instanceof Error ? err.message : err });
        process.exit(1);
    });
