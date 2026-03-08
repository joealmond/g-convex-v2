import { test, expect } from 'vitest';
import { safeAggregateDelete } from '../lib/utils';

interface MockDoc {
  id: string
  shouldFailWithMissingKey?: boolean
  shouldFailWithOtherError?: boolean
}

// Mock TableAggregate for testing
class MockAggregate {
  async delete(_ctx: unknown, doc: MockDoc) {
    if (doc.shouldFailWithMissingKey) {
      throw new Error('DELETE_MISSING_KEY: The document is not in the aggregate index');
    }
    if (doc.shouldFailWithOtherError) {
      throw new Error('Network timeout');
    }
    return true; // Success case
  }
}

test('safeAggregateDelete succeeds normally', async () => {
  const mockAggregate = new MockAggregate();
  
  // Should not throw
  await expect(safeAggregateDelete({}, mockAggregate, { id: '123' })).resolves.not.toThrow();
});

test('safeAggregateDelete swallows DELETE_MISSING_KEY errors safely', async () => {
  const mockAggregate = new MockAggregate();
  
  // The error is swallowed, so the promise should resolve successfully without throwing
  await expect(
    safeAggregateDelete({}, mockAggregate, { id: '123', shouldFailWithMissingKey: true })
  ).resolves.not.toThrow();
});

test('safeAggregateDelete re-throws unrelated errors', async () => {
  const mockAggregate = new MockAggregate();
  
  // Real network/DB errors should STILL throw
  await expect(
    safeAggregateDelete({}, mockAggregate, { id: '123', shouldFailWithOtherError: true })
  ).rejects.toThrow('Network timeout');
});
