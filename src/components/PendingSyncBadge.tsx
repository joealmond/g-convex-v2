import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { getPendingCount } from '@/lib/offline-queue'
import { useTranslation } from '@/hooks/use-translation'
import { useOnlineStatus } from '@/hooks/use-online-status'

/**
 * Small badge showing pending offline sync count.
 * Shows on BottomTabs area when there are queued actions.
 * Disappears when queue is empty.
 */
export function PendingSyncBadge() {
  const [count, setCount] = useState(0)
  const { isOnline } = useOnlineStatus()
  const { t } = useTranslation()

  useEffect(() => {
    // Initial load
    getPendingCount().then(setCount)

    // Listen for queue changes
    const handleChange = () => {
      getPendingCount().then(setCount)
    }

    window.addEventListener('offline-queue-change', handleChange)
    return () => window.removeEventListener('offline-queue-change', handleChange)
  }, [])

  // Also refresh when online status changes (flush may have happened)
  useEffect(() => {
    if (isOnline) {
      // Small delay to let SyncManager flush first
      const timer = setTimeout(() => {
        getPendingCount().then(setCount)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isOnline])

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="fixed bottom-20 right-4 z-50 safe-bottom"
        >
          <div className="flex items-center gap-1.5 bg-amber-500 dark:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>{t('offline.syncPending', { count })}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
