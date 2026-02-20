import { Link } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, TrendingUp, Star, Users } from 'lucide-react'
import { getQuadrant, QUADRANTS } from '@/lib/types'
import { appConfig } from '@/lib/app-config'

interface Activity {
  type: 'vote' | 'product'
  timestamp: number
  productId: string
  data: {
    safety?: number
    taste?: number
    storeName?: string
    price?: number
    name?: string
    voteCount?: number
  }
}

interface ProductSummary {
  _id: string
  name: string
}

interface ProfileActivityFeedProps {
  activities: Activity[]
  products: ProductSummary[]
  locale: string
  t: (key: string, params?: Record<string, string | number>) => string
}

/**
 * Recent contributions feed — votes and product additions
 */
export function ProfileActivityFeed({
  activities,
  products,
  locale,
  t,
}: ProfileActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">{t('profile.noActivity')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {activities.map((activity, idx) => {
        const product = products.find((p) => p._id === activity.productId)
        if (!product) return null

        if (activity.type === 'vote') {
          const quadrant = getQuadrant(
            activity.data.safety || 50,
            activity.data.taste || 50,
          )
          const quadrantInfo = QUADRANTS[quadrant]

          return (
            <Card key={`vote-${idx}`} className="rounded-xl shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      {t('profile.votedOn')}{' '}
                      <Link
                        to="/product/$name"
                        params={{ name: encodeURIComponent(product.name) }}
                        className="font-semibold hover:underline"
                      >
                        {product.name}
                      </Link>
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: quadrantInfo?.color || '#888',
                          color: '#fff',
                          opacity: 0.9,
                        }}
                      >
                        {appConfig.quadrants[quadrant as keyof typeof appConfig.quadrants]?.emoji}{' '}
                        {quadrantInfo?.name || 'Unknown'}
                      </Badge>
                      {activity.data.storeName && <span>• {activity.data.storeName}</span>}
                      <span>• {new Date(activity.timestamp).toLocaleDateString(locale)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        }

        // Product contribution
        return (
          <Card key={`product-${idx}`} className="rounded-xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <Star className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    {t('profile.added')}{' '}
                    <Link
                      to="/product/$name"
                      params={{ name: encodeURIComponent(product.name) }}
                      className="font-semibold hover:underline"
                    >
                      {product.name}
                    </Link>
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>
                      <Users className="inline h-3 w-3 mr-1" />
                      {activity.data.voteCount} {t('common.votes')}
                    </span>
                    <span>• {new Date(activity.timestamp).toLocaleDateString(locale)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
