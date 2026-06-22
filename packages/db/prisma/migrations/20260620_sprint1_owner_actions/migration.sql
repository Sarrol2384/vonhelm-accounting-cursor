-- Sprint 1: OwnerAction approval queue
-- Applied via `prisma db push` on 2026-06-20

CREATE TYPE "OwnerActionType" AS ENUM ('BANK_TRANSACTION');
CREATE TYPE "OwnerActionStatus" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');

CREATE TABLE "OwnerAction" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "OwnerActionType" NOT NULL,
    "status" "OwnerActionStatus" NOT NULL DEFAULT 'PENDING',
    "bankTransactionId" TEXT,
    "question" TEXT NOT NULL,
    "choices" JSONB,
    "selectedChoice" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnerAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OwnerAction_companyId_status_idx" ON "OwnerAction"("companyId", "status");
CREATE INDEX "OwnerAction_bankTransactionId_idx" ON "OwnerAction"("bankTransactionId");

ALTER TABLE "OwnerAction" ADD CONSTRAINT "OwnerAction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OwnerAction" ADD CONSTRAINT "OwnerAction_bankTransactionId_fkey" FOREIGN KEY ("bankTransactionId") REFERENCES "BankTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
