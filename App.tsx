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
import { useState } from 'react';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState(true);

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
