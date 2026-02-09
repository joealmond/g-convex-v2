import { useI18nContext } from '@/hooks/i18n-context'

/**
 * Hook for managing translations and locale switching.
 * Consumes the shared I18nProvider context so all components
 * share one locale state.
 */
export function useTranslation() {
  return useI18nContext()
}
