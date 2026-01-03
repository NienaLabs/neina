import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Get Firebase Cloud Messaging instance
 * @returns Firebase Messaging instance or null if not supported
 */
export const getFirebaseMessaging = async () => {
    try {
        const supported = await isSupported();
        if (!supported) {
            console.warn('Firebase Messaging is not supported in this browser');
            return null;
        }
        return getMessaging(app);
    } catch (error) {
        console.error('Error initializing Firebase Messaging:', error);
        return null;
    }
};

/**
 * Request notification permission and get FCM token
 * @returns FCM token or null
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }

        const messaging = await getFirebaseMessaging();
        if (!messaging) return null;

        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
            console.error('VAPID key not configured');
            return null;
        }

        const token = await getToken(messaging, { vapidKey });
        return token;
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
};

/**
 * Listen for foreground messages
 * @param callback Function to call when message is received
 */
export const onMessageListener = async (callback: (payload: any) => void) => {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return () => { };

    return onMessage(messaging, callback);
};

export { app };
