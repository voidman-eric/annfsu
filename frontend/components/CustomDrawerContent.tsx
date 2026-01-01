import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const navigateToProfile = () => {
    router.push('/(app)/profile');
    props.navigation.closeDrawer();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={navigateToProfile} activeOpacity={0.8}>
          <Avatar
            uri={user?.photo}
            name={user?.full_name || 'User'}
            size={80}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>अखिल नेपाल राष्ट्रिय</Text>
        <Text style={styles.headerSubtitle}>स्वतन्त्र विद्यार्थी युनियन</Text>
        {user && (
          <TouchableOpacity onPress={navigateToProfile}>
            <Text style={styles.userName}>{user.full_name}</Text>
          </TouchableOpacity>
        )}
        {user?.membership_id && (
          <View style={styles.membershipBadge}>
            <Ionicons name="card" size={12} color="#DC143C" />
            <Text style={styles.membershipText}>{user.membership_id}</Text>
          </View>
        )}
      </View>

      <DrawerContentScrollView {...props} style={styles.drawerContent}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#fff" />
          <Text style={styles.logoutText}>लग आउट</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#DC143C',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 12,
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  userName: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '600',
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  membershipText: {
    color: '#DC143C',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  drawerContent: {
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC143C',
    padding: 12,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
