import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useVoteMigration } from '@/hooks/use-vote-migration'

/**
 * Handles automatic vote migration when user signs in.
 * This component runs client-side only to avoid hydration issues.
 */
export function VoteMigrationHandler() {
  const user = useQuery(api.users.current)
  
  // Automatically migrate anonymous votes when user signs in
  useVoteMigration(user?._id)
  
  // This component renders nothing - it's just for the side effect
  return null
}
