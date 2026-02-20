import { ReactNode } from 'react'
import { useTranslation } from '@/hooks/use-translation'

interface FeedGridProps {
  children: ReactNode
  isEmpty?: boolean
}

/**
 * Responsive grid for product cards
 * 2 columns on mobile, 3 on tablet, 4 on desktop
 */
export function FeedGrid({ children, isEmpty }: FeedGridProps) {
  const { t } = useTranslation()
  return (
    <div>
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-sm mb-2">{t('feed.noProductsFound')}</p>
          <p className="text-xs text-muted-foreground">{t('feed.tryAdjustingFilters')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {children}
        </div>
      )}
    </div>
  )
}
