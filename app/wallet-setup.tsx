// app/wallet-setup.tsx
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme'; // Use your theme colors

export default function WalletSetupScreen() {
  const router = useRouter();

  const handleCreateWallet = () => {
    // Navigate to the start of the create wallet flow
    router.push('/create-wallet');
  };

  const handleImportWallet = () => {
     // Navigate to the import screen
    router.push('/import-wallet');
  };

  // Define colors - forcing dark theme appearance
  const backgroundColor = '#000000'; // Pure black background
  const boxBackgroundColor = '#1A1A1A'; // Slightly lighter dark grey for boxes (Subtle difference)
  const iconBackgroundColor = '#2C2C2E'; // Slightly different background for icon circle
  const iconColor = Colors.dark.tint;       // White icons
  const titleTextColor = Colors.dark.text;    // White text
  const descriptionTextColor = Colors.dark.icon; // Grey text for description

  return (
    <ThemedView style={[styles.container, { backgroundColor: backgroundColor }]}>
      <Ionicons name="wallet-outline" size={56} color={iconColor} style={styles.headerIcon} />
      <ThemedText type="title" style={[styles.title, { color: titleTextColor }]}>
        Setup Your Wallet
      </ThemedText>
      <ThemedText style={[styles.subtitle, { color: descriptionTextColor }]}>
        Get started by creating or importing a wallet.
      </ThemedText>

      {/* Create New Wallet Box */}
      <TouchableOpacity
        style={[styles.optionBox, { backgroundColor: boxBackgroundColor }]}
        onPress={handleCreateWallet}
        activeOpacity={0.8} // Slightly more feedback on press
      >
        <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
           <Ionicons name="add-outline" size={24} color={iconColor} />
        </View>
        <View style={styles.optionTextContainer}>
          <ThemedText style={[styles.optionTitle, { color: titleTextColor }]}>
            Create New Wallet
          </ThemedText>
          <ThemedText style={[styles.optionDescription, { color: descriptionTextColor }]}>
            Start fresh with a secure new wallet.
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward-outline" size={20} color={descriptionTextColor} />
      </TouchableOpacity>

      {/* Import Existing Wallet Box */}
      <TouchableOpacity
        style={[styles.optionBox, { backgroundColor: boxBackgroundColor }]}
        onPress={handleImportWallet}
        activeOpacity={0.8}
      >
         <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
           <Ionicons name="download-outline" size={24} color={iconColor} />
         </View>
        <View style={styles.optionTextContainer}>
          <ThemedText style={[styles.optionTitle, { color: titleTextColor }]}>
            Import Existing Wallet
          </ThemedText>
          <ThemedText style={[styles.optionDescription, { color: descriptionTextColor }]}>
            Use your recovery phrase or private key.
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward-outline" size={20} color={descriptionTextColor} />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20, // Adjusted padding
  },
  headerIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28, // Slightly smaller title
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 45, // Adjusted spacing
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
  },
  optionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12, // Slightly less rounded
    marginBottom: 16, // Closer boxes
    // Removed border for a flatter look like the image
  },
  iconContainer: {
     width: 44, // Circle container for icon
     height: 44,
     borderRadius: 22, // Make it a circle
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: 16, // Space between icon circle and text
  },
  optionTextContainer: {
    flex: 1, // Take remaining space
  },
  optionTitle: {
    fontSize: 17, // Adjusted font size
    fontWeight: '500', // Medium weight
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
  },
});