import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AppContext } from './AppContext';
import { getAssets, saveAssets } from './storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ALPHA_VANTAGE_API_KEY = 'BEU3SEYCT8C01J96';

// Hardcoded ETF + stock database as fallback
const SYMBOL_DATABASE = {
  JEPQ: 'JPMorgan Equity Premium Income ETF',
  JEPG: 'JPMorgan Equity Premium Income ETF - Global',
  JEPI: 'JPMorgan Equity Premium Income ETF',
  JEPX: 'JPMorgan Equity Premium Income ETF eXtra',
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corporation',
  GOOGL: 'Alphabet Inc.',
  AMZN: 'Amazon.com Inc.',
  TSLA: 'Tesla Inc.',
  META: 'Meta Platforms Inc.',
  NFLX: 'Netflix Inc.',
  JPM: 'JPMorgan Chase & Co.',
  XOM: 'Exxon Mobil Corporation',
  JNJ: 'Johnson & Johnson',
};

const formatDate = (dateStr, format) => {
  if (format === 'DD-MM-YYYY') {
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  }
  return dateStr;
};

const parseDate = (displayStr, format) => {
  if (format === 'DD-MM-YYYY') {
    const [day, month, year] = displayStr.split('-');
    return `${year}-${month}-${day}`;
  }
  return displayStr;
};

