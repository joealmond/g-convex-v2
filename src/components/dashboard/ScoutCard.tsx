'use client'

import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Trophy, Flame, Star, TrendingUp } from 'lucide-react'
import { getUserLevel } from '@/lib/app-config'
import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'

/**
 * Scout Card - Quick stats popover shown from TopBar
 * - Total points
 * - Current level badge
 * - Streak count
 * - Badge count
 */
export function ScoutCard() {
  const profile = useQuery(api.profiles.getCurrent)

  if (!profile) {
    return (
      <div className="w-64 p-4 space-y-3">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-color-bg rounded" />
          <div className="h-4 bg-color-bg rounded" />
          <div className="h-4 bg-color-bg rounded" />
        </div>
      </div>
    )
  }

  const points = profile.points || 0
  const currentLevel = getUserLevel(points)
  const earnedBadges = profile.badges || []
  const currentStreak = profile.streak || 0

  if (!currentLevel) {
    return null
  }

  return (
    <div className="w-72 p-4 space-y-4">
      {/* Level Badge */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-color-text">Scout Status</h3>
        <Badge style={{ backgroundColor: currentLevel.color, color: '#fff' }}>
          {currentLevel.title}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Points */}
        <div className="flex items-center gap-2 p-2 bg-color-bg rounded-xl">
          <Trophy className="h-5 w-5 text-color-gold flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-lg font-bold text-color-text">{points}</div>
            <div className="text-xs text-color-text-secondary">Points</div>
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-2 p-2 bg-color-bg rounded-xl">
          <Flame className="h-5 w-5 text-orange-500 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-lg font-bold text-color-text">{currentStreak}</div>
            <div className="text-xs text-color-text-secondary">Day Streak</div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 p-2 bg-color-bg rounded-xl">
          <Star className="h-5 w-5 text-color-primary flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-lg font-bold text-color-text">{earnedBadges.length}</div>
            <div className="text-xs text-color-text-secondary">Badges</div>
          </div>
        </div>

        {/* Votes */}
        <div className="flex items-center gap-2 p-2 bg-color-bg rounded-xl">
          <TrendingUp className="h-5 w-5 text-color-primary flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-lg font-bold text-color-text">{profile.totalVotes || 0}</div>
            <div className="text-xs text-color-text-secondary">Votes</div>
          </div>
        </div>
      </div>

      {/* View Profile Link */}
      {/* View Profile Link */}
      <Link
        to="/profile"
        className="block text-center text-sm text-color-primary hover:underline font-semibold"
      >
        View Full Profile →
      </Link>
    </div>
  )
}
