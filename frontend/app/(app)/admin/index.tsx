import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
  Modal,
  Image,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../utils/api';
import Avatar from '../../../components/Avatar';

interface User {
  id: string;
  username?: string;
  email: string;
  full_name: string;
  phone: string;
  photo?: string;
  role: string;
  status: string;
  membership_id?: string;
  created_at: string;
}

interface DashboardStats {
  total_members: number;
  pending_requests: number;
  approved_members: number;
  rejected_members: number;
  total_content: number;
  total_songs: number;
  total_contacts: number;
}

type TabType = 'dashboard' | 'pending' | 'approved' | 'all';

export default function AdminDashboard() {
  const { user, token, isAdmin } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async (statusFilter?: string) => {
    try {
      let url = '/api/admin/users';
      if (statusFilter) {
        url += `?status_filter=${statusFilter}`;
      }
      const response = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchStats();
    if (activeTab === 'pending') {
      await fetchUsers('pending');
    } else if (activeTab === 'approved') {
      await fetchUsers('approved');
    } else if (activeTab === 'all') {
      await fetchUsers();
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [activeTab, isAdmin]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [activeTab]);

  const handleApprove = async (userId: string) => {
    setActionLoading(true);
    try {
      await api.put(`/api/admin/users/${userId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('सफलता', 'प्रयोगकर्ता स्वीकृत भयो');
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      Alert.alert('त्रुटि', error.response?.data?.detail || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (userId: string) => {
    Alert.alert(
      'अस्वीकार गर्नुहोस्',
      'के तपाईं यो प्रयोगकर्तालाई अस्वीकार गर्न चाहनुहुन्छ?',
      [
        { text: 'रद्द', style: 'cancel' },
        {
          text: 'अस्वीकार',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.put(`/api/admin/users/${userId}/reject`, {}, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('सफलता', 'प्रयोगकर्ता अस्वीकृत भयो');
              setModalVisible(false);
              loadData();
            } catch (error: any) {
              Alert.alert('त्रुटि', error.response?.data?.detail || 'Action failed');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDisable = async (userId: string) => {
    Alert.alert(
      'खाता निष्क्रिय गर्नुहोस्',
      'के तपाईं यो खाता निष्क्रिय गर्न चाहनुहुन्छ?',
      [
        { text: 'रद्द', style: 'cancel' },
        {
          text: 'निष्क्रिय',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.put(`/api/admin/users/${userId}/disable`, {}, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('सफलता', 'खाता निष्क्रिय गरियो');
              setModalVisible(false);
              loadData();
            } catch (error: any) {
              Alert.alert('त्रुटि', error.response?.data?.detail || 'Action failed');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleEnable = async (userId: string) => {
    setActionLoading(true);
    try {
      await api.put(`/api/admin/users/${userId}/enable`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('सफलता', 'खाता सक्रिय गरियो');
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      Alert.alert('त्रुटि', error.response?.data?.detail || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="lock-closed" size={60} color="#DC143C" />
        <Text style={styles.errorTitle}>पहुँच अस्वीकार</Text>
        <Text style={styles.errorText}>तपाईंसँग एडमिन पहुँच छैन</Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'rejected': return '#F44336';
      case 'disabled': return '#9E9E9E';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'स्वीकृत';
      case 'pending': return 'विचाराधीन';
      case 'rejected': return 'अस्वीकृत';
      case 'disabled': return 'निष्क्रिय';
      default: return status;
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => {
        setSelectedUser(item);
        setModalVisible(true);
      }}
    >
      <Avatar uri={item.photo} name={item.full_name} size={50} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.full_name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        {item.username && <Text style={styles.userUsername}>@{item.username}</Text>}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderDashboard = () => (
    <View style={styles.dashboardContainer}>
      <View style={styles.statsGrid}>
        <TouchableOpacity 
          style={[styles.statCard, { borderLeftColor: '#FF9800' }]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={styles.statNumber}>{stats?.pending_requests || 0}</Text>
          <Text style={styles.statLabel}>विचाराधीन</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.statCard, { borderLeftColor: '#4CAF50' }]}
          onPress={() => setActiveTab('approved')}
        >
          <Text style={styles.statNumber}>{stats?.approved_members || 0}</Text>
          <Text style={styles.statLabel}>स्वीकृत</Text>
        </TouchableOpacity>
        
        <View style={[styles.statCard, { borderLeftColor: '#2196F3' }]}>
          <Text style={styles.statNumber}>{stats?.total_members || 0}</Text>
          <Text style={styles.statLabel}>कुल सदस्य</Text>
        </View>
        
        <View style={[styles.statCard, { borderLeftColor: '#F44336' }]}>
          <Text style={styles.statNumber}>{stats?.rejected_members || 0}</Text>
          <Text style={styles.statLabel}>अस्वीकृत</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={[styles.menuCard, { borderLeftColor: '#2196F3' }]}
          onPress={() => setActiveTab('pending')}
        >
          <Ionicons name="people" size={32} color="#2196F3" />
          <View style={styles.menuCardContent}>
            <Text style={styles.menuCardTitle}>सदस्यहरू प्रबन्धन</Text>
            <Text style={styles.menuCardDescription}>सदस्यहरू थप्नुहोस्, सम्पादन र अनुमोदन</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuCard, { borderLeftColor: '#4CAF50' }]}
          onPress={() => Alert.alert('Coming Soon', 'सामग्री प्रबन्धन छिट्टै आउँदैछ')}
        >
          <Ionicons name="document-text" size={32} color="#4CAF50" />
          <View style={styles.menuCardContent}>
            <Text style={styles.menuCardTitle}>सामग्री प्रबन्धन</Text>
            <Text style={styles.menuCardDescription}>समाचार, ज्ञानमाला, विधान आदि</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuCard, { borderLeftColor: '#FF9800' }]}
          onPress={() => Alert.alert('Coming Soon', 'गीत प्रबन्धन छिट्टै आउँदैछ')}
        >
          <Ionicons name="musical-notes" size={32} color="#FF9800" />
          <View style={styles.menuCardContent}>
            <Text style={styles.menuCardTitle}>गीत प्रबन्धन</Text>
            <Text style={styles.menuCardDescription}>गीतहरू अपलोड र प्रबन्धन</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuCard, { borderLeftColor: '#9C27B0' }]}
          onPress={() => Alert.alert('Coming Soon', 'सम्पर्क प्रबन्धन छिट्टै आउँदैछ')}
        >
          <Ionicons name="call" size={32} color="#9C27B0" />
          <View style={styles.menuCardContent}>
            <Text style={styles.menuCardTitle}>सम्पर्क प्रबन्धन</Text>
            <Text style={styles.menuCardDescription}>सम्पर्क विवरण थप्नुहोस् र सम्पादन</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUserList = () => (
    <FlatList
      data={users}
      renderItem={renderUserItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>कुनै प्रयोगकर्ता छैन</Text>
        </View>
      }
    />
  );

  const renderUserModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {selectedUser && (
            <>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>

              <View style={styles.modalHeader}>
                <Avatar uri={selectedUser.photo} name={selectedUser.full_name} size={80} />
                <Text style={styles.modalName}>{selectedUser.full_name}</Text>
                <Text style={styles.modalEmail}>{selectedUser.email}</Text>
                {selectedUser.username && (
                  <Text style={styles.modalUsername}>@{selectedUser.username}</Text>
                )}
                <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedUser.status) }]}>
                  <Text style={styles.modalStatusText}>{getStatusText(selectedUser.status)}</Text>
                </View>
              </View>

              <View style={styles.modalInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="call" size={18} color="#666" />
                  <Text style={styles.infoText}>{selectedUser.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="shield" size={18} color="#666" />
                  <Text style={styles.infoText}>Role: {selectedUser.role}</Text>
                </View>
                {selectedUser.membership_id && (
                  <View style={styles.infoRow}>
                    <Ionicons name="card" size={18} color="#666" />
                    <Text style={styles.infoText}>{selectedUser.membership_id}</Text>
                  </View>
                )}
              </View>

              {actionLoading ? (
                <ActivityIndicator size="large" color="#DC143C" style={{ marginVertical: 20 }} />
              ) : (
                <View style={styles.actionButtons}>
                  {selectedUser.status === 'pending' && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleApprove(selectedUser.id)}
                      >
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>स्वीकृत</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleReject(selectedUser.id)}
                      >
                        <Ionicons name="close" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>अस्वीकार</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  
                  {selectedUser.status === 'approved' && selectedUser.role !== 'super_admin' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.disableButton]}
                      onPress={() => handleDisable(selectedUser.id)}
                    >
                      <Ionicons name="ban" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>निष्क्रिय गर्नुहोस्</Text>
                    </TouchableOpacity>
                  )}

                  {selectedUser.status === 'disabled' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.enableButton]}
                      onPress={() => handleEnable(selectedUser.id)}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>सक्रिय गर्नुहोस्</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>स्वागत छ, {user?.full_name}</Text>
        <Text style={styles.roleText}>{user?.role === 'super_admin' ? 'सुपर एडमिन' : 'एडमिन'}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'dashboard' && styles.activeTabButton]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'dashboard' && styles.activeTabButtonText]}>
            ड्यासबोर्ड
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'pending' && styles.activeTabButton]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'pending' && styles.activeTabButtonText]}>
            विचाराधीन ({stats?.pending_requests || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'all' && styles.activeTabButton]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'all' && styles.activeTabButtonText]}>
            सबै
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#DC143C" />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {activeTab === 'dashboard' && renderDashboard()}
          {(activeTab === 'pending' || activeTab === 'approved' || activeTab === 'all') && renderUserList()}
        </ScrollView>
      )}

      {renderUserModal()}
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
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC143C',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  header: {
    backgroundColor: '#DC143C',
    padding: 20,
    paddingTop: 16,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  roleText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#DC143C',
  },
  tabButtonText: {
    fontSize: 12,
    color: '#666',
  },
  activeTabButtonText: {
    color: '#DC143C',
    fontWeight: 'bold',
  },
  dashboardContainer: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  menuContainer: {
    marginTop: 8,
  },
  menuCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  menuCardContent: {
    flex: 1,
    marginLeft: 16,
  },
  menuCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  menuCardDescription: {
    fontSize: 12,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  userUsername: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  modalEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modalUsername: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  modalStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  modalStatusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalInfo: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  disableButton: {
    backgroundColor: '#9E9E9E',
  },
  enableButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
