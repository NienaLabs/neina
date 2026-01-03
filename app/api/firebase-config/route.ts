/**
 * API endpoint to serve Firebase configuration to the service worker
 * This keeps credentials in environment variables instead of hardcoded in public files
 */

import { NextResponse } from 'next/server';

export async function GET() {
    // These are public API keys and are safe to expose
    // Firebase security is handled by security rules, not by hiding these keys
    const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // Validate that all required config is present
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId ||
        !firebaseConfig.messagingSenderId || !firebaseConfig.appId) {
        return NextResponse.json(
            { error: 'Firebase configuration is incomplete' },
            { status: 500 }
        );
    }

    return NextResponse.json(firebaseConfig);
}
