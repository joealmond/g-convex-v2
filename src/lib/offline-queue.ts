/**
 * Offline action queue using idb-keyval (IndexedDB).
 * Queues user actions (votes, product creation) when offline
 * and flushes them to Convex when back online.
 */
import { get, set, del, keys } from 'idb-keyval'

const QUEUE_PREFIX = 'gmatrix-offline-'

export type QueuedActionType = 'vote' | 'addProduct' | 'editProduct'

export interface QueuedAction {
  id: string
  type: QueuedActionType
  payload: Record<string, unknown>
  createdAt: number
  retryCount: number
}

/**
 * Generate a unique ID for queued actions
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Get the IndexedDB key for a queued action
 */
function queueKey(id: string): string {
  return `${QUEUE_PREFIX}${id}`
}

/**
 * Enqueue an action for later sync
 */
export async function enqueue(
  type: QueuedActionType,
  payload: Record<string, unknown>
): Promise<QueuedAction> {
  const action: QueuedAction = {
    id: generateId(),
    type,
    payload,
    createdAt: Date.now(),
    retryCount: 0,
  }

  await set(queueKey(action.id), action)
  
  // Dispatch a custom event so PendingSyncBadge and SyncManager can react
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offline-queue-change'))
  }

  return action
}

/**
 * Remove an action from the queue (after successful sync)
 */
export async function dequeue(id: string): Promise<void> {
  await del(queueKey(id))

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offline-queue-change'))
  }
}

/**
 * Get all queued actions, sorted by creation time (oldest first)
 */
export async function getAll(): Promise<QueuedAction[]> {
  const allKeys = await keys()
  const queueKeys = allKeys.filter(
    (k) => typeof k === 'string' && k.startsWith(QUEUE_PREFIX)
  )

  const actions: QueuedAction[] = []
  for (const key of queueKeys) {
    const action = await get<QueuedAction>(key)
    if (action) actions.push(action)
  }

  return actions.sort((a, b) => a.createdAt - b.createdAt)
}

/**
 * Get the count of pending actions
 */
export async function getPendingCount(): Promise<number> {
  const allKeys = await keys()
  return allKeys.filter(
    (k) => typeof k === 'string' && k.startsWith(QUEUE_PREFIX)
  ).length
}

/**
 * Increment retry count for a failed action
 */
export async function incrementRetry(id: string): Promise<void> {
  const action = await get<QueuedAction>(queueKey(id))
  if (action) {
    action.retryCount += 1
    await set(queueKey(id), action)
  }
}

const MAX_RETRIES = 3

/**
 * Flush all queued actions using the provided executor.
 * Returns success/failure counts.
 */
export async function flush(
  executor: (action: QueuedAction) => Promise<void>
): Promise<{ success: number; failed: number; remaining: number }> {
  const actions = await getAll()
  let success = 0
  let failed = 0

  for (const action of actions) {
    if (action.retryCount >= MAX_RETRIES) {
      // Skip permanently failed actions — user must handle manually
      failed++
      continue
    }

    try {
      await executor(action)
      await dequeue(action.id)
      success++
    } catch (err) {
      console.warn(`Failed to sync action ${action.id}:`, err)
      await incrementRetry(action.id)
      failed++
    }
  }

  const remaining = (await getAll()).length
  return { success, failed, remaining }
}

/**
 * Clear all queued actions (for debugging or reset)
 */
export async function clearAll(): Promise<void> {
  const allKeys = await keys()
  const queueKeys = allKeys.filter(
    (k) => typeof k === 'string' && k.startsWith(QUEUE_PREFIX)
  )

  for (const key of queueKeys) {
    await del(key)
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offline-queue-change'))
  }
}
