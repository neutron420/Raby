// services/account-service.ts
// Service to manage multiple accounts/wallets

import { ethers } from 'ethers';
import * as SecureStore from 'expo-secure-store';

export interface Account {
  id: string;
  name: string;
  address: string;
  derivationIndex: number;
  derivationPath: string;
  isActive: boolean;
  createdAt: number;
}

const ACCOUNTS_STORAGE_KEY = 'walletAccounts';
const ACTIVE_ACCOUNT_KEY = 'activeAccountId';
const DEFAULT_DERIVATION_PATH = "m/44'/60'/0'/0"; // Standard Ethereum derivation path

/**
 * Get all accounts from storage
 */
export async function getAllAccounts(): Promise<Account[]> {
  try {
    const accountsJson = await SecureStore.getItemAsync(ACCOUNTS_STORAGE_KEY);
    if (!accountsJson) return [];
    return JSON.parse(accountsJson);
  } catch (error) {
    console.error('Error getting accounts:', error);
    return [];
  }
}

/**
 * Save accounts to storage
 */
async function saveAccounts(accounts: Account[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.error('Error saving accounts:', error);
    throw error;
  }
}

/**
 * Get active account ID
 */
export async function getActiveAccountId(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACTIVE_ACCOUNT_KEY);
  } catch (error) {
    console.error('Error getting active account:', error);
    return null;
  }
}

/**
 * Set active account
 */
export async function setActiveAccount(accountId: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(ACTIVE_ACCOUNT_KEY, accountId);
    
    // Update accounts to mark active
    const accounts = await getAllAccounts();
    const updatedAccounts = accounts.map(acc => ({
      ...acc,
      isActive: acc.id === accountId,
    }));
    await saveAccounts(updatedAccounts);
  } catch (error) {
    console.error('Error setting active account:', error);
    throw error;
  }
}

/**
 * Create a new account from mnemonic (HD wallet derivation)
 */
export async function createAccountFromMnemonic(
  mnemonic: string,
  accountName: string,
  derivationIndex: number,
): Promise<Account> {
  try {
    // Validate mnemonic
    if (!ethers.utils.isValidMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic');
    }

    // Derive account using HD wallet
    const derivationPath = `${DEFAULT_DERIVATION_PATH}/${derivationIndex}`;
    const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
    const childNode = hdNode.derivePath(derivationPath);
    const wallet = new ethers.Wallet(childNode.privateKey);
    
    const account: Account = {
      id: `account_${Date.now()}_${derivationIndex}`,
      name: accountName,
      address: wallet.address,
      derivationIndex,
      derivationPath,
      isActive: false,
      createdAt: Date.now(),
    };

    // Add to accounts list
    const accounts = await getAllAccounts();
    accounts.push(account);
    await saveAccounts(accounts);

    return account;
  } catch (error) {
    console.error('Error creating account from mnemonic:', error);
    throw error;
  }
}

/**
 * Create account from private key
 */
export async function createAccountFromPrivateKey(
  privateKey: string,
  accountName: string,
): Promise<Account> {
  try {
    const wallet = new ethers.Wallet(privateKey);
    
    const account: Account = {
      id: `account_${Date.now()}_pk`,
      name: accountName,
      address: wallet.address,
      derivationIndex: -1, // -1 indicates private key import
      derivationPath: '',
      isActive: false,
      createdAt: Date.now(),
    };

    // Add to accounts list
    const accounts = await getAllAccounts();
    accounts.push(account);
    await saveAccounts(accounts);

    return account;
  } catch (error) {
    console.error('Error creating account from private key:', error);
    throw error;
  }
}

/**
 * Get wallet instance for an account
 */
