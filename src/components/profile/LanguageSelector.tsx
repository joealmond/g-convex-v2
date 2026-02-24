import type { Locale } from '@/lib/i18n'

/**
 * Single source of truth for supported languages.
 * Add a new entry here and it appears in both the guest and logged-in settings.
 */
export const LOCALES: { value: Locale; flag: string; label: string }[] = [
  { value: 'en', flag: '🇬🇧', label: 'EN' },
  { value: 'hu', flag: '🇭🇺', label: 'HU' },
]

interface LanguageSelectorProps {
  locale: string
  setLocale: (locale: Locale) => void
}

/**
 * Pill-style language selector — consistent across guest and signed-in profiles.
 * Each locale in LOCALES gets a pill; active one is highlighted with primary color.
 */
export function LanguageSelector({ locale, setLocale }: LanguageSelectorProps) {
  return (
    <div className="flex gap-1">
      {LOCALES.map(({ value, flag, label }) => (
        <button
          key={value}
          onClick={() => setLocale(value)}
          className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
            locale === value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {flag} {label}
        </button>
      ))}
    </div>
  )
}
