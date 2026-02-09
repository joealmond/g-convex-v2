import { useTranslationHook } from '@/lib/i18n'

/**
 * Hook for managing translations and locale switching.
 * Delegates to the useTranslationHook in i18n.ts which uses
 * static imports + CustomEvent for reliable cross-component sync.
 */
export function useTranslation() {
  return useTranslationHook()
}
