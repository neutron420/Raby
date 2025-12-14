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
    type PriceHistoryPoint
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
      const txs = await fetchTransactionHistory(
        address,
        wallet.provider,
        ETHERSCAN_API_KEY,
        'sepolia',
        50
      );
      setTransactions(txs);
      console.log(`Fetched ${txs.length} transactions`);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setTransactions([]);
    } finally {
      setIsTransactionsLoading(false);
    }
  }, [wallet, address, ETHERSCAN_API_KEY]);

  // Fetch token balances
  const fetchTokenBalances = useCallback(async () => {
    if (!wallet || !wallet.provider || !address) return;
    setIsTokensLoading(true);
    try {
      const tokens = await getPopularTokenBalances(address, wallet.provider);
      setTokenBalances(tokens);
      console.log(`Fetched ${tokens.length} token balances`);
    } catch (err) {
      console.error('Failed to fetch token balances:', err);
      setTokenBalances([]);
    } finally {
      setIsTokensLoading(false);
    }
  }, [wallet, address]);

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
