import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import api from '../../utils/api';

interface ContentItem {
  id: string;
  title_ne: string;
  content_ne: string;
  created_at: string;
}

export default function AboutScreen() {
  const [about, setAbout] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAbout();
  }, []);

  const fetchAbout = async () => {
    try {
      const response = await api.get('/api/content/about');
      setAbout(response.data);
    } catch (error) {
      console.error('Error fetching about:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAbout();
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
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>ANNFSU</Text>
        </View>
        <Text style={styles.headerTitle}>अखिल नेपाल राष्ट्रिय</Text>
        <Text style={styles.headerSubtitle}>स्वतन्त्र विद्यार्थी युनियन</Text>
      </View>

      {about.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>जानकारी उपलब्ध छैन</Text>
        </View>
      ) : (
        about.map((item) => (
          <View key={item.id} style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>{item.title_ne}</Text>
            <Text style={styles.aboutContent}>{item.content_ne}</Text>
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
  header: {
    backgroundColor: '#DC143C',
    padding: 24,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: '#DC143C',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  aboutCard: {
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
  aboutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC143C',
    marginBottom: 12,
  },
  aboutContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
});
