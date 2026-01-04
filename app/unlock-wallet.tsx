// app/unlock-wallet.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useWallet } from '@/context/wallet-context';
import { Ionicons } from '@expo/vector-icons';
import { ethers } from 'ethers';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// --- (Placeholder Decryption) ---
async function decryptDataPlaceholder(
  encryptedData: string,
  pinHash: string,
): Promise<string | null> {
  console.warn('Using placeholder decryption - Insecure!');
  // No need to re-fetch pinHash - it's already validated
  // encryptedData is the mnemonic in this placeholder implementation
  return encryptedData;
}
// --- (End Placeholder) ---

export default function UnlockWalletScreen() {
  const router = useRouter();
  const { setWallet } = useWallet();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricsAvailable, setIsBiometricsAvailable] = useState(false);
  const [biometricsEnabledByUser, setBiometricsEnabledByUser] = useState(false);

  const pinInputRef = useRef<TextInput>(null);
  const PIN_LENGTH = 4;

  useEffect(() => {
    const checkBiometrics = async () => {
      // Run all checks in parallel for speed
      const [hasHardware, isEnrolled, enabledPref, pinHash] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        SecureStore.getItemAsync('biometricsEnabled'),
        SecureStore.getItemAsync('walletPinHash'),
      ]);

      const pinIsSetup = !!pinHash;
      const biometricsAvailable = hasHardware && isEnrolled && pinIsSetup;
      const biometricsEnabled = enabledPref === 'true' && pinIsSetup;

      setIsBiometricsAvailable(biometricsAvailable);
      setBiometricsEnabledByUser(biometricsEnabled);

      // Auto-trigger biometric if enabled
      if (biometricsAvailable && biometricsEnabled) {
        // Small delay to ensure UI is ready
        requestAnimationFrame(() => {
          handleBiometricUnlock();
        });
      }
    };
    checkBiometrics();
  }, []);

  const handlePinUnlock = async () => {
    if (pin.length !== PIN_LENGTH) {
      Alert.alert('Invalid PIN', `PIN must be ${PIN_LENGTH} digits.`);
      return;
    }
    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const salt = 'YOUR_UNIQUE_APP_SALT';
      
      // Run hash and SecureStore operations in parallel for speed
      const [enteredPinHash, storedPinHash, encryptedMnemonic] = await Promise.all([
        Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          pin + salt,
        ),
        SecureStore.getItemAsync('walletPinHash'),
        SecureStore.getItemAsync('walletMnemonic_dev_unsafe'),
      ]);

      if (!storedPinHash) {
        Alert.alert(
          'PIN Not Set Up',
          'Please set up a PIN in Settings first.',
        );
        setIsLoading(false);
        setPin('');
        return;
      }

      if (enteredPinHash !== storedPinHash) {
        Alert.alert('Incorrect PIN', 'The PIN you entered is incorrect.');
        setPin('');
        setIsLoading(false);
        return;
      }

      if (!encryptedMnemonic) {
        Alert.alert(
          'Wallet Data Error',
          'Wallet data is missing. Please reset and import again.',
        );
        setIsLoading(false);
        return;
      }

      // Decrypt and unlock wallet (placeholder - just use the mnemonic directly)
      const decryptedMnemonic = encryptedMnemonic;

      if (!decryptedMnemonic) {
        Alert.alert(
          'Decryption Failed',
          'Could not decrypt wallet data, even with correct PIN.',
        );
        setPin('');
        setIsLoading(false);
        return;
      }

      // Create wallet and set in context - do this synchronously for speed
      const unlockedWallet = ethers.Wallet.fromMnemonic(decryptedMnemonic);
      
      // Set loading to false BEFORE setting wallet to allow immediate navigation
      setIsLoading(false);
      setPin('');
      
      // Set wallet and navigate immediately - data fetching happens in background
      setWallet(unlockedWallet);
      console.log('PIN Unlock Successful, wallet set in context');
      
      // Navigate immediately - no delay needed
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error during PIN unlock:', error);
      Alert.alert('Unlock Error', 'An error occurred during unlock.');
      setPin('');
      setIsLoading(false);
      return;
    }
  };

  const handleBiometricUnlock = async () => {
    if (!isBiometricsAvailable) return;
    setIsLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Raby Wallet',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });
      
      if (!result.success) {
        // User cancelled or authentication failed
        if (
          result.error !== 'user_cancel' &&
          result.error !== 'system_cancel'
        ) {
          Alert.alert(
            'Authentication Failed',
            'Biometric authentication failed.',
          );
        }
        setIsLoading(false);
        return;
      }

      // Authentication successful - get mnemonic and unlock
      const storedMnemonic = await SecureStore.getItemAsync(
        'walletMnemonic_dev_unsafe',
      );
      
      if (!storedMnemonic) {
        Alert.alert(
          'Error',
          'Wallet data not found after biometric unlock.',
        );
        router.replace('/wallet-setup');
        setIsLoading(false);
        return;
      }

      // Create wallet and set in context - do this synchronously for speed
      const unlockedWallet = ethers.Wallet.fromMnemonic(storedMnemonic);
      
      // Set loading to false BEFORE setting wallet to allow immediate navigation
      setIsLoading(false);
      
      // Set wallet and navigate immediately - data fetching happens in background
      setWallet(unlockedWallet);
      console.log('Biometric Unlock Successful, wallet set in context');
      
      // Navigate immediately - no delay needed
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error during biometric unlock:', error);
      Alert.alert('Biometric Error', 'An error occurred.');
      setIsLoading(false);
      return;
    }
  };

  // --- (Render function for PIN boxes) ---
  const renderPinInputs = () => {
    const boxes = [];
    for (let i = 0; i < PIN_LENGTH; i++) {
      const digit = pin[i] || '';
      const isFocused = i === pin.length;

      boxes.push(
        <View
          key={i}
          style={[styles.pinBox, isFocused && styles.pinBoxFocused]}>
          {digit ? <View style={styles.pinDot} /> : null}
        </View>,
      );
    }
    return boxes;
  };

  return (
    <ThemedView style={styles.container}>
      <Ionicons
        name="lock-closed-outline"
        size={56}
        color={Colors.dark.tint}
        style={styles.headerIcon}
      />
      <ThemedText style={styles.title}>Unlock Wallet</ThemedText>

      {/* --- PIN Input Area --- */}
      <Pressable
        style={styles.pinContainer}
        onPress={() => pinInputRef.current?.focus()}>
        <View style={styles.pinRow}>{renderPinInputs()}</View>
      </Pressable>

      <TextInput
        ref={pinInputRef}
        style={styles.hiddenInput}
        value={pin}
        onChangeText={(text) => {
          const numericText = text.replace(/[^0-9]/g, '');
          if (numericText.length <= PIN_LENGTH) {
            setPin(numericText);
          }
        }}
        maxLength={PIN_LENGTH}
        keyboardType="number-pad"
        secureTextEntry
        autoFocus
        caretHidden
        onEndEditing={() => {
          if (pin.length === PIN_LENGTH) {
            handlePinUnlock();
          }
        }}
      />
      {/* --- End PIN Input Area --- */}

      <TouchableOpacity
        style={[
          styles.button,
          styles.primaryButton,
          (isLoading || pin.length !== PIN_LENGTH) && styles.buttonDisabled,
        ]}
        onPress={handlePinUnlock}
        disabled={isLoading || pin.length !== PIN_LENGTH}
        activeOpacity={0.8}>
        {isLoading && pin ? (
          <ActivityIndicator color="#000000" size="small" />
        ) : (
          <ThemedText style={[styles.buttonText, styles.primaryButtonText]}>
            Unlock
          </ThemedText>
        )}
      </TouchableOpacity>

      {isBiometricsAvailable && biometricsEnabledByUser && (
        <TouchableOpacity
          style={[
            styles.button,
            styles.secondaryButton,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleBiometricUnlock}
          disabled={isLoading}
          activeOpacity={0.8}>
          <Ionicons
            name="finger-print"
            size={20}
            color={Colors.dark.tint}
            style={{ marginRight: 8 }}
          />
          <ThemedText style={styles.buttonText}>Use Biometrics</ThemedText>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.resetButton}
        onPress={() => {
          Alert.alert(
            'Reset Wallet?',
            'This will erase your wallet data and PIN from this device. You will need your recovery phrase to import it again. Are you sure?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Reset',
                style: 'destructive',
                onPress: async () => {
                  await SecureStore.deleteItemAsync('walletExists');
                  await SecureStore.deleteItemAsync(
                    'walletMnemonic_dev_unsafe',
                  );
                  await SecureStore.deleteItemAsync('walletPinHash');
                  await SecureStore.deleteItemAsync('biometricsEnabled');
                  // UPDATED: Clear the context state
                  setWallet(null);
                  router.replace('/wallet-setup');
                },
              },
            ],
          );
        }}>
        <ThemedText style={styles.resetButtonText}>
          Forgot PIN? Reset Wallet
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  headerIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 40,
  },
  pinContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 30,
  },
  pinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pinBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinBoxFocused: {
    borderColor: Colors.dark.tint,
    borderWidth: 2,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.dark.tint,
  },
  hiddenInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400,
    marginTop: 15,
    minHeight: 50,
  },
  primaryButton: {
    backgroundColor: Colors.dark.tint,
  },
  secondaryButton: {
    backgroundColor: '#2C2C2E',
  },
  buttonText: {
    color: Colors.dark.tint,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  primaryButtonText: {
    color: '#000000',
    marginLeft: 0,
  },
  buttonDisabled: {
    backgroundColor: '#555',
    opacity: 0.7,
  },
  resetButton: {
    marginTop: 30,
    padding: 10,
  },
  resetButtonText: {
    color: Colors.dark.icon,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});