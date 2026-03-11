import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AllVotesChart } from '@/components/product/AllVotesChart'
import { PriceHistoryChart } from '@/components/product/PriceHistoryChart'
import { CoordinateGrid } from '@/components/dashboard/CoordinateGrid'
import type { Id, Doc } from '@convex/_generated/dataModel'

interface ProductChartTabsProps {
  product: {
    _id: Id<'products'>
    averageSafety: number
    averageTaste: number
    avgPrice?: number | null
  }
  myVote?: Doc<'votes'>
  allVotesCount: number
  t: (key: string, params?: Record<string, string | number>) => string
  onRequestVote?: () => void
}

/**
 * Tabbed chart view: all votes, my vote, price history.
 */
export function ProductChartTabs({
  product,
  myVote,
  allVotesCount,
  t,
  onRequestVote,
}: ProductChartTabsProps) {
  const hasPrice = !!product.avgPrice
  const tabCount = hasPrice ? 3 : 2
  const hasVotes = allVotesCount > 0

  return (
    <Tabs defaultValue={myVote ? 'my-vote' : 'all-votes'} className="w-full">
      <TabsList className={`grid w-full mb-4 ${tabCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <TabsTrigger value="my-vote" disabled={!myVote}>
          {t('product.myVote')}
        </TabsTrigger>
        <TabsTrigger value="all-votes">{t('product.allVotes')}</TabsTrigger>
        {hasPrice && (
          <TabsTrigger value="price-history">Price</TabsTrigger>
        )}
      </TabsList>

      {/* My Vote View */}
      <TabsContent value="my-vote">
        {myVote ? (
          <div className="space-y-4">
            <div className="mx-auto aspect-square w-full max-w-[17rem]">
              <CoordinateGrid
                initialSafety={myVote.safety ?? 50}
                initialTaste={myVote.taste ?? 50}
                onVote={() => {}}
                disabled
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="text-muted-foreground">{t('voting.safety')}: <span className="font-semibold text-foreground">{myVote.safety ?? 50}</span></span>
              <span className="text-muted-foreground">{t('voting.taste')}: <span className="font-semibold text-foreground">{myVote.taste ?? 50}</span></span>
              {myVote.price && (
                <span className="text-muted-foreground">{t('voting.price')}: <span className="font-semibold text-foreground">{myVote.price}/5</span></span>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-8 text-center sm:px-6">
            <p className="mb-3 text-muted-foreground">
              {t('voting.notVotedYet')}
            </p>
            <Button
              onClick={() => {
                if (onRequestVote) {
                  onRequestVote()
                  return
                }

                document
                  .querySelector('[data-voting-section]')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              {t('voting.castYourVote')}
            </Button>
          </div>
        )}
      </TabsContent>

      {/* All Votes View */}
      <TabsContent value="all-votes" className="space-y-4">
        {hasVotes ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_15rem] xl:items-start">
            <div className="rounded-2xl border border-border bg-muted/10 p-3 sm:p-4">
              <AllVotesChart
                productId={product._id}
                highlightVoteId={myVote?._id}
              />
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {t('product.voteSpread')}
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {allVotesCount}
                </p>
                <p className="text-sm text-muted-foreground">
                  {allVotesCount === 1 ? t('voting.individualVote') : t('voting.individualVotes')}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {t('voting.safety')}
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {Math.round(product.averageSafety)}/100
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {t('voting.taste')}
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {Math.round(product.averageTaste)}/100
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-8 text-center sm:px-6">
            <p className="text-base font-semibold text-foreground">{t('voting.noVotesYet')}</p>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              {t('product.votesSectionEmpty')}
            </p>
            <Button className="mt-4" onClick={onRequestVote}>
              {t('product.voteAction')}
            </Button>
          </div>
        )}
      </TabsContent>

      {/* Price History View */}
      {hasPrice && (
        <TabsContent value="price-history">
          <PriceHistoryChart productId={product._id} />
        </TabsContent>
      )}
    </Tabs>
  )
}
