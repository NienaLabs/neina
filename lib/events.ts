import EventEmitter from 'events';

/**
 * Global event emitter for Server-Sent Events (SSE)
 */
export const eventEmitter = new EventEmitter();

// Increase max listeners to prevent warnings
eventEmitter.setMaxListeners(100);

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
