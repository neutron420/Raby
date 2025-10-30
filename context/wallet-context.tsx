import 'react-native-get-random-values';
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import { ethers } from 'ethers';
import Constants from 'expo-constants';

const INFURA_API_KEY = Constants.expoConfig?.extra?.INFURA_API_KEY;

if (!INFURA_API_KEY) {
  console.warn('⚠️ INFURA_API_KEY not found. Please set it in .env');
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
  setWallet: (wallet: ethers.Wallet | null) => void;
  fetchWalletData: () => void;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState('0.0');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetWallet = (newWallet: ethers.Wallet | null) => {
    if (newWallet) {
      const walletWithProvider = newWallet.connect(provider);
      setWallet(walletWithProvider);
      setAddress(walletWithProvider.address);
      console.log(' Wallet set:', walletWithProvider.address);
    } else {
      setWallet(null);
      setAddress(null);
      setBalance('0.0');
      console.log(' Wallet cleared');
    }
  };

  const fetchWalletData = useCallback(async () => {
    if (!wallet || !wallet.provider) return;
    setIsLoading(true);
    try {
      const bal = await wallet.getBalance();
      setBalance(ethers.utils.formatEther(bal));
      console.log(' Balance fetched:', ethers.utils.formatEther(bal));
    } catch (err) {
      console.error(' Failed to fetch balance:', err);
      setBalance('0.0');
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    if (wallet && wallet.provider) {
      fetchWalletData();
    }
  }, [wallet, fetchWalletData]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        address,
        balance,
        isLoading,
        setWallet: handleSetWallet,
        fetchWalletData,
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
