import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, TrendingUp, Flame, Calendar, Users, Star, ArrowLeft } from 'lucide-react'
import { getQuadrant, QUADRANTS } from '@/lib/types'
import { BADGES } from '@convex/lib/gamification'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

function ProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="h-32 bg-muted animate-pulse rounded mb-6" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="h-48 bg-muted animate-pulse rounded" />
          <div className="h-48 bg-muted animate-pulse rounded" />
          <div className="h-48 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
}

/**
 * SSR-safe wrapper — hooks are only called inside ProfileContent
 * which is wrapped in a Suspense boundary.
 */
function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileContent />
    </Suspense>
  )
}

function ProfileContent() {
  const navigate = useNavigate()
  const user = useQuery(api.users.current)
  const profile = useQuery(api.profiles.getCurrent)
  const myVotes = useQuery(api.votes.getByUser, user ? { userId: user._id } : 'skip')
  const products = useQuery(api.products.list)

  // Redirect to login if not authenticated
  if (user === null) {
    navigate({ to: '/login' })
    return null
  }

  if (user === undefined || profile === undefined) {
    return <ProfileLoading />
  }

  // Calculate stats
  const totalVotes = myVotes?.length || 0
  const earnedBadges = profile?.badges || []
  const currentStreak = profile?.streak || 0

  // Get products created by user
  const myProducts = products?.filter(p => p.createdBy === user._id) || []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to G-Matrix
          </Link>
        </Button>

        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback className="text-2xl">
                  {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-1">{user.name || 'Anonymous User'}</h1>
                <p className="text-muted-foreground mb-4">{user.email}</p>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">{profile?.points || 0}</span>
                    <span className="text-muted-foreground">points</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold">{currentStreak}</span>
                    <span className="text-muted-foreground">day streak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold">{totalVotes}</span>
                    <span className="text-muted-foreground">votes cast</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-purple-500" />
                    <span className="font-semibold">{earnedBadges.length}</span>
                    <span className="text-muted-foreground">badges earned</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{profile?.points || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {profile?.totalVotes || 0} total votes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">{currentStreak}</div>
                <div className="text-sm text-muted-foreground">days</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Keep voting daily!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Votes:</span>
                  <span className="font-semibold">{totalVotes}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Products:</span>
                  <span className="font-semibold">{myProducts.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Badges, History, etc */}
        <Tabs defaultValue="badges" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="history">Vote History</TabsTrigger>
            <TabsTrigger value="products">My Products</TabsTrigger>
          </TabsList>

          {/* Badges Tab */}
          <TabsContent value="badges" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>
                  Earn badges by contributing to the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {BADGES.map((badge) => {
                    const isEarned = earnedBadges.includes(badge.id)
                    return (
                      <div
                        key={badge.id}
                        className={`p-4 rounded-lg border-2 ${
                          isEarned
                            ? 'border-primary bg-primary/5'
                            : 'border-muted bg-muted/30 opacity-50'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-4xl mb-2">{badge.icon}</div>
                          <div className="font-semibold text-sm mb-1">{badge.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {badge.description}
                          </div>
                          {isEarned && (
                            <Badge variant="secondary" className="mt-2">
                              Earned
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vote History Tab */}
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Votes</CardTitle>
                <CardDescription>
                  Your latest product ratings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myVotes && myVotes.length > 0 ? (
                  <div className="space-y-3">
                    {myVotes.slice(0, 20).map((vote) => {
                      const product = products?.find(p => p._id === vote.productId)
                      if (!product) return null

                      const quadrant = getQuadrant(vote.safety, vote.taste)
                      const quadrantInfo = QUADRANTS[quadrant]

                      return (
                        <div
                          key={vote._id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex-1">
                            <Link
                              to="/product/$name"
                              params={{ name: encodeURIComponent(product.name) }}
                              className="font-medium hover:underline"
                            >
                              {product.name}
                            </Link>
                            <div className="text-xs text-muted-foreground mt-1">
                              Safety: {vote.safety} • Taste: {vote.taste}
                              {vote.storeName && ` • ${vote.storeName}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="secondary"
                              style={{ backgroundColor: quadrantInfo.color, opacity: 0.7 }}
                            >
                              {quadrantInfo.name}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {new Date(vote.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No votes yet. Start rating products!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Products Tab */}
          <TabsContent value="products" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Products I Added</CardTitle>
                <CardDescription>
                  Products you've contributed to the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myProducts.length > 0 ? (
                  <div className="space-y-3">
                    {myProducts.map((product) => {
                      const quadrant = getQuadrant(product.averageSafety, product.averageTaste)
                      const quadrantInfo = QUADRANTS[quadrant]

                      return (
                        <div
                          key={product._id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex-1">
                            <Link
                              to="/product/$name"
                              params={{ name: encodeURIComponent(product.name) }}
                              className="font-medium hover:underline"
                            >
                              {product.name}
                            </Link>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                              <span>
                                <Users className="inline h-3 w-3 mr-1" />
                                {product.voteCount} votes
                              </span>
                              <span>
                                <Calendar className="inline h-3 w-3 mr-1" />
                                {new Date(product.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            style={{ backgroundColor: quadrantInfo.color, opacity: 0.7 }}
                          >
                            {quadrantInfo.name}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No products added yet. Be the first to add one!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
