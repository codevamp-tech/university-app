import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../context/UserContext';
import { getFacultyAttendance, syncFacultyData } from '../../data/apiService';
import { Colors } from '../../constants/colors';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return ''; }
}

const TeacherAttendanceScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { accessToken } = useUser();
  const [punches, setPunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAttendance = useCallback(async (showIndicator = true) => {
    if (!accessToken) { setLoading(false); setRefreshing(false); return; }
    if (showIndicator) setLoading(true);
    try {
      const data = await getFacultyAttendance(accessToken);
      setPunches(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('[TeacherAttendanceScreen] failed to load punches:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncFacultyData(accessToken);
    } catch (e) {
      console.warn('[TeacherAttendanceScreen] sync failed:', e);
    }
    await loadAttendance(false);
  };

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // Unique days calculation
  const uniqueDays = new Set(
    punches
      .map(p => p.punch_time ? p.punch_time.slice(0, 10) : null)
      .filter(Boolean)
  );
  const totalDaysPresent = uniqueDays.size;

  // Today's punches
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayPunches = punches.filter(p => p.punch_time && p.punch_time.startsWith(todayStr));
  
  // Sort today's punches ascending to find first (In) and last (Out)
  const todaySorted = [...todayPunches].sort((a, b) => new Date(a.punch_time) - new Date(b.punch_time));
  const checkInToday = todaySorted.length > 0 ? formatTime(todaySorted[0].punch_time) : '—';
  const checkOutToday = todaySorted.length > 1 ? formatTime(todaySorted[todaySorted.length - 1].punch_time) : '—';

  // Group punches by date (YYYY-MM-DD)
  const groupedPunches = {};
  punches.forEach((punch) => {
    if (punch.punch_time) {
      const dateStr = punch.punch_time.slice(0, 10);
      if (!groupedPunches[dateStr]) {
        groupedPunches[dateStr] = [];
      }
      groupedPunches[dateStr].push(punch);
    }
  });

  // Sort dates descending
  const sortedDates = Object.keys(groupedPunches).sort((a, b) => new Date(b) - new Date(a));
  
  // Sort punches ascending within each day
  sortedDates.forEach((dStr) => {
    groupedPunches[dStr].sort((a, b) => new Date(a.punch_time) - new Date(b.punch_time));
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={['#FFFFFF', '#F9FAFB']} style={styles.header}>
        <Text style={styles.headerTitle}>Attendance logs</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} disabled={loading || refreshing}>
          <Ionicons name="refresh" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching punch records...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.summaryCard}>
              <Text style={styles.summaryVal}>{totalDaysPresent}</Text>
              <Text style={styles.summaryLabel}>DAYS PRESENT</Text>
            </LinearGradient>
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Ionicons name="enter-outline" size={16} color="#10B981" />
                <View>
                  <Text style={styles.detailLabel}>TODAY'S IN</Text>
                  <Text style={styles.detailVal}>{checkInToday}</Text>
                </View>
              </View>
              <View style={[styles.detailRow, { marginTop: 12 }]}>
                <Ionicons name="exit-outline" size={16} color="#EF4444" />
                <View>
                  <Text style={styles.detailLabel}>TODAY'S OUT</Text>
                  <Text style={styles.detailVal}>{checkOutToday}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* List of Punches */}
          <Text style={styles.sectionTitle}>Punch Logs (Recent First)</Text>

          {sortedDates.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="finger-print-outline" size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No punch logs found</Text>
              <Text style={styles.emptySub}>Punches will automatically sync from SRMS biometric portal.</Text>
            </View>
          ) : (
            sortedDates.map((dateStr) => {
              const dayPunches = groupedPunches[dateStr];
              const dateLabel = formatDate(dayPunches[0]?.punch_time);

              return (
                <View key={dateStr} style={styles.dateGroupContainer}>
                  <Text style={styles.dateGroupHeader}>{dateLabel}</Text>
                  <View style={styles.dateGroupCard}>
                    {dayPunches.map((punch, idx) => {
                      const time = formatTime(punch.punch_time);
                      const isInOut = String(punch.in_out).toUpperCase();
                      const isEntry = isInOut === 'IN' || isInOut === 'I';
                      
                      return (
                        <View key={punch.id || idx} style={[
                          styles.subPunchRow, 
                          idx > 0 && { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, marginTop: 12 }
                        ]}>
                          <View style={[styles.punchStatusCircle, { backgroundColor: isEntry ? '#E0F2FE' : '#FEE2E2' }]}>
                            <Ionicons
                              name={isEntry ? 'enter-outline' : 'exit-outline'}
                              size={18}
                              color={isEntry ? '#0284C7' : '#EF4444'}
                            />
                          </View>
                          <View style={styles.punchInfo}>
                            <View style={[styles.statusBadge, { backgroundColor: isEntry ? '#F0F9FF' : '#FEF2F2', alignSelf: 'flex-start' }]}>
                              <Text style={[styles.statusBadgeText, { color: isEntry ? '#0284C7' : '#EF4444' }]}>
                                {isEntry ? 'PUNCH IN' : 'PUNCH OUT'}
                              </Text>
                            </View>
                            <Text style={styles.punchMeta}>Device Code: {punch.device_cd || '—'}</Text>
                          </View>
                          <View style={styles.punchTimeWrap}>
                            <Text style={styles.punchTime}>{time}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
  },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280', fontWeight: '500' },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryCard: {
    flex: 1, borderRadius: 24, padding: 20,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1E1B4B', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  summaryVal: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  summaryLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 0.8, marginTop: 4 },
  detailsCard: {
    flex: 1.2, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.5 },
  detailVal: { fontSize: 14, fontWeight: '800', color: '#111827', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 14, letterSpacing: -0.3 },
  emptyCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 40,
    alignItems: 'center', borderWidth: 1, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  emptyText: { fontSize: 16, fontWeight: '800', color: '#4B5563', marginBottom: 4 },
  emptySub: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
  punchCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20,
    marginBottom: 10, borderWidth: 1, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
  },
  punchStatusCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  punchInfo: { flex: 1, marginLeft: 12 },
  punchDate: { fontSize: 14, fontWeight: '800', color: '#111827' },
  punchMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontWeight: '500' },
  punchTimeWrap: { alignItems: 'flex-end' },
  punchTime: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  dateGroupContainer: {
    marginBottom: 20,
  },
  dateGroupHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4B5563',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  subPunchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default TeacherAttendanceScreen;
