'use client'

import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { TRPCClientError } from '@trpc/client'
import { notFound } from 'next/navigation'
import SandboxLogsHeader from './header'
import SandboxLogs from './logs'

const REFETCH_INTERVAL_MS = 3_000

interface SandboxLogsViewProps {
  teamIdOrSlug: string
  sandboxId: string
}

export default function SandboxLogsView({
  teamIdOrSlug,
  sandboxId,
}: SandboxLogsViewProps) {
  const trpc = useTRPC()

  const {
    data: runDetails,
    error,
    isPending,
  } = useQuery(
    trpc.sandboxRuns.details.queryOptions(
      { teamIdOrSlug, sandboxId },
      {
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: ({ state }) =>
          state.data?.status === 'running' ? 'always' : false,
        refetchInterval: ({ state }) =>
          state.data?.status === 'running' ? REFETCH_INTERVAL_MS : false,
        retry: (failureCount, error) => {
          if (
            error instanceof TRPCClientError &&
            error.data?.code === 'NOT_FOUND'
          ) {
            return false
          }
          return failureCount < 3
        },
      }
    )
  )

  if (error instanceof TRPCClientError && error.data?.code === 'NOT_FOUND') {
    notFound()
  }

  return (
    <div className="h-full min-h-0 flex-1 p-3 md:p-6 flex flex-col gap-6">
      <SandboxLogsHeader
        runDetails={runDetails}
        sandboxId={sandboxId}
        teamIdOrSlug={teamIdOrSlug}
      />
      <SandboxLogs
        runDetails={runDetails}
        teamIdOrSlug={teamIdOrSlug}
        sandboxId={sandboxId}
      />
    </div>
  )
}
