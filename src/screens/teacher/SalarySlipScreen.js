import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../context/UserContext';
import { getSalarySlip } from '../../data/apiService';

const { width } = Dimensions.get('window');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SalarySlipScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, accessToken } = useUser();

  const now = new Date();
  // Default to previous month (salary is usually for past month)
  const defaultMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const defaultYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [slip, setSlip] = useState(null);
  const [isSalaryVisible, setIsSalaryVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Skeleton animation
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

  const fetchSlip = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSalarySlip(accessToken, month, year);
      if (data) {
        setSlip(data);
      } else {
        setSlip(null);
        setError('No salary data found for this period');
      }
    } catch (e) {
      setError('Failed to load salary slip');
      console.warn('[SalarySlip] Error:', e);
    } finally {
      setLoading(false);
    }
  }, [accessToken, month, year]);

  useEffect(() => { fetchSlip(); }, [fetchSlip]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSlip();
    setRefreshing(false);
  }, [fetchSlip]);

  const changeMonth = (delta) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 12) { newMonth = 1; newYear += 1; }
    if (newMonth < 1) { newMonth = 12; newYear -= 1; }
    setMonth(newMonth);
    setYear(newYear);
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatCurrencyMasked = (val) => {
    if (!isSalaryVisible) return '₹•••••';
    return formatCurrency(val);
  };

  const SkeletonBlock = ({ w = '100%', h = 16, style }) => (
    <Animated.View style={[{ width: w, height: h, borderRadius: 8, backgroundColor: '#E5E7EB', opacity: pulseAnim }, style]} />
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <SkeletonBlock w="60%" h={32} style={{ marginBottom: 8 }} />
      <SkeletonBlock w="40%" h={16} style={{ marginBottom: 24 }} />
      <SkeletonBlock h={100} style={{ marginBottom: 16, borderRadius: 20 }} />
      <SkeletonBlock h={160} style={{ marginBottom: 16, borderRadius: 20 }} />
      <SkeletonBlock h={160} style={{ borderRadius: 20 }} />
    </View>
  );

  // Build earnings and deductions arrays from slip
  const earnings = slip ? [
    { label: 'Basic Pay', value: slip.basic },
    slip.da ? { label: 'DA', value: slip.da } : null,
    slip.hra ? { label: 'HRA', value: slip.hra } : null,
    slip.other_allowance ? { label: 'Other Allowance', value: slip.other_allowance } : null,
    slip.npa ? { label: 'NPA', value: slip.npa } : null,
    slip.fix_tf_earning ? { label: 'Fixed TF Earning', value: slip.fix_tf_earning } : null,
    slip.overtime ? { label: 'Overtime', value: slip.overtime } : null,
    slip.bonus_earn ? { label: 'Bonus', value: slip.bonus_earn } : null,
    slip.gratuity_earn ? { label: 'Gratuity', value: slip.gratuity_earn } : null,
    slip.misc_earn ? { label: 'Misc Earning', value: slip.misc_earn } : null,
    slip.dean_student_welfare ? { label: 'Dean Student Welfare', value: slip.dean_student_welfare } : null,
    slip.vice_principal ? { label: 'Vice Principal', value: slip.vice_principal } : null,
    slip.dean_pg ? { label: 'Dean PG', value: slip.dean_pg } : null,
    slip.dean_ug ? { label: 'Dean UG', value: slip.dean_ug } : null,
    slip.warden ? { label: 'Warden', value: slip.warden } : null,
    slip.chief_proctor ? { label: 'Chief Proctor', value: slip.chief_proctor } : null,
    slip.exam_controller ? { label: 'Exam Controller', value: slip.exam_controller } : null,
  ].filter(Boolean).filter(e => e.value > 0) : [];

  const deductions = slip ? [
    slip.tds ? { label: 'TDS', value: slip.tds } : null,
    slip.epf ? { label: 'EPF', value: slip.epf } : null,
    slip.esi ? { label: 'ESI', value: slip.esi } : null,
    slip.swf ? { label: 'SWF', value: slip.swf } : null,
    slip.lic ? { label: 'LIC', value: slip.lic } : null,
    slip.mobile_bill ? { label: 'Mobile Bill', value: slip.mobile_bill } : null,
    slip.transport ? { label: 'Transport', value: slip.transport } : null,
    slip.electricity ? { label: 'Electricity', value: slip.electricity } : null,
    slip.fix_tf_dedn ? { label: 'Fixed TF Deduction', value: slip.fix_tf_dedn } : null,
    slip.misc_dedn ? { label: 'Misc Deduction', value: slip.misc_dedn } : null,
  ].filter(Boolean).filter(d => d.value > 0) : [];

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
          <Text style={styles.headerTitle}>Salary Slip</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Month Picker */}
        <View style={styles.monthPicker}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrow}>
            <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          <View style={styles.monthCenter}>
            <Text style={styles.monthText}>{MONTHS[month - 1]} {year}</Text>
          </View>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthArrow}>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#EA580C" colors={['#EA580C']} />}
      >
        {loading ? renderSkeleton() : error ? (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons name="file-document-remove-outline" size={48} color="#D1D5DB" />
            <Text style={styles.errorTitle}>No Salary Data</Text>
            <Text style={styles.errorSub}>{error}</Text>
            <TouchableOpacity onPress={fetchSlip} style={styles.retryBtn}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : slip ? (
          <>
            {/* Net Pay Hero Card */}
            <LinearGradient
              colors={['#059669', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.netPayCard}
            >
              <View style={styles.netPayIcon}>
                <MaterialCommunityIcons name="wallet-outline" size={24} color="#FFF" />
              </View>
              <Text style={styles.netPayLabel}>Net Salary</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <Text style={styles.netPayAmount}>{formatCurrencyMasked(slip.net_salary)}</Text>
                <TouchableOpacity
                  onPress={() => setIsSalaryVisible(!isSalaryVisible)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name={isSalaryVisible ? "eye-off-outline" : "eye-outline"} size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.netPayMeta}>
                <View style={styles.netPayPill}>
                  <Text style={styles.netPayPillText}>
                    {slip.designation || 'Faculty'}
                  </Text>
                </View>
                <View style={styles.netPayPill}>
                  <Text style={styles.netPayPillText}>
                    {slip.department || '—'}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* Summary Row */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { borderLeftColor: '#10B981' }]}>
                <Text style={styles.summaryLabel}>Gross Earnings</Text>
                <Text style={[styles.summaryValue, { color: '#059669' }]}>
                  {formatCurrencyMasked(slip.gross_salary)}
                </Text>
              </View>
              <View style={[styles.summaryCard, { borderLeftColor: '#EF4444' }]}>
                <Text style={styles.summaryLabel}>Total Deductions</Text>
                <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                  {formatCurrencyMasked(slip.gross_deductions)}
                </Text>
              </View>
            </View>

            {/* Attendance Summary */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="calendar-outline" size={18} color="#3B82F6" />
                </View>
                <Text style={styles.sectionTitle}>Attendance Summary</Text>
              </View>
              <View style={styles.attGrid}>
                <View style={styles.attItem}>
                  <Text style={styles.attValue}>{slip.days_worked || 0}</Text>
                  <Text style={styles.attLabel}>Days Worked</Text>
                </View>
                <View style={styles.attItem}>
                  <Text style={styles.attValue}>{slip.days_physically_present || 0}</Text>
                  <Text style={styles.attLabel}>Present</Text>
                </View>
                <View style={styles.attItem}>
                  <Text style={styles.attValue}>{slip.month_days || 0}</Text>
                  <Text style={styles.attLabel}>Month Days</Text>
                </View>
                <View style={styles.attItem}>
                  <Text style={[styles.attValue, slip.lwp > 0 && { color: '#EF4444' }]}>{slip.lwp || 0}</Text>
                  <Text style={styles.attLabel}>LWP</Text>
                </View>
              </View>
              {(slip.cl > 0 || slip.el > 0 || slip.co > 0) && (
                <View style={styles.leaveRow}>
                  {slip.cl > 0 && <View style={styles.leavePill}><Text style={styles.leavePillText}>CL: {slip.cl}</Text></View>}
                  {slip.el > 0 && <View style={styles.leavePill}><Text style={styles.leavePillText}>EL: {slip.el}</Text></View>}
                  {slip.co > 0 && <View style={styles.leavePill}><Text style={styles.leavePillText}>CO: {slip.co}</Text></View>}
                </View>
              )}
            </View>

            {/* Earnings Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="trending-up" size={18} color="#10B981" />
                </View>
                <Text style={styles.sectionTitle}>Earnings</Text>
                <Text style={[styles.sectionTotal, { color: '#059669' }]}>{formatCurrencyMasked(slip.gross_salary)}</Text>
              </View>
              {earnings.map((item, i) => (
                <View key={i} style={[styles.lineItem, i === earnings.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.lineLabel}>{item.label}</Text>
                  <Text style={styles.lineValue}>{formatCurrencyMasked(item.value)}</Text>
                </View>
              ))}
            </View>

            {/* Deductions Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: '#FEF2F2' }]}>
                  <Ionicons name="trending-down" size={18} color="#EF4444" />
                </View>
                <Text style={styles.sectionTitle}>Deductions</Text>
                <Text style={[styles.sectionTotal, { color: '#EF4444' }]}>{formatCurrencyMasked(slip.gross_deductions)}</Text>
              </View>
              {deductions.map((item, i) => (
                <View key={i} style={[styles.lineItem, i === deductions.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.lineLabel}>{item.label}</Text>
                  <Text style={[styles.lineValue, { color: '#EF4444' }]}>{formatCurrencyMasked(item.value)}</Text>
                </View>
              ))}
            </View>

            {/* Employee Info */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: '#F5F3FF' }]}>
                  <Ionicons name="person-outline" size={18} color="#7C3AED" />
                </View>
                <Text style={styles.sectionTitle}>Employee Details</Text>
              </View>
              {[
                { label: 'Name', value: slip.emp_name },
                { label: 'Department', value: slip.department },
                { label: 'Designation', value: slip.designation },
                { label: 'Category', value: slip.category },
                slip.pan_no ? { label: 'PAN', value: slip.pan_no } : null,
                slip.account_no ? { label: 'Account No', value: slip.account_no } : null,
              ].filter(Boolean).map((item, i) => (
                <View key={i} style={[styles.lineItem, { borderBottomColor: '#F9FAFB' }]}>
                  <Text style={styles.lineLabel}>{item.label}</Text>
                  <Text style={[styles.lineValue, { color: '#4B5563' }]}>{item.value || '—'}</Text>
                </View>
              ))}
            </View>

            <View style={{ height: 40 }} />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  headerGradient: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 20,
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
  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 16,
  },
  monthArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  monthCenter: { alignItems: 'center' },
  monthText: { fontSize: 16, fontWeight: '700', color: '#FFF', letterSpacing: 0.5 },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },

  // Skeleton
  skeletonContainer: { paddingTop: 8 },

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

  // Net Pay Hero
  netPayCard: {
    borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 16,
    shadowColor: '#059669', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  netPayIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  netPayLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 4 },
  netPayAmount: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
  netPayMeta: { flexDirection: 'row', gap: 8, marginTop: 12 },
  netPayPill: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  netPayPillText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },

  // Summary Row
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 18, padding: 16,
    borderLeftWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  summaryValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },

  // Section Cards
  sectionCard: {
    backgroundColor: '#FFF', borderRadius: 22, padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10,
  },
  sectionIconBg: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', flex: 1 },
  sectionTotal: { fontSize: 15, fontWeight: '800' },

  // Line Items
  lineItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  lineLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500', flex: 1 },
  lineValue: { fontSize: 14, fontWeight: '700', color: '#111827' },

  // Attendance
  attGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  attItem: { alignItems: 'center', flex: 1 },
  attValue: { fontSize: 22, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  attLabel: { fontSize: 10, fontWeight: '600', color: '#9CA3AF', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  leaveRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  leavePill: {
    backgroundColor: '#FFF7ED', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  leavePillText: { fontSize: 11, fontWeight: '700', color: '#EA580C' },
});

export default SalarySlipScreen;
