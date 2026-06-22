/** Pure helpers for owner approval flow — used in tests and AB pipeline guards. */
export type TxnQueueState = {
  hasSelection: boolean;
  hasPendingAction: boolean;
  hasDismissedAction: boolean;
};

/** Whether AB pipeline should create a new OwnerAction for this transaction. */
export function shouldQueueOwnerAction(state: TxnQueueState): boolean {
  if (state.hasSelection) return false;
  if (state.hasDismissedAction) return false;
  if (state.hasPendingAction) return false;
  return true;
}

/** After resolve: whether Today pending count should decrease. */
export function pendingCountAfterResolve(
  currentPending: number,
  wasPending: boolean,
): number {
  if (!wasPending) return currentPending;
  return Math.max(0, currentPending - 1);
}
