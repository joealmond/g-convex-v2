/**
 * Shared TypeScript types for the G-Matrix application
 */

import type { Id, Doc } from '@convex/_generated/dataModel'

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
export type Quadrant = 'holyGrail' | 'survivorFood' | 'russianRoulette' | 'theBin'

export interface QuadrantInfo {
  id: Quadrant
  name: string
  color: string
  description: string
}

export const QUADRANTS: Record<Quadrant, QuadrantInfo> = {
  holyGrail: {
    id: 'holyGrail',
    name: 'Holy Grail',
    color: 'hsl(var(--holy-grail))',
    description: 'Safe and tasty - the best!',
  },
  survivorFood: {
    id: 'survivorFood',
    name: 'Survivor Food',
    color: 'hsl(var(--survivor-food))',
    description: 'Safe but not very tasty',
  },
  russianRoulette: {
    id: 'russianRoulette',
    name: 'Russian Roulette',
    color: 'hsl(var(--russian-roulette))',
    description: 'Tasty but risky for safety',
  },
  theBin: {
    id: 'theBin',
    name: 'The Bin',
    color: 'hsl(var(--the-bin))',
    description: 'Not safe and not tasty - avoid!',
  },
}

/**
 * Get quadrant based on safety and taste scores
 */
export function getQuadrant(safety: number, taste: number): Quadrant {
  if (safety >= 50 && taste >= 50) return 'holyGrail'
  if (safety >= 50 && taste < 50) return 'survivorFood'
  if (safety < 50 && taste >= 50) return 'russianRoulette'
  return 'theBin'
}

/**
 * Get color for a quadrant
 */
export function getQuadrantColor(quadrant: Quadrant): string {
  return QUADRANTS[quadrant].color
}

/**
 * Vote quick presets
 */
export interface VotePreset {
  safety: number
  taste: number
  label: string
}

export const SAFETY_PRESETS: VotePreset[] = [
  { safety: 90, taste: 0, label: 'Clean' },
  { safety: 50, taste: 0, label: 'Sketchy' },
  { safety: 10, taste: 0, label: 'Wrecked' },
]

export const TASTE_PRESETS: VotePreset[] = [
  { safety: 0, taste: 90, label: 'Yass!' },
  { safety: 0, taste: 50, label: 'Meh' },
  { safety: 0, taste: 10, label: 'Pass' },
]

/**
 * Price scale
 */
export const PRICE_LABELS = ['$', '$$', '$$$', '$$$$', '$$$$$']

export function getPriceLabel(price: number): string {
  return PRICE_LABELS[Math.round(price) - 1] || '$'
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
