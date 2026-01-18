import jwt from 'jsonwebtoken';

/**
 * Generates a JWT signature for Duix SDK initialization.
 * The signature is used to authenticate the H5 SDK on the client side.
 * 
 * @param appId - Duix Application ID
 * @param appKey - Duix Application Secret Key
 * @param userId - Optional unique user identifier
 * @param expiresIn - Token validity duration (default 30 minutes)
 * @returns JWT signature string
 */
export function generateDuixSign(appId: string, appKey: string, userId: string = 'guest', expiresIn: any = '30m'): string {
    if (!appId || !appKey) {
        throw new Error('DUIX_API_ID or DUIX_API_KEY is missing');
    }

    const timestamp = Math.floor(Date.now() / 1000);

    return jwt.sign(
        {
            appId,
            userId,
            timestamp
        },
        appKey,
        {
            algorithm: 'HS256',
            expiresIn
        }
    );
}

/**
 * Closes a Duix session via the REST API.
 * 
 * @param sessionId - The session ID to close
 * @returns Promise resolving to the API response
 */
export async function closeDuixSession(sessionId: string) {
    const API_KEY = process.env.DUIX_API_KEY;
    const API_URL = (process.env.DUIX_API_URL || 'https://api.duix.ai/duix-openapi-v2/sdk/v2').replace(/\/$/, '');

    if (!API_KEY) {
        throw new Error('DUIX_API_KEY is not configured');
    }

    const response = await fetch(`${API_URL}/closeSession?sessionId=${sessionId}`, {
        method: 'GET',
        headers: {
            'token': API_KEY,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to close Duix session: ${response.status} ${errorText}`);
    }

    return response.json();
}

/**
 * Gets the status of an active Duix session.
 * 
 * @param appId - Duix Application ID
 * @returns Promise resolving to the concurrent sessions list
 */
export async function getDuixSessions(appId: string) {
    const API_KEY = process.env.DUIX_API_KEY;
    const API_URL = (process.env.DUIX_API_URL || 'https://api.duix.ai/duix-openapi-v2/sdk/v2').replace(/\/$/, '');

    if (!API_KEY) {
        throw new Error('DUIX_API_KEY is not configured');
    }

    const response = await fetch(`${API_URL}/getconcurrentList?appId=${appId}`, {
        method: 'GET',
        headers: {
            'token': API_KEY,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch Duix sessions: ${response.status} ${errorText}`);
    }

    return response.json();
}
