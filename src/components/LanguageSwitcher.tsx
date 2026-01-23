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
  const { locale, setLocale } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Change language">
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setLocale('en')}
          className={locale === 'en' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇬🇧</span>
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale('hu')}
          className={locale === 'hu' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇭🇺</span>
          Magyar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
