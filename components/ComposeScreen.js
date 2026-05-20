import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, 
  SafeAreaView, Alert, ActivityIndicator, StyleSheet
} from 'react-native';
import { NativeModules, Platform } from 'react-native';
import { styles, theme } from '../styles';
import { useStore } from '../data/store';

const { SmsModule } = NativeModules;

export default function ComposeScreen({ onNavigate }) {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { state } = useStore();

  const handleSend = async () => {
    if (!recipient.trim()) {
      Alert.alert('Error', 'Please enter a recipient number');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setSending(true);

    try {
      if (Platform.OS === 'android' && SmsModule) {
        const success = await SmsModule.sendSMS(recipient, message);
        if (success) {
          Alert.alert('Sent', 'Message sent successfully!', [
            { text: 'OK', onPress: () => onNavigate('messages') }
          ]);
          setMessage('');
          setRecipient('');
        }
      } else {
        Alert.alert('Info', 'SMS sending only available on Android');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to send: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('messages')}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Message</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={local.container}>
        <View style={local.recipientContainer}>
          <Text style={local.label}>To:</Text>
          <TextInput
            style={local.recipientInput}
            placeholder="+639xxxxxxxxx"
            placeholderTextColor={theme.textLight}
            value={recipient}
            onChangeText={setRecipient}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
        </View>

        <View style={local.messageContainer}>
          <TextInput
            style={local.messageInput}
            placeholder="Type your message here..."
            placeholderTextColor={theme.textLight}
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.btnPrimary, sending && local.disabledBtn]}
          onPress={handleSend}
          disabled={sending}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnPrimaryText}>Send Message →</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const local = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  recipientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginRight: 12,
  },
  recipientInput: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
    padding: 0,
  },
  messageContainer: {
    flex: 1,
    marginBottom: 16,
  },
  messageInput: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
  },
  disabledBtn: {
    opacity: 0.6,
  },
});