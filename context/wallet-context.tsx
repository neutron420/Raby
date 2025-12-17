import {
    getActiveAccount,
    getAllAccounts,
    getWalletForAccount,
    setActiveAccount,
    type Account,
} from '@/services/account-service';
import {
    fetchMultipleCryptoPrices,
    getCoinGeckoId,
    type CryptoPrice,
    type PriceHistoryPoint,
} from '@/services/crypto-price-service';
import {
    getPopularTokenBalances,
    type TokenInfo,
} from '@/services/token-service';
import {
    fetchTransactionHistory,
    type Transaction,
} from '@/services/transaction-service';
import { ethers } from 'ethers';
import Constants from 'expo-constants';
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import 'react-native-get-random-values';

const INFURA_API_KEY = Constants.expoConfig?.extra?.INFURA_API_KEY;
const ETHERSCAN_API_KEY = Constants.expoConfig?.extra?.ETHERSCAN_API_KEY;
const BACKEND_URL =
  // Prefer public env var if set
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  // Or extra from app.config
  (Constants.expoConfig?.extra as any)?.BACKEND_URL ||
  // Fallback for local development (Expo web or emulator on same machine)
  'http://localhost:4000';

if (!INFURA_API_KEY) {
  console.warn(' INFURA_API_KEY not found. Please set it in .env');
}

const provider = new ethers.providers.JsonRpcProvider(
  `https://sepolia.infura.io/v3/${INFURA_API_KEY}`
);

provider
  .getNetwork()
  .then((net) => console.log(' Connected to network:', net))
  .catch((err) => console.error(' Network connection failed:', err));

interface WalletState {
  wallet: ethers.Wallet | null;
  address: string | null;
  balance: string;
  isLoading: boolean;
  cryptoPrices: Record<string, CryptoPrice>;
  cryptoPriceHistory: Record<string, PriceHistoryPoint[]>;
  totalUsdValue: number;
  isPriceLoading: boolean;
  transactions: Transaction[];
  tokenBalances: TokenInfo[];
  isTransactionsLoading: boolean;
  isTokensLoading: boolean;
  accounts: Account[];
  activeAccount: Account | null;
  isAccountsLoading: boolean;
  setWallet: (wallet: ethers.Wallet | null) => void;
  switchAccount: (accountId: string) => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchWalletData: () => void;
  fetchPriceData: () => void;
  fetchTransactions: () => void;
  fetchTokenBalances: () => void;
  getCryptoPrice: (symbol: string) => CryptoPrice | null;
  getCryptoPriceHistory: (symbol: string) => PriceHistoryPoint[];
}

const WalletContext = createContext<WalletState | undefined>(undefined);

// ---- Helpers to sync with backend API (Prisma cache) ----

function mapCachedTransactionToTransaction(cached: any): Transaction {
  return {
    hash: cached.txHash,
    from: cached.fromAddress,
    to: cached.toAddress ?? null,
    value: cached.value,
    timestamp: new Date(cached.timestamp).getTime(),
    blockNumber:
      typeof cached.blockNumber === 'number'
        ? cached.blockNumber
        : cached.blockNumber
        ? Number(cached.blockNumber)
        : 0,
    status: cached.status,
    direction: cached.direction,
    gasUsed: cached.gasUsed ?? undefined,
    gasPrice: cached.gasPrice ?? undefined,
    // Not stored in cache – default to 0
    nonce: 0,
    contractAddress: cached.contractAddress ?? undefined,
    tokenSymbol: cached.tokenSymbol ?? undefined,
    tokenName: cached.tokenName ?? undefined,
    tokenValue: cached.tokenValue ?? undefined,
    isTokenTransfer: cached.isTokenTransfer ?? false,
  };
}

async function loadTransactionsFromBackend(
  address: string,
  networkId: string = 'sepolia',
): Promise<Transaction[] | null> {
  if (!BACKEND_URL) return null;
  try {
    const url = `${BACKEND_URL}/api/transactions?address=${encodeURIComponent(
      address,
    )}&networkId=${encodeURIComponent(networkId)}&limit=50`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    return data.map(mapCachedTransactionToTransaction);
  } catch (error) {
    console.error('Failed to load cached transactions from backend:', error);
    return null;
  }
}

