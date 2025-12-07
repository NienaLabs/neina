import { createTRPCRouter } from '../init';
import { resumeRouter } from './_resume';
import { jobsRouter } from './_jobs';
import { adminRouter } from './_admin';

export const appRouter = createTRPCRouter({
  resume: resumeRouter,
  jobs: jobsRouter,
  admin: adminRouter
});
// export type definition of API
export type AppRouter = typeof appRouter;