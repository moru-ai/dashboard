'use client'

import { killSandboxAction } from '@/server/sandboxes/sandbox-actions'
import { AlertPopover } from '@/ui/alert-popover'
import { Button } from '@/ui/primitives/button'
import { TrashIcon } from '@/ui/primitives/icons'
import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { useState } from 'react'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'
import { useDashboard } from '../../context'
import { useSandboxContext } from '../context'

interface KillButtonProps {
  className?: string
}

export default function KillButton({ className }: KillButtonProps) {
  const [open, setOpen] = useState(false)
  const { sandboxInfo, refetchSandboxInfo, isRunning } = useSandboxContext()
  const { team } = useDashboard()
  const { mutate } = useSWRConfig()
  const queryClient = useQueryClient()

  const { execute, isExecuting } = useAction(killSandboxAction, {
    onSuccess: async () => {
      toast.success('Sandbox killed successfully')
      setOpen(false)
      refetchSandboxInfo()
      // Refetch the main sandboxes list
      queryClient.refetchQueries({
        queryKey: [['sandboxes', 'getSandboxes']],
      })
      // Invalidate SWR team metrics cache to update the concurrent sandboxes counter
      // Use filter function to match all team metrics keys (with or without timeframe params)
      mutate(
        (key) =>
          Array.isArray(key) && key[0] === `/api/teams/${team.id}/metrics`
      )
    },
    onError: ({ error }) => {
      toast.error(
        error.serverError || 'Failed to kill sandbox. Please try again.'
      )
    },
  })

  const handleKill = () => {
    if (!sandboxInfo?.sandboxID || !isRunning) return

    execute({
      teamIdOrSlug: team.id,
      sandboxId: sandboxInfo.sandboxID,
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
