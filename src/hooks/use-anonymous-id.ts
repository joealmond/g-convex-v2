import { useState, useEffect } from 'react'

const ANON_ID_KEY = 'g-matrix-anonymous-id'

/**
 * Generate a random anonymous user ID
 */
function generateAnonymousId(): string {
  return `anon_${crypto.randomUUID()}`
}

/**
 * Hook to manage anonymous user ID for voting before sign-in
 * 
 * The ID is stored in localStorage and persists across sessions.
 * When a user signs in, votes can be migrated from anonymous to registered.
 */
export function useAnonymousId() {
  const [anonId, setAnonId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get or create anonymous ID
    let id = localStorage.getItem(ANON_ID_KEY)
    if (!id) {
      id = generateAnonymousId()
      localStorage.setItem(ANON_ID_KEY, id)
    }
    setAnonId(id)
    setIsLoading(false)
  }, [])

  /**
   * Clear the anonymous ID (called after migration to registered user)
   */
  const clearAnonId = () => {
    localStorage.removeItem(ANON_ID_KEY)
    const newId = generateAnonymousId()
    localStorage.setItem(ANON_ID_KEY, newId)
    setAnonId(newId)
  }

  /**
   * Get the current anonymous ID (creates one if needed)
   */
  const getAnonId = (): string => {
    if (anonId) return anonId

    let id = localStorage.getItem(ANON_ID_KEY)
    if (!id) {
      id = generateAnonymousId()
      localStorage.setItem(ANON_ID_KEY, id)
      setAnonId(id)
    }
    return id
  }

  return {
    anonId,
    isLoading,
    clearAnonId,
    getAnonId,
  }
}
