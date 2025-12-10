import { createTRPCRouter } from '../init';
import { resumeRouter } from './_resume';
import { jobsRouter } from './_jobs';
import { adminRouter } from './_admin';
import { notificationsRouter } from './_notifications';
import { supportRouter } from './_support';
import { recruiterRouter } from './_recruiter';
import { userRouter } from './_user';

export const appRouter = createTRPCRouter({
  resume: resumeRouter,
  jobs: jobsRouter,
  admin: adminRouter,
  notifications: notificationsRouter,
  support: supportRouter,
  recruiter: recruiterRouter,
  user: userRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;