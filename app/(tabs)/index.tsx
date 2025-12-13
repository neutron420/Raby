// app/(tabs)/index.tsx
import { PriceChart } from '@/components/price-chart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useWallet } from '@/context/wallet-context';
import { Ionicons } from '@expo/vector-icons';
import { ethers } from 'ethers';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Popular cryptocurrencies to display
const POPULAR_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: 'logo-bitcoin', balance: 0 },
  { symbol: 'ETH', name: 'Ethereum', icon: 'diamond-outline', balance: 0 },
  { symbol: 'USDT', name: 'Tether', icon: 'cash-outline', balance: 0 },
  { symbol: 'USDC', name: 'USD Coin', icon: 'cash-outline', balance: 0 },
  { symbol: 'BNB', name: 'Binance Coin', icon: 'logo-firebase', balance: 0 },
  { symbol: 'SOL', name: 'Solana', icon: 'sunny-outline', balance: 0 },
  { symbol: 'XRP', name: 'Ripple', icon: 'flash-outline', balance: 0 },
  { symbol: 'ADA', name: 'Cardano', icon: 'diamond-outline', balance: 0 },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'paw-outline', balance: 0 },
  { symbol: 'MATIC', name: 'Polygon', icon: 'apps-outline', balance: 0 },
];

type WalletTab = 'assets' | 'activity';

