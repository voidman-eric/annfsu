import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  if (!isAdmin) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>तपाईंसँग एडमिन पहुँच छैन</Text>
      </View>
    );
  }

  const adminMenuItems = [
    {
      title: 'सदस्यहरू प्रबन्धन',
      icon: 'people',
      description: 'सदस्यहरू थप्नुहोस्, सम्पादन र अनुमोदन',
      color: '#2196F3',
    },
    {
      title: 'सामग्री प्रबन्धन',
      icon: 'document-text',
      description: 'समाचार, ज्ञानमाला, विधान आदि',
      color: '#4CAF50',
    },
    {
      title: 'गीत प्रबन्धन',
      icon: 'musical-notes',
      description: 'गीतहरू अपलोड र प्रबन्धन',
      color: '#FF9800',
    },
    {
      title: 'सम्पर्क प्रबन्धन',
      icon: 'call',
      description: 'सम्पर्क विवरण थप्नुहोस् र सम्पादन',
      color: '#9C27B0',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>स्वागत छ, {user?.full_name}</Text>
        <Text style={styles.roleText}>एडमिन</Text>
      </View>

      <View style={styles.menuContainer}>
        {adminMenuItems.map((item, index) => (
          <TouchableOpacity key={index} style={[styles.menuCard, { borderLeftColor: item.color }]}>
            <Ionicons name={item.icon as any} size={32} color={item.color} />
            <View style={styles.menuCardContent}>
              <Text style={styles.menuCardTitle}>{item.title}</Text>
              <Text style={styles.menuCardDescription}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>सूचना</Text>
        <Text style={styles.infoText}>
          अहिले एडमिन प्यानल निर्माण भइरहेको छ। छिट्टै सबै सुविधाहरू उपलब्ध हुनेछन्।
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#DC143C',
    padding: 24,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  roleText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
  menuContainer: {
    padding: 16,
  },
  menuCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
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
    lineHeight: 18,
  },
  infoCard: {
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
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC143C',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});
