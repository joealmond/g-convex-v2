const ANON_ID_KEY = 'g-matrix-anonymous-id'

/**
 * Generate a random anonymous user ID
 */
function generateAnonymousId(): string {
  return `anon_${crypto.randomUUID()}`
}

function getStoredAnonymousId(): string | null {
  if (typeof window === 'undefined') return null

  let id = localStorage.getItem(ANON_ID_KEY)
  if (!id) {
    id = generateAnonymousId()
    localStorage.setItem(ANON_ID_KEY, id)
  }

  return id
}

/**
 * Hook to manage anonymous user ID for voting before sign-in
 * 
 * The ID is stored in localStorage and persists across sessions.
 * When a user signs in, votes can be migrated from anonymous to registered.
 */
export function useAnonymousId() {
  const anonId = getStoredAnonymousId()
  const isLoading = false

  /**
   * Clear the anonymous ID (called after migration to registered user)
   */
  const clearAnonId = () => {
    localStorage.removeItem(ANON_ID_KEY)
    const newId = generateAnonymousId()
    localStorage.setItem(ANON_ID_KEY, newId)
  }

  /**
   * Get the current anonymous ID (creates one if needed)
   */
  const getAnonId = (): string => {
    return getStoredAnonymousId() ?? generateAnonymousId()
  }

  return {
    anonId,
    isLoading,
    clearAnonId,
    getAnonId,
  }
}
