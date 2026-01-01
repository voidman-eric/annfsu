import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import api from '../../utils/api';

interface ContentItem {
  id: string;
  title_ne: string;
  content_ne: string;
  created_at: string;
}

export default function OathScreen() {
  const [oath, setOath] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOath();
  }, []);

  const fetchOath = async () => {
    try {
      const response = await api.get('/api/content/oath');
      setOath(response.data);
    } catch (error) {
      console.error('Error fetching oath:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOath();
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
      {oath.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>सपथ उपलब्ध छैन</Text>
        </View>
      ) : (
        oath.map((item) => (
          <View key={item.id} style={styles.oathCard}>
            <Text style={styles.oathTitle}>{item.title_ne}</Text>
            <Text style={styles.oathContent}>{item.content_ne}</Text>
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
  oathCard: {
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
  oathTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 12,
  },
  oathContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
});
