import { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { env } from './env';
import { logger } from './logger';

// ============================================================
// PostgreSQL Connection Pool
// ============================================================

const poolConfig: PoolConfig = {
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL ? { rejectUnauthorized: !env.isDev } : false,
    min: env.DB_POOL_MIN,
    max: env.DB_POOL_MAX,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30000,  // H3: 30s max per query to prevent runaway queries
};

const pool = new Pool(poolConfig);

// Log pool errors (don't crash the app)
pool.on('error', (err) => {
    logger.error('Unexpected database pool error', { error: err.message });
});

// H3: Log pool connection events in dev
if (env.isDev) {
    pool.on('connect', () => {
        logger.debug('Pool: new client connected', {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount,
        });
    });
}

/**
 * H3: Expose pool stats for health endpoint monitoring.
 */
export function getPoolStats() {
    return {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingRequests: pool.waitingCount,
    };
}

// ============================================================
// Query helpers
// ============================================================

/**
 * Execute a parameterized query.
 * Always use parameterized queries to prevent SQL injection.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
): Promise<QueryResult<T>> {
    const start = Date.now();
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    if (env.isDev) {
        logger.debug('Executed query', {
            text: text.substring(0, 100),
            duration: `${duration}ms`,
            rows: result.rowCount,
        });
    }

    return result;
}

/**
 * Get a client from the pool for transactions.
 * Always release the client in a finally block.
 *
 * Usage:
 *   const client = await getClient();
 *   try {
 *     await client.query('BEGIN');
 *     // ... queries ...
 *     await client.query('COMMIT');
 *   } catch (err) {
 *     await client.query('ROLLBACK');
 *     throw err;
 *   } finally {
 *     client.release();
 *   }
 */
export async function getClient() {
    const client = await pool.connect();
    return client;
}

/**
 * Execute multiple queries in a transaction.
 * Automatically handles BEGIN, COMMIT, and ROLLBACK.
 */
export async function transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Test the database connection.
 */
export async function testConnection(): Promise<boolean> {
    try {
        const result = await pool.query('SELECT NOW()');
        logger.info('Database connected successfully', {
            timestamp: result.rows[0].now,
            host: env.DB_HOST,
            database: env.DB_NAME,
        });
        return true;
    } catch (err) {
        logger.error('Database connection failed', {
            error: err instanceof Error ? err.message : 'Unknown error',
            host: env.DB_HOST,
            database: env.DB_NAME,
        });
        return false;
    }
}

/**
 * Gracefully close the pool (for shutdown).
 */
export async function closePool(): Promise<void> {
    await pool.end();
    logger.info('Database pool closed');
}

export default pool;
