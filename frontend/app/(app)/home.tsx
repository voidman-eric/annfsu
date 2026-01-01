import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const menuItems = [
    { title: 'अखिल समाचार', icon: 'newspaper', route: 'news', color: '#DC143C' },
    { title: 'ज्ञानमाला', icon: 'book', route: 'knowledge', color: '#2E7D32' },
    { title: 'संगठनको विधान', icon: 'document-text', route: 'constitution', color: '#1976D2' },
    { title: 'पद तथा सपथ', icon: 'hand-right', route: 'oath', color: '#F57C00' },
    { title: 'महत्वपूर्ण उद्धरणहरू', icon: 'chatbubble-ellipses', route: 'quotes', color: '#7B1FA2' },
    { title: 'गीत / संगीत', icon: 'musical-notes', route: 'music', color: '#C62828' },
    { title: 'सम्पर्कहरू', icon: 'call', route: 'contacts', color: '#00796B' },
    { title: 'हाम्रो बारेमा', icon: 'information-circle', route: 'about', color: '#455A64' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>स्वागत छ</Text>
        <Text style={styles.userName}>{user?.full_name}</Text>
        {user?.membership_id && (
          <View style={styles.membershipBadge}>
            <Text style={styles.membershipText}>सदस्यता ID: {user.membership_id}</Text>
          </View>
        )}
      </View>

      <View style={styles.gridContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuCard, { backgroundColor: item.color }]}
            onPress={() => router.push(`/(app)/${item.route}` as any)}
          >
            <Ionicons name={item.icon as any} size={40} color="#fff" />
            <Text style={styles.menuTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>अखिल नेपाल राष्ट्रिय स्वतन्त्र विद्यार्थी युनियन</Text>
        <Text style={styles.infoSubtitle}>All Nepal National Free Students Union</Text>
        <Text style={styles.infoDescription}>
          नेपालको सबैभन्दा ठूलो र प्रभावशाली विद्यार्थी संगठन
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeSection: {
    backgroundColor: '#DC143C',
    padding: 24,
    alignItems: 'center',
  },
  welcomeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    marginTop: 8,
  },
  membershipBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  membershipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  menuCard: {
    width: '47%',
    aspectRatio: 1,
    margin: '1.5%',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 12,
  },
  infoSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC143C',
    textAlign: 'center',
    marginBottom: 8,
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  infoDescription: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
  },
});
