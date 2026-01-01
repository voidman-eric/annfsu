import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import api from '../../utils/api';

interface ContentItem {
  id: string;
  title_ne: string;
  content_ne: string;
  created_at: string;
}

export default function NewsScreen() {
  const [news, setNews] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await api.get('/api/content/news');
      setNews(response.data);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNews();
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
      {news.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>कुनै समाचार उपलब्ध छैन</Text>
        </View>
      ) : (
        news.map((item) => (
          <View key={item.id} style={styles.newsCard}>
            <Text style={styles.newsTitle}>{item.title_ne}</Text>
            <Text style={styles.newsContent}>{item.content_ne}</Text>
            <Text style={styles.newsDate}>{new Date(item.created_at).toLocaleDateString('ne-NP')}</Text>
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
  newsCard: {
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
  newsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC143C',
    marginBottom: 12,
  },
  newsContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  newsDate: {
    fontSize: 12,
    color: '#999',
  },
});
