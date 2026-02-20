import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Suspense, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RatingBars } from '@/components/product/RatingBars'
import { StoreList } from '@/components/product/StoreList'
import { VotingSheet } from '@/components/product/VotingSheet'
import { ReportProductDialog } from '@/components/product/ReportProductDialog'
import { ShareButton } from '@/components/product/ShareButton'
import { ProductChartTabs } from '@/components/product/ProductChartTabs'
import { StoreTagInput } from '@/components/dashboard/StoreTagInput'
import { DeleteProductButton } from '@/components/dashboard/DeleteProductButton'
import { EditProductDialog } from '@/components/dashboard/EditProductDialog'
import { ProductComments } from '@/components/product/ProductComments'
import { VoterList } from '@/components/admin/VoterList'
import { getQuadrant, QUADRANTS, type Product } from '@/lib/types'
import { appConfig } from '@/lib/app-config'
import { useAnonymousId } from '@/hooks/use-anonymous-id'
import { useAdmin } from '@/hooks/use-admin'
import { useImpersonate } from '@/hooks/use-impersonate'
import { useTranslation } from '@/hooks/use-translation'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { useHaptics } from '@/hooks/use-haptics'
import { enqueue } from '@/lib/offline-queue'
import { calculateVotePoints } from '@convex/lib/gamification'
import { ArrowLeft, Edit, Flag } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/product/$name')({
  component: ProductDetailPage,
})

