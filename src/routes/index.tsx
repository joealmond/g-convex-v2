import { createFileRoute } from '@tanstack/react-router'
import { useQuery, usePaginatedQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Suspense, lazy, useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { ProductCard } from '@/components/feed/ProductCard'
import { FeedGrid } from '@/components/feed/FeedGrid'
import { FilterChips } from '@/components/feed/FilterChips'
import { QuadrantFilterChips } from '@/components/feed/QuadrantFilterChips'
import type { FilterType } from '@/components/feed/FilterChips'
import { SensitivityFilterChips } from '@/components/feed/SensitivityFilterChips'
import { useGeolocation } from '@/hooks/use-geolocation'
import { useAdmin } from '@/hooks/use-admin'
import { useTranslation } from '@/hooks/use-translation'
import { useNearbyRangeState } from '@/hooks/use-product-filter'
import { useSessionSensitivityFilters } from '@/hooks/use-session-sensitivity-filters'
import { appConfig } from '@/lib/app-config'
import { isIOS, isWeb } from '@/lib/platform'
import {
  computeSafetyDisplayMeta,
  deriveSafetyDisplayState,
  type AllergenScoresMap,
} from '@/lib/score-utils'
import { getQuadrant, type Quadrant } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Loader2, Trophy, Flame, TrendingUp, Star, BarChart3, Grid3X3, Search, X, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Product } from '@/lib/types'

const MatrixChart = lazy(() =>
  import('@/components/dashboard/MatrixChart').then((module) => ({ default: module.MatrixChart }))
)
const ProductStrip = lazy(() =>
  import('@/components/feed/ProductStrip').then((module) => ({ default: module.ProductStrip }))
)
const StatsCard = lazy(() =>
  import('@/components/dashboard/StatsCard').then((module) => ({ default: module.StatsCard }))
)

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

function ChartLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[320px] rounded-2xl border border-border bg-card">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
        <p className="text-sm text-muted-foreground">Loading chart...</p>
      </div>
    </div>
  )
}

function HomeWidgetsFallback() {
  return (
    <div className="flex gap-2 mb-3 md:grid md:grid-cols-4 md:gap-4 md:mb-6">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="h-24 rounded-2xl bg-card border border-border animate-pulse" />
      ))}
    </div>
  )
}

function StripLoadingFallback() {
  return (
    <div className="space-y-1.5">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="h-24 rounded-2xl bg-card border border-border animate-pulse" />
      ))}
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

function getProductDistanceKm(product: Product, latitude?: number, longitude?: number): number | undefined {
  if (!latitude || !longitude || !product.stores || product.stores.length === 0) {
    return undefined
  }

  const distances = product.stores
    .filter((store) => store.geoPoint)
    .map((store) => {
      if (!store.geoPoint) return Infinity
      const latDiff = (store.geoPoint.lat - latitude) * 111.32
      const lonDiff =
        (store.geoPoint.lng - longitude) * 111.32 * Math.cos((latitude * Math.PI) / 180)
      return Math.sqrt(latDiff ** 2 + lonDiff ** 2)
    })

  return distances.length > 0 ? Math.min(...distances) : undefined
}

