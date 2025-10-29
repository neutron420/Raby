-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "hasWalletConfigured" BOOLEAN NOT NULL DEFAULT false,
    "biometricsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "preferredCurrency" TEXT NOT NULL DEFAULT 'USD',
    "themePreference" TEXT NOT NULL DEFAULT 'system',
    "defaultGasLevel" TEXT NOT NULL DEFAULT 'medium',
    "lastBackupTimestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletName" TEXT NOT NULL,
    "walletType" TEXT NOT NULL,
    "creationTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedTimestamp" TIMESTAMP(3),
    "secureDataRef" TEXT,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("walletId")
);

-- CreateTable
CREATE TABLE "Network" (
    "networkId" TEXT NOT NULL,
    "networkName" TEXT NOT NULL,
    "chainId" INTEGER,
    "rpcUrl" TEXT NOT NULL,
    "explorerUrl" TEXT,
    "nativeCurrencySymbol" TEXT NOT NULL,
    "nativeCurrencyDecimals" INTEGER NOT NULL,
    "isTestnet" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Network_pkey" PRIMARY KEY ("networkId")
);

-- CreateTable
CREATE TABLE "Account" (
    "accountId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "accountName" TEXT,
    "derivationIndex" INTEGER,
    "derivationPath" TEXT,
    "lastSyncTimestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "Asset" (
    "assetId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "contractAddress" TEXT,
    "type" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT,
    "decimals" INTEGER NOT NULL,
    "logoUri" TEXT,
    "balance" TEXT NOT NULL DEFAULT '0',
    "balanceLastUpdated" TIMESTAMP(3),
    "userVisibility" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("assetId")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "txHash" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "blockNumber" BIGINT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "nonce" INTEGER,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT,
    "value" TEXT NOT NULL DEFAULT '0',
    "gasUsed" TEXT,
    "gasPrice" TEXT,
    "gasFee" TEXT,
    "inputData" TEXT,
    "status" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "assetId" TEXT,
    "assetValueChange" TEXT,
    "userNotes" TEXT,
    "lastChecked" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("txHash","networkId","accountId")
);

-- CreateTable
CREATE TABLE "Contact" (
    "contactId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "networkId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("contactId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_secureDataRef_key" ON "Wallet"("secureDataRef");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Network_networkName_key" ON "Network"("networkName");

-- CreateIndex
CREATE INDEX "Account_walletId_idx" ON "Account"("walletId");

-- CreateIndex
CREATE INDEX "Account_networkId_idx" ON "Account"("networkId");

-- CreateIndex
CREATE INDEX "Account_address_idx" ON "Account"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Account_walletId_networkId_address_key" ON "Account"("walletId", "networkId", "address");

-- CreateIndex
CREATE INDEX "Asset_accountId_idx" ON "Asset"("accountId");

-- CreateIndex
CREATE INDEX "Asset_networkId_idx" ON "Asset"("networkId");

-- CreateIndex
CREATE INDEX "Asset_contractAddress_idx" ON "Asset"("contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_accountId_networkId_contractAddress_key" ON "Asset"("accountId", "networkId", "contractAddress");

-- CreateIndex
CREATE INDEX "Transaction_accountId_idx" ON "Transaction"("accountId");

-- CreateIndex
CREATE INDEX "Transaction_networkId_idx" ON "Transaction"("networkId");

-- CreateIndex
CREATE INDEX "Transaction_timestamp_idx" ON "Transaction"("timestamp");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_assetId_idx" ON "Transaction"("assetId");

-- CreateIndex
CREATE INDEX "Transaction_fromAddress_idx" ON "Transaction"("fromAddress");

-- CreateIndex
CREATE INDEX "Transaction_toAddress_idx" ON "Transaction"("toAddress");

-- CreateIndex
CREATE INDEX "Contact_userId_idx" ON "Contact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_userId_address_networkId_key" ON "Contact"("userId", "address", "networkId");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("walletId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "Network"("networkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("accountId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "Network"("networkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("accountId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "Network"("networkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("assetId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
