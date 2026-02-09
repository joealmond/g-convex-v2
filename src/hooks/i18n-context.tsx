import { useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Locale } from '@/lib/i18n'
import {
  I18n,
  loadTranslations,
  getBrowserLocale,
  saveLocalePreference,
  loadLocalePreference,
} from '@/lib/i18n'

// ─── Module-level cache ──────────────────────────────────────────
// Translations are cached at module level so we don't re-import
// on every hook call. The CustomEvent pattern (proven in g-convex)
// synchronises locale across all mounted components.

const LOCALE_EVENT = 'g-matrix-locale-change'

let cachedI18n: I18n | null = null
let cachedLocale: Locale = 'en'

/**
 * Change locale globally. Updates localStorage and fires a CustomEvent
 * so every useTranslation() hook re-renders with the new language.
 */
export async function setGlobalLocale(newLocale: Locale): Promise<void> {
  const translations = await loadTranslations(newLocale)
  cachedLocale = newLocale
  cachedI18n = new I18n(translations, newLocale)
  if (typeof window !== 'undefined') {
    saveLocalePreference(newLocale)
    window.dispatchEvent(
      new CustomEvent(LOCALE_EVENT, { detail: newLocale })
    )
  }
}

// ─── React hook ───────────────────────────────────────────────────

interface I18nHookValue {
  t: (key: string, params?: Record<string, string | number>) => string
  locale: Locale
  setLocale: (locale: Locale) => Promise<void>
  loading: boolean
}

/**
 * Shared translation hook. Every instance independently subscribes to
 * the `g-matrix-locale-change` CustomEvent so they all stay in sync.
 */
export function useI18nContext(): I18nHookValue {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [i18n, setI18n] = useState<I18n | null>(null)
  const [loading, setLoading] = useState(true)

  // 1. On mount: read saved preference, load translations, subscribe to changes
  useEffect(() => {
    let cancelled = false

    async function init() {
      // If we already loaded this locale, reuse the cache
      if (cachedI18n && cachedLocale) {
        setLocaleState(cachedLocale)
        setI18n(cachedI18n)
        setLoading(false)
        return
      }

      const savedLocale = loadLocalePreference()
      const initialLocale = savedLocale || getBrowserLocale()
      const translations = await loadTranslations(initialLocale)

      if (cancelled) return

      cachedLocale = initialLocale
      cachedI18n = new I18n(translations, initialLocale)
      setLocaleState(initialLocale)
      setI18n(cachedI18n)
      setLoading(false)
    }

    void init()

    // 2. Listen for locale changes from any component
    const handleChange = (e: Event) => {
      const newLocale = (e as CustomEvent<Locale>).detail
      setLocaleState(newLocale)
      setI18n(cachedI18n) // cachedI18n is already updated by setGlobalLocale
      setLoading(false)
    }

    window.addEventListener(LOCALE_EVENT, handleChange)
    return () => {
      cancelled = true
      window.removeEventListener(LOCALE_EVENT, handleChange)
    }
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      if (!i18n) return key
      return i18n.t(key, params)
    },
    [i18n]
  )

  return {
    t,
    locale,
    setLocale: setGlobalLocale,
    loading,
  }
}

// ─── Provider (just a pass-through for tree compatibility) ────────

export function I18nProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}
