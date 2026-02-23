import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// In-memory store to simulate IndexedDB via idb-keyval
let store: Map<string, unknown>

vi.mock('idb-keyval', () => ({
  get: vi.fn((key: string) => Promise.resolve(store.get(key))),
  set: vi.fn((key: string, value: unknown) => {
    store.set(key, value)
    return Promise.resolve()
  }),
  del: vi.fn((key: string) => {
    store.delete(key)
    return Promise.resolve()
  }),
  keys: vi.fn(() => Promise.resolve(Array.from(store.keys()))),
}))

import {
  enqueue,
  dequeue,
  getAll,
  getPendingCount,
  incrementRetry,
  flush,
  clearAll,
} from './offline-queue'

describe('offline-queue', () => {
  beforeEach(() => {
    store = new Map()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('enqueue', () => {
    it('adds an action to the queue and returns it', async () => {
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))

      const action = await enqueue('vote', { productId: 'abc', safety: 80, taste: 70 })

      expect(action.type).toBe('vote')
      expect(action.payload).toEqual({ productId: 'abc', safety: 80, taste: 70 })
      expect(action.createdAt).toBe(new Date('2024-06-15T12:00:00Z').getTime())
      expect(action.retryCount).toBe(0)
      expect(action.id).toBeTruthy()
    })

    it('stores the action in IndexedDB with correct key prefix', async () => {
      const action = await enqueue('vote', { test: true })
      expect(store.has(`gmatrix-offline-${action.id}`)).toBe(true)
    })

    it('dispatches offline-queue-change event', async () => {
      const listener = vi.fn()
      window.addEventListener('offline-queue-change', listener)

      await enqueue('addProduct', { name: 'Test' })

      expect(listener).toHaveBeenCalledTimes(1)
      window.removeEventListener('offline-queue-change', listener)
    })
  })

  describe('dequeue', () => {
    it('removes an action from the queue', async () => {
      const action = await enqueue('vote', { test: true })
      expect(await getPendingCount()).toBe(1)

      await dequeue(action.id)
      expect(await getPendingCount()).toBe(0)
    })

    it('dispatches offline-queue-change event', async () => {
      const action = await enqueue('vote', { test: true })
      const listener = vi.fn()
      window.addEventListener('offline-queue-change', listener)

      await dequeue(action.id)

      expect(listener).toHaveBeenCalledTimes(1)
      window.removeEventListener('offline-queue-change', listener)
    })
  })

  describe('getAll', () => {
    it('returns empty array when queue is empty', async () => {
      const actions = await getAll()
      expect(actions).toEqual([])
    })

    it('returns all queued actions sorted by creation time', async () => {
      vi.setSystemTime(new Date('2024-01-01T10:00:00Z'))
      const a1 = await enqueue('vote', { first: true })

      vi.setSystemTime(new Date('2024-01-01T11:00:00Z'))
      const a2 = await enqueue('addProduct', { second: true })

      vi.setSystemTime(new Date('2024-01-01T09:00:00Z'))
      const a3 = await enqueue('editProduct', { third: true })

      const actions = await getAll()
      expect(actions).toHaveLength(3)
      expect(actions[0]!.id).toBe(a3.id) // 09:00 — oldest
      expect(actions[1]!.id).toBe(a1.id) // 10:00
      expect(actions[2]!.id).toBe(a2.id) // 11:00 — newest
    })

    it('ignores non-queue keys in IndexedDB', async () => {
      store.set('some-other-key', { unrelated: true })
      await enqueue('vote', { test: true })

      const actions = await getAll()
      expect(actions).toHaveLength(1)
    })
  })

  describe('getPendingCount', () => {
    it('returns 0 when queue is empty', async () => {
      expect(await getPendingCount()).toBe(0)
    })

    it('returns correct count', async () => {
      await enqueue('vote', { a: 1 })
      await enqueue('vote', { b: 2 })
      await enqueue('addProduct', { c: 3 })

      expect(await getPendingCount()).toBe(3)
    })
  })

  describe('incrementRetry', () => {
    it('increases retryCount by 1', async () => {
      const action = await enqueue('vote', { test: true })
      expect(action.retryCount).toBe(0)

      await incrementRetry(action.id)

      const actions = await getAll()
      expect(actions[0]!.retryCount).toBe(1)
    })

    it('handles non-existent action gracefully', async () => {
      // Should not throw
      await incrementRetry('non-existent-id')
    })
  })

  describe('flush', () => {
    it('executes all actions and removes them on success', async () => {
      await enqueue('vote', { a: 1 })
      await enqueue('vote', { b: 2 })

      const executor = vi.fn().mockResolvedValue(undefined)
      const result = await flush(executor)

      expect(executor).toHaveBeenCalledTimes(2)
      expect(result.success).toBe(2)
      expect(result.failed).toBe(0)
      expect(result.remaining).toBe(0)
    })

    it('increments retry on executor failure and reports as failed', async () => {
      await enqueue('vote', { fail: true })

      const executor = vi.fn().mockRejectedValue(new Error('Network error'))
      const result = await flush(executor)

      expect(result.success).toBe(0)
      expect(result.failed).toBe(1)
      expect(result.remaining).toBe(1)

      // Retry count should have been incremented
      const actions = await getAll()
      expect(actions[0]!.retryCount).toBe(1)
    })

    it('skips actions that have exceeded MAX_RETRIES (3)', async () => {
      const action = await enqueue('vote', { permanent: true })

      // Manually set retry count to 3
      const key = `gmatrix-offline-${action.id}`
      const stored = store.get(key) as Record<string, unknown>
      store.set(key, { ...stored, retryCount: 3 })

      const executor = vi.fn()
      const result = await flush(executor)

      expect(executor).not.toHaveBeenCalled()
      expect(result.failed).toBe(1)
      expect(result.remaining).toBe(1)
    })

    it('handles mix of success and failure', async () => {
      await enqueue('vote', { succeeds: true })
      await enqueue('vote', { fails: true })
      await enqueue('addProduct', { succeeds: true })

      let callCount = 0
      const executor = vi.fn(async () => {
        callCount++
        if (callCount === 2) throw new Error('fail')
      })

      const result = await flush(executor)

      expect(result.success).toBe(2)
      expect(result.failed).toBe(1)
      expect(result.remaining).toBe(1)
    })

    it('returns zeros when queue is empty', async () => {
      const executor = vi.fn()
      const result = await flush(executor)

      expect(result).toEqual({ success: 0, failed: 0, remaining: 0 })
      expect(executor).not.toHaveBeenCalled()
    })
  })

  describe('clearAll', () => {
    it('removes all queued actions', async () => {
      await enqueue('vote', { a: 1 })
      await enqueue('addProduct', { b: 2 })
      await enqueue('editProduct', { c: 3 })

      expect(await getPendingCount()).toBe(3)

      await clearAll()

      expect(await getPendingCount()).toBe(0)
    })

    it('does not remove non-queue keys', async () => {
      store.set('some-other-key', { keep: true })
      await enqueue('vote', { remove: true })

      await clearAll()

      expect(store.has('some-other-key')).toBe(true)
      expect(await getPendingCount()).toBe(0)
    })

    it('dispatches offline-queue-change event', async () => {
      await enqueue('vote', { test: true })
      const listener = vi.fn()
      window.addEventListener('offline-queue-change', listener)

      await clearAll()

      expect(listener).toHaveBeenCalledTimes(1)
      window.removeEventListener('offline-queue-change', listener)
    })
  })
})
