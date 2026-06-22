import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getActivityStatus } from './owner.constants';
import { pendingCountAfterResolve, shouldQueueOwnerAction } from './owner-flow.helpers';

describe('owner approval flow', () => {
  it('import path: uncategorized txn should queue owner action', () => {
    assert.equal(
      shouldQueueOwnerAction({
        hasSelection: false,
        hasPendingAction: false,
        hasDismissedAction: false,
      }),
      true,
    );
  });

  it('rules path: categorized txn should not queue', () => {
    assert.equal(
      shouldQueueOwnerAction({
        hasSelection: true,
        hasPendingAction: false,
        hasDismissedAction: false,
      }),
      false,
    );
  });

  it('dismissed txn should not re-queue on import', () => {
    assert.equal(
      shouldQueueOwnerAction({
        hasSelection: false,
        hasPendingAction: false,
        hasDismissedAction: true,
      }),
      false,
    );
  });

  it('resolve yes marks activity as confirmed not sorted', () => {
    assert.equal(getActivityStatus({ selectionId: null, status: 'REVIEWED' }), 'confirmed');
    assert.equal(getActivityStatus({ selectionId: 'gl-1', status: 'REVIEWED' }), 'sorted');
  });

  it('pending count drops by one after resolving a pending action', () => {
    assert.equal(pendingCountAfterResolve(5, true), 4);
    assert.equal(pendingCountAfterResolve(5, false), 5);
  });
});
