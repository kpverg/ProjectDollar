import { getUserCashFlowsApi } from '../../api/connectViaAPI';

/**
 * Fetch cash flows from Tradernet API with options.
 *
 * @param {object} options
 * @param {number} [options.months] - Number of past months to display (e.g. 1, 3, 6, 12, 24)
 * @param {string} [options.dateFrom] - Start date 'YYYY-MM-DD'
 * @param {string} [options.dateTo] - End date 'YYYY-MM-DD'
 * @param {number} [options.take=500] - Number of items to fetch
 * @param {number} [options.skip=0] - Offset
 * @param {number} [options.groupByType=1] - Group by type (1 or 0)
 * @param {number} [options.cashTotals=1] - Display transaction totals per day (1 or 0)
 * @param {number} [options.withoutRefund=1] - Exclude refunds (1 or 0)
 * @param {Array} [options.filters] - Array of filter objects [{ field, operator, value }]
 * @param {Array} [options.sort] - Array of sort objects [{ field, dir: 'ASC'|'DESC' }]
 * @returns {Promise<{ total: number, cashflow: Array, limits: object, cashTotals: object, raw: object }>}
 */
export const getCashFlowsFromApi = async (options = {}) => {
  try {
    const filters = options.filters ? [...options.filters] : [];

    let effectiveDateFrom = options.dateFrom;

    // Calculate dateFrom automatically if options.months is passed
    if (options.months && typeof options.months === 'number' && options.months > 0) {
      const d = new Date();
      d.setMonth(d.getMonth() - options.months);
      effectiveDateFrom = d.toISOString().slice(0, 10);
    }

    if (effectiveDateFrom) {
      filters.push({
        field: 'date',
        operator: 'eqormore',
        value: effectiveDateFrom,
      });
    }

    if (options.dateTo) {
      filters.push({
        field: 'date',
        operator: 'eqorless',
        value: options.dateTo,
      });
    }

    const params = {
      take: options.take ?? 500,
      skip: options.skip ?? 0,
      groupByType: options.groupByType ?? 1,
      cash_totals: options.cashTotals ?? 1,
      without_refund: options.withoutRefund ?? 1,
      ...(options.userId ? { user_id: options.userId } : {}),
      ...(filters.length > 0 ? { filters } : {}),
      ...(options.sort ? { sort: options.sort } : {}),
    };

    const response = await getUserCashFlowsApi(params);
    const result = response?.result || response;

    const cashflowList = Array.isArray(result?.cashflow)
      ? result.cashflow
      : typeof result?.cashflow === 'object' && result?.cashflow !== null
      ? Object.values(result.cashflow)
      : [];

    return {
      total: result?.total ?? cashflowList.length,
      cashflow: cashflowList,
      limits: result?.limits || {},
      cashTotals: result?.cash_totals || {},
      raw: response,
    };
  } catch (error) {
    console.warn('[CashFlowFromApi] Error fetching cash flows:', error?.message || error);
    return {
      total: 0,
      cashflow: [],
      limits: {},
      cashTotals: {},
      error: error?.message || String(error),
    };
  }
};

/**
 * Script function to fetch and print cashflows directly to DevTools / Metro Console.
 *
 * @param {object} options
 */
export const logCashFlowsToConsole = async (options = {}) => {
  console.log('[CashFlowFromApi] 🔄 Fetching cash flows from Tradernet API...');
  const data = await getCashFlowsFromApi(options);

  if (data.error) {
    console.error('[CashFlowFromApi] ❌ Error:', data.error);
    return;
  }

  console.log(`[CashFlowFromApi] ✅ Total CashFlow Records: ${data.total}`);
  console.log('[CashFlowFromApi] 📊 CashFlow List:', JSON.stringify(data.cashflow, null, 2));
  if (data.cashTotals) {
    console.log('[CashFlowFromApi] 💰 Cash Totals:', JSON.stringify(data.cashTotals, null, 2));
  }
  return data;
};
