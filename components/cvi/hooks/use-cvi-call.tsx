'use client';

import { useCallback, useState } from 'react';
import { useDaily } from '@daily-co/daily-react';

export const useCVICall = (): {
  joinCall: (props: { url: string }) => void;
  leaveCall: () => void;
  error: string | null;
} => {
  const daily = useDaily();
  const [error, setError] = useState<string | null>(null);

  const joinCall = useCallback(
    async ({ url }: { url: string }) => {
      if (!daily) {
        setError('Daily.co instance not available');
        return;
      }

      try {
        // First try to join with noise cancellation
        try {
          // Join with noise cancellation settings
          await daily.join({
            url,
            inputSettings: {
              audio: {
                processor: {
                  type: 'noise-cancellation',
                },
              },
            },
          });
          if (process.env.NODE_ENV === 'development') {
            console.log('Successfully joined call with noise cancellation');
          }
        } catch (e) {
          // Silently fall back to default audio if noise cancellation isn't available
          await daily.join({ url });
        }
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to join call';
        console.error('Error joining call:', errorMessage);
        setError(errorMessage);
      }
    },
    [daily]
  );

  const leaveCall = useCallback(() => {
    try {
      daily?.leave();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave call';
      console.error('Error leaving call:', errorMessage);
      setError(errorMessage);
    }
  }, [daily]);

  return { joinCall, leaveCall, error };
};
