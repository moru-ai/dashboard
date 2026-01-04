import { SUPABASE_AUTH_HEADERS } from '@/configs/api'
import { infra } from '@/lib/clients/api'
import { l } from '@/lib/clients/logger/logger'
import { supabaseAdmin } from '@/lib/clients/supabase/admin'
import { TRPCError } from '@trpc/server'
import { apiError } from '../errors'
import {
  ListedSandboxRunDTO,
  mapDatabaseRunToListedSandboxRunDTO,
  RawSandboxRunDB,
  RunningSandboxRunStatusDTO,
  SandboxRunDetailsDTO,
  SandboxRunStatus,
} from '../models/sandbox-runs.models'

// Note: sandbox_runs table exists in the database but may not be in the
// generated Supabase types yet. We use 'any' to bypass type checking for now.
// TODO: Regenerate Supabase types to include sandbox_runs table
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sandboxRunsFrom = () => supabaseAdmin.from('sandbox_runs' as any) as any

// List runs

interface ListRunsOptions {
  statuses?: SandboxRunStatus[]
  search?: string
  limit?: number
  cursor?: string
}

interface ListRunsResult {
  data: ListedSandboxRunDTO[]
  nextCursor: string | null
}

async function listRuns(
  teamId: string,
  options: ListRunsOptions = {}
): Promise<ListRunsResult> {
  const limit = options.limit ?? 50

  // Query 1: Get sandbox runs
  let query = sandboxRunsFrom()
    .select(
      'id, sandbox_id, template_id, status, end_reason, created_at, ended_at'
    )
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  // Filter by status
  if (options.statuses && options.statuses.length > 0) {
    query = query.in('status', options.statuses)
  }

  // Search by sandbox_id or template_id
  if (options.search) {
    query = query.or(
      `sandbox_id.ilike.%${options.search}%,template_id.ilike.%${options.search}%`
    )
  }

  // Cursor pagination
  if (options.cursor) {
    query = query.lt('created_at', options.cursor)
  }

  query = query.limit(limit + 1)

  const { data: runs, error } = await query

  if (error) {
    l.error(
      {
        key: 'repositories:sandbox-runs:list:supabase_error',
        error: error,
        team_id: teamId,
      },
      `failed to query sandbox_runs: ${error?.message || 'Unknown error'}`
    )
    throw error
  }

  if (!runs || runs.length === 0) {
    return {
      data: [],
      nextCursor: null,
    }
  }

  const hasMore = runs.length > limit
  const trimmedRuns = hasMore ? runs.slice(0, limit) : runs

  // Query 2: Get template aliases for unique template_ids
  const templateIds = [
    ...new Set(
      (trimmedRuns as RawSandboxRunDB[]).map(
        (r: RawSandboxRunDB) => r.template_id
      )
    ),
  ]
  const { data: aliases } = await supabaseAdmin
    .from('env_aliases')
    .select('env_id, alias')
    .in('env_id', templateIds)

  const aliasMap = new Map(aliases?.map((a) => [a.env_id, a.alias]) ?? [])

  // Map to DTO with template alias
  const runsWithAlias = (trimmedRuns as RawSandboxRunDB[]).map(
    (run: RawSandboxRunDB) =>
      mapDatabaseRunToListedSandboxRunDTO(
        run,
        aliasMap.get(run.template_id) ?? null
      )
  )

  return {
    data: runsWithAlias,
    nextCursor: hasMore
      ? trimmedRuns[trimmedRuns.length - 1]!.created_at
      : null,
  }
}

// Get running statuses

async function getRunningStatuses(
  teamId: string,
  sandboxIds: string[]
): Promise<RunningSandboxRunStatusDTO[]> {
  if (sandboxIds.length === 0) {
    return []
  }

  const { data, error } = await sandboxRunsFrom()
    .select('sandbox_id, status, end_reason, ended_at')
    .eq('team_id', teamId)
    .in('sandbox_id', sandboxIds)

  if (error) {
    l.error(
      {
        key: 'repositories:sandbox-runs:running_statuses:supabase_error',
        error: error,
        team_id: teamId,
      },
      `failed to query sandbox_runs running statuses: ${error?.message || 'Unknown error'}`
    )
    throw error
  }

  return (
    (data as {
      sandbox_id: string
      status: string
      end_reason: string | null
      ended_at: string | null
    }[]) ?? []
  ).map((run) => ({
    sandboxId: run.sandbox_id,
    status: run.status as SandboxRunStatus,
    endReason: run.end_reason,
    endedAt: run.ended_at ? new Date(run.ended_at).getTime() : null,
  }))
}

// Get run details

async function getRunDetails(
  teamId: string,
  sandboxId: string
): Promise<SandboxRunDetailsDTO> {
  const { data, error } = await sandboxRunsFrom()
    .select(
      'sandbox_id, template_id, status, end_reason, created_at, ended_at, metadata'
    )
    .eq('team_id', teamId)
    .eq('sandbox_id', sandboxId)
    .maybeSingle()

  if (error) {
    l.error(
      {
        key: 'repositories:sandbox-runs:details:supabase_error',
        error: error,
        team_id: teamId,
        sandbox_id: sandboxId,
      },
      `failed to query sandbox_runs details: ${error?.message || 'Unknown error'}`
    )
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: "Run not found or you don't have access to it",
    })
  }

  if (!data) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: "Run not found or you don't have access to it",
    })
  }

  // Get template alias
  const { data: aliasData } = await supabaseAdmin
    .from('env_aliases')
    .select('alias')
    .eq('env_id', data.template_id)
    .maybeSingle()

  return {
    sandboxId: data.sandbox_id,
    template: aliasData?.alias ?? data.template_id,
    templateId: data.template_id,
    status: data.status as SandboxRunStatus,
    endReason: data.end_reason,
    startedAt: new Date(data.created_at).getTime(),
    endedAt: data.ended_at ? new Date(data.ended_at).getTime() : null,
    metadata: data.metadata as Record<string, unknown> | null,
  }
}

// Get sandbox logs

export interface GetSandboxLogsOptions {
  cursor?: number
  limit?: number
  direction?: 'forward' | 'backward'
  eventType?: 'stdout' | 'stderr'
}

async function getSandboxLogs(
  accessToken: string,
  teamId: string,
  sandboxId: string,
  options: GetSandboxLogsOptions = {}
) {
  const result = await infra.GET('/sandboxes/{sandboxID}/logs', {
    params: {
      path: { sandboxID: sandboxId },
      query: {
        cursor: options.cursor,
        limit: options.limit,
        direction: options.direction,
        eventType: options.eventType,
      },
    },
    headers: {
      ...SUPABASE_AUTH_HEADERS(accessToken, teamId),
    },
  })

  if (!result.response.ok || result.error) {
    const status = result.response.status

    l.error(
      {
        key: 'repositories:sandbox-runs:logs:infra_error',
        error: result.error,
        team_id: teamId,
        context: {
          status,
          path: '/sandboxes/{sandboxID}/logs',
          sandbox_id: sandboxId,
        },
      },
      `failed to fetch /sandboxes/{sandboxID}/logs: ${result.error?.message || 'Unknown error'}`
    )

    if (status === 404) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: "Logs not found or you don't have access to them",
      })
    }

    throw apiError(status)
  }

  return result.data
}

export const sandboxRunsRepo = {
  listRuns,
  getRunningStatuses,
  getRunDetails,
  getSandboxLogs,
}
