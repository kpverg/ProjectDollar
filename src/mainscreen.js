import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppContext } from './AppContext';
import ViewPortfolio from './viewPortfolio';
import BuildPortfolio from './buildPortfolio';
import AddCapital from './addCapital';
import Settings from './settings';
import PortfolioChart from './PortfolioChart';
import PortfolioPieChart from './PortfolioPieChart';
import ExchangeRateChart from './ExchangeRateChart';
import { convertUSDToEUR } from './exchangeRateService';
import { fetchStockPrices } from './stockPriceService';

const MainScreen = () => {
  const { getColors, assets } = useContext(AppContext);
  const colors = getColors();

  const [currentScreen, setCurrentScreen] = useState('main');
  const [currencyMode, setCurrencyMode] = useState('USD');
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [portfolioValueEUR, setPortfolioValueEUR] = useState(0);
  const [costBasis, setCostBasis] = useState(0);
  const [chartPeriod, setChartPeriod] = useState('month');
  const [exchangeRateInverted, setExchangeRateInverted] = useState(false);
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [currentPrices, setCurrentPrices] = useState({});

  const toNumber = v => {
    const n = typeof v === 'string' ? parseFloat(v) : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // ===============================
  // FETCH LIVE STOCK PRICES
  // ===============================
  useEffect(() => {
    const fetchPrices = async () => {
      if (!assets || assets.length === 0) {
        setCurrentPrices({});
        return;
      }

      const symbols = assets
        .map(a => a.symbol?.toUpperCase())
        .filter(sym => sym && sym !== '0' && sym.length > 0);

      if (symbols.length === 0) return;

      try {
        const apiPrices = await fetchStockPrices(symbols);

        const normalized = {};
        Object.keys(apiPrices).forEach(sym => {
          normalized[sym.toUpperCase()] = Number(apiPrices[sym]);
        });

        setCurrentPrices(normalized);
      } catch (err) {
        console.error('Stock price fetch failed:', err);
      }
    };

    fetchPrices();
  }, [assets]);

  // ===============================
  // CALCULATE PORTFOLIO VALUE
  // Includes: current value (USD/EUR) and cost basis
  // ===============================
  useEffect(() => {
    if (!assets || assets.length === 0) {
      setPortfolioValue(0);
      setPortfolioValueEUR(0);
      setCostBasis(0);
      return;
    }

    if (Object.keys(currentPrices).length === 0) return;

    let basis = 0;

    const totalUSD = assets.reduce((sum, asset) => {
      const symbol = asset.symbol?.toUpperCase();
      const apiPrice = Number(currentPrices[symbol]);
      const price = Number.isFinite(apiPrice)
        ? apiPrice
        : toNumber(asset.price);

      const purchasePrice = toNumber(asset.price);

      basis += purchasePrice * toNumber(asset.quantity);

      return sum + price * toNumber(asset.quantity);
    }, 0);

    setCostBasis(basis);
    setPortfolioValue(totalUSD);

    convertUSDToEUR(totalUSD)
      .then(setPortfolioValueEUR)
      .catch(err => console.error('EUR conversion failed:', err));

    generatePortfolioHistory(totalUSD);
  }, [assets, currentPrices]);

  // ===============================
  // MOCK PORTFOLIO HISTORY
  // ===============================
  const generatePortfolioHistory = currentValue => {
    const history = [];
    const days = 365;

    // target last value = current portfolio value
    const target = Number(currentValue) || 0;
    const start = target * 0.8 || 8000;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const progress = (days - i) / days; // 0 -> 1
      const drift = start + (target - start) * progress;
      const noise = i === 0 ? 0 : drift * (Math.random() * 0.04 - 0.02); // lock last point to target
      const value = i === 0 ? target : Math.max(drift + noise, 0);

      history.push({
        date: date.toISOString().split('T')[0],
        value,
      });
    }

    setPortfolioHistory(history);
  };

  // ===============================
  // PIE CHART DATA
  // ===============================
  const prepareStockData = () => {
    return assets.map(asset => {
      const symbol = asset.symbol?.toUpperCase();
      const price = Number(currentPrices[symbol]) || toNumber(asset.price);

      const valueUSD = price * toNumber(asset.quantity);
      const valueEUR =
        portfolioValue > 0
          ? (valueUSD / portfolioValue) * portfolioValueEUR
          : 0;

      return {
        symbol,
        name: asset.name,
        valueUSD,
        valueEUR,
      };
    });
  };

  // ===============================
  // NAVIGATION
  // ===============================
  if (currentScreen === 'portfolio')
    return <ViewPortfolio onBack={() => setCurrentScreen('main')} />;
  if (currentScreen === 'build')
    return <BuildPortfolio onBack={() => setCurrentScreen('main')} />;
  if (currentScreen === 'capital')
    return <AddCapital onBack={() => setCurrentScreen('main')} />;
  if (currentScreen === 'settings')
    return <Settings onBack={() => setCurrentScreen('main')} />;

  // ===============================
  // MAIN UI
  // ===============================
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.primary }]}>
            ProjectDollar
          </Text>
          <Text style={{ color: colors.textSecondary }}>Portfolio Manager</Text>
        </View>

        <PortfolioPieChart
          stocks={prepareStockData()}
          colors={colors}
          currencyMode={currencyMode}
          onCurrencyToggle={() =>
            setCurrencyMode(currencyMode === 'USD' ? 'EUR' : 'USD')
          }
          totalValueEUR={portfolioValueEUR}
          exchangeRate={
            portfolioValue > 0 ? portfolioValueEUR / portfolioValue : 0
          }
          costBasis={costBasis}
          portfolioValueUSD={portfolioValue}
        />

        <View style={styles.periodSelector}>
          {['day', 'week', 'month', 'year'].map(p => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodButton,
                chartPeriod === p && {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => setChartPeriod(p)}
            >
              <Text
                style={{
                  color: chartPeriod === p ? '#fff' : '#666',
                }}
              >
                {p.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <PortfolioChart
          data={portfolioHistory}
          period={chartPeriod}
          colors={colors}
        />

        <ExchangeRateChart
          inverted={exchangeRateInverted}
          onToggle={() => setExchangeRateInverted(!exchangeRateInverted)}
          colors={colors}
        />
      </ScrollView>

      <View style={[styles.bottomNav, { backgroundColor: colors.bgSecondary }]}>
        {[
          ['View', 'chart-line', 'portfolio'],
          ['Build', 'briefcase-plus', 'build'],
          ['Add $', 'cash-plus', 'capital'],
          ['Settings', 'cog', 'settings'],
        ].map(([label, icon, screen]) => (
          <TouchableOpacity
            key={screen}
            style={styles.navButton}
            onPress={() => setCurrentScreen(screen)}
          >
            <Icon name={icon} size={26} color={colors.primary} />
            <Text style={{ color: colors.primary }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', padding: 40 },
  title: { fontSize: 32, fontWeight: 'bold' },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    height: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navButton: { alignItems: 'center' },
});

export default MainScreen;
