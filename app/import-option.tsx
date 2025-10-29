// app/import-options.tsx
import React from 'react';
import { StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

export default function ImportOptionsScreen() {
  const router = useRouter();

  // Navigate specifically based on the chosen method
  const handleImportPhrase = () => {
    router.push('/import-phrase'); // Navigate to the phrase input screen
  };

  const handleImportKey = () => {
    router.push('/import-key'); // Navigate to the private key input screen
  };

  const handleGoogleDrive = () => {
    Alert.alert("Coming Soon", "Importing from Google Drive is not yet implemented.");
    // Future implementation: Google Sign-in and Drive API logic
  };

  const handleHardwareWallet = () => {
     Alert.alert("Coming Soon", "Connecting hardware wallets is not yet implemented.");
     // Future implementation: Bluetooth/USB connection logic
  };

  // Define colors - forcing dark theme appearance
  const backgroundColor = '#000000';
  const boxBackgroundColor = '#1A1A1A';
  const iconBackgroundColor = '#2C2C2E';
  const iconColor = Colors.dark.tint;
  const titleTextColor = Colors.dark.text;
  const descriptionTextColor = Colors.dark.icon;

  return (
    <ThemedView style={[styles.container, { backgroundColor: backgroundColor }]}>
       <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <Ionicons name="arrow-back" size={24} color={Colors.dark.tint} />
       </TouchableOpacity>

      <Ionicons name="download-outline" size={56} color={iconColor} style={styles.headerIcon} />
      <ThemedText type="title" style={[styles.title, { color: titleTextColor }]}>
        Import Wallet
      </ThemedText>
      <ThemedText style={[styles.subtitle, { color: descriptionTextColor }]}>
        Choose how you want to import your existing wallet.
      </ThemedText>

      {/* Import via Seed Phrase */}
      <TouchableOpacity
        style={[styles.optionBox, { backgroundColor: boxBackgroundColor }]}
        onPress={handleImportPhrase} // Navigate to phrase screen
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
           <Ionicons name="document-text-outline" size={24} color={iconColor} />
        </View>
        <View style={styles.optionTextContainer}>
          <ThemedText style={[styles.optionTitle, { color: titleTextColor }]}>
            Recovery Phrase
          </ThemedText>
          <ThemedText style={[styles.optionDescription, { color: descriptionTextColor }]}>
            Typically 12 or 24 words.
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward-outline" size={20} color={descriptionTextColor} />
      </TouchableOpacity>

      {/* Import via Private Key */}
      <TouchableOpacity
        style={[styles.optionBox, { backgroundColor: boxBackgroundColor }]}
        onPress={handleImportKey} // Navigate to key screen
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
           <Ionicons name="key-outline" size={24} color={iconColor} />
        </View>
        <View style={styles.optionTextContainer}>
          <ThemedText style={[styles.optionTitle, { color: titleTextColor }]}>
            Private Key
          </ThemedText>
          <ThemedText style={[styles.optionDescription, { color: descriptionTextColor }]}>
            Import a single account.
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward-outline" size={20} color={descriptionTextColor} />
      </TouchableOpacity>

       {/* Import via Google Drive (Placeholder) */}
      <TouchableOpacity
        style={[styles.optionBox, { backgroundColor: boxBackgroundColor }]}
        onPress={handleGoogleDrive}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
           <Ionicons name="logo-google" size={24} color={iconColor} />
        </View>
        <View style={styles.optionTextContainer}>
          <ThemedText style={[styles.optionTitle, { color: titleTextColor }]}>
            Google Drive Backup
          </ThemedText>
          <ThemedText style={[styles.optionDescription, { color: descriptionTextColor }]}>
            Restore from cloud backup.
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward-outline" size={20} color={descriptionTextColor} />
      </TouchableOpacity>

       {/* Connect Hardware Wallet (Placeholder) */}
       <TouchableOpacity
        style={[styles.optionBox, { backgroundColor: boxBackgroundColor }]}
        onPress={handleHardwareWallet}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
           <Ionicons name="hardware-chip-outline" size={24} color={iconColor} />
        </View>
        <View style={styles.optionTextContainer}>
          <ThemedText style={[styles.optionTitle, { color: titleTextColor }]}>
            Hardware Wallet
          </ThemedText>
          <ThemedText style={[styles.optionDescription, { color: descriptionTextColor }]}>
            Connect Ledger, Trezor, etc.
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward-outline" size={20} color={descriptionTextColor} />
      </TouchableOpacity>

    </ThemedView>
  );
}

// Styles remain the same as the previous 'import-options.tsx' version
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, backgroundColor: '#000', },
  backButton: { position: 'absolute', top: 50, left: 15, zIndex: 1, padding: 10, },
  headerIcon: { marginBottom: 20, },
  title: { fontSize: 28, marginBottom: 8, textAlign: 'center', },
  subtitle: { marginBottom: 45, textAlign: 'center', fontSize: 16, lineHeight: 22, },
  optionBox: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 16, paddingHorizontal: 16, borderRadius: 12, marginBottom: 16, },
  iconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16, },
  optionTextContainer: { flex: 1, },
  optionTitle: { fontSize: 17, fontWeight: '500', marginBottom: 2, },
  optionDescription: { fontSize: 14, },
});