function HomePageContent() {
  const { t } = useTranslation()
  const user = useQuery(api.users.current)
  const profile = useQuery(api.profiles.getCurrent)
  const { coords } = useGeolocation()
  const { isAdmin } = useAdmin()
  const isBrowser = isWeb()

  // Product count for stat card (same query as profile page)
  const myProducts = useQuery(api.products.getByCreator, user ? { userId: user._id } : 'skip')

  // GPS
  const latitude = coords?.latitude
  const longitude = coords?.longitude

  // ── Filter state ──
  const [filterType, setFilterType] = useState<FilterType>('nearby')
  const [searchQuery, setSearchQuery] = useState('')
  const [nearbyRange, setNearbyRange] = useNearbyRangeState()
  const [quadrantFilter, setQuadrantFilter] = useState<Quadrant | null>(null)
  const [showNeedsReviewOnly, setShowNeedsReviewOnly] = useState(false)

  // ── Sensitivity filter state ──
  // Default: the niche's primary allergen (gluten) is always ON.
  // If user has a dietary profile, override with their saved preferences.
  const nicheDefault = useMemo(() => new Set([appConfig.riskConcept]), [])
  const dietaryProfile = useQuery(api.dietaryProfiles.getUserProfile)

  const derivedSensitivities = useMemo(() => {
    if (dietaryProfile === undefined || dietaryProfile === null) return nicheDefault

    const allergenIds = new Set<string>()
    if (dietaryProfile.avoidedAllergens && dietaryProfile.avoidedAllergens.length > 0) {
      for (const allergenId of dietaryProfile.avoidedAllergens) allergenIds.add(allergenId)
    }

    if (dietaryProfile.conditions && dietaryProfile.conditions.length > 0) {
      const conditionMap: Record<string, string> = {
        celiac: 'gluten',
        'gluten-sensitive': 'gluten',
        lactose: 'milk',
        soy: 'soy',
        nut: 'nuts',
      }
      for (const condition of dietaryProfile.conditions) {
        const mapped = conditionMap[condition.type]
        if (mapped) allergenIds.add(mapped)
      }
    }

    return allergenIds.size > 0 ? allergenIds : nicheDefault
  }, [dietaryProfile, nicheDefault])

  const { activeFilters: activeSensitivities, toggleFilter: toggleSensitivity } =
    useSessionSensitivityFilters(derivedSensitivities)

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

  // For chart view, we still need all products
  const allProductsForChart = useQuery(api.products.listAll)

  const matchesNeedsReview = useCallback((product: Product) => {
    const safetyMeta = computeSafetyDisplayMeta(
      (product.allergenScores as AllergenScoresMap | undefined) ?? undefined,
      excludeAllergens,
    )
    return deriveSafetyDisplayState(safetyMeta.score, safetyMeta.voteCount) === 'needs-review'
  }, [excludeAllergens])

  const shouldIncludeWithAllergenFilter = useCallback((product: Product) => {
    if (excludeAllergens.length === 0) return true
    if (matchesNeedsReview(product)) return true
    if (!product.allergens || product.allergens.length === 0) return false
    return !product.allergens.some((allergen) => excludeAllergens.includes(allergen.toLowerCase()))
  }, [excludeAllergens, matchesNeedsReview])

  const moveNeedsReviewToBottom = useCallback((items: Product[]) => {
    const confirmed: Product[] = []
    const review: Product[] = []

    for (const item of items) {
      if (matchesNeedsReview(item)) {
        review.push(item)
      } else {
        confirmed.push(item)
      }
    }

    return [...confirmed, ...review]
  }, [matchesNeedsReview])

  // ── Derived data ──
  const { displayProducts, displayLoading, displayCanLoadMore, displayLoadMore, displayIsLoadingMore } = useMemo(() => {
    const applyDisplayFilters = (items: Product[]) => {
      let filtered = items
      if (showNeedsReviewOnly) {
        filtered = filtered.filter(matchesNeedsReview)
      }
      if (quadrantFilter) {
        filtered = filtered.filter((product) => getQuadrant(product.averageSafety, product.averageTaste) === quadrantFilter)
      }
      return moveNeedsReviewToBottom(filtered)
    }

    if (isNearbyMode) {
      let items = [...(allProductsForChart ?? [])]
      items = items.filter((product) => {
        const distance = getProductDistanceKm(product, latitude, longitude)
        return distance !== undefined && distance <= nearbyRange
      })
      items.sort(
        (a, b) =>
          (getProductDistanceKm(a, latitude, longitude) || Infinity) -
          (getProductDistanceKm(b, latitude, longitude) || Infinity)
      )

      if (excludeAllergens.length > 0) {
        items = items.filter(shouldIncludeWithAllergenFilter)
      }
      items = applyDisplayFilters(items)
      return {
        displayProducts: items,
        displayLoading: allProductsForChart === undefined,
        displayCanLoadMore: false,
        displayLoadMore: () => {},
        displayIsLoadingMore: false,
      }
    }

    if (isSearchMode) {
      return {
        displayProducts: applyDisplayFilters(searchResult.results as Product[]),
        displayLoading: searchResult.status === 'LoadingFirstPage',
        displayCanLoadMore: searchResult.status === 'CanLoadMore',
        displayLoadMore: () => searchResult.loadMore(20),
        displayIsLoadingMore: searchResult.status === 'LoadingMore',
      }
    }

    // recent / trending
    return {
      displayProducts: applyDisplayFilters(feedResult.results as Product[]),
      displayLoading: feedResult.status === 'LoadingFirstPage',
      displayCanLoadMore: feedResult.status === 'CanLoadMore',
      displayLoadMore: () => feedResult.loadMore(20),
      displayIsLoadingMore: feedResult.status === 'LoadingMore',
    }
  }, [isNearbyMode, isSearchMode, allProductsForChart, searchResult, feedResult, excludeAllergens, quadrantFilter, latitude, longitude, nearbyRange, showNeedsReviewOnly, matchesNeedsReview, shouldIncludeWithAllergenFilter, moveNeedsReviewToBottom])

  // Fallback: if nearby has no GPS, show recent feed instead
  const showNearbyFallback = isNearbyMode && !latitude && !longitude
  const fallbackFeed = usePaginatedQuery(
    api.products.listFeed,
    showNearbyFallback
      ? { mode: 'recent' as const, excludeAllergens: excludeAllergens.length > 0 ? excludeAllergens : undefined }
      : 'skip',
    { initialNumItems: 20 }
  )

  const finalProducts = showNearbyFallback
    ? moveNeedsReviewToBottom((fallbackFeed.results as Product[]).filter((product) =>
        (!showNeedsReviewOnly || matchesNeedsReview(product))
        && (!quadrantFilter
          ? true
          : getQuadrant(product.averageSafety, product.averageTaste) === quadrantFilter)
      ))
    : displayProducts

  const toggleQuadrantFilter = useCallback((quadrant: Quadrant) => {
    setQuadrantFilter((previous) => (previous === quadrant ? null : quadrant))
  }, [])

  const finalLoading = showNearbyFallback ? fallbackFeed.status === 'LoadingFirstPage' : displayLoading
  const finalCanLoadMore = showNearbyFallback ? fallbackFeed.status === 'CanLoadMore' : displayCanLoadMore
  const finalLoadMore = showNearbyFallback ? () => fallbackFeed.loadMore(20) : displayLoadMore
  const finalIsLoadingMore = showNearbyFallback ? fallbackFeed.status === 'LoadingMore' : displayIsLoadingMore
  const filteredChartProducts = finalProducts

  const useCardLayout = filterType !== 'all'

  // ── View state ──
  const [viewMode, setViewMode] = useState<'feed' | 'chart'>('feed')
  const [chartMode, setChartMode] = useState<'vibe' | 'value'>('vibe')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [scrollY, setScrollY] = useState(0)
  const [savedScrollY, setSavedScrollY] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const productCardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const scrollYRef = useRef(0)
  const savedScrollYRef = useRef(0)

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
    (product: Product) => getProductDistanceKm(product, latitude, longitude),
    [latitude, longitude]
  )

  useEffect(() => {
    if (selectedProduct) {
      const cardElement = productCardRefs.current.get(selectedProduct._id)
      if (cardElement) {
        setTimeout(() => cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
      }
    }
  }, [selectedProduct])

  useEffect(() => {
    if (!selectedProduct) return
    if (filteredChartProducts.some((product) => product._id === selectedProduct._id)) return
    setSelectedProduct(null)
  }, [filteredChartProducts, selectedProduct])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      scrollYRef.current = currentScrollY
      setScrollY(currentScrollY)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleChartDotClick = (product: Product) => {
    setSelectedProduct(product)
  }

  const handleScrollToggle = () => {
    if (typeof window === 'undefined') return

    const currentScrollY = window.scrollY
    const currentSavedScrollY = savedScrollYRef.current
    const scrollBehavior: ScrollBehavior = !isBrowser && isIOS() ? 'auto' : 'smooth'

    if (currentScrollY > 80) {
      savedScrollYRef.current = currentScrollY
      setSavedScrollY(currentScrollY)
      window.scrollTo({ top: 0, behavior: scrollBehavior })
      scrollYRef.current = 0
      setScrollY(0)
      return
    }

    if (currentSavedScrollY > 0) {
      window.scrollTo({ top: currentSavedScrollY, behavior: scrollBehavior })
      scrollYRef.current = currentSavedScrollY
      setScrollY(currentSavedScrollY)
      savedScrollYRef.current = 0
      setSavedScrollY(0)
    }
  }

  const shouldShowScrollToggle = scrollY > 240 || (scrollY <= 80 && savedScrollY > 0)
  const showChartPanel = viewMode === 'chart'

  const stickyRailStyle = !isBrowser
    ? {
        top: 0,
        marginTop: 'calc(-1 * max(env(safe-area-inset-top, 0px), 1rem))',
        paddingTop: 'max(env(safe-area-inset-top, 0px), 1rem)',
      }
    : undefined

  return (
    <main className="flex-1 mx-auto w-full px-2 pb-4 sm:px-4 sm:pb-6 md:px-6 xl:px-8">
      {/* Browser decision: page/body scroll, with the control rail sticky below the top navbar. */}
      <div className={cn(
        'sticky z-[40] w-full border-b-0 bg-background pb-0 shadow-none backdrop-blur-none md:z-[45] md:border-b md:border-border/80 md:bg-card/95 md:pb-4 md:shadow-sm md:backdrop-blur-sm',
        isBrowser ? 'top-[calc(3.5rem+env(safe-area-inset-top,0px))]' : 'top-0 md:top-[calc(3.5rem+env(safe-area-inset-top,0px))]'
      )} style={stickyRailStyle}>
        <div className="md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-x-4">
          <div className="flex items-center gap-2 pt-1 md:pt-3">
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

          <div className="hidden md:flex md:row-span-2 md:shrink-0 md:self-center md:pt-3">
            <QuadrantFilterChips
              selectedQuadrant={quadrantFilter}
              onToggle={toggleQuadrantFilter}
            />
          </div>

          {/* Filters stay in one line when possible and wrap when they don't fit. */}
          <div className="pt-3 md:pt-4">
            <div className="space-y-2 md:space-y-2">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-1 md:hidden">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    variant={showNeedsReviewOnly ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full px-3 gap-1.5"
                    onClick={() => setShowNeedsReviewOnly((previous) => !previous)}
                    title={t('feed.needsReview')}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t('feed.needsReview')}
                  </Button>
                  <SensitivityFilterChips
                    activeFilters={activeSensitivities}
                    onToggle={toggleSensitivity}
                  />
                </div>
              </div>
              <div className="row-span-2 shrink-0 self-start">
                <QuadrantFilterChips
                  selectedQuadrant={quadrantFilter}
                  onToggle={toggleQuadrantFilter}
                />
              </div>

              <div className="min-w-0">
                <FilterChips
                  value={filterType}
                  onChange={handleFilterChange}
                  nearbyRange={nearbyRange}
                  onRangeChange={setNearbyRange}
                />
              </div>
            </div>

            <div className="hidden md:flex md:flex-wrap md:items-center md:justify-between md:gap-2">
              <div className="min-w-0 flex-1">
                <FilterChips
                  value={filterType}
                  onChange={handleFilterChange}
                  nearbyRange={nearbyRange}
                  onRangeChange={setNearbyRange}
                />
              </div>
              <div className="hidden md:flex md:shrink-0 md:justify-end">
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  <Button
                    type="button"
                    variant={showNeedsReviewOnly ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full px-3 gap-1.5"
                    onClick={() => setShowNeedsReviewOnly((previous) => !previous)}
                    title={t('feed.needsReview')}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t('feed.needsReview')}
                  </Button>
                  <SensitivityFilterChips
                    activeFilters={activeSensitivities}
                    onToggle={toggleSensitivity}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {showChartPanel ? (
        <div className="mt-0 mb-4 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-6 md:mt-6 md:mb-6">
          <div className="mb-2 flex items-center justify-between gap-2 sm:mb-4">
            <h2 className="truncate text-base font-semibold sm:text-xl">{t('chart.gMatrix')}</h2>
            <div className="flex shrink-0 gap-1.5">
              <Button
                onClick={() => setChartMode('vibe')}
                variant={chartMode === 'vibe' ? 'default' : 'outline'}
                size="sm"
                className="h-8 gap-1 px-2.5 text-xs sm:px-3 sm:text-sm"
              >
                🛡️ {t('chart.vibe')}
              </Button>
              <Button
                onClick={() => setChartMode('value')}
                variant={chartMode === 'value' ? 'default' : 'outline'}
                size="sm"
                className="h-8 gap-1 px-2.5 text-xs sm:px-3 sm:text-sm"
              >
                💰 {t('chart.value')}
              </Button>
            </div>
          </div>

          {allProductsForChart === undefined ? (
            <div className="flex h-[280px] items-center justify-center sm:h-[380px] lg:h-[420px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredChartProducts.length > 0 ? (
            <div className="h-[280px] min-h-[250px] sm:h-[380px] lg:h-[420px]">
              <Suspense fallback={<ChartLoadingFallback />}>
                <MatrixChart
                  products={filteredChartProducts}
                  onProductClick={handleChartDotClick}
                  selectedProduct={selectedProduct}
                  onSelectionClear={() => setSelectedProduct(null)}
                  mode={chartMode}
                />
              </Suspense>
            </div>
          ) : (
            <div className="flex h-[280px] flex-col items-center justify-center text-muted-foreground sm:h-[380px] lg:h-[420px]">
              <p className="mb-2 text-lg">{t('chart.noProductsYet')}</p>
              <p className="text-sm">{t('chart.addFirstProduct')}</p>
            </div>
          )}
        </div>
      ) : user && profile ? (
        <Suspense fallback={<HomeWidgetsFallback />}>
          <div className="mt-0 mb-3 flex gap-2 md:mt-6 md:mb-6 md:grid md:grid-cols-4 md:gap-4">
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
        </Suspense>
      ) : null}

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
              <Suspense fallback={<StripLoadingFallback />}>
                <div className="space-y-1.5">
                  {finalProducts.map((product) => (
                    <ProductStrip
                      key={product._id}
                      product={product}
                      highlight={searchQuery}
                    />
                  ))}
                </div>
              </Suspense>
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

      {shouldShowScrollToggle && (
        <Button
          type="button"
          size="icon"
          className="fixed bottom-24 right-4 z-50 h-12 w-12 rounded-full shadow-lg md:bottom-6"
          onClick={handleScrollToggle}
          title={scrollY > 80 ? t('feed.backToTop') : t('feed.backToPosition')}
        >
          {scrollY > 80 ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
        </Button>
      )}
    </main>
  )
}

