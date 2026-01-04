import LoadingLayout from '@/features/dashboard/loading-layout'
import RunsHeader from '@/features/dashboard/sandboxes/runs/header'
import RunsTable from '@/features/dashboard/sandboxes/runs/table'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { Suspense } from 'react'

export default async function RunsPage({
  params,
}: PageProps<'/dashboard/[teamIdOrSlug]/sandboxes'>) {
  const { teamIdOrSlug } = await params

  prefetch(
    trpc.sandboxRuns.list.queryOptions({
      teamIdOrSlug,
    })
  )

  return (
    <HydrateClient>
      <div className="h-full min-h-0 flex-1 p-3 md:p-6 flex flex-col gap-3">
        <RunsHeader />
        <Suspense fallback={<LoadingLayout />}>
          <RunsTable />
        </Suspense>
      </div>
    </HydrateClient>
  )
}
