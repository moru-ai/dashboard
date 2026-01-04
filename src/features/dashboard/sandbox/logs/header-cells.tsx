'use client'

import { PROTECTED_URLS } from '@/configs/urls'
import {
  formatDurationCompact,
  formatTimeAgoCompact,
} from '@/lib/utils/formatting'
import { Button } from '@/ui/primitives/button'
import { ArrowUpRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function Template({
  template,
  templateId,
  teamIdOrSlug,
}: {
  template: string
  templateId: string
  teamIdOrSlug: string
}) {
  const router = useRouter()

  return (
    <Button
      variant="link"
      className="text-fg h-auto p-0 gap-1 font-sans prose-table normal-case max-w-full"
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

export function StartedAt({ timestamp }: { timestamp: number }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(interval)
  }, [])

  const elapsed = Date.now() - timestamp

  return (
    <span className="text-fg prose-table whitespace-nowrap">
      {formatTimeAgoCompact(elapsed)}
    </span>
  )
}

export function RanFor({
  startedAt,
  endedAt,
  isRunning,
}: {
  startedAt: number
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

  const duration = isRunning ? now - startedAt : (endedAt ?? now) - startedAt

  return (
    <span className="text-fg prose-table whitespace-nowrap">
      {formatDurationCompact(duration)}
    </span>
  )
}
