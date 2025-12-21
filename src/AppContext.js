import React, { createContext, useEffect, useState } from 'react';
import { getPreferences, savePreferences, getAssets } from './storage';

export const AppContext = createContext();

const colorPalettes = {
  blue: '#1a73e8',
  purple: '#7c3aed',
  red: '#dc2626',
  green: '#16a34a',
  lightGreen: '#22c55e',
  orange: '#ea580c',
  pink: '#db2777',
  cyan: '#0891b2',
  amber: '#b45309',
  gray: '#6b7280',
  darkGray: '#374151',
};

export const AppProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [dateFormat, setDateFormat] = useState('DD-MM-YYYY');
  const [primaryColor, setPrimaryColor] = useState('blue');
  const [assets, setAssets] = useState([]);

  // Load persisted preferences on mount
  useEffect(() => {
    (async () => {
      const prefs = await getPreferences();
      if (typeof prefs.darkMode === 'boolean') setDarkMode(prefs.darkMode);
      if (prefs.dateFormat) setDateFormat(prefs.dateFormat);
      if (prefs.primaryColor) setPrimaryColor(prefs.primaryColor);

      // Load assets
      const storedAssets = await getAssets();
      if (Array.isArray(storedAssets)) setAssets(storedAssets);
    })();
  }, []);

  // Persist preferences whenever they change
  useEffect(() => {
    savePreferences({ darkMode, dateFormat, primaryColor });
  }, [darkMode, dateFormat, primaryColor]);

  const getColors = (colorKey = primaryColor) => {
    const primaryHex = colorPalettes[colorKey] || colorPalettes.blue;

    return darkMode
      ? {
          bg: '#1a1a1a',
          bgSecondary: '#2d2d2d',
          text: '#fff',
          textSecondary: '#ccc',
          primary: primaryHex,
          border: '#444',
          shadow: 'rgba(0,0,0,0.5)',
        }
      : {
          bg: '#f8f9fa',
          bgSecondary: '#fff',
          text: '#333',
          textSecondary: '#999',
          primary: primaryHex,
          border: '#ddd',
          shadow: 'rgba(0,0,0,0.1)',
        };
  };

  const colors = getColors();

  return (
    <AppContext.Provider
      value={{
        darkMode,
        setDarkMode,
        dateFormat,
        setDateFormat,
        primaryColor,
        setPrimaryColor,
        colorPalettes,
        colors,
        getColors,
        assets,
        setAssets,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
