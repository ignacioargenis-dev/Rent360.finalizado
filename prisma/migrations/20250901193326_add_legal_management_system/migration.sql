-- CreateTable
CREATE TABLE "legal_cases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseNumber" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "brokerId" TEXT,
    "caseType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRE_JUDICIAL',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "totalDebt" REAL NOT NULL DEFAULT 0,
    "interestRate" REAL NOT NULL DEFAULT 0.05,
    "accumulatedInterest" REAL NOT NULL DEFAULT 0,
    "legalFees" REAL NOT NULL DEFAULT 0,
    "courtFees" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "firstDefaultDate" DATETIME NOT NULL,
    "lastPaymentDate" DATETIME,
    "extrajudicialSentDate" DATETIME,
    "demandFiledDate" DATETIME,
    "hearingDate" DATETIME,
    "judgmentDate" DATETIME,
    "evictionDate" DATETIME,
    "caseClosedDate" DATETIME,
    "currentPhase" TEXT NOT NULL DEFAULT 'PRE_JUDICIAL',
    "nextDeadline" DATETIME,
    "notes" TEXT,
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "closedAt" DATETIME,
    CONSTRAINT "legal_cases_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "legal_cases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "legal_cases_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "legal_cases_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "extrajudicial_notices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legalCaseId" TEXT NOT NULL,
    "noticeType" TEXT NOT NULL,
    "noticeNumber" TEXT NOT NULL,
    "deliveryMethod" TEXT NOT NULL,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "sentDate" DATETIME,
    "deliveredDate" DATETIME,
    "receivedBy" TEXT,
    "deliveryProof" TEXT,
    "content" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "deadline" DATETIME NOT NULL,
    "responseReceived" BOOLEAN NOT NULL DEFAULT false,
    "responseDate" DATETIME,
    "responseContent" TEXT,
    "responseAmount" REAL,
    "followUpSent" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" DATETIME,
    "escalationSent" BOOLEAN NOT NULL DEFAULT false,
    "escalationDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "extrajudicial_notices_legalCaseId_fkey" FOREIGN KEY ("legalCaseId") REFERENCES "legal_cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legalCaseId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "verificationNotes" TEXT,
    "court" TEXT,
    "filingDate" DATETIME,
    "responseDeadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "legal_documents_legalCaseId_fkey" FOREIGN KEY ("legalCaseId") REFERENCES "legal_cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "legal_documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "legal_documents_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "court_proceedings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legalCaseId" TEXT NOT NULL,
    "proceedingType" TEXT NOT NULL,
    "proceedingNumber" TEXT,
    "court" TEXT NOT NULL,
    "judge" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "filedDate" DATETIME,
    "notificationDate" DATETIME,
    "oppositionDeadline" DATETIME,
    "hearingDate" DATETIME,
    "evidenceDeadline" DATETIME,
    "judgmentDeadline" DATETIME,
    "outcome" TEXT,
    "judgmentText" TEXT,
    "judgmentDate" DATETIME,
    "appealDeadline" DATETIME,
    "appealFiled" BOOLEAN NOT NULL DEFAULT false,
    "appealDate" DATETIME,
    "courtFees" REAL NOT NULL DEFAULT 0,
    "legalFees" REAL NOT NULL DEFAULT 0,
    "totalCosts" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "nextAction" TEXT,
    "nextDeadline" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "closedAt" DATETIME,
    CONSTRAINT "court_proceedings_legalCaseId_fkey" FOREIGN KEY ("legalCaseId") REFERENCES "legal_cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "legal_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legalCaseId" TEXT NOT NULL,
    "paymentType" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paidDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "relatedPaymentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "legal_payments_legalCaseId_fkey" FOREIGN KEY ("legalCaseId") REFERENCES "legal_cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "legal_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legalCaseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "legal_audit_logs_legalCaseId_fkey" FOREIGN KEY ("legalCaseId") REFERENCES "legal_cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "legal_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "legal_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legalCaseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "readAt" DATETIME,
    "actionRequired" BOOLEAN NOT NULL DEFAULT false,
    "actionDeadline" DATETIME,
    "actionUrl" TEXT,
    "metadata" TEXT,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "legal_notifications_legalCaseId_fkey" FOREIGN KEY ("legalCaseId") REFERENCES "legal_cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "legal_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "legal_cases_caseNumber_key" ON "legal_cases"("caseNumber");

