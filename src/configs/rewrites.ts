import { DomainConfig } from '@/types/rewrites.types'

// External service domains (set via env vars when ready)
export const LANDING_PAGE_DOMAIN = process.env.LANDING_PAGE_DOMAIN || ''
export const DOCUMENTATION_DOMAIN = process.env.DOCUMENTATION_DOMAIN || ''
export const SDK_REFERENCE_DOMAIN = process.env.SDK_REFERENCE_DOMAIN || ''

// Currently we have two locations for rewrites to happen.
// 1. Route handler catch-all rewrite config (cached on build time with revalidation)
// 2. Middleware native rewrite config (dynamic)
export type RewriteConfigType = 'route' | 'middleware'

// Route handler catch-all rewrite config
// IMPORTANT: The order of the rules is important, as the first matching rule will be used
export const ROUTE_REWRITE_CONFIG: DomainConfig[] = [
  // Landing page rewrites (enable by setting LANDING_PAGE_DOMAIN env var)
  ...(LANDING_PAGE_DOMAIN
    ? [
        {
          domain: LANDING_PAGE_DOMAIN,
          rules: [
            { path: '/' },
            { path: '/terms' },
            { path: '/privacy' },
            { path: '/pricing' },
            { path: '/thank-you' },
            { path: '/contact' },
            { path: '/research' },
            { path: '/startups' },
            { path: '/enterprise' },
            { path: '/careers' },
            {
              path: '/blog/category',
              pathPreprocessor: (path: string) => path.replace('/blog', ''),
              sitemapMatchPath: '/category',
            },
            { path: '/blog' },
            { path: '/cookbook' },
          ],
        },
      ]
    : []),
]

/**
 * Middleware native rewrite config
 *
 * We implement rewrites directly in middleware rather than using Next.js's built-in
 * `rewrites` configuration in next.config.js because we need to set custom request
 * and response headers for these rewritten requests.
 *
 * Specifically, we need to:
 * - Add custom headers to the request (e.g., x-moru-should-index for SEO control)
 * - Set custom response headers (e.g., X-Robots-Tag for search engine indexing)
 * - Have fine-grained control over the rewrite behavior based on environment variables
 *
 * Next.js's native rewrite configuration doesn't provide this level of header manipulation
 * capability, so we handle these rewrites in our middleware layer where we have full
 * control over the request/response cycle.
 */
export const MIDDLEWARE_REWRITE_CONFIG: DomainConfig[] = [
  // SDK reference docs (enable by setting SDK_REFERENCE_DOMAIN env var)
  ...(SDK_REFERENCE_DOMAIN
    ? [
        {
          domain: SDK_REFERENCE_DOMAIN,
          rules: [{ path: '/docs/sdk-reference' }],
        },
      ]
    : []),
  // Documentation (enable by setting DOCUMENTATION_DOMAIN env var)
  ...(DOCUMENTATION_DOMAIN
    ? [
        {
          domain: DOCUMENTATION_DOMAIN,
          rules: [
            { path: '/docs.md' },
            { path: '/docs/llms.txt', pathPreprocessor: () => '/llms.txt' },
            {
              path: '/docs/llms-full.txt',
              pathPreprocessor: () => '/llms-full.txt',
            },
            { path: '/docs' },
            { path: '/mcp' },
          ],
        },
      ]
    : []),
]
