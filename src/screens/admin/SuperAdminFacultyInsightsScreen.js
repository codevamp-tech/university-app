import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getSuperAdminAnalytics, getSuperAdminDrilldown, getFacultyAttendance } from '../../data/apiService';
import { LinearGradient } from 'expo-linear-gradient';
import { SkeletonBlock } from '../../components/SkeletonLoader';

const SuperAdminFacultyInsightsScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();
  const [data, setData] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myPunches, setMyPunches] = useState([]);

  const loadData = async () => {
    try {
      if (accessToken) {
        const [stats, teacherList, punches] = await Promise.all([
          getSuperAdminAnalytics(accessToken),
          getSuperAdminDrilldown(accessToken, 'teachers'),
          getFacultyAttendance(accessToken),
        ]);
        if (stats) setData(stats);
        if (Array.isArray(teacherList)) setTeachers(teacherList);
        if (Array.isArray(punches)) setMyPunches(punches);
      }
    } catch (err) {
      console.warn('[FacultyInsights] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatLastLogin = (iso) => {
    if (!iso) return 'Never';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return ''; }
  };

  const renderSkeleton = () => (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { backgroundColor: colors.card, height: 110, justifyContent: 'center' }]}>
          <SkeletonBlock width={120} height={12} borderRadius={6} style={{ marginBottom: 8 }} />
          <SkeletonBlock width={180} height={18} borderRadius={9} />
        </View>
        <SkeletonBlock width={150} height={16} borderRadius={8} style={{ marginTop: 24, marginBottom: 16 }} />
        <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.card, gap: 12 }}>
          <SkeletonBlock width="100%" height={30} borderRadius={8} />
          <SkeletonBlock width="100%" height={30} borderRadius={8} />
          <SkeletonBlock width="100%" height={30} borderRadius={8} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  if (loading) {
    return renderSkeleton();
  }

  const fStats = data?.faculty || {
    active_count: 0,
    average_attendance: '0%',
    sessional_marks_upload_pct: 0,
    active_logins: 0,
    average_cgpa: 0.0,
    dept_attendance: [],
  };

  // Calculate my today's attendance
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayPunches = myPunches.filter(p => p.punch_time && p.punch_time.startsWith(todayStr));
  const todaySorted = [...todayPunches].sort((a, b) => new Date(a.punch_time) - new Date(b.punch_time));
  const checkInToday = todaySorted.length > 0 ? formatTime(todaySorted[0].punch_time) : '—';
  const checkOutToday = todaySorted.length > 1 ? formatTime(todaySorted[todaySorted.length - 1].punch_time) : '—';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={isDark ? ['#065F46', '#0F172A'] : ['#E8F5E9', '#FFFFFF']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            {navigation && (
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
                <Feather name="arrow-left" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
            <Feather name="book-open" size={28} color="#10B981" />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Faculty & Academics</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Teacher portal & academic insights</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Faculty KPI Grid */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Faculty Portal Usage</Text>
        <View style={styles.grid}>
          <View style={[styles.gridCard, { backgroundColor: colors.card }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Feather name="users" size={24} color="#10B981" />
            </View>
            <Text style={[styles.cardVal, { color: colors.textPrimary }]}>{teachers.length || fStats.active_count}</Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Total Teachers</Text>
          </View>

          <View style={[styles.gridCard, { backgroundColor: colors.card }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <MaterialCommunityIcons name="timeline-clock-outline" size={24} color="#3B82F6" />
            </View>
            <Text style={[styles.cardVal, { color: colors.textPrimary }]}>{fStats.average_attendance}</Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Avg Student Attendance</Text>
          </View>
        </View>

        {/* Academic Operations
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Academic Operations</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.textPrimary }]}>Sessional Marks Upload Rate</Text>
            <Text style={[styles.metricVal, { color: '#10B981', fontWeight: '700' }]}>
              {fStats.sessional_marks_upload_pct}% Completed
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.textPrimary }]}>Active Faculty Logins (24h)</Text>
            <Text style={[styles.metricVal, { color: colors.textPrimary }]}>
              {fStats.active_logins} / {teachers.length || fStats.active_count} Teachers
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.textPrimary }]}>Average Student CGPA</Text>
            <Text style={[styles.metricVal, { color: colors.textPrimary }]}>
              {(fStats.average_cgpa || 0).toFixed(2)} / 10.0
            </Text>
          </View>
        </View>
        */}

        {/* Attendance by Department
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Attendance by Department</Text>
        <View style={[styles.card, { backgroundColor: colors.card, marginBottom: 24 }]}>
          {fStats.dept_attendance && fStats.dept_attendance.length > 0 ? (
            fStats.dept_attendance.map((item, idx) => {
              const colorsList = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];
              const barColor = colorsList[idx % colorsList.length];
              return (
                <View key={idx} style={idx > 0 ? { marginTop: 16 } : {}}>
                  <View style={styles.distRow}>
                    <Text style={[styles.distLabel, { color: colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.distVal, { color: colors.textSecondary }]}>{item.attendance}</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressBar, { width: `${Math.min(item.value, 100)}%`, backgroundColor: barColor }]} />
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={{ color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 }}>
              No department attendance logs found
            </Text>
          )}
        </View>
        */}

        {/* Teacher Directory */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Teacher Directory ({teachers.length})
        </Text>
        {teachers.length === 0 ? (
          <View style={[styles.card, { backgroundColor: colors.card, alignItems: 'center', paddingVertical: 28 }]}>
            <Feather name="user-x" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 12 }]}>
              No teachers on record yet. Teachers appear here after their first login.
            </Text>
          </View>
        ) : (
          teachers.map((t, idx) => {
            const deptColors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];
            const avatarBg = deptColors[idx % deptColors.length] + '22';
            const avatarColor = deptColors[idx % deptColors.length];
            const initials = t.name
              ? t.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
              : (t.emp_id || '??').slice(0, 2).toUpperCase();
            const isActiveToday = t.last_login && (new Date() - new Date(t.last_login)) < 86400000;

            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.teacherCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('AdminFacultyDetail', { teacher: t })}
              >
                <View style={[styles.teacherAvatar, { backgroundColor: avatarBg }]}>
                  <Text style={[styles.teacherInitials, { color: avatarColor }]}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.teacherName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {t.name || t.emp_id}
                  </Text>
                  <Text style={[styles.teacherDept, { color: colors.textSecondary }]} numberOfLines={1}>
                    {t.department} · {t.emp_id}
                  </Text>
                  {t.email ? (
                    <Text style={[styles.teacherMeta, { color: colors.textMuted }]} numberOfLines={1}>
                      {t.email}
                    </Text>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  {isActiveToday && (
                    <View style={[styles.activeDot, { backgroundColor: '#D1FAE5' }]}>
                      <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                      <Text style={{ fontSize: 9, color: '#10B981', fontWeight: '700' }}>ONLINE</Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>{formatLastLogin(t.last_login)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  header: { borderRadius: 16, padding: 20, marginBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  gridCard: {
    flex: 1, borderRadius: 16, padding: 16,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3,
  },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardVal: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  cardLabel: { fontSize: 11, lineHeight: 14 },
  card: {
    borderRadius: 16, padding: 16, marginBottom: 16,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3,
  },
  metricRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB',
  },
  metricLabel: { fontSize: 12, fontWeight: '600', flex: 1 },
  metricVal: { fontSize: 12, fontWeight: '500', textAlign: 'right', flexShrink: 0 },
  distRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  distLabel: { fontSize: 12, fontWeight: '600' },
  distVal: { fontSize: 12, fontWeight: '500' },
  progressTrack: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },
  teacherCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10, gap: 12,
  },
  teacherAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  teacherInitials: { fontSize: 15, fontWeight: '700' },
  teacherName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  teacherDept: { fontSize: 11, fontWeight: '500' },
  teacherMeta: { fontSize: 10, marginTop: 2 },
  activeDot: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },
});

export default SuperAdminFacultyInsightsScreen;
