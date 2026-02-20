import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslation } from '@/hooks/use-translation'
import { Languages } from 'lucide-react'

/**
 * Language switcher component for i18n
 * Switches between English and Hungarian
 */
export function LanguageSwitcher() {
  const { t, locale, setLocale } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title={t('common.changeLanguage')} aria-label={t('common.changeLanguage')}>
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => setLocale('en')}
          className={locale === 'en' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇬🇧</span>
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => setLocale('hu')}
          className={locale === 'hu' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇭🇺</span>
          Magyar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
