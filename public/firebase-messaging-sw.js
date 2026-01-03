// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Fetch Firebase config from the server
// This is safer than hardcoding credentials in a public file
self.addEventListener('install', (event) => {
    console.log('[firebase-messaging-sw.js] Service worker installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[firebase-messaging-sw.js] Service worker activating...');
    event.waitUntil(clients.claim());
});

// Initialize Firebase with config from environment
// Note: These are public API keys and are safe to expose
// The actual security is handled by Firebase security rules
fetch('/api/firebase-config')
    .then(response => response.json())
    .then(config => {
        firebase.initializeApp(config);
        const messaging = firebase.messaging();

        // Handle background messages
        messaging.onBackgroundMessage((payload) => {
            console.log('[firebase-messaging-sw.js] Received background message ', payload);

            // If the payload has a 'notification' property, the browser usually displays it automatically.
            // However, if we want to customize it or if it's a data-only message, we do it here.

            const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
            const notificationOptions = {
                body: payload.notification?.body || payload.data?.body || '',
                icon: payload.notification?.icon || payload.data?.icon || '/logo.png',
                image: payload.notification?.image || payload.data?.image,
                badge: '/logo.png',
                data: payload.data,
                tag: payload.data?.tag || 'default',
                requireInteraction: false,
            };

            return self.registration.showNotification(notificationTitle, notificationOptions);
        });
    })
    .catch(error => {
        console.error('[firebase-messaging-sw.js] Failed to initialize Firebase:', error);
    });

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click received.');

    event.notification.close();

    // Get the URL from notification data or default to home
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window open
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If not, open a new window
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});
