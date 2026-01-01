import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

export default function ProfileScreen() {
  const { user } = useAuth();

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>प्रयोगकर्ता जानकारी पाइएन</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Membership Card */}
      <View style={styles.membershipCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardLogo}>
            <Text style={styles.cardLogoText}>ANNFSU</Text>
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>अखिल नेपाल राष्ट्रिय</Text>
            <Text style={styles.cardSubtitle}>स्वतन्त्र विद्यार्थी युनियन</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.photoSection}>
            {user.photo ? (
              <Image source={{ uri: user.photo }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={40} color="#DC143C" />
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.memberName}>{user.full_name}</Text>
            <Text style={styles.memberDetail}>{user.position || 'सदस्य'}</Text>
            <Text style={styles.memberDetail}>{user.committee}</Text>
            <Text style={styles.membershipId}>सदस्यता ID: {user.membership_id}</Text>
            {user.issue_date && (
              <Text style={styles.issueDate}>
                जारी मिति: {new Date(user.issue_date).toLocaleDateString('ne-NP')}
              </Text>
            )}
          </View>

          <View style={styles.qrSection}>
            <QRCode
              value={JSON.stringify({ id: user.id, membership_id: user.membership_id })}
              size={80}
            />
          </View>
        </View>
      </View>

      {/* User Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ब्यक्तिगत जानकारी</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="mail" size={20} color="#DC143C" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>इमेल</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call" size={20} color="#DC143C" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>फोन</Text>
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color="#DC143C" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>ठेगाना</Text>
            <Text style={styles.infoValue}>{user.address}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="school" size={20} color="#DC143C" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>शैक्षिक संस्था</Text>
            <Text style={styles.infoValue}>{user.institution}</Text>
          </View>
        </View>

        {user.blood_group && (
          <View style={styles.infoRow}>
            <Ionicons name="water" size={20} color="#DC143C" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>रगत समूह</Text>
              <Text style={styles.infoValue}>{user.blood_group}</Text>
            </View>
          </View>
        )}
      </View>
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
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  membershipCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#DC143C',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLogo: {
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardLogoText: {
    color: '#DC143C',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
  },
  photoSection: {
    marginRight: 16,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  memberDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  membershipId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC143C',
    marginTop: 8,
  },
  issueDate: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  qrSection: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC143C',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
  },
});
