import { sandboxRunsRepo } from '@/server/api/repositories/sandbox-runs.repository'
import { z } from 'zod'
import { createTRPCRouter } from '../init'
import { SandboxRunStatusSchema } from '../models/sandbox-runs.models'
import { protectedTeamProcedure } from '../procedures'

export const sandboxRunsRouter = createTRPCRouter({
  // QUERIES

  list: protectedTeamProcedure
    .input(
      z.object({
        statuses: z.array(SandboxRunStatusSchema).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { teamId } = ctx
      const { statuses, search, limit, cursor } = input

      return await sandboxRunsRepo.listRuns(teamId, {
        statuses,
        search,
        limit,
        cursor,
      })
    }),

  runningStatuses: protectedTeamProcedure
    .input(
      z.object({
        sandboxIds: z.array(z.string()).max(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const { teamId } = ctx
      const { sandboxIds } = input

      return await sandboxRunsRepo.getRunningStatuses(teamId, sandboxIds)
    }),

  details: protectedTeamProcedure
    .input(
      z.object({
        sandboxId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { teamId } = ctx
      const { sandboxId } = input

      return await sandboxRunsRepo.getRunDetails(teamId, sandboxId)
    }),

  sandboxLogsBackwards: protectedTeamProcedure
    .input(
      z.object({
        sandboxId: z.string(),
        cursor: z.number().optional(),
        eventType: z.enum(['stdout', 'stderr']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { teamId } = ctx
      const { sandboxId, eventType } = input
      let { cursor } = input

      cursor ??= new Date().getTime()

      const logsResponse = await sandboxRunsRepo.getSandboxLogs(
        ctx.session.access_token,
        teamId,
        sandboxId,
        { cursor, direction: 'backward', eventType, limit: 100 }
      )

      const logs =
        logsResponse?.logEntries?.map((log) => ({
          timestampUnix: new Date(log.timestamp).getTime(),
          eventType: log.eventType,
          message: log.message,
        })) ?? []

      const hasMore = logs.length === 100
      const cursorLog = logs[0]
      const nextCursor = hasMore ? (cursorLog?.timestampUnix ?? null) : null

      return {
        logs,
        nextCursor,
      }
    }),

  sandboxLogsForward: protectedTeamProcedure
    .input(
      z.object({
        sandboxId: z.string(),
        cursor: z.number().optional(),
        eventType: z.enum(['stdout', 'stderr']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { teamId } = ctx
      const { sandboxId, eventType } = input
      let { cursor } = input

      cursor ??= new Date().getTime()

      const logsResponse = await sandboxRunsRepo.getSandboxLogs(
        ctx.session.access_token,
        teamId,
        sandboxId,
        { cursor, direction: 'forward', eventType, limit: 100 }
      )

      const logs =
        logsResponse?.logEntries?.map((log) => ({
          timestampUnix: new Date(log.timestamp).getTime(),
          eventType: log.eventType,
          message: log.message,
        })) ?? []

      const newestLog = logs[logs.length - 1]
      const nextCursor = newestLog?.timestampUnix ?? null

      return {
        logs,
        nextCursor,
      }
    }),
})
