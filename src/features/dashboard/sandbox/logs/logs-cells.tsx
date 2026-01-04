import { formatDurationCompact } from '@/lib/utils/formatting'
import CopyButtonInline from '@/ui/copy-button-inline'
import { Badge, BadgeProps } from '@/ui/primitives/badge'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'

type EventTypeValue = 'stdout' | 'stderr'

interface EventTypeBadgeProps {
  eventType: string
}

const mapEventTypeToBadgeProps: Record<EventTypeValue, BadgeProps> = {
  stdout: {
    variant: 'info',
  },
  stderr: {
    variant: 'error',
  },
}

export const EventTypeBadge = ({ eventType }: EventTypeBadgeProps) => {
  const badgeProps = mapEventTypeToBadgeProps[eventType as EventTypeValue] ?? {
    variant: 'default',
  }
  return (
    <Badge {...badgeProps} className="uppercase h-[18px]">
      {eventType}
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
}

export const Message = ({ message }: MessageProps) => {
  return <span className="prose-body whitespace-nowrap">{message}</span>
}
