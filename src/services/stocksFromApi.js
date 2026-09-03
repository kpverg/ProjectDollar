import { getPortfolio } from '../../api/connectViaAPI';

const normalizeTicker = value => {
  if (!value) return '';
  const cleaned = String(value).trim();
  return cleaned.split('.')[0].trim().toUpperCase();
};

const toNumber = value => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const mapTradernetPositionToAsset = position => {
  if (!position || typeof position !== 'object') return null;

  const symbol = normalizeTicker(position.i || position.symbol || position.base_contract_code);
  const name = position.name || position.name2 || symbol || 'Unknown stock';
  const quantity = toNumber(position.q);
  const marketPrice = toNumber(position.mkt_price ?? position.close_price ?? position.price_a ?? 0);
  const buyPrice = toNumber(position.bal_price_a ?? position.price_a ?? position.avg_price ?? position.buy_price ?? 0);
  const totalValue = toNumber(position.market_value ?? marketPrice * quantity);
  const profitClose = toNumber(position.profit_close ?? 0);
  const openBalance = toNumber(position.open_bal ?? buyPrice * quantity ?? 0);
  const returnPercent = openBalance > 0 ? ((profitClose / openBalance) * 100) : 0;

  const isoDate = position.sql_exec_tm || position.sql_signal_tm || new Date().toISOString();

  return {
    symbol,
    name,
    price: marketPrice.toFixed(2),
    currentPrice: marketPrice.toFixed(2),
    marketPrice: marketPrice.toFixed(2),
    buyPrice: buyPrice.toFixed(2),
    bal_price_a: buyPrice,
    mkt_price: marketPrice,
    quantity: String(quantity),
    totalValue: totalValue.toFixed(2),
    purchaseDate: new Date(isoDate).toISOString().slice(0, 10),
    logoUrl: '',
    currency: position.base_currency || position.curr || 'USD',
    source: 'tradernet',
    profit_close: profitClose,
    open_bal: openBalance,
    returnPercent,
  };
};

export const mapTradernetPortfolioToAssets = apiResponse => {
  const portfolio = apiResponse?.result?.ps;
  const positions = Array.isArray(portfolio?.pos) ? portfolio.pos : [];

  const assets = positions
    .map(mapTradernetPositionToAsset)
    .filter(Boolean);

  return assets;
};

export const getPortfolioSummaryFromApi = apiResponse => {
  const portfolio = apiResponse?.result?.ps;
  const positions = Array.isArray(portfolio?.pos) ? portfolio.pos : [];
  const balances = Array.isArray(portfolio?.acc) ? portfolio.acc : [];

  const positionValue = positions.reduce((sum, position) => {
    const value = Number(position.market_value ?? position.mkt_price * position.q ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const cashValue = balances.reduce((sum, balance) => {
    const amount = Number(balance.s ?? 0);
    const converted = Number(balance.currval ?? 1);
    const value = amount * converted;
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  return {
    totalValueUSD: positionValue + cashValue,
    positionValueUSD: positionValue,
    cashValueUSD: cashValue,
    assets: mapTradernetPortfolioToAssets(apiResponse),
    balances,
  };
};

export const loadPortfolioAssetsFromApi = async () => {
  try {
    const response = await getPortfolio();
    const assets = mapTradernetPortfolioToAssets(response);
    return assets;
  } catch (error) {
    console.warn('[StocksFromApi] Failed to load Tradernet portfolio:', error?.message || error);
    return [];
  }
};

export const loadPortfolioSummaryFromApi = async () => {
  try {
    const response = await getPortfolio();
    const summary = getPortfolioSummaryFromApi(response);
    return summary;
  } catch (error) {
    console.warn('[StocksFromApi] Failed to calculate portfolio summary:', error?.message || error);
    return {
      totalValueUSD: 0,
      positionValueUSD: 0,
      cashValueUSD: 0,
      assets: [],
      balances: [],
    };
  }
};

export const loadBalancesFromApi = async () => {
  try {
    const response = await getPortfolio();
    const portfolio = response?.result?.ps;
    const balancesArray = Array.isArray(portfolio?.acc) ? portfolio.acc : [];

    let usd = 0;
    let eur = 0;

    balancesArray.forEach(item => {
      const curr = String(item.curr || item.currency || '').toUpperCase();
      const amount = Number(item.s ?? item.amount ?? item.free ?? item.cash ?? 0);
      if (Number.isFinite(amount)) {
        if (curr === 'USD') usd += amount;
        else if (curr === 'EUR') eur += amount;
      }
    });

    return { USD: usd, EUR: eur, raw: balancesArray };
  } catch (error) {
    console.warn('[StocksFromApi] Failed to load balances from API:', error?.message || error);
    return { USD: 0, EUR: 0, raw: [], error: error?.message };
  }
};