export default function WalletScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<WalletTab>('assets');
  const [searchQuery, setSearchQuery] = useState('');

  // Get LIVE data from the context including price data
  const {
    wallet,
    address,
    balance,
    isLoading,
    cryptoPrices,
    cryptoPriceHistory,
    totalUsdValue,
    isPriceLoading,
    fetchWalletData,
    fetchPriceData,
    getCryptoPrice,
    getCryptoPriceHistory,
  } = useWallet();

  // Get ETH price and history for the chart
  const ethPrice = getCryptoPrice('ETH');
  const ethPriceHistory = getCryptoPriceHistory('ETH');

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
        <TouchableOpacity
          onPress={() => router.push('/scan-qr')}
          activeOpacity={0.7}>
          <Ionicons name="scan-outline" size={24} color={Colors.dark.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBalanceSection = () => {
    const displayUsdValue = totalUsdValue > 0 
      ? `$${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '$0.00';

    return (
      <View style={styles.balanceContainer}>
        {/* Show real USD value */}
        <ThemedText style={styles.balanceUsd}>
          {(isLoading || isPriceLoading) && balance === '0.0' ? (
            <ActivityIndicator size="large" color={Colors.dark.text} />
          ) : (
            displayUsdValue
          )}
        </ThemedText>

        {/* Show loading text or formatted balance */}
        <ThemedText style={styles.balanceNative}>
          {isLoading && balance === '0.0'
            ? 'Loading...'
            : `${parseFloat(balance).toFixed(4)} ETH`}
        </ThemedText>

        {/* Show price chart */}
        {ethPrice && ethPriceHistory.length > 0 && ethPrice.current_price && (
          <PriceChart
            data={ethPriceHistory}
            currentPrice={ethPrice.current_price}
            priceChange24h={ethPrice.price_change_percentage_24h || 0}
            isLoading={isPriceLoading}
          />
        )}

        {/* Show live address */}
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
  };

  const handleBuy = () => {
    Alert.alert('Buy Crypto', 'Buy functionality will be implemented soon!', [{ text: 'OK' }]);
  };

  const handleSell = () => {
    Alert.alert('Sell Crypto', 'Sell functionality will be implemented soon!', [{ text: 'OK' }]);
  };

  const handleSwap = () => {
    Alert.alert('Swap Crypto', 'Swap functionality will be implemented soon!', [{ text: 'OK' }]);
  };

  const handleSend = () => {
    router.push('/send');
  };

  const handleReceive = () => {
    if (!address) {
      Alert.alert('Error', 'Wallet address not available');
      return;
    }
    router.push('/receive');
  };

  const renderActionButtons = () => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity style={styles.actionButton} onPress={handleSend}>
        <View style={[styles.actionIconCircle, { backgroundColor: Colors.dark.tint }]}>
          <Ionicons name="arrow-up-outline" size={28} color="#000" />
        </View>
        <ThemedText style={styles.actionText}>Send</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={handleReceive}>
        <View style={[styles.actionIconCircle, { backgroundColor: Colors.dark.tint }]}>
          <Ionicons name="arrow-down-outline" size={28} color="#000" />
        </View>
        <ThemedText style={styles.actionText}>Receive</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={handleBuy}>
        <View style={[styles.actionIconCircle, { backgroundColor: '#2C2C2E' }]}>
          <Ionicons name="card-outline" size={28} color={Colors.dark.tint} />
        </View>
        <ThemedText style={styles.actionText}>Buy</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={handleSwap}>
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
        onPress={() => {
          setActiveTab('assets');
          setSearchQuery(''); // Clear search when switching to assets
        }}>
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
        onPress={() => {
          setActiveTab('activity');
          setSearchQuery(''); // Clear search when switching to activity
        }}>
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

  // Filter cryptocurrencies based on search query
  const filteredCryptos = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_CRYPTOS;
    const query = searchQuery.toLowerCase();
    return POPULAR_CRYPTOS.filter(
      (crypto) =>
        crypto.symbol.toLowerCase().includes(query) ||
        crypto.name.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const renderCryptoAsset = (crypto: typeof POPULAR_CRYPTOS[0]) => {
    const price = getCryptoPrice(crypto.symbol);
    const priceChange = price?.price_change_percentage_24h || 0;
    const isPositive = priceChange >= 0;
    
    // For ETH, use actual balance, for others use 0 (can be expanded later)
    const tokenBalance = crypto.symbol === 'ETH' ? parseFloat(balance || '0') : crypto.balance;
    const currentPrice = price?.current_price || 0;
    const usdValue = currentPrice > 0 && tokenBalance > 0 ? tokenBalance * currentPrice : 0;

    return (
      <TouchableOpacity
        key={crypto.symbol}
        style={styles.assetRow}
        onPress={() => router.push({ pathname: '/crypto-detail', params: { symbol: crypto.symbol } })}>
        <View style={styles.assetIcon}>
          <Ionicons name={crypto.icon as any} size={24} color={Colors.dark.tint} />
        </View>
        <View style={styles.assetName}>
          <ThemedText style={styles.assetSymbol}>{crypto.symbol}</ThemedText>
          <ThemedText style={styles.assetNameText}>{crypto.name}</ThemedText>
          {price && (
            <View style={styles.priceChangeRow}>
              <Ionicons
                name={isPositive ? 'trending-up' : 'trending-down'}
                size={12}
                color={isPositive ? '#00FF88' : '#FF4444'}
                style={styles.trendIcon}
              />
              <ThemedText
                style={[
                  styles.priceChangeText,
                  isPositive ? styles.positiveChange : styles.negativeChange,
                ]}>
                {isPositive ? '+' : ''}
                {priceChange.toFixed(2)}%
              </ThemedText>
            </View>
          )}
        </View>
        <View style={styles.assetBalance}>
          <ThemedText style={styles.assetBalanceUsd}>
            {isPriceLoading && !price
              ? '...'
              : usdValue != null
              ? `$${usdValue.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : '$0.00'}
          </ThemedText>
          <ThemedText style={styles.assetBalanceToken}>
            {tokenBalance > 0
              ? `${tokenBalance.toFixed(crypto.symbol === 'ETH' ? 4 : 2)} ${crypto.symbol}`
              : `0.00 ${crypto.symbol}`}
          </ThemedText>
          {price && price.current_price != null && (
            <ThemedText style={styles.assetPrice}>
              ${price.current_price.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </ThemedText>
          )}
        </View>
      </TouchableOpacity>
    );
  };


  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Fetch transactions when Activity tab is active
  React.useEffect(() => {
    if (activeTab === 'activity' && address && wallet?.provider) {
      fetchTransactions();
    }
  }, [activeTab, address, wallet]);

  const fetchTransactions = async () => {
    if (!address || !wallet?.provider) return;
    
    setIsLoadingTransactions(true);
    try {
      // For now, we'll show a placeholder
      // In production, you'd fetch from Etherscan or your backend
      setTransactions([]);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const renderActivityRow = (tx: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.activityRow}
      onPress={() => {
        Alert.alert('Transaction', `Hash: ${tx.hash}`, [{ text: 'OK' }]);
      }}>
      <View style={styles.activityIconContainer}>
        <Ionicons
          name={tx.direction === 'sent' ? 'arrow-up' : 'arrow-down'}
          size={20}
          color={tx.direction === 'sent' ? '#FF4444' : '#00FF88'}
        />
      </View>
      <View style={styles.activityContent}>
        <ThemedText style={styles.activityType}>
          {tx.direction === 'sent' ? 'Sent' : 'Received'}
        </ThemedText>
        <ThemedText style={styles.activityAddress} numberOfLines={1}>
          {tx.direction === 'sent' ? `To: ${tx.to?.slice(0, 8)}...` : `From: ${tx.from?.slice(0, 8)}...`}
        </ThemedText>
        <ThemedText style={styles.activityTime}>
          {new Date(tx.timestamp).toLocaleDateString()}
        </ThemedText>
      </View>
      <View style={styles.activityAmount}>
        <ThemedText
          style={[
            styles.activityAmountText,
            tx.direction === 'sent' ? styles.activityAmountSent : styles.activityAmountReceived,
          ]}>
          {tx.direction === 'sent' ? '-' : '+'}
          {parseFloat(ethers.utils.formatEther(tx.value || '0')).toFixed(4)} ETH
        </ThemedText>
        <ThemedText style={styles.activityStatus}>
          {tx.status === 'confirmed' ? 'Confirmed' : tx.status === 'pending' ? 'Pending' : 'Failed'}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  const renderActivityContent = () => {
    if (isLoadingTransactions) {
      return (
        <View style={styles.placeholderContainer}>
          <ActivityIndicator size="large" color={Colors.dark.tint} />
          <ThemedText style={styles.placeholderText}>Loading transactions...</ThemedText>
        </View>
      );
    }

    if (transactions.length === 0) {
      return (
        <View style={styles.placeholderContainer}>
          <Ionicons name="receipt-outline" size={48} color={Colors.dark.icon} />
          <ThemedText style={styles.placeholderText}>No transactions yet</ThemedText>
          <ThemedText style={styles.placeholderSubtext}>
            Your transaction history will appear here
          </ThemedText>
        </View>
      );
    }

    return transactions.map((tx, index) => renderActivityRow(tx, index));
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        // NEW: Added pull-to-refresh
        refreshControl={
          <RefreshControl
            refreshing={isLoading || isPriceLoading}
            onRefresh={() => {
              fetchWalletData();
              fetchPriceData();
            }}
            tintColor={Colors.dark.tint} // For iOS
          />
        }>
        {renderHeader()}
        {renderBalanceSection()}
        {renderActionButtons()}
        {renderTabs()}

        {/* Search Bar */}
        {activeTab === 'assets' && (
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={Colors.dark.icon} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search cryptocurrencies..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={Colors.dark.icon} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.listContainer}>
          {activeTab === 'assets' ? (
            <>
              {filteredCryptos.length > 0 ? (
                filteredCryptos.map(renderCryptoAsset)
              ) : (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search-outline" size={48} color={Colors.dark.icon} />
                  <ThemedText style={styles.noResultsText}>No cryptocurrencies found</ThemedText>
                  <ThemedText style={styles.noResultsSubtext}>
                    Try searching with a different term
                  </ThemedText>
                </View>
              )}
            </>
          ) : (
            renderActivityContent()
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
  assetPrice: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  priceChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendIcon: {
    marginRight: 4,
  },
  priceChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  positiveChange: {
    color: '#00FF88',
  },
  negativeChange: {
    color: '#FF4444',
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
  placeholderSubtext: {
    color: '#666',
    fontSize: 13,
    marginTop: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activityAddress: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
  activityAmount: {
    alignItems: 'flex-end',
  },
  activityAmountText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityAmountSent: {
    color: '#FF4444',
  },
  activityAmountReceived: {
    color: '#00FF88',
  },
  activityStatus: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B1B1E',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A2A2D',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noResultsSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
  },
});