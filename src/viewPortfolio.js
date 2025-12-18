import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const ViewPortfolio = ({ onBack }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Your Portfolio</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statsCard}>
          <Text style={styles.label}>Total Assets</Text>
          <Text style={styles.value}>$0.00</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.label}>Total Gain/Loss</Text>
          <Text style={[styles.value, { color: '#4caf50' }]}>+$0.00</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.label}>Return %</Text>
          <Text style={[styles.value, { color: '#4caf50' }]}>0%</Text>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No assets yet</Text>
          <Text style={styles.emptySubtext}>
            Add some capital to get started
          </Text>
        </View>
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
  },
  content: {
    paddingHorizontal: 20,
    gap: 15,
  },
  statsCard: {
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
    color: '#999',
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
});

export default ViewPortfolio;
