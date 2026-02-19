import { profilesAggregate, productsAggregate } from './aggregates'
import { adminQuery } from './lib/customFunctions'

/**
 * Get global statistics using O(log n) aggregates.
 * Efficiently returns counts without scanning collections.
 */
export const getGlobalStats = adminQuery({
  args: {},
  handler: async (ctx) => {
    const [totalUsers, totalProducts] = await Promise.all([
      profilesAggregate.count(ctx),
      productsAggregate.count(ctx),
    ])

    return {
      totalUsers,
      totalProducts,
    }
  },
})
