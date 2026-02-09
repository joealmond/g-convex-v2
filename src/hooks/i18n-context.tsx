import type { ReactNode } from 'react'

/**
 * I18nProvider is now a no-op pass-through.
 * Translations use static imports + CustomEvent (see src/lib/i18n.ts).
 * This file only exists so __root.tsx doesn't need changes.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

// Re-export the hook for any code that still imports from here
export { useTranslationHook as useI18nContext } from '@/lib/i18n'
