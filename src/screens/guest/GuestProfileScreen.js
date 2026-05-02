import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_CONFIG } from '../../config/appConfig';

const { width } = Dimensions.get('window');

const GuestProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const menuItems = [
    { id: 1, title: 'App Language', icon: 'globe', type: 'feather', value: 'English (US)' },
    { id: 2, title: 'Dark Mode', icon: 'moon', type: 'feather', toggle: true, value: darkMode, onToggle: setDarkMode },
    { id: 3, title: 'Notifications', icon: 'bell', type: 'feather', toggle: true, value: notifications, onToggle: setNotifications },
  ];

  const universityLinks = [
    { id: 1, title: 'University History', icon: 'landmark', type: 'font-awesome-5' },
    { id: 2, title: 'Vision & Mission', icon: 'target', type: 'feather' },
    { id: 3, title: 'Campus Map', icon: 'map-pin', type: 'feather' },
  ];

  const legalLinks = [
    { id: 1, title: 'Help Center', icon: 'help-circle', type: 'feather' },
    { id: 2, title: 'Feedback', icon: 'message-square', type: 'feather' },
    { id: 3, title: 'Privacy Policy', icon: 'shield', type: 'feather' },
    { id: 4, title: 'Terms of Service', icon: 'file-text', type: 'feather' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header Background */}
        <LinearGradient
          colors={['#EA580C', '#9A3412']}
          style={[styles.headerBg, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.avatar}
              >
                <Feather name="user" size={50} color="white" />
              </LinearGradient>
              <LinearGradient
                colors={['#FFFFFF', '#F9FAFB']}
                style={styles.editBadge}
              >
                <Feather name="camera" size={14} color="#EA580C" />
              </LinearGradient>
            </View>
            <Text style={styles.proName}>Guest User</Text>
            <Text style={styles.proEmail}>exploring@{APP_CONFIG.STUDENT_EMAIL_DOMAIN}</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Sign In CTA */}
          <TouchableOpacity style={styles.ctaCard}>
            <LinearGradient
              colors={['#4338CA', '#312E81']}
              style={styles.ctaGradient}
            >
              <View style={styles.ctaTextContainer}>
                <Text style={styles.ctaTitle}>Unlock All Features</Text>
                <Text style={styles.ctaSubtitle}>Sign in to access student portal, marketplace, and more.</Text>
              </View>
              <LinearGradient
                colors={['#FFFFFF', '#F9FAFB']}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaButtonText}>Sign In</Text>
              </LinearGradient>
            </LinearGradient>
          </TouchableOpacity>

          {/* Preferences Section */}
          <Text style={styles.sectionHeader}>PREFERENCES</Text>
          <LinearGradient
            colors={['#FFFFFF', '#F9FAFB']}
            style={styles.menuContainer}
          >
            {menuItems.map((item, index) => (
              <View key={item.id} style={[styles.menuItem, index === menuItems.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.menuLeft}>
                  <LinearGradient
                    colors={['#F3F4F6', '#E5E7EB']}
                    style={styles.menuIconWrapper}
                  >
                    <Feather name={item.icon} size={18} color="#4B5563" />
                  </LinearGradient>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </View>
                <View style={styles.menuRight}>
                  {item.value && <Text style={styles.menuValue}>{item.value}</Text>}
                  {item.toggle ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: '#E5E7EB', true: '#FFF7ED' }}
                      thumbColor={item.value ? '#EA580C' : '#FFFFFF'}
                      ios_backgroundColor="#E5E7EB"
                    />
                  ) : (
                    <Feather name="chevron-right" size={18} color="#9CA3AF" />
                  )}
                </View>
              </View>
            ))}
          </LinearGradient>

          {/* University Section */}
          <Text style={styles.sectionHeader}>ABOUT UNIVERSITY</Text>
          <LinearGradient
            colors={['#FFFFFF', '#F9FAFB']}
            style={styles.menuContainer}
          >
            {universityLinks.map((item, index) => (
              <TouchableOpacity key={item.id} style={[styles.menuItem, index === universityLinks.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.menuLeft}>
                  <LinearGradient
                    colors={['#FFF7ED', '#FFEDD5']}
                    style={[styles.menuIconWrapper, { backgroundColor: 'transparent' }]}
                  >
                    <Feather name={item.icon} size={18} color="#EA580C" />
                  </LinearGradient>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </LinearGradient>

          {/* Legal Section */}
          <Text style={styles.sectionHeader}>SUPPORT & LEGAL</Text>
          <LinearGradient
            colors={['#FFFFFF', '#F9FAFB']}
            style={styles.menuContainer}
          >
            {legalLinks.map((item, index) => (
              <TouchableOpacity key={item.id} style={[styles.menuItem, index === legalLinks.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.menuLeft}>
                  <LinearGradient
                    colors={['#F3F4F6', '#E5E7EB']}
                    style={styles.menuIconWrapper}
                  >
                    <Feather name={item.icon} size={18} color="#4B5563" />
                  </LinearGradient>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </LinearGradient>

          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={() => {
              navigation.replace('Login');
            }}
          >
            <LinearGradient
              colors={['#FEF2F2', '#FEE2E2']}
              style={styles.logoutGradient}
            >
              <Feather name="log-out" size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Exit Guest Mode</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.versionText}>Version 2.0.4 (Build 445)</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerBg: {
    paddingBottom: 50,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  proName: {
    fontSize: 26,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  proEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  content: {
    padding: 20,
    marginTop: -25,
  },
  ctaCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    justifyContent: 'space-between',
  },
  ctaTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  ctaTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  ctaSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    lineHeight: 16,
  },
  ctaButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaButtonText: {
    color: '#4338CA',
    fontWeight: '800',
    fontSize: 13,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
    marginTop: 8,
  },
  menuContainer: {
    borderRadius: 24,
    paddingHorizontal: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValue: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 10,
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EF4444',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
    fontWeight: '500',
  },
});

export default GuestProfileScreen;