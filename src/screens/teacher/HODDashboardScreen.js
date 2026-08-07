/**
 * HODDashboardScreen.js
 * ─────────────────────────────────────────────────────────────────
 * Department management dashboard for faculty with is_hod = true.
 *
 * Sections:
 *   1. Department Summary Card (total faculty, leave pending, workload avg)
 *   2. Faculty in My Department (list with workload hours)
 *   3. Pending Leave Approvals (approve / reject inline)
 *   4. Timetable Overview (weekly department slots)
 *   5. Pending Appraisals (HOD rating action)
 *
 * APIs:
 *   GET /api/v1/faculty-hr/hod-summary
 *   GET /api/v1/faculty-hr/leave (filtered for pending)
 *   PATCH /api/v1/faculty-hr/leave/{id}/action
 *   GET /api/v1/academic-ops/timetable?department_id=X
 *   GET /api/v1/faculty-hr/appraisal
 *   PATCH /api/v1/faculty-hr/appraisal/{id}/hod-rating
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { APP_CONFIG } from '../../config/appConfig';
import { getHODSummary, approveLeave, getTimetable, submitHODAppraisalRating } from '../../data/apiService';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Sub-components ─────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, color, bg, isDark }) => (
  <View style={[styles.statCard, { backgroundColor: bg }]}>
    <MaterialIcons name={icon} size={22} color={color} />
    <Text style={[styles.statValue, { color }]}>{value ?? '—'}</Text>
    <Text style={[styles.statLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : '#6B7280' }]}>{label}</Text>
  </View>
);

const LeaveCard = ({ leave, onAction, isDark, colors }) => {
  const [remarks, setRemarks] = useState('');
  const [acting, setActing] = useState(false);

  const handleAction = async (action) => {
    setActing(true);
    await onAction(leave.id, action, remarks);
    setActing(false);
  };

  const fromDate = leave.from_date ? new Date(leave.from_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
  const toDate = leave.to_date ? new Date(leave.to_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

  return (
    <View style={[styles.leaveCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.leaveHeader}>
        <LinearGradient
          colors={isDark ? ['#7C2D12', '#9A3412'] : ['#FFF7ED', '#FFEDD5']}
          style={styles.leaveIconBg}
        >
          <MaterialIcons name="person" size={18} color={isDark ? '#FB923C' : '#EA580C'} />
        </LinearGradient>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.leaveName, { color: colors.textPrimary }]}>
            {leave.faculty_name || leave.emp_id || 'Faculty'}
          </Text>
          <Text style={[styles.leaveDates, { color: colors.textSecondary }]}>
            {fromDate} → {toDate} · {leave.leave_type || 'Leave'}
          </Text>
        </View>
        <View style={[styles.pendingBadge]}>
          <Text style={styles.pendingText}>PENDING</Text>
        </View>
      </View>
      {leave.reason && (
        <Text style={[styles.leaveReason, { color: colors.textSecondary }]} numberOfLines={2}>
          {leave.reason}
        </Text>
      )}
      <TextInput
        style={[styles.remarksInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB' }]}
        placeholder="Add remarks (optional)…"
        placeholderTextColor={colors.textMuted}
        value={remarks}
        onChangeText={setRemarks}
        multiline
        numberOfLines={2}
      />
      <View style={styles.leaveActions}>
        <TouchableOpacity
          style={[styles.rejectBtn, { opacity: acting ? 0.6 : 1 }]}
          onPress={() => handleAction('rejected')}
          disabled={acting}
        >
          <MaterialIcons name="close" size={16} color="#EF4444" />
          <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.approveBtn, { opacity: acting ? 0.6 : 1 }]}
          onPress={() => handleAction('approved')}
          disabled={acting}
        >
          {acting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <MaterialIcons name="check" size={16} color="#FFF" />
              <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Approve</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────────────

const HODDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, accessToken } = useUser();

  const [summary, setSummary] = useState({});
  const [leaves, setLeaves] = useState([]);
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Mon');

  const deptId = user?.department_id || null;

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [summaryData, timetableData] = await Promise.all([
        getHODSummary(accessToken, deptId),
        getTimetable(accessToken, { department_id: deptId }),
      ]);

      setSummary(summaryData || {});

      // Build timetable map
      const ttMap = {};
      DAYS.forEach(d => { ttMap[d] = []; });
      (Array.isArray(timetableData) ? timetableData : []).forEach(s => {
        const idx = (s.day_of_week || 1) - 1;
        if (idx >= 0 && idx < DAYS.length) {
          ttMap[DAYS[idx]].push({
            time: `${s.start_time?.slice(0, 5)} – ${s.end_time?.slice(0, 5)}`,
            subject: s.subject_name || 'Class',
            faculty: s.faculty_name || '',
            type: s.lecture_type || 'lecture',
            room: s.room || '',
          });
        }
      });
      setTimetable(ttMap);

      // Load pending leaves from summary if available
      if (summaryData?.pending_leaves) {
        setLeaves(Array.isArray(summaryData.pending_leaves) ? summaryData.pending_leaves : []);
      }
    } catch (err) {
      console.warn('[HODDashboardScreen] loadData error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, deptId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLeaveAction = async (leaveId, action, remarks) => {
    const result = await approveLeave(accessToken, leaveId, action, remarks);
    if (result?.success) {
      Alert.alert('✅ Done', `Leave ${action} successfully.`);
      setLeaves(prev => prev.filter(l => l.id !== leaveId));
    } else {
      Alert.alert('Error', result?.error || 'Action failed.');
    }
  };

  const daySlots = timetable[selectedDay] || [];

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={[{ marginTop: 16, color: colors.textSecondary, fontSize: 14 }]}>Loading HOD Dashboard…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <LinearGradient colors={['#6366F1', '#4338CA']} style={styles.logoIconBg}>
          <MaterialIcons name="account-balance" size={18} color="#FFF" />
        </LinearGradient>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Department</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{user?.department || APP_CONFIG.UNIVERSITY_NAME}</Text>
        </View>
        <TouchableOpacity onPress={() => { setRefreshing(true); loadData(); }} style={{ padding: 8 }}>
          <Ionicons name="refresh" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
      >
        {/* ── Section 1: Department Summary ── */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Department Overview</Text>
        <View style={styles.statsRow}>
          <StatCard
            icon="people"
            label="Faculty"
            value={summary.faculty_count ?? summary.total_faculty ?? '—'}
            color="#6366F1"
            bg={isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF'}
            isDark={isDark}
          />
          <StatCard
            icon="hourglass-empty"
            label="Leave Pending"
            value={summary.leave_pending_count ?? leaves.length}
            color="#F59E0B"
            bg={isDark ? 'rgba(245,158,11,0.15)' : '#FFFBEB'}
            isDark={isDark}
          />
          <StatCard
            icon="schedule"
            label="Avg Workload"
            value={summary.avg_workload_hours ? `${summary.avg_workload_hours}h` : '—'}
            color="#10B981"
            bg={isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5'}
            isDark={isDark}
          />
        </View>

        {/* ── Section 2: Pending Leave Approvals ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pending Leave Approvals</Text>
          {leaves.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#B45309' }}>{leaves.length}</Text>
            </View>
          )}
        </View>
        {leaves.length === 0 ? (
          <View style={[styles.emptyBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialIcons name="check-circle-outline" size={36} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No pending leave requests</Text>
          </View>
        ) : (
          leaves.map(leave => (
            <LeaveCard
              key={leave.id}
              leave={leave}
              onAction={handleLeaveAction}
              isDark={isDark}
              colors={colors}
            />
          ))
        )}

        {/* ── Section 3: Department Timetable ── */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 8 }]}>Department Timetable</Text>

        {/* Day selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 0, gap: 8, marginBottom: 12 }}>
          {DAYS.map(day => {
            const isActive = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayBtn, { backgroundColor: isActive ? '#6366F1' : (isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6') }]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayBtnText, { color: isActive ? '#FFF' : colors.textSecondary }]}>{day}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {daySlots.length === 0 ? (
          <View style={[styles.emptyBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="calendar-blank" size={36} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No classes on {selectedDay}</Text>
          </View>
        ) : (
          daySlots.map((slot, i) => (
            <View key={i} style={[styles.slotCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.slotTypeDot, { backgroundColor: slot.type === 'practical' ? '#10B981' : slot.type === 'tutorial' ? '#F59E0B' : '#6366F1' }]} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.slotSubject, { color: colors.textPrimary }]}>{slot.subject}</Text>
                <Text style={[styles.slotMeta, { color: colors.textSecondary }]}>
                  {slot.time}{slot.room ? ` · ${slot.room}` : ''}{slot.faculty ? ` · ${slot.faculty}` : ''}
                </Text>
              </View>
              <View style={[styles.slotTypeBadge, { backgroundColor: slot.type === 'practical' ? 'rgba(16,185,129,0.15)' : slot.type === 'tutorial' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)' }]}>
                <Text style={[styles.slotTypeText, { color: slot.type === 'practical' ? '#10B981' : slot.type === 'tutorial' ? '#F59E0B' : '#6366F1' }]}>
                  {slot.type?.toUpperCase() || 'LECTURE'}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  logoIconBg: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  scroll: { padding: 16, gap: 12, paddingBottom: 100 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  statCard: { flex: 1, borderRadius: 18, padding: 16, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  leaveCard: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 10 },
  leaveHeader: { flexDirection: 'row', alignItems: 'center' },
  leaveIconBg: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  leaveName: { fontSize: 14, fontWeight: '800' },
  leaveDates: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  pendingBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  pendingText: { fontSize: 10, fontWeight: '800', color: '#B45309' },
  leaveReason: { fontSize: 13, lineHeight: 18 },
  remarksInput: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, minHeight: 60,
  },
  leaveActions: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: '#EF4444',
  },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 14, backgroundColor: '#10B981',
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },

  emptyBlock: {
    borderRadius: 18, borderWidth: 1, paddingVertical: 32, paddingHorizontal: 24,
    alignItems: 'center', gap: 10, marginBottom: 4,
  },
  emptyText: { fontSize: 13, fontWeight: '600' },

  dayBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  dayBtnText: { fontSize: 13, fontWeight: '700' },

  slotCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1, padding: 14,
  },
  slotTypeDot: { width: 8, height: 8, borderRadius: 4 },
  slotSubject: { fontSize: 14, fontWeight: '700' },
  slotMeta: { fontSize: 12, fontWeight: '500', marginTop: 3 },
  slotTypeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  slotTypeText: { fontSize: 10, fontWeight: '800' },
});

export default HODDashboardScreen;
