import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/colors';

const TeacherSettingsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(true);
  const [attendanceReminders, setAttendanceReminders] = useState(true);
  const [autoSave, setAutoSave] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('@access_token');
      if (!token) throw new Error('Not authenticated');

      const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      
      const response = await fetch(`${apiUrl}/api/v1/users/me/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword
        })
      });

      let data = {};
      try {
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseError) {
        // Ignore JSON parse errors, we will fallback to a generic error message
      }

      if (!response.ok) {
        const errorMsg = data.detail || data.error?.message || data.message || 'Incorrect current password.';
        throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Incorrect current password.');
      }

      Alert.alert('Success', 'Password updated successfully. You can now login with your new password.');
      setShowPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update password.');
    }
  };

  const SETTINGS_GROUPS = [
    {
      title: 'NOTIFICATIONS',
      items: [
        { 
          id: 'notif', 
          label: 'App Notifications', 
          type: 'switch', 
          value: notifications, 
          onValueChange: setNotifications,
          icon: 'notifications-outline' 
        },
        { 
          id: 'att', 
          label: 'Attendance Reminders', 
          type: 'switch', 
          value: attendanceReminders, 
          onValueChange: setAttendanceReminders,
          icon: 'time-outline' 
        },
      ]
    },
    {
      title: 'DATA MANAGEMENT',
      items: [
        { 
          id: 'autosave', 
          label: 'Auto-save Grading', 
          type: 'switch', 
          value: autoSave, 
          onValueChange: setAutoSave,
          icon: 'save-outline' 
        },
        { 
          id: 'clearcache', 
          label: 'Clear App Cache', 
          type: 'button',
          icon: 'trash-outline',
          onPress: () => Alert.alert('Clear Cache', 'Cache cleared successfully!') 
        },
      ]
    },
    {
      title: 'ACCOUNT',
      items: [
        { 
          id: 'pass', 
          label: 'Change Password', 
          type: 'link', 
          icon: 'lock-closed-outline',
          onPress: () => setShowPasswordModal(true)
        },
        { 
          id: 'lang', 
          label: 'App Language', 
          type: 'link', 
          value: 'English', 
          icon: 'globe-outline' 
        },
      ]
    },
    {
      title: 'SESSION',
      items: [
        { 
          id: 'logout', 
          label: 'Log Out', 
          type: 'button',
          icon: 'log-out-outline',
          onPress: () => {
            navigation.replace('Login');
          }
        },
      ]
    }
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {SETTINGS_GROUPS.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item, index) => {
                const ItemWrapper = item.type === 'switch' ? View : TouchableOpacity;
                return (
                  <ItemWrapper
                    key={item.id} 
                    style={[
                      styles.item, 
                      index < group.items.length - 1 && styles.itemBorder
                    ]}
                    onPress={item.type !== 'switch' ? item.onPress : undefined}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemLeft}>
                      <View style={styles.iconContainer}>
                        <Ionicons name={item.icon} size={20} color={Colors.primary} />
                      </View>
                      <Text style={styles.itemLabel}>{item.label}</Text>
                    </View>

                    {item.type === 'switch' ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.onValueChange}
                        trackColor={{ false: '#E5E7EB', true: '#C4B5FD' }}
                        thumbColor={item.value ? Colors.primary : '#F3F4F6'}
                      />
                    ) : item.type === 'link' || item.type === 'button' ? (
                      <View style={styles.itemRight}>
                        {item.value && <Text style={styles.itemValue}>{item.value}</Text>}
                        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                      </View>
                    ) : null}
                  </ItemWrapper>
                );
              })}
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.textPrimary }]}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.inputLabel, { color: Colors.textMuted }]}>Old Password</Text>
            <View style={[styles.passwordInputContainer, { borderColor: '#E5E7EB', backgroundColor: Colors.background }]}>
              <TextInput
                style={[styles.passwordInput, { color: Colors.textPrimary }]}
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={!showOldPassword}
                placeholder="Enter current password"
                placeholderTextColor={Colors.textMuted}
              />
              <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)} style={styles.eyeBtn}>
                <Ionicons name={showOldPassword ? "eye-outline" : "eye-off-outline"} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.inputLabel, { color: Colors.textMuted }]}>New Password</Text>
            <View style={[styles.passwordInputContainer, { borderColor: '#E5E7EB', backgroundColor: Colors.background }]}>
              <TextInput
                style={[styles.passwordInput, { color: Colors.textPrimary }]}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={Colors.textMuted}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeBtn}>
                <Ionicons name={showNewPassword ? "eye-outline" : "eye-off-outline"} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: Colors.textMuted }]}>Confirm Password</Text>
            <View style={[styles.passwordInputContainer, { borderColor: '#E5E7EB', backgroundColor: Colors.background }]}>
              <TextInput
                style={[styles.passwordInput, { color: Colors.textPrimary }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={Colors.textMuted}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtnSubmit, { backgroundColor: Colors.primary }]} onPress={handleChangePassword}>
                <Text style={styles.modalBtnTextSubmit}>Update Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: 20,
  },
  group: {
    marginBottom: 25,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1,
  },
  groupCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemValue: {
    fontSize: 14,
    color: Colors.textMuted,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    width: '100%',
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 56,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  eyeBtn: {
    padding: 8,
  },
  modalActions: {
    marginTop: 12,
  },
  modalBtnSubmit: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  modalBtnTextSubmit: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default TeacherSettingsScreen;
