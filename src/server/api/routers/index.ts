import { createCallerFactory, createTRPCRouter } from '../init'
import { buildsRouter } from './builds'
import { sandboxRunsRouter } from './sandbox-runs'
import { sandboxesRouter } from './sandboxes'
import { templatesRouter } from './templates'

export const trpcAppRouter = createTRPCRouter({
  sandboxes: sandboxesRouter,
  templates: templatesRouter,
  builds: buildsRouter,
  sandboxRuns: sandboxRunsRouter,
})

export type TRPCAppRouter = typeof trpcAppRouter

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createTRPCCaller = createCallerFactory(trpcAppRouter)
