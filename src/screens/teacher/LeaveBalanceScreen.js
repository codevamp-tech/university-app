import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, FlatList
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../context/UserContext';
import { getLeaveSummary } from '../../data/apiService';

const { width } = Dimensions.get('window');

const LeaveBalanceScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { accessToken } = useUser();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Skeleton pulse animation
  const pulseAnim = React.useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const fetchLeaveSummary = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLeaveSummary(accessToken);
      if (data) {
        setSummary(data);
      } else {
        setError('No leave records found.');
      }
    } catch (e) {
      setError('Failed to fetch leave summary');
      console.warn('[LeaveBalance] Error:', e);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchLeaveSummary();
  }, [fetchLeaveSummary]);

  const SkeletonBlock = ({ w = '100%', h = 16, style }) => (
    <Animated.View style={[{ width: w, height: h, borderRadius: 8, backgroundColor: '#E5E7EB', opacity: pulseAnim }, style]} />
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <SkeletonBlock w="60%" h={32} style={{ marginBottom: 16 }} />
      <View style={styles.row}>
        <SkeletonBlock w="48%" h={100} style={{ borderRadius: 16, marginBottom: 16 }} />
        <SkeletonBlock w="48%" h={100} style={{ borderRadius: 16, marginBottom: 16 }} />
      </View>
      <SkeletonBlock h={120} style={{ marginBottom: 16, borderRadius: 20 }} />
      <SkeletonBlock h={200} style={{ borderRadius: 20 }} />
    </View>
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Extract balances
  const balances = summary?.balances || {};
  const cl = balances.casual || { total: 0, accrued: 0, carry_forward: 0 };
  const pl = balances.privilege || { total: 0, accrued: 0, carry_forward: 0 };
  const el = balances.earned || { total: 0, accrued: 0, carry_forward: 0 };

  const leavesTaken = summary?.leaves_taken || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={['#1E1B4B', '#312E81']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leave Ledger</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.headerSub}>
          <Text style={styles.headerSubText}>View leave balances and history tracked in biometric/ERP system.</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? renderSkeleton() : error ? (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons name="calendar-remove-outline" size={48} color="#D1D5DB" />
            <Text style={styles.errorTitle}>Error Loading Leaves</Text>
            <Text style={styles.errorSub}>{error}</Text>
            <TouchableOpacity onPress={fetchLeaveSummary} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Visual Balance Rings/Cards */}
            <Text style={styles.sectionTitle}>Remaining Leave Balances</Text>
            <View style={styles.balancesContainer}>
              <View style={[styles.balanceCard, { borderTopColor: '#3B82F6' }]}>
                <Text style={styles.balCount}>{cl.total}</Text>
                <Text style={styles.balLabel}>Casual Leave (CL)</Text>
                <Text style={styles.balSub}>Accrued: {cl.accrued}</Text>
              </View>

              <View style={[styles.balanceCard, { borderTopColor: '#10B981' }]}>
                <Text style={styles.balCount}>{pl.total}</Text>
                <Text style={styles.balLabel}>Privilege Leave (PL)</Text>
                <Text style={styles.balSub}>Accrued: {pl.accrued}</Text>
              </View>

              <View style={[styles.balanceCard, { borderTopColor: '#F59E0B' }]}>
                <Text style={styles.balCount}>{el.total}</Text>
                <Text style={styles.balLabel}>Earned Leave (EL)</Text>
                <Text style={styles.balSub}>Accrued: {el.accrued}</Text>
              </View>
            </View>

            {/* Detailed Entitlements list */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="list" size={18} color="#4F46E5" />
                </View>
                <Text style={styles.sectionTitleText}>Alloted Entitlements</Text>
              </View>
              {[
                { label: 'Casual Leave (CL)', value: summary.entitlements?.casual_leave || 0 },
                { label: 'Sick Leave (SL)', value: summary.entitlements?.sick_leave || 0 },
                { label: 'Earned Leave (EL)', value: summary.entitlements?.earned_leave || 0 },
                { label: 'Maternity Leave (ML)', value: summary.entitlements?.maternity_leave || 0 },
                { label: 'Conference Leave', value: summary.entitlements?.conference_leave || 0 },
              ].map((item, i) => (
                <View key={i} style={[styles.lineItem, i === 4 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.lineLabel}>{item.label}</Text>
                  <Text style={styles.lineValue}>{item.value} Days</Text>
                </View>
              ))}
            </View>

            {/* Leaves Taken / History */}
            <Text style={styles.sectionTitle}>Leaves Taken History</Text>
            {leavesTaken.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="sunny-outline" size={32} color="#9CA3AF" />
                <Text style={styles.emptyText}>No leave records reported for this month/year.</Text>
              </View>
            ) : (
              leavesTaken.map((item, idx) => (
                <View key={idx} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyMeta}>
                      <Text style={styles.historyType}>{item.leave_type}</Text>
                      <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: item.status === 'Approved' ? '#DEF7EC' : '#FEF3C7' }
                    ]}>
                      <Text style={[
                        styles.statusText, 
                        { color: item.status === 'Approved' ? '#03543F' : '#92400E' }
                      ]}>{item.status}</Text>
                    </View>
                  </View>

                  {item.reason ? (
                    <Text style={styles.historyReason}>“ {item.reason} ”</Text>
                  ) : null}

                  {item.work_in_charge ? (
                    <View style={styles.workInChargeRow}>
                      <Ionicons name="person-circle-outline" size={16} color="#6B7280" />
                      <Text style={styles.workInChargeText}>Work In-charge: {item.work_in_charge}</Text>
                    </View>
                  ) : null}
                </View>
              ))
            )}

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  headerGradient: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 22,
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  headerSub: { paddingHorizontal: 20, marginTop: 12 },
  headerSubText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 18, fontWeight: '500' },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },

  // Skeleton
  skeletonContainer: { paddingTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },

  // Error
  errorCard: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 40,
    alignItems: 'center', gap: 12, marginTop: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 3,
  },
  errorTitle: { fontSize: 18, fontWeight: '800', color: '#374151' },
  errorSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
  retryBtn: {
    marginTop: 8, backgroundColor: '#EEF2FF', borderRadius: 20,
    paddingHorizontal: 24, paddingVertical: 10,
  },
  retryText: { fontSize: 14, fontWeight: '700', color: '#4F46E5' },

  // Balances
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 12, marginTop: 4, letterSpacing: -0.3 },
  balancesContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  balanceCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 18, padding: 14,
    borderTopWidth: 4, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  balCount: { fontSize: 24, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  balLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', marginTop: 4, textAlign: 'center' },
  balSub: { fontSize: 9, fontWeight: '600', color: '#9CA3AF', marginTop: 6 },

  // Section Card
  sectionCard: {
    backgroundColor: '#FFF', borderRadius: 22, padding: 18, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 3,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  sectionIconBg: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitleText: { fontSize: 15, fontWeight: '800', color: '#111827' },

  // Line items
  lineItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  lineLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  lineValue: { fontSize: 14, fontWeight: '700', color: '#111827' },

  // History Card
  historyCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  historyMeta: { flex: 1, marginRight: 10 },
  historyType: { fontSize: 14, fontWeight: '800', color: '#111827' },
  historyDate: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '700' },
  historyReason: { fontSize: 13, color: '#4B5563', fontStyle: 'italic', marginTop: 10, lineHeight: 18 },
  workInChargeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  workInChargeText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },

  // Empty State
  emptyCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 32,
    alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  emptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', fontWeight: '500', lineHeight: 18 },
});

export default LeaveBalanceScreen;
