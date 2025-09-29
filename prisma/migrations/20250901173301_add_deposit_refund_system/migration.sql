-- CreateTable
CREATE TABLE "deposit_refunds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "refundNumber" TEXT NOT NULL,
    "originalDeposit" REAL NOT NULL,
    "requestedAmount" REAL NOT NULL,
    "approvedAmount" REAL,
    "tenantClaimed" REAL NOT NULL DEFAULT 0,
    "ownerClaimed" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "tenantApproved" BOOLEAN NOT NULL DEFAULT false,
    "ownerApproved" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "deposit_refunds_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "deposit_refunds_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "deposit_refunds_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refund_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refundId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "description" TEXT,
    "amount" REAL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refund_documents_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "deposit_refunds" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "refund_documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refund_disputes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refundId" TEXT NOT NULL,
    "initiatedBy" TEXT NOT NULL,
    "disputeType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "refund_disputes_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "deposit_refunds" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "refund_disputes_initiatedBy_fkey" FOREIGN KEY ("initiatedBy") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "refund_disputes_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refund_approvals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refundId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "approvalType" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL,
    "comments" TEXT,
    "approvedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refund_approvals_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "deposit_refunds" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "refund_approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refund_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refund_audit_logs_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "deposit_refunds" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "refund_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "deposit_refunds_refundNumber_key" ON "deposit_refunds"("refundNumber");

-- CreateIndex
CREATE INDEX "deposit_refunds_contractId_idx" ON "deposit_refunds"("contractId");

-- CreateIndex
CREATE INDEX "deposit_refunds_tenantId_idx" ON "deposit_refunds"("tenantId");

-- CreateIndex
CREATE INDEX "deposit_refunds_ownerId_idx" ON "deposit_refunds"("ownerId");

-- CreateIndex
CREATE INDEX "deposit_refunds_status_idx" ON "deposit_refunds"("status");

-- CreateIndex
CREATE INDEX "deposit_refunds_createdAt_idx" ON "deposit_refunds"("createdAt");

-- CreateIndex
CREATE INDEX "refund_documents_refundId_idx" ON "refund_documents"("refundId");

-- CreateIndex
CREATE INDEX "refund_documents_uploadedBy_idx" ON "refund_documents"("uploadedBy");

-- CreateIndex
CREATE INDEX "refund_documents_documentType_idx" ON "refund_documents"("documentType");

-- CreateIndex
CREATE INDEX "refund_disputes_refundId_idx" ON "refund_disputes"("refundId");

-- CreateIndex
CREATE INDEX "refund_disputes_initiatedBy_idx" ON "refund_disputes"("initiatedBy");

-- CreateIndex
CREATE INDEX "refund_disputes_status_idx" ON "refund_disputes"("status");

-- CreateIndex
CREATE INDEX "refund_approvals_refundId_idx" ON "refund_approvals"("refundId");

-- CreateIndex
CREATE INDEX "refund_approvals_approverId_idx" ON "refund_approvals"("approverId");

-- CreateIndex
CREATE INDEX "refund_approvals_approvalType_idx" ON "refund_approvals"("approvalType");

-- CreateIndex
CREATE INDEX "refund_audit_logs_refundId_idx" ON "refund_audit_logs"("refundId");

-- CreateIndex
CREATE INDEX "refund_audit_logs_userId_idx" ON "refund_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "refund_audit_logs_action_idx" ON "refund_audit_logs"("action");

-- CreateIndex
CREATE INDEX "refund_audit_logs_createdAt_idx" ON "refund_audit_logs"("createdAt");
