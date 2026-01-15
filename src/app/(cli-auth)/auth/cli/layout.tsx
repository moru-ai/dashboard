import { ALLOW_SEO_INDEXING } from '@/configs/flags'
import { METADATA } from '@/configs/metadata'
import { cn } from '@/lib/utils'
import { GridPattern } from '@/ui/grid-pattern'

const robots = ALLOW_SEO_INDEXING ? 'index, follow' : 'noindex, nofollow'

export const metadata = {
  title: 'CLI Login | Moru',
  description: METADATA.description,
  openGraph: METADATA.openGraph,
  twitter: METADATA.twitter,
  robots: robots,
}

function TerminalMock() {
  return (
    <div className="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-bg shadow-2xl">
      {/* Terminal header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="h-3 w-3 rounded-full bg-red-500" />
        <div className="h-3 w-3 rounded-full bg-yellow-500" />
        <div className="h-3 w-3 rounded-full bg-green-500" />
        <span className="ml-2 text-sm text-fg-tertiary">Terminal</span>
      </div>

      {/* Terminal content */}
      <div className="p-6 font-mono text-sm">
        <div className="whitespace-nowrap text-fg-secondary">
          <span className="text-green-400">$</span> moru sandbox run base python3 -c "print('Hello from sandbox')"
        </div>
      </div>
    </div>
  )
}

export default function CLIAuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-[100svh] w-full">
      {/* Left side - Auth UI */}
      <div className="relative flex w-full items-center justify-center px-4 lg:w-1/2">
        <GridPattern
          width={50}
          height={50}
          x={-1}
          y={-1}
          strokeDasharray={'4 2'}
          className={cn(
            '[mask-image:radial-gradient(600px_400px_at_center,white,transparent)]'
          )}
          gradientFrom="var(--accent-main-highlight)"
          gradientVia="var(--bg-highlight)"
          gradientTo="var(--fill-highlight)"
          gradientDegrees={90}
        />
        <div className="z-10 h-fit w-full max-w-96 border bg-bg p-6">
          {children}
        </div>
      </div>

      {/* Right side - Terminal */}
      <div className="hidden w-1/2 items-center justify-center bg-white lg:flex">
        <TerminalMock />
      </div>
    </div>
  )
}
