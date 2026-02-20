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
  onVote: (safety: number, taste: number) => void
  isVoting: boolean
  t: (key: string, params?: Record<string, string | number>) => string
}

/**
 * Tabbed chart view: Average, My Vote, All Votes, Price History
 */
export function ProductChartTabs({
  product,
  myVote,
  allVotesCount,
  onVote,
  isVoting,
  t,
}: ProductChartTabsProps) {
  const hasPrice = !!product.avgPrice

  return (
    <Tabs defaultValue="average" className="w-full">
      <TabsList className={`grid w-full mb-4 ${hasPrice ? 'grid-cols-4' : 'grid-cols-3'}`}>
        <TabsTrigger value="average">{t('product.average')}</TabsTrigger>
        <TabsTrigger value="my-vote" disabled={!myVote}>
          {t('product.myVote')}
        </TabsTrigger>
        <TabsTrigger value="all-votes">{t('product.allVotes')}</TabsTrigger>
        {hasPrice && (
          <TabsTrigger value="price-history">Price</TabsTrigger>
        )}
      </TabsList>

      {/* Average View */}
      <TabsContent value="average">
        <div className="aspect-square max-w-sm mx-auto">
          <CoordinateGrid
            initialSafety={product.averageSafety}
            initialTaste={product.averageTaste}
            onVote={onVote}
            disabled={isVoting}
          />
        </div>
        <p className="text-sm text-muted-foreground text-center mt-4">
          {t('voting.communityAverage')}
        </p>
      </TabsContent>

      {/* My Vote View */}
      <TabsContent value="my-vote">
        {myVote ? (
          <>
            <div className="aspect-square max-w-sm mx-auto">
              <CoordinateGrid
                initialSafety={myVote.safety}
                initialTaste={myVote.taste}
                onVote={onVote}
                disabled={isVoting}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              {t('voting.yourVote', { safety: myVote.safety, taste: myVote.taste })}
              {myVote.price && t('voting.yourVotePrice', { price: myVote.price })}
            </p>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {t('voting.notVotedYet')}
            </p>
            <Button
              onClick={() =>
                document
                  .querySelector('[data-voting-section]')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
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
