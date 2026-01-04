'use client'

import { PROTECTED_URLS } from '@/configs/urls'
import { cn } from '@/lib/utils/ui'
import type {
  ListedSandboxRunDTO,
  RunningSandboxRunStatusDTO,
} from '@/server/api/models/sandbox-runs.models'
import { useTRPC } from '@/trpc/client'
import { ArrowDownIcon } from '@/ui/primitives/icons'
import { Loader } from '@/ui/primitives/loader'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/primitives/table'
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import RunsEmpty from './empty'
import {
  BackToTopButton,
  Duration,
  EndReason,
  LoadMoreButton,
  SandboxId,
  StartedAt,
  Status,
  Template,
} from './table-cells'
import useFilters from './use-filters'

const RUNS_REFETCH_INTERVAL_MS = 15_000
const RUNNING_POLL_INTERVAL_MS = 3_000
const MAX_CACHED_PAGES = 3

const COLUMN_WIDTHS = {
  sandboxId: 180,
  status: 96,
  template: 160,
  started: 126,
  duration: 96,
  endReason: 110,
} as const

const RunsTable = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const { teamIdOrSlug } =
    useParams<
      Awaited<PageProps<'/dashboard/[teamIdOrSlug]/sandboxes'>['params']>
    >()
  const { statuses, search } = useFilters()
  const { isFilterRefetching, clearFilterRefetching } = useFilterChangeTracking(
    statuses,
    search
  )

  // Runs list query
  const {
    data: paginatedRuns,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching: isFetchingRuns,
    isPending: isInitialLoad,
    error: runsError,
  } = useInfiniteQuery(
    trpc.sandboxRuns.list.infiniteQueryOptions(
      { teamIdOrSlug, statuses, search },
      {
        getNextPageParam: (page) => page.nextCursor ?? undefined,
        placeholderData: keepPreviousData,
        retry: 3,
        refetchInterval: RUNS_REFETCH_INTERVAL_MS,
        refetchIntervalInBackground: false,
        maxPages: MAX_CACHED_PAGES,
      }
    )
  )

  const runs = useMemo(
    () => paginatedRuns?.pages.flatMap((p) => p.data) ?? [],
    [paginatedRuns]
  )

  const hasScrolledPastInitialPages = paginatedRuns?.pageParams[0] !== undefined

  useEffect(() => {
    if (!isFetchingRuns && isFilterRefetching) {
      clearFilterRefetching()
    }
  }, [isFetchingRuns, isFilterRefetching, clearFilterRefetching])

  // Running sandboxes status polling
  const runningSandboxIds = useMemo(
    () => runs.filter((r) => r.status === 'running').map((r) => r.sandboxId),
    [runs]
  )

  const { data: runningStatusesData } = useQuery(
    trpc.sandboxRuns.runningStatuses.queryOptions(
      { teamIdOrSlug, sandboxIds: runningSandboxIds },
      {
        enabled: runningSandboxIds.length > 0,
        refetchInterval: (query) => {
          const hasRunning = query.state.data?.some(
            (s) => s.status === 'running'
          )
          return hasRunning ? RUNNING_POLL_INTERVAL_MS : false
        },
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: 'always',
        retry: false,
      }
    )
  )

  const runsWithLiveStatus = useMemo(
    () => mergeRunsWithLiveStatuses(runs, runningStatusesData),
    [runs, runningStatusesData]
  )

  // Handlers
  const runsQueryKey = trpc.sandboxRuns.list.infiniteQueryOptions({
    teamIdOrSlug,
    statuses,
    search,
  }).queryKey

  const handleLoadMore = useCallback(() => {
    fetchNextPage()
  }, [fetchNextPage])

  const handleBackToTop = useCallback(() => {
    queryClient.resetQueries({ queryKey: runsQueryKey })
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [queryClient, runsQueryKey])

  // Derived UI state
  const hasData = runsWithLiveStatus.length > 0
  const showLoader = isInitialLoad && !hasData
  const showEmpty = !isInitialLoad && !isFetchingRuns && !hasData
  const showFilterRefetchingOverlay = isFilterRefetching && hasData

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden relative">
      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-auto lg:overflow-x-hidden"
      >
        <Table suppressHydrationWarning>
          <colgroup>
            <col style={colStyle(COLUMN_WIDTHS.status)} />
            <col style={colStyle(COLUMN_WIDTHS.template)} />
            <col style={colStyle(COLUMN_WIDTHS.started)} />
            <col style={colStyle(COLUMN_WIDTHS.duration)} />
            <col style={colStyle(COLUMN_WIDTHS.endReason)} />
            <col style={colStyle(COLUMN_WIDTHS.sandboxId)} />
            <col className="max-lg:min-w-[200px]" />
          </colgroup>

          <TableHeader className="sticky top-0 z-10 bg-bg">
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-1 text-fg">
                  Started
                  <ArrowDownIcon className="size-3" />
                </span>
              </TableHead>
              <TableHead className="text-end">Duration</TableHead>
              <TableHead className="whitespace-nowrap">End Reason</TableHead>
              <TableHead>Sandbox ID</TableHead>
              <th />
            </TableRow>
          </TableHeader>

          <TableBody
            className={
              showFilterRefetchingOverlay ? 'opacity-70 transition-opacity' : ''
            }
          >
            {showLoader && (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="h-[35svh] w-full flex justify-center items-center">
                    <Loader variant="slash" size="lg" />
                  </div>
                </TableCell>
              </TableRow>
            )}

            {showEmpty && (
              <TableRow>
                <TableCell colSpan={7}>
                  <RunsEmpty error={runsError?.message} />
                </TableCell>
              </TableRow>
            )}

            {hasData && (
              <>
                {hasScrolledPastInitialPages && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center max-lg:text-start text-fg-tertiary"
                    >
                      <BackToTopButton onBackToTop={handleBackToTop} />
                    </TableCell>
                  </TableRow>
                )}

                {runsWithLiveStatus.map((run) => {
                  const isRunning = run.status === 'running'

                  return (
                    <TableRow
                      key={run.id}
                      className={cn(
                        'transition-colors cursor-pointer hover:bg-bg-hover',
                        {
                          'bg-bg-1 animate-pulse': isRunning,
                        }
                      )}
                      onClick={() => {
                        router.push(
                          PROTECTED_URLS.SANDBOX_LOGS(
                            teamIdOrSlug,
                            run.sandboxId
                          )
                        )
                      }}
                    >
                      <TableCell
                        className="py-1.5"
                        style={{ maxWidth: COLUMN_WIDTHS.status }}
                      >
                        <Status status={run.status} />
                      </TableCell>
                      <TableCell
                        className="py-1.5 overflow-hidden"
                        style={{ maxWidth: COLUMN_WIDTHS.template }}
                      >
                        <Template
                          template={run.template}
                          templateId={run.templateId}
                        />
                      </TableCell>
                      <TableCell className="py-1.5">
                        <StartedAt timestamp={run.createdAt} />
                      </TableCell>
                      <TableCell className="py-1.5 text-end">
                        <Duration
                          createdAt={run.createdAt}
                          endedAt={run.endedAt}
                          isRunning={isRunning}
                        />
                      </TableCell>
                      <TableCell
                        className="py-1.5"
                        style={{ maxWidth: COLUMN_WIDTHS.endReason }}
                      >
                        <EndReason endReason={run.endReason} />
                      </TableCell>
                      <TableCell
                        className="py-1.5 overflow-hidden"
                        style={{ maxWidth: COLUMN_WIDTHS.sandboxId }}
                      >
                        <SandboxId id={run.sandboxId} />
                      </TableCell>
                      <TableCell className="py-1.5 w-full" />
                    </TableRow>
                  )
                })}

                {hasNextPage && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center max-lg:text-start text-fg-tertiary"
                    >
                      <LoadMoreButton
                        isLoading={isFetchingNextPage}
                        onLoadMore={handleLoadMore}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default RunsTable

function colStyle(width: number) {
  return { width, minWidth: width, maxWidth: width }
}

function useFilterChangeTracking(
  statuses: string[],
  search: string | undefined
) {
  const [isFilterRefetching, setIsFilterRefetching] = useState(false)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setIsFilterRefetching(true)
  }, [statuses, search])

  const clearFilterRefetching = useCallback(() => {
    setIsFilterRefetching(false)
  }, [])

  return { isFilterRefetching, clearFilterRefetching }
}

function mergeRunsWithLiveStatuses(
  runs: ListedSandboxRunDTO[],
  runningStatusesData: RunningSandboxRunStatusDTO[] | undefined
): ListedSandboxRunDTO[] {
  if (!runningStatusesData || runningStatusesData.length === 0) return runs

  const statusMap = new Map(runningStatusesData.map((s) => [s.sandboxId, s]))

  return runs.map((run) => {
    const updated = statusMap.get(run.sandboxId)
    if (updated) {
      return {
        ...run,
        status: updated.status,
        endedAt: updated.endedAt,
        endReason: updated.endReason,
      }
    }
    return run
  })
}
