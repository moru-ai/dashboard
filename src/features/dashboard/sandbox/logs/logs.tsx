'use client'

import { cn } from '@/lib/utils'
import type { SandboxRunDetailsDTO } from '@/server/api/models/sandbox-runs.models'
import { Button } from '@/ui/primitives/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/ui/primitives/dropdown-menu'
import { ArrowDownIcon, CopyIcon, ListIcon } from '@/ui/primitives/icons'
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
  useVirtualizer,
  VirtualItem,
  Virtualizer,
} from '@tanstack/react-virtual'
import {
  RefObject,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'
import { useClipboard } from '@/lib/hooks/use-clipboard'
import { EventTypeBadge, Message, Timestamp } from './logs-cells'
import { type SandboxLogEventTypeFilter } from './logs-filter-params'
import useLogFilters from './use-log-filters'
import { useSandboxLogs } from './use-sandbox-logs'

// Column width are calculated as max width of the content + padding
const COLUMN_WIDTHS_PX = { timestamp: 176 + 16, eventType: 64 + 16 } as const
const ROW_HEIGHT_PX = 26
const VIRTUAL_OVERSCAN = 16
const SCROLL_LOAD_THRESHOLD_PX = 200
const LOG_RETENTION_DAYS = 7

const EVENT_TYPE_OPTIONS: Array<{
  value: SandboxLogEventTypeFilter
  label: string
}> = [
  { value: 'stdout', label: 'stdout' },
  { value: 'stderr', label: 'stderr' },
]

interface SandboxLogsProps {
  runDetails: SandboxRunDetailsDTO | undefined
  teamIdOrSlug: string
  sandboxId: string
}

export default function SandboxLogs({
  runDetails,
  teamIdOrSlug,
  sandboxId,
}: SandboxLogsProps) {
  'use no memo'

  const { eventType, setEventType } = useLogFilters()

  if (!runDetails) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden relative gap-3">
        <EventTypeFilter
          eventType={eventType}
          onEventTypeChange={setEventType}
        />
        <div className="min-h-0 flex-1 overflow-auto">
          <Table style={{ display: 'grid', minWidth: 'min-content' }}>
            <LogsTableHeader />
            <LoaderBody />
          </Table>
        </div>
      </div>
    )
  }

  return (
    <LogsContent
      runDetails={runDetails}
      teamIdOrSlug={teamIdOrSlug}
      sandboxId={sandboxId}
      eventType={eventType}
      setEventType={setEventType}
    />
  )
}

interface LogsContentProps {
  runDetails: SandboxRunDetailsDTO
  teamIdOrSlug: string
  sandboxId: string
  eventType: SandboxLogEventTypeFilter | null
  setEventType: (eventType: SandboxLogEventTypeFilter | null) => void
}

function LogsContent({
  runDetails,
  teamIdOrSlug,
  sandboxId,
  eventType,
  setEventType,
}: LogsContentProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const { isRefetchingFromFilterChange, onFetchComplete } =
    useFilterRefetchTracking(eventType)

  const {
    logs,
    isInitialized,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    fetchNextPage,
  } = useSandboxLogs({
    teamIdOrSlug,
    sandboxId,
    eventType,
    sandboxStatus: runDetails.status,
  })

  useEffect(() => {
    if (!isFetching && isRefetchingFromFilterChange) {
      onFetchComplete()
    }
  }, [isFetching, isRefetchingFromFilterChange, onFetchComplete])

  const hasLogs = logs.length > 0
  const showLoader = (isFetching || isRefetchingFromFilterChange) && !hasLogs
  const showEmpty = !isFetching && !hasLogs && !isRefetchingFromFilterChange
  const showRefetchOverlay = isRefetchingFromFilterChange && hasLogs

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden relative gap-3">
      <EventTypeFilter eventType={eventType} onEventTypeChange={setEventType} logs={logs} />

      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-auto">
        <Table style={{ display: 'grid', minWidth: 'min-content' }}>
          <LogsTableHeader />

          {showLoader && <LoaderBody />}
          {showEmpty && <EmptyBody />}
          {hasLogs && (
            <VirtualizedLogsBody
              logs={logs}
              scrollContainerRef={scrollContainerRef}
              startedAt={runDetails.startedAt}
              onLoadMore={handleLoadMore}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              showRefetchOverlay={showRefetchOverlay}
              isInitialized={isInitialized}
              eventType={eventType}
            />
          )}
        </Table>
      </div>
    </div>
  )
}

