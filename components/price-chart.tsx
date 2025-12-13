// components/price-chart.tsx
import { Colors } from '@/constants/theme';
import type { PriceHistoryPoint } from '@/services/crypto-price-service';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';

interface PriceChartProps {
  data: PriceHistoryPoint[];
  currentPrice: number;
  priceChange24h: number;
  isLoading?: boolean;
}

const screenWidth = Dimensions.get('window').width;
const CHART_HEIGHT = 200;
const CHART_WIDTH = screenWidth - 60;

export function PriceChart({
  data,
  currentPrice,
  priceChange24h,
  isLoading,
}: PriceChartProps) {
  const router = useRouter();
  
  // Navigate to ETH detail (can be made generic later)
  const handlePress = () => {
    router.push({ pathname: '/crypto-detail', params: { symbol: 'ETH' } });
  };
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const prices = data.map((point) => point.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1; // Avoid division by zero
    const padding = priceRange * 0.15; // 15% padding top and bottom

    // Normalize prices to 0-1 range
    const normalizedPrices = prices.map(
      (price) => (price - minPrice + padding) / (priceRange + padding * 2),
    );

    // Create points for the line
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
  }, [data]);

  if (isLoading || !chartData || data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.priceInfo}>
          <View>
            <ThemedText style={styles.priceLabel}>Current Price</ThemedText>
            <ThemedText style={styles.currentPrice}>
              ${currentPrice.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </ThemedText>
          </View>
          <View style={styles.changeContainer}>
            <ThemedText style={styles.changeLabel}>24h Change</ThemedText>
            <ThemedText
              style={[
                styles.priceChange,
                priceChange24h >= 0 ? styles.positiveChange : styles.negativeChange,
              ]}>
              {priceChange24h >= 0 ? '+' : ''}
              {priceChange24h.toFixed(2)}%
            </ThemedText>
          </View>
        </View>
        <View style={styles.chartPlaceholder}>
          <ThemedText style={styles.placeholderText}>Loading chart...</ThemedText>
        </View>
      </View>
    );
  }

  const isPositive = priceChange24h >= 0;

  // Create path string for the line
  const pathData = chartData.points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  // Create gradient path (area under the curve)
  const areaPath = `${pathData} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}>
      <View style={styles.priceInfo}>
        <View>
          <ThemedText style={styles.priceLabel}>Current Price</ThemedText>
          <ThemedText style={styles.currentPrice}>
            ${currentPrice.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </ThemedText>
        </View>
        <View style={styles.changeContainer}>
          <ThemedText style={styles.changeLabel}>24h Change</ThemedText>
          <ThemedText
            style={[
              styles.priceChange,
              isPositive ? styles.positiveChange : styles.negativeChange,
            ]}>
            {isPositive ? '+' : ''}
            {priceChange24h.toFixed(2)}%
          </ThemedText>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.chartBackground}>
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

          <View style={styles.priceLabels}>
            {[0, 1, 2, 3, 4].map((i) => {
              const price =
                chartData.maxPrice -
                (i / 4) * chartData.priceRange;
              return (
                <ThemedText key={i} style={styles.priceLabelText}>
                  ${price.toFixed(0)}
                </ThemedText>
              );
            })}
          </View>

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
                      top: prevPoint.y - 1,
                      width: distance,
                      transform: [{ rotate: `${angle}deg` }],
                    },
                  ]}
                />
              );
            })}
          </View>

          {chartData.points.length > 0 && (
            <View
              style={[
                styles.currentPriceDot,
                {
                  left: chartData.points[chartData.points.length - 1].x - 4,
                  top: chartData.points[chartData.points.length - 1].y - 4,
                },
              ]}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#242426',
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 12,
    color: '#A0A0A0',
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  changeContainer: {
    alignItems: 'flex-end',
  },
  changeLabel: {
    fontSize: 12,
    color: '#A0A0A0',
    marginBottom: 4,
  },
  priceChange: {
    fontSize: 18,
    fontWeight: '600',
  },
  positiveChange: {
    color: '#00FF88',
  },
  negativeChange: {
    color: '#FF4444',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: CHART_HEIGHT,
  },
  chartBackground: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    backgroundColor: '#121212',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
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
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  priceLabelText: {
    fontSize: 10,
    color: '#666',
  },
  chartLineContainer: {
    position: 'absolute',
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
  },
  chartLineSegment: {
    position: 'absolute',
    height: 3,
    backgroundColor: Colors.dark.tint, // Cyan color
    transformOrigin: 'left center',
    shadowColor: Colors.dark.tint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  currentPriceDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.tint,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: Colors.dark.tint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
  },
  chartPlaceholder: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 12,
  },
  placeholderText: {
    color: '#A0A0A0',
    fontSize: 14,
  },
});
