// app/import-wallet.tsx
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native'; // Added ActivityIndicator
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import * as SecureStore from 'expo-secure-store';

// IMPORTANT: Make sure ethers v5 and polyfills are installed
// npm install ethers@5.7.2
// npx expo install react-native-get-random-values
import 'react-native-get-random-values'; // Import needed for ethers v5
import { ethers } from 'ethers';

export default function ImportWalletScreen() {
    const router = useRouter();
    const [phrase, setPhrase] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Basic regex for private key format (0x + 64 hex chars)
    const privateKeyRegex = /^0x[0-9a-fA-F]{64}$/;

    const handleImport = async () => {
        // Normalize input: trim whitespace and replace multiple spaces with single space
        const normalizedInput = phrase.trim().replace(/\s+/g, ' ');

        if (!normalizedInput) {
            Alert.alert("Input Required", "Please enter your recovery phrase or private key.");
            return;
        }

        setIsLoading(true);

        try {
            let isValid = false;
            let wallet: ethers.Wallet | null = null;
            let importedMnemonic: string | null = null;
            let importedPrivateKey: string | null = null;

            // Check if it's a potentially valid mnemonic first (check word count)
            const words = normalizedInput.split(' ');
            if (words.length >= 12 && words.length % 3 === 0 && words.length <= 24) { // Common mnemonic lengths
                 if (ethers.utils.isValidMnemonic(normalizedInput)) { // Use ethers v5 validation
                     wallet = ethers.Wallet.fromMnemonic(normalizedInput); // Use ethers v5 method
                     importedMnemonic = normalizedInput;
                     importedPrivateKey = wallet.privateKey;
                     isValid = true;
                 }
            }

            // If not a valid mnemonic, check if it's a private key format
            if (!isValid && privateKeyRegex.test(normalizedInput)) {
                 try {
                      wallet = new ethers.Wallet(normalizedInput);
                      // Check if it derives a valid address (optional but good)
                      if (ethers.utils.isAddress(wallet.address)) {
                         importedPrivateKey = normalizedInput;
                         // A wallet derived from PK doesn't have an associated mnemonic by default
                         importedMnemonic = null;
                         isValid = true;
                      }
                 } catch (pkError) {
                     // Invalid private key format according to ethers
                     console.error("Invalid private key format:", pkError);
                     isValid = false;
                 }
            }


            if (!isValid || !wallet) {
                Alert.alert("Invalid Input", "The provided recovery phrase or private key appears invalid. Please check and try again.");
                setIsLoading(false);
                return;
            }

             // **SECURITY NOTE:** Prompt for a password here to encrypt the data before storing.
             // This example stores raw data (INSECURE).

             // Store the relevant data (handle null mnemonic for PK import)
             await SecureStore.setItemAsync('walletMnemonic_dev_unsafe', importedMnemonic || ''); // Store empty string if no mnemonic
             await SecureStore.setItemAsync('walletPrivateKey_dev_unsafe', importedPrivateKey || '');
             await SecureStore.setItemAsync('walletExists', 'true');

            Alert.alert("Wallet Imported", "Your wallet has been imported successfully.");
            router.replace('/(tabs)'); // Navigate to main app

        } catch (error) {
            console.error("Error importing wallet:", error);
             if (error instanceof Error && (error.message.includes('invalid mnemonic') || error.message.includes('checksum'))) {
                 Alert.alert("Invalid Phrase", "The recovery phrase is invalid. Please check the words and checksum.");
             } else if (error instanceof Error && error.message.includes('invalid private key')) {
                  Alert.alert("Invalid Private Key", "The private key format is invalid.");
             }
             else {
                 Alert.alert("Import Error", "Could not import the wallet. Please verify your input and try again.");
             }
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
                <Ionicons name="download-outline" size={56} color={Colors.dark.tint} style={styles.headerIcon} />
                <ThemedText style={styles.instructionTitle}>Import Wallet</ThemedText>
                <ThemedText style={styles.instructionText}>
                    Enter your recovery phrase (usually 12 or 24 words) or your private key.
                </ThemedText>

                <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={4}
                    placeholder="Enter recovery phrase or private key..."
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
                    style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]}
                    onPress={handleImport}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                     {isLoading ? (
                      <ActivityIndicator color="#000000" />
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

// --- Styles --- (Similar to create wallet styles)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        paddingTop: 60,
    },
    backButton: {
         position: 'absolute',
         top: 50,
         left: 15,
         zIndex: 1,
         padding: 10,
    },
     scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 40,
     },
      headerIcon: {
         marginBottom: 20,
     },
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
        textAlignVertical: 'top', // Make sure cursor starts at top
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
    },
    buttonText: {
        color: Colors.dark.tint,
        fontSize: 16,
        fontWeight: '600',
    },
     primaryButton: {
        backgroundColor: Colors.dark.tint,
     },
     primaryButtonText: {
         color: '#000000',
     },
     buttonDisabled: {
         backgroundColor: '#555',
     },
});