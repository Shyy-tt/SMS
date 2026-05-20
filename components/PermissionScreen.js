import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, StyleSheet, StatusBar,
  Platform, Alert, Linking
} from 'react-native';
import { PermissionsAndroid } from 'react-native';

const PERMISSIONS = [
  {
    key: 'readSms',
    label: 'Read SMS',
    sub: 'View incoming messages',
    androidPerm: PermissionsAndroid.PERMISSIONS.READ_SMS,
    iosPerm: null,
  },
  {
    key: 'receiveSms',
    label: 'Receive SMS',
    sub: 'Monitor messages in real time',
    androidPerm: PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    iosPerm: null,
  },
  {
    key: 'sendSms', // ✅ ADDED
    label: 'Send SMS',
    sub: 'Reply to messages',
    androidPerm: PermissionsAndroid.PERMISSIONS.SEND_SMS,
    iosPerm: null,
  },
  {
    key: 'notificationAccess',
    label: 'Notification Access',
    sub: 'Read SMS notifications (no default SMS app needed)',
    androidPerm: 'notification_listener',
    iosPerm: null,
  },
  {
    key: 'postNotifications',
    label: 'Post Notifications',
    sub: 'Alert you about scam messages',
    androidPerm: PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    iosPerm: null,
  },
];

export default function PermissionScreen({ onAgree }) {
  const [perms, setPerms] = useState({
    readSms: false,
    receiveSms: false,
    sendSms: false, // ✅ ADDED
    notificationAccess: false,
    postNotifications: false,
  });
  const [requesting, setRequesting] = useState(false);

  const checkPermission = async (permKey) => {
    const permConfig = PERMISSIONS.find(p => p.key === permKey);
    if (!permConfig || !permConfig.androidPerm) return false;
    
    if (permKey === 'notificationAccess') {
      return false;
    }
    
    try {
      const status = await PermissionsAndroid.check(permConfig.androidPerm);
      return status === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error(`Check ${permKey} error:`, err);
      return false;
    }
  };

  const requestSinglePermission = async (permKey) => {
    const permConfig = PERMISSIONS.find(p => p.key === permKey);
    if (!permConfig) return false;
    
    if (permKey === 'notificationAccess') {
      await requestNotificationAccess();
      return false;
    }
    
    if (!permConfig.androidPerm) return false;
    
    try {
      const granted = await PermissionsAndroid.request(permConfig.androidPerm);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error(`Request ${permKey} error:`, err);
      return false;
    }
  };

  const requestNotificationAccess = async () => {
    if (Platform.OS === 'android') {
      Alert.alert(
        'Enable Notification Access',
        'To scan SMS messages without being your default SMS app, Detectify needs notification access.\n\nThis allows us to read SMS notifications from your messaging app (Google Messages, Samsung Messages, etc.).',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: async () => {
              try {
                await Linking.sendIntent('android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS');
              } catch (e) {
                Linking.openSettings();
              }
            }
          }
        ]
      );
    }
  };

  const checkNotificationListener = async () => {
    return perms.notificationAccess;
  };

  const toggle = async (key) => {
    if (perms[key]) {
      setPerms(prev => ({ ...prev, [key]: false }));
    } else {
      setRequesting(true);
      const granted = await requestSinglePermission(key);
      setRequesting(false);
      
      if (granted || key === 'notificationAccess') {
        setPerms(prev => ({ ...prev, [key]: true }));
      } else {
        Alert.alert(
          'Permission Required',
          `Detectify needs ${PERMISSIONS.find(p => p.key === key)?.label} permission to protect you from SMS scams.`,
          [
            { text: 'OK' },
            { text: 'Retry', onPress: () => toggle(key) }
          ]
        );
      }
    }
  };

  const requestAllPermissions = async () => {
    setRequesting(true);
    
    const results = {};
    for (const perm of PERMISSIONS) {
      if (perm.key === 'notificationAccess') {
        await requestNotificationAccess();
        results[perm.key] = true;
      } else if (perm.androidPerm) {
        try {
          const granted = await PermissionsAndroid.request(perm.androidPerm);
          results[perm.key] = granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
          results[perm.key] = false;
        }
      }
    }
    
    setPerms(prev => ({
      ...prev,
      readSms: results.readSms || false,
      receiveSms: results.receiveSms || false,
      sendSms: results.sendSms || false, // ✅ ADDED
      postNotifications: results.postNotifications || false,
      notificationAccess: true,
    }));
    
    setRequesting(false);
    
    const hasSmsPerms = results.readSms || results.receiveSms;
    if (!hasSmsPerms) {
      Alert.alert(
        'SMS Permission Needed',
        'Detectify needs SMS permissions to read and analyze messages for scams.',
        [{ text: 'OK' }]
      );
    }
    
    return results;
  };

  const grantedCount = Object.values(perms).filter(Boolean).length;
  const allGranted = grantedCount === PERMISSIONS.length;

  const handleContinue = async () => {
    if (!allGranted) {
      await requestAllPermissions();
    } else {
      const notifEnabled = await checkNotificationListener();
      if (!notifEnabled && perms.notificationAccess) {
        Alert.alert(
          'Verify Notification Access',
          'Please make sure you have enabled Detectify in Settings > Notification Access.',
          [
            { text: 'Open Settings', onPress: requestNotificationAccess },
            { text: 'Already Enabled', onPress: onAgree }
          ]
        );
      } else {
        onAgree();
      }
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={s.inner}>
        <Text style={s.eyebrow}>PERMISSIONS</Text>
        <Text style={s.title}>Allow access to{'\n'}your messages</Text>
        <Text style={s.subtitle}>
          Detectify needs the following permissions to scan and protect your SMS inbox.
          {Platform.OS === 'android' && '\n\n📱 No default SMS app required — we use Notification Access!'}
        </Text>

        <View style={s.list}>
          {PERMISSIONS.map((p) => {
            const granted = perms[p.key];
            return (
              <TouchableOpacity
                key={p.key}
                style={[s.row, granted && s.rowGranted]}
                onPress={() => toggle(p.key)}
                activeOpacity={0.7}
                disabled={requesting}
              >
                <View style={s.rowText}>
                  <Text style={[s.rowLabel, granted && s.rowLabelGranted]}>
                    {p.label}
                    {p.key === 'notificationAccess' && (
                      <Text style={s.badge}> ⭐ No default app needed</Text>
                    )}
                  </Text>
                  <Text style={[s.rowSub, granted && s.rowSubGranted]}>
                    {p.sub}
                  </Text>
                </View>

                <View style={[s.indicator, granted && s.indicatorGranted]}>
                  {granted && (
                    <View style={s.checkLine}>
                      <View style={[s.checkSegment, s.checkLeft]} />
                      <View style={[s.checkSegment, s.checkRight]} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={s.hint}>
          {requesting 
            ? 'Requesting permissions...' 
            : allGranted 
              ? '✓ All permissions granted — ready to protect you!'
              : `${grantedCount} of ${PERMISSIONS.length} granted — tap to allow`}
        </Text>

        {!perms.notificationAccess && (
          <View style={s.infoBox}>
            <Text style={s.infoText}>
              🔐 {Platform.OS === 'android' 
                ? 'Enable "Notification Access" to read SMS without being default app. This is the key feature of Detectify!' 
                : 'Notification access allows real-time SMS scanning.'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.btn, (requesting || (!allGranted && grantedCount === 0)) && s.btnDisabled]}
          onPress={handleContinue}
          disabled={requesting}
          activeOpacity={0.85}
        >
          <Text style={[s.btnText, (requesting || (!allGranted && grantedCount === 0)) && s.btnTextDisabled]}>
            {requesting 
              ? 'Requesting...' 
              : allGranted 
                ? 'Continue to App →' 
                : grantedCount > 0 
                  ? `Grant ${PERMISSIONS.length - grantedCount} More →`
                  : 'Grant All Permissions'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 36,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
    marginBottom: 24,
  },
  list: {
    gap: 10,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rowGranted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  rowLabelGranted: {
    color: '#065F46',
  },
  rowSub: {
    fontSize: 13,
    color: '#6B7280',
  },
  rowSubGranted: {
    color: '#047857',
  },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  indicatorGranted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkLine: {
    width: 12,
    height: 12,
    position: 'relative',
  },
  checkSegment: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  checkLeft: {
    width: 4,
    height: 1.8,
    bottom: 3,
    left: 1,
    transform: [{ rotate: '45deg' }],
  },
  checkRight: {
    width: 7,
    height: 1.8,
    bottom: 4,
    left: 3,
    transform: [{ rotate: '-50deg' }],
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  infoText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 18,
  },
  btn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  btnTextDisabled: {
    color: '#9CA3AF',
  },
  badge: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '500',
  },
});