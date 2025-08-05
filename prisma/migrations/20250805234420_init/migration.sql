-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TagOperation" AS ENUM ('ADD_TAG', 'REMOVE_TAG', 'REPLACE_TAG');

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BulkTagJob" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'PENDING',
    "operation" "public"."TagOperation" NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "tagValue" TEXT NOT NULL,
    "oldTagValue" TEXT,
    "productIds" TEXT[],
    "errorLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BulkTagJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPreferences" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "defaultBatchSize" INTEGER NOT NULL DEFAULT 10,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "savedFilters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TagUsage" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "tagName" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TagUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BulkTagJob_shop_status_idx" ON "public"."BulkTagJob"("shop", "status");

-- CreateIndex
CREATE INDEX "BulkTagJob_createdAt_idx" ON "public"."BulkTagJob"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_shop_key" ON "public"."UserPreferences"("shop");

-- CreateIndex
CREATE INDEX "TagUsage_shop_usageCount_idx" ON "public"."TagUsage"("shop", "usageCount");

-- CreateIndex
CREATE UNIQUE INDEX "TagUsage_shop_tagName_key" ON "public"."TagUsage"("shop", "tagName");
