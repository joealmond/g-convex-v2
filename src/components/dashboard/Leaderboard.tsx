import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { FollowButton } from '@/components/profile/FollowButton'
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react'
import { Link } from '@tanstack/react-router'

interface LeaderboardProps {
  limit?: number
  showFullRanks?: boolean
}

/**
 * Leaderboard component showing top contributors
 * Can be embedded or shown as full page
 */
export function Leaderboard({ limit = 10, showFullRanks = false }: LeaderboardProps) {
  const leaderboard = useQuery(api.profiles.leaderboard, { limit })
  const currentUser = useQuery(api.users.current)

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>Top contributors to the G-Matrix</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No rankings yet. Be the first to contribute!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return null
    }
  }

  const getRankBadgeVariant = (rank: number): 'default' | 'secondary' | 'outline' => {
    if (rank === 1) return 'default'
    if (rank <= 3) return 'secondary'
    return 'outline'
  }

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Leaderboard</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Top {limit} contributors ranked by points
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="space-y-2 sm:space-y-3">
          {leaderboard.map((entry, index) => {
            const rank = index + 1
            const isTopThree = rank <= 3

            return (
              <div
                key={entry.userId}
                className={`flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg border transition-colors ${
                  isTopThree ? 'bg-muted/50' : 'hover:bg-muted/30'
                }`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-6 sm:w-10 flex-shrink-0">
                  {getRankIcon(rank) || (
                    <span className="text-sm sm:text-lg font-bold text-muted-foreground">
                      {rank}
                    </span>
                  )}
                </div>

                {/* User Avatar */}
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                  <AvatarFallback className="text-xs sm:text-sm">
                    {entry.userId.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm sm:text-base font-semibold truncate">
                      User #{entry.userId.slice(-6)}
                    </span>
                    {isTopThree && (
                      <Badge variant={getRankBadgeVariant(rank)} className="text-[10px] sm:text-xs px-1.5 py-0 h-4 sm:h-5 flex-shrink-0">
                        #{rank}
                      </Badge>
                    )}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    {entry.badges?.length || 0} badges · {entry.points} pts
                  </div>
                </div>

                {/* Points - hidden on very small screens since shown inline above */}
                <div className="text-right hidden sm:block flex-shrink-0">
                  <div className="text-lg font-bold">{entry.points}</div>
                  <div className="text-xs text-muted-foreground">points</div>
                </div>

                {/* Streak (if showing full ranks) */}
                {showFullRanks && (
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold">{entry.streak}</div>
                    <div className="text-xs text-muted-foreground">streak</div>
                  </div>
                )}

                {/* Follow Button (if logged in and not self) */}
                {currentUser && currentUser._id !== entry.userId && (
                  <FollowButton
                    userId={entry.userId}
                    variant="outline"
                    size="sm"
                    showIcon={false}
                  />
                )}
              </div>
            )
          })}
        </div>

        {!showFullRanks && leaderboard.length >= limit && (
          <div className="mt-4 text-center">
            <Link
              to="/leaderboard"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              View Full Leaderboard
              <TrendingUp className="h-4 w-4" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
