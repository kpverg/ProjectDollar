// Centralized persistence for ProjectDollar using AsyncStorage
// Install dependency: @react-native-async-storage/async-storage
// npm i @react-native-async-storage/async-storage

import AsyncStorage from '@react-native-async-storage/async-storage';

export const STATE_KEY = 'ProjectDollar:state';

const readJson = async key => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.log('Storage read error:', e);
    return null;
  }
};

const writeJson = async (key, obj) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(obj));
  } catch (e) {
    console.log('Storage write error:', e);
  }
};

export const loadState = async () => {
  const state = await readJson(STATE_KEY);
  return state || {};
};

export const saveState = async partial => {
  const current = await loadState();
  const next = { ...current, ...partial };
  await writeJson(STATE_KEY, next);
  return next;
};

// Convenience helpers
export const savePreferences = async prefs => {
  return saveState({ preferences: { ...prefs } });
};

export const saveBalances = async balances => {
  return saveState({ balances: { ...balances } });
};

export const saveAssets = async assets => {
  return saveState({ assets: Array.isArray(assets) ? assets : [] });
};

export const getPreferences = async () => {
  const s = await loadState();
  return s.preferences || {};
};

export const getBalances = async () => {
  const s = await loadState();
  return s.balances || { USD: 0, EUR: 0 };
};

export const getAssets = async () => {
  const s = await loadState();
  return s.assets || [];
};