export async function getWalletForAccount(account: Account): Promise<ethers.Wallet> {
  try {
    // Get mnemonic from storage
    const mnemonic = await SecureStore.getItemAsync('walletMnemonic_dev_unsafe');
    
    if (!mnemonic && account.derivationIndex >= 0) {
      throw new Error('Mnemonic not found');
    }

    if (account.derivationIndex >= 0 && mnemonic) {
      // HD wallet derivation
      const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
      const childNode = hdNode.derivePath(account.derivationPath);
      return new ethers.Wallet(childNode.privateKey);
    } else {
      // Private key import - need to get from storage
      // For now, we'll need to store private keys separately
      // This is a simplified version - in production, use proper encryption
      const privateKey = await SecureStore.getItemAsync(`account_${account.id}_pk`);
      if (!privateKey) {
        throw new Error('Private key not found for account');
      }
      return new ethers.Wallet(privateKey);
    }
  } catch (error) {
    console.error('Error getting wallet for account:', error);
    throw error;
  }
}

/**
 * Get active account
 */
export async function getActiveAccount(): Promise<Account | null> {
  try {
    const activeId = await getActiveAccountId();
    if (!activeId) return null;

    const accounts = await getAllAccounts();
    return accounts.find(acc => acc.id === activeId) || null;
  } catch (error) {
    console.error('Error getting active account:', error);
    return null;
  }
}

/**
 * Delete an account
 */
export async function deleteAccount(accountId: string): Promise<void> {
  try {
    const accounts = await getAllAccounts();
    const filtered = accounts.filter(acc => acc.id !== accountId);
    
    // If deleting active account, set first account as active
    const activeId = await getActiveAccountId();
    if (activeId === accountId && filtered.length > 0) {
      await setActiveAccount(filtered[0].id);
    } else if (filtered.length === 0) {
      // No accounts left, clear active account
      await SecureStore.deleteItemAsync(ACTIVE_ACCOUNT_KEY);
    }
    
    await saveAccounts(filtered);
    
    // Also delete private key if it's a private key account
    try {
      await SecureStore.deleteItemAsync(`account_${accountId}_pk`);
    } catch (e) {
      // Ignore if doesn't exist
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
}

/**
 * Update account name
 */
export async function updateAccountName(accountId: string, newName: string): Promise<void> {
  try {
    const accounts = await getAllAccounts();
    const updated = accounts.map(acc =>
      acc.id === accountId ? { ...acc, name: newName } : acc
    );
    await saveAccounts(updated);
  } catch (error) {
    console.error('Error updating account name:', error);
    throw error;
  }
}

/**
 * Get next available derivation index
 */
export async function getNextDerivationIndex(): Promise<number> {
  try {
    const accounts = await getAllAccounts();
    const mnemonicAccounts = accounts.filter(acc => acc.derivationIndex >= 0);
    
    if (mnemonicAccounts.length === 0) return 0;
    
    const maxIndex = Math.max(...mnemonicAccounts.map(acc => acc.derivationIndex));
    return maxIndex + 1;
  } catch (error) {
    console.error('Error getting next derivation index:', error);
    return 0;
  }
}

/**
 * Initialize first account from existing wallet
 */
export async function initializeFirstAccount(
  wallet: ethers.Wallet,
  accountName: string = 'Account 1',
): Promise<Account> {
  try {
    const existingAccounts = await getAllAccounts();
    
    // Check if account already exists with this address
    const existing = existingAccounts.find(acc => acc.address.toLowerCase() === wallet.address.toLowerCase());
    if (existing) {
      return existing;
    }

    // Create first account
    const account: Account = {
      id: `account_${Date.now()}_0`,
      name: accountName,
      address: wallet.address,
      derivationIndex: 0,
      derivationPath: `${DEFAULT_DERIVATION_PATH}/0`,
      isActive: true,
      createdAt: Date.now(),
    };

    existingAccounts.push(account);
    await saveAccounts(existingAccounts);
    await setActiveAccount(account.id);

    return account;
  } catch (error) {
    console.error('Error initializing first account:', error);
    throw error;
  }
}
