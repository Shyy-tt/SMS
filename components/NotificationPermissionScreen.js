import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationPermissionScreen({ onComplete }) {
  
  const openNotificationSettings = () => {
    Linking.sendIntent('android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS');
  };
  
  const checkAndContinue = () => {
    Alert.alert(
      'Confirm Permission',
      'Have you enabled Detectify in Notification Access settings?',
      [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Yes, enabled', onPress: onComplete }
      ]
    );
  };
  
  return (
    <View style={styles.container}>
      <Ionicons name="notifications" size={80} color="#FF6B35" />
      <Text style={styles.title}>Enable Notification Access</Text>
      <Text style={styles.description}>
        Detectify needs permission to read SMS notifications from your messaging app.
        This allows us to detect scams WITHOUT being your default SMS app.
      </Text>
      
      <View style={styles.stepCard}>
        <Text style={styles.stepNumber}>1</Text>
        <Text style={styles.stepText}>Tap "Open Settings" below</Text>
      </View>
      
      <View style={styles.stepCard}>
        <Text style={styles.stepNumber}>2</Text>
        <Text style={styles.stepText}>Find and tap "Detectify" in the list</Text>
      </View>
      
      <View style={styles.stepCard}>
        <Text style={styles.stepNumber}>3</Text>
        <Text style={styles.stepText}>Toggle ON "Allow notification access"</Text>
      </View>
      
      <TouchableOpacity style={styles.settingsButton} onPress={openNotificationSettings}>
        <Text style={styles.settingsButtonText}>Open Settings</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.continueButton} onPress={checkAndContinue}>
        <Text style={styles.continueButtonText}>I've Enabled It →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
    color: '#1a1a2e',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
    lineHeight: 24,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    backgroundColor: '#FF6B35',
    color: '#fff',
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 16,
    marginRight: 12,
    fontWeight: 'bold',
    fontSize: 16,
    overflow: 'hidden',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  settingsButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: 'transparent',
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderRadius: 12,
  },
  continueButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
});