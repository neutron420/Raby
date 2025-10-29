// app/set-pin.tsx
import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Switch, Keyboard } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

export default function SetPinScreen() {
    const router = useRouter();
    const [currentPin, setCurrentPin] = useState(''); // Optional: For changing PIN
    const [newPin, setNewPin] = useState('');
    const [confirmNewPin, setConfirmNewPin] = useState('');
    const [enableBiometrics, setEnableBiometrics] = useState(false); // Can also set biometrics here
    const [isSaving, setIsSaving] = useState(false);
    const [pinExists, setPinExists] = useState(false); // Track if changing or setting for first time

    // Check if a PIN already exists when the screen loads
    React.useEffect(() => {
        const checkExistingPin = async () => {
            const existingHash = await SecureStore.getItemAsync('walletPinHash');
            setPinExists(!!existingHash); // True if hash exists, false otherwise
             const bioPref = await SecureStore.getItemAsync('biometricsEnabled');
             setEnableBiometrics(bioPref === 'true'); // Load current preference
        };
        checkExistingPin();
    }, []);

    const handleSetPin = async () => {
        if (pinExists) {
             // TODO: Add logic to verify currentPin against the stored hash first
             if (!currentPin) {
                 Alert.alert("Current PIN Required", "Please enter your current PIN to change it.");
                 return;
             }
             // Add hash comparison logic here...
             console.warn("Current PIN verification logic not implemented!");
        }

        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
             Alert.alert("Invalid PIN", "New PIN must be exactly 4 digits.");
             return;
        }
        if (newPin !== confirmNewPin) {
            Alert.alert("PINs Don't Match", "The new PINs do not match.");
            return;
        }

        setIsSaving(true);
        Keyboard.dismiss();

        try {
            // **SECURITY:** Hash the NEW PIN
            // For simplicity, using a fixed salt here - DO NOT DO THIS IN PRODUCTION
            const salt = "YOUR_UNIQUE_APP_SALT"; // Use the SAME salt consistently
            const hashedPin = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                newPin + salt
            );

            // Store the HASHED PIN
            await SecureStore.setItemAsync('walletPinHash', hashedPin);
            // Save biometrics preference
            await SecureStore.setItemAsync('biometricsEnabled', JSON.stringify(enableBiometrics));

            Alert.alert("PIN Updated", `App PIN has been ${pinExists ? 'changed' : 'set'} successfully.`);
            router.back(); // Go back to settings

        } catch(error) {
             console.error("Error setting/changing PIN:", error);
             Alert.alert("Error", "Could not update PIN settings.");
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <ThemedView style={styles.container}>
             <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                 <Ionicons name="arrow-back" size={24} color={Colors.dark.tint} />
             </TouchableOpacity>
            <ThemedText style={styles.title}>{pinExists ? "Change App PIN" : "Set Up App PIN"}</ThemedText>

            {pinExists && (
                 <View style={styles.pinInputContainer}>
                   <TextInput
                     style={styles.pinInput}
                     placeholder="Enter Current PIN"
                     placeholderTextColor="#888"
                     keyboardType="number-pad"
                     maxLength={4}
                     secureTextEntry={true}
                     value={currentPin}
                     onChangeText={setCurrentPin}
                     editable={!isSaving}
                     selectionColor={Colors.dark.tint}
                  />
                </View>
            )}

             <View style={styles.pinInputContainer}>
                   <TextInput
                     style={styles.pinInput}
                     placeholder="Enter New 4-digit PIN"
                     placeholderTextColor="#888"
                     keyboardType="number-pad"
                     maxLength={4}
                     secureTextEntry={true}
                     value={newPin}
                     onChangeText={setNewPin}
                     editable={!isSaving}
                     selectionColor={Colors.dark.tint}
                  />
              </View>

              <View style={styles.pinInputContainer}>
                   <TextInput
                     style={styles.pinInput}
                     placeholder="Confirm New PIN"
                     placeholderTextColor="#888"
                     keyboardType="number-pad"
                     maxLength={4}
                     secureTextEntry={true}
                     value={confirmNewPin}
                     onChangeText={setConfirmNewPin}
                     editable={!isSaving}
                     selectionColor={Colors.dark.tint}
                  />
              </View>

              <View style={styles.biometricsContainer}>
                  <ThemedText style={styles.biometricsText}>Enable Fingerprint/Face Unlock</ThemedText>
                  <Switch
                      trackColor={{ false: "#3e3e3e", true: Colors.dark.tint }}
                      thumbColor={enableBiometrics ? "#000000" : "#f4f3f4"}
                      ios_backgroundColor="#3e3e3e"
                      onValueChange={setEnableBiometrics}
                      value={enableBiometrics}
                      disabled={isSaving}
                  />
              </View>

             <TouchableOpacity
                style={[
                    styles.button,
                    styles.primaryButton,
                    (isSaving || !newPin || newPin.length !== 4 || newPin !== confirmNewPin || (pinExists && !currentPin)) && styles.buttonDisabled
                ]}
                onPress={handleSetPin}
                disabled={isSaving || !newPin || newPin.length !== 4 || newPin !== confirmNewPin || (pinExists && !currentPin)}
                activeOpacity={0.8}
              >
                 {isSaving ? (
                      <ActivityIndicator color="#000000" size="small"/>
                  ) : (
                     <ThemedText style={[styles.buttonText, styles.primaryButtonText]}>{pinExists ? "Change PIN" : "Set PIN"}</ThemedText>
                 )}
              </TouchableOpacity>


        </ThemedView>
    );
}

// Styles similar to unlock/create PIN stages
const styles = StyleSheet.create({
     container: { flex: 1, backgroundColor: '#000000', paddingTop: 60, alignItems: 'center', paddingHorizontal: 20, }, // Added alignItems
     backButton: { position: 'absolute', top: 50, left: 15, zIndex: 10, padding: 10, },
     title: { fontSize: 24, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 40, marginTop: 20, },
     pinInputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', maxWidth: 400, height: 50, backgroundColor: '#1C1C1E', borderRadius: 10, borderWidth: 1, borderColor: '#3A3A3C', marginBottom: 20, paddingHorizontal: 15, },
     pinInput: { flex: 1, height: '100%', fontSize: 18, color: Colors.dark.text, letterSpacing: 10, textAlign: 'center', },
     biometricsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 400, paddingVertical: 10, marginBottom: 20, },
     biometricsText: { fontSize: 16, color: Colors.dark.text, },
     button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, width: '100%', maxWidth: 400, marginTop: 15, minHeight: 50, },
     primaryButton: { backgroundColor: Colors.dark.tint, },
     buttonText: { color: Colors.dark.tint, fontSize: 16, fontWeight: '600', },
     primaryButtonText: { color: '#000000', },
     buttonDisabled: { backgroundColor: '#555', opacity: 0.7, },
});