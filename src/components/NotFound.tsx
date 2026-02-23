import { Link } from '@tanstack/react-router'
import { Home, ArrowLeft } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

/**
 * 404 Not Found component used as defaultNotFoundComponent in router
 */
export function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="min-[100dvh] flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8 max-w-md">
        {/* 404 Text */}
        <div className="space-y-2">
          <h1 className="text-8xl font-bold text-primary/20">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">{t('errors.pageNotFound')}</h2>
          <p className="text-muted-foreground">
            {t('errors.pageNotFoundDesc')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            {t('errors.goHome')}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('errors.goBack')}
          </button>
        </div>
      </div>
    </div>
  )
}
