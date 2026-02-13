import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Suspense, useState, useRef, useEffect } from 'react'
import { ProductCard } from '@/components/feed/ProductCard'
import { ProductStrip } from '@/components/feed/ProductStrip'
import { FeedGrid } from '@/components/feed/FeedGrid'
import { FilterChips } from '@/components/feed/FilterChips'
import { MatrixChart } from '@/components/dashboard/MatrixChart'
import { Leaderboard } from '@/components/dashboard/Leaderboard'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { useGeolocation } from '@/hooks/use-geolocation'
import { useAdmin } from '@/hooks/use-admin'
import { useTranslation } from '@/hooks/use-translation'
import { useProductFilter } from '@/hooks/use-product-filter'
import { Loader2, Trophy, Flame, TrendingUp, BarChart3, Grid3X3, Search, X } from 'lucide-react'
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
  const { t } = useTranslation()
  const user = useQuery(api.users.current)
  const profile = useQuery(api.profiles.getCurrent)
  const products = useQuery(api.products.listAll)
  const { coords, requestLocation } = useGeolocation()
  const { isAdmin } = useAdmin()

  // Extract lat/lon from coords for convenience
  const latitude = coords?.latitude
  const longitude = coords?.longitude

  // Request location on mount (needed for "Nearby" filter)
  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  const {
    filterType,
    searchQuery,
    filteredProducts,
    useCardLayout,
    handleSearchChange,
    clearSearch,
    handleFilterChange,
    getDistance,
  } = useProductFilter({ products, latitude, longitude })

  const [viewMode, setViewMode] = useState<'feed' | 'chart'>('feed')
  const [chartMode, setChartMode] = useState<'vibe' | 'value'>('vibe')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Refs for chart ↔ feed sync (scrolling to product cards)
  const productCardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const isLoading = products === undefined

  // When clearing search, refocus the input
  const handleClearSearch = () => {
    clearSearch()
    searchInputRef.current?.focus()
  }
  
  // Effect: When a product is selected in chart view, switch to feed and scroll to card
  useEffect(() => {
    if (selectedProduct && viewMode === 'feed') {
      const cardElement = productCardRefs.current.get(selectedProduct._id)
      if (cardElement) {
        setTimeout(() => {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
    }
  }, [selectedProduct, viewMode])
  
  const handleProductCardClick = (product: Product) => {
    setSelectedProduct(product)
    setViewMode('chart')
  }
  
  const handleChartDotClick = (product: Product) => {
    setSelectedProduct(product)
    setViewMode('feed')
  }

  return (
    <main className="flex-1 mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl w-full">
      {/* Search Bar + View Toggle — sticky at top on mobile */}
      <div className="sticky top-[calc(env(safe-area-inset-top,0px))] md:top-[calc(env(safe-area-inset-top,0px)+3.5rem)] z-[40] bg-background -mx-2 px-2 sm:-mx-4 sm:px-4 pb-2">
        <div className="flex items-center gap-2 pt-2">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t('feed.searchProducts')}
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex gap-1">
          <Button
            onClick={() => setViewMode('feed')}
            variant={viewMode === 'feed' ? 'default' : 'outline'}
            size="icon"
            className="h-10 w-10 rounded-xl"
            title={t('feed.feedView')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setViewMode('chart')}
            variant={viewMode === 'chart' ? 'default' : 'outline'}
            size="icon"
            className="h-10 w-10 rounded-xl"
            title={t('feed.chartView')}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
        </div>

        {/* Filter Chips — sticky under search, visible in both views */}
        <div className="pt-3">
          <FilterChips value={filterType} onChange={handleFilterChange} />
        </div>
      </div>

      {/* Gamification Widgets for Logged-in Users */}
      {user && profile && (
        <div className="flex gap-2 mb-3 md:grid md:grid-cols-3 md:gap-4 md:mb-6">
          <StatsCard
            title={t('stats.yourPoints')}
            value={profile.points}
            subtitle={t('stats.votesCast', { count: profile.totalVotes })}
            icon={<Trophy className="h-5 w-5 text-yellow-500" />}
          />
          <StatsCard
            title={t('stats.currentStreak')}
            value={t('stats.daysStreak', { count: profile.streak })}
            subtitle={t('stats.keepVoting')}
            icon={<Flame className="h-5 w-5 text-orange-500" />}
          />
          <StatsCard
            title={t('stats.badgesEarned')}
            value={profile.badges?.length || 0}
            subtitle={t('stats.keepContributing')}
            icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
          />
        </div>
      )}

      {/* Feed View */}
      {viewMode === 'feed' && (
        <div className="space-y-3">
          {/* Products */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : useCardLayout ? (
            /* Card Grid for recent / trending / nearby */
            <FeedGrid isEmpty={filteredProducts.length === 0}>
              {filteredProducts.map((product) => (
                <div 
                  key={product._id}
                  ref={(el) => {
                    if (el) productCardRefs.current.set(product._id, el)
                    else productCardRefs.current.delete(product._id)
                  }}
                  onClick={() => handleProductCardClick(product)}
                  className="cursor-pointer"
                >
                  <ProductCard
                    product={product}
                    distanceKm={getDistance(product)}
                    isAdmin={isAdmin}
                  />
                </div>
              ))}
            </FeedGrid>
          ) : (
            /* Strip/list view for "all" (search mode) */
            filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-muted-foreground text-sm mb-2">
                  {searchQuery ? t('feed.noProductsMatching', { query: searchQuery }) : t('feed.noProductsFound')}
                </p>
                <p className="text-xs text-muted-foreground">{t('feed.tryDifferentSearch')}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredProducts.map((product) => (
                  <ProductStrip
                    key={product._id}
                    product={product}
                    distanceKm={getDistance(product)}
                    highlight={searchQuery}
                  />
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 bg-card rounded-2xl shadow-sm p-3 sm:p-6">
            {/* Title + mode toggle — stacks vertically on narrow screens */}
            <div className="flex items-center justify-between mb-2 sm:mb-4 gap-2">
              <h2 className="text-base sm:text-xl font-semibold truncate">{t('chart.gMatrix')}</h2>
              <div className="flex gap-1.5 flex-shrink-0">
                <Button
                  onClick={() => setChartMode('vibe')}
                  variant={chartMode === 'vibe' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1 px-2.5 sm:px-3 h-8 text-xs sm:text-sm"
                >
                  🛡️ {t('chart.vibe')}
                </Button>
                <Button
                  onClick={() => setChartMode('value')}
                  variant={chartMode === 'value' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1 px-2.5 sm:px-3 h-8 text-xs sm:text-sm"
                >
                  💰 {t('chart.value')}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-[280px] sm:h-[380px] lg:h-[460px]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : products && products.length > 0 ? (
              <div className="h-[280px] sm:h-[380px] lg:h-[460px] min-h-[250px]">
                <MatrixChart
                  products={products}
                  onProductClick={handleChartDotClick}
                  selectedProduct={selectedProduct}
                  mode={chartMode}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[280px] sm:h-[380px] lg:h-[460px] text-muted-foreground">
                <p className="text-lg mb-2">{t('chart.noProductsYet')}</p>
                <p className="text-sm">{t('chart.addFirstProduct')}</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <Leaderboard limit={10} />
          </div>
        </div>
      )}
    </main>
  )
}

