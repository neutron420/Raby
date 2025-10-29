// context/WalletContext.tsx (Simplified Example)
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ethers } from 'ethers';
import * as SecureStore from 'expo-secure-store';

interface WalletContextProps {
  wallet: ethers.Wallet | null;
  isLoading: boolean;
  unlockWallet: (password: string) => Promise<boolean>; // Returns true on success
  lockWallet: () => void;
  // Add functions to interact with the wallet if needed
}

const WalletContext = createContext<WalletContextProps | undefined>(undefined);

// --- Placeholder Decryption (Same as in unlock screen - REPLACE) ---
async function decryptDataWithPassword(encryptedData: string, passwordAttempt: string): Promise<string | null> {
    console.warn("Using placeholder decryption in Context - Insecure!");
    const storedPassword = await SecureStore.getItemAsync('dev_unsafe_password');
    if (passwordAttempt === storedPassword) {
        return await SecureStore.getItemAsync('walletMnemonic_dev_unsafe');
    }
    return null;
}
// --- End Placeholder ---


export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Loading state for unlock

  const unlockWallet = async (password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Fetch encrypted data (using unsafe placeholder key)
      const storedData = await SecureStore.getItemAsync('walletMnemonic_dev_unsafe');
      if (!storedData) {
         console.error("No wallet data found in secure store.");
         // Handle case where data is missing unexpectedly
         // Maybe force logout / navigate to setup?
         return false;
      }

      // Decrypt (using placeholder)
      const decryptedMnemonic = await decryptDataWithPassword(storedData, password);

      if (decryptedMnemonic) {
        // Create wallet instance from decrypted mnemonic
        const unlockedWallet = ethers.Wallet.fromMnemonic(decryptedMnemonic);
        setWallet(unlockedWallet);
        console.log("Wallet unlocked via Context");
        return true; // Indicate success
      } else {
        console.log("Password incorrect in Context");
        setWallet(null); // Ensure wallet is null on failure
        return false; // Indicate failure
      }
    } catch (error) {
      console.error("Error unlocking wallet in Context:", error);
      setWallet(null);
      return false; // Indicate failure
    } finally {
      setIsLoading(false);
    }
  };

  // Simpler biometric unlock assuming password unlock worked previously or data is accessible
  // In a real app, this might re-verify biometrics and access securely stored key/password
  const unlockWithBiometrics = async (): Promise<boolean> => {
       setIsLoading(true);
       try {
           // Placeholder: Directly retrieve unsafe data if biometrics are assumed valid
           const storedMnemonic = await SecureStore.getItemAsync('walletMnemonic_dev_unsafe');
            if (storedMnemonic) {
                const unlockedWallet = ethers.Wallet.fromMnemonic(storedMnemonic);
                setWallet(unlockedWallet);
                console.log("Wallet unlocked via Biometrics (Context Placeholder)");
                return true;
            }
            return false;
       } catch (error) {
           console.error("Error unlocking with biometrics:", error);
           return false;
       } finally {
            setIsLoading(false);
       }
  };


  const lockWallet = () => {
    setWallet(null); // Clear the wallet instance from state
    console.log("Wallet locked");
    // Navigation back to unlock screen should happen in the component calling this
  };

  return (
    <WalletContext.Provider value={{ wallet, isLoading, unlockWallet, lockWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextProps => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};