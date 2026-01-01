import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';

export default function HeaderAvatar() {
  const { user } = useAuth();
  const router = useRouter();

  const handlePress = () => {
    router.push('/(app)/profile');
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Avatar
        uri={user?.photo}
        name={user?.full_name || 'User'}
        size={34}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 12,
  },
});
