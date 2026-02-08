import { createFileRoute, Link } from '@tanstack/react-router'
import { Leaderboard } from '@/components/dashboard/Leaderboard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trophy } from 'lucide-react'

export const Route = createFileRoute('/leaderboard')({
  component: LeaderboardPage,
})

function LeaderboardPage() {
  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="max-w-4xl mx-auto w-full px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="h-8 w-8 text-amber-500" />
              <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
            </div>
            <p className="text-muted-foreground">
              Top contributors to the G-Matrix community
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        {/* Leaderboard */}
        <Leaderboard limit={50} showFullRanks={true} />

        {/* Info Card */}
        <div className="mt-6 p-4 rounded-xl bg-card shadow-sm text-sm text-muted-foreground">
          <p className="font-semibold mb-2 text-foreground">How Rankings Work:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Earn points by voting on products (+10 points)</li>
            <li>Add new products to earn bonus points (+25 points)</li>
            <li>Maintain voting streaks for extra rewards</li>
            <li>Unlock badges for special achievements</li>
            <li>Rankings update in real-time as you contribute</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
