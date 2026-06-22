/** Shared owner approval choice strings — keep API, AB pipeline, and web in sync. */
export const APPROVAL_CHOICE_YES = "Yes, that's right";
export const APPROVAL_CHOICE_NO = 'No, something else';

export const APPROVAL_CHOICES = [APPROVAL_CHOICE_YES, APPROVAL_CHOICE_NO] as const;

export const PENDING_ACTIONS_DISPLAY_LIMIT = 3;

export function plainCategory(accountName: string | undefined): string {
  if (!accountName) return 'Not categorized yet';
  return accountName.replace(/\s*\(\d+\)\s*$/, '').trim();
}

export function formatTxnDate(date: Date): string {
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function buildApprovalQuestion(params: {
  spent: number | null;
  received: number | null;
  payee: string | null;
  description: string | null;
  date: Date;
}): string {
  const amount = params.spent != null ? Number(params.spent) : Number(params.received ?? 0);
  const counterparty = params.payee || params.description || 'Unknown';
  const formatted = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
  const dateLabel = formatTxnDate(params.date);

  if (params.spent != null) {
    return `We're not sure what this was — does this ${formatted} payment to ${counterparty} on ${dateLabel} look correct?`;
  }
  return `We're not sure what this was — does this ${formatted} received from ${counterparty} on ${dateLabel} look correct?`;
}

export type ActivityStatus = 'sorted' | 'confirmed' | null;

export function getActivityStatus(txn: {
  selectionId: string | null;
  status: string;
}): ActivityStatus {
  if (txn.selectionId) return 'sorted';
  if (txn.status === 'REVIEWED' || txn.status === 'RECONCILED') return 'confirmed';
  return null;
}

export function isValidApprovalChoice(choices: string[], choice: string): boolean {
  return choices.includes(choice);
}
