import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const screenWidth = Dimensions.get('window').width;

const PortfolioPieChart = ({
  stocks,
  colors,
  currencyMode,
  onCurrencyToggle,
  totalValueEUR,
  exchangeRate,
  costBasis,
  portfolioValueUSD,
}) => {
  if (!stocks || stocks.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
          No stocks in portfolio
        </Text>
      </View>
    );
  }

  const totalValue = stocks.reduce(
    (sum, stock) => sum + (stock.valueUSD || 0),
    0,
  );

  const basisUSD = costBasis || 0;
  const gainUSD = totalValue - basisUSD;
  const gainPct = basisUSD > 0 ? (gainUSD / basisUSD) * 100 : 0;

  const totalDisplay = currencyMode === 'EUR' ? totalValueEUR || 0 : totalValue;
  const gainDisplay =
    currencyMode === 'EUR' ? gainUSD * (exchangeRate || 0) : gainUSD;

  const gainColor =
    gainUSD >= 0 ? colors.success || '#3fb573' : colors.danger || '#e14b4b';

  const pieColors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#C9CBCF',
  ];

  const pieData = stocks.map((stock, index) => ({
    name: stock.symbol || stock.name || `Stock ${index + 1}`,
    value: stock.valueUSD || 0,
    valueEUR: stock.valueEUR || 0,
    color: pieColors[index % pieColors.length],
    legendFontColor: colors.text,
    legendFontSize: 12,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>
          Portfolio Distribution
        </Text>

        <TouchableOpacity
          style={[styles.currencyToggle, { borderColor: colors.primary }]}
          onPress={onCurrencyToggle}
        >
          <Text style={[styles.currencyText, { color: colors.primary }]}>
            {currencyMode}
          </Text>
          <Icon name="swap-horizontal" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Total Box */}
      <View
        style={[
          styles.totalValueBox,
          { backgroundColor: colors.primary, borderColor: colors.primary },
        ]}
      >
        <Text style={styles.totalLabel}>Portfolio Total</Text>
        <Text style={styles.totalAmount}>
          {currencyMode === 'EUR' ? '€' : '$'}
          {totalDisplay.toFixed(2)}
        </Text>

        <View style={styles.gainRow}>
          <Text style={[styles.gainText, { color: gainColor }]}>
            {currencyMode === 'EUR' ? '€' : '$'}
            {gainDisplay.toFixed(2)}
          </Text>
          <Text style={[styles.gainText, { color: gainColor }]}>
            ({gainPct.toFixed(2)}%)
          </Text>
        </View>
      </View>

      {/* PIE CHART — CENTERED */}
      <View style={styles.chartContainer}>
        <PieChart
          style={{ alignSelf: 'center' }}
          data={pieData}
          width={screenWidth}
          height={220}
          paddingLeft={screenWidth / 4}
          chartConfig={{
            color: () => colors.primary,
            labelColor: () => colors.text,
          }}
          accessor="value"
          backgroundColor="transparent"
          absolute
          hasLegend={false}
        />
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        {pieData.slice(0, 2).map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: item.color }]}
            />
            <Text style={[styles.legendText, { color: colors.text }]}>
              {currencyMode === 'EUR' ? '€' : '$'}
              {(currencyMode === 'EUR' ? item.valueEUR : item.value).toFixed(
                2,
              )}{' '}
              - {item.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    width: '100%',
  },
  currencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  currencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 20,
  },
  legendContainer: {
    marginTop: 16,
  },
  totalValueBox: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    opacity: 0.9,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  gainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  gainText: {
    fontSize: 13,
    fontWeight: '700',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 3,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
  },
});

export default PortfolioPieChart;
