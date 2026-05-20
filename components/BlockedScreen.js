import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList,
  TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { styles, theme } from '../styles';
import { useStore, selectors } from '../data/store';
import BottomNav from './BottomNav';

export default function BlockedScreen({ onNavigate }) {
  const { state, fetchBlocked, unblockNumber } = useStore();
  const { blocked, loading } = state;
  const [search, setSearch] = useState('');

  useEffect(() => { fetchBlocked(); }, []);

  const filtered = blocked.filter(b =>
    (b.display_name ?? b.sender).toLowerCase().includes(search.toLowerCase())
  );

  const handleUnblock = (item) => {
    Alert.alert(
      'Unblock Number?',
      `${item.display_name ?? item.sender} will be able to send you messages again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unblock', onPress: () => unblockNumber(item.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('home')}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blocked</Text>
        <Text style={{ color: theme.textMuted, fontSize: 13 }}>
          {blocked.length > 0 ? `${blocked.length} numbers` : ''}
        </Text>
      </View>

      {blocked.length > 0 && (
        <TextInput
          style={styles.searchInput}
          placeholder="🔍  Search blocked..."
          placeholderTextColor={theme.textLight}
          value={search}
          onChangeText={setSearch}
        />
      )}

      {loading ? (
        <View style={local.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : blocked.length === 0 ? (
        <View style={local.emptyWrap}>
          <Text style={local.emptyEmoji}>🔓</Text>
          <Text style={local.emptyTitle}>No blocked numbers</Text>
          <Text style={local.emptyDesc}>No blocked numbers yet.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={styles.messageCard}>
              <View style={[styles.avatarCircle, { backgroundColor: '#F3F4F6' }]}>
                <Text style={{ fontSize: 18 }}>🔒</Text>
              </View>
              <View style={styles.msgBody}>
                <Text style={styles.msgSender}>{item.display_name ?? item.sender}</Text>
                <Text style={styles.msgPreview}>{item.reason}</Text>
                {item.message_count != null && (
                  <Text style={local.metaText}>
                    {item.message_count} message{item.message_count !== 1 ? 's' : ''} blocked
                    {item.blocked_at ? ` · ${selectors.formatDate(item.blocked_at)}` : ''}
                  </Text>
                )}
              </View>
              <TouchableOpacity style={styles.unblockBtn} onPress={() => handleUnblock(item)}>
                <Text style={styles.unblockBtnText}>Unblock</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={local.emptyWrap}>
              <Text style={local.emptyEmoji}>🔍</Text>
              <Text style={local.emptyTitle}>No results</Text>
            </View>
          }
        />
      )}
      <BottomNav active="blocked" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}

const local = StyleSheet.create({
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyEmoji:{ fontSize: 52, marginBottom: 16 },
  emptyTitle:{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: theme.textMuted, textAlign: 'center', lineHeight: 22 },
  metaText:  { fontSize: 11, color: theme.textMuted, marginTop: 3 },
});