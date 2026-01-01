import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import api from '../../utils/api';

interface ContentItem {
  id: string;
  title_ne: string;
  content_ne: string;
  created_at: string;
}

export default function KnowledgeScreen() {
  const [knowledge, setKnowledge] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    try {
      const response = await api.get('/api/content/knowledge');
      setKnowledge(response.data);
    } catch (error) {
      console.error('Error fetching knowledge:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchKnowledge();
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
      {knowledge.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>कुनै ज्ञानमाला उपलब्ध छैन</Text>
        </View>
      ) : (
        knowledge.map((item) => (
          <View key={item.id} style={styles.knowledgeCard}>
            <Text style={styles.knowledgeTitle}>{item.title_ne}</Text>
            <Text style={styles.knowledgeContent}>{item.content_ne}</Text>
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
  knowledgeCard: {
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
  knowledgeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  knowledgeContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
});
