import axios from 'axios';

// Cache for exchange rates
let cachedRate = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetch current EUR/USD exchange rate
 * Uses free exchangerate-api.com service
 */
export const getEURUSDRate = async () => {
  // Return cached rate if still valid
  if (
    cachedRate &&
    cacheTimestamp &&
    Date.now() - cacheTimestamp < CACHE_DURATION
  ) {
    return cachedRate;
  }

  try {
    const response = await axios.get(
      'https://api.exchangerate-api.com/v4/latest/EUR',
    );
    const rate = response.data.rates.USD;

    // Cache the rate
    cachedRate = rate;
    cacheTimestamp = Date.now();

    return rate;
  } catch (error) {
    console.error('Error fetching EUR/USD rate:', error);
    // Return fallback rate if API fails
    return 1.05; // Approximate fallback
  }
};

/**
 * Get historical exchange rates for charting
 * @param {number} days - Number of days of historical data
 */
export const getHistoricalRates = async (days = 30) => {
  try {
    // For simplicity, using a mock data generator
    // In production, you'd use a service like exchangerate-api with historical data
    const data = [];
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Generate mock historical data around current rate
    const baseRate = await getEURUSDRate();

    for (let i = days; i >= 0; i--) {
      const date = new Date(now - i * oneDayMs);
      // Add some random variation to make it realistic
      const variation = (Math.random() - 0.5) * 0.05; // ±2.5% variation
      const rate = baseRate + variation;

      data.push({
        date: date.toISOString().split('T')[0],
        rate: parseFloat(rate.toFixed(4)),
      });
    }

    return data;
  } catch (error) {
    console.error('Error fetching historical rates:', error);
    return [];
  }
};

/**
 * Convert USD to EUR
 */
export const convertUSDToEUR = async usdAmount => {
  const eurUsdRate = await getEURUSDRate();
  return usdAmount / eurUsdRate;
};

/**
 * Convert EUR to USD
 */
export const convertEURToUSD = async eurAmount => {
  const eurUsdRate = await getEURUSDRate();
  return eurAmount * eurUsdRate;
};
