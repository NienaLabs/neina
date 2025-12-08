import { createTRPCRouter } from '../init';
import { resumeRouter } from './_resume';
import { jobsRouter } from './_jobs';
import { adminRouter } from './_admin';
import { notificationsRouter } from './_notifications';

export const appRouter = createTRPCRouter({
  resume: resumeRouter,
  jobs: jobsRouter,
  admin: adminRouter,
  notifications: notificationsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;