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
  contractAddress?: string;
  tokenSymbol?: string;
  tokenName?: string;
  tokenValue?: string;
  isTokenTransfer?: boolean;
}

/**
 * Fetch transaction history for an address using Etherscan API
 */
export async function fetchTransactionHistory(
  address: string,
  provider: ethers.providers.Provider,
  apiKey: string | undefined,
  network: 'mainnet' | 'sepolia' = 'sepolia',
  limit: number = 50,
): Promise<Transaction[]> {
  try {
    // If API key is available, use Etherscan API
    if (apiKey) {
      return await fetchTransactionsFromEtherscan(address, apiKey, network, limit);
    }
    
    // Fallback: Try to get recent transactions from provider (limited)
    // This is less reliable but works without API key
    console.warn('No Etherscan API key provided. Using limited provider-based transaction fetching.');
    return await fetchTransactionsFromProvider(address, provider, limit);
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}

/**
 * Fetch transactions from provider (limited - only recent blocks)
 */
async function fetchTransactionsFromProvider(
  address: string,
  provider: ethers.providers.Provider,
  limit: number = 20,
): Promise<Transaction[]> {
  try {
    const transactions: Transaction[] = [];
    const currentBlock = await provider.getBlockNumber();
    const addressLower = address.toLowerCase();
    
    // Check last 100 blocks for transactions (this is limited)
    const startBlock = Math.max(0, currentBlock - 100);
    
    for (let blockNum = currentBlock; blockNum >= startBlock && transactions.length < limit; blockNum--) {
      try {
        const block = await provider.getBlockWithTransactions(blockNum);
        
        for (const tx of block.transactions) {
          if (
            tx.from?.toLowerCase() === addressLower ||
            tx.to?.toLowerCase() === addressLower
          ) {
            const receipt = await provider.getTransactionReceipt(tx.hash);
            transactions.push({
              hash: tx.hash,
              from: tx.from || '',
              to: tx.to || null,
              value: tx.value.toString(),
              timestamp: (block.timestamp || 0) * 1000,
              blockNumber: block.number,
              status: receipt?.status === 1 ? 'confirmed' : receipt?.status === 0 ? 'failed' : 'pending',
              direction: tx.from?.toLowerCase() === addressLower ? 'sent' : 'received',
              gasUsed: receipt?.gasUsed?.toString(),
              gasPrice: tx.gasPrice?.toString(),
              nonce: tx.nonce,
            });
            
            if (transactions.length >= limit) break;
          }
        }
      } catch (blockError) {
        // Skip blocks that fail
        continue;
      }
    }
    
    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching transactions from provider:', error);
    return [];
  }
}

/**
 * Fetch transactions from Etherscan API
 * Supports both mainnet and testnets
 */
export async function fetchTransactionsFromEtherscan(
  address: string,
  apiKey: string,
  network: 'mainnet' | 'sepolia' = 'sepolia',
  limit: number = 50,
): Promise<Transaction[]> {
  try {
    const baseUrl =
      network === 'mainnet'
        ? 'https://api.etherscan.io/api'
        : 'https://api-sepolia.etherscan.io/api';
    
    // Fetch normal transactions
    const txUrl = `${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}&page=1&offset=${limit}`;
    
    // Fetch token transfers
    const tokenUrl = `${baseUrl}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}&page=1&offset=${limit}`;
    
    const [txResponse, tokenResponse] = await Promise.all([
      fetch(txUrl).catch(() => null),
      fetch(tokenUrl).catch(() => null),
    ]);
    
    const transactions: Transaction[] = [];
    
    // Process normal transactions
    if (txResponse) {
      const txData = await txResponse.json();
      if (txData.status === '1' && Array.isArray(txData.result)) {
        txData.result.forEach((tx: any) => {
          if (tx.value !== '0' || tx.to) { // Only non-zero value or contract interactions
            transactions.push({
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: tx.value,
              timestamp: parseInt(tx.timeStamp) * 1000,
              blockNumber: parseInt(tx.blockNumber),
              status: tx.txreceipt_status === '1' ? 'confirmed' : tx.txreceipt_status === '0' ? 'failed' : 'pending',
              direction: tx.from.toLowerCase() === address.toLowerCase() ? 'sent' : 'received',
              gasUsed: tx.gasUsed,
              gasPrice: tx.gasPrice,
              nonce: parseInt(tx.nonce),
              isTokenTransfer: false,
            });
          }
        });
      }
    }
    
    // Process token transfers
    if (tokenResponse) {
      const tokenData = await tokenResponse.json();
      if (tokenData.status === '1' && Array.isArray(tokenData.result)) {
        tokenData.result.forEach((tx: any) => {
          transactions.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: '0', // Token transfers have 0 ETH value
            timestamp: parseInt(tx.timeStamp) * 1000,
            blockNumber: parseInt(tx.blockNumber),
            status: tx.txreceipt_status === '1' ? 'confirmed' : tx.txreceipt_status === '0' ? 'failed' : 'pending',
            direction: tx.from.toLowerCase() === address.toLowerCase() ? 'sent' : 'received',
            gasUsed: tx.gasUsed,
            gasPrice: tx.gasPrice,
            nonce: parseInt(tx.nonce),
            contractAddress: tx.contractAddress,
            tokenSymbol: tx.tokenSymbol,
            tokenName: tx.tokenName,
            tokenValue: tx.value,
            isTokenTransfer: true,
          });
        });
      }
    }
    
    // Sort by timestamp (newest first) and limit
    return transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching from Etherscan:', error);
    return [];
  }
}

/**
 * Get transaction details by hash
 */
export async function getTransactionDetails(
  txHash: string,
  provider: ethers.providers.Provider,
): Promise<Transaction | null> {
  try {
    const [tx, receipt] = await Promise.all([
      provider.getTransaction(txHash),
      provider.getTransactionReceipt(txHash),
    ]);
    
    if (!tx) return null;
    
    const block = await provider.getBlock(tx.blockNumber || 0);
    
    return {
      hash: tx.hash,
      from: tx.from || '',
      to: tx.to || null,
      value: tx.value.toString(),
      timestamp: (block?.timestamp || 0) * 1000,
      blockNumber: tx.blockNumber || 0,
      status: receipt?.status === 1 ? 'confirmed' : receipt?.status === 0 ? 'failed' : 'pending',
      direction: 'sent', // Would need address context to determine
      gasUsed: receipt?.gasUsed?.toString(),
      gasPrice: tx.gasPrice?.toString(),
      nonce: tx.nonce,
    };
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    return null;
  }
}

