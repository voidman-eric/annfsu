import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import api from '../../utils/api';

interface ContentItem {
  id: string;
  title_ne: string;
  content_ne: string;
  created_at: string;
}

export default function ConstitutionScreen() {
  const [constitution, setConstitution] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchConstitution();
  }, []);

  const fetchConstitution = async () => {
    try {
      const response = await api.get('/api/content/constitution');
      setConstitution(response.data);
    } catch (error) {
      console.error('Error fetching constitution:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchConstitution();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#DC143C" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#DC143C']} />}
    >
      {constitution.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>विधान उपलब्ध छैन</Text>
        </View>
      ) : (
        constitution.map((item) => (
          <View key={item.id} style={styles.constitutionCard}>
            <Text style={styles.constitutionTitle}>{item.title_ne}</Text>
            <Text style={styles.constitutionContent}>{item.content_ne}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  constitutionCard: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  constitutionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 12,
  },
  constitutionContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
});
