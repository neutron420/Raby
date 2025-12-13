// app/eth-detail.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useWallet } from '@/context/wallet-context';
import {
  fetchCryptoPrice,
  fetchPriceHistory,
  getCoinGeckoId,
  type PriceHistoryPoint,
} from '@/services/crypto-price-service';

type TimeRange = '1D' | '7D' | '30D' | '90D' | '1Y';

const CHART_HEIGHT = 300;
const CHART_WIDTH = Dimensions.get('window').width - 40;

export default function EthDetailScreen() {
  const router = useRouter();
  const { balance, address } = useWallet();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7D');
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPriceData();
  }, [selectedRange]);

  const loadPriceData = async () => {
    setIsLoading(true);
    try {
      const coinId = getCoinGeckoId('ETH');
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

      if (price) {
        setCurrentPrice(price.current_price);
        setPriceChange24h(price.price_change_percentage_24h);
      }
      if (history.length > 0) {
        setPriceHistory(history);
      }
    } catch (error) {
      console.error('Error loading price data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = React.useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) return null;

    const prices = priceHistory.map((point) => point.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const padding = priceRange * 0.15;

    const normalizedPrices = prices.map(
      (price) => (price - minPrice + padding) / (priceRange + padding * 2),
    );

    const points = normalizedPrices.map((y, index) => {
      const x = (index / (normalizedPrices.length - 1)) * CHART_WIDTH;
      const yPos = CHART_HEIGHT - y * CHART_HEIGHT;
      return { x, y: yPos };
    });

    return {
      points,
      minPrice,
      maxPrice,
      priceRange,
    };
  }, [priceHistory]);

  const renderChart = () => {
    if (isLoading || !chartData) {
      return (
        <View style={styles.chartPlaceholder}>
          <ActivityIndicator size="large" color={Colors.dark.tint} />
          <ThemedText style={styles.placeholderText}>Loading chart...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartBackground}>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.gridLine,
                {
                  top: (i * CHART_HEIGHT) / 4,
                },
              ]}
            />
          ))}

          {/* Price labels */}
          <View style={styles.priceLabels}>
            {[0, 1, 2, 3, 4].map((i) => {
              const price =
                chartData.maxPrice - (i / 4) * chartData.priceRange;
              return (
                <ThemedText key={i} style={styles.priceLabelText}>
                  ${price.toFixed(0)}
                </ThemedText>
              );
            })}
          </View>

          {/* Chart Line */}
          <View style={styles.chartLineContainer}>
            {chartData.points.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = chartData.points[index - 1];
              const distance = Math.sqrt(
                Math.pow(point.x - prevPoint.x, 2) +
                  Math.pow(point.y - prevPoint.y, 2),
              );
              const angle =
                Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) *
                (180 / Math.PI);

              return (
                <View
                  key={index}
                  style={[
                    styles.chartLineSegment,
                    {
                      left: prevPoint.x,
                      top: prevPoint.y - 1.5,
                      width: distance,
                      transform: [{ rotate: `${angle}deg` }],
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Current price indicator */}
          {chartData.points.length > 0 && (
            <View
              style={[
                styles.currentPriceDot,
                {
                  left: chartData.points[chartData.points.length - 1].x - 5,
                  top: chartData.points[chartData.points.length - 1].y - 5,
                },
              ]}
            />
          )}
        </View>
      </View>
    );
  };

  const isPositive = priceChange24h >= 0;
  const ethBalance = parseFloat(balance || '0');
  const totalValue = ethBalance * currentPrice;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Ethereum (ETH)</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Price Section */}
        <View style={styles.priceSection}>
          <ThemedText style={styles.currentPriceText}>
            ${currentPrice.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </ThemedText>
          <View style={styles.priceChangeRow}>
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
              {priceChange24h.toFixed(2)}% (24h)
            </ThemedText>
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

        {/* Chart */}
        {renderChart()}

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statLabel}>Your Balance</ThemedText>
            <ThemedText style={styles.statValue}>
              {ethBalance.toFixed(4)} ETH
            </ThemedText>
            <ThemedText style={styles.statSubValue}>
              ${totalValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </ThemedText>
          </View>
        </View>

        {/* Trading Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.buyButton]}>
            <Ionicons name="arrow-down-circle" size={24} color="#000" />
            <ThemedText style={styles.buyButtonText}>Buy</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.sellButton]}>
            <Ionicons name="arrow-up-circle" size={24} color="#000" />
            <ThemedText style={styles.sellButtonText}>Sell</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.swapButton]}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  priceSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  currentPriceText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  priceChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceChangeText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  positiveChange: {
    color: '#00FF88',
  },
  negativeChange: {
    color: '#FF4444',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1B1B1E',
    borderWidth: 1,
    borderColor: '#2A2A2D',
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
  chartContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  chartBackground: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    backgroundColor: '#121212',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#242426',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#2A2A2D',
    opacity: 0.5,
  },
  priceLabels: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabelText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  chartLineContainer: {
    position: 'absolute',
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
  },
  chartLineSegment: {
    position: 'absolute',
    height: 3,
    backgroundColor: Colors.dark.tint,
    transformOrigin: 'left center',
    shadowColor: Colors.dark.tint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  currentPriceDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.dark.tint,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: Colors.dark.tint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  chartPlaceholder: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#242426',
  },
  placeholderText: {
    color: '#A0A0A0',
    fontSize: 14,
    marginTop: 12,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#242426',
  },
  statLabel: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statSubValue: {
    fontSize: 16,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  buyButton: {
    backgroundColor: '#00FF88',
  },
  sellButton: {
    backgroundColor: '#FF4444',
  },
  swapButton: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
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

