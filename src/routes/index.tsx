import { createFileRoute } from '@tanstack/react-router'
import { useQuery, usePaginatedQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Suspense, useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { ProductCard } from '@/components/feed/ProductCard'
import { ProductStrip } from '@/components/feed/ProductStrip'
import { FeedGrid } from '@/components/feed/FeedGrid'
import { FilterChips } from '@/components/feed/FilterChips'
import type { FilterType } from '@/components/feed/FilterChips'
import { SensitivityFilterChips } from '@/components/feed/SensitivityFilterChips'
import { MatrixChart } from '@/components/dashboard/MatrixChart'
import { Leaderboard } from '@/components/dashboard/Leaderboard'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { useGeolocation } from '@/hooks/use-geolocation'
import { useAdmin } from '@/hooks/use-admin'
import { useTranslation } from '@/hooks/use-translation'
import { getNearbyRange } from '@/hooks/use-product-filter'
import { appConfig } from '@/lib/app-config'
import { Loader2, Trophy, Flame, TrendingUp, Star, BarChart3, Grid3X3, Search, X } from 'lucide-react'
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

/**
 * With boolean allergens, the active sensitivity IDs are directly the allergen IDs.
 * No mapping needed — just return them as an array.
 */
function buildExcludeAllergens(activeSensitivities: Set<string>): string[] {
  return Array.from(activeSensitivities)
}

function HomePageContent() {
  const { t } = useTranslation()
  const user = useQuery(api.users.current)
  const profile = useQuery(api.profiles.getCurrent)
  const { coords, requestLocation } = useGeolocation()
  const { isAdmin } = useAdmin()

  // Product count for stat card (same query as profile page)
  const myProducts = useQuery(api.products.getByCreator, user ? { userId: user._id } : 'skip')

  // GPS
  const latitude = coords?.latitude
  const longitude = coords?.longitude

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  // ── Filter state ──
  const [filterType, setFilterType] = useState<FilterType>('nearby')
  const [searchQuery, setSearchQuery] = useState('')
  const [nearbyRange, setNearbyRange] = useState(1)

  // Initialize nearby range from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') setNearbyRange(getNearbyRange())
  }, [])

  // ── Sensitivity filter state ──
  // Default: the niche's primary allergen (gluten) is always ON.
  // If user has a dietary profile, override with their saved preferences.
  const nicheDefault = useMemo(() => new Set([appConfig.riskConcept]), [])
  const dietaryProfile = useQuery(api.dietaryProfiles.getUserProfile)
  const [activeSensitivities, setActiveSensitivities] = useState<Set<string>>(nicheDefault)
  const [userHasToggled, setUserHasToggled] = useState(false)

  // Reactively derive filters from profile whenever it changes.
  // Stops overriding once the user manually toggles a chip.
  useEffect(() => {
    if (userHasToggled) return // user manually adjusted — respect their choice
    if (dietaryProfile === undefined) return // still loading (or re-subscribing after auth)
    if (dietaryProfile) {
      const allergenIds = new Set<string>()
      if (dietaryProfile.avoidedAllergens && dietaryProfile.avoidedAllergens.length > 0) {
        for (const a of dietaryProfile.avoidedAllergens) allergenIds.add(a)
      }
      // Legacy field: conditions = [{ type: 'celiac', severity: 3 }, ...]
      if (dietaryProfile.conditions && dietaryProfile.conditions.length > 0) {
        const conditionMap: Record<string, string> = {
          celiac: 'gluten', 'gluten-sensitive': 'gluten',
          lactose: 'milk', soy: 'soy', nut: 'nuts',
        }
        for (const c of dietaryProfile.conditions) {
          const mapped = conditionMap[c.type]
          if (mapped) allergenIds.add(mapped)
        }
      }
      if (allergenIds.size > 0) {
        setActiveSensitivities(allergenIds)
        return
      }
    }
    // null (not logged in or no dietary preferences) → niche default
    setActiveSensitivities(nicheDefault)
  }, [dietaryProfile, userHasToggled, nicheDefault])

  const toggleSensitivity = useCallback((id: string) => {
    setUserHasToggled(true)
    setActiveSensitivities((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const excludeAllergens = useMemo(
    () => buildExcludeAllergens(activeSensitivities),
    [activeSensitivities]
  )

  // ── Feed mode determines which query to use ──
  const feedMode = filterType === 'trending' ? 'trending' as const : 'recent' as const
  const isSearchMode = filterType === 'all' && searchQuery.trim().length > 0
  const isNearbyMode = filterType === 'nearby'

  // Paginated feed query (recent / trending)
  const feedResult = usePaginatedQuery(
    api.products.listFeed,
    !isSearchMode && !isNearbyMode
      ? { mode: feedMode, excludeAllergens: excludeAllergens.length > 0 ? excludeAllergens : undefined }
      : 'skip',
    { initialNumItems: 20 }
  )

  // Paginated search query
  const searchResult = usePaginatedQuery(
    api.products.searchPaginated,
    isSearchMode
      ? { query: searchQuery, excludeAllergens: excludeAllergens.length > 0 ? excludeAllergens : undefined }
      : 'skip',
    { initialNumItems: 20 }
  )

  // Nearby (geospatial — already limited, stays as-is)
  const nearbyProducts = useQuery(
    api.products.getNearbyProducts,
    isNearbyMode && latitude && longitude
      ? { latitude, longitude, radiusInMeters: nearbyRange * 1000, limit: 40 }
      : 'skip'
  )

  // For chart view, we still need all products
  const allProductsForChart = useQuery(api.products.listAll)

  // ── Derived data ──
  const { displayProducts, displayLoading, displayCanLoadMore, displayLoadMore, displayIsLoadingMore } = useMemo(() => {
    if (isNearbyMode) {
      // Nearby: client-side allergen filtering on small set
      let items = (nearbyProducts ?? []) as Product[]
      if (excludeAllergens.length > 0) {
        items = items.filter((p) => {
          if (!p.allergens || p.allergens.length === 0) return true
          return !p.allergens.some((a) => excludeAllergens.includes(a.toLowerCase()))
        })
      }
      return {
        displayProducts: items,
        displayLoading: nearbyProducts === undefined,
        displayCanLoadMore: false,
        displayLoadMore: () => {},
        displayIsLoadingMore: false,
      }
    }

    if (isSearchMode) {
      return {
        displayProducts: searchResult.results as Product[],
        displayLoading: searchResult.status === 'LoadingFirstPage',
        displayCanLoadMore: searchResult.status === 'CanLoadMore',
        displayLoadMore: () => searchResult.loadMore(20),
        displayIsLoadingMore: searchResult.status === 'LoadingMore',
      }
    }

    // recent / trending
    return {
      displayProducts: feedResult.results as Product[],
      displayLoading: feedResult.status === 'LoadingFirstPage',
      displayCanLoadMore: feedResult.status === 'CanLoadMore',
      displayLoadMore: () => feedResult.loadMore(20),
      displayIsLoadingMore: feedResult.status === 'LoadingMore',
    }
  }, [isNearbyMode, isSearchMode, nearbyProducts, searchResult, feedResult, excludeAllergens])

  // Fallback: if nearby has no GPS, show recent feed instead
  const showNearbyFallback = isNearbyMode && !latitude && !longitude
  const fallbackFeed = usePaginatedQuery(
    api.products.listFeed,
    showNearbyFallback
      ? { mode: 'recent' as const, excludeAllergens: excludeAllergens.length > 0 ? excludeAllergens : undefined }
      : 'skip',
    { initialNumItems: 20 }
  )

  const finalProducts = showNearbyFallback ? (fallbackFeed.results as Product[]) : displayProducts
  const finalLoading = showNearbyFallback ? fallbackFeed.status === 'LoadingFirstPage' : displayLoading
  const finalCanLoadMore = showNearbyFallback ? fallbackFeed.status === 'CanLoadMore' : displayCanLoadMore
  const finalLoadMore = showNearbyFallback ? () => fallbackFeed.loadMore(20) : displayLoadMore
  const finalIsLoadingMore = showNearbyFallback ? fallbackFeed.status === 'LoadingMore' : displayIsLoadingMore

  const useCardLayout = filterType !== 'all'

  // ── View state ──
  const [viewMode, setViewMode] = useState<'feed' | 'chart'>('feed')
  const [chartMode, setChartMode] = useState<'vibe' | 'value'>('vibe')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const productCardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    if (value.trim()) setFilterType('all')
  }, [])

  const handleClearSearch = () => {
    setSearchQuery('')
    searchInputRef.current?.focus()
  }

  const handleFilterChange = useCallback((f: FilterType) => {
    setFilterType(f)
    if (f !== 'all') setSearchQuery('')
  }, [])

  // Distance helper for nearby products
  const getDistance = useCallback(
    (product: Product) => {
      const np = nearbyProducts?.find((p) => p._id === product._id)
      return np?.distance ? np.distance / 1000 : undefined // convert m → km
    },
    [nearbyProducts]
  )

  useEffect(() => {
    if (selectedProduct && viewMode === 'feed') {
      const cardElement = productCardRefs.current.get(selectedProduct._id)
      if (cardElement) {
        setTimeout(() => cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
      }
    }
  }, [selectedProduct, viewMode])

  const handleChartDotClick = (product: Product) => {
    setSelectedProduct(product)
    setViewMode('feed')
  }

  return (
    <main className="flex-1 mx-auto px-2 sm:px-4 pb-4 sm:pb-6 max-w-7xl w-full">
      {/* Search Bar + View Toggle — sticky, sits directly under the notch safe area */}
      <div className="sticky top-0 md:top-[3.5rem] z-[40] bg-background -mx-2 px-2 sm:-mx-4 sm:px-4 pb-3">
        <div className="flex items-center gap-2 pt-1">
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

        {/* Filter Chips — feed type + sensitivity, balanced padding */}
        <div className="pt-3 space-y-2">
          <FilterChips
            value={filterType}
            onChange={handleFilterChange}
            nearbyRange={nearbyRange}
            onRangeChange={setNearbyRange}
          />
          <SensitivityFilterChips
            activeFilters={activeSensitivities}
            onToggle={toggleSensitivity}
          />
        </div>
      </div>

      {/* Gamification Widgets for Logged-in Users */}
      {user && profile && (
        <div className="flex gap-2 mb-3 md:grid md:grid-cols-4 md:gap-4 md:mb-6">
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
          <StatsCard
            title={t('stats.products')}
            value={myProducts?.length ?? 0}
            subtitle={t('stats.productsAdded', { count: myProducts?.length ?? 0 })}
            icon={<Star className="h-5 w-5 text-primary" />}
          />
        </div>
      )}

      {/* Feed View */}
      {viewMode === 'feed' && (
        <div className="space-y-3">
          {finalLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : useCardLayout ? (
            <FeedGrid isEmpty={finalProducts.length === 0}>
              {finalProducts.map((product) => (
                <div
                  key={product._id}
                  ref={(el) => {
                    if (el) productCardRefs.current.set(product._id, el)
                    else productCardRefs.current.delete(product._id)
                  }}
                  className="cursor-pointer"
                >
                  <ProductCard
                    product={product}
                    distanceKm={isNearbyMode ? getDistance(product) : undefined}
                    isAdmin={isAdmin}
                    avoidedAllergens={excludeAllergens}
                  />
                </div>
              ))}
            </FeedGrid>
          ) : (
            finalProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-muted-foreground text-sm mb-2">
                  {searchQuery ? t('feed.noProductsMatching', { query: searchQuery }) : t('feed.noProductsFound')}
                </p>
                <p className="text-xs text-muted-foreground">{t('feed.tryDifferentSearch')}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {finalProducts.map((product) => (
                  <ProductStrip
                    key={product._id}
                    product={product}
                    highlight={searchQuery}
                  />
                ))}
              </div>
            )
          )}

          {/* Load More button */}
          {finalCanLoadMore && (
            <div className="flex justify-center pt-4 pb-2">
              <Button
                onClick={finalLoadMore}
                variant="outline"
                className="rounded-xl gap-2"
                disabled={finalIsLoadingMore}
              >
                {finalIsLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('feed.loadingMore')}
                  </>
                ) : (
                  t('feed.loadMore')
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 bg-card rounded-2xl shadow-sm p-3 sm:p-6">
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

            {allProductsForChart === undefined ? (
              <div className="flex items-center justify-center h-[280px] sm:h-[380px] lg:h-[460px]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : allProductsForChart.length > 0 ? (
              <div className="h-[280px] sm:h-[380px] lg:h-[460px] min-h-[250px]">
                <MatrixChart
                  products={allProductsForChart}
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

