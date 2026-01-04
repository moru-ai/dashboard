import { cn } from '@/lib/utils'
import { HistoryIcon } from '@/ui/primitives/icons'

interface RunsEmptyProps {
  error?: string
}

export default function RunsEmpty({ error }: RunsEmptyProps) {
  return (
    <div className="h-[35vh] w-full gap-2 relative flex justify-center items-center p-6">
      <HistoryIcon
        className={cn('size-5', error && 'text-accent-error-highlight')}
      />
      <p
        className={cn(
          'prose-body-highlight',
          error && 'text-accent-error-highlight'
        )}
      >
        {error ? error : 'No sandbox runs found'}
      </p>
    </div>
  )
}