function ProductDetailLoading() {
  return (
    <div className="flex-1 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-2xl" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}

function ProductDetailPage() {
  return (
    <Suspense fallback={<ProductDetailLoading />}>
      <ProductDetailContent />
    </Suspense>
  )
}

function ProductDetailContent() {
  const { t } = useTranslation()
  const { name } = Route.useParams()
  const navigate = useNavigate()
  const { anonId: anonymousId } = useAnonymousId()
  const adminStatus = useAdmin()
  const { startImpersonation } = useImpersonate()
  const { isOnline } = useOnlineStatus()

  const product = useQuery(api.products.getByName, { name: decodeURIComponent(name) })
  const user = useQuery(api.users.current)
  const castVote = useMutation(api.votes.cast)
  
  // Get all votes for this product (for All Votes tab)
  const allVotes = useQuery(
    api.votes.getByProduct,
    product ? { productId: product._id } : 'skip'
  )
  
  // Find user's vote if they have one
  const myVote = allVotes?.find(
    (v) =>
      (user && v.userId === user._id) ||
      (anonymousId && v.anonymousId === anonymousId)
  )

  const [storeTag, setStoreTag] = useState('')
  const [storeLat, setStoreLat] = useState<number | undefined>()
  const [storeLon, setStoreLon] = useState<number | undefined>()
  const [isVoting, setIsVoting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isReporting, setIsReporting] = useState(false)
  const { impact, notification } = useHaptics()

  const handleVote = async (safety: number, taste: number, price?: number) => {
    if (!product) return

    setIsVoting(true)
    try {
      const votePayload = {
        productId: product._id,
        safety,
        taste,
        price,
        anonymousId: anonymousId ?? undefined,
        storeName: storeTag || undefined,
        latitude: storeLat,
        longitude: storeLon,
      }

      if (!isOnline) {
        // Queue for later sync
        await enqueue('vote', votePayload as Record<string, unknown>)
        impact('light')
        toast.success('📋 ' + t('offline.voteSavedOffline'), {
          duration: 4000,
        })
      } else {
        await castVote(votePayload)
        impact('medium')

        // Calculate points earned and show gamification toast
        if (user) {
          const points = calculateVotePoints({
            hasPrice: price !== undefined,
            hasStore: !!storeTag,
            hasGPS: !!storeLat && !!storeLon,
          })

          // Build description with point breakdown
          const parts: string[] = []
          parts.push(t('voting.basePoints', { count: 10 }))
          if (price !== undefined) parts.push(t('voting.priceBonus', { count: 5 }))
          if (storeTag) parts.push(t('voting.storeBonus', { count: 10 }))
          if (storeLat && storeLon) parts.push(t('voting.gpsBonus', { count: 5 }))

          toast.success(`🎉 ${t('voting.voteSubmitted')}`, {
            description: `+${points} ${t('gamification.points')}! ${parts.join(' + ')}`,
            duration: 4000,
          })
        } else {
          toast.success(t('voting.voteSubmitted'), {
            description: `${appConfig.dimensions.axis1.label}: ${safety}, ${appConfig.dimensions.axis2.label}: ${taste}${price ? `, ${t('common.price')}: ${price}` : ''}`,
          })
        }
      }

      // Reset form
      setStoreTag('')
      setStoreLat(undefined)
      setStoreLon(undefined)
    } catch (error: unknown) {
      notification('error')
      toast.error(t('voting.voteFailed'), {
        description: error instanceof Error ? error.message : t('errors.generic'),
      })
    } finally {
      setIsVoting(false)
    }
  }

  const handleLocationCapture = (lat: number, lon: number) => {
    if (lat === 0 && lon === 0) {
      setStoreLat(undefined)
      setStoreLon(undefined)
    } else {
      setStoreLat(lat)
      setStoreLon(lon)
    }
  }

  const handleProductDeleted = () => {
    navigate({ to: '/' })
  }

  if (product === undefined) {
    return <ProductDetailLoading />
  }

  if (product === null) {
    return (
      <div className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">{t('product.notFound')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('product.notFoundDesc', { name: decodeURIComponent(name) })}
          </p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('nav.backToHome')}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const quadrant = getQuadrant(product.averageSafety, product.averageTaste)
  const quadrantInfo = QUADRANTS[quadrant]
  const priceScore = product.avgPrice ? (product.avgPrice / 5) * 100 : 0

  return (
    <main className="flex-1 px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button + Action Buttons */}
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('nav.back')}
            </Link>
          </Button>
          
          <div className="flex gap-2">
            <ShareButton
              productName={product.name}
              variant="ghost"
              size="sm"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReporting(true)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Flag className="mr-2 h-4 w-4" />
              {t('common.report')}
            </Button>
          </div>
        </div>

        {/* Admin Controls */}
        {adminStatus?.isAdmin && (
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </Button>
            <DeleteProductButton
              product={product as Product}
              onDeleted={handleProductDeleted}
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-white"
            />
          </div>
        )}

        {/* Hero Image */}
        {product.imageUrl && !product.imageUrl.startsWith('blob:') && (
          <div className="w-full h-80 overflow-hidden rounded-2xl bg-background flex items-center justify-center p-4">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Product Name + Quadrant Badge */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex-1 min-w-0 break-words">{product.name}</h1>
            {quadrantInfo && (
              <Badge
                className="text-white font-semibold px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap flex-shrink-0"
                style={{ backgroundColor: quadrantInfo.color }}
              >
                {quadrantInfo.emoji} {quadrantInfo.name}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {product.voteCount} {product.voteCount === 1 ? t('common.vote') : t('common.votes')}
          </p>
        </div>

        {/* Rating Bars */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">{t('product.ratings')}</CardTitle>
          </CardHeader>
          <CardContent>
            <RatingBars
              safety={product.averageSafety}
              taste={product.averageTaste}
              price={priceScore}
            />
          </CardContent>
        </Card>

        {/* Stores */}
        {product.stores && product.stores.length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">{t('product.whereToBuy')}</CardTitle>
            </CardHeader>
            <CardContent>
              <StoreList product={product as Product} />
            </CardContent>
          </Card>
        )}

        {/* Ingredients */}
        {product.ingredients && product.ingredients.length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">{t('product.ingredients')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {product.ingredients.map((ingredient, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="px-3 py-1 text-xs font-medium"
                  >
                    {ingredient}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Voting Section */}
        <Card className="shadow-card" data-voting-section>
          <CardHeader>
            <CardTitle className="text-lg">{t('product.rateThisProduct')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Store Location Input */}
            <div>
              <h4 className="font-semibold text-sm mb-3">{t('product.whereDidYouBuy')}</h4>
              <StoreTagInput
                value={storeTag}
                onChange={setStoreTag}
                onLocationCapture={handleLocationCapture}
                disabled={isVoting}
              />
            </div>

            {/* Voting Interface */}
            <VotingSheet 
              onVote={handleVote} 
              disabled={isVoting}
              averageSafety={product.averageSafety}
              averageTaste={product.averageTaste}
            />
          </CardContent>
        </Card>

        {/* Chart View with Tabs */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">{t('product.positionOnMatrix')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductChartTabs
              product={product}
              myVote={myVote}
              allVotesCount={allVotes?.length || 0}
              onVote={(safety: number, taste: number) => handleVote(safety, taste)}
              isVoting={isVoting}
              t={t}
            />
          </CardContent>
        </Card>

        {/* Comments / Reviews */}
        <ProductComments productId={product._id} />

        {/* Admin Voter List */}
        {adminStatus?.isAdmin && allVotes && (
          <VoterList
            votes={allVotes}
            onImpersonate={(userId) => startImpersonation(userId)}
          />
        )}
      </div>

      {/* Edit Dialog */}
      <EditProductDialog
        product={product as Product}
        open={isEditing}
        onOpenChange={setIsEditing}
      />

      {/* Report Dialog */}
      <ReportProductDialog
        productId={product._id}
        productName={product.name}
        open={isReporting}
        onOpenChange={setIsReporting}
      />
    </main>
  )
}
