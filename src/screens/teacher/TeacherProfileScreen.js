import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TEACHER_USER } from '../../constants/data';

const MENU_SECTIONS = [
  {
    title: 'ACADEMIC MANAGEMENT',
    items: [
      { icon: 'book-outline', label: 'My Courses', desc: 'Manage your assigned subjects', route: 'TeacherCourses' },
      { icon: 'people-outline', label: 'Faculty Directory', desc: 'Contact details of colleagues', route: 'FacultyDirectory' },
    ],
  },
  {
    title: 'SYSTEM & SUPPORT',
    items: [
      { icon: 'settings-outline', label: 'Settings', desc: 'App preferences and notifications', route: 'TeacherSettings' },
      { icon: 'help-circle-outline', label: 'Help Center', desc: 'Faculty support and FAQs', route: 'TeacherHelp' },
      { icon: 'shield-outline', label: 'Privacy', desc: 'Data protection and security', route: 'TeacherPrivacy' },
    ],
  },
];

const TeacherProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => navigation.replace('Login') },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={['#FFFFFF', '#F9FAFB']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Faculty Profile</Text>
        <TouchableOpacity style={styles.bellButton} activeOpacity={0.8}>
          <LinearGradient
            colors={['#FFFFFF', '#F9FAFB']}
            style={styles.bellGradient}
          >
            <Ionicons name="notifications-outline" size={20} color="#EA580C" />
            <View style={styles.bellBadge} />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ID Card */}
        <LinearGradient
          colors={['#1E1B4B', '#312E81']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.idCard}
        >
          <View style={styles.idCardHeader}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.idBadge}
            >
              <Text style={styles.idBadgeText}>FACULTY ID</Text>
            </LinearGradient>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.qrCode}
            >
              <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <Text style={styles.teacherName}>{TEACHER_USER.name || 'Prof. Vikram Singh'}</Text>
          <Text style={styles.teacherProgram}>{TEACHER_USER.department || 'Computer Science & Engineering'}</Text>

          <View style={styles.idCardFooter}>
            <View>
              <Text style={styles.idFieldLabel}>EMPLOYEE ID</Text>
              <Text style={styles.idFieldValue}>{TEACHER_USER.id || 'FAC-001'}</Text>
            </View>
            <View>
              <Text style={styles.idFieldLabel}>ROLE</Text>
              <Text style={styles.idFieldValue}>{TEACHER_USER.role?.toUpperCase() || 'PROFESSOR'}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Row */}
        <LinearGradient
          colors={['#FFFFFF', '#F9FAFB']}
          style={styles.statsRow}
        >
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>64</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Lectures/Wk</Text>
          </View>
        </LinearGradient>

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <LinearGradient
              colors={['#FFFFFF', '#F9FAFB']}
              style={styles.menuCard}
            >
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    i < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => item.route && navigation.navigate(item.route)}
                >
                  <LinearGradient
                    colors={['#FFF7ED', '#FFEDD5']}
                    style={styles.menuIcon}
                  >
                    <Ionicons name={item.icon} size={20} color="#EA580C" />
                  </LinearGradient>
                  <View style={styles.menuText}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuDesc}>{item.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </LinearGradient>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <LinearGradient
            colors={['#FEF2F2', '#FEE2E2']}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  bellButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bellGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  idCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  idCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  idBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  idBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  qrCode: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  teacherProgram: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
    fontWeight: '500',
  },
  idCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 16,
  },
  idFieldLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  idFieldValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 24,
    paddingVertical: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#F3F4F6',
  },
  menuSection: {
    marginBottom: 24,
  },
  menuSectionTitle: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  menuCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    backgroundColor: 'transparent',
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  menuDesc: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  logoutBtn: {
    borderRadius: 40,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: -0.2,
  },
});

export default TeacherProfileScreen;