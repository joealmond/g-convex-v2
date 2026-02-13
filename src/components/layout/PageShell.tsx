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
    <div
      className="min-h-screen bg-background pb-24"
      style={{
        // Mobile: only safe area padding (no TopBar). Desktop: safe area + TopBar height
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)',
      }}
    >
      {/* Desktop: add extra top spacing to account for TopBar */}
      <div className={`hidden md:block h-12`} />
      <div className={`mx-auto px-4 sm:px-6 lg:max-w-7xl lg:px-8 ${className}`}>
        {children}
      </div>
    </div>
  )
}
