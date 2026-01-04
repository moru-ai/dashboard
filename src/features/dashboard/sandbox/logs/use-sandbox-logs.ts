'use client'

import type { SandboxRunStatus } from '@/server/api/models/sandbox-runs.models'
import { useTRPCClient } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import { useStore } from 'zustand'
import { type SandboxLogEventTypeFilter } from './logs-filter-params'
import {
  createSandboxLogsStore,
  type SandboxLogsStore,
} from './sandbox-logs-store'

const REFETCH_INTERVAL_MS = 1_500
// Maximum number of polls after sandbox stops to drain remaining logs
const MAX_DRAIN_POLLS = 3

interface UseSandboxLogsParams {
  teamIdOrSlug: string
  sandboxId: string
  eventType: SandboxLogEventTypeFilter | null
  sandboxStatus: SandboxRunStatus
}

export function useSandboxLogs({
  teamIdOrSlug,
  sandboxId,
  eventType,
  sandboxStatus,
}: UseSandboxLogsParams) {
  const trpcClient = useTRPCClient()
  const storeRef = useRef<SandboxLogsStore | null>(null)

  if (!storeRef.current) {
    storeRef.current = createSandboxLogsStore()
  }

  const store = storeRef.current

  const logs = useStore(store, (s) => s.logs)
  const isInitialized = useStore(store, (s) => s.isInitialized)
  const hasMoreBackwards = useStore(store, (s) => s.hasMoreBackwards)
  const isLoadingBackwards = useStore(store, (s) => s.isLoadingBackwards)
  const isLoadingForwards = useStore(store, (s) => s.isLoadingForwards)

  useEffect(() => {
    store.getState().init(trpcClient, { teamIdOrSlug, sandboxId }, eventType)
  }, [store, trpcClient, teamIdOrSlug, sandboxId, eventType])

  const isRunning = sandboxStatus === 'running'
  const isDraining = useRef(false)
  const drainPollCount = useRef(0)

  useEffect(() => {
    if (isRunning) {
      isDraining.current = true
      drainPollCount.current = 0
    }
  }, [isRunning])

  const shouldPoll = isInitialized && (isRunning || isDraining.current)

  const { isFetching: isPolling } = useQuery({
    queryKey: ['sandboxLogsForward', teamIdOrSlug, sandboxId, eventType],
    queryFn: async () => {
      const { logsCount } = await store.getState().fetchMoreForwards()

      // Stop draining after no new logs or max polls reached
      if (!isRunning) {
        drainPollCount.current++
        if (logsCount === 0 || drainPollCount.current >= MAX_DRAIN_POLLS) {
          isDraining.current = false
        }
      }

      return { logsCount }
    },
    enabled: shouldPoll,
    refetchInterval: shouldPoll ? REFETCH_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
  })

  const fetchNextPage = useCallback(() => {
    store.getState().fetchMoreBackwards()
  }, [store])

  return {
    logs,
    isInitialized,
    hasNextPage: hasMoreBackwards,
    isFetchingNextPage: isLoadingBackwards,
    isFetching: isLoadingBackwards || isLoadingForwards || isPolling,
    fetchNextPage,
  }
}
