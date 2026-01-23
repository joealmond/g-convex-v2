/**
 * Simple i18n implementation for G-Matrix
 * Supports English (EN) and Hungarian (HU)
 */

export type Locale = 'en' | 'hu'

export interface Translations {
  [key: string]: string | Translations
}

/**
 * Get nested value from translations object using dot notation
 * Example: get(translations, 'nav.home') => translations.nav.home
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
        return path // Return key if not found
      }
    } else {
      return path // Return key if not found
    }
  }

  return typeof current === 'string' ? current : path
}

/**
 * Load translations for a locale
 * Uses static imports to avoid Vite dynamic import issues
 */
export async function loadTranslations(locale: Locale): Promise<Translations> {
  try {
    // Static imports for Vite compatibility
    if (locale === 'hu') {
      const translations = await import('@/locales/hu.json')
      return translations.default || translations
    }
    // Default to English
    const translations = await import('@/locales/en.json')
    return translations.default || translations
  } catch (error) {
    console.error(`Failed to load translations for locale: ${locale}`, error)
    return {}
  }
}

/**
 * Translation helper
 */
export class I18n {
  private translations: Translations = {}
  private locale: Locale = 'en'

  constructor(translations: Translations, locale: Locale) {
    this.translations = translations
    this.locale = locale
  }

  /**
   * Translate a key
   * @param key - Translation key in dot notation (e.g., 'nav.home')
   * @param params - Optional parameters for interpolation
   */
  t(key: string, params?: Record<string, string | number>): string {
    let translation = getNestedValue(this.translations, key)

    // Simple parameter interpolation
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(
          new RegExp(`{${paramKey}}`, 'g'),
          String(value)
        )
      })
    }

    return translation
  }

  getLocale(): Locale {
    return this.locale
  }
}

/**
 * Get browser's preferred locale
 */
export function getBrowserLocale(): Locale {
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('hu')) return 'hu'
  return 'en'
}

/**
 * Save locale preference to localStorage
 */
export function saveLocalePreference(locale: Locale): void {
  localStorage.setItem('g-matrix-locale', locale)
}

/**
 * Load locale preference from localStorage
 */
export function loadLocalePreference(): Locale | null {
  const saved = localStorage.getItem('g-matrix-locale')
  if (saved === 'en' || saved === 'hu') return saved
  return null
}
