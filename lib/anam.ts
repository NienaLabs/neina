/**
 * Anam AI utility for session token generation and API interactions.
 * Strictly follows official Anam documentation for server-side token exchange.
 */

interface AnamSessionTokenResponse {
    sessionToken: string;
}

/**
 * Generates a short-lived session token for the Anam AI client.
 * This should be called from a secure server-side environment.
 */
export async function generateAnamSessionToken(config: {
    personaId?: string;
    avatarId?: string;
    voiceId?: string;
    llmId?: string;
    systemPrompt?: string;
    toolIds?: string[];
}): Promise<string> {
    const API_KEY = process.env.ANAM_API_KEY;
    const API_URL = 'https://api.anam.ai/v1/auth/session-token';

    if (!API_KEY) {
        throw new Error('ANAM_API_KEY is not configured in environment variables');
    }

    const personaConfig: any = {};
    if (config.avatarId) personaConfig.avatarId = config.avatarId;
    if (config.voiceId) personaConfig.voiceId = config.voiceId;
    if (config.llmId) personaConfig.llmId = config.llmId;
    if (config.systemPrompt) personaConfig.systemPrompt = config.systemPrompt;
    if (config.toolIds && config.toolIds.length > 0) personaConfig.toolIds = config.toolIds;

    const body: any = {};
    if (config.personaId) body.personaId = config.personaId;
    if (Object.keys(personaConfig).length > 0) body.personaConfig = personaConfig;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_API === 'true') {
        console.log(`[ANAM] Requesting session token:`, {
            hasPersonaId: !!config.personaId,
            overrides: Object.keys(personaConfig)
        });
    }

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ANAM] Failed to generate session token: ${response.status} ${errorText}`);
        throw new Error(`Failed to generate Anam session token: ${response.status}`);
    }

    const data: AnamSessionTokenResponse = await response.json();
    return data.sessionToken;
}
