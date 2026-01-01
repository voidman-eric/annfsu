import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import api from '../../utils/api';

interface ContentItem {
  id: string;
  title_ne: string;
  content_ne: string;
  created_at: string;
}

export default function QuotesScreen() {
  const [quotes, setQuotes] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await api.get('/api/content/quotes');
      setQuotes(response.data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuotes();
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
      {quotes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>कुनै उद्धरण उपलब्ध छैन</Text>
        </View>
      ) : (
        quotes.map((item) => (
          <View key={item.id} style={styles.quoteCard}>
            <Text style={styles.quoteContent}>"{item.content_ne}"</Text>
            <Text style={styles.quoteAuthor}>- {item.title_ne}</Text>
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
  quoteCard: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#7B1FA2',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  quoteContent: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 12,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#7B1FA2',
    fontWeight: 'bold',
    textAlign: 'right',
  },
});
