import EventEmitter from 'events';

/**
 * Global event emitter for Server-Sent Events (SSE).
 * Cached on globalThis to survive Next.js dev-mode hot module reloads,
 * ensuring the SSE route and Inngest handlers always share the same instance.
 */
const globalForEvents = globalThis as unknown as { sseEventEmitter?: EventEmitter };

export const eventEmitter = globalForEvents.sseEventEmitter ??= (() => {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(100);
    return emitter;
})();

/**
 * Event Types for SSE
 */
export type SSEEvent =
    | {
        type: 'INITIAL_STATE'; data: {
            pushSubscription: { isSubscribed: boolean; deviceCount: number };
            notifications: { unreadCount: number; latest: any[] };
        }
    }
    | { type: 'INTERVIEW_READY'; data: { interviewId: string } }
    | { type: 'RESUME_READY'; data: { resumeId: string } }
    | { type: 'TAILORED_RESUME_READY'; data: { resumeId: string; action?: string } }
    | { type: 'COVER_LETTER_READY'; data: { resumeId: string } }
    | { type: 'RESUME_FAILED'; data: { resumeId: string } }
    | { type: 'TAILORED_RESUME_FAILED'; data: { resumeId: string; action?: string } }
    | {
        type: 'NEW_NOTIFICATION'; data: {
            notification?: any; // Full notification object (optional for backward compatibility)
            unreadCount?: number; // Updated count (optional if we want client to just signal "something new")
        }
    }
    | { type: 'NOTIFICATION_READ'; data: { notificationId: string } }
    | { type: 'NOTIFICATION_DELETED'; data: { notificationId: string } }
    | { type: 'ALL_NOTIFICATIONS_READ'; data: {} }
    | { type: 'PUSH_SUBSCRIPTION_UPDATE'; data: { isSubscribed: boolean; deviceCount: number } }
    | { type: 'ITEM_REGENERATED_READY'; data: { itemId: string; resumeId: string; newBullets: string[]; changeSummary?: string } }
    | { type: 'ITEM_REGENERATED_FAILED'; data: { itemId: string; resumeId: string; error: string } }
    | { type: 'SKILLS_REGENERATED_READY'; data: { resumeId: string; newSkills: string[]; changeSummary?: string } }
    | { type: 'SKILLS_REGENERATED_FAILED'; data: { resumeId: string; error: string } }
    | { type: 'OUTREACH_MESSAGE_READY'; data: { message: string, resumeId: string } }
    | { type: 'OUTREACH_MESSAGE_FAILED'; data: { resumeId: string; error: string } }
    | { type: 'PING'; data: { timestamp: number } };

/**
 * Emit an event to a specific user
 */
export function emitUserEvent(userId: string, event: SSEEvent) {
    eventEmitter.emit(`user:${userId}`, event);
}

/**
 * Broadcast an event to all connected users
 */
export function broadcastEvent(event: SSEEvent) {
    eventEmitter.emit('broadcast', event);
}
