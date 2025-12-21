import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

const StockPrice = ({ symbol }) => {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!symbol) {
      setLoading(false);
      return;
    }

    const fetchPrice = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(
          `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`,
        );
        const data = await response.json();
        const currentPrice = data.quoteResponse.result[0].regularMarketPrice;
        setPrice(currentPrice);
      } catch (error) {
        console.error('Stock fetch error:', error);
        setError('Could not fetch price');
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
  }, [symbol]);

  if (!symbol) return null;

  if (loading) {
    return <ActivityIndicator size="small" color="#0000ff" />;
  }

  if (error) {
    return <Text style={{ color: 'red', fontSize: 12 }}>{error}</Text>;
  }

  return (
    <View style={{ padding: 10 }}>
      <Text style={{ fontSize: 14 }}>
        {symbol}: ${price?.toFixed(2) || 'N/A'}
      </Text>
    </View>
  );
};

export default StockPrice;
