// app/crypto-detail.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useWallet } from '@/context/wallet-context';
import {
    fetchCryptoPrice,
    fetchPriceHistory,
    getCoinGeckoId,
    type PriceHistoryPoint,
} from '@/services/crypto-price-service';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

type TimeRange = '1D' | '7D' | '30D' | '90D' | '1Y';

const CHART_HEIGHT = 350;
const CHART_WIDTH = Dimensions.get('window').width - 40;

// Helper function to format prices with proper commas and decimals
const formatPrice = (price: number, decimals: number = 2): string => {
  if (price === 0 || !price) return '0.00';
  
  // For very large numbers, use fewer decimals
  if (price >= 1000) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  }
  
  // For smaller numbers, use more decimals
  return price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// Icon mapping for cryptocurrencies
const CRYPTO_ICONS: Record<string, string> = {
  BTC: 'logo-bitcoin',
  ETH: 'diamond-outline',
  USDT: 'cash-outline',
  USDC: 'cash-outline',
  BNB: 'logo-firebase',
  SOL: 'sunny-outline',
  XRP: 'flash-outline',
  ADA: 'diamond-outline',
  DOGE: 'paw-outline',
  MATIC: 'apps-outline',
};

export default function CryptoDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const symbol = (params.symbol as string) || 'ETH';
  const { balance, address, getCryptoPrice } = useWallet();
  
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7D');
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  const [marketCap, setMarketCap] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [cryptoName, setCryptoName] = useState(symbol);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadPriceData = useCallback(async () => {
    // Prevent duplicate requests
    if (isLoadingRef.current) {
      console.log('Request already in progress, skipping...');
      return;
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const coinId = getCoinGeckoId(symbol);
      console.log(`Fetching data for ${symbol} (${coinId})`);
      
      const daysMap: Record<TimeRange, number> = {
        '1D': 1,
        '7D': 7,
        '30D': 30,
        '90D': 90,
        '1Y': 365,
      };

      const [price, history] = await Promise.all([
        fetchCryptoPrice(coinId),
        fetchPriceHistory(coinId, daysMap[selectedRange]),
      ]);

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.log(`Price data:`, price);
      console.log(`History data length:`, history.length);

      if (price) {
        setCurrentPrice(price.current_price);
        setPriceChange24h(price.price_change_percentage_24h || 0);
        setCryptoName(price.name);
        setMarketCap(price.market_cap || 0);
      }
      
      if (history && history.length > 0) {
        console.log(`Setting price history with ${history.length} points`);
        setPriceHistory(history);
        setError(null);
      } else {
        console.warn('No price history data received');
        setPriceHistory([]);
        setError('Unable to load chart data. The API may be rate limited. Please wait a moment and try again.');
      }
    } catch (error: any) {
      // Don't set error if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('Error loading price data:', error);
      setPriceHistory([]);
      
      if (error?.message?.includes('429') || error?.message?.includes('rate limit')) {
        setError('API rate limit reached. Please wait a moment and try again.');
      } else {
        setError('Failed to load price data. Please check your connection and try again.');
      }
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [symbol, selectedRange]);

  useEffect(() => {
    loadPriceData();

    // Cleanup: abort request if component unmounts or dependencies change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isLoadingRef.current = false;
    };
  }, [loadPriceData]);

  const chartData = React.useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) {
      console.log('No price history available for chart');
      return null;
    }

    const prices = priceHistory.map((point) => point.price).filter((p) => p && p > 0);
    
    if (prices.length === 0) {
      console.log('No valid prices found');
      return null;
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const padding = priceRange * 0.1;

    const normalizedPrices = prices.map(
      (price) => (price - minPrice + padding) / (priceRange + padding * 2),
    );

    const points = normalizedPrices.map((y, index) => {
      const x = (index / (normalizedPrices.length - 1)) * CHART_WIDTH;
      const yPos = CHART_HEIGHT - y * CHART_HEIGHT;
      return { x, y: yPos, price: prices[index] };
    });

    console.log(`Chart data generated with ${points.length} points`);
    return {
      points,
      minPrice,
      maxPrice,
      priceRange,
    };
  }, [priceHistory]);

  const renderChart = () => {
    if (isLoading) {
      return (
        <View style={styles.chartPlaceholder}>
          <ActivityIndicator size="large" color={Colors.dark.tint} />
          <ThemedText style={styles.placeholderText}>Loading chart...</ThemedText>
        </View>
      );
    }

    if (!chartData || !chartData.points || chartData.points.length === 0) {
      return (
        <View style={styles.chartPlaceholder}>
          <Ionicons name="bar-chart-outline" size={48} color={Colors.dark.icon} />
          <ThemedText style={styles.placeholderText}>
            {error || 'No chart data available'}
          </ThemedText>
          {!error && (
            <ThemedText style={[styles.placeholderText, { fontSize: 12, marginTop: 8 }]}>
              Try selecting a different time range
            </ThemedText>
          )}
          {error && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadPriceData}
            >
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    const isPositive = priceChange24h >= 0;
    const gradientColors: string[] = isPositive
      ? ['rgba(0, 255, 136, 0.3)', 'rgba(0, 255, 136, 0.05)', 'transparent']
      : ['rgba(255, 68, 68, 0.3)', 'rgba(255, 68, 68, 0.05)', 'transparent'];

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartBackground}>
          {/* Gradient background for area under curve */}
          <LinearGradient
            colors={gradientColors as any}
            style={styles.chartGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          {/* Grid lines */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.gridLine,
                {
                  top: (i * CHART_HEIGHT) / 5,
                },
              ]}
            />
          ))}

          {/* Vertical grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={`v-${i}`}
              style={[
                styles.verticalGridLine,
                {
                  left: (i * CHART_WIDTH) / 4,
                },
              ]}
            />
          ))}

          {/* Price labels on the right */}
          <View style={styles.priceLabels}>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const price =
                chartData.maxPrice - (i / 5) * chartData.priceRange;
              return (
                <ThemedText key={i} style={styles.priceLabelText}>
                  ${formatPrice(price, price > 1000 ? 0 : 2)}
                </ThemedText>
              );
            })}
          </View>

          {/* Chart Line with smoother rendering */}
          <View style={styles.chartLineContainer}>
            {chartData.points.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = chartData.points[index - 1];
              const distance = Math.sqrt(
                Math.pow(point.x - prevPoint.x, 2) +
                  Math.pow(point.y - prevPoint.y, 2),
              );
              
              // Skip if distance is too small
              if (distance < 0.5) return null;
              
              const angle =
                Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) *
                (180 / Math.PI);

              return (
                <View
                  key={`line-${index}`}
                  style={[
                    styles.chartLineSegment,
                    {
                      left: prevPoint.x,
                      top: prevPoint.y - 2,
                      width: distance,
                      transform: [{ rotate: `${angle}deg` }],
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Current price indicator with pulse effect */}
          {chartData.points.length > 0 && (
            <>
              <View
                style={[
                  styles.currentPriceDotPulse,
                  {
                    left: chartData.points[chartData.points.length - 1].x - 8,
                    top: chartData.points[chartData.points.length - 1].y - 8,
                  },
                ]}
              />
              <View
                style={[
                  styles.currentPriceDot,
                  {
                    left: chartData.points[chartData.points.length - 1].x - 6,
                    top: chartData.points[chartData.points.length - 1].y - 6,
                  },
                ]}
              />
            </>
          )}
        </View>

        {/* Chart stats below */}
        <View style={styles.chartStats}>
          <View style={styles.chartStatItem}>
            <ThemedText style={styles.chartStatLabel}>24h Low</ThemedText>
            <ThemedText style={styles.chartStatValue}>
              ${formatPrice(chartData.minPrice, 2)}
            </ThemedText>
          </View>
          <View style={styles.chartStatItem}>
            <ThemedText style={styles.chartStatLabel}>24h High</ThemedText>
            <ThemedText style={styles.chartStatValue}>
              ${formatPrice(chartData.maxPrice, 2)}
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  const isPositive = priceChange24h >= 0;
  const tokenBalance = symbol === 'ETH' ? parseFloat(balance || '0') : 0;
  const totalValue = tokenBalance * currentPrice;
  const iconName = CRYPTO_ICONS[symbol] || 'diamond-outline';

  return (
    <ThemedView style={styles.container}>
      {/* Enhanced Header with gradient */}
      <LinearGradient
        colors={['#0A0A0A', '#121212']}
        style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <View style={styles.cryptoIconContainer}>
              <Ionicons name={iconName as any} size={28} color={Colors.dark.tint} />
            </View>
            <View>
              <ThemedText style={styles.headerTitle}>{cryptoName}</ThemedText>
              <ThemedText style={styles.headerSymbol}>{symbol}</ThemedText>
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={Colors.dark.icon} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Price Section with better styling */}
        <View style={styles.priceSection}>
          {isLoading ? (
            <View style={styles.priceLoadingContainer}>
              <ActivityIndicator size="large" color={Colors.dark.tint} />
            </View>
          ) : (
            <>
              <ThemedText style={styles.currentPriceText}>
                ${formatPrice(currentPrice, currentPrice < 1 ? 4 : 2)}
              </ThemedText>
              <View style={styles.priceChangeContainer}>
                <View
                  style={[
                    styles.priceChangeBadge,
                    isPositive ? styles.positiveBadge : styles.negativeBadge,
                  ]}>
                  <Ionicons
                    name={isPositive ? 'trending-up' : 'trending-down'}
                    size={16}
                    color={isPositive ? '#00FF88' : '#FF4444'}
                  />
                  <ThemedText
                    style={[
                      styles.priceChangeText,
                      isPositive ? styles.positiveChange : styles.negativeChange,
                    ]}>
                    {isPositive ? '+' : ''}
                    {priceChange24h.toFixed(2)}%
                  </ThemedText>
                </View>
                <ThemedText style={styles.priceChangeLabel}>24h</ThemedText>
              </View>
            </>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="stats-chart-outline" size={20} color={Colors.dark.tint} />
            <ThemedText style={styles.statLabel}>Market Cap</ThemedText>
            <ThemedText style={styles.statValue}>
              ${marketCap > 0
                ? formatPrice(marketCap / 1e9, 2) + 'B'
                : 'N/A'}
            </ThemedText>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="wallet-outline" size={20} color={Colors.dark.tint} />
            <ThemedText style={styles.statLabel}>Your Balance</ThemedText>
            <ThemedText style={styles.statValue}>
              {tokenBalance > 0
                ? `${tokenBalance.toFixed(4)} ${symbol}`
                : `0.00 ${symbol}`}
            </ThemedText>
            {tokenBalance > 0 && (
              <ThemedText style={styles.statSubValue}>
                ${formatPrice(totalValue, 2)}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {(['1D', '7D', '30D', '90D', '1Y'] as TimeRange[]).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                selectedRange === range && styles.timeRangeButtonActive,
              ]}
              onPress={() => setSelectedRange(range)}>
              <ThemedText
                style={[
                  styles.timeRangeText,
                  selectedRange === range && styles.timeRangeTextActive,
                ]}>
                {range}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Enhanced Chart */}
        <View style={styles.chartSection}>
          {renderChart()}
        </View>

        {/* Trading Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.buyButton]}
            onPress={() => {
              Alert.alert(
                'Buy Crypto',
                `Buy ${symbol} with fiat currency\n\nThis will integrate with on-ramp providers to allow purchasing ${symbol} directly in the app.\n\nFeatures:\n• Credit card support\n• Bank transfers\n• Instant deposits\n\nComing soon!`,
                [{ text: 'OK' }],
              );
            }}
            activeOpacity={0.8}>
            <Ionicons name="arrow-down-circle" size={24} color="#000" />
            <ThemedText style={styles.buyButtonText}>Buy</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.sellButton]}
            onPress={() => {
              Alert.alert(
                'Sell Crypto',
                `Sell ${symbol} for fiat currency\n\nThis will integrate with off-ramp providers to allow selling ${symbol} and receiving cash.\n\nFeatures:\n• Bank account transfers\n• Instant cash out\n• Low fees\n\nComing soon!`,
                [{ text: 'OK' }],
              );
            }}
            activeOpacity={0.8}>
            <Ionicons name="arrow-up-circle" size={24} color="#000" />
            <ThemedText style={styles.sellButtonText}>Sell</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.swapButton]}
            onPress={() => {
              Alert.alert(
                'Swap Crypto',
                `Swap ${symbol} for other tokens\n\nThis will use DEX (Decentralized Exchange) integration to swap ${symbol} for other cryptocurrencies.\n\nFeatures:\n• Uniswap/1inch integration\n• Best rate routing\n• Low slippage\n• Gas optimization\n\nComing soon!`,
                [
                  { text: 'OK' },
                  {
                    text: 'Learn More',
                    onPress: () => {
                      Alert.alert(
                        'About Swaps',
                        'Token swaps use decentralized exchanges (DEXs) like Uniswap to exchange one cryptocurrency for another. No account needed - swaps happen directly from your wallet.',
                      );
                    },
                  },
                ],
              );
            }}
            activeOpacity={0.8}>
            <Ionicons name="swap-horizontal" size={24} color={Colors.dark.tint} />
            <ThemedText style={styles.swapButtonText}>Swap</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#1B1B1E',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginLeft: 12,
  },
  cryptoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1B1B1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2D',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSymbol: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  priceSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    marginTop: 20,
    marginBottom: 24,
  },
  priceLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  currentPriceText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginTop: 8,
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 60,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  priceChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  priceChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 12,
    gap: 8,
    minWidth: 100,
    minHeight: 40,
    justifyContent: 'center',
  },
  positiveBadge: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  negativeBadge: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  priceChangeText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    lineHeight: 22,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  positiveChange: {
    color: '#00FF88',
  },
  negativeChange: {
    color: '#FF4444',
  },
  priceChangeLabel: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#242426',
  },
  statLabel: {
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: 8,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statSubValue: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1B1B1E',
    borderWidth: 1,
    borderColor: '#2A2A2D',
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: Colors.dark.tint,
    borderColor: Colors.dark.tint,
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A0A0',
  },
  timeRangeTextActive: {
    color: '#000000',
  },
  chartSection: {
    marginBottom: 20,
  },
  chartContainer: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  chartBackground: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    backgroundColor: '#121212',
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#242426',
  },
  chartGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#2A2A2D',
    opacity: 0.3,
  },
  verticalGridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#2A2A2D',
    opacity: 0.2,
  },
  priceLabels: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  priceLabelText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  chartLineContainer: {
    position: 'absolute',
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    zIndex: 2,
  },
  chartLineSegment: {
    position: 'absolute',
    height: 4,
    backgroundColor: Colors.dark.tint,
    transformOrigin: 'left center',
    shadowColor: Colors.dark.tint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 3,
  },
  currentPriceDotPulse: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.dark.tint,
    opacity: 0.3,
    zIndex: 3,
  },
  currentPriceDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.dark.tint,
    borderWidth: 3,
    borderColor: '#000',
    shadowColor: Colors.dark.tint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 4,
  },
  chartStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#242426',
  },
  chartStatItem: {
    alignItems: 'center',
  },
  chartStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  chartStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  chartPlaceholder: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#242426',
  },
  placeholderText: {
    color: '#A0A0A0',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.dark.tint,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buyButton: {
    backgroundColor: '#00FF88',
  },
  sellButton: {
    backgroundColor: '#FF4444',
  },
  swapButton: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1.5,
    borderColor: Colors.dark.tint,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  sellButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  swapButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.tint,
  },
});
