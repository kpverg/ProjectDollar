/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar, useColorScheme } from 'react-native';
import { AppProvider } from './src/AppContext';
import MainScreen from './src/mainscreen';
import SplashLoading from './src/SplashLoading';
import { useState, useEffect } from 'react';
import { testConnection } from './api/connectViaAPI';
import { logCashFlowsToConsole } from './src/services/cashflowFromApi';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    testConnection();
    logCashFlowsToConsole();
  }, []);

  if (isLoading) {
    return <SplashLoading onComplete={() => setIsLoading(false)} />;
  }

  return (
    <AppProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <MainScreen />
    </AppProvider>
  );
}

export default App;
