/**
 * Tradernet API Connection
 * Handles authentication and requests to the Tradernet API
 * using HMAC-SHA256 signed requests.
 *
 * Usage:
 *   import { getPortfolio } from '../api/connectViaAPI';
 *   const portfolio = await getPortfolio();
 */

import { HmacSHA256 } from 'crypto-js';
import keys from './keys.json';

// ─── Configuration ────────────────────────────────────────────────────────────
const PUBLIC_KEY = keys.tradernet.publicKey;
const PRIVATE_KEY = keys.tradernet.privateKey;

const BASE_URL = 'https://tradernet.com/api';

let currentSid = keys.tradernet.currentSid || '';

export function getCurrentSid() {
  return currentSid || keys.tradernet.currentSid || '';
}

export function setCurrentSid(newSid) {
  if (newSid && typeof newSid === 'string') {
    currentSid = newSid;
    keys.tradernet.currentSid = newSid;
  }
}

function extractAndSaveSid(data) {
  const sid =
    data?.sid ||
    data?.SID ||
    data?.result?.sid ||
    data?.result?.SID ||
    data?.result?.sidinfo?.sid;

  if (sid && typeof sid === 'string') {
    setCurrentSid(sid);
  }
}

// ─── Signature Helper ─────────────────────────────────────────────────────────
/**
 * Generates HMAC-SHA256 signature for a request.
 * @param {string} data - The string to sign (payload + timestamp for POST, timestamp for GET)
 * @returns {string} Hex signature
 */
function generateSignature(data) {
  return HmacSHA256(data, PRIVATE_KEY).toString();
}

// ─── Core Request ─────────────────────────────────────────────────────────────
/**
 * Makes a signed POST request to the Tradernet API.
 * @param {string} command - API command/endpoint (e.g. 'getPositions')
 * @param {object} params - Request payload parameters
 * @returns {Promise<object>} Parsed JSON response
 */
async function callApi(command, params = {}) {
  const activeSid = getCurrentSid();
  const requestParams = { ...params };
  if (activeSid && !requestParams.sid && !requestParams.SID) {
    requestParams.sid = activeSid;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = JSON.stringify({ cmd: command, params: requestParams });

  const headers = {
    'Content-Type': 'application/json',
    'X-NtApi-PublicKey': PUBLIC_KEY,
    'X-NtApi-Timestamp': timestamp,
    'X-NtApi-Sig': generateSignature(payload + timestamp),
  };

  const response = await fetch(`${BASE_URL}/${command}`, {
    method: 'POST',
    headers,
    body: payload,
  });

  const data = await response.json();
  console.log(`[Tradernet API] POST /${command} response:`, JSON.stringify(data, null, 2));

  extractAndSaveSid(data);

  if (data.error) {
    throw new Error(`Tradernet API error: ${data.error} — ${data.errMsg ?? ''}`);
  }

  return data;
}

/**
 * Makes a signed GET request to the Tradernet API.
 * @param {string} command - API command/endpoint
 * @param {object} params - Query string parameters
 * @returns {Promise<object>} Parsed JSON response
 */
export async function callApiGet(command, params = {}) {
  const activeSid = getCurrentSid();
  const requestParams = { ...params };
  if (activeSid && !requestParams.sid && !requestParams.SID) {
    requestParams.sid = activeSid;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();

  const queryString = new URLSearchParams({ ...requestParams }).toString();
  const url = queryString
    ? `${BASE_URL}/${command}?${queryString}`
    : `${BASE_URL}/${command}`;

  const headers = {
    'X-NtApi-PublicKey': PUBLIC_KEY,
    'X-NtApi-Timestamp': timestamp,
    'X-NtApi-Sig': generateSignature(timestamp), // GET: sign only timestamp
  };

  const response = await fetch(url, { method: 'GET', headers });
  const data = await response.json();
  console.log(`[Tradernet API] GET /${command} response:`, JSON.stringify(data, null, 2));

  extractAndSaveSid(data);

  if (data.error) {
    throw new Error(`Tradernet API error: ${data.error} — ${data.errMsg ?? ''}`);
  }

  return data;
}

// ─── Portfolio Endpoints ──────────────────────────────────────────────────────

/**
 * Fetch current portfolio positions.
 * @returns {Promise<object>} Portfolio positions from Tradernet
 */
export async function getPortfolio() {
  return callApi('getPositionJson', {});
}

/**
 * Fetch account balance / cash info.
 * @returns {Promise<object>} Account balance data
 */
export async function getBalance() {
  return callApi('auth-get-opq', {});
}

/**
 * Fetch order history.
 * @param {object} options - Optional filters (e.g. { limit: 50 })
 * @returns {Promise<object>} Order history
 */
export async function getOrders(options = {}) {
  return callApi('orders-get-current-history', options);
}

/**
 * Fetch account info (name, currency, etc.).
 * @returns {Promise<object>} Account info
 */
export async function getAccountInfo() {
  return callApi('auth-get-sidinfo', {});
}

/**
 * Fetch cross rates for currency pair(s) from Tradernet API.
 * @param {string} baseCurrency - e.g. "USD" or "EUR"
 * @param {string[]} currencies - e.g. ["EUR", "HKD"] or ["USD"]
 * @returns {Promise<object>} Cross rates
 */
export async function getCrossRates(baseCurrency = 'EUR', currencies = ['USD']) {
  return callApi('getCrossRatesForDate', {
    base_currency: baseCurrency,
    currencies,
  });
}

/**
 * Fetch user cash flows from Tradernet API.
 * @param {object} params - Parameters (take, skip, groupByType, filters, sort, etc.)
 * @returns {Promise<object>} Cash flows data
 */
export async function getUserCashFlowsApi(params = {}) {
  return callApi('getUserCashFlows', params);
}

// ─── Quick Test ───────────────────────────────────────────────────────────────
/**
 * Call this once from any component to test the API connection.
 * Results will appear in the Metro/LogCat console.
 *
 * Example usage in a component:
 *   import { testConnection } from '../api/connectViaAPI';
 *   useEffect(() => { testConnection(); }, []);
 */
export async function testConnection() {
  console.log('[Tradernet API] Testing connection...');
  try {
    const portfolio = await getPortfolio();
    console.log('[Tradernet API] ✅ Portfolio:', JSON.stringify(portfolio, null, 2));
  } catch (e) {
    console.error('[Tradernet API] ❌ Error:', e.message);
  }
}
