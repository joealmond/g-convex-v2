import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProductCard } from '@/components/dashboard/ProductCard'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Store, MapPin, Package, TrendingUp, ArrowLeft, Shield } from 'lucide-react'

export const Route = createFileRoute('/store/$name')({
  component: StoreProfilePage,
})

function StoreProfileLoading() {
  return (
    <div className="flex-1 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-10 w-64 bg-muted animate-pulse rounded" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

function StoreProfilePage() {
  return (
    <Suspense fallback={<StoreProfileLoading />}>
      <StoreProfileContent />
    </Suspense>
  )
}

function StoreProfileContent() {
  const { name: storeName } = Route.useParams()
  const decodedStoreName = decodeURIComponent(storeName)

  // Get all products
  const allProducts = useQuery(api.products.listAll)

  // Filter products that have this store
  const storeProducts =
    allProducts?.filter(
      (product) =>
        product.stores?.some(
          (store) =>
            store.name.toLowerCase() === decodedStoreName.toLowerCase()
        )
    ) || []

  // Calculate store stats
  const productCount = storeProducts.length
  const avgSafety =
    productCount > 0
      ? Math.round(
          storeProducts.reduce((sum, p) => sum + p.averageSafety, 0) /
            productCount
        )
      : 0
  const totalVotes = storeProducts.reduce((sum, p) => sum + p.voteCount, 0)

  // Get unique locations for this store
  const storeLocations = storeProducts.flatMap((product) => {
    const stores = product.stores?.filter(
      (store) => store.name.toLowerCase() === decodedStoreName.toLowerCase()
    )
    return stores?.filter((s) => s.geoPoint) || []
  })

  const uniqueLocations = Array.from(
    new Map(
      storeLocations.map((loc) => [
        `${loc.geoPoint?.lat},${loc.geoPoint?.lng}`,
        loc.geoPoint,
      ])
    ).values()
  ).length

  return (
    <main className="flex-1 px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <Store className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">
                {decodedStoreName}
              </h1>
            </div>
            <p className="text-muted-foreground">
              Community-rated products available at this location
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        {productCount > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatsCard
              title="Products"
              value={productCount}
              icon={<Package className="h-5 w-5 text-primary" />}
            />
            <StatsCard
              title="Total Votes"
              value={totalVotes}
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
            />
            <StatsCard
              title="Avg Safety"
              value={avgSafety}
              icon={<Shield className="h-5 w-5 text-primary" />}
            />
            <StatsCard
              title="Locations"
              value={uniqueLocations}
              icon={<MapPin className="h-5 w-5 text-primary" />}
            />
          </div>
        )}

        {/* Products List */}
        {productCount === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-foreground mb-2">
                No products found
              </p>
              <p className="text-sm text-muted-foreground">
                No one has tagged products from "{decodedStoreName}" yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>
                  Products at {decodedStoreName} ({productCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {storeProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  )
}
