import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

interface Contact {
  id: string;
  name_ne: string;
  designation_ne: string;
  phone_number: string;
  committee: string;
}

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCommittee, setSelectedCommittee] = useState('central');

  const committees = [
    { key: 'central', label: 'केन्द्रीय कमिटी' },
    { key: 'provincial', label: 'प्रादेशिक कमिटी' },
    { key: 'district', label: 'जिल्ला कमिटी' },
    { key: 'campus', label: 'क्याम्पस कमिटी' },
  ];

  useEffect(() => {
    fetchContacts();
  }, [selectedCommittee]);

  const fetchContacts = async () => {
    try {
      const response = await api.get(`/api/contacts?committee=${selectedCommittee}`);
      setContacts(response.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchContacts();
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#DC143C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {committees.map((committee) => (
          <TouchableOpacity
            key={committee.key}
            style={[
              styles.tab,
              selectedCommittee === committee.key && styles.activeTab,
            ]}
            onPress={() => setSelectedCommittee(committee.key)}
          >
            <Text
              style={[
                styles.tabText,
                selectedCommittee === committee.key && styles.activeTabText,
              ]}
            >
              {committee.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#DC143C']} />}
      >
        {contacts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>कुनै सम्पर्क उपलब्ध छैन</Text>
          </View>
        ) : (
          <View style={styles.contactGrid}>
            {contacts.map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name_ne}</Text>
                  <Text style={styles.contactDesignation}>{contact.designation_ne}</Text>
                </View>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => handleCall(contact.phone_number)}
                >
                  <Ionicons name="call" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
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
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tabsContent: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#DC143C',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  contactGrid: {
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  contactCard: {
    width: '47%',
    backgroundColor: '#fff',
    margin: '1.5%',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    alignItems: 'center',
  },
  contactInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  contactDesignation: {
    fontSize: 12,
    color: '#DC143C',
    textAlign: 'center',
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
