import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { styles, theme } from '../styles';

export default function PermissionGrantedScreen({ onConfirm }) {
  return (
    <View style={styles.centerContainer}>
      {/* Success icon */}
      <View style={styles.checkCircle}>
        <Text style={styles.checkEmoji}>✅</Text>
      </View>

      <Text style={styles.heroTitle}>You're All Set!</Text>
      <Text style={[styles.heroSubtitle, { marginBottom: 0 }]}>
        All permissions have been granted successfully.
      </Text>

      {/* Status card */}
      <View style={styles.grantedCard}>
        <Text style={styles.grantedTitle}>✅ PERMISSIONS GRANTED</Text>
        <Text style={styles.grantedDesc}>
          Detectify is now connected to your SMS inbox and will protect you from scam messages in real time.
        </Text>
      </View>

      {/* Feature chips */}
      <View style={local.chips}>
        {['Real-time scanning', 'Auto-block', 'Spam reports'].map((chip) => (
          <View key={chip} style={local.chip}>
            <Text style={local.chipText}>✓ {chip}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[styles.btnPrimary, { width: '100%' }]} onPress={onConfirm} activeOpacity={0.85}>
        <Text style={styles.btnPrimaryText}>Start Protecting Me →</Text>
      </TouchableOpacity>
    </View>
  );
}

const local = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 28 },
  chip: {
    backgroundColor: theme.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontSize: 12, color: theme.primary, fontWeight: '600' },
});