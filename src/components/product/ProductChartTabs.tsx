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

  return (
    <Tabs defaultValue="all-votes" className="w-full">
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
          <>
            <div className="aspect-square max-w-sm mx-auto">
              <CoordinateGrid
                initialSafety={myVote.safety ?? 50}
                initialTaste={myVote.taste ?? 50}
                onVote={() => {}}
                disabled
              />
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              {t('voting.yourVote', { safety: myVote.safety ?? 50, taste: myVote.taste ?? 50 })}
              {myVote.price && t('voting.yourVotePrice', { price: myVote.price })}
            </p>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
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
      <TabsContent value="all-votes">
        <div className="max-w-sm mx-auto">
          <AllVotesChart
            productId={product._id}
            highlightVoteId={myVote?._id}
          />
        </div>
        <p className="text-sm text-muted-foreground text-center mt-4">
          {allVotesCount} {allVotesCount === 1 ? t('voting.individualVote') : t('voting.individualVotes')}
        </p>
        <div className="mt-6 aspect-square max-w-sm mx-auto">
          <CoordinateGrid
            initialSafety={product.averageSafety}
            initialTaste={product.averageTaste}
            onVote={() => {}}
            disabled
          />
        </div>
        <p className="text-sm text-muted-foreground text-center mt-4">
          {t('voting.communityAverage')}
        </p>
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
