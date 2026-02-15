import { useEffect, useRef } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { toast } from 'sonner'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { useTranslation } from '@/hooks/use-translation'
import { flush, getAll, type QueuedAction } from '@/lib/offline-queue'

/**
 * SyncManager — renders nothing, purely logic.
 * Mounted in __root.tsx. When the app comes back online,
 * it flushes the offline queue via Convex mutations.
 */
export function SyncManager() {
  const { isOnline } = useOnlineStatus()
  const { t } = useTranslation()
  const castVote = useMutation(api.votes.cast)
  const createProduct = useMutation(api.products.create)
  const isSyncing = useRef(false)

  useEffect(() => {
    if (!isOnline || isSyncing.current) return

    const syncQueue = async () => {
      const actions = await getAll()
      if (actions.length === 0) return

      isSyncing.current = true
      toast.info(t('offline.syncing', { count: actions.length }))

      const executor = async (action: QueuedAction) => {
        switch (action.type) {
          case 'vote':
            await castVote(action.payload as Parameters<typeof castVote>[0])
            break
          case 'addProduct':
            await createProduct(action.payload as Parameters<typeof createProduct>[0])
            break
          default:
            console.warn(`Unknown queued action type: ${action.type}`)
        }
      }

      const result = await flush(executor)

      if (result.success > 0 && result.failed === 0) {
        toast.success(t('offline.syncComplete'))
      } else if (result.failed > 0) {
        toast.warning(t('offline.syncFailed'))
      }

      isSyncing.current = false
    }

    syncQueue()
  }, [isOnline, castVote, createProduct, t])

  return null
}
