import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { prisma } from '@accounting/db';

import { assertCompanyAccess } from '../auth/jwt.strategy';

import {

  APPROVAL_CHOICE_NO,

  APPROVAL_CHOICE_YES,

  getActivityStatus,

  isValidApprovalChoice,

  PENDING_ACTIONS_DISPLAY_LIMIT,

  plainCategory,

} from './owner.constants';

import {

  buildBankBalanceView,

  buildQueueView,

  buildVatView,

  scoreBank,

  type TodayTrustInput,

} from './owner-today-trust';



function txnLabel(

  payee: string | null,

  description: string | null,

  selectionName: string | undefined,

): string {

  if (selectionName) return plainCategory(selectionName);

  if (payee) return payee;

  if (description) return description;

  return 'Transaction';

}



function isOwnerActionSchemaError(error: unknown): boolean {

  if (typeof error !== 'object' || error === null || !('code' in error)) return false;

  const code = (error as { code?: string }).code;

  return code === 'P2021' || code === 'P2022';

}



@Injectable()

export class OwnerService {

  private readonly db = prisma;



  async health(userId: string, companyId: string) {

    await assertCompanyAccess(this.db, userId, companyId);

    const company = await this.db.company.findUnique({

      where: { id: companyId },

      select: { id: true, name: true, status: true },

    });

    return {

      status: 'ok',

      companyId,

      companyName: company?.name ?? null,

      timestamp: new Date().toISOString(),

    };

  }



  async resolveAction(userId: string, companyId: string, actionId: string, choice: string) {

    await assertCompanyAccess(this.db, userId, companyId);



    const action = await this.db.ownerAction.findFirst({

      where: { id: actionId, companyId },

      include: { bankTransaction: true },

    });

    if (!action) throw new NotFoundException('Approval not found');



    if (action.status !== 'PENDING') {

      return { ok: true, alreadyResolved: true };

    }



    const choices = (action.choices as string[]) ?? [];

    if (!isValidApprovalChoice(choices, choice)) {

      throw new BadRequestException('Invalid choice for this approval');

    }



    const now = new Date();



    if (choice === APPROVAL_CHOICE_YES) {

      await this.db.ownerAction.update({

        where: { id: actionId },

        data: {

          status: 'RESOLVED',

          selectedChoice: choice,

          resolvedAt: now,

          resolvedByUserId: userId,

        },

      });

      if (action.bankTransactionId) {

        await this.db.bankTransaction.update({

          where: { id: action.bankTransactionId },

          data: { status: 'REVIEWED' },

        });

      }

    } else if (choice === APPROVAL_CHOICE_NO) {

      await this.db.ownerAction.update({

        where: { id: actionId },

        data: {

          status: 'DISMISSED',

          selectedChoice: choice,

          resolvedAt: now,

          resolvedByUserId: userId,

        },

      });

    }



    return { ok: true, alreadyResolved: false };

  }