function useFilterRefetchTracking(eventType: SandboxLogEventTypeFilter | null) {
  const [isRefetchingFromFilterChange, setIsRefetching] = useState(false)
  const isInitialRender = useRef(true)

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false
      return
    }
    setIsRefetching(true)
  }, [eventType])

  const onFetchComplete = useCallback(() => setIsRefetching(false), [])

  return { isRefetchingFromFilterChange, onFetchComplete }
}

function LogsTableHeader() {
  return (
    <TableHeader
      className="bg-bg"
      style={{ display: 'grid', position: 'sticky', top: 0, zIndex: 1 }}
    >
      <TableRow style={{ display: 'flex', minWidth: '100%' }}>
        <TableHead
          data-state="selected"
          className="px-0 pr-4"
          style={{ display: 'flex', width: COLUMN_WIDTHS_PX.timestamp }}
        >
          Timestamp <ArrowDownIcon className="size-3 rotate-180" />
        </TableHead>
        <TableHead
          className="px-0 pr-4"
          style={{ display: 'flex', width: COLUMN_WIDTHS_PX.eventType }}
        >
          Type
        </TableHead>
        <TableHead className="px-0" style={{ display: 'flex', flex: 1 }}>
          Message
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}

function LoaderBody() {
  return (
    <TableBody style={{ display: 'grid' }}>
      <TableRow style={{ display: 'flex', minWidth: '100%', marginTop: 8 }}>
        <TableCell className="flex-1">
          <div className="h-[35svh] w-full flex justify-center items-center">
            <Loader variant="slash" size="lg" />
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  )
}

function EmptyBody() {
  return (
    <TableBody style={{ display: 'grid' }}>
      <TableRow style={{ display: 'flex', minWidth: '100%', marginTop: 8 }}>
        <TableCell className="flex-1">
          <div className="h-[35vh] w-full gap-2 relative flex flex-col justify-center items-center p-6">
            <div className="flex items-center gap-2">
              <ListIcon className="size-5" />
              <p className="prose-body-highlight">No logs found</p>
            </div>
            <p className="text-fg-tertiary text-sm">
              Logs are retained for {LOG_RETENTION_DAYS} days.
            </p>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  )
}

interface LogEntry {
  message: string
  eventType: string
  fields?: Record<string, string>
}

interface EventTypeFilterProps {
  eventType: SandboxLogEventTypeFilter | null
  onEventTypeChange: (eventType: SandboxLogEventTypeFilter | null) => void
  logs?: LogEntry[]
}

function EventTypeFilter({
  eventType,
  onEventTypeChange,
  logs,
}: EventTypeFilterProps) {
  const [wasCopied, copy] = useClipboard()
  const selectedLabel = eventType
    ? EVENT_TYPE_OPTIONS.find((o) => o.value === eventType)?.label
    : 'All'

  const handleCopyAll = () => {
    if (!logs || logs.length === 0) return
    const text = logs
      .map((log) => {
        // Format process_start as "$ {command}"
        if (log.eventType === 'process_start') {
          const command = log.fields?.command || log.message
          return `$ ${command}`
        }
        // Format process_end as "exit {code}"
        if (log.eventType === 'process_end' && log.fields?.process_result) {
          try {
            const result = JSON.parse(log.fields.process_result)
            // Field is snake_case from protobuf, defaults to 0 if omitted
            const exitCode = result.exit_code ?? 0
            const exitError = result.error
            return exitError ? `exit ${exitCode} - ${exitError}` : `exit ${exitCode}`
          } catch {
            // Fallback to message
          }
        }
        return log.message
      })
      .join('\n')
    copy(text)
  }

  return (
    <div className="flex w-full min-h-0 justify-between gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="font-sans w-min normal-case prose-body-highlight h-9"
          >
            {eventType && <EventTypeIndicator eventType={eventType} />}
            Type · {selectedLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup
            value={eventType ?? ''}
            onValueChange={(value) =>
              onEventTypeChange((value as SandboxLogEventTypeFilter) || null)
            }
          >
            <DropdownMenuRadioItem value="">All</DropdownMenuRadioItem>
            {EVENT_TYPE_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <EventTypeBadge eventType={option.value} />
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {logs && logs.length > 0 && (
        <Button
          variant="outline"
          className="font-sans w-min normal-case prose-body-highlight h-9"
          onClick={handleCopyAll}
        >
          <CopyIcon className="size-4" />
          {wasCopied ? 'Copied!' : 'Copy all'}
        </Button>
      )}
    </div>
  )
}

function EventTypeIndicator({
  eventType,
}: {
  eventType: SandboxLogEventTypeFilter
}) {
  return (
    <div
      className={cn(
        'size-3.5 rounded-full bg-bg border-[1.5px] border-dashed',
        {
          'border-accent-info-highlight': eventType === 'stdout',
          'border-accent-error-highlight': eventType === 'stderr',
        }
      )}
    />
  )
}

interface SandboxLogDTO {
  timestampUnix: number
  eventType: string
  message: string
  fields?: Record<string, string>
}

interface VirtualizedLogsBodyProps {
  logs: SandboxLogDTO[]
  scrollContainerRef: RefObject<HTMLDivElement | null>
  startedAt: number
  onLoadMore: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  showRefetchOverlay: boolean
  isInitialized: boolean
  eventType: SandboxLogEventTypeFilter | null
}

function VirtualizedLogsBody({
  logs,
  scrollContainerRef,
  startedAt,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
  showRefetchOverlay,
  isInitialized,
  eventType,
}: VirtualizedLogsBodyProps) {
  const tbodyRef = useRef<HTMLTableSectionElement>(null)
  const maxWidthRef = useRef<number>(0)
  const [, forceRerender] = useReducer(() => ({}), {})

  useEffect(() => {
    if (scrollContainerRef.current) forceRerender()
  }, [scrollContainerRef])

  useScrollLoadMore({
    scrollContainerRef,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
  })

  useAutoScrollToBottom({
    scrollContainerRef,
    logsCount: logs.length,
    isInitialized,
    eventType,
  })

  useMaintainScrollOnPrepend({
    scrollContainerRef,
    logsCount: logs.length,
    isFetchingNextPage,
  })

  const showStatusRow = hasNextPage || isFetchingNextPage

  const virtualizer = useVirtualizer({
    count: logs.length + (showStatusRow ? 1 : 0),
    estimateSize: () => ROW_HEIGHT_PX,
    getScrollElement: () => scrollContainerRef.current,
    overscan: VIRTUAL_OVERSCAN,
    paddingStart: 8,
  })

  const containerWidth = scrollContainerRef.current?.clientWidth ?? 0
  const contentWidth = scrollContainerRef.current?.scrollWidth ?? 0
  const SCROLLBAR_BUFFER_PX = 20
  const hasHorizontalOverflow =
    contentWidth > containerWidth + SCROLLBAR_BUFFER_PX

  if (hasHorizontalOverflow && contentWidth > maxWidthRef.current) {
    maxWidthRef.current = contentWidth
  }

  return (
    <TableBody
      ref={tbodyRef}
      className={cn(
        showRefetchOverlay ? 'opacity-70 transition-opacity' : '',
        '[&_tr:last-child]:border-b-0 [&_tr]:border-b-0'
      )}
      style={{
        display: 'grid',
        height: `${virtualizer.getTotalSize()}px`,
        width: hasHorizontalOverflow ? maxWidthRef.current : undefined,
        minWidth: '100%',
        position: 'relative',
      }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const isStatusRow = showStatusRow && virtualRow.index === 0

        if (isStatusRow) {
          return (
            <StatusRow
              key="status-row"
              virtualRow={virtualRow}
              virtualizer={virtualizer}
              isFetchingNextPage={isFetchingNextPage}
            />
          )
        }

        const logIndex = showStatusRow ? virtualRow.index - 1 : virtualRow.index

        return (
          <LogRow
            key={virtualRow.index}
            log={logs[logIndex]!}
            virtualRow={virtualRow}
            virtualizer={virtualizer}
            startedAt={startedAt}
          />
        )
      })}
    </TableBody>
  )
}

interface UseScrollLoadMoreParams {
  scrollContainerRef: RefObject<HTMLDivElement | null>
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
}

function useScrollLoadMore({
  scrollContainerRef,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: UseScrollLoadMoreParams) {
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      if (
        scrollContainer.scrollTop < SCROLL_LOAD_THRESHOLD_PX &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        onLoadMore()
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [scrollContainerRef, hasNextPage, isFetchingNextPage, onLoadMore])
}

interface UseMaintainScrollOnPrependParams {
  scrollContainerRef: RefObject<HTMLDivElement | null>
  logsCount: number
  isFetchingNextPage: boolean
}

function useMaintainScrollOnPrepend({
  scrollContainerRef,
  logsCount,
  isFetchingNextPage,
}: UseMaintainScrollOnPrependParams) {
  const prevLogsCountRef = useRef(logsCount)
  const wasFetchingRef = useRef(false)

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const justFinishedFetching = wasFetchingRef.current && !isFetchingNextPage
    const logsWerePrepended = logsCount > prevLogsCountRef.current

    if (justFinishedFetching && logsWerePrepended) {
      const addedCount = logsCount - prevLogsCountRef.current
      el.scrollTop += addedCount * ROW_HEIGHT_PX
    }

    wasFetchingRef.current = isFetchingNextPage
    prevLogsCountRef.current = logsCount
  }, [scrollContainerRef, logsCount, isFetchingNextPage])
}

