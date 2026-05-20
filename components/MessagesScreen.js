import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList,
  TouchableOpacity, SafeAreaView, ActivityIndicator, StyleSheet,
} from 'react-native';
import { styles, theme } from '../styles';
import { useStore, selectors } from '../data/store';
import BottomNav from './BottomNav';

export default function MessagesScreen({ onNavigate }) {
  const { state, fetchMessages, markMessageRead } = useStore();
  const { messages, loading } = state;
  const [search, setSearch] = useState('');

  useEffect(() => { fetchMessages(); }, []);

  const filtered = messages.filter(m =>
    (m.display_name ?? m.sender).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('home')}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Messages</Text>
        <Text style={{ color: theme.textMuted, fontSize: 13 }}>
          {messages.length > 0 ? `${messages.length} total` : ''}
        </Text>
      </View>

      {messages.length > 0 && (
        <TextInput
          style={styles.searchInput}
          placeholder="🔍  Search messages..."
          placeholderTextColor={theme.textLight}
          value={search}
          onChangeText={setSearch}
        />
      )}

      {loading ? (
        <View style={local.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : messages.length === 0 ? (
        <EmptyState emoji="📭" title="No messages yet" desc="No messages yet." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const name    = item.display_name ?? item.sender;
            const isScam  = item.type === 'scam';
            const isRead  = item.is_read;
            return (
              <TouchableOpacity
                style={[
                  styles.messageCard,
                  !isRead && { borderLeftWidth: 3, borderLeftColor: theme.primary },
                ]}
                onPress={() => markMessageRead(item.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.avatarCircle, isScam && { backgroundColor: theme.dangerLight }]}>
                  <Text style={[styles.avatarText, isScam && { color: theme.danger }]}>
                    {selectors.getInitials(name)}
                  </Text>
                </View>
                <View style={styles.msgBody}>
                  <Text style={styles.msgSender}>{name}</Text>
                  <Text style={styles.msgPreview} numberOfLines={1}>{item.preview}</Text>
                  {item.tags?.length > 0 && (
                    <View style={local.tagRow}>
                      {item.tags.map(tag => (
                        <View key={tag} style={local.tag}>
                          <Text style={local.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <View style={isScam ? styles.badgeSpam : styles.badgeSafe}>
                    <Text style={isScam ? styles.badgeSpamText : styles.badgeSafeText}>
                      {isScam ? '🚫 Scam' : '✅ Safe'}
                    </Text>
                  </View>
                  {item.received_at && (
                    <Text style={local.timeText}>{selectors.formatDate(item.received_at)}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <EmptyState emoji="🔍" title="No results" desc={`No messages match "${search}"`} />
          }
        />
      )}
      <BottomNav active="messages" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}

function EmptyState({ emoji, title, desc }) {
  return (
    <View style={local.emptyWrap}>
      <Text style={local.emptyEmoji}>{emoji}</Text>
      <Text style={local.emptyTitle}>{title}</Text>
      <Text style={local.emptyDesc}>{desc}</Text>
    </View>
  );
}

const local = StyleSheet.create({
  centered:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tagRow:     { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  tag:        { backgroundColor: theme.dangerLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tagText:    { fontSize: 9, color: theme.danger, fontWeight: '700', textTransform: 'uppercase' },
  timeText:   { fontSize: 10, color: theme.textLight },
  emptyWrap:  { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 8 },
  emptyDesc:  { fontSize: 14, color: theme.textMuted, textAlign: 'center', lineHeight: 22 },
});