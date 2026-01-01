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
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import Avatar from '../../components/Avatar';

interface Contact {
  id: string;
  name_ne: string;
  designation_ne: string;
  phone_number: string;
  committee: string;
  address?: string;
  email?: string;
}

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCommittee, setSelectedCommittee] = useState('central');

  const committees = [
    { key: 'central', label: 'केन्द्रीय' },
    { key: 'provincial', label: 'प्रादेशिक' },
    { key: 'district', label: 'जिल्ला' },
    { key: 'campus', label: 'क्याम्पस' },
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

  const renderContact = ({ item }: { item: Contact }) => (
    <View style={styles.contactCard}>
      <Avatar
        uri={undefined}
        name={item.name_ne}
        size={40}
      />
      <View style={styles.contactInfo}>
        <Text style={styles.contactName} numberOfLines={1}>{item.name_ne}</Text>
        <Text style={styles.contactDesignation} numberOfLines={1}>{item.designation_ne}</Text>
        {item.address && (
          <Text style={styles.contactAddress} numberOfLines={1}>
            <Ionicons name="location-outline" size={10} color="#999" /> {item.address}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.callButton}
        onPress={() => handleCall(item.phone_number)}
        activeOpacity={0.7}
      >
        <Ionicons name="call" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#DC143C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Compact Tab Bar */}
      <View style={styles.tabBar}>
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
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {committees.find(c => c.key === selectedCommittee)?.label} समिति
        </Text>
        <Text style={styles.sectionCount}>{contacts.length} सदस्यहरू</Text>
      </View>

      {/* Contact List */}
      {contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={40} color="#ccc" />
          <Text style={styles.emptyText}>कुनै सम्पर्क उपलब्ध छैन</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={['#DC143C']} 
            />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginHorizontal: 3,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#DC143C',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC143C',
  },
  sectionCount: {
    fontSize: 12,
    color: '#999',
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  contactDesignation: {
    fontSize: 11,
    color: '#DC143C',
    fontWeight: '500',
    marginBottom: 1,
  },
  contactAddress: {
    fontSize: 10,
    color: '#999',
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
});
