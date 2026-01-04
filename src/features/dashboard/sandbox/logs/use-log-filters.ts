import { useQueryStates } from 'nuqs'
import {
  logsFilterParams,
  type SandboxLogEventTypeFilter,
} from './logs-filter-params'

export default function useLogFilters() {
  const [{ eventType }, setParams] = useQueryStates(logsFilterParams, {
    shallow: false,
    throttleMs: 300,
  })

  return {
    eventType,
    setEventType: (newEventType: SandboxLogEventTypeFilter | null) =>
      setParams({ eventType: newEventType }),
  }
}
