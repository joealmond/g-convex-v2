import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

/**
 * Hook for managing theme (light/dark/system)
 * Persists theme preference in localStorage
 * Listens to system preference changes
 * 
 * Usage:
 * const { theme, setTheme, resolvedTheme } = useTheme()
 * - theme: Current user preference ('light' | 'dark' | 'system')
 * - setTheme: Function to change theme
 * - resolvedTheme: Actual theme applied ('light' | 'dark') after system preference resolved
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return

    // Get saved preference or default to 'system'
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'system'
    setThemeState(savedTheme)

    // Determine resolved theme
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const resolved = savedTheme === 'system' 
      ? (systemPrefersDark ? 'dark' : 'light')
      : savedTheme === 'dark' 
        ? 'dark' 
        : 'light'
    
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }, [])

  // Listen to system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? 'dark' : 'light'
      setResolvedTheme(resolved)
      applyTheme(resolved)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)

    // Determine resolved theme
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const resolved = newTheme === 'system'
      ? (systemPrefersDark ? 'dark' : 'light')
      : newTheme === 'dark'
        ? 'dark'
        : 'light'

    setResolvedTheme(resolved)
    applyTheme(resolved)
  }

  const applyTheme = (resolved: 'light' | 'dark') => {
    const root = document.documentElement
    if (resolved === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  return { theme, setTheme, resolvedTheme }
}
