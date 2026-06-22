export type QueueStatus = 'needs_attention' | 'clear' | 'getting_started';

export type BankConfidence = 'low' | 'partial' | 'actual';

export type VatDisplay = 'not_registered' | 'unknown' | 'estimate';

export interface TodayTrustInput {
  bankAccountCount: number;
  transactionCount: number;
  unconfirmedCount: number;
  handledCount: number;
  cashPosition: number;
  lastBankUpdated: Date | null;
  pendingActionCount: number;
  vatRegistered: boolean;
  openPeriod: {
    ref: string;
    periodStart: Date;
    periodEnd: Date;
    vatPayable: number;
    vatRefundable: number;
    submissionDue: Date | null;
  } | null;
  vatCalculatedAt: Date | null;
  invoicesInPeriod: number;
  billsInPeriod: number;
  categorizedInPeriod: number;
  bankTxnsInPeriod: number;
  nextVatDue: Date | null;
}

export interface TodayQueueView {
  status: QueueStatus;
  message: string;
  pendingCount: number;
}

export interface TodayBankBalanceView {
  amount: number | null;
  accountCount: number;
  transactionCount: number;
  unconfirmedCount: number;
  lastUpdated: string | null;
  confidence: BankConfidence;
  typeLabel: 'Actual' | 'Partial';
  supportingText: string;
}

export interface TodayVatView {
  display: VatDisplay;
  amount: number | null;
  typeLabel: 'Estimated' | 'Unknown' | null;
  headline: string;
  supportingText: string;
  reason: string | null;
  periodLabel: string | null;
  lastCalculated: string | null;
  nextDue: string | null;
}

