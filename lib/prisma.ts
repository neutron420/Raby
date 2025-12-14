// lib/prisma.ts
// Prisma Client singleton for React Native/Expo
// Note: Prisma requires Node.js environment, so this is for future use when you add a backend

import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Initialize Prisma Client
const prisma =
  global.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;

// Helper functions for common operations

/**
 * Cache a transaction in the database
 */
export async function cacheTransaction(data: {
  txHash: string;
  networkId: string;
  accountAddress: string;
  blockNumber?: bigint;
  timestamp: Date;
  fromAddress: string;
  toAddress?: string | null;
  value: string;
  gasUsed?: string | null;
  gasPrice?: string | null;
  status: string;
  direction: string;
  isTokenTransfer?: boolean;
  contractAddress?: string | null;
  tokenSymbol?: string | null;
  tokenName?: string | null;
  tokenValue?: string | null;
}) {
  try {
    return await prisma.transactionCache.upsert({
      where: {
        txHash_networkId_accountAddress: {
          txHash: data.txHash,
          networkId: data.networkId,
          accountAddress: data.accountAddress,
        },
      },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: data,
    });
  } catch (error) {
    console.error('Error caching transaction:', error);
    throw error;
  }
}

/**
 * Get cached transactions for an account
 */
export async function getCachedTransactions(
  accountAddress: string,
  networkId: string = 'sepolia',
  limit: number = 50
) {
  try {
    return await prisma.transactionCache.findMany({
      where: {
        accountAddress,
        networkId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  } catch (error) {
    console.error('Error getting cached transactions:', error);
    return [];
  }
}

/**
 * Cache token balance
 */
export async function cacheTokenBalance(data: {
  accountAddress: string;
  networkId: string;
  contractAddress: string;
  symbol: string;
  name?: string | null;
  decimals: number;
  balance: string;
  balanceFormatted: string;
}) {
  try {
    return await prisma.tokenBalanceCache.upsert({
      where: {
        accountAddress_networkId_contractAddress: {
          accountAddress: data.accountAddress,
          networkId: data.networkId,
          contractAddress: data.contractAddress,
        },
      },
      update: {
        ...data,
        lastUpdated: new Date(),
      },
      create: data,
    });
  } catch (error) {
    console.error('Error caching token balance:', error);
    throw error;
  }
}

/**
 * Get cached token balances for an account
 */
export async function getCachedTokenBalances(
  accountAddress: string,
  networkId: string = 'sepolia'
) {
  try {
    return await prisma.tokenBalanceCache.findMany({
      where: {
        accountAddress,
        networkId,
      },
      orderBy: {
        lastUpdated: 'desc',
      },
    });
  } catch (error) {
    console.error('Error getting cached token balances:', error);
    return [];
  }
}

/**
 * Get or create user preferences
 */
export async function getUserPreferences(deviceId: string) {
  try {
    return await prisma.userPreferences.upsert({
      where: { deviceId },
      update: {},
      create: {
        deviceId,
        preferredCurrency: 'USD',
        themePreference: 'system',
        defaultGasLevel: 'medium',
        biometricsEnabled: false,
      },
    });
  } catch (error) {
    console.error('Error getting user preferences:', error);
    throw error;
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  deviceId: string,
  data: {
    preferredCurrency?: string;
    themePreference?: string;
    defaultGasLevel?: string;
    biometricsEnabled?: boolean;
  }
) {
  try {
    return await prisma.userPreferences.update({
      where: { deviceId },
      data,
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
}

/**
 * Add or update a contact
 */
export async function upsertContact(data: {
  deviceId: string;
  name: string;
  address: string;
  networkId?: string | null;
  notes?: string | null;
}) {
  try {
    return await prisma.contact.upsert({
      where: {
        deviceId_address_networkId: {
          deviceId: data.deviceId,
          address: data.address,
          networkId: data.networkId || null,
        },
      },
      update: data,
      create: data,
    });
  } catch (error) {
    console.error('Error upserting contact:', error);
    throw error;
  }
}

/**
 * Get all contacts for a device
 */
export async function getContacts(deviceId: string) {
  try {
    return await prisma.contact.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error getting contacts:', error);
    return [];
  }
}

/**
 * Delete a contact
 */
export async function deleteContact(contactId: string) {
  try {
    return await prisma.contact.delete({
      where: { id: contactId },
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    throw error;
  }
}
