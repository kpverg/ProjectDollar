import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';

const BuildPortfolio = ({ onBack }) => {
  const [assets, setAssets] = useState([]);
  const [assetName, setAssetName] = useState('');
  const [assetAmount, setAssetAmount] = useState('');

  const addAsset = () => {
    if (assetName && assetAmount) {
      setAssets([...assets, { name: assetName, amount: assetAmount }]);
      setAssetName('');
      setAssetAmount('');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Build Your Portfolio</Text>
        <Text style={styles.subtitle}>Create your investment strategy</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.label}>Asset Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Apple Stock, Bitcoin"
            value={assetName}
            onChangeText={setAssetName}
            placeholderTextColor="#ccc"
          />

          <Text style={styles.label}>Amount ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 1000"
            value={assetAmount}
            onChangeText={setAssetAmount}
            keyboardType="decimal-pad"
            placeholderTextColor="#ccc"
          />

          <TouchableOpacity style={styles.addButton} onPress={addAsset}>
            <Text style={styles.addButtonText}>+ Add Asset</Text>
          </TouchableOpacity>
        </View>

        {assets.length > 0 && (
          <View style={styles.assetsList}>
            <Text style={styles.assetsTitle}>Your Assets</Text>
            {assets.map((asset, index) => (
              <View key={index} style={styles.assetItem}>
                <Text style={styles.assetName}>{asset.name}</Text>
                <Text style={styles.assetAmount}>${asset.amount}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
    paddingBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1a73e8',
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a73e8',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  content: {
    paddingHorizontal: 20,
    gap: 15,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  addButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  assetsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assetsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  assetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  assetName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  assetAmount: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '600',
  },
});

export default BuildPortfolio;
