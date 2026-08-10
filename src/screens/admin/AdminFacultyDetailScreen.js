import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getAdminFacultyDetail, getFacultyAttendance } from '../../data/apiService';
import { SkeletonBlock } from '../../components/SkeletonLoader';

const AdminFacultyDetailScreen = ({ route, navigation }) => {
  const { teacher } = route.params || {};
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();

  const [data, setData] = useState(null);
  const [punches, setPunches] = useState([]);
  const [srmsAbsentRecords, setSrmsAbsentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('attendance');

  const empId = teacher?.emp_id || teacher?.empId || teacher?.id;

  const loadData = async () => {
    if (!accessToken || !empId) { setLoading(false); return; }
    try {
      const [result, punchesData] = await Promise.all([
        getAdminFacultyDetail(accessToken, empId),
        getFacultyAttendance(accessToken, empId),
      ]);
      if (result) setData(result);
      if (Array.isArray(punchesData)) {
        setPunches(punchesData);
      } else if (punchesData?.punches) {
        setPunches(punchesData.punches || []);
        if (Array.isArray(punchesData.absentRecords)) {
          setSrmsAbsentRecords(punchesData.absentRecords);
        }
      }
    } catch (err) {
      console.warn('[FacultyDetail] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, [accessToken, empId]);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  const formatDate = (isoDate) => {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  const getDayShort = (dayName) => {
    const map = { Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed', Thursday:'Thu', Friday:'Fri', Saturday:'Sat', Sunday:'Sun' };
    return map[dayName] || dayName?.slice(0, 3) || '';
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const profile = data?.profile || teacher || {};
  const dailyRecords = data?.daily_records || [];
  const absentRecords = (dailyRecords.length > 0)
    ? dailyRecords.filter((r) => !r.is_present)
    : srmsAbsentRecords;
  const summary = data?.attendance_summary || {
    present_days: 0,
    absent_days: absentRecords.length,
    total_days: absentRecords.length,
    present_pct: 0,
  };

  const avatarColors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];
  const avatarBgColor = avatarColors[(profile.name?.charCodeAt(0) || 0) % avatarColors.length];

  // Group punches by date exactly like TeacherAttendanceScreen
  const groupedPunches = {};
  punches.forEach((punch) => {
    if (punch.punch_time) {
      const dateStr = punch.punch_time.slice(0, 10);
      if (!groupedPunches[dateStr]) groupedPunches[dateStr] = [];
      groupedPunches[dateStr].push(punch);
    }
  });

  const sortedDates = Object.keys(groupedPunches).sort((a, b) => new Date(b) - new Date(a));
  sortedDates.forEach((dStr) => {
    groupedPunches[dStr].sort((a, b) => new Date(a.punch_time) - new Date(b.punch_time));
  });

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return ''; }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Header - Instant render using teacher profile */}
        <LinearGradient colors={isDark ? ['#1E3A5F', '#0F172A'] : ['#EFF6FF', '#FFFFFF']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={[styles.avatar, { backgroundColor: avatarBgColor + '22' }]}>
              <Text style={[styles.avatarText, { color: avatarBgColor }]}>{getInitials(profile.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.facultyName, { color: colors.textPrimary }]} numberOfLines={2}>{profile.name || 'Unknown Faculty'}</Text>
              <Text style={[styles.facultyDept, { color: colors.textSecondary }]} numberOfLines={1}>{profile.department || 'Department N/A'}</Text>
              <View style={styles.empBadge}>
                <Feather name="credit-card" size={10} color="#3B82F6" />
                <Text style={styles.empBadgeText}>EMP: {profile.emp_id}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Contact Info */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CONTACT INFO</Text>
          {profile.email ? (
            <View style={styles.contactRow}>
              <View style={[styles.contactIcon, { backgroundColor: 'rgba(59,130,246,0.1)' }]}><Feather name="mail" size={14} color="#3B82F6" /></View>
              <Text style={[styles.contactText, { color: colors.textPrimary }]}>{profile.email}</Text>
            </View>
          ) : null}
          {profile.mobile ? (
            <View style={styles.contactRow}>
              <View style={[styles.contactIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}><Feather name="phone" size={14} color="#10B981" /></View>
              <Text style={[styles.contactText, { color: colors.textPrimary }]}>{profile.mobile}</Text>
            </View>
          ) : null}
          {!profile.email && !profile.mobile && (
            <Text style={{ color: colors.textMuted, fontSize: 12, fontStyle: 'italic' }}>No contact info available</Text>
          )}
        </View>

        {/* Tab Bar */}
        <View style={[styles.tabBar, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'attendance' && styles.activeTab]}
            onPress={() => setActiveTab('attendance')}
          >
            <Feather name="clock" size={16} color={activeTab === 'attendance' ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabLabel, { color: activeTab === 'attendance' ? colors.primary : colors.textMuted }]}>Punch Timing</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'leaves' && styles.activeTab]}
            onPress={() => setActiveTab('leaves')}
          >
            <Feather name="calendar" size={16} color={activeTab === 'leaves' ? '#EF4444' : colors.textMuted} />
            <Text style={[styles.tabLabel, { color: activeTab === 'leaves' ? '#EF4444' : colors.textMuted }]}>
              Leaves ({loading ? '...' : absentRecords.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content or Loading Skeleton */}
        {loading ? (
          <View style={{ marginTop: 12, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginVertical: 8 }}>
              <SkeletonBlock width={12} height={12} borderRadius={6} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>Fetching live SRMS ERP punch & leave logs...</Text>
            </View>

            {[1, 2, 3].map((item) => (
              <View key={item} style={{ marginBottom: 12 }}>
                <SkeletonBlock width={90} height={12} borderRadius={6} style={{ marginBottom: 8 }} />
                <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <SkeletonBlock width={40} height={40} borderRadius={20} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <SkeletonBlock width={80} height={14} borderRadius={7} />
                      <SkeletonBlock width={110} height={10} borderRadius={5} />
                    </View>
                    <SkeletonBlock width={55} height={16} borderRadius={8} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <SkeletonBlock width={40} height={40} borderRadius={20} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <SkeletonBlock width={80} height={14} borderRadius={7} />
                      <SkeletonBlock width={110} height={10} borderRadius={5} />
                    </View>
                    <SkeletonBlock width={55} height={16} borderRadius={8} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <>
            {/* Punch Timing Tab */}
            {activeTab === 'attendance' && (
              <View style={{ marginTop: 4 }}>
                {sortedDates.length === 0 ? (
                  <View style={[styles.emptyBox, { backgroundColor: colors.card }]}>
                    <MaterialCommunityIcons name="clock-remove-outline" size={40} color={colors.textMuted} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No punch records found in the database yet.</Text>
                  </View>
                ) : (
                  sortedDates.map((dateStr) => {
                    const dayPunches = groupedPunches[dateStr];
                    const dateLabel = formatDate(dayPunches[0]?.punch_time);

                    return (
                      <View key={dateStr} style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{dateLabel}</Text>
                        <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 }}>
                          {dayPunches.map((punch, idx) => {
                            const time = formatTime(punch.punch_time);
                            const isInOut = String(punch.in_out).toUpperCase();
                            const isEntry = isInOut === 'IN' || isInOut === 'I';

                            return (
                              <View key={punch.id || idx} style={[
                                { flexDirection: 'row', alignItems: 'center' },
                                idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 12 }
                              ]}>
                                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: isEntry ? '#E0F2FE' : '#FEE2E2' }}>
                                  <MaterialCommunityIcons name={isEntry ? 'login' : 'logout'} size={18} color={isEntry ? '#0284C7' : '#EF4444'} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                  <View style={{ backgroundColor: isEntry ? '#F0F9FF' : '#FEF2F2', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                    <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 0.3, color: isEntry ? '#0284C7' : '#EF4444' }}>
                                      {isEntry ? 'PUNCH IN' : 'PUNCH OUT'}
                                    </Text>
                                  </View>
                                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: '500' }}>Device Code: {punch.device_cd || '—'}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                  <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 }}>{time}</Text>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* Leaves Tab */}
            {activeTab === 'leaves' && (
              <View style={{ marginTop: 4 }}>
                {absentRecords.length === 0 ? (
                  <View style={[styles.emptyBox, { backgroundColor: colors.card }]}>
                    <Feather name="check-circle" size={40} color="#10B981" />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No absent days recorded — perfect attendance!</Text>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.leavesNote, { color: colors.textMuted }]}>Days with no punch record are counted as absent/leave.</Text>
                    <View style={styles.leavesGrid}>
                      {absentRecords.map((rec) => (
                        <View key={rec.date} style={[styles.leaveChip, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }]}>
                          <Text style={styles.leaveChipDay}>{getDayShort(rec.day_name)}</Text>
                          <Text style={styles.leaveChipDate}>{formatDate(rec.date)}</Text>
                          <View style={styles.leaveLabel}>
                            <Text style={{ fontSize: 8, color: '#EF4444', fontWeight: '700' }}>{rec.status || 'ON LEAVE'}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 12 },
  header: { borderRadius: 20, padding: 16, marginBottom: 14 },
  backBtn: { marginBottom: 12, alignSelf: 'flex-start' },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800' },
  facultyName: { fontSize: 17, fontWeight: '800', marginBottom: 2 },
  facultyDept: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  empBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(59,130,246,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  empBadgeText: { fontSize: 10, fontWeight: '700', color: '#3B82F6' },
  card: { borderRadius: 16, padding: 14, marginBottom: 14, elevation: 1 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 10 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  contactIcon: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  contactText: { fontSize: 13, fontWeight: '600' },
  tabBar: { flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 14 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  activeTab: { backgroundColor: 'rgba(99,102,241,0.1)' },
  tabLabel: { fontSize: 12, fontWeight: '700' },
  emptyBox: { borderRadius: 16, padding: 32, alignItems: 'center', gap: 12, marginTop: 8 },
  emptyText: { fontSize: 13, textAlign: 'center', fontWeight: '600' },
  leavesNote: { fontSize: 11, marginBottom: 12, fontStyle: 'italic' },
  leavesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  leaveChip: { width: '31%', borderRadius: 14, borderWidth: 1, padding: 10, alignItems: 'center', gap: 2 },
  leaveChipDay: { fontSize: 12, fontWeight: '800', color: '#EF4444' },
  leaveChipDate: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
  leaveLabel: { marginTop: 4, backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
});

export default AdminFacultyDetailScreen;
