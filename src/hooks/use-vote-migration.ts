import { useEffect, useRef } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAnonymousId } from './use-anonymous-id'
import { logger } from '@/lib/logger'

/**
 * Hook to automatically migrate anonymous votes to registered user after sign-in
 * Should be used in the root layout to run on every page after authentication
 */
export function useVoteMigration(userId: string | null | undefined) {
  const { anonId: anonymousId } = useAnonymousId()
  const migrateVotes = useMutation(api.votes.migrateAnonymous)
  const hasMigrated = useRef(false)

  useEffect(() => {
    // Only migrate once per session when user becomes authenticated
    if (userId && anonymousId && !hasMigrated.current) {
      hasMigrated.current = true

      migrateVotes({ anonymousId })
        .then((result) => {
          if (result.migratedCount > 0) {
            console.log(
              `Successfully migrated ${result.migratedCount} anonymous votes to user account`
            )
          }
        })
        .catch((error) => {
          logger.error('Failed to migrate anonymous votes:', error)
          // Reset flag to allow retry
          hasMigrated.current = false
        })
    }
  }, [userId, anonymousId, migrateVotes])

  return null
}
