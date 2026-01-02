import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

/**
 * Cookie keys used throughout the application.
 * Organized by functionality for better maintainability.
 */
export const COOKIE_KEYS = {
  SELECTED_TEAM_ID: 'moru-selected-team-id',
  SELECTED_TEAM_SLUG: 'moru-selected-team-slug',

  SIDEBAR_STATE: 'moru-sidebar-state',

  SANDBOX_INSPECT_ROOT_PATH: 'moru-sandbox-inspect-root-path',
  SANDBOX_INSPECT_POLLING_INTERVAL: 'moru-sandbox-inspect-polling-interval',
} as const

const BASE_COOKIE_OPTIONS: Partial<ResponseCookie> = {
  path: '/',
  maxAge: 60 * 60 * 24 * 365, // 1 year
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
}

/**
 * Cookie-specific options mapped by cookie key.
 * Uses BASE_COOKIE_OPTIONS as default and spreads custom overrides.
 */
export const COOKIE_OPTIONS = {
  [COOKIE_KEYS.SELECTED_TEAM_ID]: {
    ...BASE_COOKIE_OPTIONS,
  },
  [COOKIE_KEYS.SELECTED_TEAM_SLUG]: {
    ...BASE_COOKIE_OPTIONS,
  },
  [COOKIE_KEYS.SIDEBAR_STATE]: {
    ...BASE_COOKIE_OPTIONS,
  },
  [COOKIE_KEYS.SANDBOX_INSPECT_ROOT_PATH]: {
    ...BASE_COOKIE_OPTIONS,
  },
  [COOKIE_KEYS.SANDBOX_INSPECT_POLLING_INTERVAL]: {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 7,
  },
} as const
