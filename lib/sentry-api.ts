/**
 * Sentry API Client
 * 
 * Fetches error data from Sentry REST API for admin dashboard monitoring.
 * Requires SENTRY_AUTH_TOKEN with event:read permissions.
 */

const SENTRY_ORG = 'jobai-da';
const SENTRY_PROJECT = 'jobai-nextjs';
const SENTRY_BASE_URL = 'https://sentry.io/api/0';

/**
 * Get Sentry issues (errors) for the project
 */
export async function getSentryIssues(limit = 25) {
    const token = process.env.SENTRY_AUTH_TOKEN;

    if (!token) {
        throw new Error('SENTRY_AUTH_TOKEN is not configured');
    }

    try {
        const response = await fetch(
            `${SENTRY_BASE_URL}/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/issues/?limit=${limit}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                next: { revalidate: 60 }, // Cache for 1 minute
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Sentry API Error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`Sentry API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch Sentry issues:', error);
        throw error;
    }
}

/**
 * Get Sentry statistics for the organization
 */
export async function getSentryStats() {
    const token = process.env.SENTRY_AUTH_TOKEN;

    if (!token) {
        throw new Error('SENTRY_AUTH_TOKEN is not configured');
    }

    try {
        // Get stats for last 24 hours
        const end = new Date();
        const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);

        const response = await fetch(
            `${SENTRY_BASE_URL}/organizations/${SENTRY_ORG}/stats_v2/?` +
            `statsPeriod=24h&interval=1h&field=sum(quantity)&groupBy=outcome&category=error`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                next: { revalidate: 300 }, // Cache for 5 minutes
            }
        );

        if (!response.ok) {
            throw new Error(`Sentry API error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch Sentry stats:', error);
        throw error;
    }
}

/**
 * Get details for a specific Sentry issue
 */
export async function getSentryIssueDetails(issueId: string) {
    const token = process.env.SENTRY_AUTH_TOKEN;

    if (!token) {
        throw new Error('SENTRY_AUTH_TOKEN is not configured');
    }

    try {
        const response = await fetch(
            `${SENTRY_BASE_URL}/issues/${issueId}/`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                next: { revalidate: 60 },
            }
        );

        if (!response.ok) {
            throw new Error(`Sentry API error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch Sentry issue details:', error);
        throw error;
    }
}
