import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

/**
 * Portfolio Evolution Chart Component
 * Shows the portfolio value over time
 */
const PortfolioChart = ({ data, period, colors }) => {
  console.log('PortfolioChart received data:', data?.length, 'items');

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Portfolio Evolution
        </Text>
      </View>
    );
  }

  // Helpers to aggregate by period
  const getWeekNumber = date => {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  };

  const pad2 = n => `${n}`.padStart(2, '0');

  const formatLabel = (date, view, extra) => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    if (view === 'day')
      return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
    if (view === 'month')
      return `${months[date.getMonth()]} '${String(date.getFullYear()).slice(
        -2,
      )}`;
    if (view === 'year') return `${date.getFullYear()}`;
    if (view === 'week' && extra?.range) return extra.range;
    const wk = getWeekNumber(date);
    return `W${wk}`; // fallback
  };

  const getWeekRangeLabel = date => {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const day = d.getUTCDay() || 7; // Monday=1 ... Sunday=7
    const start = new Date(d);
    start.setUTCDate(d.getUTCDate() - (day - 1)); // move to Monday
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6); // Sunday
    return `${pad2(start.getUTCDate())}-${pad2(end.getUTCDate())}/${pad2(
      end.getUTCMonth() + 1,
    )}`;
  };

  const aggregateByPeriod = () => {
    const sorted = [...data].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    const buckets = new Map();

    sorted.forEach(item => {
      const dt = new Date(item.date);
      let key = '';
      let label = '';

      switch (period) {
        case 'day':
          key = item.date;
          label = formatLabel(dt, 'day');
          break;
        case 'week': {
          const wk = getWeekNumber(dt);
          key = `${dt.getFullYear()}-W${wk}`;
          label = formatLabel(dt, 'week', { range: getWeekRangeLabel(dt) });
          break;
        }
        case 'month':
          key = `${dt.getFullYear()}-${dt.getMonth() + 1}`;
          label = formatLabel(dt, 'month');
          break;
        case 'year':
          key = `${dt.getFullYear()}`;
          label = formatLabel(dt, 'year');
          break;
        default:
          key = item.date;
          label = formatLabel(dt, 'day');
      }

      // Keep latest value per bucket
      buckets.set(key, { label, value: item.value });
    });

    const aggregated = Array.from(buckets.values());

    // Limit points per view
    if (period === 'day') return aggregated.slice(-8);
    if (period === 'week') return aggregated.slice(-5);
    if (period === 'month') return aggregated.slice(-4);
    if (period === 'year') return aggregated.slice(-5);
    return aggregated;
  };

  // Prepare chart data based on period (aggregated by day/week/month/year)
  const prepareData = () => {
    const aggregated = aggregateByPeriod();
    console.log(
      'Aggregated data:',
      aggregated.length,
      'points for period:',
      period,
    );

    return {
      labels: aggregated.map(item => item.label),
      datasets: [
        {
          data: aggregated.map(item => item.value),
          color: (opacity = 1) => colors.primary,
          strokeWidth: 2,
        },
      ],
    };
  };

  const chartData = prepareData();
  console.log('Chart data labels:', chartData.labels);
  console.log('Chart data values:', chartData.datasets[0].data);

  try {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Portfolio Evolution
        </Text>
        <LineChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          yAxisLabel="$"
          chartConfig={{
            backgroundColor: colors.bgSecondary,
            backgroundGradientFrom: colors.bgSecondary,
            backgroundGradientTo: colors.bgSecondary,
            decimalPlaces: 0,
            color: (opacity = 1) => colors.primary,
            labelColor: (opacity = 1) => colors.textSecondary,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '3',
              strokeWidth: '2',
              stroke: colors.primary,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  } catch (error) {
    console.error('Error rendering chart:', error);
    return (
      <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Portfolio Evolution
        </Text>
        <Text style={[styles.noDataText, { color: 'red' }]}>
          Error: {error.message}
        </Text>
      </View>
    );
  }
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
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 20,
  },
});

export default PortfolioChart;
