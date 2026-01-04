import z from 'zod'

// Status schema matching database CHECK constraint
export const SandboxRunStatusSchema = z.enum(['running', 'paused', 'stopped'])
export type SandboxRunStatus = z.infer<typeof SandboxRunStatusSchema>

// End reason schema matching database CHECK constraint
export const SandboxRunEndReasonSchema = z.enum([
  'killed',
  'timeout',
  'error',
  'shutdown',
])
export type SandboxRunEndReason = z.infer<typeof SandboxRunEndReasonSchema>

// DTO for list view
export interface ListedSandboxRunDTO {
  id: string
  sandboxId: string
  templateId: string
  template: string // alias or ID
  status: SandboxRunStatus
  endReason: string | null
  createdAt: number // unix timestamp ms
  endedAt: number | null
}

// DTO for running status updates
export interface RunningSandboxRunStatusDTO {
  sandboxId: string
  status: SandboxRunStatus
  endReason: string | null
  endedAt: number | null
}

// DTO for detail view
export interface SandboxRunDetailsDTO {
  sandboxId: string
  template: string
  templateId: string
  status: SandboxRunStatus
  endReason: string | null
  startedAt: number
  endedAt: number | null
  metadata: Record<string, unknown> | null
}

// Database query result type
export type RawSandboxRunDB = {
  id: string
  sandbox_id: string
  template_id: string
  status: string
  end_reason: string | null
  created_at: string
  ended_at: string | null
  metadata: Record<string, unknown> | null
}

// Mapping function
export function mapDatabaseRunToListedSandboxRunDTO(
  run: RawSandboxRunDB,
  templateAlias: string | null
): ListedSandboxRunDTO {
  return {
    id: run.id,
    sandboxId: run.sandbox_id,
    templateId: run.template_id,
    template: templateAlias ?? run.template_id,
    status: run.status as SandboxRunStatus,
    endReason: run.end_reason,
    createdAt: new Date(run.created_at).getTime(),
    endedAt: run.ended_at ? new Date(run.ended_at).getTime() : null,
  }
}
