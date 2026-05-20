import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert, ScrollView, StyleSheet } from 'react-native';
import { styles, theme } from '../styles';
import { useStore, selectors } from '../data/store';
import BottomNav from './BottomNav';

const SETTINGS = [
  { icon: '👤', label: 'Account Management',       sub: 'Manage your profile & data' },
  { icon: '🔔', label: 'Notification Preferences', sub: 'Alerts, sounds & badges' },
  { icon: '🔏', label: 'Privacy Policy',           sub: 'How we handle your data' },
  { icon: 'ℹ️', label: 'About Detectify',          sub: 'Version 1.0.0' },
];

export default function SettingsScreen({ onNavigate }) {
  const { state, logout, fetchPreferences } = useStore();
  const { user, preferences } = state;

  useEffect(() => {
    fetchPreferences();
  }, []);

  const handleLogout = () => {
    Alert.alert('Log Out?', 'You will be returned to the sign-in screen.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          onNavigate('auth');
        },
      },
    ]);
  };

  // Get initials from full name
  const initials = user?.full_name
    ? selectors.getInitials(user.full_name)
    : user?.email
      ? user.email[0].toUpperCase()
      : '?';

  const displayName = user?.full_name || 'My Account';
  const displayEmail = user?.email || '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Profile banner */}
        <View style={local.profileBanner}>
          <View style={local.avatar}>
            <Text style={local.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={local.profileName}>{displayName}</Text>
            <Text style={local.profileEmail}>{displayEmail}</Text>
            <View style={local.planBadge}>
              <Text style={local.planText}>
                {user?.plan === 'premium' ? '⭐ Premium' : '🆓 Free Plan'}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings list */}
        <View style={styles.settingsGroup}>
          {SETTINGS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.settingsRow, i === SETTINGS.length - 1 && styles.settingsRowLast]}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingsLabel}>{item.label}</Text>
                <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 1 }}>{item.sub}</Text>
              </View>
              <Text style={styles.settingsChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={{ fontSize: 18, marginRight: 8 }}>🚪</Text>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>

      <BottomNav active="settings" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}

const local = StyleSheet.create({
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    margin: 16,
    padding: 18,
    backgroundColor: theme.primaryLight,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText:   { fontSize: 20, color: '#fff', fontWeight: '700' },
  profileName:  { fontSize: 17, fontWeight: '700', color: theme.text },
  profileEmail: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  planBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  planText: { fontSize: 11, color: theme.primary, fontWeight: '600' },
});