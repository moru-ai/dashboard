'use client'

import { SandboxRunStatus } from '@/server/api/models/sandbox-runs.models'
import { useQueryStates } from 'nuqs'
import { useMemo } from 'react'
import { useDebounceCallback } from 'usehooks-ts'
import { sandboxRunsFilterParams } from './filter-params'

const INITIAL_RUN_STATUSES: SandboxRunStatus[] = [
  'running',
  'paused',
  'stopped',
]

export default function useFilters() {
  const [filters, setFilters] = useQueryStates(sandboxRunsFilterParams, {
    shallow: true,
  })

  const statuses: SandboxRunStatus[] = useMemo(
    () =>
      (filters?.statuses as SandboxRunStatus[] | null) || INITIAL_RUN_STATUSES,
    [filters.statuses]
  )

  const search = filters?.search ?? undefined

  const setStatuses = useDebounceCallback((statuses: SandboxRunStatus[]) => {
    setFilters({ statuses: statuses })
  }, 300)

  const setSearch = useDebounceCallback((search: string) => {
    setFilters({ search })
  }, 300)

  return {
    statuses,
    search,
    setStatuses,
    setSearch,
  }
}
