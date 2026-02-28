import { TableAggregate } from '@convex-dev/aggregate';

/**
 * Safely attempts to delete a document from an aggregate index.
 * Catches 'DELETE_MISSING_KEY' errors which happen if the aggregate is mysteriously out of sync,
 * preventing the entire primary user deletion mutation from failing.
 */
export async function safeAggregateDelete(
  ctx: any,
  aggregate: TableAggregate<any>,
  doc: any
) {
  try {
    await aggregate.delete(ctx, doc);
  } catch (error: any) {
    if (error.message?.includes('DELETE_MISSING_KEY')) {
      console.warn(`[Aggregate Deletion Skipped] Document already missing from aggregate index`);
    } else {
      throw error; // Re-throw actual errors (like network/db issues)
    }
  }
}
