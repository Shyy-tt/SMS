import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert
} from 'react-native';
import { styles, theme } from '../styles';
import { useStore } from '../data/store';

export default function AuthScreen({ onLogin }) {
  const { login, register, state } = useStore();
  const [isSignUp, setIsSignUp]   = useState(false);
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (isSignUp && !name) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    const result = isSignUp
      ? await register(name, email, password)
      : await login(email, password);

    if (result.success) {
      onLogin();
    } else {
      Alert.alert('Error', result.error || 'Something went wrong');
    }
  };

  return (
    <View style={styles.centerContainer}>
      <View style={local.logoWrap}>
        <Text style={local.logoIcon}>🛡️</Text>
        <Text style={styles.logo}>DETECTIFY</Text>
      </View>
      <Text style={styles.tagline}>Guard your Privacy,{'\n'}Be Scam Savvy.</Text>

      <View style={local.card}>
        <Text style={local.cardTitle}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>

        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={theme.textLight}
            value={name}
            onChangeText={setName}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor={theme.textLight}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={theme.textLight}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {state.error && (
          <Text style={local.errorText}>{state.error}</Text>
        )}

        <TouchableOpacity
          style={[styles.btnPrimary, { marginTop: 4, marginBottom: 0 }]}
          onPress={handleSubmit}
          disabled={state.loading}
          activeOpacity={0.85}
        >
          {state.loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnPrimaryText}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
          }
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={{ marginTop: 20 }}>
        <Text style={styles.switchText}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <Text style={{ fontWeight: '700' }}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const local = StyleSheet.create({
  logoWrap: { alignItems: 'center', marginBottom: 4 },
  logoIcon: { fontSize: 44, marginBottom: 6 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle:  { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 18 },
  errorText:  { color: theme.danger, fontSize: 13, marginBottom: 8, textAlign: 'center' },
});