// app/(tabs)/account.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useWallet } from '@/context/wallet-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

interface AccountItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  rightComponent?: React.ReactNode;
  showChevron?: boolean;
}

const AccountItem = ({
  icon,
  title,
  subtitle,
  onPress,
  rightComponent,
  showChevron = true,
}: AccountItemProps) => (
  <TouchableOpacity
    style={styles.accountItem}
    onPress={onPress}
    activeOpacity={0.7}>
    <View style={styles.accountItemLeft}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={icon as any}
          size={22}
          color={Colors.dark.tint}
        />
      </View>
      <View style={styles.accountItemText}>
        <ThemedText style={styles.accountItemTitle}>{title}</ThemedText>
        {subtitle && (
          <ThemedText style={styles.accountItemSubtitle}>{subtitle}</ThemedText>
        )}
      </View>
    </View>
    <View style={styles.accountItemRight}>
      {rightComponent}
      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.dark.icon}
          style={styles.chevron}
        />
      )}
    </View>
  </TouchableOpacity>
);

export default function AccountScreen() {
  const router = useRouter();
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
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Balance</ThemedText>
          <View style={styles.balanceCard}>
            {isLoading ? (
              <ActivityIndicator size="large" color={Colors.dark.tint} style={styles.loader} />
            ) : (
              <>
                <ThemedText style={styles.balanceAmount}>{displayUsdValue}</ThemedText>
                <ThemedText style={styles.balanceCrypto}>
                  {displayBalance} ETH
                </ThemedText>
                {ethPrice && (
                  <View style={styles.balancePriceContainer}>
                    <ThemedText style={styles.balancePrice}>
                      1 ETH = ${ethPrice.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </ThemedText>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Wallet Address Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Wallet</ThemedText>
          <View style={styles.sectionContent}>
            <AccountItem
              icon="key"
              title="Wallet Address"
              subtitle={address ? formatAddress(address) : 'No address available'}
              onPress={handleCopyAddress}
              rightComponent={
                <TouchableOpacity
                  onPress={handleCopyAddress}
                  style={styles.copyButtonSmall}
                  activeOpacity={0.7}>
                  <Ionicons
                    name={copied ? 'checkmark-circle' : 'copy-outline'}
                    size={20}
                    color={copied ? '#00FF88' : Colors.dark.tint}
                  />
                </TouchableOpacity>
              }
              showChevron={false}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.sectionContent}>
            <AccountItem
              icon="people"
              title="Manage Accounts"
              subtitle="Add, switch, or remove accounts"
              onPress={() => router.push('/manage-accounts')}
            />
            <AccountItem
              icon="copy"
              title="Copy Address"
              subtitle="Copy your wallet address to clipboard"
              onPress={handleCopyAddress}
            />
            <AccountItem
              icon="share"
              title="Share Address"
              subtitle="Share your wallet address"
              onPress={handleShareAddress}
            />
            <AccountItem
              icon="open-outline"
              title="View on Explorer"
              subtitle="Open on Etherscan"
              onPress={handleViewOnExplorer}
            />
            <AccountItem
              icon="qr-code"
              title="QR Code"
              subtitle="Show wallet QR code"
              onPress={() => {
                Alert.alert('QR Code', 'This feature will be available soon.');
              }}
            />
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account Information</ThemedText>
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <ThemedText style={styles.infoLabel}>Network</ThemedText>
              </View>
              <ThemedText style={styles.infoValue}>Sepolia Testnet</ThemedText>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <ThemedText style={styles.infoLabel}>Account Type</ThemedText>
              </View>
              <ThemedText style={styles.infoValue}>Standard</ThemedText>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <ThemedText style={styles.infoLabel}>Address Format</ThemedText>
              </View>
              <ThemedText style={styles.infoValue}>Ethereum (EIP-55)</ThemedText>
            </View>
          </View>
        </View>

        {/* Security Note */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <View style={styles.securityNote}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.dark.tint} />
              <ThemedText style={styles.securityNoteText}>
                Your wallet is secured with PIN and biometric authentication
              </ThemedText>
            </View>
          </View>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  balanceCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 16,
    letterSpacing: -0.5,
    lineHeight: 50,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  balanceCrypto: {
    fontSize: 20,
    color: Colors.dark.tint,
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 26,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  balancePriceContainer: {
    width: '100%',
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balancePrice: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    includeFontPadding: false,
    textAlignVertical: 'center',
    paddingVertical: 4,
  },
  loader: {
    marginVertical: 20,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  accountItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountItemText: {
    flex: 1,
  },
  accountItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  accountItemSubtitle: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  accountItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: 8,
  },
  copyButtonSmall: {
    padding: 4,
    marginRight: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoRowLeft: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 15,
    color: '#999',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginLeft: 16,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  securityNoteText: {
    fontSize: 13,
    color: '#00FF88',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
});
