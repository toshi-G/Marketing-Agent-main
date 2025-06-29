/*
  Warnings:

  - You are about to drop the column `data` on the `WorkflowResult` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `WorkflowResult` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `WorkflowResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Agent" ADD COLUMN "metadata" TEXT;

-- AlterTable
ALTER TABLE "Workflow" ADD COLUMN "metadata" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "performance" TEXT,
    "tags" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Template" ("category", "content", "createdAt", "id", "name", "performance", "tags", "type", "updatedAt") SELECT "category", "content", "createdAt", "id", "name", "performance", "tags", "type", "updatedAt" FROM "Template";
DROP TABLE "Template";
ALTER TABLE "new_Template" RENAME TO "Template";
CREATE INDEX "Template_category_idx" ON "Template"("category");
CREATE INDEX "Template_type_idx" ON "Template"("type");
CREATE INDEX "Template_isFavorite_idx" ON "Template"("isFavorite");
CREATE INDEX "Template_category_type_idx" ON "Template"("category", "type");
CREATE INDEX "Template_usageCount_idx" ON "Template"("usageCount");
CREATE INDEX "Template_createdAt_idx" ON "Template"("createdAt");
CREATE INDEX "Template_lastUsedAt_idx" ON "Template"("lastUsedAt");
CREATE TABLE "new_WorkflowResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "results" TEXT,
    "metadata" TEXT,
    "insights" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkflowResult_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WorkflowResult" ("createdAt", "id", "workflowId") SELECT "createdAt", "id", "workflowId" FROM "WorkflowResult";
DROP TABLE "WorkflowResult";
ALTER TABLE "new_WorkflowResult" RENAME TO "WorkflowResult";
CREATE INDEX "WorkflowResult_workflowId_idx" ON "WorkflowResult"("workflowId");
CREATE INDEX "WorkflowResult_status_idx" ON "WorkflowResult"("status");
CREATE INDEX "WorkflowResult_createdAt_idx" ON "WorkflowResult"("createdAt");
CREATE INDEX "WorkflowResult_workflowId_status_idx" ON "WorkflowResult"("workflowId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Agent_workflowId_idx" ON "Agent"("workflowId");

-- CreateIndex
CREATE INDEX "Agent_status_idx" ON "Agent"("status");

-- CreateIndex
CREATE INDEX "Agent_type_idx" ON "Agent"("type");

-- CreateIndex
CREATE INDEX "Agent_workflowId_status_idx" ON "Agent"("workflowId", "status");

-- CreateIndex
CREATE INDEX "Agent_workflowId_type_idx" ON "Agent"("workflowId", "type");

-- CreateIndex
CREATE INDEX "Agent_status_createdAt_idx" ON "Agent"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Agent_completedAt_idx" ON "Agent"("completedAt");

-- CreateIndex
CREATE INDEX "Content_type_idx" ON "Content"("type");

-- CreateIndex
CREATE INDEX "Content_platform_idx" ON "Content"("platform");

-- CreateIndex
CREATE INDEX "Content_createdAt_idx" ON "Content"("createdAt");

-- CreateIndex
CREATE INDEX "Content_type_platform_idx" ON "Content"("type", "platform");

-- CreateIndex
CREATE INDEX "MarketData_genre_idx" ON "MarketData"("genre");

-- CreateIndex
CREATE INDEX "MarketData_trendScore_idx" ON "MarketData"("trendScore");

-- CreateIndex
CREATE INDEX "MarketData_profitability_idx" ON "MarketData"("profitability");

-- CreateIndex
CREATE INDEX "MarketData_createdAt_idx" ON "MarketData"("createdAt");

-- CreateIndex
CREATE INDEX "MarketData_genre_trendScore_idx" ON "MarketData"("genre", "trendScore");

-- CreateIndex
CREATE INDEX "Workflow_status_idx" ON "Workflow"("status");

-- CreateIndex
CREATE INDEX "Workflow_createdAt_idx" ON "Workflow"("createdAt");

-- CreateIndex
CREATE INDEX "Workflow_status_createdAt_idx" ON "Workflow"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Workflow_completedAt_idx" ON "Workflow"("completedAt");
