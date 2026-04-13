import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Faculty Profile</Text>
        <TouchableOpacity style={styles.bellButton} activeOpacity={0.8}>
          <Ionicons name="notifications-outline" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ID Card */}
        <LinearGradient
          colors={['#c4ccff', '#b6c0ff', '#eef1ff', '#e0e5ff', '#d2d9ff']}
          locations={[0, 0.3, 0.55, 0.8, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.idCard}
        >
          <View style={styles.idCardHeader}>
            <View style={styles.idBadge}>
              <Text style={styles.idBadgeText}>FACULTY ID</Text>
            </View>
            <View style={styles.qrCode}>
              <Ionicons name="qr-code-outline" size={24} color="#111827" />
            </View>
          </View>

          <Text style={styles.teacherName}>{TEACHER_USER.name || 'Prof. Vikram Singh'}</Text>
          <Text style={styles.teacherProgram}>{TEACHER_USER.department || 'Computer Science'}</Text>

          <View style={styles.idCardFooter}>
            <View>
              <Text style={styles.idFieldLabel}>EMPLOYEE ID</Text>
              <Text style={styles.idFieldValue}>{TEACHER_USER.id || 'FAC-001'}</Text>
            </View>
            <View>
              <Text style={styles.idFieldLabel}>ROLE</Text>
              <Text style={styles.idFieldValue}>{TEACHER_USER.role.toUpperCase() || 'TEACHER'}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
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
        </View>

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
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
                  <View style={styles.menuIcon}>
                    <Ionicons name={item.icon} size={20} color="#8B2FC9" />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuDesc}>{item.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  idCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
    shadowColor: '#8B2FC9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  idCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  idBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  idBadgeText: {
    color: '#111827',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  qrCode: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  teacherName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  teacherProgram: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 22,
    fontWeight: '500',
  },
  idCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  idFieldLabel: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  idFieldValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#F1F5F9',
  },
  menuSection: {
    marginBottom: 22,
  },
  menuSectionTitle: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F5EEFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  menuDesc: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '400',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 40,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    letterSpacing: -0.1,
  },
});

export default TeacherProfileScreen;