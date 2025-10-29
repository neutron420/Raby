// app/unlock-wallet.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Keyboard } from 'react-native'; // Import Keyboard
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto'; // Import expo-crypto for hashing

// TODO: Import your actual Wallet Context and encryption utils
// import { useWallet } from '@/context/WalletContext';
// import { decryptDataWithPinKey } from '@/utils/encryption'; // You need this

// Placeholder for decryption - REPLACE WITH ACTUAL IMPLEMENTATION using PIN hash/key
async function decryptDataPlaceholder(encryptedData: string, pinHash: string): Promise<string | null> {
    console.warn("Using placeholder decryption - Insecure!");
    // This is NOT real decryption. It just checks the hash again and returns unsafe data.
    const storedPinHash = await SecureStore.getItemAsync('walletPinHash');
    if (pinHash === storedPinHash) {
        return await SecureStore.getItemAsync('walletMnemonic_dev_unsafe'); // Return unsafe mnemonic
    }
    return null; // Hash mismatch during "decryption" check
}

export default function UnlockWalletScreen() {
    const router = useRouter();
    const [pin, setPin] = useState(''); // State for PIN input ONLY
    // Removed password and isPasswordVisible state
    const [isLoading, setIsLoading] = useState(false);
    const [isBiometricsAvailable, setIsBiometricsAvailable] = useState(false);
    const [biometricsEnabledByUser, setBiometricsEnabledByUser] = useState(false);

    // TODO: Use your actual wallet context hook here
    // const { setWallet } = useWallet();

    // Check biometrics on mount (remains the same)
    useEffect(() => {
        const checkBiometrics = async () => {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            const enabledPref = await SecureStore.getItemAsync('biometricsEnabled');
            const pinIsSetup = !!(await SecureStore.getItemAsync('walletPinHash')); // Check if PIN exists

            // Only allow biometrics if a PIN is actually set up
            setIsBiometricsAvailable(hasHardware && isEnrolled && pinIsSetup);
            setBiometricsEnabledByUser(enabledPref === 'true' && pinIsSetup);

            if (hasHardware && isEnrolled && enabledPref === 'true' && pinIsSetup) {
                 handleBiometricUnlock(); // Try biometrics first if enabled AND PIN exists
            }
        };
        checkBiometrics();
    }, []);

    // Renamed and modified for PIN
    const handlePinUnlock = async () => {
        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            Alert.alert("Invalid PIN", "PIN must be exactly 4 digits.");
            return;
        }
        setIsLoading(true);
        Keyboard.dismiss(); // Dismiss keyboard

        try {
            // **SECURITY:** Hash the entered PIN using the same method as setup
            // For simplicity, using a fixed salt here - DO NOT DO THIS IN PRODUCTION
            const salt = "YOUR_UNIQUE_APP_SALT"; // Use the SAME salt as during setup in set-pin.tsx
            const enteredPinHash = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                pin + salt
            );

            // Fetch the stored HASH
            const storedPinHash = await SecureStore.getItemAsync('walletPinHash');

            if (!storedPinHash) {
                 // This case should ideally be caught by splash screen, but handle defensively
                 Alert.alert("PIN Not Set Up", "Please set up a PIN in Settings first.");
                 // Maybe navigate to settings or setup? For now, just clear.
                 setIsLoading(false);
                 setPin('');
                 // Optionally: router.replace('/wallet-setup'); or router.replace('/(tabs)/settings');
                 return;
            }

            // Compare HASHES
            if (enteredPinHash === storedPinHash) {
                // PIN Hash matches! Now decrypt the actual wallet data.
                // **SECURITY NOTE:** Fetch the *encrypted* mnemonic/key here
                 const encryptedMnemonic = await SecureStore.getItemAsync('walletMnemonic_dev_unsafe'); // Using unsafe one for example placeholder

                if (!encryptedMnemonic) {
                    // This means wallet exists but data is missing - problematic state
                    Alert.alert("Wallet Data Error", "Wallet data is missing. Please reset and import again.");
                    setIsLoading(false);
                    // You might want to force a reset here
                    return;
                }

                // Decrypt using the PIN hash (or a key derived from it)
                // Replace this placeholder with your actual decryption logic
                // const decryptedMnemonic = await decryptDataWithPinKey(encryptedMnemonic, storedPinHash); // Pass hash or derived key
                 const decryptedMnemonic = await decryptDataPlaceholder(encryptedMnemonic, storedPinHash); // Using placeholder

                if (decryptedMnemonic) {
                    // Decryption Successful!
                    // TODO: Store wallet instance in global state (Context, Zustand, etc.)
                    // storeWalletData(decryptedMnemonic);
                    console.log("PIN Unlock Successful");
                    router.replace('/(tabs)'); // Navigate to main app
                } else {
                    // This case implies decryption failed even if hash matched - needs investigation
                     Alert.alert("Decryption Failed", "Could not decrypt wallet data, even with correct PIN.");
                     setPin(''); // Clear PIN field
                }

            } else {
                // PIN Hash does NOT match
                Alert.alert("Incorrect PIN", "The PIN you entered is incorrect.");
                setPin(''); // Clear PIN field
            }
        } catch (error) {
            console.error("Error during PIN unlock:", error);
            Alert.alert("Unlock Error", "An error occurred during unlock.");
        } finally {
            setIsLoading(false);
        }
    };

    // Biometric Unlock (remains mostly the same logic)
    const handleBiometricUnlock = async () => {
         // ... (existing biometric logic: authenticateAsync) ...
          if (!isBiometricsAvailable) return;
         setIsLoading(true);
         try {
            const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Raby Wallet' });
            if (result.success) {
                 // Placeholder: Assume success allows access to mnemonic (replace with secure method)
                 const storedMnemonic = await SecureStore.getItemAsync('walletMnemonic_dev_unsafe');
                 if (storedMnemonic) {
                    // TODO: Store wallet instance in global state
                    // storeWalletData(storedMnemonic);
                    console.log("Biometric Unlock Successful");
                    router.replace('/(tabs)');
                 } else {
                     Alert.alert("Error", "Wallet data not found after biometric unlock.");
                     router.replace('/wallet-setup'); // Fallback if data missing
                 }
            } else { /* ... handle failure/cancel ... */
                if (result.error !== 'user_cancel' && result.error !== 'system_cancel') {
                    Alert.alert("Authentication Failed", "Biometric authentication failed.");
                }
             }
         } catch(error) { /* ... handle error ... */
            console.error("Error during biometric unlock:", error);
            Alert.alert("Biometric Error", "An error occurred.");
         } finally {
            setIsLoading(false);
         }
    };

    return (
        <ThemedView style={styles.container}>
            <Ionicons name="lock-closed-outline" size={56} color={Colors.dark.tint} style={styles.headerIcon} />
            <ThemedText style={styles.title}>Unlock Wallet</ThemedText>

            {/* PIN Input Area - Replaced Password Input */}
            <View style={styles.pinInputContainer}>
                   <TextInput
                     style={styles.pinInput}
                     placeholder="Enter 4-digit PIN"
                     placeholderTextColor="#888"
                     keyboardType="number-pad" // Use number pad
                     maxLength={4} // Limit length
                     secureTextEntry={true} // Hide digits
                     value={pin}
                     onChangeText={setPin}
                     editable={!isLoading}
                     selectionColor={Colors.dark.tint}
                     textContentType="password" // Hint for password managers
                     onSubmitEditing={handlePinUnlock} // Allow unlock on keyboard submit
                  />
            </View>

            {/* Unlock Button - Calls handlePinUnlock */}
            <TouchableOpacity
                style={[styles.button, styles.primaryButton, (isLoading || pin.length !== 4) && styles.buttonDisabled]}
                onPress={handlePinUnlock} // Changed handler
                disabled={isLoading || pin.length !== 4} // Disable if loading or PIN length is wrong
                activeOpacity={0.8}
              >
                 {isLoading && !pin /* Show loading only if triggered by biometrics initially */ ? (
                      <ActivityIndicator color="#000000" size="small"/>
                  ) : isLoading && pin ? ( // Show loading if triggered by PIN submit
                      <ActivityIndicator color="#000000" size="small"/>
                  ) : (
                     <ThemedText style={[styles.buttonText, styles.primaryButtonText]}>Unlock</ThemedText>
                 )}
            </TouchableOpacity>

            {/* Biometric Unlock Button (remains the same) */}
            {isBiometricsAvailable && biometricsEnabledByUser && (
                 <TouchableOpacity
                    style={[styles.button, styles.secondaryButton, isLoading && styles.buttonDisabled]}
                    onPress={handleBiometricUnlock}
                    disabled={isLoading}
                    activeOpacity={0.8}
                 >
                     <Ionicons name="finger-print" size={20} color={Colors.dark.tint} style={{ marginRight: 8 }}/>
                     <ThemedText style={styles.buttonText}>Use Biometrics</ThemedText>
                 </TouchableOpacity>
            )}

            {/* Reset Wallet Button (Updated text) */}
             <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                     Alert.alert(
                        "Reset Wallet?",
                        "This will erase your wallet data and PIN from this device. You will need your recovery phrase to import it again. Are you sure?",
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Reset", style: "destructive", onPress: async () => {
                                // Clear ALL relevant SecureStore items
                                await SecureStore.deleteItemAsync('walletExists');
                                await SecureStore.deleteItemAsync('walletMnemonic_dev_unsafe'); // Clear unsafe data
                                // await SecureStore.deleteItemAsync('walletEncryptedData'); // Clear REAL encrypted data
                                await SecureStore.deleteItemAsync('walletPinHash'); // Clear PIN Hash
                                // await SecureStore.deleteItemAsync('walletPinSalt'); // Clear Salt if dynamic
                                await SecureStore.deleteItemAsync('biometricsEnabled');
                                // TODO: Clear global wallet state: clearWalletData();
                                router.replace('/wallet-setup'); // Go back to start
                            }}
                        ]
                     )
                }}
             >
                 <ThemedText style={styles.resetButtonText}>Forgot PIN? Reset Wallet</ThemedText>
             </TouchableOpacity>

        </ThemedView>
    );
}

