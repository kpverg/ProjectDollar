/**
 * Stock Price Service
 * Fetches current market prices for stocks from Yahoo Finance API
 */

const CACHE = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch current price for a single stock symbol
 * @param {string} symbol - Stock symbol (e.g., "AAPL")
 * @returns {Promise<number>} Current price or null if failed
 */
export const fetchStockPrice = async symbol => {
  if (!symbol || symbol === '0') return null;

  // Check cache
  if (CACHE[symbol] && Date.now() - CACHE[symbol].timestamp < CACHE_DURATION) {
    console.log(
      `[StockPrice] Using cached price for ${symbol}: ${CACHE[symbol].price}`,
    );
    return CACHE[symbol].price;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    // Use Alpha Vantage API - same key already used in buildPortfolio.js
    const ALPHA_VANTAGE_KEY = 'BEU3SEYCT8C01J96';
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(
        `[StockPrice] API returned status ${response.status} for ${symbol}`,
      );
      return null;
    }

    const data = await response.json();
    const currentPrice = parseFloat(data['Global Quote']?.['05. price']);

    if (currentPrice && !isNaN(currentPrice)) {
      // Cache the result
      CACHE[symbol] = {
        price: currentPrice,
        timestamp: Date.now(),
      };
      console.log(`[StockPrice] Fetched price for ${symbol}: ${currentPrice}`);
      return currentPrice;
    }
    console.warn(`[StockPrice] No price found for ${symbol}`);
    return null;
  } catch (error) {
    console.error(
      `[StockPrice] Error fetching price for ${symbol}:`,
      error.message,
    );
    return null;
  }
};

/**
 * Fetch current prices for multiple stock symbols
 * @param {Array<string>} symbols - Array of stock symbols
 * @returns {Promise<Object>} Object with symbol as key and price as value
 */
export const fetchStockPrices = async symbols => {
  if (!symbols || symbols.length === 0) return {};

  console.log(`[StockPrice] Fetching prices for: ${symbols.join(', ')}`);
  const prices = {};

  // Fetch all prices in parallel
  const promises = symbols.map(async symbol => {
    const price = await fetchStockPrice(symbol);
    if (price !== null) {
      prices[symbol] = price;
    }
  });

  await Promise.all(promises);
  console.log(`[StockPrice] Fetched prices:`, prices);
  return prices;
};

/**
 * Clear the cache (useful for refresh)
 */
export const clearPriceCache = () => {
  Object.keys(CACHE).forEach(key => {
    delete CACHE[key];
  });
};
