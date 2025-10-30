// app/set-pin.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Keyboard,
  Pressable, // Import Pressable
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const PIN_LENGTH = 4;

export default function SetPinScreen() {
  const router = useRouter();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [enableBiometrics, setEnableBiometrics] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pinExists, setPinExists] = useState(false);
  
  // State to manage which input is active for styling
  const [focusedInput, setFocusedInput] = useState<'current' | 'new' | 'confirm'>('new');

  // Refs for the hidden inputs
  const currentPinRef = useRef<TextInput>(null);
  const newPinRef = useRef<TextInput>(null);
  const confirmNewPinRef = useRef<TextInput>(null);

  useEffect(() => {
    const checkExistingPin = async () => {
      const existingHash = await SecureStore.getItemAsync('walletPinHash');
      const isSet = !!existingHash;
      setPinExists(isSet);
      
      // Set initial focus
      if (isSet) {
        setFocusedInput('current');
        currentPinRef.current?.focus();
      } else {
        setFocusedInput('new');
        newPinRef.current?.focus();
      }

      const bioPref = await SecureStore.getItemAsync('biometricsEnabled');
      setEnableBiometrics(bioPref === 'true');
    };
    checkExistingPin();
  }, []);

  const handleSetPin = async () => {
    if (pinExists) {
      if (currentPin.length !== PIN_LENGTH) {
        Alert.alert('Current PIN Required', 'Please enter your current 4-digit PIN.');
        return;
      }
      // TODO: Add logic to verify currentPin against the stored hash first
      console.warn('Current PIN verification logic not implemented!');
    }

    if (newPin.length !== PIN_LENGTH) {
      Alert.alert('Invalid PIN', 'New PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmNewPin) {
      Alert.alert("PINs Don't Match", 'The new PINs do not match.');
      return;
    }

    setIsSaving(true);
    Keyboard.dismiss();

    try {
      // **SECURITY:** Hash the NEW PIN
      const salt = 'YOUR_UNIQUE_APP_SALT'; // Use the SAME salt consistently
      const hashedPin = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        newPin + salt,
      );

      await SecureStore.setItemAsync('walletPinHash', hashedPin);
      await SecureStore.setItemAsync(
        'biometricsEnabled',
        JSON.stringify(enableBiometrics),
      );

      Alert.alert(
        'PIN Updated',
        `App PIN has been ${pinExists ? 'changed' : 'set'} successfully.`,
      );
      router.back();
    } catch (error) {
      console.error('Error setting/changing PIN:', error);
      Alert.alert('Error', 'Could not update PIN settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Reusable Render function for PIN boxes ---
  const renderPinInputs = (pinValue: string, isActive: boolean) => {
    const boxes = [];
    for (let i = 0; i < PIN_LENGTH; i++) {
      const digit = pinValue[i] || '';
      // Highlight the next box to be filled
      const isBoxFocused = isActive && i === pinValue.length;

      boxes.push(
        <View
          key={i}
          style={[styles.pinBox, isBoxFocused && styles.pinBoxFocused]}>
          {/* Use a dot for entered digits */}
          {digit ? <View style={styles.pinDot} /> : null}
        </View>,
      );
    }
    return boxes;
  };

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={Colors.dark.tint} />
      </TouchableOpacity>
      <ThemedText style={styles.title}>
        {pinExists ? 'Change App PIN' : 'Set Up App PIN'}
      </ThemedText>

      {/* --- Current PIN Input --- */}
      {pinExists && (
        <>
          <ThemedText style={styles.pinLabel}>Enter Current PIN</ThemedText>
          <Pressable
            style={styles.pinContainer}
            onPress={() => currentPinRef.current?.focus()}>
            <View style={styles.pinRow}>
              {renderPinInputs(currentPin, focusedInput === 'current')}
            </View>
          </Pressable>
          <TextInput
            ref={currentPinRef}
            style={styles.hiddenInput}
            value={currentPin}
            onChangeText={(text) => setCurrentPin(text.replace(/[^0-9]/g, ''))}
            maxLength={PIN_LENGTH}
            keyboardType="number-pad"
            secureTextEntry
            caretHidden
            onFocus={() => setFocusedInput('current')}
          />
        </>
      )}

      {/* --- New PIN Input --- */}
      <ThemedText style={styles.pinLabel}>Enter New 4-digit PIN</ThemedText>
      <Pressable
        style={styles.pinContainer}
        onPress={() => newPinRef.current?.focus()}>
        <View style={styles.pinRow}>
          {renderPinInputs(newPin, focusedInput === 'new')}
        </View>
      </Pressable>
      <TextInput
        ref={newPinRef}
        style={styles.hiddenInput}
        value={newPin}
        onChangeText={(text) => setNewPin(text.replace(/[^0-9]/g, ''))}
        maxLength={PIN_LENGTH}
        keyboardType="number-pad"
        secureTextEntry
        caretHidden
        onFocus={() => setFocusedInput('new')}
        autoFocus={!pinExists} // Autofocus if setting new pin
      />

      {/* --- Confirm New PIN Input --- */}
      <ThemedText style={styles.pinLabel}>Confirm New PIN</ThemedText>
      <Pressable
        style={styles.pinContainer}
        onPress={() => confirmNewPinRef.current?.focus()}>
        <View style={styles.pinRow}>
          {renderPinInputs(confirmNewPin, focusedInput === 'confirm')}
        </View>
      </Pressable>
      <TextInput
        ref={confirmNewPinRef}
        style={styles.hiddenInput}
        value={confirmNewPin}
        onChangeText={(text) => setConfirmNewPin(text.replace(/[^0-9]/g, ''))}
        maxLength={PIN_LENGTH}
        keyboardType="number-pad"
        secureTextEntry
        caretHidden
        onFocus={() => setFocusedInput('confirm')}
      />

      {/* --- Biometrics Toggle --- */}
      <View style={styles.biometricsContainer}>
        <ThemedText style={styles.biometricsText}>
          Enable Fingerprint/Face Unlock
        </ThemedText>
        <Switch
          trackColor={{ false: '#3e3e3e', true: Colors.dark.tint }}
          thumbColor={enableBiometrics ? '#000000' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={setEnableBiometrics}
          value={enableBiometrics}
          disabled={isSaving}
        />
      </View>

      {/* --- Save Button --- */}
      <TouchableOpacity
        style={[
          styles.button,
          styles.primaryButton,
          (isSaving ||
            !newPin ||
            newPin.length !== PIN_LENGTH ||
            newPin !== confirmNewPin ||
            (pinExists && currentPin.length !== PIN_LENGTH)) &&
            styles.buttonDisabled,
        ]}
        onPress={handleSetPin}
        disabled={
          isSaving ||
          !newPin ||
          newPin.length !== PIN_LENGTH ||
          newPin !== confirmNewPin ||
          (pinExists && currentPin.length !== PIN_LENGTH)
        }
        activeOpacity={0.8}>
        {isSaving ? (
          <ActivityIndicator color="#000000" size="small" />
        ) : (
          <ThemedText style={[styles.buttonText, styles.primaryButtonText]}>
            {pinExists ? 'Change PIN' : 'Set PIN'}
          </ThemedText>
        )}
      </TouchableOpacity>
    </ThemedView>
  );
}

// --- Updated Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 15,
    zIndex: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 30,
    marginTop: 20,
  },
  pinLabel: {
    fontSize: 16,
    color: Colors.dark.icon,
    marginBottom: 15,
    width: '100%',
    maxWidth: 300,
    textAlign: 'left',
  },
  // --- PIN BOX STYLES ---
  pinContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 25,
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
  // --- END PIN STYLES ---
  biometricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    paddingVertical: 10,
    marginBottom: 10,
    marginTop: 10,
  },
  biometricsText: {
    fontSize: 16,
    color: Colors.dark.text,
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
  buttonText: {
    color: Colors.dark.tint,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#000000',
  },
  buttonDisabled: {
    backgroundColor: '#555',
    opacity: 0.7,
  },
});