import { Component, ErrorInfo, ReactNode } from 'react'
import { logger } from '@/lib/logger'
import { useTranslation } from '@/hooks/use-translation'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary component that catches JavaScript errors in child component tree.
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * 
 * // With custom fallback:
 * <ErrorBoundary fallback={<div>Something went wrong</div>}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console in development
    logger.error('ErrorBoundary caught an error', error, { componentStack: errorInfo.componentStack })

    // Report to Sentry if available (will be initialized in start.tsx)
    if (typeof window !== 'undefined' && (window as any).__SENTRY__) {
      import('@sentry/react').then((Sentry) => {
        Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } })
      })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI uses a functional component for i18n
      return <DefaultErrorFallback error={this.state.error} onRetry={this.handleRetry} />
    }

    return this.props.children
  }
}

/** Functional fallback component — enables useTranslation() hook */
function DefaultErrorFallback({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="min-[100dvh] flex items-center justify-center bg-background">
      <div className="max-w-md p-8 rounded-lg border border-border bg-card text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold mb-2">{t('errors.generic')}</h2>
        <p className="text-muted-foreground mb-4">
          {t('errors.genericDesc')}
        </p>
        
        {/* Show error details in development */}
        {import.meta.env.DEV && error && (
          <details className="mb-4 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              {t('errors.errorDetails')}
            </summary>
            <pre className="mt-2 p-2 rounded bg-muted text-xs overflow-auto">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}

        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t('errors.tryAgain')}
        </button>
      </div>
    </div>
  )
}
