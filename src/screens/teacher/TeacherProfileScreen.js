import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../context/UserContext';
import { getFacultyTimetable, getFacultyTopics, getFacultyAttendance } from '../../data/apiService';


function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const TeacherProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, accessToken, logout } = useUser();

  const [timetable, setTimetable] = useState([]);
  const [topics, setTopics] = useState([]);
  const [punches, setPunches] = useState([]);
  const [loading, setLoading] = useState(true);

  const facultyName = user?.name || 'Faculty Member';
  const empId = user?.emp_id || '—';
  const department = user?.department || 'Medical Faculty';
  const initials = getInitials(facultyName);

  const loadStats = useCallback(async () => {
    if (!accessToken) { setLoading(false); return; }
    try {
      const [ttData, topicsData, punchData] = await Promise.all([
        getFacultyTimetable(accessToken),
        getFacultyTopics(accessToken),
        getFacultyAttendance(accessToken),
      ]);
      setTimetable(Array.isArray(ttData) ? ttData : []);
      setTopics(Array.isArray(topicsData) ? topicsData : []);
      setPunches(Array.isArray(punchData) ? punchData : []);
    } catch (e) {
      console.warn('[TeacherProfile] stats load error:', e);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  // Stats
  const subjectSet = new Set(timetable.map(tt => tt.subject_name).filter(Boolean));
  const subjectCount = subjectSet.size;
  const topicsCount = topics.length;
  const punchDays = new Set(punches.map(p => p.punch_time?.slice(0, 10)).filter(Boolean)).size;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={['#FFFFFF', '#F9FAFB']} style={styles.header}>
        <Text style={styles.headerTitle}>Faculty Profile</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
              style={styles.avatarCircle}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
          </View>

          <Text style={styles.teacherName} numberOfLines={2}>{facultyName}</Text>
          <Text style={styles.teacherProgram}>{department}</Text>

          <View style={styles.idCardFooter}>
            <View>
              <Text style={styles.idFieldLabel}>EMPLOYEE ID</Text>
              <Text style={styles.idFieldValue}>{empId}</Text>
            </View>
            <View>
              <Text style={styles.idFieldLabel}>ROLE</Text>
              <Text style={styles.idFieldValue}>FACULTY</Text>
            </View>
            {user?.email ? (
              <View>
                <Text style={styles.idFieldLabel}>EMAIL</Text>
                <Text style={styles.idFieldValue} numberOfLines={1}>{user.email}</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        {/* Stats Row */}
        {loading ? (
          <View style={styles.statsLoading}>
            <ActivityIndicator size="small" color="#EA580C" />
          </View>
        ) : (
          <LinearGradient colors={['#FFFFFF', '#F9FAFB']} style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{subjectCount || '—'}</Text>
              <Text style={styles.statLabel}>Subjects</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{topicsCount || '—'}</Text>
              <Text style={styles.statLabel}>Topics Taught</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{punchDays || '—'}</Text>
              <Text style={styles.statLabel}>Days Present</Text>
            </View>
          </LinearGradient>
        )}


        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <LinearGradient colors={['#FEF2F2', '#FEE2E2']} style={styles.logoutGradient}>
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
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  idCard: {
    borderRadius: 28, padding: 24, marginBottom: 20,
    shadowColor: '#312E81', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
  },
  idCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  idBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  idBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  teacherName: {
    fontSize: 22, fontWeight: '900', color: '#FFFFFF',
    marginBottom: 4, letterSpacing: -0.5, lineHeight: 28,
  },
  teacherProgram: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 24, fontWeight: '500' },
  idCardFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 16,
    flexWrap: 'wrap', gap: 12,
  },
  idFieldLabel: {
    fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '700',
    letterSpacing: 0.8, marginBottom: 4, textTransform: 'uppercase',
  },
  idFieldValue: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 },
  statsLoading: { height: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  statsRow: {
    flexDirection: 'row', borderRadius: 24, paddingVertical: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 3,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 2, letterSpacing: -0.3 },
  statLabel: { fontSize: 10, color: '#6B7280', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  statDivider: { width: 1, height: 40, backgroundColor: '#F3F4F6' },
  menuSection: { marginBottom: 24 },
  menuSectionTitle: {
    fontSize: 11, color: '#9CA3AF', fontWeight: '800',
    letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase',
  },
  menuCard: {
    borderRadius: 24, borderWidth: 1, borderColor: '#FFFFFF', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 3,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 14, backgroundColor: 'transparent',
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 2, letterSpacing: -0.2 },
  menuDesc: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  logoutBtn: { borderRadius: 40, overflow: 'hidden', marginTop: 8, marginBottom: 20 },
  logoutGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 8,
  },
  logoutText: { fontSize: 14, fontWeight: '800', color: '#EF4444', letterSpacing: -0.2 },
});

export default TeacherProfileScreen;