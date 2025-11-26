import { createTRPCRouter } from '../init';
import { resumeRouter } from './_resume';
import { jobsRouter } from './_jobs';

export const appRouter = createTRPCRouter({
  resume: resumeRouter,
  jobs: jobsRouter
});
// export type definition of API
export type AppRouter = typeof appRouter;