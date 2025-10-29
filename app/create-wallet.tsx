// app/create-wallet.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator } from 'react-native'; // Added TextInput, ActivityIndicator
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';

// IMPORTANT: Make sure ethers v5 and polyfills are installed
// npm install ethers@5.7.2
// npx expo install react-native-get-random-values
import 'react-native-get-random-values'; // Import needed for ethers v5
import { ethers } from 'ethers';

type Stage = 'generate' | 'verify' | 'password' | 'done';

export default function CreateWalletScreen() {
    const router = useRouter();
    const [stage, setStage] = useState<Stage>('generate');
    const [mnemonic, setMnemonic] = useState<string | null>(null);
    const [originalWords, setOriginalWords] = useState<string[]>([]);
    const [shuffledWords, setShuffledWords] = useState<string[]>([]);
    const [selectedWords, setSelectedWords] = useState<string[]>([]);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isGenerating, setIsGenerating] = useState(true); // Added loading state
    const [isSaving, setIsSaving] = useState(false); // Added saving state

    // Generate mnemonic safely on component mount
    useEffect(() => {
        try {
            const wallet = ethers.Wallet.createRandom();
            const generatedMnemonic = wallet.mnemonic?.phrase;
            if (!generatedMnemonic) {
                throw new Error("Mnemonic generation failed");
            }
            const words = generatedMnemonic.split(' ');
            setMnemonic(generatedMnemonic);
            setOriginalWords(words);
            // Prepare for verification stage - shuffle words
            setShuffledWords([...words].sort(() => Math.random() - 0.5));
            setIsGenerating(false); // Done generating
        } catch (error) {
            console.error("Error generating mnemonic:", error);
            Alert.alert("Error", "Could not generate recovery phrase. Please try again.", [
                { text: 'OK', onPress: () => router.back() } // Go back if generation fails
            ]);
        }
    }, [router]);

    const handleCopyToClipboard = async () => {
        if (mnemonic) {
            await Clipboard.setStringAsync(mnemonic);
            Alert.alert("Copied", "Recovery phrase copied to clipboard.");
        }
    };

    const handleSelectWord = (word: string, index: number) => {
        setSelectedWords([...selectedWords, word]);
        // Remove word from shuffled list by index to handle duplicate words correctly
        setShuffledWords(shuffledWords.filter((_, i) => i !== index));
    };

    const handleRemoveWord = (index: number) => {
        const wordToRemove = selectedWords[index];
        setSelectedWords(selectedWords.filter((_, i) => i !== index));
        // Add word back to shuffled list
        setShuffledWords([...shuffledWords, wordToRemove].sort(() => Math.random() - 0.5));
    };

    const handleVerifyPhrase = () => {
        if (selectedWords.join(' ') === mnemonic) {
            setStage('password'); // Move to password stage
        } else {
            Alert.alert("Incorrect Order", "The words are not in the correct order. Please try again.");
            // Reset verification
            setSelectedWords([]);
            setShuffledWords([...originalWords].sort(() => Math.random() - 0.5)); // Use originalWords to reset
        }
    };

    const handleSetPassword = async () => {
        if (password.length < 6) {
             Alert.alert("Password Too Short", "Password must be at least 6 characters.");
             return;
        }
        if (password !== confirmPassword) {
            Alert.alert("Passwords Don't Match", "Please re-enter your password confirmation.");
            return;
        }
        if (!mnemonic) {
            Alert.alert("Error", "Recovery phrase not available. Cannot proceed.");
            return;
        }

        setIsSaving(true);
        try {
            // **SECURITY NOTE:** Implement proper encryption here using the password.
            // This example still stores the raw mnemonic (INSECURE).
            // Example using a placeholder function:
            // const encryptedMnemonic = await encryptDataWithPassword(mnemonic, password);
            // await SecureStore.setItemAsync('walletEncryptedMnemonic', encryptedMnemonic);

            // Storing raw mnemonic for demonstration ONLY. DO NOT DO THIS IN PRODUCTION.
            await SecureStore.setItemAsync('walletMnemonic_dev_unsafe', mnemonic);
            await SecureStore.setItemAsync('walletExists', 'true');

            Alert.alert("Wallet Created", "Your wallet has been set up.");
            router.replace('/(tabs)'); // Navigate to main app
        } catch (error) {
            console.error("Error saving wallet:", error);
            Alert.alert("Storage Error", "Could not save wallet information securely.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- Render Functions for Stages ---

    const renderGenerateStage = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <ThemedText style={styles.instructionTitle}>Your Recovery Phrase</ThemedText>
            <ThemedText style={styles.warningText}>
                Write down these 12 words in order and keep them somewhere safe offline. They are the **only** way to recover your wallet if you lose access.
            </ThemedText>
            <View style={styles.phraseContainer}>
                {originalWords.map((word, index) => (
                    <View key={index} style={styles.wordBox}>
                        <ThemedText style={styles.wordIndex}>{index + 1}.</ThemedText>
                        <ThemedText style={styles.wordText}>{word}</ThemedText>
                    </View>
                ))}
            </View>
            <TouchableOpacity style={styles.button} onPress={handleCopyToClipboard}>
                <Ionicons name="copy-outline" size={20} color={Colors.dark.tint} />
                <ThemedText style={styles.buttonText}>Copy Phrase</ThemedText>
            </TouchableOpacity>
             <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={() => setStage('verify')}>
                <ThemedText style={[styles.buttonText, styles.primaryButtonText]}>I&apos;ve Saved My Phrase</ThemedText>
            </TouchableOpacity>
        </ScrollView>
    );

    const renderVerifyStage = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
             <ThemedText style={styles.instructionTitle}>Verify Recovery Phrase</ThemedText>
             <ThemedText style={styles.instructionText}>
                Tap the words below in the correct order ({selectedWords.length + 1}/12).
             </ThemedText>
            {/* Area to display selected words */}
             <View style={styles.selectedWordsContainer}>
                 {selectedWords.map((word, index) => (
                    <TouchableOpacity key={`${word}-${index}`} onPress={() => handleRemoveWord(index)} style={styles.selectedWordChip}>
                       <ThemedText>{index + 1}. {word}</ThemedText>
                    </TouchableOpacity>
                 ))}
                 {selectedWords.length === 0 && <ThemedText style={styles.placeholderText}>Tap words below to add them here...</ThemedText>}
             </View>

             {/* Area to display shuffled word options */}
             <View style={styles.shuffledWordsContainer}>
                {shuffledWords.map((word, index) => (
                    // Using index as part of key because words can repeat in shuffled list temporarily
                    <TouchableOpacity key={`${word}-${index}`} style={styles.wordChip} onPress={() => handleSelectWord(word, index)}>
                        <ThemedText style={styles.chipText}>{word}</ThemedText>
                    </TouchableOpacity>
                ))}
             </View>

            {selectedWords.length === 12 && (
                 <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleVerifyPhrase}>
                    <ThemedText style={[styles.buttonText, styles.primaryButtonText]}>Verify</ThemedText>
                </TouchableOpacity>
            )}
        </ScrollView>
    );

     const renderPasswordStage = () => (
         <View style={styles.content}>
              <ThemedText style={styles.instructionTitle}>Set App Password</ThemedText>
              <ThemedText style={styles.instructionText}>
                 Create a password to secure your wallet on this device. This does NOT recover your wallet if you lose your phrase.
              </ThemedText>

              <TextInput
                 style={styles.input}
                 placeholder="Enter Password (min. 6 characters)"
                 placeholderTextColor="#888"
                 secureTextEntry={true}
                 value={password}
                 onChangeText={setPassword}
                 editable={!isSaving}
                 selectionColor={Colors.dark.tint}
              />
               <TextInput
                 style={styles.input}
                 placeholder="Confirm Password"
                 placeholderTextColor="#888"
                 secureTextEntry={true}
                 value={confirmPassword}
                 onChangeText={setConfirmPassword}
                 editable={!isSaving}
                 selectionColor={Colors.dark.tint}
              />

              <TouchableOpacity
                style={[styles.button, styles.primaryButton, isSaving && styles.buttonDisabled]}
                onPress={handleSetPassword}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                  {isSaving ? (
                      <ActivityIndicator color="#000000" />
                  ) : (
                      <ThemedText style={[styles.buttonText, styles.primaryButtonText]}>Create Wallet</ThemedText>
                  )}
              </TouchableOpacity>
         </View>
     );


    if (isGenerating) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.dark.tint} />
                <ThemedText style={{ marginTop: 15, color: Colors.dark.icon }}>Generating secure phrase...</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            {/* Only show back button if not on the first stage */}
            {stage !== 'generate' && (
                 <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                     <Ionicons name="arrow-back" size={24} color={Colors.dark.tint} />
                 </TouchableOpacity>
            )}
            {stage === 'generate' && renderGenerateStage()}
            {stage === 'verify' && renderVerifyStage()}
            {stage === 'password' && renderPasswordStage()}
        </ThemedView>
    );
}