// --- Styles --- (Removed password specific styles, added/updated PIN styles)
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 25, },
    headerIcon: { marginBottom: 20, },
    title: { fontSize: 24, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 40, },
    // --- Styles for PIN Input ---
    pinInputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', maxWidth: 400, height: 50, backgroundColor: '#1C1C1E', borderRadius: 10, borderWidth: 1, borderColor: '#3A3A3C', marginBottom: 25, paddingHorizontal: 15, },
    pinInput: { flex: 1, height: '100%', fontSize: 18, color: Colors.dark.text, letterSpacing: 10, // Visual spacing for digits
        textAlign: 'center', }, // Center digits
    // Removed inputEyeButton style
    button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, width: '100%', maxWidth: 400, marginTop: 15, minHeight: 50, },
    primaryButton: { backgroundColor: Colors.dark.tint, },
    secondaryButton: { backgroundColor: '#2C2C2E', },
    buttonText: { color: Colors.dark.tint, fontSize: 16, fontWeight: '600', marginLeft: 8, },
    primaryButtonText: { color: '#000000', marginLeft: 0, },
    buttonDisabled: { backgroundColor: '#555', opacity: 0.7, },
    resetButton: { marginTop: 30, padding: 10, },
    resetButtonText: { color: Colors.dark.icon, fontSize: 14, textDecorationLine: 'underline', }
});