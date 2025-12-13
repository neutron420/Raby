// app/(tabs)/account.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useWallet } from '@/context/wallet-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

export default function AccountScreen() {
  const { address, balance, totalUsdValue, isLoading, cryptoPrices } = useWallet();
  const [copied, setCopied] = useState(false);

  const ethPrice = cryptoPrices['ETH'];
  const displayBalance = parseFloat(balance || '0').toFixed(4);
  const displayUsdValue = totalUsdValue > 0
    ? `$${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '$0.00';

  const handleCopyAddress = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (addr: string | null) => {
    if (!addr) return 'No address';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleShareAddress = () => {
    if (!address) return;
    Alert.alert(
      'Share Address',
      `Your wallet address:\n\n${address}`,
      [{ text: 'OK' }],
    );
  };

  const handleViewOnExplorer = () => {
    if (!address) return;
    Alert.alert(
      'View on Explorer',
      'This will open your address on Etherscan. This feature will be available soon.',
      [{ text: 'OK' }],
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#0A0A0A', '#121212']}
        style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={32} color={Colors.dark.tint} />
          </View>
          <ThemedText style={styles.headerTitle}>Account</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Your wallet overview
          </ThemedText>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Ionicons name="wallet" size={20} color={Colors.dark.tint} />
            <ThemedText style={styles.balanceLabel}>Total Balance</ThemedText>
          </View>
          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.dark.tint} style={styles.loader} />
          ) : (
            <>
              <ThemedText style={styles.balanceAmount}>{displayUsdValue}</ThemedText>
              <ThemedText style={styles.balanceCrypto}>
                {displayBalance} ETH
              </ThemedText>
              {ethPrice && (
                <ThemedText style={styles.balancePrice}>
                  1 ETH = ${ethPrice.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </ThemedText>
              )}
            </>
          )}
        </View>

        {/* Address Card */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Wallet Address</ThemedText>
          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <Ionicons name="key" size={18} color={Colors.dark.tint} />
              <ThemedText style={styles.addressLabel}>Your Address</ThemedText>
            </View>
            <View style={styles.addressContainer}>
              <ThemedText style={styles.addressText} numberOfLines={1}>
                {address || 'No address available'}
              </ThemedText>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyAddress}
                activeOpacity={0.7}>
                <Ionicons
                  name={copied ? 'checkmark' : 'copy'}
                  size={18}
                  color={copied ? '#00FF88' : Colors.dark.tint}
                />
                <ThemedText
                  style={[
                    styles.copyButtonText,
                    copied && styles.copyButtonTextActive,
                  ]}>
                  {copied ? 'Copied!' : 'Copy'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleCopyAddress}
              activeOpacity={0.7}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#1C3C2C' }]}>
                <Ionicons name="copy" size={24} color="#00FF88" />
              </View>
              <ThemedText style={styles.actionTitle}>Copy Address</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleShareAddress}
              activeOpacity={0.7}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#2C2C3C' }]}>
                <Ionicons name="share" size={24} color={Colors.dark.tint} />
              </View>
              <ThemedText style={styles.actionTitle}>Share</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleViewOnExplorer}
              activeOpacity={0.7}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#2C3C3C' }]}>
                <Ionicons name="open-outline" size={24} color={Colors.dark.tint} />
              </View>
              <ThemedText style={styles.actionTitle}>Explorer</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => {
                Alert.alert('QR Code', 'This feature will be available soon.');
              }}
              activeOpacity={0.7}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#3C2C2C' }]}>
                <Ionicons name="qr-code" size={24} color={Colors.dark.tint} />
              </View>
              <ThemedText style={styles.actionTitle}>QR Code</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account Information</ThemedText>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Network</ThemedText>
              <ThemedText style={styles.infoValue}>Sepolia Testnet</ThemedText>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Account Type</ThemedText>
              <ThemedText style={styles.infoValue}>Standard</ThemedText>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Address Format</ThemedText>
              <ThemedText style={styles.infoValue}>Ethereum (EIP-55)</ThemedText>
            </View>
          </View>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.dark.tint} />
          <ThemedText style={styles.securityNoteText}>
            Your wallet is secured with PIN and biometric authentication
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.dark.tint,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  balanceCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#999',
    marginLeft: 8,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  balanceCrypto: {
    fontSize: 18,
    color: Colors.dark.tint,
    fontWeight: '600',
    marginBottom: 4,
  },
  balancePrice: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
  loader: {
    marginVertical: 20,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  addressCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 13,
    color: '#999',
    marginLeft: 8,
    fontWeight: '500',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'monospace',
    flex: 1,
    marginRight: 12,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 13,
    color: Colors.dark.tint,
    fontWeight: '600',
    marginLeft: 6,
  },
  copyButtonTextActive: {
    color: '#00FF88',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    margin: 6,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#2C2C2E',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C2C1C',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#2C3C2C',
  },
  securityNoteText: {
    fontSize: 13,
    color: '#00FF88',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
});
