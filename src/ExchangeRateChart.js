import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getHistoricalRates } from './exchangeRateService';

const screenWidth = Dimensions.get('window').width;

/**
 * Exchange Rate Chart Component
 * Shows EUR/USD or USD/EUR exchange rate over time
 */
const ExchangeRateChart = ({ colors, inverted = false, onToggle }) => {
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistoricalData();
  }, []);

  const loadHistoricalData = async () => {
    setLoading(true);
    try {
      const data = await getHistoricalRates(30);
      setHistoricalData(data);
    } catch (error) {
      console.error('Error loading historical rates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading exchange rates...
        </Text>
      </View>
    );
  }

  if (historicalData.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
          No exchange rate data available
        </Text>
      </View>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: historicalData
      .filter((_, index) => index % 5 === 0)
      .map(item => {
        const date = new Date(item.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }),
    datasets: [
      {
        data: historicalData.map(item =>
          inverted ? 1 / item.rate : item.rate,
        ),
        color: (opacity = 1) => colors.primary,
        strokeWidth: 2,
      },
    ],
  };

  const currentRate = inverted
    ? (1 / historicalData[historicalData.length - 1].rate).toFixed(4)
    : historicalData[historicalData.length - 1].rate.toFixed(4);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {inverted ? 'USD/EUR' : 'EUR/USD'} Rate
        </Text>
        <View style={styles.headerRight}>
          <Text style={[styles.currentRate, { color: colors.primary }]}>
            {currentRate}
          </Text>
          {onToggle && (
            <TouchableOpacity
              style={[styles.toggleButton, { borderColor: colors.primary }]}
              onPress={onToggle}
            >
              <Text style={[styles.toggleText, { color: colors.primary }]}>
                {inverted ? 'EUR/USD' : 'USD/EUR'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <LineChart
        data={chartData}
        width={screenWidth - 40}
        height={180}
        chartConfig={{
          backgroundColor: colors.bgSecondary,
          backgroundGradientFrom: colors.bgSecondary,
          backgroundGradientTo: colors.bgSecondary,
          decimalPlaces: 4,
          color: (opacity = 1) => colors.primary,
          labelColor: (opacity = 1) => colors.textSecondary,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '2',
            strokeWidth: '1',
            stroke: colors.primary,
          },
        }}
        bezier
        style={styles.chart}
      />
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Last 30 days
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentRate: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 20,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 20,
  },
});

export default ExchangeRateChart;