  async getToday(userId: string, companyId: string) {

    await assertCompanyAccess(this.db, userId, companyId);



    try {

      let ownerActionsAvailable = true;



      const openVat = await this.db.vatPeriod.findFirst({

        where: { companyId, status: 'OPEN' },

        include: { vatReturn: true },

      });



      const periodRange = openVat

        ? { gte: openVat.periodStart, lte: openVat.periodEnd }

        : null;



      let pendingApprovalCount = 0;

      let pendingActions: Awaited<ReturnType<typeof this.fetchPendingActions>> = [];



      try {

        pendingApprovalCount = await this.db.ownerAction.count({

          where: { companyId, status: 'PENDING' },

        });

        pendingActions = await this.fetchPendingActions(companyId);

      } catch (error) {

        if (isOwnerActionSchemaError(error)) {

          ownerActionsAvailable = false;

        } else {

          throw error;

        }

      }



      const [

        bankAccounts,

        sortedCount,

        confirmedCount,

        recentTxns,

        company,

        vatSetting,

        unconfirmedCount,

        lastTxnAgg,

        transactionCount,

        txnTotals,

        bankTxnsInPeriodCount,

        categorizedInPeriodCount,

        invoicesInPeriod,

        billsInPeriod,

      ] = await Promise.all([

        this.db.bankAccount.findMany({

          where: { companyId },

          select: { id: true, openingBalance: true },

        }),

        this.db.bankTransaction.count({

          where: { bankAccount: { companyId }, selectionId: { not: null } },

        }),

        this.db.bankTransaction.count({

          where: {

            bankAccount: { companyId },

            selectionId: null,

            status: { in: ['REVIEWED', 'RECONCILED'] },

          },

        }),

        this.db.bankTransaction.findMany({

          where: { bankAccount: { companyId } },

          orderBy: { createdAt: 'desc' },

          take: 15,

          include: { selection: true },

        }),

        this.db.company.findUnique({

          where: { id: companyId },

          select: { nextVatSubmissionDue: true, vatRegistrationNumber: true },

        }),

        this.db.vatSetting.findUnique({ where: { companyId } }),

        this.db.bankTransaction.count({

          where: {

            bankAccount: { companyId },

            selectionId: null,

            status: 'NEW',

          },

        }),

        this.db.bankTransaction.aggregate({

          where: { bankAccount: { companyId } },

          _max: { updatedAt: true },

        }),

        this.db.bankTransaction.count({

          where: { bankAccount: { companyId } },

        }),

        this.db.bankTransaction.groupBy({

          by: ['bankAccountId'],

          where: { bankAccount: { companyId } },

          _sum: { received: true, spent: true },

        }),

        periodRange

          ? this.db.bankTransaction.count({

              where: { bankAccount: { companyId }, date: periodRange },

            })

          : Promise.resolve(0),

        periodRange

          ? this.db.bankTransaction.count({

              where: {

                bankAccount: { companyId },

                date: periodRange,

                selectionId: { not: null },

              },

            })

          : Promise.resolve(0),

        periodRange

          ? this.db.taxInvoice.count({

              where: { companyId, date: periodRange, status: { not: 'VOID' } },

            })

          : Promise.resolve(0),

        periodRange

          ? this.db.supplierBill.count({

              where: { companyId, date: periodRange, status: { not: 'VOID' } },

            })

          : Promise.resolve(0),

      ]);



      const totalsByAccount = new Map(

        txnTotals.map((row) => [row.bankAccountId, row._sum]),

      );



      const cashPosition = bankAccounts.reduce((sum, acc) => {

        const totals = totalsByAccount.get(acc.id);

        const received = Number(totals?.received ?? 0);

        const spent = Number(totals?.spent ?? 0);

        return sum + Number(acc.openingBalance) + received - spent;

      }, 0);



      const handledCount = sortedCount + confirmedCount;



      const trustInput: TodayTrustInput = {

        bankAccountCount: bankAccounts.length,

        transactionCount,

        unconfirmedCount,

        handledCount,

        cashPosition,

        lastBankUpdated: lastTxnAgg._max.updatedAt,

        pendingActionCount: pendingApprovalCount,

        vatRegistered: !!(company?.vatRegistrationNumber || vatSetting?.registrationNumber),

        openPeriod: openVat

          ? {

              ref: openVat.ref,

              periodStart: openVat.periodStart,

              periodEnd: openVat.periodEnd,

              vatPayable: Number(openVat.vatPayable),

              vatRefundable: Number(openVat.vatRefundable),

              submissionDue: openVat.submissionDue,

            }

          : null,

        vatCalculatedAt: openVat?.vatReturn?.calculatedAt ?? null,

        invoicesInPeriod,

        billsInPeriod,

        categorizedInPeriod: categorizedInPeriodCount,

        bankTxnsInPeriod: bankTxnsInPeriodCount,

        nextVatDue: company?.nextVatSubmissionDue ?? null,

      };



      const bankScore = scoreBank(trustInput);

      const queue = buildQueueView(trustInput);

      const bankBalance = buildBankBalanceView(trustInput);

      const vat = buildVatView(trustInput, bankScore);



      if (!ownerActionsAvailable) {

        queue.message =

          'Some Today features are still being set up. Your bank balance below may still be accurate.';

        queue.status = 'getting_started';

      }



      const activity = recentTxns.map((txn) => {

        const amount = txn.received

          ? Number(txn.received)

          : txn.spent

            ? -Number(txn.spent)

            : 0;

        const activityStatus = getActivityStatus({

          selectionId: txn.selectionId,

          status: txn.status,

        });

        const counterparty = txn.payee || txn.description || 'Unknown';

        return {

          id: txn.id,

          type: amount >= 0 ? 'money_in' : 'money_out',

          label: txnLabel(txn.payee, txn.description, txn.selection?.name),

          amount: Math.abs(amount),

          date: txn.date.toISOString(),

          activityStatus,

          description:

            activityStatus === 'confirmed'

              ? `You confirmed ${amount >= 0 ? 'payment from' : 'payment to'} ${counterparty}`

              : amount >= 0

                ? `Received from ${counterparty}`

                : `Paid to ${counterparty}`,

        };

      });



      return {

        queue,

        bankBalance,

        vat,

        sortedCount,

        confirmedCount,

        handledCount: sortedCount,

        pendingApprovalCount,

        pendingActionsShown: pendingActions.length,

        pendingActions,

        activity,

      };

    } catch (error) {

      console.error('[owner/today] falling back due to unexpected error', {

        companyId,

        error,

      });

      return {

        queue: {

          status: 'getting_started' as const,

          message:

            'Today is temporarily unavailable. Your records are safe — please refresh in a moment.',

          pendingCount: 0,

        },

        bankBalance: {

          amount: null,

          accountCount: 0,

          transactionCount: 0,

          unconfirmedCount: 0,

          lastUpdated: null,

          confidence: 'low' as const,

          typeLabel: 'Partial' as const,

          supportingText: 'We could not load your bank balance yet.',

        },

        vat: {

          display: 'unknown' as const,

          amount: null,

          typeLabel: 'Unknown' as const,

          headline: "We can't estimate VAT yet",

          supportingText: 'More information is required.',

          reason: 'Today data is still loading.',

          periodLabel: null,

          lastCalculated: null,

          nextDue: null,

        },

        sortedCount: 0,

        confirmedCount: 0,

        handledCount: 0,

        pendingApprovalCount: 0,

        pendingActionsShown: 0,

        pendingActions: [],

        activity: [],

      };

    }

  }



  private async fetchPendingActions(companyId: string) {

    const rows = await this.db.ownerAction.findMany({

      where: { companyId, status: 'PENDING' },

      include: {

        bankTransaction: { include: { selection: true } },

      },

      orderBy: { createdAt: 'desc' },

      take: PENDING_ACTIONS_DISPLAY_LIMIT,

    });



    return rows.map((a) => ({

      id: a.id,

      question: a.question,

      choices: (a.choices as string[]) ?? [],

      createdAt: a.createdAt.toISOString(),

      amount: a.bankTransaction

        ? Number(a.bankTransaction.received ?? a.bankTransaction.spent ?? 0)

        : null,

      txnDate: a.bankTransaction?.date.toISOString() ?? null,

      payee: a.bankTransaction?.payee ?? a.bankTransaction?.description ?? null,

    }));

  }

}


