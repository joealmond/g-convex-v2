'use client'

import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { Suspense, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, TrendingUp, Plus, Users } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'
import { getQuadrant, QUADRANTS } from '@/lib/types'
import { appConfig } from '@/lib/app-config'
import { cn } from '@/lib/utils'

// Infer the feed item type directly from the query return signature for strong typing.
import type { FunctionReturnType } from 'convex/server'
import { api } from '@convex/_generated/api'
type FeedQueryType = FunctionReturnType<typeof api.community.getCommunityFeed>
type FeedItem = NonNullable<FeedQueryType>[number]

export const Route = createFileRoute('/community')({
  component: CommunityPage,
})

function CommunityPageSkeleton() {
  return (
    <div className="flex-1 bg-background">
      <div className="max-w-2xl mx-auto w-full px-4 py-4 space-y-3">
        <div className="h-8 w-40 bg-muted animate-pulse rounded" />
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-muted animate-pulse rounded-full" />
          <div className="h-9 w-24 bg-muted animate-pulse rounded-full" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-card rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

function CommunityPage() {
  return (
    <Suspense fallback={<CommunityPageSkeleton />}>
      <CommunityContent />
    </Suspense>
  )
}

/**
 * Format relative time (e.g., "5m ago", "2h ago", "3d ago")
 */
function formatTimeAgo(timestamp: number, t: (key: string, params?: Record<string, string | number>) => string): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return t('community.justNow')
  if (minutes < 60) return t('community.minutesAgo', { count: minutes })
  if (hours < 24) return t('community.hoursAgo', { count: hours })
  return t('community.daysAgo', { count: days })
}

function CommunityContent() {
  const { t } = useTranslation()
  const user = useQuery(api.users.current)
  const [tab, setTab] = useState<'all' | 'following'>('all')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API types generated after `npx convex dev`
  const feed = useQuery((api as any).community?.getCommunityFeed, {
    limit: 30,
    followingOnly: tab === 'following',
    currentUserId: user?._id,
  })

  const isLoading = feed === undefined

  return (
    <div className="flex-1 bg-background">
      <div className="max-w-2xl mx-auto w-full px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">{t('community.title')}</h1>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('all')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-full transition-colors',
              tab === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-card'
            )}
          >
            <TrendingUp className="inline h-4 w-4 mr-1" />
            {t('community.feedTab')}
          </button>
          <button
            onClick={() => setTab('following')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-full transition-colors',
              tab === 'following'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-card'
            )}
          >
            <Users className="inline h-4 w-4 mr-1" />
            {t('community.followingTab')}
          </button>
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 bg-muted rounded-full" />
                  <div className="h-4 w-32 bg-muted rounded" />
                </div>
                <div className="h-4 w-full bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : feed && feed.length > 0 ? (
          <div className="space-y-3">
            {feed.map((item: FeedItem, idx: number) => (
              <FeedCard key={`${item.type}-${item.timestamp}-${idx}`} item={item} t={t} />
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl">
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {tab === 'following' ? t('community.emptyFollowing') : t('community.emptyFeed')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

/**
 * Individual feed card — renders differently based on activity type.
 */
function FeedCard({ item, t }: { item: FeedItem; t: (key: string, params?: Record<string, string | number>) => string }) {
  const userInitial = item.userId?.charAt(0)?.toUpperCase() || '?'
  const userLabel = `User #${item.userId?.slice(-6) || '???'}`

  return (
    <Card className="rounded-2xl shadow-sm border border-border overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Product thumbnail (if available) */}
          {item.productImage && (
            <Link
              to="/product/$name"
              params={{ name: encodeURIComponent(item.productName) }}
              className="flex-shrink-0"
            >
              <img
                src={item.productImage}
                alt={item.productName}
                className="h-12 w-12 rounded-lg object-contain bg-muted p-1"
              />
            </Link>
          )}

          <div className="flex-1 min-w-0">
            {/* User + timestamp row */}
            <div className="flex items-center gap-2 mb-1">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground truncate">{userLabel}</span>
              <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
                {formatTimeAgo(item.timestamp, t)}
              </span>
            </div>

            {/* Activity content */}
            {item.type === 'vote' && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm text-muted-foreground">{t('community.ratedAs')}</span>
                <Link
                  to="/product/$name"
                  params={{ name: encodeURIComponent(item.productName) }}
                  className="text-sm font-semibold text-foreground hover:underline truncate"
                >
                  {item.productName}
                </Link>
                {(() => {
                  const q = getQuadrant(item.safety, item.taste)
                  const qi = QUADRANTS[q]
                  const configQ = appConfig.quadrants[q as keyof typeof appConfig.quadrants]
                  return (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-2"
                      style={{ backgroundColor: qi?.color || '#888', color: '#fff' }}
                    >
                      {configQ?.emoji} {qi?.name}
                    </Badge>
                  )
                })()}
              </div>
            )}

            {item.type === 'product' && (
              <div className="flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{t('community.addedProduct')}</span>
                <Link
                  to="/product/$name"
                  params={{ name: encodeURIComponent(item.productName) }}
                  className="text-sm font-semibold text-foreground hover:underline truncate"
                >
                  {item.productName}
                </Link>
              </div>
            )}

            {item.type === 'comment' && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageCircle className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{t('community.commented')}</span>
                  <Link
                    to="/product/$name"
                    params={{ name: encodeURIComponent(item.productName) }}
                    className="text-sm font-semibold text-foreground hover:underline truncate"
                  >
                    {item.productName}
                  </Link>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 pl-5">
                  "{item.commentText}"
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
