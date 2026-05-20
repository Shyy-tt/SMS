import React, { createContext, useContext, useReducer, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform, NativeModules } from 'react-native';
import RNFS from 'react-native-fs';
import { saveTokenForNative } from '../App';

const API_BASE = 'https://stuffing-deceit-handoff.ngrok-free.dev';

const initialState = {
  user:          null,
  token:         null,
  messages:      [],
  blocked:       [],
  stats:         null,
  notifications: [],
  preferences:   null,
  loading:       false,
  error:         null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'LOGOUT':
      return { ...initialState };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload, loading: false };
    case 'MARK_READ': {
      const updated = state.messages.map(m =>
        m.id === action.payload ? { ...m, is_read: true } : m
      );
      return { ...state, messages: updated };
    }
    case 'SET_BLOCKED':
      return { ...state, blocked: action.payload, loading: false };
    case 'UNBLOCK_NUMBER':
      return { ...state, blocked: state.blocked.filter(b => b.id !== action.payload) };
    case 'SET_STATS':
      return { ...state, stats: action.payload, loading: false };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload, loading: false };
    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload, loading: false };
    case 'UPDATE_PREFERENCE': {
      const { group, key, value } = action.payload;
      return {
        ...state,
        preferences: {
          ...state.preferences,
          [group]: { ...state.preferences[group], [key]: value },
        },
      };
    }
    case 'CLEAR_SPAM':
      return { ...state, messages: state.messages.filter(m => m.type !== 'scam') };
    default:
      return state;
  }
}

// Save token to both SecureStore and SharedPreferences
// SharedPreferences is needed by SmsReceiver.kt (native Android)
const saveToken = async (token) => {
  try {
    await SecureStore.setItemAsync('token', token);
    
    // Save to file for native Android module
    if (Platform.OS === 'android') {
      await saveTokenForNative(token);
    }
  } catch (e) {
    console.error('saveToken error:', e.message);
  }
};

const clearNativeToken = async () => {
  if (Platform.OS === 'android') {
    try {
      const tokenPath = RNFS.DocumentDirectoryPath + '/token.txt';
      if (await RNFS.exists(tokenPath)) {
        await RNFS.unlink(tokenPath);
      }
    } catch (e) {
      console.error('clearNativeToken error:', e.message);
    }
  }
};

const clearToken = async () => {
  try {
    await SecureStore.deleteItemAsync('token');
  } catch (e) {
    console.error('clearToken error:', e.message);
  }
};

const getToken = async () => {
  try {
    return await SecureStore.getItemAsync('token');
  } catch {
    return null;
  }
};

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const login = useCallback(async (email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      await saveToken(data.access_token);
      dispatch({ type: 'SET_TOKEN', payload: data.access_token });
      dispatch({ type: 'SET_USER',  payload: data.user });
      return { success: true };
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
      return { success: false, error: e.message };
    }
  }, []);

  const register = useCallback(async (fullName, email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');
      await saveToken(data.access_token);
      dispatch({ type: 'SET_TOKEN', payload: data.access_token });
      dispatch({ type: 'SET_USER',  payload: data.user });
      return { success: true };
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
      return { success: false, error: e.message };
    }
  }, []);

  const logout = useCallback(async () => {
  await clearToken();
  await clearNativeToken();
  dispatch({ type: 'LOGOUT' });
}, []);

  const fetchMessages = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/messages/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      dispatch({ type: 'SET_MESSAGES', payload: data });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    }
  }, []);

  const markMessageRead = useCallback(async (messageId) => {
    try {
      const token = await getToken();
      await fetch(`${API_BASE}/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch({ type: 'MARK_READ', payload: messageId });
    } catch (e) {
      console.error('markMessageRead error:', e.message);
    }
  }, []);

  const clearSpam = useCallback(async () => {
    try {
      const token = await getToken();
      await fetch(`${API_BASE}/messages/spam`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch({ type: 'CLEAR_SPAM' });
    } catch (e) {
      console.error('clearSpam error:', e.message);
    }
  }, []);

  const scanSMS = useCallback(async (sender, body, displayName = null) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sender, body, display_name: displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      return data;
    } catch (e) {
      console.error('scanSMS error:', e.message);
      return null;
    }
  }, []);

  const fetchBlocked = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/blocked/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      dispatch({ type: 'SET_BLOCKED', payload: data });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    }
  }, []);

  const unblockNumber = useCallback(async (blockedId) => {
    try {
      const token = await getToken();
      await fetch(`${API_BASE}/blocked/${blockedId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch({ type: 'UNBLOCK_NUMBER', payload: blockedId });
    } catch (e) {
      console.error('unblockNumber error:', e.message);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/messages/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      dispatch({
        type: 'SET_STATS',
        payload: {
          safeMessages:   data.safe_messages,
          spamDetected:   data.spam_detected,
          blockedNumbers: data.blocked_numbers,
          activeAlerts:   data.active_alerts,
          accuracyRate:   data.accuracy_rate,
          lastScannedAt:  data.last_scanned_at,
        },
      });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    dispatch({ type: 'SET_NOTIFICATIONS', payload: [] });
  }, []);

  const fetchPreferences = useCallback(async () => {
    dispatch({
      type: 'SET_PREFERENCES',
      payload: {
        notifications: { spamAlerts: true, weeklyReport: true, autoBlockAlerts: false },
        scanning:      { autoBlock: false, autoBlockThreshold: 3, scanIncoming: true },
        privacy:       { shareAnonymousData: false },
      },
    });
  }, []);

  const updatePreference = useCallback(async (group, key, value) => {
    dispatch({ type: 'UPDATE_PREFERENCE', payload: { group, key, value } });
  }, []);

  const value = {
    state, dispatch,
    login, register, logout,
    fetchMessages, markMessageRead, clearSpam, scanSMS,
    fetchBlocked, unblockNumber,
    fetchStats, fetchNotifications,
    fetchPreferences, updatePreference,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

export const selectors = {
  spamMessages:    (messages) => messages.filter(m => m.type === 'scam'),
  safeMessages:    (messages) => messages.filter(m => m.type === 'ham'),
  unreadCount:     (messages) => messages.filter(m => !m.is_read).length,
  unreadNotifs:    (notifs)   => notifs.filter(n => !n.isRead).length,
  getInitials:     (name)     => name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?',
  formatDate:      (iso)      => {
    if (!iso) return '';
    const d    = new Date(iso);
    const now  = new Date();
    const mins = Math.floor((now - d) / 60000);
    if (mins < 60)  return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs}h ago`;
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  },
  confidenceLabel: (score) => {
    if (score >= 0.9) return 'High';
    if (score >= 0.7) return 'Medium';
    return 'Low';
  },
};