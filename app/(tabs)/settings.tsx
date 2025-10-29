// app/(tabs)/settings.tsx
import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store'; // Import SecureStore
// TODO: Import your wallet context hook if needed for logout
// import { useWallet } from '@/context/WalletContext';

export default function SettingsScreen() {
  const router = useRouter();
  const [pinIsSet, setPinIsSet] = useState(false); // State to check if PIN exists
  // TODO: Use your actual wallet context hook
  // const { lockWallet } = useWallet();

  // Check if PIN is set when screen loads
  useEffect(() => {
     const checkPinStatus = async () => {
         const pinHash = await SecureStore.getItemAsync('walletPinHash');
         setPinIsSet(!!pinHash);
     };
     checkPinStatus();
     // You might want to re-check this if the user navigates back from set-pin screen
  }, []);


  const handleLogout = async () => {
    // 1. Clear the wallet state (if using context)
    // lockWallet();

    // 2. Decide where to navigate after logout
    const pinHash = await SecureStore.getItemAsync('walletPinHash');
    if (pinHash) {
        // If PIN exists, go to unlock screen
        router.replace('/unlock-wallet');
    } else {
        // If NO PIN ever set, maybe go back to initial setup? Or just lock?
        // Let's go to unlock, which will handle the no-PIN case if needed (though splash should handle it first)
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
       <TouchableOpacity style={styles.settingsButton} onPress={navigateToPinSetup}>
          <ThemedText style={styles.settingsButtonText}>
              {pinIsSet ? "Change App PIN" : "Set Up App PIN"}
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
   settingsButton: { // Style for general settings buttons
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
  }
});