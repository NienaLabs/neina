import { createTRPCRouter } from '../init';
import { resumeRouter } from './_resume';
export const appRouter = createTRPCRouter({
  resume:resumeRouter
});
// export type definition of API
export type AppRouter = typeof appRouter;