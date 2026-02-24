/**
 * i18n for G-Matrix
 * Pattern copied from proven g-convex codebase:
 * Static imports + CustomEvent + useState/useEffect
 */

import { useState, useEffect, useCallback } from 'react'
import enTranslations from '@/locales/en.json'
import huTranslations from '@/locales/hu.json'

export type Locale = 'en' | 'hu'

export interface Translations {
  [key: string]: string | Translations
}

const LOCALE_KEY = 'g-matrix-lang'
const LOCALE_EVENT = 'g-matrix-locale-change'

// Both locale files are statically imported — no async needed
const allTranslations: Record<Locale, Translations> = {
  en: enTranslations as unknown as Translations,
  hu: huTranslations as unknown as Translations,
}

/**
 * Get nested value from translations object using dot notation
 */
function getNestedValue(obj: Translations, path: string): string {
  const keys = path.split('.')
  let current: Translations | string = obj

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      const value: Translations | string | undefined = current[key]
      if (value !== undefined) {
        current = value
      } else {
        return path
      }
    } else {
      return path
    }
  }

  return typeof current === 'string' ? current : path
}

/**
 * Translate a key using the given locale's translations
 */
function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  let translation = getNestedValue(allTranslations[locale], key)

  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      translation = translation.replace(
        new RegExp(`\\{${paramKey}\\}`, 'g'),
        String(value)
      )
    })
  }

  return translation
}

// ─── localStorage helpers (SSR-safe) ─────────────────────────────

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(LOCALE_KEY)
  return stored === 'hu' || stored === 'en' ? stored : 'en'
}

export function getBrowserLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('hu')) return 'hu'
  return 'en'
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Set locale globally. Persists to localStorage and notifies all hooks.
 */
export function setLocale(locale: Locale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCALE_KEY, locale)
    window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: locale }))
  }
}

/**
 * Hook: returns the current locale, re-renders on change.
 */
export function useLocale(): Locale {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    // Default to English unless user has explicitly chosen a locale
    const initial = getStoredLocale()
    setLocaleState(initial)

    const handleChange = (e: Event) => {
      const newLocale = (e as CustomEvent<Locale>).detail
      setLocaleState(newLocale)
    }

    window.addEventListener(LOCALE_EVENT, handleChange)
    return () => window.removeEventListener(LOCALE_EVENT, handleChange)
  }, [])

  return locale
}

/**
 * Hook: returns { t, locale, setLocale, loading }
 * This is the main hook used by components.
 */
export function useTranslationHook() {
  const locale = useLocale()

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      return translate(locale, key, params)
    },
    [locale]
  )

  return {
    t,
    locale,
    setLocale,
    loading: false, // translations are static imports — always loaded
  }
}


