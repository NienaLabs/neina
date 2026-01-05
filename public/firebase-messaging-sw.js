/*
* Firebase Service Worker
* This file MUST be in the public/ directory
*/

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Fetch configuration from the API endpoint
importScripts('/api/firebase-sw-env');

// firebaseConfig is defined globally by the importScripts('/api/firebase-sw-env') call
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

console.log('[firebase-messaging-sw.js] Firebase Messaging Initialized.');

/**
 * Handle background messages from FCM
 * This triggers when the app is in the background or closed.
 * CRITICAL: The backend must send "data-only" messages (no 'notification' key)
 * for this to trigger reliably and allow full customization.
 */
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received FCM background message:', payload);

    // Extract data from payload
    // If it's a notification payload, these might be in payload.notification
    // If it's a data payload, everything is in payload.data
    const title = payload.notification?.title || payload.data?.title || 'Niena';
    const body = payload.notification?.body || payload.data?.body || '';
    const icon = payload.data?.icon || payload.notification?.icon || '/niena.png';
    const url = payload.data?.url || '/';
    const tag = payload.data?.tag || 'job-alert';

    const notificationOptions = {
        body: body,
        icon: icon,
        badge: '/niena.png', // Android small icon usually
        data: {
            url: url,
            ...payload.data // Keep all data
        },
        tag: tag, // Use tag to replace existing notifications
        requireInteraction: true, // Keep notification until user interacts
        renotify: true, // Vibrate/sound even if replacing
        silent: false,
    };

    return self.registration.showNotification(title, notificationOptions);
});

/**
 * Handle notification click
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked', event.notification);
    event.notification.close();

    // Get URL from data, default to root
    const urlToOpen = event.notification.data?.url || '/';

    // This looks for all windows (tabs) of this origin
    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then((windowClients) => {
        // Check if there is already a window for this URL or valid app window
        // If we find one, focus it and navigate
        for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            // If we find a window that is open (even if different URL), we can use it
            // Ideally we find exact match, but focusing any app window and navigating is better than opening new one if app is open
            if (client.url === urlToOpen && 'focus' in client) {
                return client.focus();
            }
        }

        // If no window is found (app is closed), open a new one
        if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
        }
    });

    event.waitUntil(promiseChain);
});
