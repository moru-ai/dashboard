import { metrics } from '@opentelemetry/api'

export const getMeter = () => {
  return metrics.getMeter(process.env.OTEL_SERVICE_NAME || 'moru-dashboard')
}
