import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import MembershipCardView from '../../components/MembershipCardView';
import Avatar from '../../components/Avatar';
import ImagePickerModal from '../../components/ImagePickerModal';

export default function ProfileScreen() {
  const { user, updateUserPhoto, removeUserPhoto } = useAuth();
  const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false);

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>प्रयोगकर्ता जानकारी पाइएन</Text>
      </View>
    );
  }

  const isApproved = user.status === 'approved';

  const handleImageSelected = async (base64: string, mimeType: string) => {
    try {
      await updateUserPhoto(base64, mimeType);
      Alert.alert('सफलता', 'प्रोफाइल फोटो अपडेट भयो!', [{ text: 'ठीक छ' }]);
    } catch (error: any) {
      Alert.alert('त्रुटि', error.message || 'फोटो अपडेट गर्न सकिएन', [{ text: 'ठीक छ' }]);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await removeUserPhoto();
      Alert.alert('सफलता', 'प्रोफाइल फोटो हटाइयो!', [{ text: 'ठीक छ' }]);
    } catch (error: any) {
      Alert.alert('त्रुटि', error.message || 'फोटो हटाउन सकिएन', [{ text: 'ठीक छ' }]);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header with Avatar */}
      <View style={styles.profileHeader}>
        <Avatar
          uri={user.photo}
          name={user.full_name}
          size={120}
          onPress={() => setIsPhotoModalVisible(true)}
          showEditIcon
        />
        <Text style={styles.userName}>{user.full_name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        {user.membership_id && (
          <View style={styles.membershipBadge}>
            <Ionicons name="card" size={14} color="#fff" />
            <Text style={styles.membershipId}>{user.membership_id}</Text>
          </View>
        )}
      </View>

      {/* Membership Card - Only for Approved Members */}
      {isApproved && user.membership_id ? (
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>तपाईंको सदस्यता कार्ड</Text>
          <MembershipCardView user={user} />
        </View>
      ) : (
        <View style={styles.pendingCard}>
          <Ionicons name="hourglass-outline" size={60} color="#FF9800" />
          <Text style={styles.pendingTitle}>सदस्यता स्वीकृति बाँकी छ</Text>
          <Text style={styles.pendingText}>
            तपाईंको सदस्यता आवेदन प्रशासकद्वारा समीक्षा भइरहेको छ।{'\n'}
            स्वीकृत भएपछि तपाईंले डिजिटल सदस्यता कार्ड प्राप्त गर्नुहुनेछ।
          </Text>
        </View>
      )}

      {/* User Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>व्यक्तिगत जानकारी</Text>
        
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

        <View style={styles.infoRow}>
          <Ionicons name="business" size={20} color="#DC143C" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>समिति</Text>
            <Text style={styles.infoValue}>{user.committee}</Text>
          </View>
        </View>

        {user.position && (
          <View style={styles.infoRow}>
            <Ionicons name="briefcase" size={20} color="#DC143C" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>पद</Text>
              <Text style={styles.infoValue}>{user.position}</Text>
            </View>
          </View>
        )}

        {user.blood_group && (
          <View style={styles.infoRow}>
            <Ionicons name="water" size={20} color="#DC143C" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>रगत समूह</Text>
              <Text style={styles.infoValue}>{user.blood_group}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark" size={20} color="#DC143C" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>स्थिति</Text>
            <Text style={[styles.infoValue, getStatusStyle(user.status)]}>
              {getStatusText(user.status)}
            </Text>
          </View>
        </View>
      </View>

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={isPhotoModalVisible}
        onClose={() => setIsPhotoModalVisible(false)}
        onImageSelected={handleImageSelected}
        onRemovePhoto={handleRemovePhoto}
        hasExistingPhoto={!!user.photo}
      />
    </ScrollView>
  );
}

function getStatusText(status: string): string {
  switch (status) {
    case 'approved': return 'स्वीकृत';
    case 'pending': return 'विचाराधीन';
    case 'rejected': return 'अस्वीकृत';
    default: return status;
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'approved': return { color: '#4CAF50', fontWeight: 'bold' as const };
    case 'pending': return { color: '#FF9800', fontWeight: 'bold' as const };
    case 'rejected': return { color: '#F44336', fontWeight: 'bold' as const };
    default: return {};
  }
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
  profileHeader: {
    backgroundColor: '#DC143C',
    paddingTop: 30,
    paddingBottom: 30,
    alignItems: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  membershipId: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  cardSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC143C',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  pendingCard: {
    backgroundColor: '#FFF8E1',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFB74D',
  },
  pendingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
    marginTop: 12,
    marginBottom: 8,
  },
  pendingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
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
