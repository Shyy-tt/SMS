import React, { useState, useEffect } from 'react';
import { StatusBar, Platform, Alert, Linking } from 'react-native';
import { StoreProvider } from './data/store';

import OnboardingScreen        from './components/OnboardingScreen';
import PermissionScreen        from './components/PermissionScreen';
import PermissionGrantedScreen from './components/PermissionGrantedScreen';
import AuthScreen              from './components/AuthScreen';
import HomeScreen              from './components/HomeScreen';
import MessagesScreen          from './components/MessagesScreen';
import SpamScreen              from './components/SpamScreen';
import BlockedScreen           from './components/BlockedScreen';
import SettingsScreen          from './components/SettingsScreen';
import RNFS from 'react-native-fs';

// Helper to save token to file for native module
const saveTokenForNative = async (token) => {
  if (Platform.OS === 'android') {
    try {
      const tokenPath = RNFS.DocumentDirectoryPath + '/token.txt';
      await RNFS.writeFile(tokenPath, token, 'utf8');
      console.log('Token saved for native at:', tokenPath);
    } catch (e) {
      console.error('Failed to save token for native:', e);
    }
  }
};

const saveApiBaseForNative = async (apiBase) => {
  if (Platform.OS === 'android') {
    try {
      const configPath = RNFS.DocumentDirectoryPath + '/config.txt';
      await RNFS.writeFile(configPath, apiBase, 'utf8');
      console.log('API base saved for native at:', configPath);
    } catch (e) {
      console.error('Failed to save API base for native:', e);
    }
  }
};

// Request Notification Listener permission
const requestNotificationListenerAccess = () => {
  if (Platform.OS === 'android') {
    Alert.alert(
      'Enable Notification Access',
      'To scan SMS messages without being your default SMS app, Detectify needs notification access.\n\nThis allows us to read SMS notifications from your messaging app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => {
            Linking.sendIntent('android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS');
          }
        }
      ]
    );
  }
};

// Check if notification listener is enabled
const checkNotificationListenerEnabled = async () => {
  if (Platform.OS === 'android') {
    // You'll need a native module to check this
    // For now, just request it
    requestNotificationListenerAccess();
  }
  return true;
};

function Navigator() {
  const [screen, setScreen] = useState('onboarding');
  const navigate = (page) => setScreen(page);

  // Check permissions on auth success
  const handleAuthSuccess = async () => {
    await checkNotificationListenerEnabled();
    navigate('home');
  };

  if (screen === 'onboarding')         return <OnboardingScreen        onNext={() => navigate('permission')} />;
  if (screen === 'permission')         return <PermissionScreen         onAgree={() => navigate('permission-granted')} />;
  if (screen === 'permission-granted') return <PermissionGrantedScreen  onConfirm={() => navigate('auth')} />;
  if (screen === 'auth')               return <AuthScreen               onLogin={handleAuthSuccess} />;
  if (screen === 'home')               return <HomeScreen               onNavigate={navigate} />;
  if (screen === 'messages')           return <MessagesScreen           onNavigate={navigate} />;
  if (screen === 'spam')               return <SpamScreen               onNavigate={navigate} />;
  if (screen === 'blocked')            return <BlockedScreen            onNavigate={navigate} />;
  if (screen === 'settings')           return <SettingsScreen           onNavigate={navigate} />;
  return null;
}

export default function App() {
  useEffect(() => {
    // Save API base URL for native module
    const apiBase = 'https://stuffing-deceit-handoff.ngrok-free.dev';
    saveApiBaseForNative(apiBase);
  }, []);

  return (
    <StoreProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Navigator />
    </StoreProvider>
  );
}

// Export helpers for use in store
export { saveTokenForNative, saveApiBaseForNative };