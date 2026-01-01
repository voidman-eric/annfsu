import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import CustomDrawerContent from '../../components/CustomDrawerContent';
import HeaderAvatar from '../../components/HeaderAvatar';

export default function AppLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#DC143C',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => <HeaderAvatar />,
          drawerActiveTintColor: '#DC143C',
          drawerInactiveTintColor: '#666',
        }}
      >
        <Drawer.Screen
          name="home"
          options={{
            drawerLabel: 'गृह पृष्ठ',
            title: 'अखिल नेपाल',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="news"
          options={{
            drawerLabel: 'अखिल समाचार',
            title: 'अखिल समाचार',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="newspaper" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="knowledge"
          options={{
            drawerLabel: 'ज्ञानमाला',
            title: 'ज्ञानमाला',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="book" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="constitution"
          options={{
            drawerLabel: 'संगठनको विधान',
            title: 'संगठनको विधान',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="document-text" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="oath"
          options={{
            drawerLabel: 'पद तथा गोपनीयताको सपथ',
            title: 'पद तथा गोपनीयताको सपथ',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="hand-right" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="quotes"
          options={{
            drawerLabel: 'महत्वपूर्ण उद्धरणहरू',
            title: 'महत्वपूर्ण उद्धरणहरू',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="chatbubble-ellipses" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="music"
          options={{
            drawerLabel: 'गीत / संगीत',
            title: 'गीत / संगीत',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="musical-notes" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="contacts"
          options={{
            drawerLabel: 'सम्पर्कहरू',
            title: 'सम्पर्कहरू',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="call" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="about"
          options={{
            drawerLabel: 'हाम्रो बारेमा',
            title: 'हाम्रो बारेमा',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="information-circle" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            drawerLabel: 'मेरो प्रोफाइल',
            title: 'मेरो प्रोफाइल',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="admin"
          options={{
            drawerLabel: 'एडमिन प्यानल',
            title: 'एडमिन प्यानल',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
