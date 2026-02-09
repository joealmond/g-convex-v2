import { useSyncExternalStore, useCallback, type ReactNode } from 'react'
import type { Locale } from '@/lib/i18n'
import {
  I18n,
  loadTranslations,
  getBrowserLocale,
  saveLocalePreference,
  loadLocalePreference,
} from '@/lib/i18n'

// ─── Module-level singleton store ─────────────────────────────────
// Uses useSyncExternalStore so every component subscribes to the SAME
// store regardless of the React component tree. This avoids all
// Context + SSR hydration issues with TanStack Start.

interface I18nState {
  locale: Locale
  i18n: I18n | null
  loading: boolean
}

// Cached server snapshot — MUST be a stable reference (same object identity)
// to avoid the React infinite loop error with useSyncExternalStore.
const SERVER_SNAPSHOT: I18nState = Object.freeze({
  locale: 'en' as Locale,
  i18n: null,
  loading: true,
})

let currentState: I18nState = {
  locale: 'en',
  i18n: null,
  loading: true,
}

const listeners = new Set<() => void>()

function getSnapshot(): I18nState {
  return currentState
}

function getServerSnapshot(): I18nState {
  return SERVER_SNAPSHOT
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function setState(newState: I18nState) {
  currentState = newState
  // Notify all subscribers synchronously
  listeners.forEach((listener) => listener())
}

async function switchLocale(newLocale: Locale) {
  setState({ ...currentState, loading: true })
  const translations = await loadTranslations(newLocale)
  setState({
    locale: newLocale,
    i18n: new I18n(translations, newLocale),
    loading: false,
  })
  if (typeof window !== 'undefined') {
    saveLocalePreference(newLocale)
  }
}

// Track whether we've already initialized
let initialized = false

async function initStore() {
  if (initialized) return
  initialized = true

  let initialLocale: Locale = 'en'
  if (typeof window !== 'undefined') {
    const savedLocale = loadLocalePreference()
    initialLocale = savedLocale || getBrowserLocale()
  }

  const translations = await loadTranslations(initialLocale)
  setState({
    locale: initialLocale,
    i18n: new I18n(translations, initialLocale),
    loading: false,
  })
}

// ─── React hook ───────────────────────────────────────────────────

interface I18nHookValue {
  t: (key: string, params?: Record<string, string | number>) => string
  locale: Locale
  setLocale: (locale: Locale) => Promise<void>
  loading: boolean
}

/**
 * Hook that uses `useSyncExternalStore` to subscribe to the global
 * i18n store. All components calling this hook share the exact same state.
 */
export function useI18nContext(): I18nHookValue {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      if (!state.i18n) return key
      return state.i18n.t(key, params)
    },
    [state.i18n]
  )

  return {
    t,
    locale: state.locale,
    setLocale: switchLocale,
    loading: state.loading,
  }
}

// ─── Provider (thin wrapper — just triggers init on mount) ────────

/**
 * Thin provider that triggers store initialization on mount.
 * Does NOT use React Context — the store is module-level.
 * Keep this in the tree so init runs on the client after hydration.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  // Initialize the store on first client render
  if (typeof window !== 'undefined' && !initialized) {
    void initStore()
  }

  return <>{children}</>
}
