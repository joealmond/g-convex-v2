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
      className="min-[100dvh] bg-background pb-24 md:pb-8 flex flex-col items-center"
      style={{
        // Mobile: only safe area padding (no TopBar). Desktop: safe area + TopBar height
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)',
      }}
    >
      {/* Desktop: add extra top spacing to account for TopBar */}
      <div className={`hidden md:block h-6`} />
      <div className={`w-full mx-auto md:max-w-3xl md:shadow-[0_2px_40px_rgba(0,0,0,0.08)] md:border md:border-border md:rounded-3xl md:bg-card md:overflow-hidden min-h-[calc(100dvh-5rem)] ${className}`}>
        {children}
      </div>
    </div>
  )
}
