'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegister Component
 * 
 * Registers the service worker globally to ensure it's active even before
 * the user subscribes to notifications. This improves reliability for handling
 * background events and ensures the SW is ready when permission is eventually granted.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/firebase-messaging-sw.js')
          .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch((err) => {
            console.error('Service Worker registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}