// --- Styles --- (Adjust as needed)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        paddingTop: 60, // Adjust for status bar/notch
        // paddingHorizontal: 20, // Moved to scroll/content view
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
    },
     scrollContent: {
        flexGrow: 1, // Allows scrolling if content overflows
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 40,
     },
     content: { // For non-scrolling content like password
         flex: 1,
         alignItems: 'center',
         justifyContent: 'center',
         paddingHorizontal: 20,
         paddingBottom: 40,
     },
     backButton: {
         position: 'absolute',
         top: 50, // Adjust as needed
         left: 15,
         zIndex: 1,
         padding: 10,
     },
    instructionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.text,
        textAlign: 'center',
        marginBottom: 15,
        marginTop: 10, // Add some margin from top/back button
    },
     instructionText: {
         fontSize: 16,
         color: Colors.dark.icon,
         textAlign: 'center',
         marginBottom: 30,
         lineHeight: 22,
     },
    warningText: {
        fontSize: 16,
        color: '#FFA500', // Orange color for warning
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    phraseContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between', // Distribute space
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 15,
        marginBottom: 30,
        width: '100%',
    },
    wordBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C2C2E',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginVertical: 6,
        marginHorizontal: '1%', // Small horizontal margin
        width: '48%', // Fit two columns nicely
    },
    wordIndex: {
        color: Colors.dark.icon,
        marginRight: 8,
        fontSize: 14,
        width: 20,
        textAlign: 'right',
    },
    wordText: {
        color: Colors.dark.text,
        fontSize: 16,
        fontWeight: '500',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: '#2C2C2E',
        width: '90%', // Use percentage width
        maxWidth: 400, // Max width for larger screens
        marginTop: 20, // Increased margin
    },
    buttonText: {
        color: Colors.dark.tint,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
     primaryButton: {
        backgroundColor: Colors.dark.tint, // White background
     },
     primaryButtonText: {
         color: '#000000', // Black text
         marginLeft: 0,
     },
     buttonDisabled: {
         backgroundColor: '#555',
     },
     // --- Verification Stage Styles ---
      selectedWordsContainer: {
         flexDirection: 'row',
         flexWrap: 'wrap',
         justifyContent: 'center',
         alignItems: 'center',
         minHeight: 150,
         width: '100%',
         backgroundColor: '#1C1C1E',
         borderRadius: 12,
         padding: 10,
         marginBottom: 30,
         borderWidth: 1,
         borderColor: '#3A3A3C',
     },
      selectedWordChip: {
          backgroundColor: '#2C2C2E',
          borderRadius: 8,
          paddingVertical: 8,
          paddingHorizontal: 12,
          margin: 5,
          flexDirection: 'row', // To align text
      },
      shuffledWordsContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: '100%',
          marginBottom: 30,
      },
      wordChip: {
         backgroundColor: '#3A3A3C',
         borderRadius: 20,
         paddingVertical: 10,
         paddingHorizontal: 16,
         margin: 6,
      },
      chipText: {
         color: Colors.dark.text,
      },
      placeholderText: {
          color: Colors.dark.icon,
          fontSize: 16,
      },
      // --- Password Stage Styles ---
      input: {
        width: '90%',
        maxWidth: 400,
        height: 50,
        backgroundColor: '#1C1C1E',
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        color: Colors.dark.text,
        borderWidth: 1,
        borderColor: '#3A3A3C',
        marginBottom: 20,
    },
});