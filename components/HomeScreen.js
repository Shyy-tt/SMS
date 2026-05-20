import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, StyleSheet,
  PermissionsAndroid, Platform, Alert,
} from 'react-native';
import { styles, theme } from '../styles';
import { useStore, selectors } from '../data/store';
import BottomNav from './BottomNav';

export default function HomeScreen({ onNavigate }) {
  const { state, fetchMessages, fetchStats, fetchNotifications, scanSMS } = useStore();
  const { messages, stats, notifications, user, loading } = state;
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchStats();
    fetchNotifications();
    readAndScanInbox();
  }, []);

  // ── Read existing SMS inbox and scan each message ──────────
  const readAndScanInbox = async () => {
    if (Platform.OS !== 'android') return;

    try {
      // Request SMS permission
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      ]);

      const readGranted  = granted['android.permission.READ_SMS']    === 'granted';
      const recvGranted  = granted['android.permission.RECEIVE_SMS'] === 'granted';

      if (!readGranted) {
        console.log('SMS read permission denied');
        return;
      }

      setScanning(true);

      // Dynamically import to avoid issues on iOS
      const SmsAndroid = require('react-native-get-sms-android').default;

      const filter = JSON.stringify({
        box:      'inbox',
        maxCount: 50,         // read last 50 SMS
        indexFrom: 0,
      });

      SmsAndroid.list(
        filter,
        (fail) => {
          console.log('Failed to read SMS:', fail);
          setScanning(false);
        },
        async (count, smsList) => {
          const messages = JSON.parse(smsList);
          console.log(`Found ${count} SMS messages`);

          // Scan each message through backend ML
          for (const sms of messages) {
            await scanSMS(
              sms.address  || 'Unknown',
              sms.body     || '',
              sms.address  || null,
            );
          }

          // Refresh messages after scanning
          await fetchMessages();
          await fetchStats();
          setScanning(false);
        }
      );
    } catch (e) {
      console.error('readAndScanInbox error:', e.message);
      setScanning(false);
    }
  };

  const spamCount    = selectors.spamMessages(messages).length;
  const unreadNotifs = selectors.unreadNotifs(notifications);
  const recent       = messages.slice(0, 4);

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.logoSmall}>🛡️ DETECTIFY</Text>
        <View style={local.dateBadge}>
          <Text style={local.dateText}>{dateStr}</Text>
        </View>
      </View>

      {loading && !stats ? (
        <View style={local.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={local.loadingText}>Loading...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Scanning banner */}
          {scanning && (
            <View style={local.scanBanner}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={local.scanText}>Scanning your SMS inbox...</Text>
            </View>
          )}

          {/* Greeting */}
          <View style={local.greeting}>
            <Text style={local.greetTitle}>
              {user?.full_name ? `Hello, ${user.full_name.split(' ')[0]}! 👋` : 'Welcome! 👋'}
            </Text>
            <Text style={[local.greetSub, spamCount > 0 && { color: theme.danger }]}>
              {spamCount > 0
                ? `⚠️ ${spamCount} scam message${spamCount > 1 ? 's' : ''} detected`
                : '✅ No threats detected'}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={[styles.statCard, styles.statCardSafe]}
              onPress={() => onNavigate('messages')}
              activeOpacity={0.8}
            >
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statValue}>{stats?.safeMessages ?? 0}</Text>
              <Text style={styles.statLabel}>SAFE{'\n'}MESSAGES</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, styles.statCardBlocked]}
              onPress={() => onNavigate('blocked')}
              activeOpacity={0.8}
            >
              <Text style={styles.statIcon}>🚫</Text>
              <Text style={styles.statValue}>{stats?.blockedNumbers ?? 0}</Text>
              <Text style={styles.statLabel}>BLOCKED</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, styles.statCardNotif]}
              onPress={() => onNavigate('spam')}
              activeOpacity={0.8}
            >
              <Text style={styles.statIcon}>🔔</Text>
              <Text style={styles.statValue}>{unreadNotifs}</Text>
              <Text style={styles.statLabel}>ALERTS</Text>
            </TouchableOpacity>
          </View>

          {/* Accuracy banner */}
          {stats?.accuracyRate && (
            <View style={local.banner}>
              <Text style={local.bannerIcon}>🎯</Text>
              <Text style={local.bannerText}>
                {stats.accuracyRate}% detection accuracy — {stats.spamDetected} scams blocked
              </Text>
            </View>
          )}

          {/* Rescan button */}
          <TouchableOpacity
            style={local.rescanBtn}
            onPress={readAndScanInbox}
            disabled={scanning}
            activeOpacity={0.8}
          >
            <Text style={local.rescanText}>
              {scanning ? 'Scanning...' : '🔄 Rescan SMS Inbox'}
            </Text>
          </TouchableOpacity>

          {/* Recent Messages */}
          <View style={local.section}>
            <View style={local.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Messages</Text>
              {recent.length > 0 && (
                <TouchableOpacity onPress={() => onNavigate('messages')}>
                  <Text style={local.seeAll}>See all →</Text>
                </TouchableOpacity>
              )}
            </View>

            {recent.length === 0 ? (
              <View style={local.emptyCard}>
                <Text style={local.emptyEmoji}>📭</Text>
                <Text style={local.emptyTitle}>No messages yet</Text>
                <Text style={local.emptyDesc}>
                  Tap "Rescan SMS Inbox" to scan your messages.
                </Text>
              </View>
            ) : (
              recent.map((msg) => {
                const name = msg.display_name ?? msg.sender;
                return (
                  <View key={msg.id} style={styles.messageCard}>
                    <View style={[styles.avatarCircle, msg.type === 'scam' && { backgroundColor: theme.dangerLight }]}>
                      <Text style={[styles.avatarText, msg.type === 'scam' && { color: theme.danger }]}>
                        {selectors.getInitials(name)}
                      </Text>
                    </View>
                    <View style={styles.msgBody}>
                      <Text style={styles.msgSender} numberOfLines={1}>{name}</Text>
                      <Text style={styles.msgPreview} numberOfLines={1}>{msg.preview}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <View style={msg.type === 'scam' ? styles.badgeSpam : styles.badgeSafe}>
                        <Text style={msg.type === 'scam' ? styles.badgeSpamText : styles.badgeSafeText}>
                          {msg.type === 'scam' ? 'Scam' : 'Safe'}
                        </Text>
                      </View>
                      <Text style={local.timeText}>{selectors.formatDate(msg.received_at)}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      <BottomNav active="home" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}

const local = StyleSheet.create({
  dateBadge: {
    backgroundColor: theme.bg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: theme.border,
  },
  dateText:    { fontSize: 12, color: theme.textMuted, fontWeight: '500' },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: theme.textMuted, fontSize: 14 },
  scanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: theme.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  scanText:    { fontSize: 13, color: theme.primary, fontWeight: '500' },
  greeting:    { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  greetTitle:  { fontSize: 22, fontWeight: '800', color: theme.text, marginBottom: 3 },
  greetSub:    { fontSize: 14, color: theme.success, fontWeight: '500' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    backgroundColor: theme.primaryLight,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  bannerIcon:  { fontSize: 20 },
  bannerText:  { flex: 1, fontSize: 13, color: theme.primaryDark, fontWeight: '500', lineHeight: 18 },
  rescanBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.primary,
    alignItems: 'center',
  },
  rescanText:  { fontSize: 14, color: theme.primary, fontWeight: '600' },
  section:     { paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll:      { fontSize: 13, color: theme.primary, fontWeight: '600' },
  timeText:    { fontSize: 10, color: theme.textLight },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: theme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
  },
  emptyEmoji:  { fontSize: 48, marginBottom: 12 },
  emptyTitle:  { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 8 },
  emptyDesc:   { fontSize: 13, color: theme.textMuted, textAlign: 'center', lineHeight: 20 },
});