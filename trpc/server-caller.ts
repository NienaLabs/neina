import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createCallerFactory } from './init';
import { appRouter } from './routers/_app';

/**
 * Server-side tRPC caller for use in server components
 * This allows you to call tRPC procedures directly on the server
 * without going through HTTP
 */
export async function createCaller() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    return createCallerFactory(appRouter)({
        session,
    });
}
