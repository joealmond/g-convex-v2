/**
 * Challenge Card Component
 * Displays challenge progress with reward info
 */

import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/hooks/use-translation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Trophy, Calendar, Target } from 'lucide-react'
import { logger } from '@/lib/logger'

interface ChallengeCardProps {
  challenge: {
    _id: Id<'challenges'>
    title: string
    description: string
    type: string
    targetValue: number
    rewardPoints: number
    rewardBadge?: string
    startDate: number
    endDate: number
  }
  userProgress?: {
    progress: number
    completed: boolean
    rewardClaimed: boolean
  } | null
}

export function ChallengeCard({ challenge, userProgress }: ChallengeCardProps) {
  const { t } = useTranslation()
  const claimReward = useMutation(api.challenges.claimReward)

  const progress = userProgress?.progress ?? 0
  const completed = userProgress?.completed ?? false
  const claimed = userProgress?.rewardClaimed ?? false
  const progressPercent = Math.min((progress / challenge.targetValue) * 100, 100)

  const typeEmoji: Record<string, string> = {
    vote: '🗳️',
    product: '📦',
    streak: '🔥',
    store: '🏪',
  }

  const handleClaimReward = async () => {
    try {
      await claimReward({ challengeId: challenge._id })
      toast.success(
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span>{t('challenges.rewardClaimed', { points: challenge.rewardPoints })}</span>
        </div>
      )
    } catch (error) {
      toast.error(t('challenges.claimFailed'))
      logger.error('Failed to claim reward:', error)
    }
  }

  const endDate = new Date(challenge.endDate)
  const daysRemaining = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={completed && !claimed ? 'border-yellow-500 border-2' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{typeEmoji[challenge.type] ?? '🎯'}</div>
              <div>
                <CardTitle>{challenge.title}</CardTitle>
                <CardDescription>{challenge.description}</CardDescription>
              </div>
            </div>
            {completed && !claimed && (
              <Badge variant="default" className="bg-yellow-500 text-white">
                <Trophy className="w-3 h-3 mr-1" />
                {t('challenges.ready')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                {t('challenges.progress')}
              </span>
              <span className="font-medium">
                {progress} / {challenge.targetValue}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {progressPercent.toFixed(0)}% {t('challenges.complete')}
            </p>
          </div>

          {/* Time remaining */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {daysRemaining > 0 
              ? t('challenges.daysRemaining', { days: daysRemaining })
              : t('challenges.expired')
            }
          </div>

          {/* Rewards */}
          <div className="flex items-center gap-4 pt-2 border-t">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="text-xs text-muted-foreground">{t('challenges.reward')}</p>
                <p className="font-semibold">{challenge.rewardPoints} {t('common.points')}</p>
              </div>
            </div>
            {challenge.rewardBadge && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏅</span>
                <div>
                  <p className="text-xs text-muted-foreground">{t('challenges.badge')}</p>
                  <p className="font-semibold text-sm">{challenge.rewardBadge}</p>
                </div>
              </div>
            )}
          </div>

          {/* Claim button */}
          {completed && !claimed && (
            <Button onClick={handleClaimReward} className="w-full" size="lg">
              <Trophy className="w-4 h-4 mr-2" />
              {t('challenges.claimReward')}
            </Button>
          )}
          {claimed && (
            <Badge variant="secondary" className="w-full justify-center py-2">
              ✅ {t('challenges.claimed')}
            </Badge>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
