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
import { StoreTagInput } from '@/components/dashboard/StoreTagInput'
import { CoordinateGrid } from '@/components/dashboard/CoordinateGrid'
import { DeleteProductButton } from '@/components/dashboard/DeleteProductButton'
import { EditProductDialog } from '@/components/dashboard/EditProductDialog'
import { getQuadrant, QUADRANTS, type Product } from '@/lib/types'
import { useAnonymousId } from '@/hooks/use-anonymous-id'
import { useAdmin } from '@/hooks/use-admin'
import { ArrowLeft, Users, Edit } from 'lucide-react'
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
  const { name } = Route.useParams()
  const navigate = useNavigate()
  const { anonId: anonymousId } = useAnonymousId()
  const adminStatus = useAdmin()

  const product = useQuery(api.products.getByName, { name: decodeURIComponent(name) })
  const user = useQuery(api.users.current)
  const castVote = useMutation(api.votes.cast)

  const [storeTag, setStoreTag] = useState('')
  const [storeLat, setStoreLat] = useState<number | undefined>()
  const [storeLon, setStoreLon] = useState<number | undefined>()
  const [isVoting, setIsVoting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const handleVote = async (safety: number, taste: number, price?: number) => {
    if (!product) return

    setIsVoting(true)
    try {
      await castVote({
        productId: product._id,
        safety,
        taste,
        price,
        anonymousId: anonymousId ?? undefined,
        storeName: storeTag || undefined,
        latitude: storeLat,
        longitude: storeLon,
      })

      // Calculate points earned (only for authenticated users)
      if (user) {
        let points = 10 // Base vote points
        if (price !== undefined) points += 5
        if (storeTag) points += 10
        if (storeLat && storeLon) points += 5

        toast.success('🎉 Vote submitted!', {
          description: `+${points} Scout Points earned!`,
          duration: 4000,
        })
      } else {
        toast.success('Vote submitted!', {
          description: `Safety: ${safety}, Taste: ${taste}${price ? `, Price: ${price}` : ''}`,
        })
      }

      // Reset form
      setStoreTag('')
      setStoreLat(undefined)
      setStoreLon(undefined)
    } catch (error: unknown) {
      toast.error('Failed to submit vote', {
        description: error instanceof Error ? error.message : 'Please try again later',
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
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-color-text-secondary mb-6">
            The product "{decodeURIComponent(name)}" doesn't exist.
          </p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
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
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>

        {/* Admin Controls */}
        {adminStatus?.isAdmin && (
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <DeleteProductButton
              product={product as Product}
              onDeleted={handleProductDeleted}
              className="text-destructive"
            />
          </div>
        )}

        {/* Hero Image */}
        {product.imageUrl && !product.imageUrl.startsWith('blob:') && (
          <div className="w-full max-h-64 overflow-hidden rounded-2xl bg-color-bg">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Product Name + Quadrant Badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-color-text mb-2">{product.name}</h1>
            <p className="text-sm text-color-text-secondary">
              {product.voteCount} {product.voteCount === 1 ? 'vote' : 'votes'}
            </p>
          </div>
          {quadrantInfo && (
            <Badge
              className="text-white font-semibold px-3 py-2 rounded-lg"
              style={{ backgroundColor: quadrantInfo.color }}
            >
              {quadrantInfo.name}
            </Badge>
          )}
        </div>

        {/* Rating Bars */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Ratings</CardTitle>
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
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Where to Buy</CardTitle>
            </CardHeader>
            <CardContent>
              <StoreList product={product as Product} />
            </CardContent>
          </Card>
        )}

        {/* Ingredients */}
        {product.ingredients && product.ingredients.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Ingredients</CardTitle>
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
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Rate This Product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Store Location Input */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Where did you buy it?</h4>
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

        {/* Coordinate Grid (Optional detailed view) */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Position on G-Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square max-w-sm mx-auto">
              <CoordinateGrid
                initialSafety={product.averageSafety}
                initialTaste={product.averageTaste}
                onVote={(safety: number, taste: number) => handleVote(safety, taste)}
                disabled={isVoting}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      {isEditing && (
        <EditProductDialog
          product={product as Product}
          onComplete={() => setIsEditing(false)}
        />
      )}
    </main>
  )
}
