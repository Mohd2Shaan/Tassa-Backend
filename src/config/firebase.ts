import admin from 'firebase-admin';
import fs from 'fs';
import { env } from './env';
import { logger } from './logger';
import path from 'path';

// ============================================================
// Firebase Admin SDK Initialization
// ============================================================

let firebaseApp: admin.app.App | null = null;

function initializeFirebase(): admin.app.App {
    if (firebaseApp) return firebaseApp;

    try {
        const serviceAccountPath = env.FIREBASE_SERVICE_ACCOUNT_PATH;

        if (serviceAccountPath) {
            // Resolve the path to the service account file
            const resolvedPath = path.isAbsolute(serviceAccountPath)
                ? serviceAccountPath
                : path.resolve(__dirname, '../../', serviceAccountPath);

            if (fs.existsSync(resolvedPath)) {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const serviceAccount = require(resolvedPath);

                firebaseApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
                });
            } else {
                logger.warn(`Firebase service account file not found at: ${resolvedPath}`);
                logger.warn('Falling back to project-ID-only initialization. Download the service account JSON from Firebase Console.');
            }
        }

        // Fallback: use project ID only (or placeholder)
        if (!firebaseApp && env.FIREBASE_PROJECT_ID) {
            // Use Application Default Credentials (GCP environments)
            firebaseApp = admin.initializeApp({
                projectId: env.FIREBASE_PROJECT_ID,
            });
        }

        if (!firebaseApp) {
            // Development fallback — Firebase won't work, but the app won't crash
            logger.warn('Firebase not configured. Auth endpoints will not work.');
            firebaseApp = admin.initializeApp({
                projectId: 'tassa-dev-placeholder',
            });
        }

        logger.info('Firebase Admin SDK initialized', {
            projectId: firebaseApp.options.projectId,
        });

        return firebaseApp;
    } catch (err) {
        logger.error('Firebase initialization failed', {
            error: err instanceof Error ? err.message : 'Unknown error',
        });
        throw err;
    }
}

// Initialize on import
const app = initializeFirebase();

/**
 * Verify a Firebase ID token (from client after OTP verification).
 * Returns the decoded token with uid, phone_number, etc.
 */
export async function verifyFirebaseIdToken(
    idToken: string,
): Promise<admin.auth.DecodedIdToken> {
    return admin.auth(app).verifyIdToken(idToken);
}

/**
 * Get Firebase Auth instance.
 */
export function getFirebaseAuth(): admin.auth.Auth {
    return admin.auth(app);
}
