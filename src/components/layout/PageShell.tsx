import { ReactNode } from 'react'

interface PageShellProps {
  children: ReactNode
  className?: string
}

/**
 * Common page wrapper for consistent layout
 * Provides container width, padding, and spacing for TopBar + BottomTabs
 */
export function PageShell({ children, className = '' }: PageShellProps) {
  return (
    <div className="min-h-screen bg-background pt-12 pb-20">
      <div className={`mx-auto px-4 sm:px-6 lg:max-w-7xl lg:px-8 ${className}`}>
        {children}
      </div>
    </div>
  )
}
