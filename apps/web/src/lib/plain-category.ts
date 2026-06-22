/** Strip GL codes from ledger names for owner-facing labels. */
export function plainCategory(accountName: string | undefined | null): string {
  if (!accountName) return 'Not categorized yet';
  return accountName.replace(/\s*\(\d+\)\s*$/, '').trim();
}

export function txnLabel(
  payee: string | null | undefined,
  description: string | null | undefined,
  selectionName: string | undefined | null,
): string {
  if (selectionName) return plainCategory(selectionName);
  if (payee) return payee;
  if (description) return description;
  return 'Transaction';
}