interface UseAutoScrollToBottomParams {
  scrollContainerRef: RefObject<HTMLDivElement | null>
  logsCount: number
  isInitialized: boolean
  eventType: SandboxLogEventTypeFilter | null
}

function useAutoScrollToBottom({
  scrollContainerRef,
  logsCount,
  isInitialized,
  eventType,
}: UseAutoScrollToBottomParams) {
  const isAutoScrollEnabledRef = useRef(true)
  const prevLogsCountRef = useRef(0)
  const prevEventTypeRef = useRef(eventType)
  const hasInitialScrolled = useRef(false)

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const handleScroll = () => {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight
      isAutoScrollEnabledRef.current = distanceFromBottom < ROW_HEIGHT_PX * 2
    }

    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [scrollContainerRef])

  useEffect(() => {
    if (isInitialized && !hasInitialScrolled.current && logsCount > 0) {
      hasInitialScrolled.current = true
      prevLogsCountRef.current = logsCount
      requestAnimationFrame(() => {
        const el = scrollContainerRef.current
        if (el) el.scrollTop = el.scrollHeight
      })
    }
  }, [isInitialized, logsCount, scrollContainerRef])

  useEffect(() => {
    if (prevEventTypeRef.current !== eventType) {
      prevEventTypeRef.current = eventType
      hasInitialScrolled.current = false
      prevLogsCountRef.current = 0
    }
  }, [eventType])

  useEffect(() => {
    if (!hasInitialScrolled.current) return

    const newLogsCount = logsCount - prevLogsCountRef.current

    if (newLogsCount > 0 && isAutoScrollEnabledRef.current) {
      const el = scrollContainerRef.current
      if (el) el.scrollTop += newLogsCount * ROW_HEIGHT_PX
    }

    prevLogsCountRef.current = logsCount
  }, [logsCount, scrollContainerRef])
}

