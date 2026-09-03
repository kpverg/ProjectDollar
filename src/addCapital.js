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
  ActivityIndicator,
} from 'react-native';
import { AppContext } from './AppContext';
import { loadBalancesFromApi } from './services/stocksFromApi';
import { fetchEURUSDExchangeRate } from './services/exchangeRateApi';
import { getCashFlowsFromApi } from './services/cashflowFromApi';

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
  const { dateFormat, getColors } = useContext(AppContext);
  const dynamicColors = getColors();
  const [apiBalances, setApiBalances] = useState({ USD: 0, EUR: 0 });
  const [loadingApiBalances, setLoadingApiBalances] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [convertAmount, setConvertAmount] = useState('');
  const [convertFrom, setConvertFrom] = useState('USD');
  const [eurToUsd, setEurToUsd] = useState(1.08);
  const [customRate, setCustomRate] = useState('');
  const [rateInfo, setRateInfo] = useState('');
  const [allCashflows, setAllCashflows] = useState([]);
  const [loadingCashflows, setLoadingCashflows] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState('total');
  const [selectedType, setSelectedType] = useState(null);

  const fetchApiBalances = async () => {
    setLoadingApiBalances(true);
    const res = await loadBalancesFromApi();
    if (res) {
      setApiBalances({ USD: res.USD, EUR: res.EUR });
    }
    setLoadingApiBalances(false);
  };

  const fetchAllCashflows = async () => {
    setLoadingCashflows(true);
    const params = { groupByType: 0, take: 10000 };
    const res = await getCashFlowsFromApi(params);
    if (res && res.cashflow) {
      let flattenedFlows = [];
      if (Array.isArray(res.cashflow)) {
        flattenedFlows = res.cashflow;
      } else if (typeof res.cashflow === 'object') {
        Object.values(res.cashflow).forEach(item => {
          if (Array.isArray(item)) {
            flattenedFlows = flattenedFlows.concat(item);
          } else {
            flattenedFlows.push(item);
          }
        });
      }
      setAllCashflows(flattenedFlows);
    }
    setLoadingCashflows(false);
  };

  // 1) Client-side filtering by selected months
  const filteredByMonths = useMemo(() => {
    if (!selectedMonths || selectedMonths === 'total') {
      return allCashflows;
    }
    const monthsNum =
      typeof selectedMonths === 'number'
        ? selectedMonths
        : parseInt(selectedMonths, 10);
    if (Number.isNaN(monthsNum) || monthsNum <= 0) {
      return allCashflows;
    }
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - monthsNum);
    const cutoffStr = cutoff.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    return allCashflows.filter(flow => {
      if (!flow.date) return true;
      const itemDate = flow.date.slice(0, 10);
      return itemDate >= cutoffStr;
    });
  }, [allCashflows, selectedMonths]);

  // 2) Client-side extraction of available unique categories/types in the selected period
  const availableTypes = useMemo(() => {
    const typesSet = new Set();
    filteredByMonths.forEach(flow => {
      if (flow.type_code) {
        typesSet.add(flow.type_code);
      }
    });
    return Array.from(typesSet).sort();
  }, [filteredByMonths]);

  // 3) Auto-select type when available types change
  useEffect(() => {
    if (availableTypes.length > 0) {
      if (!selectedType || !availableTypes.includes(selectedType)) {
        setSelectedType(availableTypes[0]);
      }
    } else {
      setSelectedType(null);
    }
  }, [availableTypes, selectedType]);

  // 4) Client-side filtering by selected type
  const displayedFlows = useMemo(() => {
    if (!selectedType) return [];
    return filteredByMonths.filter(flow => flow.type_code === selectedType);
  }, [filteredByMonths, selectedType]);

  const getFlowAmount = (flow) => {
    return flow.s || flow.sum || flow.amount || flow.value || '0';
  };

  const getFlowCurrency = (flow) => {
    return flow.currency || flow.curr || 'USD';
  };

  // 5) Compute summary (count & total amount per currency) for each type in filteredByMonths
  const typeSummaries = useMemo(() => {
    const map = {};
    filteredByMonths.forEach(flow => {
      const type = flow.type_code;
      if (!type) return;
      if (!map[type]) {
        map[type] = { count: 0, currMap: {} };
      }
      map[type].count += 1;
      const amt = parseFloat(getFlowAmount(flow)) || 0;
      const curr = getFlowCurrency(flow);
      map[type].currMap[curr] = (map[type].currMap[curr] || 0) + amt;
    });

    const result = {};
    Object.keys(map).forEach(type => {
      const { count, currMap } = map[type];
      const parts = Object.entries(currMap).map(([curr, sum]) => {
        const formattedSum = sum.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        const sign = sum > 0 ? '+' : '';
        return `${sign}${formattedSum} ${curr}`;
      });
      result[type] = {
        count,
        totalText: parts.join(' / '),
      };
    });
    return result;
  }, [filteredByMonths]);

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
    const { rate, rateInfo: info } = await fetchEURUSDExchangeRate();
    setEurToUsd(rate);
    setRateInfo(info);
  };

  // Load balances and fetch rate and all cashflows on app load
  useEffect(() => {
    fetchExchangeRate();
    fetchApiBalances();
    fetchAllCashflows();
  }, []);

  // Refresh rate when convert modal opens
  useEffect(() => {
    if (showConvertModal) {
      fetchExchangeRate();
      const interval = setInterval(fetchExchangeRate, 60000); // 1 minute interval to avoid API rate limits
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

  const handleConvert = () => {
    const value = parseFloat(convertAmount.replace(',', '.'));
    if (Number.isNaN(value) || value <= 0) {
      return;
    }

    const from = convertFrom;

    if (apiBalances[from] < value) {
      return;
    }

    // Use custom rate if provided, otherwise use live rate
    const rate = customRate ? parseFloat(customRate) : eurToUsd || 1.08;
    if (!rate || rate <= 0) {
      return;
    }

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
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.label, { color: dynamicColors.textSecondary }]}>
              Current Balances
            </Text>
            <TouchableOpacity
              onPress={() => {
                fetchApiBalances();
                fetchExchangeRate();
              }}
              disabled={loadingApiBalances}
            >
              {loadingApiBalances ? (
                <ActivityIndicator size="small" color={dynamicColors.primary} />
              ) : (
                <Text style={[styles.refreshText, { color: dynamicColors.primary }]}>
                  1 EUR = {eurToUsd.toFixed(4)} USD
                </Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceLabel, { color: dynamicColors.text }]}>
              USD
            </Text>
            <Text style={[styles.balance, { color: dynamicColors.primary }]}>
              ${apiBalances.USD.toFixed(2)}
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
              €{apiBalances.EUR.toFixed(2)}
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
          <View style={styles.historyHeaderRow}>
            <Text style={[styles.historyTitle, { color: dynamicColors.text }]}>
              Cash Flow History
            </Text>
            {loadingCashflows && (
              <ActivityIndicator size="small" color={dynamicColors.primary} />
            )}
          </View>

          <View style={styles.monthsSelector}>
            {['1', '3', '6', '12', 'TOTAL'].map(monthLabel => {
              const monthValue =
                monthLabel === 'TOTAL' ? 'total' : parseInt(monthLabel, 10);
              const isActive = selectedMonths === monthValue;
              const monthButtonBg = isActive
                ? dynamicColors.primary
                : dynamicColors.bg;
              const monthButtonBorder = isActive
                ? dynamicColors.primary
                : dynamicColors.border;
              const monthButtonTextColor = isActive ? '#fff' : dynamicColors.text;
              return (
                <TouchableOpacity
                  key={monthLabel}
                  style={[
                    styles.monthButton,
                    {
                      backgroundColor: monthButtonBg,
                      borderColor: monthButtonBorder,
                    },
                  ]}
                  onPress={() => {
                    setSelectedMonths(monthValue);
                  }}
                >
                  <Text
                    style={[
                      styles.monthButtonText,
                      { color: monthButtonTextColor },
                    ]}
                  >
                    {monthLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {allCashflows.length === 0 ? (
            <Text
              style={[
                styles.emptyHistory,
                { color: dynamicColors.textSecondary },
              ]}
            >
              {loadingCashflows ? 'Loading cash flows...' : 'No cash flows available'}
            </Text>
          ) : (
            <View style={styles.cashflowsContainerWrapper}>
              {/* Type Selector Dropdown */}
              <View style={styles.typeDropdownContainer}>
                <Text
                  style={[
                    styles.typeDropdownLabel,
                    { color: dynamicColors.textSecondary },
                  ]}
                >
                  Type:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.typeButtonsScroll}
                >
                  {availableTypes.map(type => {
                    const isActive = selectedType === type;
                    const summary = typeSummaries[type];
                    const count = summary?.count || 0;
                    const totalText = summary?.totalText || '';
                    const typeBtnBg = isActive
                      ? dynamicColors.primary
                      : dynamicColors.bg;
                    const typeBtnTextColor = isActive
                      ? '#fff'
                      : dynamicColors.text;
                    const subTextColor = isActive
                      ? 'rgba(255, 255, 255, 0.85)'
                      : dynamicColors.textSecondary;

                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeButton,
                          {
                            backgroundColor: typeBtnBg,
                            borderColor: isActive
                              ? dynamicColors.primary
                              : dynamicColors.border,
                          },
                        ]}
                        onPress={() => setSelectedType(type)}
                      >
                        <Text
                          style={[
                            styles.typeButtonText,
                            { color: typeBtnTextColor },
                          ]}
                        >
                          {type.replace(/_/g, ' ')} ({count})
                        </Text>
                        {totalText ? (
                          <Text
                            style={[
                              styles.typeButtonSubText,
                              { color: subTextColor },
                            ]}
                          >
                            {totalText}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Cashflows List for Selected Type */}
              <ScrollView
                style={styles.cashflowsContainer}
                nestedScrollEnabled={true}
              >
                {!selectedType || displayedFlows.length === 0 ? (
                  <Text
                    style={[
                      styles.emptyHistory,
                      { color: dynamicColors.textSecondary },
                    ]}
                  >
                    No records for this type in selected period
                  </Text>
                ) : (
                  <View>
                    <Text
                      style={[
                        styles.cashflowTypeTitle,
                        { color: dynamicColors.primary },
                      ]}
                    >
                      {selectedType.replace(/_/g, ' ').toUpperCase()} ({displayedFlows.length})
                      {typeSummaries[selectedType]?.totalText
                        ? `  •  ${typeSummaries[selectedType].totalText}`
                        : ''}
                    </Text>
                    {displayedFlows.map((flow, idx) => {
                      const flowDisplayAmount = getFlowAmount(flow);
                      const flowDisplayCurrency = getFlowCurrency(flow);
                      const flowAmount = parseFloat(flowDisplayAmount);
                      const amountColor =
                        flowAmount < 0 ? '#ff6b6b' : dynamicColors.primary;
                      return (
                        <View
                          key={flow.id || idx}
                          style={[
                            styles.historyRow,
                            { borderBottomColor: dynamicColors.border },
                          ]}
                        >
                          <View style={styles.historyLeft}>
                            <Text
                              style={[
                                styles.historyDate,
                                { color: dynamicColors.text },
                              ]}
                            >
                              {flow.date || 'N/A'}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.historyAmount,
                              { color: amountColor },
                            ]}
                          >
                            {flowDisplayAmount} {flowDisplayCurrency}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </View>
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
                const textColor = active ? '#ffffff' : dynamicColors.text;
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
                    <Text style={[styles.chipText, { color: textColor }]}>
                      {code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[
                  styles.primaryButton,
                  { backgroundColor: dynamicColors.primary },
                ]}
                onPress={closeModal}
              >
                <Text style={styles.primaryText}>Close</Text>
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
                const textColor = active ? '#ffffff' : dynamicColors.text;
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
                    <Text style={[styles.chipText, { color: textColor }]}>
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
              {apiBalances[convertFrom].toFixed(2)}
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '600',
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
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyLeft: {
    flex: 1,
    marginRight: 12,
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
    minWidth: 80,
    textAlign: 'right',
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
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthsSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  monthButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  monthButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cashflowsContainerWrapper: {
    height: 380,
    marginBottom: 10,
  },
  cashflowsContainer: {
    flex: 1,
  },
  typeDropdownContainer: {
    marginBottom: 12,
  },
  typeDropdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    paddingLeft: 4,
  },
  typeButtonsScroll: {
    flexDirection: 'row',
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  typeButtonSubText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  cashflowTypeSection: {
    marginBottom: 14,
  },
  cashflowTypeTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    paddingLeft: 4,
  },
});

export default AddCapital;
