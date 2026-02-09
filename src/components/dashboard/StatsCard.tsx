import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: {
    value: number
    label: string
  }
  footer?: ReactNode
}

/**
 * Reusable stats card for displaying user metrics
 */
export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  footer,
}: StatsCardProps) {
  return (
    <Card className="overflow-hidden">
      {/* Mobile: compact vertical pill */}
      <div className="flex flex-col items-center justify-center p-2 gap-0.5 md:hidden">
        {icon && <div className="flex-shrink-0 mb-0.5">{icon}</div>}
        <span className="text-lg font-bold leading-none">{value}</span>
        <p className="text-[10px] text-muted-foreground text-center leading-tight truncate w-full">{title}</p>
      </div>

      {/* Desktop: full layout */}
      <div className="hidden md:block">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              <span className={trend.value >= 0 ? 'text-green-600' : 'text-red-600'}>
                {trend.value >= 0 ? '+' : ''}{trend.value}
              </span>
              <span className="text-muted-foreground">{trend.label}</span>
            </div>
          )}
          {footer && <div className="mt-3">{footer}</div>}
        </CardContent>
      </div>
    </Card>
  )
}

