'use client'

import { PROTECTED_URLS } from '@/configs/urls'
import { cn } from '@/lib/utils'
import {
  formatDurationCompact,
  formatTimeAgoCompact,
} from '@/lib/utils/formatting'
import type { SandboxRunStatus } from '@/server/api/models/sandbox-runs.models'
import CopyButtonInline from '@/ui/copy-button-inline'
import { Badge } from '@/ui/primitives/badge'
import { Button } from '@/ui/primitives/button'
import { PausedIcon } from '@/ui/primitives/icons'
import { Loader } from '@/ui/primitives/loader'
import { ArrowUpRight, Ban } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function SandboxId({ id }: { id: string }) {
  return (
    <CopyButtonInline
      value={id}
      className="w-full text-left text-fg-tertiary font-mono prose-table-numeric"
    >
      {id}
    </CopyButtonInline>
  )
}

export function Template({
  template,
  templateId,
  className,
}: {
  template: string
  templateId: string
  className?: string
}) {
  const router = useRouter()
  const { teamIdOrSlug } =
    useParams<
      Awaited<PageProps<'/dashboard/[teamIdOrSlug]/sandboxes'>['params']>
    >()

  return (
    <Button
      variant="link"
      className={cn(
        'text-fg h-auto p-0 gap-1 font-sans prose-table normal-case max-w-full',
        className
      )}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        router.push(PROTECTED_URLS.TEMPLATES_LIST(teamIdOrSlug))
      }}
    >
      <p className="truncate">{template}</p>
      <ArrowUpRight className="size-3 min-w-3" />
    </Button>
  )
}

export function LoadMoreButton({
  isLoading,
  onLoadMore,
}: {
  isLoading: boolean
  onLoadMore: () => void
}) {
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1">
        Loading
        <Loader variant="dots" />
      </span>
    )
  }
  return (
    <button
      onClick={onLoadMore}
      className="underline text-fg-secondary hover:text-accent-main-highlight transition-colors"
    >
      Load more
    </button>
  )
}

export function BackToTopButton({ onBackToTop }: { onBackToTop: () => void }) {
  return (
    <button
      onClick={onBackToTop}
      className="underline text-fg-secondary hover:text-accent-main-highlight transition-colors"
    >
      Back to top
    </button>
  )
}

export function Duration({
  createdAt,
  endedAt,
  isRunning,
}: {
  createdAt: number
  endedAt: number | null
  isRunning: boolean
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  const duration = isRunning ? now - createdAt : (endedAt ?? now) - createdAt

  return (
    <span className="text-fg-tertiary prose-table-numeric whitespace-nowrap">
      {formatDurationCompact(duration)}
    </span>
  )
}

export function StartedAt({ timestamp }: { timestamp: number }) {
  const elapsed = Date.now() - timestamp

  return (
    <span className="text-fg prose-table-numeric whitespace-nowrap">
      {formatTimeAgoCompact(elapsed)}
    </span>
  )
}

interface StatusProps {
  status: SandboxRunStatus
}

export function Status({ status }: StatusProps) {
  const config: Record<
    SandboxRunStatus,
    {
      label: string
      variant: 'default' | 'positive' | 'error' | 'warning'
      icon: React.ReactNode
    }
  > = {
    running: {
      label: 'Running',
      variant: 'positive',
      icon: null,
    },
    paused: {
      label: 'Paused',
      variant: 'warning',
      icon: <PausedIcon className="size-4" />,
    },
    stopped: {
      label: 'Stopped',
      variant: 'default',
      icon: <Ban className="size-4" />,
    },
  }

  const { label, icon, variant } = config[status]

  return (
    <div className="flex items-center gap-3 min-w-0">
      <Badge
        variant={variant}
        className={cn('select-none shrink-0 uppercase', {
          'bg-bg-inverted/10': variant === 'default',
        })}
      >
        {icon}
        {label}
      </Badge>
    </div>
  )
}

export function EndReason({ endReason }: { endReason: string | null }) {
  if (!endReason) return <span className="text-fg-tertiary">-</span>

  const config: Record<
    string,
    { label: string; variant: 'default' | 'error' | 'warning' }
  > = {
    killed: { label: 'Killed', variant: 'default' },
    timeout: { label: 'Timeout', variant: 'warning' },
    error: { label: 'Error', variant: 'error' },
    shutdown: { label: 'Shutdown', variant: 'default' },
  }

  const { label, variant } = config[endReason] ?? {
    label: endReason,
    variant: 'default' as const,
  }

  return (
    <Badge variant={variant} className="select-none shrink-0 uppercase text-xs">
      {label}
    </Badge>
  )
}
