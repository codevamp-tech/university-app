import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Switch, Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getAvatarUrl } from '../../utils/avatar';
import { fixImageUrl } from '../../utils/imageUrl';

export const ProfileMenuModal = ({ visible, onClose, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout } = useUser();

  if (!visible) return null;

  const rawAvatar = user?.avatar_url || getAvatarUrl(user?.name, user?.rollno);
  const avatarUrl = fixImageUrl(rawAvatar);

  const handleLogout = async () => {
    onClose();
    if (logout) {
      await logout();
    }
  };

  const handleViewProfile = () => {
    onClose();
    if (navigation) {
      navigation.navigate('Identity');
    }
  };

  const handleOpenSettings = () => {
    onClose();
    if (navigation) {
      navigation.navigate('Settings');
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
        <View style={[styles.profileMenu, { top: insets.top + 50, backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity activeOpacity={0.8} onPress={handleViewProfile} style={styles.menuHeader}>
            <Image
              source={{ uri: avatarUrl }}
              style={styles.menuAvatar}
            />
            <View style={{ flex: 1, paddingRight: 4 }}>
              <Text style={[styles.menuName, { color: colors.textPrimary }]} numberOfLines={2} ellipsizeMode="tail">
                {user?.name || user?.full_name || 'Student'}
              </Text>
              <Text style={[styles.menuSub, { color: colors.textSecondary }]}>
                {user?.rollno || user?.username || 'View Profile →'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleViewProfile}
          >
            <MaterialCommunityIcons name="card-account-details-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>My Talent Identity</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleOpenSettings}
          >
            <MaterialCommunityIcons name="cog-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Settings</Text>
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <MaterialCommunityIcons name="moon-waning-crescent" size={20} color={colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }]}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
            <Text style={[styles.menuItemText, styles.logoutText]}>Log out</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  profileMenu: {
    position: 'absolute',
    right: 16,
    width: 260,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 12,
  },
  menuAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  menuName: {
    fontSize: 15,
    fontWeight: '700',
  },
  menuSub: {
    fontSize: 12,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    marginVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 10,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  logoutItem: {
    marginTop: 4,
  },
  logoutText: {
    color: '#EF4444',
  },
});

export default ProfileMenuModal;
