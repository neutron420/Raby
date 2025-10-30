// app/import-phrase.tsx
import 'react-native-get-random-values';
import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import * as SecureStore from 'expo-secure-store';
import { ethers } from 'ethers'; // Should be ethers v5
import { useWallet } from '@/context/wallet-context'; // UPDATED: Import the hook

export default function ImportPhraseScreen() {
  const router = useRouter();
  const { setWallet } = useWallet(); // UPDATED: Get the setWallet function
  const [phrase, setPhrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImportPhrase = async () => {
    const normalizedPhrase = phrase.trim().replace(/\s+/g, ' ');

    if (!normalizedPhrase) {
      Alert.alert('Input Required', 'Please enter your recovery phrase.');
      return;
    }

    const words = normalizedPhrase.split(' ');
    if (
      !(words.length >= 12 && words.length % 3 === 0 && words.length <= 24)
    ) {
      Alert.alert(
        'Invalid Length',
        'Recovery phrases typically have 12, 15, 18, 21, or 24 words.',
      );
      return;
    }

    setIsLoading(true);
    try {
      // Validate the mnemonic using ethers v5
      if (!ethers.utils.isValidMnemonic(normalizedPhrase)) {
        Alert.alert(
          'Invalid Phrase',
          'The recovery phrase is invalid. Please check the words and ensure they are separated by single spaces.',
        );
        setIsLoading(false);
        return;
      }

      // Create wallet from mnemonic
      const wallet = ethers.Wallet.fromMnemonic(normalizedPhrase);
      const importedMnemonic = normalizedPhrase;
      const importedPrivateKey = wallet.privateKey;

      // Storing raw data (INSECURE - FOR DEMO ONLY)
      await SecureStore.setItemAsync(
        'walletMnemonic_dev_unsafe',
        importedMnemonic,
      );
      await SecureStore.setItemAsync(
        'walletPrivateKey_dev_unsafe',
        importedPrivateKey,
      );
      await SecureStore.setItemAsync('walletExists', 'true');

      // UPDATED: Set wallet in context
      setWallet(wallet); // This line sends the wallet to the global state

      Alert.alert(
        'Wallet Imported',
        'Your wallet has been imported successfully using the recovery phrase.',
      );
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error importing via phrase:', error);
      Alert.alert(
        'Import Error',
        'Could not import the wallet using the phrase. Please verify your input and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={Colors.dark.tint} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Ionicons
          name="document-text-outline"
          size={56}
          color={Colors.dark.tint}
          style={styles.headerIcon}
        />
        <ThemedText style={styles.instructionTitle}>Import via Phrase</ThemedText>
        <ThemedText style={styles.instructionText}>
          Enter your 12 or 24-word recovery phrase below, separated by single
          spaces.
        </ThemedText>

        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="Enter recovery phrase..."
          placeholderTextColor="#888"
          value={phrase}
          onChangeText={setPhrase}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
          selectionColor={Colors.dark.tint}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleImportPhrase}
          disabled={isLoading}
          activeOpacity={0.8}>
          {isLoading ? (
            <ActivityIndicator color="#000000" size="small" />
          ) : (
            <ThemedText style={[styles.buttonText, styles.primaryButtonText]}>
              Import Wallet
            </ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

// Styles are very similar to import-wallet.tsx styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', paddingTop: 60 },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 15,
    zIndex: 10,
    padding: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerIcon: { marginBottom: 20 },
  instructionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  instructionText: {
    fontSize: 16,
    color: Colors.dark.icon,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  textArea: {
    width: '100%',
    height: 120,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingTop: 15,
    fontSize: 16,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    marginBottom: 30,
    textAlignVertical: 'top',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
    width: '90%',
    maxWidth: 400,
    marginTop: 15,
    minHeight: 50,
  },
  buttonText: { color: Colors.dark.tint, fontSize: 16, fontWeight: '600' },
  primaryButton: { backgroundColor: Colors.dark.tint },
  primaryButtonText: { color: '#000000' },
  buttonDisabled: { backgroundColor: '#555', opacity: 0.7 },
});