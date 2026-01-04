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
 */
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received FCM background message:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'Job AI';
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || '',
        icon: '/logo.png',
        badge: '/logo.png',
        data: payload.data,
        tag: 'job-alert',
        requireInteraction: true,
        renotify: true,
        silent: false,
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * RAW PUSH LISTENER (For Debugging & DevTools "Push" button)
 * If you click "Push" in DevTools, this will trigger even if FCM doesn't.
 */
self.addEventListener('push', (event) => {
    console.log('[firebase-messaging-sw.js] Raw Push Event received!');

    // Attempt to parse data if possible
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (e) {
        data = { body: event.data ? event.data.text() : 'No data' };
    }

    const title = data.title || 'Diagnostic Push';
    const options = {
        body: data.body || 'The Service Worker received a push event.',
        icon: '/logo.png',
        requireInteraction: true,
        tag: 'diagnostic',
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
            .then(() => console.log('✅ Diagnostic notification displayed!'))
            .catch(err => console.error('❌ Diagnostic notification failed:', err))
    );
});

/**
 * Handle notification click
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) return clients.openWindow(urlToOpen);
            })
    );
});
