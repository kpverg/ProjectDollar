import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppContext } from './AppContext';
import ViewPortfolio from './viewPortfolio';
import BuildPortfolio from './buildPortfolio';
import AddCapital from './addCapital';
import Settings from './settings';

const MainScreen = () => {
  const { colors, getColors, primaryColor } = useContext(AppContext);
  const [currentScreen, setCurrentScreen] = useState('main');
  const dynamicColors = getColors();

  if (currentScreen === 'portfolio') {
    return <ViewPortfolio onBack={() => setCurrentScreen('main')} />;
  }
  if (currentScreen === 'build') {
    return <BuildPortfolio onBack={() => setCurrentScreen('main')} />;
  }
  if (currentScreen === 'capital') {
    return <AddCapital onBack={() => setCurrentScreen('main')} />;
  }
  if (currentScreen === 'settings') {
    return <Settings onBack={() => setCurrentScreen('main')} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: dynamicColors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: dynamicColors.primary }]}>
          ProjectDollar
        </Text>
        <Text style={[styles.subtitle, { color: dynamicColors.textSecondary }]}>
          Portfolio Manager
        </Text>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.buttonsGrid}>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: dynamicColors.bgSecondary },
            ]}
            onPress={() => setCurrentScreen('portfolio')}
          >
            <Icon name="chart-line" size={32} color={dynamicColors.primary} />
            <Text style={[styles.buttonText, { color: dynamicColors.primary }]}>
              View
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: dynamicColors.bgSecondary },
            ]}
            onPress={() => setCurrentScreen('build')}
          >
            <Icon
              name="briefcase-plus"
              size={32}
              color={dynamicColors.primary}
            />
            <Text style={[styles.buttonText, { color: dynamicColors.primary }]}>
              Build
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: dynamicColors.bgSecondary },
            ]}
            onPress={() => setCurrentScreen('capital')}
          >
            <Icon name="cash-plus" size={32} color={dynamicColors.primary} />
            <Text style={[styles.buttonText, { color: dynamicColors.primary }]}>
              Add $
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: dynamicColors.bgSecondary },
            ]}
            onPress={() => setCurrentScreen('settings')}
          >
            <Icon name="cog" size={32} color={dynamicColors.primary} />
            <Text style={[styles.buttonText, { color: dynamicColors.primary }]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a73e8',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  buttonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  button: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    margin: 6,
  },
  buttonIcon: {
    fontSize: 32,
    marginBottom: 2,
  },
  buttonText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#1a73e8',
    textAlign: 'center',
  },
});

export default MainScreen;