function formatPeriodLabel(start: Date, end: Date, ref: string): string {
  const fmt = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${ref} (${fmt.format(start)} – ${fmt.format(end)})`;
}

function daysSince(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}

export function scoreBank(input: TodayTrustInput): number {
  let score = 0;
  if (input.bankAccountCount >= 1) score += 20;
  if (input.transactionCount >= 1) score += 20;
  if (input.lastBankUpdated) {
    const age = daysSince(input.lastBankUpdated);
    if (age <= 7) score += 20;
    else if (age <= 30) score += 10;
  }
  if (input.bankAccountCount >= 1) score += 10;
  if (input.transactionCount > 0) {
    const handledRatio = (input.transactionCount - input.unconfirmedCount) / input.transactionCount;
    if (handledRatio >= 0.9) score += 20;
  }
  if (input.unconfirmedCount > 0) score -= 15;
  if (input.transactionCount > 0 && !input.lastBankUpdated) score -= 20;
  return Math.max(0, Math.min(100, score));
}

function scoreVat(input: TodayTrustInput, bankScore: number): number {
  if (!input.vatRegistered) return 0;
  if (!input.openPeriod) return 10;

  let score = 25;
  if (input.vatCalculatedAt) {
    score += 25;
    const age = daysSince(input.vatCalculatedAt);
    if (age <= 14) score += 15;
    else if (age > 60) score -= 30;
  } else {
    return Math.min(29, score);
  }

  if (input.invoicesInPeriod >= 1) score += 10;
  if (input.billsInPeriod >= 1) score += 10;

  if (input.bankTxnsInPeriod > 0) {
    const ratio = input.categorizedInPeriod / input.bankTxnsInPeriod;
    if (ratio >= 0.8) score += 15;
    else score -= 10;
  }

  if (input.unconfirmedCount > 0) score -= 10;
  if (daysSince(input.openPeriod.periodEnd) > 90) score -= 20;

  return Math.max(0, Math.min(100, score));
}

function vatSanityFails(input: TodayTrustInput, bankScore: number): string | null {
  const period = input.openPeriod;
  if (!period) return null;

  const payable = Number(period.vatPayable);
  if (payable <= 0) return null;

  if (input.invoicesInPeriod === 0 && input.billsInPeriod === 0) {
    return 'We need invoices or bills for this VAT period before we can show an estimate.';
  }

  if (input.vatCalculatedAt && daysSince(input.vatCalculatedAt) > 60) {
    return 'Your last VAT calculation is out of date.';
  }

  if (!input.vatCalculatedAt) {
    return 'VAT has not been calculated for this period yet.';
  }

  if (
    bankScore >= 30 &&
    input.cashPosition > 0 &&
    payable > input.cashPosition * 1.5
  ) {
    return 'This estimate looks unusual compared to your bank balance, so we are not showing a number until you review.';
  }

  if (daysSince(period.periodEnd) > 90) {
    return 'This VAT period is overdue for review.';
  }

  return null;
}

export function buildQueueView(input: TodayTrustInput): TodayQueueView {
  const pendingCount = input.pendingActionCount;

  if (pendingCount > 0) {
    return {
      status: 'needs_attention',
      message:
        pendingCount === 1
          ? '1 question needs your answer'
          : `${pendingCount} questions need your answer`,
      pendingCount,
    };
  }

  const hasBankData = input.bankAccountCount > 0 && input.transactionCount > 0;
  if (!hasBankData) {
    return {
      status: 'getting_started',
      message: 'Import your bank transactions to get started',
      pendingCount: 0,
    };
  }

  return {
    status: 'clear',
    message: 'Nothing needs your attention right now',
    pendingCount: 0,
  };
}

export function buildBankBalanceView(input: TodayTrustInput): TodayBankBalanceView {
  const score = scoreBank(input);
  const confidence: BankConfidence = score >= 60 ? 'actual' : score >= 30 ? 'partial' : 'low';
  const typeLabel: 'Actual' | 'Partial' = confidence === 'actual' ? 'Actual' : 'Partial';

  if (input.bankAccountCount === 0) {
    return {
      amount: null,
      accountCount: 0,
      transactionCount: 0,
      unconfirmedCount: 0,
      lastUpdated: null,
      confidence: 'low',
      typeLabel: 'Partial',
      supportingText: 'Add a bank account in Money to see your balance here.',
    };
  }

  if (input.transactionCount === 0) {
    return {
      amount: input.cashPosition,
      accountCount: input.bankAccountCount,
      transactionCount: 0,
      unconfirmedCount: 0,
      lastUpdated: null,
      confidence: 'partial',
      typeLabel: 'Partial',
      supportingText: 'Opening balance only. Import transactions to update this figure.',
    };
  }

  const accountWord = input.bankAccountCount === 1 ? 'account' : 'accounts';
  let supportingText = `Across ${input.bankAccountCount} connected ${accountWord}. Based on your latest bank import.`;

  if (input.unconfirmedCount > 0) {
    const n = input.unconfirmedCount;
    supportingText += ` Includes ${n} transaction${n === 1 ? '' : 's'} we have not confirmed with you yet.`;
  }

  if (confidence !== 'actual') {
    supportingText += ' This figure may not be fully up to date.';
  }

  return {
    amount: input.cashPosition,
    accountCount: input.bankAccountCount,
    transactionCount: input.transactionCount,
    unconfirmedCount: input.unconfirmedCount,
    lastUpdated: input.lastBankUpdated?.toISOString() ?? null,
    confidence,
    typeLabel,
    supportingText,
  };
}

export function buildVatView(input: TodayTrustInput, bankScore: number): TodayVatView {
  const base = {
    amount: null as number | null,
    typeLabel: null as 'Estimated' | 'Unknown' | null,
    periodLabel: null as string | null,
    lastCalculated: input.vatCalculatedAt?.toISOString() ?? null,
    nextDue: input.nextVatDue?.toISOString() ?? input.openPeriod?.submissionDue?.toISOString() ?? null,
  };

  if (!input.vatRegistered) {
    return {
      ...base,
      display: 'not_registered',
      headline: 'VAT tracking is not set up',
      supportingText: 'If your business is VAT registered, add your VAT details in Settings.',
      reason: null,
    };
  }

  if (!input.openPeriod) {
    return {
      ...base,
      display: 'unknown',
      typeLabel: 'Unknown',
      headline: "We can't estimate VAT yet",
      supportingText: 'More information is required.',
      reason: 'No open VAT period is configured for this business.',
    };
  }

  const periodLabel = formatPeriodLabel(
    input.openPeriod.periodStart,
    input.openPeriod.periodEnd,
    input.openPeriod.ref,
  );
  base.periodLabel = periodLabel;

  const vatScore = scoreVat(input, bankScore);
  const sanityReason = vatSanityFails(input, bankScore);

  if (vatScore < 60 || sanityReason) {
    return {
      ...base,
      display: 'unknown',
      typeLabel: 'Unknown',
      headline: "We can't estimate VAT yet",
      supportingText: 'More information is required.',
      reason:
        sanityReason ??
        (input.unconfirmedCount > 0
          ? 'Some bank transactions still need your confirmation — VAT may change.'
          : 'We need more complete records for this VAT period.'),
    };
  }

  const payable = Number(input.openPeriod.vatPayable);
  const refundable = Number(input.openPeriod.vatRefundable);
  const amount = payable > 0 ? payable : refundable > 0 ? refundable : 0;

  const docCount = input.invoicesInPeriod + input.billsInPeriod;
  const calcDate = input.vatCalculatedAt
    ? new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        input.vatCalculatedAt,
      )
    : null;

  const headline =
    refundable > 0 && payable <= 0
      ? `About R${refundable.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VAT refund expected`
      : `About R${payable.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VAT due`;

  return {
    ...base,
    display: 'estimate',
    amount,
    typeLabel: 'Estimated',
    headline,
    supportingText: `For ${periodLabel}. Based on ${input.invoicesInPeriod} invoice${input.invoicesInPeriod === 1 ? '' : 's'} and ${input.billsInPeriod} bill${input.billsInPeriod === 1 ? '' : 's'} in VonHelm.${calcDate ? ` Last calculated ${calcDate}.` : ''} This is an estimate for planning — not a SARS submission.`,
    reason: null,
  };
}
