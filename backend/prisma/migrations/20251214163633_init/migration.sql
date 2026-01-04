/*
  Warnings:

  - The primary key for the `Contact` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `contactId` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Asset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Network` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Wallet` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[deviceId,address,networkId]` on the table `Contact` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deviceId` to the `Contact` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `Contact` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey (only if tables exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Account') THEN
        ALTER TABLE "public"."Account" DROP CONSTRAINT IF EXISTS "Account_networkId_fkey";
        ALTER TABLE "public"."Account" DROP CONSTRAINT IF EXISTS "Account_walletId_fkey";
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Asset') THEN
        ALTER TABLE "public"."Asset" DROP CONSTRAINT IF EXISTS "Asset_accountId_fkey";
        ALTER TABLE "public"."Asset" DROP CONSTRAINT IF EXISTS "Asset_networkId_fkey";
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Contact') THEN
        ALTER TABLE "public"."Contact" DROP CONSTRAINT IF EXISTS "Contact_userId_fkey";
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Transaction') THEN
        ALTER TABLE "public"."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_accountId_fkey";
        ALTER TABLE "public"."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_assetId_fkey";
        ALTER TABLE "public"."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_networkId_fkey";
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Wallet') THEN
        ALTER TABLE "public"."Wallet" DROP CONSTRAINT IF EXISTS "Wallet_userId_fkey";
    END IF;
END $$;

-- DropIndex (only if exists)
DROP INDEX IF EXISTS "public"."Contact_userId_address_networkId_key";
DROP INDEX IF EXISTS "public"."Contact_userId_idx";

-- AlterTable (only if Contact table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Contact') THEN
        ALTER TABLE "Contact" DROP CONSTRAINT IF EXISTS "Contact_pkey";
        ALTER TABLE "Contact" DROP COLUMN IF EXISTS "contactId";
        ALTER TABLE "Contact" DROP COLUMN IF EXISTS "userId";
        ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "deviceId" TEXT;
        ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "id" TEXT;
        -- Set default values for existing rows if needed
        UPDATE "Contact" SET "id" = gen_random_uuid()::text WHERE "id" IS NULL;
        UPDATE "Contact" SET "deviceId" = 'default' WHERE "deviceId" IS NULL;
        ALTER TABLE "Contact" ALTER COLUMN "deviceId" SET NOT NULL;
        ALTER TABLE "Contact" ALTER COLUMN "id" SET NOT NULL;
        ALTER TABLE "Contact" ADD CONSTRAINT "Contact_pkey" PRIMARY KEY ("id");
    ELSE
        -- Create Contact table if it doesn't exist
        CREATE TABLE IF NOT EXISTS "Contact" (
            "id" TEXT NOT NULL,
            "deviceId" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "address" TEXT NOT NULL,
            "networkId" TEXT,
            "notes" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- DropTable (only if exists)
DROP TABLE IF EXISTS "public"."Account";
DROP TABLE IF EXISTS "public"."Asset";
DROP TABLE IF EXISTS "public"."Network";
DROP TABLE IF EXISTS "public"."Transaction";
DROP TABLE IF EXISTS "public"."User";
DROP TABLE IF EXISTS "public"."Wallet";

-- CreateTable
CREATE TABLE "TransactionCache" (
    "txHash" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "accountAddress" TEXT NOT NULL,
    "blockNumber" BIGINT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT,
    "value" TEXT NOT NULL DEFAULT '0',
    "gasUsed" TEXT,
    "gasPrice" TEXT,
    "status" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "isTokenTransfer" BOOLEAN NOT NULL DEFAULT false,
    "contractAddress" TEXT,
    "tokenSymbol" TEXT,
    "tokenName" TEXT,
    "tokenValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionCache_pkey" PRIMARY KEY ("txHash","networkId","accountAddress")
);

-- CreateTable
CREATE TABLE "TokenBalanceCache" (
    "id" TEXT NOT NULL,
    "accountAddress" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT,
    "decimals" INTEGER NOT NULL,
    "balance" TEXT NOT NULL DEFAULT '0',
    "balanceFormatted" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenBalanceCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "preferredCurrency" TEXT NOT NULL DEFAULT 'USD',
    "themePreference" TEXT NOT NULL DEFAULT 'system',
    "defaultGasLevel" TEXT NOT NULL DEFAULT 'medium',
    "biometricsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionCache_accountAddress_idx" ON "TransactionCache"("accountAddress");

-- CreateIndex
CREATE INDEX "TransactionCache_networkId_idx" ON "TransactionCache"("networkId");

-- CreateIndex
CREATE INDEX "TransactionCache_timestamp_idx" ON "TransactionCache"("timestamp");

-- CreateIndex
CREATE INDEX "TransactionCache_status_idx" ON "TransactionCache"("status");

-- CreateIndex
CREATE INDEX "TokenBalanceCache_accountAddress_idx" ON "TokenBalanceCache"("accountAddress");

-- CreateIndex
CREATE INDEX "TokenBalanceCache_networkId_idx" ON "TokenBalanceCache"("networkId");

-- CreateIndex
CREATE INDEX "TokenBalanceCache_contractAddress_idx" ON "TokenBalanceCache"("contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "TokenBalanceCache_accountAddress_networkId_contractAddress_key" ON "TokenBalanceCache"("accountAddress", "networkId", "contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_deviceId_key" ON "UserPreferences"("deviceId");

-- CreateIndex
CREATE INDEX "Contact_deviceId_idx" ON "Contact"("deviceId");

-- CreateIndex
CREATE INDEX "Contact_address_idx" ON "Contact"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_deviceId_address_networkId_key" ON "Contact"("deviceId", "address", "networkId");
