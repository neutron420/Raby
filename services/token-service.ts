// services/token-service.ts
// Service to fetch ERC-20 token balances and information

import { ethers } from 'ethers';

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  balance: string;
  balanceFormatted: string;
  usdValue?: number;
}

// Common ERC-20 token addresses on Sepolia testnet
export const POPULAR_TOKENS: Record<string, { address: string; symbol: string; name: string; decimals: number }> = {
  USDT: {
    address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0', // Sepolia USDT
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
  },
  USDC: {
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia USDC
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  DAI: {
    address: '0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6', // Sepolia DAI
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
  },
};

// Standard ERC-20 ABI (minimal)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
];

/**
 * Get token balance for an address
 */
export async function getTokenBalance(
  tokenAddress: string,
  userAddress: string,
  provider: ethers.providers.Provider,
): Promise<string> {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await tokenContract.balanceOf(userAddress);
    return balance.toString();
  } catch (error) {
    console.error(`Error fetching token balance for ${tokenAddress}:`, error);
    return '0';
  }
}

/**
 * Get token information (symbol, name, decimals)
 */
export async function getTokenInfo(
  tokenAddress: string,
  provider: ethers.providers.Provider,
): Promise<{ symbol: string; name: string; decimals: number } | null> {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    const [symbol, name, decimals] = await Promise.all([
      tokenContract.symbol().catch(() => 'UNKNOWN'),
      tokenContract.name().catch(() => 'Unknown Token'),
      tokenContract.decimals().catch(() => 18),
    ]);
    
    return {
      symbol: symbol || 'UNKNOWN',
      name: name || 'Unknown Token',
      decimals: typeof decimals === 'number' ? decimals : 18,
    };
  } catch (error) {
    console.error(`Error fetching token info for ${tokenAddress}:`, error);
    return null;
  }
}

/**
 * Get all token balances for popular tokens
 */
export async function getPopularTokenBalances(
  userAddress: string,
  provider: ethers.providers.Provider,
): Promise<TokenInfo[]> {
  const tokens: TokenInfo[] = [];
  
  for (const [symbol, tokenData] of Object.entries(POPULAR_TOKENS)) {
    try {
      const balance = await getTokenBalance(tokenData.address, userAddress, provider);
      const balanceFormatted = ethers.utils.formatUnits(balance, tokenData.decimals);
      
      // Only include tokens with non-zero balance
      if (parseFloat(balanceFormatted) > 0) {
        tokens.push({
          address: tokenData.address,
          symbol: tokenData.symbol,
          name: tokenData.name,
          decimals: tokenData.decimals,
          balance: balance,
          balanceFormatted: balanceFormatted,
        });
      }
    } catch (error) {
      console.error(`Error fetching balance for ${symbol}:`, error);
      // Continue with other tokens
    }
  }
  
  return tokens;
}

/**
 * Get token balance with formatted value
 */
export async function getTokenInfoWithBalance(
  tokenAddress: string,
  userAddress: string,
  provider: ethers.providers.Provider,
): Promise<TokenInfo | null> {
  try {
    const [balance, info] = await Promise.all([
      getTokenBalance(tokenAddress, userAddress, provider),
      getTokenInfo(tokenAddress, provider),
    ]);
    
    if (!info) return null;
    
    const balanceFormatted = ethers.utils.formatUnits(balance, info.decimals);
    
    return {
      address: tokenAddress,
      symbol: info.symbol,
      name: info.name,
      decimals: info.decimals,
      balance: balance,
      balanceFormatted: balanceFormatted,
    };
  } catch (error) {
    console.error(`Error fetching token info with balance for ${tokenAddress}:`, error);
    return null;
  }
}

/**
 * Transfer ERC-20 tokens
 */
export async function transferToken(
  tokenAddress: string,
  to: string,
  amount: string,
  wallet: ethers.Wallet,
): Promise<ethers.providers.TransactionResponse> {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
    
    // Get token decimals
    const decimals = await tokenContract.decimals();
    const amountWei = ethers.utils.parseUnits(amount, decimals);
    
    // Transfer tokens
    const tx = await tokenContract.transfer(to, amountWei);
    return tx;
  } catch (error) {
    console.error('Error transferring token:', error);
    throw error;
  }
}

/**
 * Get token allowance (for approvals)
 */
export async function getTokenAllowance(
  tokenAddress: string,
  owner: string,
  spender: string,
  provider: ethers.providers.Provider,
): Promise<string> {
  try {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [...ERC20_ABI, 'function allowance(address owner, address spender) view returns (uint256)'],
      provider,
    );
    const allowance = await tokenContract.allowance(owner, spender);
    return allowance.toString();
  } catch (error) {
    console.error('Error fetching token allowance:', error);
    return '0';
  }
}
