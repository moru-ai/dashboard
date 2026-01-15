import { PROTECTED_URLS } from '@/configs/urls'
import { l } from '@/lib/clients/logger/logger'
import { createClient } from '@/lib/clients/supabase/server'
import { encodedRedirect } from '@/lib/utils/auth'
import { generateMoruUserAccessToken } from '@/lib/utils/server'
import { getDefaultTeamRelation } from '@/server/auth/get-default-team'
import { CheckCircle2Icon } from 'lucide-react'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { serializeError } from 'serialize-error'
import { CLILoginForm } from './cli-login-form'

// Types
type CLISearchParams = Promise<{
  next?: string
  returnTo?: string
  state?: string
  error?: string
}>

// Server Actions
async function handleCLIAuth(
  next: string,
  userId: string,
  userEmail: string,
  supabaseAccessToken: string
) {
  if (!next?.startsWith('http://localhost')) {
    throw new Error('Invalid redirect URL')
  }

  try {
    const defaultTeam = await getDefaultTeamRelation(userId)
    const moruAccessToken =
      await generateMoruUserAccessToken(supabaseAccessToken)

    const searchParams = new URLSearchParams({
      email: userEmail,
      accessToken: moruAccessToken.token,
      defaultTeamId: defaultTeam.team_id,
    })

    return redirect(`${next}?${searchParams.toString()}`)
  } catch (err) {
    throw err
  }
}

// UI Components
function SuccessState({ email }: { email?: string }) {
  return (
    <div className="text-center">
      <CheckCircle2Icon className="text-brand-400 mx-auto h-12 w-12" />
      <h1 className="mt-4">Successfully connected</h1>
      {email && <p className="text-fg-secondary mt-1">{email}</p>}
      <p className="text-fg-tertiary mt-6">
        Your CLI is now linked. You can close this page.
      </p>
      <a
        href={PROTECTED_URLS.DASHBOARD}
        className="text-fg-secondary mt-4 inline-block text-sm underline underline-offset-2"
      >
        Go to Dashboard
      </a>
    </div>
  )
}

// Main Component
export default async function CLIAuthPage({
  searchParams,
}: {
  searchParams: CLISearchParams
}) {
  const { next, state, error } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Success state - CLI received token
  if (state === 'success') {
    return <SuccessState email={user?.email} />
  }

  // Validate redirect URL
  if (!next?.startsWith('http://localhost')) {
    l.error(
      {
        key: 'cli_auth:invalid_redirect_url',
        user_id: user?.id,
        context: {
          next,
        },
      },
      `Invalid redirect URL: ${next}`
    )
    redirect(PROTECTED_URLS.DASHBOARD)
  }

  // If user is not authenticated, show login UI
  if (!user) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <CLILoginForm next={next} />
      </Suspense>
    )
  }

  // Handle CLI callback if authenticated - generate token and redirect to CLI
  if (!error && next && user) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('No provider access token found')
      }

      return await handleCLIAuth(
        next,
        user.id,
        user.email!,
        session.access_token
      )
    } catch (err) {
      if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
        throw err
      }

      l.error(
        {
          key: 'cli_auth:unexpected_error',
          error: serializeError(err),
          user_id: user?.id,
          context: {
            next,
          },
        },
        `Unexpected error during CLI authentication: ${err instanceof Error ? err.message : String(err)}`
      )

      return encodedRedirect('error', '/auth/cli', (err as Error).message, {
        next,
      })
    }
  }

  // Fallback - show login
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CLILoginForm next={next ?? ''} />
    </Suspense>
  )
}
