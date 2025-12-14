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
-- DropForeignKey
ALTER TABLE "public"."Account" DROP CONSTRAINT "Account_networkId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Account" DROP CONSTRAINT "Account_walletId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Asset" DROP CONSTRAINT "Asset_accountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Asset" DROP CONSTRAINT "Asset_networkId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Contact" DROP CONSTRAINT "Contact_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_accountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_assetId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_networkId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Wallet" DROP CONSTRAINT "Wallet_userId_fkey";

-- DropIndex
DROP INDEX "public"."Contact_userId_address_networkId_key";

-- DropIndex
DROP INDEX "public"."Contact_userId_idx";

-- AlterTable
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_pkey",
DROP COLUMN "contactId",
DROP COLUMN "userId",
ADD COLUMN     "deviceId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Contact_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "public"."Account";

-- DropTable
DROP TABLE "public"."Asset";

-- DropTable
DROP TABLE "public"."Network";

-- DropTable
DROP TABLE "public"."Transaction";

-- DropTable
DROP TABLE "public"."User";

-- DropTable
DROP TABLE "public"."Wallet";

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
