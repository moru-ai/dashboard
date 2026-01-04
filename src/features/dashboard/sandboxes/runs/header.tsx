'use client'

import { cn } from '@/lib/utils'
import type { SandboxRunStatus } from '@/server/api/models/sandbox-runs.models'
import { Button } from '@/ui/primitives/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/primitives/dropdown-menu'
import { Input } from '@/ui/primitives/input'
import { useEffect, useState } from 'react'
import { Status } from './table-cells'
import useFilters from './use-filters'

interface DashedStatusCircleIconProps {
  status: SandboxRunStatus
  index: number
}

const DashedStatusCircleIcon = ({
  status,
  index,
}: DashedStatusCircleIconProps) => {
  return (
    <div
      className={cn(
        'size-3.5 rounded-full bg-bg border-[1.5px] border-dashed',
        {
          'border-accent-positive-highlight': status === 'running',
          'border-accent-warning-highlight': status === 'paused',
          'border-fg-tertiary': status === 'stopped',
        }
      )}
      style={{ rotate: `${index * 50}deg`, zIndex: index + 1 }}
    />
  )
}

const StatusIcons = ({
  selectedStatuses,
}: {
  selectedStatuses: SandboxRunStatus[]
}) => {
  const statusOrder: SandboxRunStatus[] = ['running', 'paused', 'stopped']
  const sortedStatuses = statusOrder.filter((s) => selectedStatuses.includes(s))

  return (
    <div className="flex -space-x-1.5">
      {sortedStatuses.map((status, i) => (
        <DashedStatusCircleIcon key={status} status={status} index={i} />
      ))}
    </div>
  )
}

const STATUS_OPTIONS: Array<{ value: SandboxRunStatus; label: string }> = [
  { value: 'running', label: 'Running' },
  { value: 'paused', label: 'Paused' },
  { value: 'stopped', label: 'Stopped' },
]

export default function RunsHeader() {
  const { statuses, setStatuses, search, setSearch } = useFilters()

  const [localSearch, setLocalSearch] = useState<string>(search ?? '')

  const [localStatuses, setLocalStatuses] =
    useState<SandboxRunStatus[]>(statuses)

  useEffect(() => {
    setLocalSearch(search ?? '')
  }, [search])

  useEffect(() => {
    setLocalStatuses(statuses)
  }, [statuses])

  const toggleStatus = (status: SandboxRunStatus) => {
    const isSelected = localStatuses.includes(status)

    if (isSelected && localStatuses.length === 1) {
      return
    }

    const newStatuses = isSelected
      ? localStatuses.filter((s) => s !== status)
      : [...localStatuses, status]

    setLocalStatuses(newStatuses)
    setStatuses(newStatuses)
  }

  const selectAllStatuses = () => {
    const allStatuses = STATUS_OPTIONS.map((s) => s.value)
    setLocalStatuses(allStatuses)
    setStatuses(allStatuses)
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Sandbox ID or Template"
        className="w-full max-w-62"
        value={localSearch}
        onChange={(e) => {
          setLocalSearch(e.target.value)
          setSearch(e.target.value)
        }}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="font-sans w-min normal-case"
          >
            <StatusIcons selectedStatuses={localStatuses} /> Status •{' '}
            {localStatuses.length}/{STATUS_OPTIONS.length}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuCheckboxItem
            checked={localStatuses.length === STATUS_OPTIONS.length}
            onCheckedChange={selectAllStatuses}
            onSelect={(e) => e.preventDefault()}
          >
            All
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          {STATUS_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={localStatuses.includes(option.value)}
              onCheckedChange={() => toggleStatus(option.value)}
              onSelect={(e) => e.preventDefault()}
            >
              <Status status={option.value} />
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
