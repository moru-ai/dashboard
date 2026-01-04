import { DashboardTab, DashboardTabs } from '@/ui/dashboard-tabs'
import { HistoryIcon, ListIcon, TrendIcon } from '@/ui/primitives/icons'

export default function SandboxesLayout({
  list,
  monitoring,
  runs,
}: LayoutProps<'/dashboard/[teamIdOrSlug]/sandboxes'> & {
  list: React.ReactNode
  monitoring: React.ReactNode
  runs: React.ReactNode
}) {
  return (
    <DashboardTabs
      type="query"
      layoutKey="tabs-indicator-sandboxes"
      className="mt-2 md:mt-3"
      defaultTabId="runs"
    >
      <DashboardTab
        id="runs"
        label="Runs"
        icon={<HistoryIcon className="size-4" />}
      >
        {runs}
      </DashboardTab>
      <DashboardTab
        id="monitoring"
        label="Monitoring"
        icon={<TrendIcon className="size-4" />}
      >
        {monitoring}
      </DashboardTab>
      <DashboardTab
        id="list"
        label="List"
        icon={<ListIcon className="size-4" />}
      >
        {list}
      </DashboardTab>
    </DashboardTabs>
  )
}
