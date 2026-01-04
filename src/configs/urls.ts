export const AUTH_URLS = {
  FORGOT_PASSWORD: '/forgot-password',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  CONFIRM: '/confirm',
  CALLBACK: '/api/auth/callback',
  CLI: '/auth/cli',
}

export const PROTECTED_URLS = {
  DASHBOARD: '/dashboard',
  ACCOUNT_SETTINGS: '/dashboard/account',
  RESET_PASSWORD: '/dashboard/account',
  NEW_TEAM: '/dashboard/teams/new',
  TEAMS: '/dashboard/teams',

  RESOLVED_ACCOUNT_SETTINGS: (teamIdOrSlug: string) =>
    `/dashboard/${teamIdOrSlug}/account`,

  GENERAL: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/general`,
  KEYS: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/keys`,
  MEMBERS: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/members`,

  SANDBOXES: (teamIdOrSlug: string) =>
    `/dashboard/${teamIdOrSlug}/sandboxes?tab=runs`,
  SANDBOXES_MONITORING: (teamIdOrSlug: string) =>
    `/dashboard/${teamIdOrSlug}/sandboxes?tab=monitoring`,
  SANDBOXES_LIST: (teamIdOrSlug: string) =>
    `/dashboard/${teamIdOrSlug}/sandboxes?tab=list`,
  SANDBOXES_RUNS: (teamIdOrSlug: string) =>
    `/dashboard/${teamIdOrSlug}/sandboxes?tab=runs`,

  SANDBOX: (teamIdOrSlug: string, sandboxId: string) =>
    `/dashboard/${teamIdOrSlug}/sandboxes/${sandboxId}`,
  SANDBOX_INSPECT: (teamIdOrSlug: string, sandboxId: string) =>
    `/dashboard/${teamIdOrSlug}/sandboxes/${sandboxId}/inspect`,
  SANDBOX_LOGS: (teamIdOrSlug: string, sandboxId: string) =>
    `/dashboard/${teamIdOrSlug}/sandboxes/runs/${sandboxId}`,

  WEBHOOKS: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/webhooks`,

  TEMPLATES: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/templates`,
  TEMPLATES_LIST: (teamIdOrSlug: string) =>
    `/dashboard/${teamIdOrSlug}/templates?tab=list`,
  TEMPLATES_BUILDS: (teamIdOrSlug: string) =>
    `/dashboard/${teamIdOrSlug}/templates?tab=builds`,
  TEMPLATE_BUILD: (teamIdOrSlug: string, templateId: string, buildId: string) =>
    `/dashboard/${teamIdOrSlug}/templates/${templateId}/builds/${buildId}`,

  USAGE: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/usage`,
  BILLING: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/billing`,
  BUDGET: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/budget`,
}

export const HELP_URLS = {
  BUILD_TEMPLATE:
    'https://moru.io/docs/sandbox-template#4-build-your-sandbox-template',
  START_COMMAND: 'https://moru.io/docs/sandbox-template/start-cmd',
}

export const BASE_URL = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === 'production'
    ? 'https://moru.io'
    : `https://${process.env.VERCEL_BRANCH_URL}`
  : 'http://localhost:3000'

export const GITHUB_URL = 'https://github.com/moru-ai'
