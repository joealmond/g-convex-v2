/**
 * Challenges Page
 * Shows active and completed challenges
 */

import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useTranslation } from '@/hooks/use-translation'
import { ChallengeCard } from '@/components/dashboard/ChallengeCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Target } from 'lucide-react'

export const Route = createFileRoute('/challenges')({
  component: ChallengesPage,
})

function ChallengesPage() {
  const { t } = useTranslation()
  const activeChallenges = useQuery(api.challenges.getActiveChallenges)
  const userChallenges = useQuery(api.challenges.getUserChallenges)

  const activeChallengesWithProgress = activeChallenges?.map(challenge => {
    const userProgress = userChallenges?.find(uc => uc.challengeId === challenge._id)
    return { challenge, userProgress }
  }) ?? []

  const completedChallenges = activeChallengesWithProgress.filter(
    ({ userProgress }) => userProgress?.completed
  )

  const inProgressChallenges = activeChallengesWithProgress.filter(
    ({ userProgress }) => !userProgress?.completed
  )

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Trophy className="w-10 h-10 text-yellow-500" />
          {t('challenges.title')}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t('challenges.subtitle')}
        </p>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            {t('challenges.active')} ({inProgressChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            {t('challenges.completed')} ({completedChallenges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {inProgressChallenges.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t('challenges.noActive')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {inProgressChallenges.map(({ challenge, userProgress }) => (
                <ChallengeCard
                  key={challenge._id}
                  challenge={challenge}
                  userProgress={userProgress}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedChallenges.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t('challenges.noCompleted')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {completedChallenges.map(({ challenge, userProgress }) => (
                <ChallengeCard
                  key={challenge._id}
                  challenge={challenge}
                  userProgress={userProgress}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
