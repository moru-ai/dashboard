'use client'

import { killSandboxAction } from '@/server/sandboxes/sandbox-actions'
import { AlertPopover } from '@/ui/alert-popover'
import { Button } from '@/ui/primitives/button'
import { TrashIcon } from '@/ui/primitives/icons'
import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { useState } from 'react'
import { toast } from 'sonner'

interface KillButtonRunsProps {
  teamIdOrSlug: string
  sandboxId: string
  isRunning: boolean
  className?: string
}

export default function KillButtonRuns({
  teamIdOrSlug,
  sandboxId,
  isRunning,
  className,
}: KillButtonRunsProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const { execute, isExecuting } = useAction(killSandboxAction, {
    onSuccess: async () => {
      toast.success('Sandbox killed successfully')
      setOpen(false)
      // Invalidate the sandbox runs queries to refetch
      queryClient.invalidateQueries({
        queryKey: [['sandboxRuns', 'details'], { input: { teamIdOrSlug, sandboxId } }],
      })
      // Also invalidate the list so the runs table updates when navigating back
      queryClient.invalidateQueries({
        queryKey: [['sandboxRuns', 'list']],
      })
    },
    onError: ({ error }) => {
      toast.error(
        error.serverError || 'Failed to kill sandbox. Please try again.'
      )
    },
  })

  const handleKill = () => {
    if (!sandboxId || !isRunning) return

    execute({
      teamIdOrSlug,
      sandboxId,
    })
  }

  return (
    <AlertPopover
      open={open}
      onOpenChange={setOpen}
      title="Kill Sandbox"
      description="Are you sure you want to kill this sandbox? The sandbox state will be lost and cannot be recovered."
      confirm="Kill Sandbox"
      trigger={
        <Button
          variant="error"
          size="sm"
          className={className}
          disabled={!isRunning}
        >
          <TrashIcon className="size-4" />
          Kill
        </Button>
      }
      confirmProps={{
        disabled: isExecuting,
        loading: isExecuting,
      }}
      onConfirm={handleKill}
      onCancel={() => setOpen(false)}
    />
  )
}
