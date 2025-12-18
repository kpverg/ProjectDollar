import React, { useEffect, useMemo, useState } from 'react';
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

const currencies = ['USD', 'EUR'];

const AddCapital = ({ onBack }) => {
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

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch(
          'https://api.exchangerate.host/latest?base=EUR&symbols=USD',
        );
        const data = await res.json();
        const rate = Number(data?.rates?.USD);
        if (!Number.isNaN(rate) && rate > 0) {
          setEurToUsd(rate);
          setRateInfo(`Live: 1 EUR = ${rate.toFixed(4)} USD`);
        } else {
          setRateInfo('Using fallback rate 1.08');
        }
      } catch (err) {
        setRateInfo('Using fallback rate 1.08');
      }
    };

    fetchRate();
  }, []);

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

    setBalances(prev => ({
      ...prev,
      [currency]: parseFloat((prev[currency] + value).toFixed(2)),
    }));

    setHistory(prev => [
      {
        id: Date.now().toString(),
        date,
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

    const rate = eurToUsd || 1.08;
    const converted = from === 'USD' ? value / rate : value * rate;

    setBalances(prev => ({
      ...prev,
      [from]: parseFloat((prev[from] - value).toFixed(2)),
      [to]: parseFloat((prev[to] + converted).toFixed(2)),
    }));

    setConvertAmount('');
    setConvertFrom('USD');
    setShowConvertModal(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Add Capitals</Text>
        <Text style={styles.subtitle}>Deposit funds to your account</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Current Balances</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>USD</Text>
            <Text style={styles.balance}>{formattedBalances.USD}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>EUR</Text>
            <Text style={styles.balance}>{formattedBalances.EUR}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Deposit Funds</Text>
          <TouchableOpacity style={styles.depositButton} onPress={openModal}>
            <Text style={styles.depositButtonText}>Deposit Funds</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Convert Currency</Text>

          <TouchableOpacity
            style={[styles.depositButton, styles.convertButton]}
            onPress={openConvertModal}
          >
            <Text style={styles.depositButtonText}>Convert Currency</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Deposit History</Text>
          {history.length === 0 ? (
            <Text style={styles.emptyHistory}>No deposits yet</Text>
          ) : (
            history.map(entry => (
              <View key={entry.id} style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyDate}>{entry.date}</Text>
                  <Text style={styles.historyCurrency}>{entry.currency}</Text>
                </View>
                <Text style={styles.historyAmount}>
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
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Deposit</Text>

            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput
              style={styles.input}
              placeholder="DD-MM-YYYY"
              value={date}
              onChangeText={setDate}
            />

            <Text style={styles.fieldLabel}>Amount</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>
                {currency === 'USD' ? '$' : '€'}
              </Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholderTextColor="#ccc"
              />
            </View>

            <Text style={styles.fieldLabel}>Currency</Text>
            <View style={styles.currencyChips}>
              {currencies.map(code => {
                const active = currency === code;
                return (
                  <TouchableOpacity
                    key={code}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setCurrency(code)}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={closeModal}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleSubmit}>
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
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Convert Currency</Text>

            <Text style={styles.fieldLabel}>From</Text>
            <View style={styles.currencyChips}>
              {currencies.map(code => {
                const active = convertFrom === code;
                return (
                  <TouchableOpacity
                    key={code}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setConvertFrom(code)}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={convertAmount}
              onChangeText={setConvertAmount}
              keyboardType="decimal-pad"
              placeholderTextColor="#ccc"
            />

            <Text style={styles.fieldLabel}>Rate</Text>
            <Text style={styles.rateText}>{rateDisplay}</Text>
            {!!rateInfo && <Text style={styles.rateSub}>{rateInfo}</Text>}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={closeConvertModal}
              >
                <Text style={styles.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleConvert}>
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
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  rateSub: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
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