async function cacheTransactionsToBackend(
  address: string,
  txs: Transaction[],
  networkId: string = 'sepolia',
): Promise<void> {
  if (!BACKEND_URL || txs.length === 0) return;
  try {
    await Promise.all(
      txs.map((tx) =>
        fetch(`${BACKEND_URL}/api/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txHash: tx.hash,
            networkId,
            accountAddress: address,
            // Prisma accepts ISO strings for DateTime
            timestamp: new Date(tx.timestamp).toISOString(),
            fromAddress: tx.from,
            toAddress: tx.to,
            value: tx.value,
            gasUsed: tx.gasUsed ?? null,
            gasPrice: tx.gasPrice ?? null,
            status: tx.status,
            direction: tx.direction,
            isTokenTransfer: tx.isTokenTransfer ?? false,
            contractAddress: tx.contractAddress ?? null,
            tokenSymbol: tx.tokenSymbol ?? null,
            tokenName: tx.tokenName ?? null,
            tokenValue: tx.tokenValue ?? null,
          }),
        }).catch(() => null),
      ),
    );
  } catch (error) {
    console.error('Failed to cache transactions to backend:', error);
  }
}

function mapCachedTokenToTokenInfo(cached: any): TokenInfo {
  return {
    address: cached.contractAddress,
    symbol: cached.symbol,
    name: cached.name ?? '',
    decimals: cached.decimals,
    balance: cached.balance,
    balanceFormatted: cached.balanceFormatted,
  };
}

async function loadTokenBalancesFromBackend(
  address: string,
  networkId: string = 'sepolia',
): Promise<TokenInfo[] | null> {
  if (!BACKEND_URL) return null;
  try {
    const url = `${BACKEND_URL}/api/tokens?address=${encodeURIComponent(
      address,
    )}&networkId=${encodeURIComponent(networkId)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    return data.map(mapCachedTokenToTokenInfo);
  } catch (error) {
    console.error('Failed to load cached token balances from backend:', error);
    return null;
  }
}

async function cacheTokenBalancesToBackend(
  address: string,
  tokens: TokenInfo[],
  networkId: string = 'sepolia',
): Promise<void> {
  if (!BACKEND_URL || tokens.length === 0) return;
  try {
    await Promise.all(
      tokens.map((token) =>
        fetch(`${BACKEND_URL}/api/tokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountAddress: address,
            networkId,
            contractAddress: token.address,
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            balance: token.balance,
            balanceFormatted: token.balanceFormatted,
          }),
        }).catch(() => null),
      ),
    );
  } catch (error) {
    console.error('Failed to cache token balances to backend:', error);
  }
}

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState('0.0');
  const [isLoading, setIsLoading] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, CryptoPrice>>({});
  const [cryptoPriceHistory, setCryptoPriceHistory] = useState<Record<string, PriceHistoryPoint[]>>({});
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tokenBalances, setTokenBalances] = useState<TokenInfo[]>([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);
  const [isTokensLoading, setIsTokensLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccountState] = useState<Account | null>(null);
  const [isAccountsLoading, setIsAccountsLoading] = useState(false);

  // Supported cryptocurrencies to display
  const SUPPORTED_CRYPTOS = ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'MATIC'];

  const handleSetWallet = (newWallet: ethers.Wallet | null) => {
    if (newWallet) {
      // Set address immediately for instant UI update
      const walletAddress = newWallet.address;
      setAddress(walletAddress);
      
      // Connect wallet and set it (this is synchronous and fast)
      const walletWithProvider = newWallet.connect(provider);
      setWallet(walletWithProvider);
      
      console.log(' Wallet set:', walletAddress);
    } else {
      setWallet(null);
      setAddress(null);
      setBalance('0.0');
      console.log(' Wallet cleared');
    }
  };

  // Fetch all accounts
  const fetchAccounts = useCallback(async () => {
    setIsAccountsLoading(true);
    try {
      const allAccounts = await getAllAccounts();
      setAccounts(allAccounts);
      
      const active = await getActiveAccount();
      setActiveAccountState(active);
      
      // If there's an active account but no wallet, load it
      if (active && !wallet) {
        try {
          const accountWallet = await getWalletForAccount(active);
          handleSetWallet(accountWallet);
        } catch (error) {
          console.error('Error loading wallet for active account:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setIsAccountsLoading(false);
    }
  }, [wallet]);

  // Switch to a different account
  const switchAccount = useCallback(async (accountId: string) => {
    try {
      await setActiveAccount(accountId);
      const account = accounts.find(acc => acc.id === accountId);
      
      if (account) {
        const accountWallet = await getWalletForAccount(account);
        handleSetWallet(accountWallet);
        setActiveAccountState(account);
      }
      
      // Refresh accounts list
      await fetchAccounts();
    } catch (error) {
      console.error('Error switching account:', error);
      throw error;
    }
  }, [accounts, fetchAccounts]);

  const fetchWalletData = useCallback(async () => {
    if (!wallet || !wallet.provider) return;
    setIsLoading(true);
    try {
      // Use a timeout to prevent blocking if network is slow
      const balancePromise = wallet.getBalance();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Balance fetch timeout')), 10000)
      );
      
      const bal = await Promise.race([balancePromise, timeoutPromise]) as ethers.BigNumber;
      setBalance(ethers.utils.formatEther(bal));
      console.log(' Balance fetched:', ethers.utils.formatEther(bal));
    } catch (err) {
      console.error(' Failed to fetch balance:', err);
      setBalance('0.0');
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  const fetchPriceData = useCallback(async () => {
    setIsPriceLoading(true);
    try {
      // Get CoinGecko IDs for all supported cryptos
      const coinIds = SUPPORTED_CRYPTOS.map(symbol => getCoinGeckoId(symbol));
      
      // Fetch prices for all cryptocurrencies (now uses efficient markets endpoint)
      const prices = await fetchMultipleCryptoPrices(coinIds);
      
      // Store prices by symbol
      const pricesBySymbol: Record<string, CryptoPrice> = {};
      SUPPORTED_CRYPTOS.forEach((symbol, index) => {
        const coinId = coinIds[index];
        if (prices[coinId]) {
          pricesBySymbol[symbol] = prices[coinId];
        }
      });
      setCryptoPrices(pricesBySymbol);

      // Don't fetch price history on initial load - only fetch when viewing detail page
      // This reduces API calls significantly
    } catch (err) {
      console.error(' Failed to fetch price data:', err);
    } finally {
      setIsPriceLoading(false);
    }
  }, []);

  // Calculate total USD value (ETH balance)
  const totalUsdValue = useMemo(() => {
    const ethPrice = cryptoPrices['ETH'];
    if (!ethPrice || !balance) return 0;
    const balanceNum = parseFloat(balance);
    return balanceNum * ethPrice.current_price;
  }, [balance, cryptoPrices]);

  // Fetch transaction history
  const fetchTransactions = useCallback(async () => {
    if (!wallet || !wallet.provider || !address) return;
    setIsTransactionsLoading(true);
    try {
      // 1) Try to load cached transactions from backend for fast initial UI
      const cached = await loadTransactionsFromBackend(address, 'sepolia');
      if (cached && cached.length > 0) {
        setTransactions(cached);
        console.log(`Loaded ${cached.length} cached transactions from backend`);
      }

      // 2) Always fetch fresh data from Etherscan / provider
      const txs = await fetchTransactionHistory(
        address,
        wallet.provider,
        ETHERSCAN_API_KEY,
        'sepolia',
        50,
      );
      setTransactions(txs);
      console.log(`Fetched ${txs.length} transactions from network`);

      // 3) Cache the latest transactions in the backend (fire and forget)
      cacheTransactionsToBackend(address, txs, 'sepolia').catch(() => {});
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      // Only clear if we had nothing cached
      if (!transactions.length) {
        setTransactions([]);
      }
    } finally {
      setIsTransactionsLoading(false);
    }
  }, [wallet, address, ETHERSCAN_API_KEY, transactions.length]);

  // Fetch token balances
  const fetchTokenBalances = useCallback(async () => {
    if (!wallet || !wallet.provider || !address) return;
    setIsTokensLoading(true);
    try {
      // 1) Try to load cached token balances from backend
      const cached = await loadTokenBalancesFromBackend(address, 'sepolia');
      if (cached && cached.length > 0) {
        setTokenBalances(cached);
        console.log(`Loaded ${cached.length} cached token balances from backend`);
      }

      // 2) Fetch fresh balances from blockchain
      const tokens = await getPopularTokenBalances(address, wallet.provider);
      setTokenBalances(tokens);
      console.log(`Fetched ${tokens.length} token balances from network`);

      // 3) Cache latest balances in backend
      cacheTokenBalancesToBackend(address, tokens, 'sepolia').catch(() => {});
    } catch (err) {
      console.error('Failed to fetch token balances:', err);
      if (!tokenBalances.length) {
        setTokenBalances([]);
      }
    } finally {
      setIsTokensLoading(false);
    }
  }, [wallet, address, tokenBalances.length]);

  // Helper functions to get price data
  const getCryptoPrice = useCallback((symbol: string): CryptoPrice | null => {
    return cryptoPrices[symbol.toUpperCase()] || null;
  }, [cryptoPrices]);

  const getCryptoPriceHistory = useCallback((symbol: string): PriceHistoryPoint[] => {
    return cryptoPriceHistory[symbol.toUpperCase()] || [];
  }, [cryptoPriceHistory]);

  // Load accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (wallet && wallet.provider) {
      // Defer balance and price fetch to not block navigation
      // Use requestAnimationFrame for smoother experience
      requestAnimationFrame(() => {
        fetchWalletData();
        // Price data can be fetched later, don't block on it
        setTimeout(() => fetchPriceData(), 100);
        // Fetch transactions and tokens after a short delay
        setTimeout(() => {
          fetchTransactions();
          fetchTokenBalances();
        }, 500);
      });
    } else {
      // Clear data when wallet is cleared
      setTransactions([]);
      setTokenBalances([]);
    }
  }, [wallet, fetchWalletData, fetchPriceData, fetchTransactions, fetchTokenBalances]);

  // Refresh price data periodically (every 2 minutes to avoid rate limits)
  useEffect(() => {
    if (!wallet) return;
    
    const interval = setInterval(() => {
      fetchPriceData();
    }, 120000); // 2 minutes - reduced frequency to avoid rate limits

    return () => clearInterval(interval);
  }, [wallet, fetchPriceData]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        address,
        balance,
        isLoading,
        cryptoPrices,
        cryptoPriceHistory,
        totalUsdValue,
        isPriceLoading,
        transactions,
        tokenBalances,
        isTransactionsLoading,
        isTokensLoading,
        accounts,
        activeAccount,
        isAccountsLoading,
        setWallet: handleSetWallet,
        switchAccount,
        fetchAccounts,
        fetchWalletData,
        fetchPriceData,
        fetchTransactions,
        fetchTokenBalances,
        getCryptoPrice,
        getCryptoPriceHistory,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletState => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
};
