import { getCrossRates } from '../../api/connectViaAPI';

// Cache for Tradernet exchange rate
let cachedTradernetRate = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

/**
 * Fetch cross rate for a currency pair from Tradernet API
 * @param {string} baseCurrency e.g. 'EUR'
 * @param {string} targetCurrency e.g. 'USD'
 * @returns {Promise<number|null>}
 */
export const loadTradernetCrossRate = async (
  baseCurrency = 'EUR',
  targetCurrency = 'USD',
) => {
  // Check cache first to avoid hitting Tradernet rate limits
  if (
    cachedTradernetRate &&
    Date.now() - cacheTimestamp < CACHE_DURATION
  ) {
    return cachedTradernetRate;
  }

  try {
    const response = await getCrossRates(baseCurrency, [targetCurrency]);
    console.log(
      '[ExchangeRateApi] getCrossRates response:',
      JSON.stringify(response),
    );

    if (response?.error) {
      console.warn('[ExchangeRateApi] Tradernet error:', response.error);
      return cachedTradernetRate; // return cached rate if available
    }

    const result = response?.result || response?.data || response;

    let rate = null;
    if (typeof result === 'number') {
      rate = result;
    } else if (typeof result === 'object' && result !== null) {
      if (typeof result[targetCurrency] === 'number') {
        rate = result[targetCurrency];
      } else if (
        result[baseCurrency] &&
        typeof result[baseCurrency][targetCurrency] === 'number'
      ) {
        rate = result[baseCurrency][targetCurrency];
      } else if (typeof result.rate === 'number') {
        rate = result.rate;
      } else {
        const keys = Object.keys(result);
        for (const k of keys) {
          if (typeof result[k] === 'number') {
            rate = result[k];
            break;
          } else if (
            typeof result[k] === 'object' &&
            result[k] !== null &&
            typeof result[k][targetCurrency] === 'number'
          ) {
            rate = result[k][targetCurrency];
            break;
          }
        }
      }
    }

    if (rate) {
      cachedTradernetRate = rate;
      cacheTimestamp = Date.now();
    }

    return rate;
  } catch (error) {
    console.warn(
      '[ExchangeRateApi] Failed to load Tradernet cross rate:',
      error?.message || error,
    );
    return cachedTradernetRate;
  }
};

/**
 * Fetch EUR/USD exchange rate from Tradernet API with fallback
 * @returns {Promise<{ rate: number, rateInfo: string }>}
 */
export const fetchEURUSDExchangeRate = async () => {
  try {
    const tradernetRate = await loadTradernetCrossRate('EUR', 'USD');
    if (
      tradernetRate &&
      typeof tradernetRate === 'number' &&
      tradernetRate > 0
    ) {
      return {
        rate: tradernetRate,
        rateInfo: `Tradernet: 1 EUR = ${tradernetRate.toFixed(4)} USD`,
      };
    }

    const res = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
    const data = await res.json();
    const rate = data?.rates?.USD;
    if (rate && typeof rate === 'number' && rate > 0) {
      return {
        rate,
        rateInfo: `Live: 1 EUR = ${rate.toFixed(4)} USD`,
      };
    }

    return { rate: 1.08, rateInfo: 'Fallback: 1.08' };
  } catch (err) {
    console.log('[ExchangeRateApi] Rate fetch error:', err);
    return { rate: 1.08, rateInfo: 'Fallback: 1.08' };
  }
};
