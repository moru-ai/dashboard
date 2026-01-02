import type { Metadata } from 'next'
import { BASE_URL } from './urls'

export const METADATA: Metadata = {
  title: 'Moru | Runtime for AI Agents',
  description: 'Moru is a secure runtime for AI agents.',
  openGraph: {
    locale: 'en',
    url: BASE_URL,
    type: 'website',
    siteName: 'Moru',
    title: 'Moru | Runtime for AI Agents',
    description: 'Moru is a secure runtime for AI agents.',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@moru',
    creator: '@moru',
    title: 'Moru | Runtime for AI Agents',
    description: 'Moru is a secure runtime for AI agents.',
  },
}
