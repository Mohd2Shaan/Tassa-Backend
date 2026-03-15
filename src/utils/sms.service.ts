import { env } from '../config/env';
import { logger } from '../config/logger';

// ============================================================
// 2Factor SMS OTP Service
// Docs: https://2factor.in/API/V1/
// ============================================================

const BASE_URL = 'https://2factor.in/API/V1';

interface TwoFactorResponse {
    Status: string;
    Details: string;
}

/**
 * Send OTP to a phone number via 2Factor.in API.
 * Returns the session ID needed to verify the OTP later.
 */
export async function sendOtp(phone: string): Promise<string> {
    const apiKey = env.TWOFACTOR_API_KEY;

    // Normalize to 10-digit Indian number — 2Factor expects just digits without country code
    // Handles: +919876543210, 919876543210, 9876543210, 09876543210
    const cleanPhone = phone.replace(/^\+?0?91/, '').replace(/^0/, '').slice(-10);

    if (!apiKey || apiKey === 'your_2factor_api_key') {
        throw new Error('2Factor API key not configured. Set TWOFACTOR_API_KEY in .env');
    }

    // If a template name is configured, append it to force SMS delivery channel
    const templateName = env.TWOFACTOR_TEMPLATE_NAME;
    const url = templateName
        ? `${BASE_URL}/${apiKey}/SMS/${cleanPhone}/AUTOGEN/${templateName}`
        : `${BASE_URL}/${apiKey}/SMS/${cleanPhone}/AUTOGEN`;

    const response = await fetch(url);

    // Handle non-OK HTTP responses
    if (!response.ok) {
        const text = await response.text();
        logger.error('2Factor API HTTP error', { status: response.status, body: text });
        throw new Error(`2Factor API error (HTTP ${response.status})`);
    }

    // Safely parse JSON
    let data: TwoFactorResponse;
    try {
        data = (await response.json()) as TwoFactorResponse;
    } catch {
        const text = await response.text().catch(() => '(empty)');
        logger.error('2Factor API returned non-JSON response', { body: text });
        throw new Error('2Factor API returned an invalid response');
    }

    if (data.Status !== 'Success') {
        logger.error('2Factor OTP send failed', { phone: cleanPhone, details: data.Details });
        throw new Error(`Failed to send OTP: ${data.Details}`);
    }

    logger.info('OTP sent via 2Factor', { phone: cleanPhone, sessionId: data.Details });
    return data.Details; // This is the session ID
}

/**
 * Verify an OTP using the session ID from sendOtp.
 * Returns true if OTP is valid, false otherwise.
 */
export async function verifyOtp(sessionId: string, otp: string): Promise<boolean> {
    const apiKey = env.TWOFACTOR_API_KEY;

    if (!apiKey || apiKey === 'your_2factor_api_key') {
        throw new Error('2Factor API key not configured. Set TWOFACTOR_API_KEY in .env');
    }

    const url = `${BASE_URL}/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`;

    const response = await fetch(url);

    // Handle non-OK HTTP responses
    if (!response.ok) {
        const text = await response.text();
        logger.error('2Factor verify HTTP error', { status: response.status, body: text });
        throw new Error(`2Factor API error (HTTP ${response.status})`);
    }

    // Safely parse JSON
    let data: TwoFactorResponse;
    try {
        data = (await response.json()) as TwoFactorResponse;
    } catch {
        logger.error('2Factor verify returned non-JSON response');
        return false;
    }

    if (data.Status === 'Success' && data.Details === 'OTP Matched') {
        logger.info('OTP verified successfully', { sessionId });
        return true;
    }

    logger.warn('OTP verification failed', { sessionId, details: data.Details });
    return false;
}
