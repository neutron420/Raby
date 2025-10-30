// app/(tabs)/settings.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useWallet } from '@/context/wallet-context'; // UPDATED: Import the hook

export default function SettingsScreen() {
  const router = useRouter();
  const [pinIsSet, setPinIsSet] = useState(false);
  const { setWallet } = useWallet(); // UPDATED: Get the setWallet function

  // Check if PIN is set when screen loads
  useEffect(() => {
    const checkPinStatus = async () => {
      const pinHash = await SecureStore.getItemAsync('walletPinHash');
      setPinIsSet(!!pinHash);
    };
    checkPinStatus();
  }, []);

  const handleLogout = async () => {
    // 1. UPDATED: Clear the wallet state (from context)
    setWallet(null);

    // 2. Decide where to navigate after logout
    const pinHash = await SecureStore.getItemAsync('walletPinHash');
    if (pinHash) {
      router.replace('/unlock-wallet');
    } else {
      router.replace('/unlock-wallet');
    }
  };

  const navigateToPinSetup = () => {
    router.push('/set-pin');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>
      <ThemedText>App settings will be here.</ThemedText>

      {/* Set/Change PIN Button */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={navigateToPinSetup}>
        <ThemedText style={styles.settingsButtonText}>
          {pinIsSet ? 'Change App PIN' : 'Set Up App PIN'}
        </ThemedText>
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <ThemedText style={styles.logoutButtonText}>Logout & Lock</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20, // Add padding
  },
  settingsButton: {
    // Style for general settings buttons
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: '#2C2C2E', // Dark grey background
    borderRadius: 8,
    width: '80%', // Make buttons wider
    alignItems: 'center', // Center text
  },
  settingsButtonText: {
    color: '#FFFFFF', // White text
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 20, // Reduced margin between buttons
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: '#551111', // Dark red background for logout
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FF6B6B', // Light red color for logout text
    fontSize: 16,
    fontWeight: '600',
  },
});