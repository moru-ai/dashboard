/**
 * Billing types re-exported from generated OpenAPI types.
 * This maintains backward compatibility - existing imports continue to work.
 *
 * Source of truth: billing/spec/openapi.yml
 * Generated file: ./billing-api.types.ts
 */
import type { components } from './billing-api.types'

// Re-export all types with same names as before
export type BillingLimit = components['schemas']['BillingLimit']
export type CustomerPortalResponse = components['schemas']['CustomerPortalResponse']
export type UsageResponse = components['schemas']['UsageResponse']
export type DayUsage = components['schemas']['DayUsage']
export type HourUsage = components['schemas']['HourUsage']
export type TeamItems = components['schemas']['TeamItems']
export type TeamTiers = components['schemas']['TeamTiers']
export type TeamAddons = components['schemas']['TeamAddons']
export type TierInfo = components['schemas']['TierInfo']
export type TierLimits = components['schemas']['TierLimits']
export type AddonInfo = components['schemas']['AddonInfo']
export type AddOnOrderCreateResponse = components['schemas']['AddOnOrderCreateResponse']
export type AddOnOrderConfirmResponse = components['schemas']['AddOnOrderConfirmResponse']
export type AddOnOrderItem = components['schemas']['AddOnOrderItem']
export type PaymentMethodsCustomerSession = components['schemas']['PaymentMethodsCustomerSession']
export type Invoice = components['schemas']['Invoice']
export type CreateTeamsResponse = components['schemas']['CreateTeamsResponse']
