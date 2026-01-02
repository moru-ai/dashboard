// External service domains (for conditional rewrites/redirects)
const LANDING_PAGE_DOMAIN = process.env.LANDING_PAGE_DOMAIN || ''
const DOCUMENTATION_DOMAIN = process.env.DOCUMENTATION_DOMAIN || ''

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  reactCompiler: true,
  experimental: {
    useCache: true,
    turbopackFileSystemCacheForDev: true,
    serverActions: {
      bodySizeLimit: '5mb',
    },
    authInterrupts: true,
  },
  turbopack: {
    resolveAlias: {
      // Stub Node.js modules for browser builds
      // moru package bundles these packages. when dealing with browser chunks,
      // we need to stub these packages for builds.
      fs: { browser: './stubs/fs.ts' },
      'node:fs': { browser: './stubs/fs.ts' },
      'node:fs/promises': { browser: './stubs/fs-promises.ts' },
    },
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  serverExternalPackages: ['pino'],
  trailingSlash: false,
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          // config to prevent the browser from rendering the page inside a frame or iframe and avoid clickjacking http://en.wikipedia.org/wiki/Clickjacking
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
      ],
    },
  ],
  rewrites: async () => ({
    beforeFiles: [
      // PostHog proxy to avoid ad blockers
      {
        source: '/ph-proxy/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ph-proxy/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },

      // Asset rewrites for Mintlify documentation (only when DOCUMENTATION_DOMAIN is set)
      ...(DOCUMENTATION_DOMAIN
        ? [
            {
              source: '/mintlify-assets/:path*',
              destination: `https://${DOCUMENTATION_DOMAIN}/mintlify-assets/:path*`,
            },
            {
              source: '/_mintlify/:path*',
              destination: `https://${DOCUMENTATION_DOMAIN}/_mintlify/:path*`,
            },
          ]
        : []),
    ],
  }),
  redirects: async () => [
    // Redirect root to dashboard only when no landing page is configured
    // When LANDING_PAGE_DOMAIN is set, the catch-all route handler proxies / to the landing page
    ...(LANDING_PAGE_DOMAIN
      ? []
      : [
          {
            source: '/',
            destination: '/dashboard',
            permanent: false,
          },
        ]),
    {
      source: '/docs/api/cli',
      destination: '/auth/cli',
      permanent: true,
    },
    {
      source: '/auth/sign-in',
      destination: '/sign-in',
      permanent: true,
    },
    {
      source: '/auth/sign-up',
      destination: '/sign-up',
      permanent: true,
    },
    // SEO Redirects
    {
      source: '/ai-agents/:path*',
      destination: '/',
      permanent: true,
    },
  ],
  skipTrailingSlashRedirect: true,
}

export default config
