import { createFileRoute } from '@tanstack/react-router'
import { Leaderboard } from '@/components/dashboard/Leaderboard'
import { Trophy } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

export const Route = createFileRoute('/leaderboard')({
  component: LeaderboardPage,
})

function LeaderboardPage() {
  const { t } = useTranslation()
  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="max-w-4xl mx-auto w-full px-4 py-3">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1">
            <Trophy className="h-7 w-7 text-amber-500" />
            <h1 className="text-2xl font-bold text-foreground">{t('leaderboard.title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('leaderboard.topContributors')}
          </p>
        </div>

        {/* Leaderboard */}
        <Leaderboard limit={50} showFullRanks={true} />

        {/* Info Card */}
        <div className="mt-6 p-4 rounded-xl bg-card shadow-sm text-sm text-muted-foreground">
          <p className="font-semibold mb-2 text-foreground">{t('leaderboard.howRankingsWork')}</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>{t('leaderboard.earnVotePoints')}</li>
            <li>{t('leaderboard.earnProductPoints')}</li>
            <li>{t('leaderboard.maintainStreaks')}</li>
            <li>{t('leaderboard.unlockBadges')}</li>
            <li>{t('leaderboard.realTimeUpdates')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
