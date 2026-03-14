import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { testConnection, closePool } from './config/database';
import { cleanupExpiredTokens } from './modules/auth/auth.repository';

// ============================================================
// Server Entry Point
// ============================================================

async function startServer(): Promise<void> {
    // 1. Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
        logger.error('Failed to connect to database. Exiting.');
        process.exit(1);
    }

    // 2. Start listening
    const server = app.listen(env.PORT, () => {
        logger.info(`🚀 Tassa API server started`, {
            port: env.PORT,
            environment: env.NODE_ENV,
            apiVersion: env.API_VERSION,
            url: `http://localhost:${env.PORT}`,
            healthCheck: `http://localhost:${env.PORT}/health`,
        });
    });

    // M5: Set server timeouts to prevent indefinite hanging
    server.timeout = 120000;         // 2 min max for any request
    server.keepAliveTimeout = 65000; // 65s (must be > ALB idle timeout of 60s)

    // ---- B10: Scheduled cleanup of expired/revoked refresh tokens ----
    const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
    const cleanupTimer: ReturnType<typeof setInterval> = setInterval(async () => {
        try {
            const deleted = await cleanupExpiredTokens();
            if (deleted > 0) {
                logger.info('Refresh token cleanup completed', { deletedCount: deleted });
            }
        } catch (err) {
            logger.error('Refresh token cleanup failed', {
                error: err instanceof Error ? err.message : 'Unknown',
            });
        }
    }, CLEANUP_INTERVAL_MS);

    // Run initial cleanup 1 minute after startup
    setTimeout(async () => {
        try {
            const deleted = await cleanupExpiredTokens();
            logger.info('Initial refresh token cleanup', { deletedCount: deleted });
        } catch (err) {
            logger.error('Initial token cleanup failed', {
                error: err instanceof Error ? err.message : 'Unknown',
            });
        }
    }, 60 * 1000);

    // ---- Graceful Shutdown ----
    const gracefulShutdown = async (signal: string) => {
        logger.info(`${signal} received. Starting graceful shutdown...`);

        // Stop accepting new connections
        server.close(async () => {
            logger.info('HTTP server closed');

            // Stop token cleanup timer
            clearInterval(cleanupTimer);

            // Close database pool
            await closePool();

            logger.info('Graceful shutdown complete');
            process.exit(0);
        });

        // Force shutdown after 30 seconds
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // ---- Unhandled Errors ----
    process.on('unhandledRejection', (reason: unknown) => {
        logger.error('Unhandled Promise Rejection', {
            reason: reason instanceof Error ? reason.message : reason,
            stack: reason instanceof Error ? reason.stack : undefined,
        });
    });

    process.on('uncaughtException', (err: Error) => {
        logger.error('Uncaught Exception', {
            message: err.message,
            stack: err.stack,
        });
        // Uncaught exceptions are fatal — shut down
        process.exit(1);
    });
}

startServer();
