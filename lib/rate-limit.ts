import { RateLimiterPrisma } from 'rate-limiter-flexible';
import prisma from '@/lib/prisma';

const rateLimiter = new RateLimiterPrisma({
  storeClient: prisma,
  points: 10, // Number of points
  duration: 1, // Per second
  tableName: 'RateLimiterFlexible', // Must match the model name in schema (case sensitive usually, but Prisma maps it)
  // Check docs: RateLimiterPrisma expects 'RateLimiterFlexible' if that's the model name.
});

export const rateLimit = async (key: string, points: number = 5, duration: number = 60) => {
    try {
        await rateLimiter.consume(key, 1); // Consume 1 point
        return { success: true };
    } catch {
        return { success: false };
    }
};

// Advanced rate limiter wrapper for use in API routes/Actions
export const checkRateLimit = async (identifier: string) => {
    try {
        await rateLimiter.consume(identifier);
        return true;
    } catch {
        return false;
    }
}
