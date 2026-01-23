import { useState, useEffect, useCallback } from 'react'
import type { Locale } from '@/lib/i18n'
import {
  I18n,
  loadTranslations,
  getBrowserLocale,
  saveLocalePreference,
  loadLocalePreference,
} from '@/lib/i18n'

/**
 * Hook for managing translations and locale switching
 */
export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [i18n, setI18n] = useState<I18n | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize locale and load translations
  useEffect(() => {
    async function init() {
      // Try to load saved preference, fallback to browser locale
      const savedLocale = loadLocalePreference()
      const initialLocale = savedLocale || getBrowserLocale()

      const translations = await loadTranslations(initialLocale)
      setLocaleState(initialLocale)
      setI18n(new I18n(translations, initialLocale))
      setLoading(false)
    }

    init()
  }, [])

  /**
   * Change the current locale
   */
  const setLocale = useCallback(async (newLocale: Locale) => {
    setLoading(true)
    const translations = await loadTranslations(newLocale)
    setLocaleState(newLocale)
    setI18n(new I18n(translations, newLocale))
    saveLocalePreference(newLocale)
    setLoading(false)
  }, [])

  /**
   * Translate a key
   */
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
    setLocale,
    loading,
  }
}