-- CreateIndex
CREATE INDEX "legal_cases_contractId_idx" ON "legal_cases"("contractId");

-- CreateIndex
CREATE INDEX "legal_cases_tenantId_idx" ON "legal_cases"("tenantId");

-- CreateIndex
CREATE INDEX "legal_cases_ownerId_idx" ON "legal_cases"("ownerId");

-- CreateIndex
CREATE INDEX "legal_cases_status_idx" ON "legal_cases"("status");

-- CreateIndex
CREATE INDEX "legal_cases_caseType_idx" ON "legal_cases"("caseType");

-- CreateIndex
CREATE INDEX "legal_cases_currentPhase_idx" ON "legal_cases"("currentPhase");

-- CreateIndex
CREATE INDEX "legal_cases_createdAt_idx" ON "legal_cases"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "extrajudicial_notices_noticeNumber_key" ON "extrajudicial_notices"("noticeNumber");

-- CreateIndex
CREATE INDEX "extrajudicial_notices_legalCaseId_idx" ON "extrajudicial_notices"("legalCaseId");

-- CreateIndex
CREATE INDEX "extrajudicial_notices_noticeType_idx" ON "extrajudicial_notices"("noticeType");

-- CreateIndex
CREATE INDEX "extrajudicial_notices_deliveryStatus_idx" ON "extrajudicial_notices"("deliveryStatus");

-- CreateIndex
CREATE INDEX "extrajudicial_notices_sentDate_idx" ON "extrajudicial_notices"("sentDate");

-- CreateIndex
CREATE INDEX "legal_documents_legalCaseId_idx" ON "legal_documents"("legalCaseId");

-- CreateIndex
CREATE INDEX "legal_documents_documentType_idx" ON "legal_documents"("documentType");

-- CreateIndex
CREATE INDEX "legal_documents_isOfficial_idx" ON "legal_documents"("isOfficial");

-- CreateIndex
CREATE INDEX "legal_documents_isRequired_idx" ON "legal_documents"("isRequired");

-- CreateIndex
CREATE INDEX "legal_documents_status_idx" ON "legal_documents"("status");

-- CreateIndex
CREATE INDEX "legal_documents_uploadedAt_idx" ON "legal_documents"("uploadedAt");

-- CreateIndex
CREATE INDEX "court_proceedings_legalCaseId_idx" ON "court_proceedings"("legalCaseId");

-- CreateIndex
CREATE INDEX "court_proceedings_proceedingType_idx" ON "court_proceedings"("proceedingType");

-- CreateIndex
CREATE INDEX "court_proceedings_status_idx" ON "court_proceedings"("status");

-- CreateIndex
CREATE INDEX "court_proceedings_court_idx" ON "court_proceedings"("court");

-- CreateIndex
CREATE INDEX "court_proceedings_filedDate_idx" ON "court_proceedings"("filedDate");

-- CreateIndex
CREATE INDEX "legal_payments_legalCaseId_idx" ON "legal_payments"("legalCaseId");

-- CreateIndex
CREATE INDEX "legal_payments_paymentType_idx" ON "legal_payments"("paymentType");

-- CreateIndex
CREATE INDEX "legal_payments_status_idx" ON "legal_payments"("status");

-- CreateIndex
CREATE INDEX "legal_payments_dueDate_idx" ON "legal_payments"("dueDate");

-- CreateIndex
CREATE INDEX "legal_audit_logs_legalCaseId_idx" ON "legal_audit_logs"("legalCaseId");

-- CreateIndex
CREATE INDEX "legal_audit_logs_userId_idx" ON "legal_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "legal_audit_logs_action_idx" ON "legal_audit_logs"("action");

-- CreateIndex
CREATE INDEX "legal_audit_logs_createdAt_idx" ON "legal_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "legal_notifications_legalCaseId_idx" ON "legal_notifications"("legalCaseId");

-- CreateIndex
CREATE INDEX "legal_notifications_userId_idx" ON "legal_notifications"("userId");

-- CreateIndex
CREATE INDEX "legal_notifications_notificationType_idx" ON "legal_notifications"("notificationType");

-- CreateIndex
CREATE INDEX "legal_notifications_sentAt_idx" ON "legal_notifications"("sentAt");
