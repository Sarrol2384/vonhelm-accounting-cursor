import { Injectable, Logger } from '@nestjs/common';

import { prisma } from '@accounting/db';

import {

  APPROVAL_CHOICES,

  APPROVAL_CHOICE_NO,

  APPROVAL_CHOICE_YES,

  buildApprovalQuestion,

  formatTxnDate,

} from './owner.constants';



function isOwnerActionSchemaError(error: unknown): boolean {

  if (typeof error !== 'object' || error === null || !('code' in error)) return false;

  const code = (error as { code?: string }).code;

  return code === 'P2021' || code === 'P2022';

}



@Injectable()

export class AbPipelineService {

  private readonly db = prisma;

  private readonly logger = new Logger(AbPipelineService.name);



  /** After rules run: auto-handle categorized txns or queue owner approval. */

  async processTransaction(companyId: string, transactionId: string) {

    try {

      await this.processTransactionInner(companyId, transactionId);

    } catch (error) {

      if (isOwnerActionSchemaError(error)) {

        this.logger.warn('OwnerAction table unavailable — skipping approval queue step');

        return;

      }

      throw error;

    }

  }



  private async processTransactionInner(companyId: string, transactionId: string) {

    const txn = await this.db.bankTransaction.findFirst({

      where: { id: transactionId, bankAccount: { companyId } },

      include: { selection: true },

    });

    if (!txn) return;



    if (txn.selectionId) {

      await this.db.bankTransaction.update({

        where: { id: transactionId },

        data: { status: 'REVIEWED' },

      });

      await this.db.ownerAction.updateMany({

        where: { bankTransactionId: transactionId, status: 'PENDING' },

        data: { status: 'DISMISSED', resolvedAt: new Date() },

      });

      return;

    }



    const dismissed = await this.db.ownerAction.findFirst({

      where: { bankTransactionId: transactionId, status: 'DISMISSED' },

    });

    if (dismissed) return;



    const existing = await this.db.ownerAction.findFirst({

      where: { bankTransactionId: transactionId, status: 'PENDING' },

    });

    if (existing) return;



    const question = buildApprovalQuestion({

      spent: txn.spent != null ? Number(txn.spent) : null,

      received: txn.received != null ? Number(txn.received) : null,

      payee: txn.payee,

      description: txn.description,

      date: txn.date,

    });



    await this.db.ownerAction.create({

      data: {

        companyId,

        type: 'BANK_TRANSACTION',

        status: 'PENDING',

        bankTransactionId: transactionId,

        question,

        choices: [...APPROVAL_CHOICES],

      },

    });

  }



  async processImportBatch(companyId: string, transactionIds: string[]) {

    for (const id of transactionIds) {

      await this.processTransaction(companyId, id);

    }

  }

}



export { formatTxnDate };


