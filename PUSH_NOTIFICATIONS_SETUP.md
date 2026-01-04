# Web Push Notifications Setup Guide

## Prerequisites

You need to create a Firebase project and obtain the necessary credentials. Follow these steps:

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

### 2. Enable Cloud Messaging

1. In your Firebase project, go to **Project Settings** (gear icon)
2. Navigate to the **Cloud Messaging** tab
3. Under **Web Push certificates**, click **Generate key pair**
4. Copy the **VAPID key** (you'll need this for `.env`)

### 3. Get Firebase Configuration

1. In **Project Settings**, scroll to **Your apps**
2. Click the **Web** icon (`</>`) to add a web app
3. Register your app with a nickname (e.g., "Job AI Web")
4. Copy the Firebase configuration object

### 4. Get Service Account (for server-side)

1. In **Project Settings**, go to **Service accounts** tab
2. Click **Generate new private key**
3. Download the JSON file
4. **Important**: Keep this file secure and never commit it to version control

## Environment Variables

Add these to your `.env` file:

```env
# Firebase Cloud Messaging - Client Side
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here

# Firebase Admin - Server Side
# Paste the entire contents of your service account JSON file as a single line
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

> [!IMPORTANT]
> The service worker automatically fetches the Firebase config from your environment variables via the `/api/firebase-config` endpoint. You don't need to manually update the service worker file - just set the environment variables and it will work!

## Database Migration

Run the Prisma migration to create the `PushSubscription` table:

```bash
npx prisma db push
# or
npx prisma migrate dev --name add_push_subscriptions
```

Then regenerate the Prisma client:

```bash
npx prisma generate
```

## Install Firebase Admin SDK

The server-side push notification functionality requires Firebase Admin SDK:

```bash
yarn add firebase-admin
```

## Testing the Implementation

### 1. Test Permission Request

1. Navigate to your app's settings or notification preferences page
2. Click the "Enable Notifications" button
3. Allow notifications when prompted by the browser
4. Verify the subscription is saved in the database

### 2. Test Admin Sending Notifications

As an admin user:
1. Go to the admin dashboard
2. Find a user with active push subscriptions
3. Use the "Send Job Notifications" feature
4. The user should receive a notification with their top 3 job matches

### 3. Test User-to-Admin Messaging

As a regular user:
1. Use the "Contact Admin" or messaging feature
2. Send a message
3. Admin users with push notifications enabled should receive it

## Troubleshooting

### Notifications not appearing

- **Check browser permissions**: Ensure notifications are allowed in browser settings
- **HTTPS required**: Push notifications only work on HTTPS (or localhost for development)
- **Service worker registration**: Check browser console for service worker errors
- **Firebase config**: Verify all environment variables are set correctly

### Invalid token errors

- The system automatically cleans up invalid tokens
- This is normal when users clear browser data or revoke permissions

### CORS errors

- Ensure your domain is added to Firebase's authorized domains
- Go to Firebase Console → Authentication → Settings → Authorized domains

## Security Considerations

1. **Never expose service account JSON** in client-side code
2. **Validate user permissions** before sending notifications
3. **Rate limit** notification sending to prevent abuse
4. **Sanitize user input** in notification content
5. **Use HTTPS** in production

## Browser Compatibility

Push notifications are supported in:
- Chrome 50+
- Firefox 44+
- Edge 17+
- Safari 16+ (macOS 13+, iOS 16.4+)

## Next Steps

1. Add the `PushNotificationManager` component to your user settings page
2. Create an admin UI for sending notifications
3. Implement notification preferences (allow users to choose what to be notified about)
4. Add analytics to track notification engagement
