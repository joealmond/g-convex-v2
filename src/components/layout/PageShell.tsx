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
      className="min-h-dvh bg-background pb-24 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] md:min-h-0 md:pt-0 md:pb-8 flex flex-col items-center"
    >
      {/* Desktop: add extra top spacing to account for TopBar */}
      <div className={`hidden md:block h-6`} />
      <div className={`w-full mx-auto md:w-[min(calc(100%-2.5rem),74rem)] xl:w-[min(calc(100%-4rem),88rem)] md:max-w-none md:min-h-[calc(100dvh-5.5rem)] md:shadow-[0_2px_40px_rgba(0,0,0,0.08)] md:border md:border-border md:rounded-3xl md:bg-card ${className}`}>
        {children}
      </div>
    </div>
  )
}
