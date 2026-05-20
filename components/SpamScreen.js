import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList,
  TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { styles, theme } from '../styles';
import { useStore, selectors } from '../data/store';
import BottomNav from './BottomNav';

export default function SpamScreen({ onNavigate }) {
  const { state, fetchMessages, clearSpam } = useStore();
  const { messages, loading } = state;
  const [search, setSearch] = useState('');

  useEffect(() => { fetchMessages(); }, []);

  const spamMessages = messages.filter(m => m.type === 'scam');
  const filtered = spamMessages.filter(m =>
    (m.display_name ?? m.sender).toLowerCase().includes(search.toLowerCase())
  );

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Spam?',
      `This will remove ${spamMessages.length} scam message(s).`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearSpam },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('home')}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Spam {spamMessages.length > 0 ? `(${spamMessages.length})` : ''}
        </Text>
        {spamMessages.length > 0 ? (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearBtn}>Clear All</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {spamMessages.length > 0 && (
        <TextInput
          style={styles.searchInput}
          placeholder="🔍  Search spam..."
          placeholderTextColor={theme.textLight}
          value={search}
          onChangeText={setSearch}
        />
      )}

      {loading ? (
        <View style={local.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : spamMessages.length === 0 ? (
        <View style={local.emptyWrap}>
          <Text style={local.emptyEmoji}>🎉</Text>
          <Text style={local.emptyTitle}>No spam messages</Text>
          <Text style={local.emptyDesc}>No scam messages detected yet.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const name = item.display_name ?? item.sender;
            return (
              <View style={styles.messageCard}>
                <View style={[styles.avatarCircle, { backgroundColor: theme.dangerLight }]}>
                  <Text style={[styles.avatarText, { color: theme.danger }]}>
                    {selectors.getInitials(name)}
                  </Text>
                </View>
                <View style={styles.msgBody}>
                  <Text style={styles.msgSender}>{name}</Text>
                  <Text style={styles.msgPreview} numberOfLines={1}>{item.preview}</Text>
                  {item.confidence != null && (
                    <Text style={local.confidenceText}>
                      Confidence: {selectors.confidenceLabel(item.confidence)} ({Math.round(item.confidence * 100)}%)
                      · {selectors.formatDate(item.received_at)}
                    </Text>
                  )}
                </View>
                <View style={styles.badgeSpam}>
                  <Text style={styles.badgeSpamText}>Scam</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={local.emptyWrap}>
              <Text style={local.emptyEmoji}>🔍</Text>
              <Text style={local.emptyTitle}>No results</Text>
            </View>
          }
        />
      )}
      <BottomNav active="spam" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}

const local = StyleSheet.create({
  centered:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap:       { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyEmoji:      { fontSize: 52, marginBottom: 16 },
  emptyTitle:      { fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 8 },
  emptyDesc:       { fontSize: 14, color: theme.textMuted, textAlign: 'center', lineHeight: 22 },
  confidenceText:  { fontSize: 11, color: theme.textMuted, marginTop: 3 },
});