import { cn } from '@/lib/utils'
import { formatDurationCompact } from '@/lib/utils/formatting'
import CopyButtonInline from '@/ui/copy-button-inline'
import { Badge, BadgeProps } from '@/ui/primitives/badge'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'

type EventTypeValue = 'stdout' | 'stderr' | 'process_start' | 'process_end'

interface EventTypeBadgeProps {
  eventType: string
  fields?: Record<string, string>
}

const mapEventTypeToBadgeProps: Record<EventTypeValue, BadgeProps> = {
  stdout: {
    variant: 'info',
  },
  stderr: {
    variant: 'error',
  },
  process_start: {
    variant: 'default',
  },
  process_end: {
    variant: 'default',
  },
}

export const EventTypeBadge = ({ eventType, fields }: EventTypeBadgeProps) => {
  let badgeProps = mapEventTypeToBadgeProps[eventType as EventTypeValue] ?? {
    variant: 'default',
  }

  // For process_end, use error variant if exit code > 0
  if (eventType === 'process_end' && fields?.process_result) {
    try {
      const result = JSON.parse(fields.process_result)
      if (result.ExitCode !== 0) {
        badgeProps = { variant: 'error' }
      }
    } catch {
      // Keep default
    }
  }

  // Use friendly labels for process events
  const label =
    eventType === 'process_start'
      ? 'cmd'
      : eventType === 'process_end'
        ? 'exit'
        : eventType

  return (
    <Badge {...badgeProps} className="uppercase h-[18px]">
      {label}
    </Badge>
  )
}

interface TimestampProps {
  timestampUnix: number
  millisAfterStart: number
}

export const Timestamp = ({
  timestampUnix,
  millisAfterStart,
}: TimestampProps) => {
  const date = new Date(timestampUnix)

  return (
    <CopyButtonInline
      value={date.toISOString()}
      className="font-mono group prose-table-numeric truncate"
    >
      {formatDurationCompact(millisAfterStart, true)}{' '}
      <span className="group-hover:text-current transition-colors text-fg-tertiary">
        {format(date, 'hh:mm:ss.SS a', {
          locale: enUS,
        })}
      </span>
    </CopyButtonInline>
  )
}

interface MessageProps {
  message: string
  eventType?: string
  fields?: Record<string, string>
}

export const Message = ({ message, eventType, fields }: MessageProps) => {
  // Process start: show command with $ prefix
  if (eventType === 'process_start') {
    const command = fields?.command || message
    return (
      <span className="prose-body whitespace-nowrap text-fg-tertiary font-mono">
        <span className="text-fg-quaternary">$</span> {command}
      </span>
    )
  }

  // Process end: show exit code with color
  if (eventType === 'process_end') {
    // Try to parse process_result from fields
    let exitCode: number | undefined
    let exitError: string | undefined

    if (fields?.process_result) {
      try {
        const result = JSON.parse(fields.process_result)
        exitCode = result.ExitCode
        exitError = result.Error
      } catch {
        // Fallback to showing raw message
      }
    }

    if (exitCode !== undefined) {
      const isSuccess = exitCode === 0
      return (
        <span
          className={cn('prose-body whitespace-nowrap font-mono', {
            'text-accent-success-foreground': isSuccess,
            'text-accent-error-foreground': !isSuccess,
          })}
        >
          exit {exitCode}
          {exitError && ` - ${exitError}`}
        </span>
      )
    }

    // Fallback
    return (
      <span className="prose-body whitespace-nowrap text-fg-tertiary font-mono">
        {message}
      </span>
    )
  }

  // Default: stdout/stderr
  return <span className="prose-body whitespace-nowrap">{message}</span>
}
