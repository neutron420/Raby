// app/(tabs)/index.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  View,
  Alert,
  ActivityIndicator, // UPDATED: Import ActivityIndicator
  RefreshControl, // UPDATED: Import RefreshControl
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useWallet } from '@/context/wallet-context'; // UPDATED: Import the hook

// --- Dummy Data (Only for non-native assets) ---
const DUMMY_ASSETS = [
  // The native asset (ETH) will be handled by our context
  {
    symbol: 'RBY',
    name: 'Raby Token',
    balanceToken: '1,250',
    balanceUsd: '0.00',
    icon: 'aperture-outline', // Using Ionicons as placeholder
  },
];
// --- End Dummy Data ---

type WalletTab = 'assets' | 'activity';

export default function WalletScreen() {
  const [activeTab, setActiveTab] = useState<WalletTab>('assets');

  // UPDATED: Get LIVE data from the context
  const { address, balance, isLoading, fetchWalletData } = useWallet();

  const handleCopyAddress = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Address Copied!', address);
  };

  // --- Render Functions for UI components ---

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.accountSelector}>
        <Ionicons name="person-circle-outline" size={24} color={Colors.dark.icon} />
        <ThemedText style={styles.accountName}>Account 1</ThemedText>
        <Ionicons name="chevron-down-outline" size={16} color={Colors.dark.icon} />
      </View>
      <View style={styles.headerIcons}>
        <TouchableOpacity>
          <Ionicons name="scan-outline" size={24} color={Colors.dark.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBalanceSection = () => (
    <View style={styles.balanceContainer}>
      {/* UPDATED: Show loading indicator or USD value */}
      <ThemedText style={styles.balanceUsd}>
        {isLoading && balance === '0.0' ? (
          <ActivityIndicator size="large" color={Colors.dark.text} />
        ) : (
          '$0.00' // Note: Real USD balance requires a price API
        )}
      </ThemedText>

      {/* UPDATED: Show loading text or formatted balance */}
      <ThemedText style={styles.balanceNative}>
        {isLoading && balance === '0.0'
          ? 'Loading...'
          : `${parseFloat(balance).toFixed(4)} ETH`}
      </ThemedText>

      {/* UPDATED: Show live address */}
      <TouchableOpacity
        style={styles.addressBox}
        onPress={handleCopyAddress}
        activeOpacity={0.7}
        disabled={!address}>
        <ThemedText style={styles.addressText}>
          {address
            ? `${address.slice(0, 6)}...${address.slice(-4)}`
            : 'No Address Found'}
        </ThemedText>
        <Ionicons name="copy-outline" size={16} color={Colors.dark.icon} />
      </TouchableOpacity>
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity style={styles.actionButton}>
        <View style={[styles.actionIconCircle, { backgroundColor: Colors.dark.tint }]}>
          <Ionicons name="arrow-up-outline" size={28} color="#000" />
        </View>
        <ThemedText style={styles.actionText}>Send</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton}>
        <View style={[styles.actionIconCircle, { backgroundColor: Colors.dark.tint }]}>
          <Ionicons name="arrow-down-outline" size={28} color="#000" />
        </View>
        <ThemedText style={styles.actionText}>Receive</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton}>
        <View style={[styles.actionIconCircle, { backgroundColor: '#2C2C2E' }]}>
          <Ionicons name="card-outline" size={28} color={Colors.dark.tint} />
        </View>
        <ThemedText style={styles.actionText}>Buy</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton}>
        <View style={[styles.actionIconCircle, { backgroundColor: '#2C2C2E' }]}>
          <Ionicons name="swap-horizontal-outline" size={28} color={Colors.dark.tint} />
        </View>
        <ThemedText style={styles.actionText}>Swap</ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={styles.tab}
        onPress={() => setActiveTab('assets')}>
        <ThemedText
          style={[
            styles.tabText,
            activeTab === 'assets' && styles.tabTextActive,
          ]}>
          Assets
        </ThemedText>
        {activeTab === 'assets' && <View style={styles.tabIndicator} />}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tab}
        onPress={() => setActiveTab('activity')}>
        <ThemedText
          style={[
            styles.tabText,
            activeTab === 'activity' && styles.tabTextActive,
          ]}>
          Activity
        </ThemedText>
        {activeTab === 'activity' && <View style={styles.tabIndicator} />}
      </TouchableOpacity>
    </View>
  );

  // UPDATED: This function now renders the native asset with live data
  const renderNativeAsset = () => (
    <TouchableOpacity key="ETH" style={styles.assetRow}>
      <View style={styles.assetIcon}>
        {/* UPDATED: Fixed icon name */}
        <Ionicons name="logo-ethereum" size={24} color={Colors.dark.tint} />
      </View>
      <View style={styles.assetName}>
        <ThemedText style={styles.assetSymbol}>ETH</ThemedText>
        <ThemedText style={styles.assetNameText}>Ethereum</ThemedText>
      </View>
      <View style={styles.assetBalance}>
        <ThemedText style={styles.assetBalanceUsd}>$0.00</ThemedText>
        <ThemedText style={styles.assetBalanceToken}>
          {isLoading
            ? '...'
            : `${parseFloat(balance).toFixed(4)} ETH`}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  const renderAssetRow = (asset: (typeof DUMMY_ASSETS)[0]) => (
    <TouchableOpacity key={asset.symbol} style={styles.assetRow}>
      <View style={styles.assetIcon}>
        <Ionicons name={asset.icon as any} size={24} color={Colors.dark.tint} />
      </View>
      <View style={styles.assetName}>
        <ThemedText style={styles.assetSymbol}>{asset.symbol}</ThemedText>
        <ThemedText style={styles.assetNameText}>{asset.name}</ThemedText>
      </View>
      <View style={styles.assetBalance}>
        <ThemedText style={styles.assetBalanceUsd}>${asset.balanceUsd}</ThemedText>
        <ThemedText style={styles.assetBalanceToken}>
          {asset.balanceToken} {asset.symbol}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  const renderActivityRow = () => (
    <View style={styles.placeholderContainer}>
      <Ionicons name="receipt-outline" size={48} color={Colors.dark.icon} />
      <ThemedText style={styles.placeholderText}>
        No transactions yet
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        // NEW: Added pull-to-refresh
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchWalletData}
            tintColor={Colors.dark.tint} // For iOS
          />
        }>
        {renderHeader()}
        {renderBalanceSection()}
        {renderActionButtons()}
        {renderTabs()}

        <View style={styles.listContainer}>
          {activeTab === 'assets' ? (
            <>
              {/* UPDATED: Always render native asset first, then dummy assets */}
              {renderNativeAsset()}
              {DUMMY_ASSETS.map(renderAssetRow)}
            </>
          ) : (
            renderActivityRow()
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    paddingBottom: 60,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  accountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B1B1E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2A2D',
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
    color: '#fff',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  balanceContainer: {
    alignItems: 'center',
    marginVertical: 30,
    justifyContent: 'center',
  },
  balanceUsd: {
    fontSize: 44,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    lineHeight: 52, // UPDATED: This fixes the "half-cut" text
  },
  balanceNative: {
    fontSize: 16,
    color: '#A0A0A0',
    marginTop: 4,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B1B1E',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2A2A2D',
  },
  addressText: {
    fontSize: 14,
    color: '#EAEAEA',
    marginRight: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 30,
    paddingHorizontal: 30,
  },
  actionButton: {
    alignItems: 'center',
    width: 70,
  },
  actionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#999',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  tabIndicator: {
    height: 3,
    width: '60%',
    backgroundColor: '#00FFFF',
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
  },
  listContainer: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 25,
    borderTopWidth: 1,
    borderColor: '#1F1F1F',
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 14,
    backgroundColor: '#18181B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242426',
  },
  assetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assetName: {
    flex: 1,
  },
  assetSymbol: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  assetNameText: {
    fontSize: 13,
    color: '#A0A0A0',
    marginTop: 2,
  },
  assetBalance: {
    alignItems: 'flex-end',
  },
  assetBalanceUsd: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  assetBalanceToken: {
    fontSize: 13,
    color: '#A0A0A0',
    marginTop: 2,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  placeholderText: {
    marginTop: 16,
    fontSize: 15,
    color: '#888',
  },
});