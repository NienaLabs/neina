"use client";

import { useEffect, useRef } from 'react';
import { SSEEvent } from '@/lib/events';

/**
 * Hook to listen for server-sent events
 * @param onEvent Callback function triggered when a new event arrives
 */
export function useServerEvents(onEvent: (event: SSEEvent) => void) {
    const onEventRef = useRef(onEvent);

    // Keep the ref updated so we don't restart the effect on every render
    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    useEffect(() => {
        let eventSource: EventSource | null = null;
        let retryCount = 0;
        const maxRetries = 5;

        function connect() {
            console.log("🔗 Attempting to connect to SSE...");
            eventSource = new EventSource('/api/events');

            eventSource.onopen = () => {
                console.log("✅ SSE Connection established");
                retryCount = 0;
            };

            eventSource.onmessage = (message) => {
                try {
                    const payload = JSON.parse(message.data) as SSEEvent;

                    // Ignore PING events in the consumer
                    if (payload.type === 'PING') return;

                    console.log("📨 SSE Message received:", payload);
                    onEventRef.current(payload);
                } catch (error) {
                    console.error("❌ Failed to parse SSE data:", error);
                }
            };

            eventSource.onerror = (error) => {
                console.error("⚠️ SSE Connection Error:", {
                    readyState: eventSource?.readyState,
                    url: eventSource?.url,
                    error
                });
                eventSource?.close();

                // Simple exponential backoff for retries
                if (retryCount < maxRetries) {
                    const delay = Math.pow(2, retryCount) * 1000;
                    retryCount++;
                    console.log(`🔄 Retrying SSE connection in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
                    setTimeout(connect, delay);
                } else {
                    console.error("🛑 Max SSE retries reached. Real-time updates disabled.");
                }
            };
        }

        connect();

        return () => {
            console.log("🔌 Closing SSE connection");
            eventSource?.close();
        };
    }, []);
}
