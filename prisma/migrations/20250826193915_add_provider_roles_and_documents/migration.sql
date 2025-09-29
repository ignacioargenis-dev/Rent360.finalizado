-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'TENANT',
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "commune" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "deposit" REAL NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "area" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "type" TEXT NOT NULL,
    "images" TEXT,
    "features" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "properties_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractNumber" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "brokerId" TEXT,
    "startDate" TIMESTAMPTZ NOT NULL,
    "endDate" TIMESTAMPTZ NOT NULL,
    "monthlyRent" REAL NOT NULL,
    "deposit" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "terms" TEXT,
    "signedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "terminatedAt" TIMESTAMPTZ,
    CONSTRAINT "contracts_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contracts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contracts_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contracts_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contract_signatures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "signatureType" TEXT NOT NULL,
    "signatureHash" TEXT NOT NULL,
    "certificateData" TEXT,
    "signedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signatureProvider" TEXT NOT NULL,
    "signatureData" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "contract_signatures_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contract_signatures_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentNumber" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "payerId" TEXT,
    "amount" REAL NOT NULL,
    "dueDate" TIMESTAMPTZ NOT NULL,
    "paidDate" TIMESTAMPTZ,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "transactionId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "payments_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payments_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT,
    "contractId" TEXT,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "reviews_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reviews_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reviews_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "readAt" TIMESTAMPTZ,
    CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "userId" TEXT,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "resolvedAt" TIMESTAMPTZ,
    CONSTRAINT "tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tickets_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ticket_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "ticket_comments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ticket_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "runnerId" TEXT NOT NULL,
    "tenantId" TEXT,
    "scheduledAt" TIMESTAMPTZ NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "photosTaken" INTEGER NOT NULL DEFAULT 0,
    "rating" INTEGER,
    "clientFeedback" TEXT,
    "earnings" REAL NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "visits_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "visits_runnerId_fkey" FOREIGN KEY ("runnerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "visits_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maintenance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "estimatedCost" REAL,
    "actualCost" REAL,
    "requestedBy" TEXT NOT NULL,
    "assignedTo" TEXT,
    "maintenanceProviderId" TEXT,
    "scheduledDate" TIMESTAMPTZ,
    "completedDate" TIMESTAMPTZ,
    "rating" INTEGER,
    "feedback" TEXT,
    "images" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "maintenance_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "maintenance_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "maintenance_maintenanceProviderId_fkey" FOREIGN KEY ("maintenanceProviderId") REFERENCES "maintenance_providers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "data" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "variables" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValues" TEXT,
    "newValues" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'other',
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_type" TEXT NOT NULL,
    "tags" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "bank_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maintenance_providers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "specialties" TEXT NOT NULL,
    "hourlyRate" REAL NOT NULL,
    "rating" REAL NOT NULL DEFAULT 0,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "completedJobs" INTEGER NOT NULL DEFAULT 0,
    "totalEarnings" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "responseTime" REAL NOT NULL DEFAULT 0,
    "address" TEXT,
    "city" TEXT,
    "region" TEXT,
    "description" TEXT,
    "profileImage" TEXT,
    "availability" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "maintenance_providers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_providers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "serviceTypes" TEXT NOT NULL,
    "basePrice" REAL NOT NULL,
    "rating" REAL NOT NULL DEFAULT 0,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "completedJobs" INTEGER NOT NULL DEFAULT 0,
    "totalEarnings" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "responseTime" REAL NOT NULL DEFAULT 0,
    "address" TEXT,
    "city" TEXT,
    "region" TEXT,
    "description" TEXT,
    "profileImage" TEXT,
    "availability" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "service_providers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "provider_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "maintenanceProviderId" TEXT,
    "serviceProviderId" TEXT,
    "criminalRecord" TEXT NOT NULL,
    "idFront" TEXT NOT NULL,
    "idBack" TEXT NOT NULL,
    "businessCertificate" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMPTZ,
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "provider_documents_maintenanceProviderId_fkey" FOREIGN KEY ("maintenanceProviderId") REFERENCES "maintenance_providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "provider_documents_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "service_providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceProviderId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledDate" TIMESTAMPTZ,
    "completedDate" TIMESTAMPTZ,
    "basePrice" REAL NOT NULL,
    "finalPrice" REAL,
    "rating" INTEGER,
    "feedback" TEXT,
    "images" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "service_jobs_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "service_providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "service_jobs_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "provider_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerType" TEXT NOT NULL,
    "maintenanceProviderId" TEXT,
    "serviceProviderId" TEXT,
    "serviceJobId" TEXT,
    "maintenanceId" TEXT,
    "amount" REAL NOT NULL,
    "commission" REAL NOT NULL,
    "netAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL,
    "reference" TEXT,
    "processedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "provider_transactions_maintenanceProviderId_fkey" FOREIGN KEY ("maintenanceProviderId") REFERENCES "maintenance_providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "provider_transactions_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "service_providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "provider_transactions_serviceJobId_fkey" FOREIGN KEY ("serviceJobId") REFERENCES "service_jobs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "provider_transactions_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "maintenance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "platform_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contractNumber_key" ON "contracts"("contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "contract_signatures_signatureHash_key" ON "contract_signatures"("signatureHash");

-- CreateIndex
CREATE UNIQUE INDEX "payments_paymentNumber_key" ON "payments"("paymentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticketNumber_key" ON "tickets"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_name_key" ON "email_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_userId_key" ON "bank_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_providers_userId_key" ON "maintenance_providers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "service_providers_userId_key" ON "service_providers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "provider_documents_maintenanceProviderId_key" ON "provider_documents"("maintenanceProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "provider_documents_serviceProviderId_key" ON "provider_documents"("serviceProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "platform_config_key_key" ON "platform_config"("key");
