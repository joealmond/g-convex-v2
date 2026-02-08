import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Suspense, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { VotingPanel } from '@/components/dashboard/VotingPanel'
import { FineTunePanel } from '@/components/dashboard/FineTunePanel'
import { StoreTagInput } from '@/components/dashboard/StoreTagInput'
import { CoordinateGrid } from '@/components/dashboard/CoordinateGrid'
import { getQuadrant, QUADRANTS, type Product } from '@/lib/types'
import { useAnonymousId } from '@/hooks/use-anonymous-id'
import { ArrowLeft, Users, TrendingUp, MapPin, Calendar, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { useAdmin } from '@/hooks/use-admin'
import { DeleteProductButton } from '@/components/dashboard/DeleteProductButton'
import { EditProductDialog } from '@/components/dashboard/EditProductDialog'

export const Route = createFileRoute('/product/$name')({
  component: ProductDetailPage,
})

function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="h-10 w-32 bg-muted animate-pulse rounded mb-6" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-[400px] bg-muted animate-pulse rounded" />
          <div className="h-[400px] bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
}

/**
 * SSR-safe wrapper — hooks are only called inside ProductDetailContent
 * which is wrapped in a Suspense boundary.
 */
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
  const votes = useQuery(api.votes.getByProduct, product ? { productId: product._id } : 'skip')
  const castVote = useMutation(api.votes.cast)

  const [storeTag, setStoreTag] = useState('')
  const [storeLat, setStoreLat] = useState<number | undefined>()
  const [storeLon, setStoreLon] = useState<number | undefined>()
  const [isVoting, setIsVoting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const handleVote = async (safety: number, taste: number) => {
    if (!product) return

    setIsVoting(true)
    try {
      await castVote({
        productId: product._id,
        safety,
        taste,
        anonymousId: anonymousId ?? undefined,
        storeName: storeTag || undefined,
        latitude: storeLat,
        longitude: storeLon,
      })

      toast.success('Vote submitted!', {
        description: `You rated "${product.name}" at Safety: ${safety}, Taste: ${taste}`,
      })

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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation & Admin Controls */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to G-Matrix
            </Link>
          </Button>

          {adminStatus?.isAdmin && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Product
              </Button>
              <DeleteProductButton 
                product={product as Product} 
                onDeleted={handleProductDeleted}
                className="glass hover:bg-destructive/20 text-destructive border-destructive/30"
              />
            </div>
          )}
        </div>

        {/* Product Header */}
        <div className="mb-8">
          {product.imageUrl && !product.imageUrl.startsWith('blob:') && (
            <div className="mb-6 flex justify-center rounded-xl overflow-hidden glass p-6 bg-black/20">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="max-h-[300px] w-full object-contain drop-shadow-lg" 
              />
            </div>
          )}

          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              {product.ingredients && (
                <p className="text-muted-foreground">{product.ingredients}</p>
              )}
            </div>
            <Badge
              variant="outline"
              className="text-lg px-4 py-2"
              style={{ backgroundColor: quadrantInfo?.color || '#cccccc', opacity: 0.8 }}
            >
              {quadrantInfo?.name || 'Unknown'}
            </Badge>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{product.voteCount} {product.voteCount === 1 ? 'vote' : 'votes'}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Safety: {product.averageSafety.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Taste: {product.averageTaste.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Added {new Date(product.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Left: Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Current Position</CardTitle>
              <CardDescription>
                Based on {product.voteCount} community {product.voteCount === 1 ? 'vote' : 'votes'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square">
                <CoordinateGrid
                  initialSafety={product.averageSafety}
                  initialTaste={product.averageTaste}
                  onVote={(safety: number, taste: number) => handleVote(safety, taste)}
                  disabled={isVoting}
                />
              </div>
            </CardContent>
          </Card>

          {/* Right: Voting Interface */}
          <div className="space-y-6">
            {/* Store Tag Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Where did you buy it?</CardTitle>
              </CardHeader>
              <CardContent>
                <StoreTagInput
                  value={storeTag}
                  onChange={setStoreTag}
                  onLocationCapture={handleLocationCapture}
                  disabled={isVoting}
                />
              </CardContent>
            </Card>

            {/* Voting Tabs */}
            <Tabs defaultValue="quick" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="quick">Quick Vote</TabsTrigger>
                <TabsTrigger value="finetune">Fine Tune</TabsTrigger>
              </TabsList>
              <TabsContent value="quick" className="mt-4">
                <VotingPanel onVote={handleVote} disabled={isVoting} />
              </TabsContent>
              <TabsContent value="finetune" className="mt-4">
                <FineTunePanel
                  onVote={handleVote}
                  disabled={isVoting}
                  initialSafety={product.averageSafety}
                  initialTaste={product.averageTaste}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Recent Votes */}
        {votes && votes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Votes</CardTitle>
              <CardDescription>
                See how others rated this product
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {votes.slice(0, 10).map((vote: any) => {
                  const voteQuadrant = getQuadrant(vote.safety, vote.taste)
                  const voteQuadrantInfo = QUADRANTS[voteQuadrant]

                  return (
                    <div
                      key={vote._id}
                      className="flex items-center gap-4 p-3 rounded-lg border"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {vote.userId ? 'U' : 'A'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {vote.userId ? 'Registered User' : 'Anonymous'}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{ backgroundColor: voteQuadrantInfo?.color || '#cccccc', opacity: 0.6 }}
                          >
                            {voteQuadrantInfo?.name || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Safety: {vote.safety} • Taste: {vote.taste}
                          {vote.storeName && (
                            <>
                              {' • '}
                              <MapPin className="inline h-3 w-3" />
                              {' '}{vote.storeName}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {new Date(vote.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <EditProductDialog 
        product={product as Product}
        open={isEditing}
        onOpenChange={setIsEditing}
      />
    </div>
  )
}
