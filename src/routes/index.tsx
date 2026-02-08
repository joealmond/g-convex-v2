import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Suspense, useState, useMemo, useRef, useEffect } from 'react'
import { ProductCard } from '@/components/feed/ProductCard'
import { FeedGrid } from '@/components/feed/FeedGrid'
import { FilterChips, type FilterType } from '@/components/feed/FilterChips'
import { MatrixChart } from '@/components/dashboard/MatrixChart'
import { Leaderboard } from '@/components/dashboard/Leaderboard'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { useGeolocation } from '@/hooks/use-geolocation'
import { Loader2, Trophy, Flame, TrendingUp, BarChart3, Grid3X3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Product } from '@/lib/types'

export const Route = createFileRoute('/')({
  component: HomePage,
})

/** SSR-safe skeleton shown while hooks hydrate on the client */
function HomePageSkeleton() {
  return (
    <div className="flex-1 container mx-auto px-4 py-6">
      <div className="space-y-4">
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * SSR-safe wrapper — hooks are only called inside HomePageContent
 * which is wrapped in a Suspense boundary.
 */
function HomePage() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePageContent />
    </Suspense>
  )
}

function HomePageContent() {
  const user = useQuery(api.users.current)
  const profile = useQuery(api.profiles.getCurrent)
  const products = useQuery(api.products.list)
  const { latitude, longitude, isLoading: geoLoading } = useGeolocation()

  const [filterType, setFilterType] = useState<FilterType>('all')
  const [viewMode, setViewMode] = useState<'feed' | 'chart'>('feed')
  const [chartMode, setChartMode] = useState<'vibe' | 'value'>('vibe')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // Refs for chart ↔ feed sync (scrolling to product cards)
  const productCardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const isLoading = products === undefined
  
  // Effect: When a product is selected in chart view, switch to feed and scroll to card
  useEffect(() => {
    if (selectedProduct && viewMode === 'feed') {
      const cardElement = productCardRefs.current.get(selectedProduct._id)
      if (cardElement) {
        setTimeout(() => {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100) // Delay to ensure DOM is ready
      }
    }
  }, [selectedProduct, viewMode])
  
  // Handler: When clicking a product card, switch to chart view and highlight
  const handleProductCardClick = (product: Product) => {
    setSelectedProduct(product)
    setViewMode('chart')
  }
  
  // Handler: When clicking a chart dot, switch to feed view and scroll to card
  const handleChartDotClick = (product: Product) => {
    setSelectedProduct(product)
    setViewMode('feed')
  }

  /**
   * Helper: calculate distance between user and product stores in km
   */
  const getProductDistance = (product: Product): number | undefined => {
    if (!latitude || !longitude || !product.stores || product.stores.length === 0) {
      return undefined
    }

    const distances = product.stores
      .filter((store) => store.geoPoint)
      .map((store) => {
        if (!store.geoPoint) return Infinity
        const latDiff = (store.geoPoint.lat - latitude) * 111.32 // km per degree latitude
        const lonDiff = (store.geoPoint.lng - longitude) * 111.32 * Math.cos((latitude * Math.PI) / 180)
        return Math.sqrt(latDiff ** 2 + lonDiff ** 2)
      })

    return distances.length > 0 ? Math.min(...distances) : undefined
  }

  /**
   * Filter and sort products based on selected filter
   */
  const filteredProducts = useMemo(() => {
    if (!products) return []

    let result = [...products]

    // Apply filters
    switch (filterType) {
      case 'recent':
        result.sort((a, b) => b.createdAt - a.createdAt)
        break
      case 'nearby':
        // Only show products with stores within 5km
        result = result.filter((p) => {
          const distance = getProductDistance(p)
          return distance !== undefined && distance <= 5
        })
        result.sort((a, b) => (getProductDistance(a) || Infinity) - (getProductDistance(b) || Infinity))
        break
      case 'trending':
        result.sort((a, b) => b.voteCount - a.voteCount)
        break
      case 'all':
      default:
        result.sort((a, b) => b.lastUpdated - a.lastUpdated)
        break
    }

    return result
  }, [products, filterType, latitude, longitude])

  return (
    <main className="flex-1 mx-auto px-4 py-6 max-w-7xl w-full">
      {/* Gamification Widgets for Logged-in Users */}
      {user && profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatsCard
            title="Your Points"
            value={profile.points}
            subtitle={`${profile.totalVotes} votes cast`}
            icon={<Trophy className="h-5 w-5 text-yellow-500" />}
          />
          <StatsCard
            title="Current Streak"
            value={`${profile.streak} days`}
            subtitle="Keep voting daily!"
            icon={<Flame className="h-5 w-5 text-orange-500" />}
          />
          <StatsCard
            title="Badges Earned"
            value={profile.badges?.length || 0}
            subtitle={`Keep contributing!`}
            icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
          />
        </div>
      )}

      {/* View Toggle Buttons */}
      <div className="flex gap-2 mb-6 justify-end">
        <Button
          onClick={() => setViewMode('feed')}
          variant={viewMode === 'feed' ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
        >
          <Grid3X3 className="h-4 w-4" />
          Feed
        </Button>
        <Button
          onClick={() => setViewMode('chart')}
          variant={viewMode === 'chart' ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Chart
        </Button>
      </div>

      {/* Feed View */}
      {viewMode === 'feed' && (
        <div className="space-y-4">
          {/* Filters */}
          <div>
            <FilterChips value={filterType} onChange={setFilterType} />
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <FeedGrid isEmpty={filteredProducts.length === 0}>
              {filteredProducts.map((product) => (
                <div 
                  key={product._id}
                  ref={(el) => {
                    if (el) {
                      productCardRefs.current.set(product._id, el)
                    } else {
                      productCardRefs.current.delete(product._id)
                    }
                  }}
                  onClick={() => handleProductCardClick(product)}
                  className="cursor-pointer"
                >
                  <ProductCard
                    product={product}
                    distanceKm={getProductDistance(product)}
                  />
                </div>
              ))}
            </FeedGrid>
          )}
        </div>
      )}

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Chart */}
          <div className="lg:col-span-2 bg-card rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">G-Matrix Visualization</h2>
              
              {/* Chart Mode Switcher */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setChartMode('vibe')}
                  variant={chartMode === 'vibe' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1.5"
                >
                  <span className="text-sm">🛡️</span>
                  Vibe
                </Button>
                <Button
                  onClick={() => setChartMode('value')}
                  variant={chartMode === 'value' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1.5"
                >
                  <span className="text-sm">💰</span>
                  Value
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-[500px]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : products && products.length > 0 ? (
              <div className="h-[500px]">
                <MatrixChart
                  products={products}
                  onProductClick={handleChartDotClick}
                  selectedProduct={selectedProduct}
                  mode={chartMode}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                <p className="text-lg mb-2">No products yet</p>
                <p className="text-sm">Add your first product to get started!</p>
              </div>
            )}
          </div>

          {/* Right: Leaderboard */}
          <div className="lg:col-span-1">
            <Leaderboard limit={10} />
          </div>
        </div>
      )}
    </main>
  )
}

