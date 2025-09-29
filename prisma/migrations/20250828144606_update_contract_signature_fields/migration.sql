/*
  Warnings:

  - Added the required column `documentHash` to the `contract_signatures` table without a default value. This is not possible if the table is not empty.
  - Added the required column `documentName` to the `contract_signatures` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `contract_signatures` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signers` to the `contract_signatures` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "system_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" TEXT,
    "requestId" TEXT,
    "userId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "path" TEXT,
    "method" TEXT,
    "duration" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_contract_signatures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "documentHash" TEXT NOT NULL,
    "signatureType" TEXT NOT NULL,
    "signatureHash" TEXT NOT NULL,
    "certificateData" TEXT,
    "signedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signatureProvider" TEXT NOT NULL,
    "signatureData" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "signers" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "contract_signatures_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contract_signatures_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_contract_signatures" ("certificateData", "contractId", "createdAt", "id", "signatureData", "signatureHash", "signatureProvider", "signatureType", "signedAt", "signerId", "updatedAt") SELECT "certificateData", "contractId", "createdAt", "id", "signatureData", "signatureHash", "signatureProvider", "signatureType", "signedAt", "signerId", "updatedAt" FROM "contract_signatures";
DROP TABLE "contract_signatures";
ALTER TABLE "new_contract_signatures" RENAME TO "contract_signatures";
CREATE UNIQUE INDEX "contract_signatures_signatureHash_key" ON "contract_signatures"("signatureHash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "system_logs_level_idx" ON "system_logs"("level");

-- CreateIndex
CREATE INDEX "system_logs_createdAt_idx" ON "system_logs"("createdAt");

-- CreateIndex
CREATE INDEX "system_logs_userId_idx" ON "system_logs"("userId");

-- CreateIndex
CREATE INDEX "system_logs_requestId_idx" ON "system_logs"("requestId");
