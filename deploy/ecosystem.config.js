module.exports = {
    apps: [
        {
            name: 'tassa-api',
            script: 'dist/server.js',
            cwd: '/home/deploy/tassa-backend',

            // Cluster mode for multi-core utilization
            instances: 'max',        // or set a fixed number like 2
            exec_mode: 'cluster',

            // Auto-restart on crash
            autorestart: true,
            max_restarts: 10,
            restart_delay: 5000,     // 5s delay between restarts

            // Memory limit — restart if exceeded
            max_memory_restart: '512M',

            // Environment
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },

            // Logs
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            error_file: '/home/deploy/logs/tassa-error.log',
            out_file: '/home/deploy/logs/tassa-out.log',
            merge_logs: true,
            log_type: 'json',

            // Watch (disabled in production)
            watch: false,

            // Graceful shutdown
            kill_timeout: 30000,     // 30s before force kill
            listen_timeout: 10000,   // 10s to start listening
        },
    ],
};
