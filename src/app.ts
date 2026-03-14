import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { requestLogger } from './middlewares/requestLogger';
import { generalLimiter } from './middlewares/rateLimiter';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { sanitizeBody } from './middlewares/sanitizer';
import { ApiResponse } from './utils/apiResponse';
import { getPoolStats } from './config/database';
import { randomUUID } from 'crypto';
import authRoutes from './modules/auth/auth.routes';
import customerRoutes from './modules/customer/customer.routes';
import vendorRoutes from './modules/vendor/vendor.routes';
import deliveryRoutes from './modules/delivery/delivery.routes';
import orderRoutes from './modules/order/order.routes';
import paymentRoutes from './modules/payment/payment.routes';
import notificationRoutes from './modules/notification/notification.routes';
import reviewRoutes from './modules/review/review.routes';
import couponRoutes from './modules/coupon/coupon.routes';
import adminRoutes from './modules/admin/admin.routes';

// ============================================================
// Express Application
// ============================================================

const app = express();

// ---- Security ----
app.use(helmet());                             // Security headers
app.use(cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ---- Parsing ---- (H4: reduced from 10mb to 100kb to prevent memory abuse)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ---- Compression ----
app.use(compression());

// ---- M3: Input sanitization (after parsing, before routes) ----
app.use(sanitizeBody);

// ---- Logging ----
app.use(requestLogger);

// ---- Rate Limiting ----
app.use(generalLimiter);

// ---- M10: Request ID for correlation ----
app.use((req, _res, next) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || randomUUID();
    next();
});

// ---- Health Check (no auth needed) ----
app.get('/health', (_req, res) => {
    const poolStats = getPoolStats();
    ApiResponse.success(res, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.NODE_ENV,
        database: poolStats,
    }, 'Tassa API is running');
});

// ============================================================
// API Routes
// ============================================================
const api = `/api/${env.API_VERSION}`;

app.use(`${api}/auth`, authRoutes);
app.use(`${api}/customers`, customerRoutes);
app.use(`${api}/vendors`, vendorRoutes);
app.use(`${api}/delivery`, deliveryRoutes);
app.use(`${api}/orders`, orderRoutes);
app.use(`${api}/payments`, paymentRoutes);
app.use(`${api}/notifications`, notificationRoutes);
app.use(`${api}/reviews`, reviewRoutes);
app.use(`${api}/coupons`, couponRoutes);
app.use(`${api}/admin`, adminRoutes);

// ---- API info endpoint ----
app.get(`/api/${env.API_VERSION}`, (_req, res) => {
    ApiResponse.success(res, {
        name: 'Tassa Food Delivery API',
        version: env.API_VERSION,
        documentation: '/api/v1/docs',
    }, 'Welcome to Tassa API');
});

// ---- 404 handler ----
app.use(notFoundHandler);

// ---- Global error handler (must be last) ----
app.use(errorHandler);

export default app;
