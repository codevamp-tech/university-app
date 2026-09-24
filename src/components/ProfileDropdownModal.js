import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useUser } from '../context/UserContext';
import { SafeStudentAvatar } from './SafeStudentAvatar';
import { getAvatarUrl } from '../utils/avatar';

export function ProfileDropdownModal({ visible, onClose, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout, isHostelMode, setIsHostelMode } = useUser();

  if (!visible) return null;

  const avatarUrl = getAvatarUrl(user?.avatar_url || user?.name, user?.rollno || user?.username);

  const handleLogout = () => {
    if (onClose) onClose();
    if (logout) logout();
    if (navigation?.replace) {
      navigation.replace('Login');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.profileMenu,
            {
              top: insets.top + 50,
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.menuHeader}>
            <SafeStudentAvatar
              uri={avatarUrl}
              rollno={user?.rollno || user?.username}
              name={user?.name || user?.full_name || 'S'}
              style={[styles.menuAvatar, { borderColor: colors.primary }]}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text
                style={[styles.menuName, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {user?.name || user?.full_name || 'Student'}
              </Text>
              <Text
                style={[styles.menuSub, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {user?.rollno || user?.username || 'Student Account'}
              </Text>
            </View>
          </View>

          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

          {/* Settings */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              if (onClose) onClose();
              if (navigation?.navigate) {
                navigation.navigate('Settings');
              }
            }}
          >
            <View style={styles.menuItemLeft}>
              <MaterialCommunityIcons
                name="cog-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>
                Settings
              </Text>
            </View>
          </TouchableOpacity>

          {/* Dark Mode */}
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <MaterialCommunityIcons
                name="moon-waning-crescent"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Hostel Mode */}
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <MaterialCommunityIcons
                name="home-city-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>
                Hostel Mode
              </Text>
            </View>
            <Switch
              value={isHostelMode}
              onValueChange={setIsHostelMode}
              trackColor={{ false: colors.border, true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

          {/* Log out */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              styles.logoutItem,
              {
                backgroundColor: isDark
                  ? 'rgba(239, 68, 68, 0.12)'
                  : '#FEF2F2',
              },
            ]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View style={styles.menuItemLeft}>
              <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
              <Text style={[styles.menuItemText, styles.logoutText]}>Log out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  profileMenu: {
    position: 'absolute',
    right: 16,
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginBottom: 4,
  },
  menuAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
  },
  menuName: {
    fontSize: 16,
    fontWeight: '800',
  },
  menuSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 6,
    marginHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 12,
  },
  logoutItem: {
    backgroundColor: '#FEF2F2',
    marginTop: 2,
  },
  logoutText: {
    color: '#EF4444',
  },
});
