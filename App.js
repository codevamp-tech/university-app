import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/RootNavigation';
import { ThemeProvider, ThemeContext } from './src/context/ThemeContext';
import { UserProvider, useUser } from './src/context/UserContext';
import { ChatSocketProvider } from './src/context/ChatSocketContext';
import { registerPushTokenAPI } from './src/data/apiService';

// Set notification handler globally
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const PushSetup = () => {
  const { accessToken } = useUser();

  useEffect(() => {
    if (!accessToken) return;
    const register = async () => {
      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;
        await registerPushTokenAPI(accessToken, token, Platform.OS);
      } catch (e) {
        // Push token registration is non-critical — swallow errors
      }
    };
    register();
  }, [accessToken]);

  return null;
};

const AppContent = () => {
  const { isDark, colors } = React.useContext(ThemeContext);
  
  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      <AppNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UserProvider>
          <ChatSocketProvider>
            <PushSetup />
            <AppContent />
          </ChatSocketProvider>
        </UserProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
