import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles, theme } from '../styles';

const NAV_ITEMS = [
  { key: 'messages', label: 'Messages', icon: '💬' },
  { key: 'spam',     label: 'Spam',     icon: '🚫' },
  { key: 'home',     label: 'Home',     icon: '🏠' },
  { key: 'blocked',  label: 'Blocked',  icon: '🔒' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function BottomNav({ active, onNavigate }) {
  return (
    <View style={styles.bottomNav}>
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.navItem}
            onPress={() => onNavigate(item.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.navIcon}>{item.icon}</Text>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
            {isActive && <View style={styles.navDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}