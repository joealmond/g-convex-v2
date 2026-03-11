import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Suspense, lazy, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { DataSourceBadge } from '@/components/product/DataSourceBadge'
import { ProductPositionCard } from '@/components/product/ProductPositionCard'
import { VoteProductDialog } from '@/components/product/VoteProductDialog'
import { ReportProductDialog } from '@/components/product/ReportProductDialog'
import { ShareButton } from '@/components/product/ShareButton'
import { DeleteProductButton } from '@/components/dashboard/DeleteProductButton'
import { EditProductDialog } from '@/components/dashboard/EditProductDialog'
import { type Product } from '@/lib/types'
import { appConfig } from '@/lib/app-config'
import { useAnonymousId } from '@/hooks/use-anonymous-id'
import { useAdmin } from '@/hooks/use-admin'
import { useImpersonate } from '@/hooks/use-impersonate'
import { useTranslation } from '@/hooks/use-translation'
import { findAllergenConflicts } from '@/lib/dietary-profiles'
import { ArrowLeft, Edit, Flag, AlertTriangle } from 'lucide-react'

const ProductChartTabs = lazy(() =>
  import('@/components/product/ProductChartTabs').then((module) => ({ default: module.ProductChartTabs }))
)
const ProductComments = lazy(() =>
  import('@/components/product/ProductComments').then((module) => ({ default: module.ProductComments }))
)
const ProductMap = lazy(() =>
  import('@/components/map/ProductMap').then((module) => ({ default: module.ProductMap }))
)
const VoterList = lazy(() =>
  import('@/components/admin/VoterList').then((module) => ({ default: module.VoterList }))
)

export const Route = createFileRoute('/product/$name')({
  component: ProductDetailPage,
})

