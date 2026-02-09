import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Locale } from '@/lib/i18n'
import {
  I18n,
  loadTranslations,
  getBrowserLocale,
  saveLocalePreference,
  loadLocalePreference,
} from '@/lib/i18n'

interface I18nContextValue {
  t: (key: string, params?: Record<string, string | number>) => string
  locale: Locale
  setLocale: (locale: Locale) => Promise<void>
  loading: boolean
}

const I18nContext = createContext<I18nContextValue | null>(null)

/**
 * Provider that shares i18n state across the entire app.
 * Wrap this around your root component so every `useTranslation()` call
 * shares the same locale and translations instance.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [i18n, setI18n] = useState<I18n | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize locale and load translations
  useEffect(() => {
    async function init() {
      // SSR-safe: only access browser APIs on client
      let initialLocale: Locale = 'en'
      if (typeof window !== 'undefined') {
        const savedLocale = loadLocalePreference()
        initialLocale = savedLocale || getBrowserLocale()
      }

      const translations = await loadTranslations(initialLocale)
      setLocaleState(initialLocale)
      setI18n(new I18n(translations, initialLocale))
      setLoading(false)
    }

    init()
  }, [])

  const setLocale = useCallback(async (newLocale: Locale) => {
    setLoading(true)
    const translations = await loadTranslations(newLocale)
    setLocaleState(newLocale)
    setI18n(new I18n(translations, newLocale))
    saveLocalePreference(newLocale)
    setLoading(false)
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      if (!i18n) return key
      return i18n.t(key, params)
    },
    [i18n]
  )

  return (
    <I18nContext.Provider value={{ t, locale, setLocale, loading }}>
      {children}
    </I18nContext.Provider>
  )
}

/**
 * Hook to consume the shared I18n context.
 * Must be used within an I18nProvider.
 */
export function useI18nContext(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18nContext must be used within an I18nProvider')
  }
  return ctx
}
