import { getSessionInsecure } from '@/server/auth/get-session'
import { Button } from '@/ui/primitives/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/primitives/card'
import BillingCreditsContent from '../billing/credits-content'

interface CreditsCardProps {
  params: Promise<{ teamIdOrSlug: string }>
  className?: string
}

function buildTopUpMailto(userEmail: string) {
  const email = 'support@moru.io'
  const subject = 'Credit Top Up Request'
  const body = `Hi Moru Team,

I would like to top up credits for my account.

Account Email: ${userEmail}
Amount: $[Please specify amount]

Thank you!`

  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export default async function CreditsCard({
  params,
  className,
}: CreditsCardProps) {
  const session = await getSessionInsecure()
  const userEmail = session?.user?.email ?? ''

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="font-mono">Credits</CardTitle>
        <CardDescription>
          Your current credits balance.
          <br /> Usage costs are deducted from your credits.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <BillingCreditsContent params={params} />
        <Button asChild variant="default" size="lg">
          <a href={buildTopUpMailto(userEmail)}>Top Up</a>
        </Button>
      </CardContent>
    </Card>
  )
}
