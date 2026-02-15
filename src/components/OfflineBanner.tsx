import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { useTranslation } from '@/hooks/use-translation'

/**
 * Thin banner at top of app when offline.
 * Slides in/out with animation.
 */
export function OfflineBanner() {
  const { isOnline } = useOnlineStatus()
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="bg-amber-500 dark:bg-amber-600 text-white text-center py-1.5 px-4 text-xs font-medium flex items-center justify-center gap-2">
            <WifiOff className="h-3.5 w-3.5" />
            <span>{t('offline.banner')}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
