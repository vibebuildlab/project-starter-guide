import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { RootStackParamList } from './src/types/navigation';
import { config } from './src/config/env';

const Stack = createStackNavigator<RootStackParamList>();

const SCREEN_OPTIONS = {
  headerStyle: {
    backgroundColor: "#3b82f6",
  },
  headerTintColor: "#fff",
  headerTitleStyle: {
    fontWeight: "bold" as const,
  },
};

export default function App() {
  useEffect(() => {
    // Example: Log API URL on app start
    if (config.isDevelopment) {
      console.log('[App] Connecting to API:', config.apiUrl);
    }

    // Example: Initialize analytics or error tracking
    if (config.sentryDsn) {
      console.log('[App] Sentry configured');
      // Initialize Sentry here if needed
    }
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={SCREEN_OPTIONS}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "Welcome" }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: "Profile" }}
          />
        </Stack.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