const BuildPortfolio = ({ onBack }) => {
  const {
    getColors,
    dateFormat,
    setAssets: setContextAssets,
  } = useContext(AppContext);
  const colors = getColors();

  const [assets, setAssets] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [assetSymbol, setAssetSymbol] = useState('');
  const [assetName, setAssetName] = useState('');
  const [assetPrice, setAssetPrice] = useState('');
  const [assetQuantity, setAssetQuantity] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [infoError, setInfoError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const lastTapRef = useRef({});

  useEffect(() => {
    (async () => {
      const stored = await getAssets();
      if (Array.isArray(stored)) setAssets(stored);
    })();
  }, []);

  // 🔍 Manual lookup for company name (no autocomplete)
  const lookupCompany = async () => {
    if (!assetSymbol) return;

    setLoadingInfo(true);
    setInfoError('');
    setAssetName('');
    setSearchResults([]);

    const keyword = assetSymbol.trim().toUpperCase();

    // First try exact symbol via OVERVIEW (often works for ETFs)
    try {
      const ovUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${keyword}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      const ovRes = await axios.get(ovUrl);
      const nameOV = ovRes.data?.Name;
      if (nameOV) {
        setAssetName(nameOV);
        setSearchResults([{ symbol: keyword, name: nameOV }]);
        setShowResults(true);
        setLoadingInfo(false);
        return;
      }
    } catch (err) {
      // ignore and fall back to search
    }

    // Fall back to SYMBOL_SEARCH by keyword
    try {
      const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${keyword}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      const res = await axios.get(url);
      const matches = res.data?.bestMatches;

      if (Array.isArray(matches) && matches.length > 0) {
        const results = matches.map(m => ({
          symbol: m['1. symbol'],
          name: m['2. name'],
          region: m['4. region'],
          currency: m['8. currency'],
        }));
        setSearchResults(results);
        setShowResults(true);
        const exact = results.find(r => r.symbol === keyword);
        if (exact) setAssetName(exact.name);
      } else {
        // Fallback to hardcoded database
        if (SYMBOL_DATABASE[keyword]) {
          const name = SYMBOL_DATABASE[keyword];
          setAssetName(name);
          setSearchResults([{ symbol: keyword, name }]);
          setShowResults(true);
        } else {
          setInfoError(
            'Symbol not found. You can still proceed without a company name.',
          );
        }
      }
    } catch (err) {
      console.error('Alpha Vantage lookup failed:', err);
      // Fallback on error
      if (SYMBOL_DATABASE[keyword]) {
        const name = SYMBOL_DATABASE[keyword];
        setAssetName(name);
        setSearchResults([{ symbol: keyword, name }]);
        setShowResults(true);
      } else {
        setInfoError(
          'Lookup failed. You can still proceed without a company name.',
        );
      }
    } finally {
      setLoadingInfo(false);
    }
  };

  const selectSearchResult = result => {
    setAssetSymbol(result.symbol);
    setAssetName(result.name);
    setShowResults(false);
  };

  const addAsset = async () => {
    if (!assetSymbol || !assetPrice || !assetQuantity) return;

    const totalValue = (
      parseFloat(assetPrice) * parseFloat(assetQuantity)
    ).toFixed(2);

    // Fetch logo via Alpha Vantage COMPANY_OVERVIEW
    let logoUrl = '';
    try {
      const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${assetSymbol.toUpperCase()}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      const res = await axios.get(url);
      logoUrl = res.data?.['LogoUrl'] || '';
    } catch (err) {
      console.log('Logo fetch failed:', err.message);
    }

    const newAsset = {
      symbol: assetSymbol.toUpperCase(),
      name: assetName,
      price: assetPrice,
      quantity: assetQuantity,
      totalValue,
      purchaseDate: formatDate(purchaseDate, dateFormat),
      logoUrl: logoUrl,
    };

    let nextAssets;
    if (editingIndex !== null) {
      // Update existing asset
      nextAssets = [...assets];
      nextAssets[editingIndex] = newAsset;
      setEditingIndex(null);
    } else {
      // Add new asset
      nextAssets = [...assets, newAsset];
    }

    setAssets(nextAssets);
    setContextAssets(nextAssets); // Sync with context
    saveAssets(nextAssets);

    setAssetSymbol('');
    setAssetName('');
    setAssetPrice('');
    setAssetQuantity('');
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setFormOpen(false);
  };

  const startEditAsset = index => {
    const asset = assets[index];
    setAssetSymbol(asset.symbol);
    setAssetName(asset.name);
    setAssetPrice(asset.price);
    setAssetQuantity(asset.quantity);
    setPurchaseDate(parseDate(asset.purchaseDate, dateFormat));
    setEditingIndex(index);
    setFormOpen(true);
  };

  const deleteAsset = index => {
    const nextAssets = assets.filter((_, i) => i !== index);
    setAssets(nextAssets);
    setContextAssets(nextAssets);
    saveAssets(nextAssets);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setAssetSymbol('');
    setAssetName('');
    setAssetPrice('');
    setAssetQuantity('');
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setFormOpen(false);
  };

  // Double-tap to edit, long-press to delete
  const handleAssetPress = index => {
    const now = Date.now();
    const lastTap = lastTapRef.current[index] || 0;

    if (now - lastTap < 300) {
      // Double tap - edit
      startEditAsset(index);
      lastTapRef.current[index] = 0;
    } else {
      // Single tap - show hint
      lastTapRef.current[index] = now;
    }
  };

  const handleAssetLongPress = index => {
    // Long press - delete via native alert
    const asset = assets[index];
    Alert.alert(
      'Delete Asset',
      `Delete ${asset.symbol}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAsset(index),
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: colors.bg }}>
      <TouchableOpacity onPress={onBack} style={{ marginBottom: 12 }}>
        <Text style={{ color: colors.primary }}>← Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.primary }]}>
        Build Your Portfolio
      </Text>

      <TouchableOpacity
        style={[styles.toggle, { borderColor: colors.border }]}
        onPress={() => {
          if (editingIndex !== null) {
            cancelEdit();
          } else {
            setFormOpen(!formOpen);
          }
        }}
      >
        <Text style={{ color: colors.primary }}>
          {editingIndex !== null ? '✕ Cancel Edit' : '➕ Add New Asset'}
        </Text>
      </TouchableOpacity>

      {formOpen && (
        <View
          style={[
            styles.form,
            { borderColor: colors.border, backgroundColor: colors.bgSecondary },
          ]}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.primary,
              marginBottom: 12,
            }}
          >
            {editingIndex !== null ? '✏️ Edit Asset' : '➕ Add New Asset'}
          </Text>
          <Text style={{ color: colors.textSecondary }}>Stock Symbol</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text, flex: 1 },
              ]}
              placeholder="e.g. AAPL, MSFT, O"
              placeholderTextColor={colors.textSecondary}
              value={assetSymbol}
              onChangeText={setAssetSymbol}
            />
            <TouchableOpacity
              style={styles.inputIconButton}
              onPress={lookupCompany}
              accessibilityRole="button"
              accessibilityLabel="Lookup company name"
            >
              <Icon name="magnify" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {loadingInfo && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}

          {infoError ? <Text style={{ color: 'red' }}>{infoError}</Text> : null}

          {assetName ? (
            <Text
              style={{ marginTop: 6, color: colors.textSecondary }}
              numberOfLines={1}
            >
              Company: {assetName}
            </Text>
          ) : null}

          {showResults && searchResults.length > 0 && (
            <View
              style={[
                styles.resultsPanel,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.bgSecondary,
                },
              ]}
            >
              {searchResults.slice(0, 10).map((r, idx) => (
                <TouchableOpacity
                  key={`${r.symbol}-${idx}`}
                  style={styles.resultRow}
                  onPress={() => selectSearchResult(r)}
                >
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>
                    {r.symbol}
                  </Text>
                  <Text
                    style={{ color: colors.textSecondary }}
                    numberOfLines={1}
                  >
                    {r.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={{ marginTop: 12, color: colors.textSecondary }}>
            Price
          </Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text },
            ]}
            keyboardType="decimal-pad"
            value={assetPrice}
            onChangeText={setAssetPrice}
          />

          <Text style={{ marginTop: 12, color: colors.textSecondary }}>
            Quantity
          </Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text },
            ]}
            keyboardType="decimal-pad"
            value={assetQuantity}
            onChangeText={setAssetQuantity}
          />

          <Text style={{ marginTop: 12, color: colors.textSecondary }}>
            Purchase Date
          </Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text },
            ]}
            value={formatDate(purchaseDate, dateFormat)}
            onChangeText={text => setPurchaseDate(parseDate(text, dateFormat))}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={addAsset}
          >
            <Text style={{ color: '#fff' }}>
              {editingIndex !== null ? '💾 Update Asset' : '+ Add Asset'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {assets.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.primary,
              marginBottom: 12,
            }}
          >
            Your Assets ({assets.length})
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              marginBottom: 12,
              fontStyle: 'italic',
            }}
          >
            Double-tap to edit • Long-press to delete
          </Text>
          {assets.map((a, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.assetRow, { borderColor: colors.border }]}
              onPress={() => handleAssetPress(i)}
              onLongPress={() => handleAssetLongPress(i)}
              delayLongPress={500}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>
                  {a.symbol} — {a.name}
                </Text>
                <Text style={{ color: colors.text, marginTop: 4 }}>
                  {a.quantity} × ${a.price} = ${a.totalValue}
                </Text>
                {a.purchaseDate && (
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    Purchased: {a.purchaseDate}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '600', marginBottom: 12 },
  toggle: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  form: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginTop: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputIconButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  button: {
    marginTop: 14,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  assetRow: {
    padding: 10,
    borderBottomWidth: 1,
  },
  resultsPanel: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  resultRow: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 2,
  },
});

export default BuildPortfolio;
