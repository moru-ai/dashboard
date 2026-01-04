import { createSearchParamsCache, parseAsStringLiteral } from 'nuqs/server'

export type SandboxLogEventTypeFilter = 'stdout' | 'stderr'

export const logsFilterParams = {
  eventType: parseAsStringLiteral(['stdout', 'stderr'] as const),
}

export const logsFilterParamsCache = createSearchParamsCache(logsFilterParams)
