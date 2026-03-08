import { useTranslation } from '@/hooks/use-translation'
import type { DataSource } from '@/lib/image-upload'
import { cn } from '@/lib/utils'
import { CheckCircle2, FlaskConical, AlertTriangle, Users } from 'lucide-react'

interface DataSourceBadgeProps {
  source: DataSource | undefined | null
  className?: string
}

const CONFIG: Record<DataSource, {
  icon: typeof CheckCircle2
  colorClass: string
  labelKey: string
}> = {
  openfoodfacts: {
    icon: CheckCircle2,
    colorClass: 'text-safety-high bg-safety-high/10 border-safety-high/30',
    labelKey: 'dataSource.openfoodfacts',
  },
  'ai-ingredients': {
    icon: FlaskConical,
    colorClass: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-800',
    labelKey: 'dataSource.aiIngredients',
  },
  'ai-estimate': {
    icon: AlertTriangle,
    colorClass: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800',
    labelKey: 'dataSource.aiEstimate',
  },
  community: {
    icon: Users,
    colorClass: 'text-muted-foreground bg-muted border-border',
    labelKey: 'dataSource.community',
  },
}

/**
 * Small inline badge showing where a product's allergen data came from.
 * Used on the product detail page near the allergen section.
 */
export function DataSourceBadge({ source, className }: DataSourceBadgeProps) {
  const { t } = useTranslation()
  const cfg = CONFIG[source ?? 'community']
  const Icon = cfg.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-tight',
        cfg.colorClass,
        className,
      )}
    >
      <Icon className="h-3 w-3 flex-shrink-0" />
      {t(cfg.labelKey)}
    </span>
  )
}