interface LogRowProps {
  log: SandboxLogDTO
  virtualRow: VirtualItem
  virtualizer: Virtualizer<HTMLDivElement, Element>
  startedAt: number
}

function LogRow({ log, virtualRow, virtualizer, startedAt }: LogRowProps) {
  // Clamp to 0 for logs before startedAt (e.g., system init logs or logs from before resume)
  const millisAfterStart = Math.max(0, log.timestampUnix - startedAt)

  return (
    <TableRow
      data-index={virtualRow.index}
      ref={(node) => virtualizer.measureElement(node)}
      style={{
        display: 'flex',
        position: 'absolute',
        left: 0,
        transform: `translateY(${virtualRow.start}px)`,
        minWidth: '100%',
        height: ROW_HEIGHT_PX,
      }}
    >
      <TableCell
        className="py-0 px-0 pr-4"
        style={{
          display: 'flex',
          alignItems: 'center',
          width: COLUMN_WIDTHS_PX.timestamp,
        }}
      >
        <Timestamp
          timestampUnix={log.timestampUnix}
          millisAfterStart={millisAfterStart}
        />
      </TableCell>
      <TableCell
        className="py-0 px-0 pr-4"
        style={{
          display: 'flex',
          alignItems: 'center',
          width: COLUMN_WIDTHS_PX.eventType,
        }}
      >
        <EventTypeBadge eventType={log.eventType} fields={log.fields} />
      </TableCell>
      <TableCell
        className="py-0 px-0"
        style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}
      >
        <Message
          message={log.message}
          eventType={log.eventType}
          fields={log.fields}
        />
      </TableCell>
    </TableRow>
  )
}

interface StatusRowProps {
  virtualRow: VirtualItem
  virtualizer: Virtualizer<HTMLDivElement, Element>
  isFetchingNextPage: boolean
}

function StatusRow({
  virtualRow,
  virtualizer,
  isFetchingNextPage,
}: StatusRowProps) {
  return (
    <TableRow
      data-index={virtualRow.index}
      ref={(node) => virtualizer.measureElement(node)}
      className="animate-pulse"
      style={{
        display: 'flex',
        position: 'absolute',
        left: 0,
        transform: `translateY(${virtualRow.start}px)`,
        minWidth: '100%',
        height: ROW_HEIGHT_PX,
      }}
    >
      <TableCell
        colSpan={3}
        className="py-0 w-full"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'start',
        }}
      >
        <span className="prose-body text-fg-tertiary pb-1">
          {isFetchingNextPage ? (
            <span className="inline-flex gap-1">
              Loading more logs
              <Loader variant="dots" />
            </span>
          ) : (
            'Scroll to load more'
          )}
        </span>
      </TableCell>
    </TableRow>
  )
}
