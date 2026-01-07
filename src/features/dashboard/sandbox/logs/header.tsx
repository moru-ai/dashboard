'use client'

import { cn } from '@/lib/utils/ui'
import type { SandboxRunDetailsDTO } from '@/server/api/models/sandbox-runs.models'
import CopyButtonInline from '@/ui/copy-button-inline'
import { CloseIcon, PausedIcon } from '@/ui/primitives/icons'
import { Loader } from '@/ui/primitives/loader'
import { Skeleton } from '@/ui/primitives/skeleton'
import { Ban } from 'lucide-react'
import { DetailsItem, DetailsRow } from '../../layouts/details-row'
import { RanFor, StartedAt, Template } from './header-cells'
import KillButtonRuns from './kill-button'

interface SandboxLogsHeaderProps {
  runDetails: SandboxRunDetailsDTO | undefined
  sandboxId: string
  teamIdOrSlug: string
}

export default function SandboxLogsHeader({
  runDetails,
  sandboxId,
  teamIdOrSlug,
}: SandboxLogsHeaderProps) {
  const isLoading = !runDetails
  const isRunning = runDetails?.status === 'running'

  return (
    <header className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <DetailsRow className="flex-1">
          <DetailsItem label="Sandbox ID">
          <CopyButtonInline
            value={sandboxId}
            className="font-mono prose-table-numeric text-fg-secondary"
          >
            {sandboxId}
          </CopyButtonInline>
        </DetailsItem>
        <DetailsItem label="Template">
          {isLoading ? (
            <Skeleton className="w-48 h-5" />
          ) : (
            <Template
              template={runDetails.template}
              templateId={runDetails.templateId}
              teamIdOrSlug={teamIdOrSlug}
            />
          )}
        </DetailsItem>
        <DetailsItem label="Started">
          {isLoading ? (
            <Skeleton className="w-36 h-5" />
          ) : (
            <StartedAt timestamp={runDetails.startedAt} />
          )}
        </DetailsItem>
        <DetailsItem label={isRunning ? 'Running for' : 'Duration'}>
          {isLoading ? (
            <Skeleton className="w-36 h-5" />
          ) : (
            <RanFor
              startedAt={runDetails.startedAt}
              endedAt={runDetails.endedAt}
              isRunning={isRunning}
            />
          )}
        </DetailsItem>
        </DetailsRow>
        <KillButtonRuns
          teamIdOrSlug={teamIdOrSlug}
          sandboxId={sandboxId}
          isRunning={isRunning}
        />
      </div>

      <StatusBanner
        status={runDetails?.status}
        endReason={runDetails?.endReason}
      />
    </header>
  )
}

interface StatusBannerProps {
  status: SandboxRunDetailsDTO['status'] | undefined
  endReason?: SandboxRunDetailsDTO['endReason']
}

function StatusBanner({ status, endReason }: StatusBannerProps) {
  return (
    <div
      className={cn('p-2 border relative', {
        'border-stroke bg-bg-hover': !status,
        'border-accent-positive-highlight bg-accent-positive-bg':
          status === 'running',
        'border-accent-warning-highlight bg-accent-warning-bg':
          status === 'paused',
        'border-stroke bg-bg-highlight':
          status === 'stopped' && endReason !== 'error',
        'border-accent-error-highlight bg-accent-error-bg-large':
          status === 'stopped' && endReason === 'error',
      })}
    >
      <div className="flex items-center gap-1">
        {!status ? (
          <>
            <Loader variant="slash" className="min-w-4" />
            <p className="prose-body text-fg">Loading sandbox details</p>
            <Loader variant="dots" />
          </>
        ) : status === 'running' ? (
          <>
            <Loader
              variant="slash"
              className="min-w-4 text-accent-positive-highlight"
            />
            <p className="prose-body text-fg">Running</p>
            <Loader variant="dots" className="text-accent-positive-highlight" />
          </>
        ) : status === 'paused' ? (
          <>
            <PausedIcon className="size-4 text-accent-warning-highlight" />
            <p className="prose-body text-fg">Paused</p>
          </>
        ) : endReason === 'error' ? (
          <>
            <CloseIcon className="size-3 text-accent-error-highlight" />
            <label className="prose-label uppercase text-accent-error-highlight">
              Error
            </label>
          </>
        ) : (
          <>
            <Ban className="size-4 text-fg-tertiary" />
            <p className="prose-body text-fg">
              Stopped
              {endReason && (
                <span className="text-fg-tertiary ml-1">({endReason})</span>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
