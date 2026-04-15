import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SettingItem = ({ icon, label, type, value, onToggle, onPress }) => (
  <TouchableOpacity 
    style={styles.settingRow} 
    onPress={onPress} 
    disabled={type === 'switch'}
    activeOpacity={0.7}
  >
    <View style={[styles.iconContainer, { backgroundColor: type === 'danger' ? '#FEF2F2' : '#F5EEFC' }]}>
      <Ionicons name={icon} size={20} color={type === 'danger' ? '#EF4444' : '#8B2FC9'} />
    </View>
    <Text style={[styles.settingLabel, type === 'danger' && { color: '#EF4444' }]}>{label}</Text>
    {type === 'switch' ? (
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E5E7EB', true: '#C4B5FD' }}
        thumbColor={value ? '#8B2FC9' : '#F4F4F5'}
      />
    ) : (
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    )}
  </TouchableOpacity>
);

const SettingsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(true);
  const [examAlerts, setExamAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          <View style={styles.card}>
            <SettingItem 
              icon="notifications-outline" 
              label="Push Notifications" 
              type="switch" 
              value={notifications} 
              onToggle={setNotifications} 
            />
            <View style={styles.divider} />
            <SettingItem 
              icon="alarm-outline" 
              label="Exam & Deadlines Alerts" 
              type="switch" 
              value={examAlerts} 
              onToggle={setExamAlerts} 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APPEARANCE</Text>
          <View style={styles.card}>
            <SettingItem 
              icon="moon-outline" 
              label="Dark Mode" 
              type="switch" 
              value={darkMode} 
              onToggle={setDarkMode} 
            />
            <View style={styles.divider} />
            <SettingItem 
              icon="text-outline" 
              label="Text Size" 
              type="link" 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT & SECURITY</Text>
          <View style={styles.card}>
            <SettingItem 
              icon="lock-closed-outline" 
              label="Change Password" 
              type="link" 
            />
            <View style={styles.divider} />
            <SettingItem 
              icon="finger-print-outline" 
              label="Biometric Login" 
              type="switch" 
              value={false} 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SESSION</Text>
          <View style={styles.card}>
            <SettingItem 
              icon="log-out-outline" 
              label="Log Out" 
              type="danger" 
              onPress={() => {
                navigation.replace('Login');
              }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DANGER ZONE</Text>
          <View style={styles.card}>
            <SettingItem 
              icon="trash-outline" 
              label="Delete Account" 
              type="danger" 
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  scroll: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 66,
  },
});

export default SettingsScreen;
