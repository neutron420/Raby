// services/transaction-service.ts
import { ethers } from 'ethers';

export interface Transaction {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  timestamp: number;
  blockNumber: number;
  status: 'pending' | 'confirmed' | 'failed';
  direction: 'sent' | 'received';
  gasUsed?: string;
  gasPrice?: string;
  nonce: number;
}

/**
 * Fetch transaction history for an address
 */
export async function fetchTransactionHistory(
  address: string,
  provider: ethers.providers.Provider,
  limit: number = 20,
): Promise<Transaction[]> {
  try {
    // Get the current block number
    const currentBlock = await provider.getBlockNumber();
    
    // Fetch transactions (this is a simplified version)
    // In production, you'd use a service like Etherscan API or The Graph
    const transactions: Transaction[] = [];
    
    // For now, we'll create a mock transaction if there's a balance
    // In production, you'd fetch from Etherscan API or indexer
    const balance = await provider.getBalance(address);
    
    // Note: This is a placeholder. In production, use:
    // - Etherscan API: https://api.etherscan.io/api?module=account&action=txlist&address=...
    // - The Graph: https://thegraph.com/
    // - Alchemy/Infura transaction history APIs
    
    return transactions;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}

/**
 * Fetch transactions from Etherscan (for mainnet)
 * Note: You'll need an Etherscan API key
 */
export async function fetchTransactionsFromEtherscan(
  address: string,
  apiKey: string,
  network: 'mainnet' | 'sepolia' = 'sepolia',
): Promise<Transaction[]> {
  try {
    const baseUrl =
      network === 'mainnet'
        ? 'https://api.etherscan.io/api'
        : 'https://api-sepolia.etherscan.io/api';
    
    const url = `${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== '1' || !data.result) {
      return [];
    }
    
    return data.result
      .slice(0, 20) // Limit to 20 most recent
      .map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        timestamp: parseInt(tx.timeStamp) * 1000,
        blockNumber: parseInt(tx.blockNumber),
        status: tx.txreceipt_status === '1' ? 'confirmed' : 'failed',
        direction: tx.from.toLowerCase() === address.toLowerCase() ? 'sent' : 'received',
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        nonce: parseInt(tx.nonce),
      }));
  } catch (error) {
    console.error('Error fetching from Etherscan:', error);
    return [];
  }
}

