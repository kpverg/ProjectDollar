import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { AppContext } from './AppContext';
import { getBalances, saveBalances } from './storage';

const currencies = ['USD', 'EUR'];

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

const AddCapital = ({ onBack }) => {
  const { colors, dateFormat, getColors } = useContext(AppContext);
  const dynamicColors = getColors();
  const [balances, setBalances] = useState({ USD: 0, EUR: 0 });
  const [showModal, setShowModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [history, setHistory] = useState([]);
  const [convertAmount, setConvertAmount] = useState('');
  const [convertFrom, setConvertFrom] = useState('USD');
  const [eurToUsd, setEurToUsd] = useState(1.08);
  const [customRate, setCustomRate] = useState('');
  const [rateInfo, setRateInfo] = useState('');

  const formattedBalances = useMemo(
    () => ({
      USD: `$${balances.USD.toFixed(2)}`,
      EUR: `€${balances.EUR.toFixed(2)}`,
    }),
    [balances],
  );

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    // keep form values so user can adjust if needed
  };

  const openConvertModal = () => setShowConvertModal(true);
  const closeConvertModal = () => setShowConvertModal(false);

  // Fetch exchange rate
  const fetchExchangeRate = async () => {
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
      const data = await res.json();
      const rate = data?.rates?.USD;
      if (rate && typeof rate === 'number' && rate > 0) {
        setEurToUsd(rate);
        setRateInfo(`Live: 1 EUR = ${rate.toFixed(4)} USD`);
      } else {
        setRateInfo('Fallback: 1.08');
        setEurToUsd(1.08);
      }
    } catch (err) {
      console.log('Rate fetch error:', err);
      setRateInfo('Fallback: 1.08');
      setEurToUsd(1.08);
    }
  };

  // Load balances and fetch rate on app load
  useEffect(() => {
    (async () => {
      const stored = await getBalances();
      if (
        stored &&
        typeof stored.USD === 'number' &&
        typeof stored.EUR === 'number'
      ) {
        setBalances(stored);
      }
    })();
    fetchExchangeRate();
  }, []);

  // Refresh rate when convert modal opens
  useEffect(() => {
    if (showConvertModal) {
      fetchExchangeRate();
      const interval = setInterval(fetchExchangeRate, 3000);
      return () => clearInterval(interval);
    }
  }, [showConvertModal]);

  // Format date for display based on user's preference
  const displayDate = useMemo(() => {
    return formatDate(date, dateFormat);
  }, [date, dateFormat]);

  const rateDisplay = useMemo(() => {
    const rate = eurToUsd || 1.08;
    if (convertFrom === 'USD') {
      return `1 USD = ${(1 / rate).toFixed(4)} EUR`;
    }
    return `1 EUR = ${rate.toFixed(4)} USD`;
  }, [convertFrom, eurToUsd]);

  const handleSubmit = () => {
    const value = parseFloat(amount.replace(',', '.'));
    if (Number.isNaN(value) || value <= 0) {
      return;
    }

    const nextBalances = {
      ...balances,
      [currency]: parseFloat((balances[currency] + value).toFixed(2)),
    };
    setBalances(nextBalances);
    saveBalances(nextBalances);

    setHistory(prev => [
      {
        id: Date.now().toString(),
        date: formatDate(date, dateFormat), // Store formatted date for display
        currency,
        amount: value,
      },
      ...prev,
    ]);

    // reset form for next entry
    setAmount('');
    setCurrency('USD');
    setDate(new Date().toISOString().slice(0, 10));
    setShowModal(false);
  };

  const handleConvert = () => {
    const value = parseFloat(convertAmount.replace(',', '.'));
    if (Number.isNaN(value) || value <= 0) {
      return;
    }

    const from = convertFrom;
    const to = from === 'USD' ? 'EUR' : 'USD';

    if (balances[from] < value) {
      return;
    }

    // Use custom rate if provided, otherwise use live rate
    const rate = customRate ? parseFloat(customRate) : eurToUsd || 1.08;
    if (!rate || rate <= 0) {
      return;
    }

    const converted = from === 'USD' ? value / rate : value * rate;

    const nextBalances = {
      ...balances,
      [from]: parseFloat((balances[from] - value).toFixed(2)),
      [to]: parseFloat((balances[to] + converted).toFixed(2)),
    };
    setBalances(nextBalances);
    saveBalances(nextBalances);

    setConvertAmount('');
    setCustomRate('');
    setConvertFrom('USD');
    setShowConvertModal(false);
  };

  const handleSwapCurrency = () => {
    setConvertFrom(convertFrom === 'USD' ? 'EUR' : 'USD');
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
          Add Capitals
        </Text>
        <Text style={[styles.subtitle, { color: dynamicColors.textSecondary }]}>
          Deposit funds to your account
        </Text>
      </View>

      <View style={styles.content}>
        <View
          style={[styles.card, { backgroundColor: dynamicColors.bgSecondary }]}
        >
          <Text style={[styles.label, { color: dynamicColors.textSecondary }]}>
            Current Balances
          </Text>
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceLabel, { color: dynamicColors.text }]}>
              USD
            </Text>
            <Text style={[styles.balance, { color: dynamicColors.primary }]}>
              {formattedBalances.USD}
            </Text>
          </View>
          <View
            style={[
              styles.separator,
              { backgroundColor: dynamicColors.border },
            ]}
          />
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceLabel, { color: dynamicColors.text }]}>
              EUR
            </Text>
            <Text style={[styles.balance, { color: dynamicColors.primary }]}>
              {formattedBalances.EUR}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.formCard,
            { backgroundColor: dynamicColors.bgSecondary },
          ]}
        >
          <Text style={[styles.label, { color: dynamicColors.textSecondary }]}>
            Deposit Funds
          </Text>
          <TouchableOpacity style={styles.depositButton} onPress={openModal}>
            <Text style={styles.depositButtonText}>Deposit Funds</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.formCard,
            { backgroundColor: dynamicColors.bgSecondary },
          ]}
        >
          <Text style={[styles.label, { color: dynamicColors.textSecondary }]}>
            Convert Currency
          </Text>

          <TouchableOpacity
            style={[styles.depositButton, styles.convertButton]}
            onPress={openConvertModal}
          >
            <Text style={styles.depositButtonText}>Convert Currency</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.historyCard,
            { backgroundColor: dynamicColors.bgSecondary },
          ]}
        >
          <Text style={[styles.historyTitle, { color: dynamicColors.text }]}>
            Deposit History
          </Text>
          {history.length === 0 ? (
            <Text
              style={[
                styles.emptyHistory,
                { color: dynamicColors.textSecondary },
              ]}
            >
              No deposits yet
            </Text>
          ) : (
            history.map(entry => (
              <View
                key={entry.id}
                style={[
                  styles.historyRow,
                  { borderBottomColor: dynamicColors.border },
                ]}
              >
                <View style={styles.historyLeft}>
                  <Text
                    style={[styles.historyDate, { color: dynamicColors.text }]}
                  >
                    {entry.date}
                  </Text>
                  <Text
                    style={[
                      styles.historyCurrency,
                      { color: dynamicColors.textSecondary },
                    ]}
                  >
                    {entry.currency}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.historyAmount,
                    { color: dynamicColors.primary },
                  ]}
                >
                  {entry.currency === 'USD' ? '$' : '€'}
                  {entry.amount.toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>

      <Modal
        transparent
        visible={showModal}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View
          style={[
            styles.modalBackdrop,
            { backgroundColor: dynamicColors.shadow },
          ]}
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: dynamicColors.bgSecondary },
            ]}
          >
            <Text style={[styles.modalTitle, { color: dynamicColors.primary }]}>
              New Deposit
            </Text>

            <Text style={[styles.fieldLabel, { color: dynamicColors.text }]}>
              Date
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: dynamicColors.bg,
                  color: dynamicColors.text,
                  borderColor: dynamicColors.border,
                },
              ]}
              placeholder={dateFormat}
              value={displayDate}
              onChangeText={text => {
                const parsed = parseDate(text, dateFormat);
                setDate(parsed);
              }}
              placeholderTextColor={dynamicColors.textSecondary}
            />

            <Text style={[styles.fieldLabel, { color: dynamicColors.text }]}>
              Amount
            </Text>
            <View
              style={[
                styles.inputContainer,
                { borderColor: dynamicColors.border },
              ]}
            >
              <Text
                style={[styles.currencySymbol, { color: dynamicColors.text }]}
              >
                {currency === 'USD' ? '$' : '€'}
              </Text>
              <TextInput
                style={[
                  styles.amountInput,
                  {
                    backgroundColor: dynamicColors.bg,
                    color: dynamicColors.text,
                  },
                ]}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={dynamicColors.textSecondary}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: dynamicColors.text }]}>
              Currency
            </Text>
            <View style={styles.currencyChips}>
              {currencies.map(code => {
                const active = currency === code;
                return (
                  <TouchableOpacity
                    key={code}
                    style={[
                      styles.chip,
                      active && styles.chipActive,
                      {
                        backgroundColor: active
                          ? dynamicColors.primary
                          : dynamicColors.bg,
                        borderColor: dynamicColors.border,
                      },
                    ]}
                    onPress={() => setCurrency(code)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active && styles.chipTextActive,
                        { color: active ? '#fff' : dynamicColors.text },
                      ]}
                    >
                      {code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: dynamicColors.bg,
                    borderColor: dynamicColors.border,
                  },
                ]}
                onPress={closeModal}
              >
                <Text
                  style={[styles.secondaryText, { color: dynamicColors.text }]}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.primaryButton,
                  { backgroundColor: dynamicColors.primary },
                ]}
                onPress={handleSubmit}
              >
                <Text style={styles.primaryText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={showConvertModal}
        animationType="slide"
        onRequestClose={closeConvertModal}
      >
        <View
          style={[
            styles.modalBackdrop,
            { backgroundColor: dynamicColors.shadow },
          ]}
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: dynamicColors.bgSecondary },
            ]}
          >
            <Text style={[styles.modalTitle, { color: dynamicColors.primary }]}>
              Convert Currency
            </Text>

            <Text style={[styles.fieldLabel, { color: dynamicColors.text }]}>
              From
            </Text>
            <View style={styles.currencyChips}>
              {currencies.map(code => {
                const active = convertFrom === code;
                return (
                  <TouchableOpacity
                    key={code}
                    style={[
                      styles.chip,
                      active && styles.chipActive,
                      {
                        backgroundColor: active
                          ? dynamicColors.primary
                          : dynamicColors.bg,
                        borderColor: dynamicColors.border,
                      },
                    ]}
                    onPress={() => setConvertFrom(code)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active && styles.chipTextActive,
                        { color: active ? '#fff' : dynamicColors.text },
                      ]}
                    >
                      {code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: dynamicColors.text }]}>
              Available Balance
            </Text>
            <Text
              style={[styles.balanceInfo, { color: dynamicColors.primary }]}
            >
              {convertFrom === 'USD' ? '$' : '€'}
              {balances[convertFrom].toFixed(2)}
            </Text>

            <Text style={[styles.fieldLabel, { color: dynamicColors.text }]}>
              Amount
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: dynamicColors.bg,
                  color: dynamicColors.text,
                  borderColor: dynamicColors.border,
                },
              ]}
              placeholder="0.00"
              value={convertAmount}
              onChangeText={setConvertAmount}
              keyboardType="decimal-pad"
              placeholderTextColor={dynamicColors.textSecondary}
            />

            <View style={styles.rateContainer}>
              <View style={styles.rateDisplaySection}>
                <Text
                  style={[styles.fieldLabel, { color: dynamicColors.text }]}
                >
                  Rate (1 {convertFrom} →)
                </Text>
                <Text
                  style={[styles.rateText, { color: dynamicColors.primary }]}
                >
                  {rateDisplay}
                </Text>
                {!!rateInfo && (
                  <Text
                    style={[
                      styles.rateSub,
                      { color: dynamicColors.textSecondary },
                    ]}
                  >
                    {rateInfo}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.swapButton,
                  { backgroundColor: dynamicColors.primary },
                ]}
                onPress={handleSwapCurrency}
              >
                <Text style={styles.swapButtonText}>⇅</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: dynamicColors.text }]}>
              Custom Rate (optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: dynamicColors.bg,
                  color: dynamicColors.text,
                  borderColor: dynamicColors.border,
                },
              ]}
              placeholder={eurToUsd.toFixed(4)}
              value={customRate}
              onChangeText={setCustomRate}
              keyboardType="decimal-pad"
              placeholderTextColor={dynamicColors.textSecondary}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: dynamicColors.bg,
                    borderColor: dynamicColors.border,
                  },
                ]}
                onPress={closeConvertModal}
              >
                <Text
                  style={[styles.secondaryText, { color: dynamicColors.text }]}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.primaryButton,
                  { backgroundColor: dynamicColors.primary },
                ]}
                onPress={handleConvert}
              >
                <Text style={styles.primaryText}>Convert</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  content: {
    paddingHorizontal: 20,
    gap: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  balance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a73e8',
    marginLeft: 12,
  },
  amountInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  depositButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  convertButton: {
    backgroundColor: '#0f9d58',
  },
  depositButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyCard: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a73e8',
    marginBottom: 10,
  },
  emptyHistory: {
    color: '#999',
    fontSize: 13,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyLeft: {
    gap: 2,
  },
  historyDate: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  historyCurrency: {
    fontSize: 12,
    color: '#888',
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a73e8',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a73e8',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginTop: 6,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  currencyChips: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  chipActive: {
    borderColor: '#1a73e8',
    backgroundColor: '#e8f1ff',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
  },
  chipTextActive: {
    color: '#1a73e8',
  },
  rateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  rateSub: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  balanceInfo: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 6,
  },
  rateDisplaySection: {
    flex: 1,
  },
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  swapButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#eef1f4',
  },
  secondaryText: {
    color: '#4a5568',
    fontWeight: '600',
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#1a73e8',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default AddCapital;