function ProductDetailLoading() {
  return (
    <div className="flex-1 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6 px-0 md:px-2 xl:px-4">
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

function SectionLoading({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
      {label}
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

  const product = useQuery(api.products.getByName, { name })
  const user = useQuery(api.users.current)
  const avoidedAllergens = useQuery(api.dietaryProfiles.getAvoidedAllergens) ?? []
  const allergenConflicts = product?.allergens
    ? findAllergenConflicts(product.allergens, avoidedAllergens)
    : []
  const allVotes = useQuery(
    api.votes.getByProduct,
    product ? { productId: product._id } : 'skip'
  )
  const myVote = allVotes?.find(
    (vote) =>
      (user && vote.userId === user._id) ||
      (anonymousId && vote.anonymousId === anonymousId)
  )

  const [isEditing, setIsEditing] = useState(false)
  const [isReporting, setIsReporting] = useState(false)
  const [isVoteDialogOpen, setIsVoteDialogOpen] = useState(false)

  const handleProductDeleted = () => {
    navigate({ to: '/' })
  }

  if (product === undefined) {
    return <ProductDetailLoading />
  }

  if (product === null) {
    return (
      <div className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="text-2xl font-bold mb-4">{t('product.notFound')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('product.notFoundDesc', { name })}
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

  const hasStoreData = Boolean(
    product.stores?.some((store) =>
      Boolean(store.name?.trim()) ||
      Boolean(store.geoPoint) ||
      Boolean(store.price)
    )
  )
  const firstStoreWithGeo = product.stores?.find((store) => store.geoPoint)
  const hasStructuredIngredients = Boolean(product.ingredients && product.ingredients.length > 0)
  const hasOcrIngredients = Boolean(product.ingredientsText?.trim())
  const mapSearch = firstStoreWithGeo?.geoPoint
    ? {
        productId: product._id,
        name: product.name,
        lat: firstStoreWithGeo.geoPoint.lat,
        lng: firstStoreWithGeo.geoPoint.lng,
      }
    : undefined
  return (
    <main className="flex-1 px-4 py-6 md:px-6 xl:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
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

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,1fr)] lg:items-stretch">
          {product.imageUrl && !product.imageUrl.startsWith('blob:') ? (
            <div className="h-full min-h-[24rem] w-full overflow-hidden rounded-3xl border border-border bg-background shadow-sm sm:min-h-[30rem] lg:min-h-[36rem]">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[24rem] items-center justify-center rounded-3xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground sm:min-h-[30rem] lg:min-h-[36rem]">
              {t('common.noImage')}
            </div>
          )}

          <Card className="h-full min-h-[24rem] overflow-hidden shadow-card sm:min-h-[30rem] lg:min-h-[36rem]">
            <CardContent className="flex h-full flex-col space-y-5 p-5 sm:p-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h1 className="min-w-0 flex-1 break-words text-2xl font-bold text-foreground sm:text-3xl">
                    {product.name}
                  </h1>
                  <Badge variant="outline" className="shrink-0 rounded-full px-3 py-1 text-xs font-medium">
                    {product.voteCount} {product.voteCount === 1 ? t('common.vote') : t('common.votes')}
                  </Badge>
                </div>
                {product.dataSource && (
                  <DataSourceBadge source={product.dataSource as 'openfoodfacts' | 'ai-ingredients' | 'ai-estimate' | 'community'} />
                )}
              </div>

              <ProductPositionCard
                averageSafety={product.averageSafety}
                averageTaste={product.averageTaste}
                avgPrice={product.avgPrice}
                action={
                  <VoteProductDialog
                    product={product as Product}
                    avoidedAllergens={avoidedAllergens}
                    open={isVoteDialogOpen}
                    onOpenChange={setIsVoteDialogOpen}
                    trigger={
                      <Button size="lg" className="h-12 rounded-full px-6 text-base font-semibold shadow-sm">
                        {t('product.voteAction')}
                      </Button>
                    }
                  />
                }
              />
            </CardContent>
          </Card>
        </section>

        {(product.freeFrom && product.freeFrom.length > 0) || (product.allergens && product.allergens.length > 0) ? (
          <Card className={`shadow-card ${allergenConflicts.length > 0 ? 'border-safety-low' : ''}`}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {allergenConflicts.length > 0 && (
                  <AlertTriangle className="h-5 w-5 text-safety-low" />
                )}
                {t('product.freeFromAndWarnings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.freeFrom && product.freeFrom.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-foreground">{t('imageUpload.freeFrom')}</p>
                  <div className="flex flex-wrap gap-2">
                    {product.freeFrom.map((allergenId: string) => {
                      const allergen = appConfig.allergens.find((item) => item.id === allergenId)
                      return (
                        <Badge
                          key={allergenId}
                          className="px-3 py-1 text-xs font-medium bg-safety-high/15 text-safety-high border border-safety-high/30"
                        >
                          {allergen ? `${allergen.emoji} ${t(`imageUpload.freeFromAllergen.${allergenId}`)}` : allergenId}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}

              {product.allergens && product.allergens.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-foreground">{t('allergens.title')}</p>
                  {allergenConflicts.length > 0 && (
                    <p className="mb-3 text-sm font-medium text-safety-low">
                      {t('allergens.warningContains')}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {product.allergens.map((allergenId) => {
                      const allergen = appConfig.allergens.find((item) => item.id === allergenId)
                      const isConflict = allergenConflicts.includes(allergenId)
                      return (
                        <Badge
                          key={allergenId}
                          variant={isConflict ? 'destructive' : 'secondary'}
                          className="px-3 py-1 text-xs font-medium"
                        >
                          {allergen ? `${allergen.emoji} ${allergen.label}` : allergenId}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {(hasStoreData || hasStructuredIngredients || hasOcrIngredients) && (
          <section className="grid gap-6 xl:grid-cols-2 xl:items-start">
            {hasStoreData && (
              <Card className="shadow-card xl:self-start">
                <CardHeader>
                  <CardTitle className="text-lg">{t('product.whereToBuy')}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  {firstStoreWithGeo?.geoPoint && mapSearch ? (
                    <Link to="/map" search={mapSearch} className="group block">
                      <div className="h-[18rem] overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-sm transition-shadow group-hover:shadow-md sm:h-[20rem] xl:h-[22rem]">
                        <div className="pointer-events-none h-full w-full">
                          <Suspense fallback={<div className="flex h-full items-center justify-center bg-muted/20 text-sm text-muted-foreground">{t('common.loading')}</div>}>
                            <ProductMap
                              products={[product as Product]}
                              center={[firstStoreWithGeo.geoPoint.lat, firstStoreWithGeo.geoPoint.lng]}
                              zoom={15}
                            />
                          </Suspense>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex h-[18rem] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground sm:h-[20rem] xl:h-[22rem]">
                      {t('store.noStores')}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {(hasStructuredIngredients || hasOcrIngredients) && (
              <Card className="h-full shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">{t('product.ingredients')}</CardTitle>
                </CardHeader>
                <CardContent className="flex h-full min-h-[18rem] flex-col space-y-4">
                  {hasStructuredIngredients && (
                    <div className="flex flex-wrap gap-2">
                      {product.ingredients?.map((ingredient, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="px-3 py-1 text-xs font-medium"
                        >
                          {ingredient}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {hasOcrIngredients && (
                    <CollapsibleSection
                      title={t('imageUpload.ingredientsFromScan')}
                      preview={<p className="line-clamp-2 text-xs text-muted-foreground">{t('product.ingredientsFromScanPreview')}</p>}
                    >
                      <div className="p-4">
                        <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                          {product.ingredientsText}
                        </p>
                      </div>
                    </CollapsibleSection>
                  )}
                </CardContent>
              </Card>
            )}
          </section>
        )}

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">{t('product.votesSection')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] xl:items-stretch">
              <div className="rounded-3xl border border-border bg-gradient-to-br from-background to-muted/20 p-4 shadow-sm sm:p-5">
                <Suspense fallback={<SectionLoading label={t('common.loading')} />}>
                  <ProductChartTabs
                    product={product}
                    myVote={myVote}
                    allVotesCount={allVotes?.length || 0}
                    t={t}
                    onRequestVote={() => setIsVoteDialogOpen(true)}
                  />
                </Suspense>
              </div>

              {adminStatus?.isAdmin && allVotes ? (
                <Suspense fallback={<SectionLoading label={t('common.loading')} />}>
                  <VoterList
                    votes={allVotes}
                    onImpersonate={(userId) => startImpersonation(userId)}
                    embedded
                  />
                </Suspense>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Suspense fallback={<SectionLoading label={t('common.loading')} />}>
          <ProductComments productId={product._id} />
        </Suspense>
      </div>

      <EditProductDialog
        product={product as Product}
        open={isEditing}
        onOpenChange={setIsEditing}
      />

      <ReportProductDialog
        productId={product._id}
        productName={product.name}
        open={isReporting}
        onOpenChange={setIsReporting}
      />
    </main>
  )
}
