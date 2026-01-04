import * as admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK for server-side operations
 */
function initializeFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccount) {
        console.warn('Firebase service account not configured. Push notifications will not work.');
        return null;
    }

    try {
        const credentials = JSON.parse(serviceAccount);

        return admin.initializeApp({
            credential: admin.credential.cert(credentials),
        });
    } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
        return null;
    }
}

const firebaseAdmin = initializeFirebaseAdmin();

/**
 * Send push notification to a specific device
 * @param token FCM device token
 * @param notification Notification payload
 * @param data Optional data payload
 */
export async function sendPushNotification(
    token: string,
    notification: {
        title: string;
        body: string;
        icon?: string;
        image?: string;
    },
    data?: Record<string, string>
) {
    if (!firebaseAdmin) {
        throw new Error('Firebase Admin not initialized');
    }

    try {
        // Extract extra fields found in our extended notification type
        const { icon, image, ...standardNotification } = notification;

        // Construct proper FCM payload
        const message: admin.messaging.Message = {
            token,
            notification: {
                title: standardNotification.title,
                body: standardNotification.body,
                imageUrl: image, // FCM uses imageUrl for the main image
            },
            data,
            webpush: {
                notification: {
                    icon,
                    image,
                },
                fcmOptions: {
                    link: data?.url || '/',
                },
            },
        };

        const response = await admin.messaging().send(message);
        return { success: true, messageId: response };
    } catch (error: any) {
        console.error('Error sending push notification:', error);

        // Handle invalid tokens
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
            return { success: false, invalidToken: true, error: error.message };
        }

        return { success: false, error: error.message };
    }
}

/**
 * Send push notifications to multiple devices
 * @param tokens Array of FCM device tokens
 * @param notification Notification payload
 * @param data Optional data payload
 */
export async function sendMulticastPushNotification(
    tokens: string[],
    notification: {
        title: string;
        body: string;
        icon?: string;
        image?: string;
    },
    data?: Record<string, string>
) {
    if (!firebaseAdmin) {
        throw new Error('Firebase Admin not initialized');
    }

    if (tokens.length === 0) {
        return { success: true, successCount: 0, failureCount: 0 };
    }

    try {
        // Extract extra fields
        const { icon, image, ...standardNotification } = notification;

        const message: admin.messaging.MulticastMessage = {
            tokens,
            notification: {
                title: standardNotification.title,
                body: standardNotification.body,
                imageUrl: image,
            },
            data,
            webpush: {
                notification: {
                    icon,
                    image,
                },
                fcmOptions: {
                    link: data?.url || '/',
                },
            },
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        return {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount,
            responses: response.responses,
        };
    } catch (error: any) {
        console.error('Error sending multicast push notification:', error);
        return { success: false, error: error.message };
    }
}

export { firebaseAdmin };
