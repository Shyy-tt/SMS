import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { styles, theme } from '../styles';

export default function OnboardingScreen({ onNext }) {
  return (
    <View style={styles.container}>
      {/* Illustration */}
      <View style={local.illustrationWrap}>
        <View style={local.illustrationCircle}>
          <Text style={local.illustrationEmoji}>🛡️</Text>
        </View>
        <View style={local.dotTL} />
        <View style={local.dotBR} />
      </View>

      {/* Text */}
      <View style={local.textWrap}>
        <Text style={styles.heroTitle}>Your Privacy,{'\n'}Your Control!</Text>
        <Text style={styles.heroSubtitle}>
          Detectify monitors your SMS in real time,{'\n'}
          blocking scam messages before they reach you.
        </Text>
      </View>

      {/* Pill indicators */}
      <View style={local.dots}>
        <View style={[local.pill, local.pillActive]} />
        <View style={local.pill} />
        <View style={local.pill} />
      </View>

      <TouchableOpacity style={styles.btnPrimary} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.btnPrimaryText}>Get Started →</Text>
      </TouchableOpacity>

      <Text style={local.terms}>
        By continuing, you agree to our{' '}
        <Text style={{ color: theme.primary, fontWeight: '600' }}>Terms & Conditions</Text>
      </Text>
    </View>
  );
}

const local = StyleSheet.create({
  illustrationWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  illustrationCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: theme.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#C7D2FE',
  },
  illustrationEmoji: { fontSize: 80 },
  dotTL: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#C7D2FE',
  },
  dotBR: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#A5B4FC',
  },
  textWrap: { paddingBottom: 32 },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 28 },
  pill: { width: 20, height: 6, borderRadius: 3, backgroundColor: theme.border },
  pillActive: { width: 40, backgroundColor: theme.primary },
  terms: { textAlign: 'center', fontSize: 12, color: theme.textMuted, marginTop: 14 },
});