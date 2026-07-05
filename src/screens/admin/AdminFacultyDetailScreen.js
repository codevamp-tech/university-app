import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getAdminFacultyDetail, getFacultyAttendance } from '../../data/apiService';
import { SkeletonBlock } from '../../components/SkeletonLoader';

const AdminFacultyDetailScreen = ({ navigation, route }) => {
  const { teacher } = route.params || {};
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();

  const [data, setData] = useState(null);
  const [punches, setPunches] = useState([]);
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
      if (Array.isArray(punchesData)) setPunches(punchesData);
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.header, { height: 130 }]}>
            <SkeletonBlock width={60} height={60} borderRadius={30} />
            <View style={{ marginLeft: 16, gap: 8 }}>
              <SkeletonBlock width={160} height={16} borderRadius={8} />
              <SkeletonBlock width={100} height={12} borderRadius={6} />
            </View>
          </View>
          <SkeletonBlock width="100%" height={80} borderRadius={16} style={{ marginTop: 16 }} />
          <SkeletonBlock width="100%" height={200} borderRadius={16} style={{ marginTop: 16 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const profile = data?.profile || teacher || {};
  const summary = data?.attendance_summary || { present_days: 0, absent_days: 0, total_days: 0, present_pct: 0 };
  const dailyRecords = data?.daily_records || [];
  const presentRecords = dailyRecords.filter((r) => r.is_present);
  const absentRecords = dailyRecords.filter((r) => !r.is_present);

  const pctColor = summary.present_pct >= 75 ? '#10B981' : summary.present_pct >= 50 ? '#F59E0B' : '#EF4444';
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
        {/* Header */}
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

        {/* Attendance Summary */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ATTENDANCE OVERVIEW</Text>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryBox, { backgroundColor: 'rgba(16,185,129,0.08)' }]}>
              <Text style={[styles.summaryVal, { color: '#10B981' }]}>{summary.present_days}</Text>
              <Text style={[styles.summaryKey, { color: colors.textSecondary }]}>Present</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
              <Text style={[styles.summaryVal, { color: '#EF4444' }]}>{summary.absent_days}</Text>
              <Text style={[styles.summaryKey, { color: colors.textSecondary }]}>Absent</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: 'rgba(59,130,246,0.08)' }]}>
              <Text style={[styles.summaryVal, { color: '#3B82F6' }]}>{summary.total_days}</Text>
              <Text style={[styles.summaryKey, { color: colors.textSecondary }]}>Total Days</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: pctColor + '14' }]}>
              <Text style={[styles.summaryVal, { color: pctColor }]}>{summary.present_pct}%</Text>
              <Text style={[styles.summaryKey, { color: colors.textSecondary }]}>Attendance</Text>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: summary.present_pct + '%', backgroundColor: pctColor }]} />
          </View>
          <Text style={[styles.progressLabel, { color: colors.textMuted }]}>Last {summary.total_days} working days tracked</Text>
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'attendance' && { borderBottomColor: '#3B82F6', borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('attendance')}
          >
            <MaterialCommunityIcons name="clock-check-outline" size={16} color={activeTab === 'attendance' ? '#3B82F6' : colors.textMuted} />
            <Text style={[styles.tabLabel, { color: activeTab === 'attendance' ? '#3B82F6' : colors.textMuted }]}>Punch Timing</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'leaves' && { borderBottomColor: '#EF4444', borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('leaves')}
          >
            <Feather name="calendar" size={15} color={activeTab === 'leaves' ? '#EF4444' : colors.textMuted} />
            <Text style={[styles.tabLabel, { color: activeTab === 'leaves' ? '#EF4444' : colors.textMuted }]}>Leaves ({summary.absent_days})</Text>
          </TouchableOpacity>
        </View>

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
                        <Text style={{ fontSize: 8, color: '#EF4444', fontWeight: '700' }}>ABSENT</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 10 },
  header: { borderRadius: 18, padding: 20, marginBottom: 16 },
  backBtn: { marginBottom: 12 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { fontSize: 24, fontWeight: '800' },
  facultyName: { fontSize: 18, fontWeight: '800', marginBottom: 2, lineHeight: 22 },
  facultyDept: { fontSize: 12, fontWeight: '500', marginBottom: 6 },
  empBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(59,130,246,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  empBadgeText: { fontSize: 10, color: '#3B82F6', fontWeight: '700' },
  card: { borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  contactIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  contactText: { fontSize: 13, fontWeight: '500', flex: 1 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  summaryBox: { flex: 1, minWidth: '40%', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center' },
  summaryVal: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  summaryKey: { fontSize: 10, fontWeight: '600' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 10, textAlign: 'right' },
  tabRow: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  tabLabel: { fontSize: 12, fontWeight: '700' },
  punchCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10, gap: 12 },
  dateBadge: { alignItems: 'center', minWidth: 40 },
  dateBadgeDay: { fontSize: 9, fontWeight: '700', color: '#3B82F6', letterSpacing: 0.5 },
  dateBadgeDate: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  dateBadgeMonth: { fontSize: 9, fontWeight: '600', color: '#64748B' },
  punchInfo: { flex: 1 },
  punchTimeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  punchTime: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  punchDot: { width: 8, height: 8, borderRadius: 4 },
  punchTimeVal: { fontSize: 15, fontWeight: '700' },
  hoursChip: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: 'rgba(139,92,246,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  hoursText: { fontSize: 10, color: '#8B5CF6', fontWeight: '700' },
  statusDot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  leavesNote: { fontSize: 11, fontStyle: 'italic', marginBottom: 12 },
  leavesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  leaveChip: { width: '30%', borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center', gap: 4 },
  leaveChipDay: { fontSize: 10, fontWeight: '700', color: '#EF4444' },
  leaveChipDate: { fontSize: 11, fontWeight: '600', color: '#64748B', textAlign: 'center' },
  leaveLabel: { backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  emptyBox: { borderRadius: 16, padding: 32, alignItems: 'center', gap: 12, marginBottom: 16 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});

export default AdminFacultyDetailScreen;
