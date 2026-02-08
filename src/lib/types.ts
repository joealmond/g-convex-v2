/**
 * Shared TypeScript types for the G-Matrix application
 */

import type { Id, Doc } from '@convex/_generated/dataModel'
import { appConfig } from './app-config'

// Re-export Convex types
export type { Id, Doc }

// Domain types - these will be populated by Convex schema
export type Product = Doc<'products'>
export type Vote = Doc<'votes'>
export type Profile = Doc<'profiles'>

// User type from Better Auth (not a Convex table)
export interface User {
  _id: string
  name: string
  email: string
  image?: string | null
  role?: string | null
}

// Quadrant types for G-Matrix visualization
export type Quadrant = keyof typeof appConfig.quadrants

export interface QuadrantInfo {
  id: string
  name: string
  color: string
  description: string
}

// Build QUADRANTS from config
export const QUADRANTS: Record<string, QuadrantInfo> = Object.fromEntries(
  Object.entries(appConfig.quadrants).map(([key, value]) => [
    key,
    {
      id: value.id,
      name: value.label,
      color: value.color,
      description: value.description,
    },
  ])
)

/**
 * Get quadrant based on safety and taste scores
 * This logic is generic (threshold-based) and doesn't depend on niche-specific labels
 */
export function getQuadrant(safety: number, taste: number): Quadrant {
  if (safety >= 50 && taste >= 50) return 'topRight' as Quadrant
  if (safety >= 50 && taste < 50) return 'topLeft' as Quadrant
  if (safety < 50 && taste >= 50) return 'bottomRight' as Quadrant
  return 'bottomLeft' as Quadrant
}

/**
 * Get color for a quadrant
 */
export function getQuadrantColor(quadrant: Quadrant): string {
  return QUADRANTS[quadrant]?.color || appConfig.colors.primary
}

/**
 * Vote quick presets
 */
export interface VotePreset {
  safety: number
  taste: number
  label: string
}

// Build presets from config
export const SAFETY_PRESETS: VotePreset[] = appConfig.dimensions.axis1.presets.map((preset) => ({
  safety: preset.value,
  taste: 0,
  label: preset.label,
}))

export const TASTE_PRESETS: VotePreset[] = appConfig.dimensions.axis2.presets.map((preset) => ({
  safety: 0,
  taste: preset.value,
  label: preset.label,
}))

/**
 * Price scale
 */
export const PRICE_LABELS = appConfig.dimensions.axis3.presets.map((preset) => preset.label)

export function getPriceLabel(price: number): string {
  const index = Math.round(price / 20) - 1 // Map 20-100 to 0-4
  return PRICE_LABELS[index] || PRICE_LABELS[0] || '$'
}

/**
 * Badge type
 */
export interface BadgeInfo {
  id: string
  name: string
  description: string
  icon?: string
}
