import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { AppContext } from './AppContext';
import axios from 'axios';

const ALPHA_VANTAGE_API_KEY = 'BEU3SEYCT8C01J96';
// Add your Finnhub key here to use Finnhub for live quotes
// Get one at https://finnhub.io/
const FINNHUB_API_KEY = 'd546v41r01qlj84b8ir0d546v41r01qlj84b8irg';

const ViewPortfolio = ({ onBack }) => {
  const { colors, getColors, assets } = useContext(AppContext);
  const dynamicColors = getColors();
  const [currentPrices, setCurrentPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [logoErrors, setLogoErrors] = useState({});
  const [priceCache, setPriceCache] = useState({}); // Cache: { symbol: { price, timestamp } }
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
  const REQUEST_DELAY_MS = 400; // small delay to respect API limits

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  // Check if price is cached and still fresh
  const getCachedPrice = symbol => {
    const cached = priceCache[symbol];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[${symbol}] Using cached price: $${cached.price}`);
      return cached.price;
    }
    return null;
  };

  // Update cache with new price
  const updateCache = (symbol, price) => {
    setPriceCache(prev => ({
      ...prev,
      [symbol]: { price, timestamp: Date.now() },
    }));
  };

  // Fetch from Finnhub
  const fetchPriceFromFinnhub = async symbol => {
    if (!FINNHUB_API_KEY) return null;
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
      const res = await axios.get(url);
      const price = parseFloat(res.data?.c ?? 0);
      console.log(`[${symbol}] Finnhub Response:`, res.data);
      return price > 0 ? price : null;
    } catch (e) {
      console.warn(`[${symbol}] Finnhub fetch failed:`, e?.message || e);
      return null;
    }
  };

  // Fallback to Alpha Vantage
  const fetchPriceFromAlpha = async symbol => {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      const res = await axios.get(url);
      const quote = res.data?.['Global Quote'];
      const price = parseFloat(quote?.['05. price'] || 0);
      console.log(`[${symbol}] AlphaVantage Response:`, quote);
      return price > 0 ? price : null;
    } catch (e) {
      console.warn(`[${symbol}] AlphaVantage fetch failed:`, e?.message || e);
      return null;
    }
  };

  // Preferred: Finnhub, fallback: AlphaVantage
  const fetchPriceWithFallback = async symbol => {
    // Try Finnhub first if key exists
    const finnhubPrice = await fetchPriceFromFinnhub(symbol);
    if (finnhubPrice) return finnhubPrice;
    // Fallback to Alpha Vantage
    const alphaPrice = await fetchPriceFromAlpha(symbol);
    return alphaPrice;
  };

  // Fetch current prices for all assets
  useEffect(() => {
    const fetchCurrentPrices = async () => {
      setLoadingPrices(true);
      const prices = {};

      for (const asset of assets) {
        try {
          // Check cache first
          const cachedPrice = getCachedPrice(asset.symbol);
          if (cachedPrice) {
            prices[asset.symbol] = cachedPrice;
            continue;
          }

          const price = await fetchPriceWithFallback(asset.symbol);
          if (price) {
            prices[asset.symbol] = price;
            updateCache(asset.symbol, price);
          } else {
            console.warn(`[${asset.symbol}] No price returned from providers`);
          }

          // Add delay to avoid rate limiting
          await delay(REQUEST_DELAY_MS);
        } catch (err) {
          console.error(
            `Failed to fetch price for ${asset.symbol}:`,
            err.message,
          );
        }
      }

      console.log('Final prices:', prices);
      setCurrentPrices(prices);
      setLoadingPrices(false);
    };

    if (assets.length > 0) {
      console.log(
        'Fetching prices for assets:',
        assets.map(a => a.symbol),
      );
      fetchCurrentPrices();
    } else {
      setLoadingPrices(false);
    }
  }, [assets]);

  const refreshPrices = () => {
    setLoadingPrices(true);
    const fetchCurrentPrices = async () => {
      const prices = {};

      for (const asset of assets) {
        try {
          // Check cache first
          const cachedPrice = getCachedPrice(asset.symbol);
          if (cachedPrice) {
            prices[asset.symbol] = cachedPrice;
            continue;
          }

          const price = await fetchPriceWithFallback(asset.symbol);
          console.log(`[${asset.symbol}] Refresh price:`, price);
          if (price) {
            prices[asset.symbol] = price;
            updateCache(asset.symbol, price);
          }

          // Add delay to avoid rate limiting
          await delay(REQUEST_DELAY_MS);
        } catch (err) {
          console.error(
            `Failed to refresh price for ${asset.symbol}:`,
            err.message,
          );
        }
      }

      console.log('Refreshed prices:', prices);
      setCurrentPrices(prices);
      setLoadingPrices(false);
    };
    fetchCurrentPrices();
  };

  // Auto-refresh prices every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing prices...');
      refreshPrices();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [assets]);

  const handleImageError = symbol => {
    setLogoErrors(prev => ({ ...prev, [symbol]: true }));
  };

  // Calculate portfolio stats
  const totalValue = assets.reduce((sum, asset) => {
    return sum + parseFloat(asset.totalValue || 0);
  }, 0);

  // Get stock logo URL from asset or fallback
  const getStockLogoUrl = asset => {
    // Use the logo URL fetched from API
    if (asset.logoUrl && !logoErrors[asset.symbol]) {
      return asset.logoUrl;
    }
    // Fallback to a generic stock icon or letter badge
    return null;
  };

  // Calculate gain/loss for an asset
  const calculateGainLoss = asset => {
    const currentPrice = currentPrices[asset.symbol];
    if (!currentPrice) return null;

    const purchasePrice = parseFloat(asset.price);
    const quantity = parseFloat(asset.quantity);
    const currentValue = currentPrice * quantity;
    const purchaseValue = purchasePrice * quantity;
    const gainLoss = currentValue - purchaseValue;
    const gainLossPercent = ((gainLoss / purchaseValue) * 100).toFixed(2);

    return {
      currentValue: currentValue.toFixed(2),
      gainLoss: gainLoss.toFixed(2),
      gainLossPercent,
      isPositive: gainLoss >= 0,
    };
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: dynamicColors.bg },
      ]}
    >
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={[styles.backButtonText, { color: dynamicColors.primary }]}>
          ← Back
        </Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.title, { color: dynamicColors.primary }]}>
          Your Portfolio
        </Text>
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.statsCard,
            { backgroundColor: dynamicColors.bgSecondary },
          ]}
        >
          <Text style={[styles.label, { color: dynamicColors.textSecondary }]}>
            Total Assets
          </Text>
          <Text style={[styles.value, { color: dynamicColors.primary }]}>
            ${totalValue.toFixed(2)}
          </Text>
        </View>

        <View
          style={[
            styles.statsCard,
            { backgroundColor: dynamicColors.bgSecondary },
          ]}
        >
          <Text style={[styles.label, { color: dynamicColors.textSecondary }]}>
            Number of Stocks
          </Text>
          <Text style={[styles.value, { color: dynamicColors.primary }]}>
            {assets.length}
          </Text>
        </View>

        {assets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text
              style={[styles.emptyText, { color: dynamicColors.textSecondary }]}
            >
              No assets yet
            </Text>
            <Text
              style={[styles.emptySubtext, { color: dynamicColors.border }]}
            >
              Add some capital to get started
            </Text>
          </View>
        ) : (
          <View style={styles.assetsList}>
            <Text
              style={[styles.assetsTitle, { color: dynamicColors.primary }]}
            >
              Your Holdings
            </Text>
            {assets.map((asset, index) => (
              <View
                key={index}
                style={[
                  styles.assetCard,
                  { backgroundColor: dynamicColors.bgSecondary },
                ]}
              >
                <View style={styles.assetHeader}>
                  {getStockLogoUrl(asset) ? (
                    <Image
                      source={{ uri: getStockLogoUrl(asset) }}
                      style={styles.stockLogo}
                      onError={() => handleImageError(asset.symbol)}
                    />
                  ) : (
                    <View
                      style={[
                        styles.stockLogo,
                        {
                          backgroundColor: dynamicColors.primary,
                          justifyContent: 'center',
                          alignItems: 'center',
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: '#fff',
                          fontWeight: '700',
                          fontSize: 14,
                        }}
                      >
                        {asset.symbol.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.assetInfo}>
                    <Text
                      style={[
                        styles.assetSymbol,
                        { color: dynamicColors.primary },
                      ]}
                    >
                      {asset.symbol}
                    </Text>
                    <Text
                      style={[
                        styles.assetName,
                        { color: dynamicColors.textSecondary },
                      ]}
                    >
                      {asset.name}
                    </Text>
                  </View>
                </View>
                <View style={styles.assetStats}>
                  <View style={styles.statItem}>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: dynamicColors.textSecondary },
                      ]}
                    >
                      Qty
                    </Text>
                    <Text
                      style={[styles.statValue, { color: dynamicColors.text }]}
                    >
                      {asset.quantity}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: dynamicColors.textSecondary },
                      ]}
                    >
                      Buy Price
                    </Text>
                    <Text
                      style={[styles.statValue, { color: dynamicColors.text }]}
                    >
                      ${asset.price}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: dynamicColors.textSecondary },
                      ]}
                    >
                      Current
                    </Text>
                    <Text
                      style={[styles.statValue, { color: dynamicColors.text }]}
                    >
                      {currentPrices[asset.symbol]
                        ? `$${currentPrices[asset.symbol].toFixed(2)}`
                        : '...'}
                    </Text>
                  </View>
                </View>

                <View style={styles.gainsRow}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: dynamicColors.textSecondary },
                      ]}
                    >
                      Initial Value
                    </Text>
                    <Text
                      style={[styles.statValue, { color: dynamicColors.text }]}
                    >
                      ${asset.totalValue}
                    </Text>
                  </View>
                  {currentPrices[asset.symbol] ? (
                    <>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.statLabel,
                            { color: dynamicColors.textSecondary },
                          ]}
                        >
                          Current Value
                        </Text>
                        <Text
                          style={[
                            styles.statValue,
                            { color: dynamicColors.text },
                          ]}
                        >
                          ${calculateGainLoss(asset)?.currentValue}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.statLabel,
                            { color: dynamicColors.textSecondary },
                          ]}
                        >
                          Gain/Loss
                        </Text>
                        <Text
                          style={[
                            styles.statValue,
                            {
                              color: calculateGainLoss(asset)?.isPositive
                                ? '#22c55e'
                                : '#dc2626',
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {calculateGainLoss(asset)?.isPositive ? '+' : ''}$
                          {calculateGainLoss(asset)?.gainLoss}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.statLabel,
                            { color: dynamicColors.textSecondary },
                          ]}
                        >
                          Return %
                        </Text>
                        <Text
                          style={[
                            styles.statValue,
                            {
                              color: calculateGainLoss(asset)?.isPositive
                                ? '#22c55e'
                                : '#dc2626',
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {calculateGainLoss(asset)?.isPositive ? '+' : ''}
                          {calculateGainLoss(asset)?.gainLossPercent}%
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={{ flex: 3, justifyContent: 'center' }}>
                      <ActivityIndicator
                        size="small"
                        color={dynamicColors.primary}
                      />
                    </View>
                  )}
                </View>
                {asset.purchaseDate && (
                  <Text
                    style={[
                      styles.purchaseDate,
                      { color: dynamicColors.textSecondary },
                    ]}
                  >
                    Purchased: {asset.purchaseDate}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
    paddingBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1a73e8',
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  content: {
    paddingHorizontal: 20,
    gap: 15,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  assetsList: {
    marginTop: 10,
  },
  assetsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 10,
  },
  assetCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stockLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  assetInfo: {
    flex: 1,
  },
  assetSymbol: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  assetName: {
    fontSize: 13,
    color: '#999',
  },
  assetStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  gainsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  purchaseDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
});

export default ViewPortfolio;
