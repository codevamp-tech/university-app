import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, FlatList, Modal, TextInput, ActivityIndicator, Alert, Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../context/UserContext';
import { getLeaveSummary, getDepartmentFacultyList, applyFacultyLeave, getEmployeeERPProfile } from '../../data/apiService';

const { width } = Dimensions.get('window');

// ─── CalendarModal ───────────────────────────────────────────────────────────
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const CalendarModal = ({ visible, date, onSelect, onClose }) => {
  const [viewYear, setViewYear] = useState(date.getFullYear());
  const [viewMonth, setViewMonth] = useState(date.getMonth());

  useEffect(() => {
    if (visible) {
      setViewYear(date.getFullYear());
      setViewMonth(date.getMonth());
    }
  }, [visible]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build day grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMon = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMon; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const isSelected = (d) =>
    d && date.getDate() === d && date.getMonth() === viewMonth && date.getFullYear() === viewYear;
  const isToday = (d) => {
    const t = new Date();
    return d && t.getDate() === d && t.getMonth() === viewMonth && t.getFullYear() === viewYear;
  };

  if (!visible) return null;

  return (
    <TouchableOpacity style={calStyles.overlay} activeOpacity={1} onPress={onClose}>
      <View style={calStyles.sheet}>
        {/* Month nav */}
        <View style={calStyles.header}>
          <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
            <Ionicons name="chevron-back" size={20} color="#EA580C" />
          </TouchableOpacity>
          <Text style={calStyles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
          <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color="#EA580C" />
          </TouchableOpacity>
        </View>

        {/* Day labels */}
        <View style={calStyles.dayRow}>
          {DAY_NAMES.map(d => (
            <Text key={d} style={calStyles.dayLabel}>{d}</Text>
          ))}
        </View>

        {/* Date grid */}
        {weeks.map((week, wi) => (
          <View key={wi} style={calStyles.weekRow}>
            {week.map((day, di) => {
              const sel = isSelected(day);
              const tod = isToday(day);
              return (
                <TouchableOpacity
                  key={di}
                  style={[calStyles.dayCell, sel && calStyles.dayCellSelected, tod && !sel && calStyles.dayCellToday]}
                  onPress={() => {
                    if (day) { onSelect(new Date(viewYear, viewMonth, day)); onClose(); }
                  }}
                  activeOpacity={day ? 0.7 : 1}
                >
                  <Text style={[
                    calStyles.dayCellText,
                    sel && calStyles.dayCellTextSelected,
                    tod && !sel && calStyles.dayCellTextToday,
                    !day && { opacity: 0 },
                  ]}>
                    {day || ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Today shortcut */}
        <TouchableOpacity
          style={calStyles.todayBtn}
          onPress={() => { onSelect(getIstToday()); onClose(); }}
        >
          <Text style={calStyles.todayBtnText}>Today</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const calStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: { padding: 6, borderRadius: 8, backgroundColor: '#FFF7ED' },
  monthLabel: { fontSize: 16, fontWeight: '800', color: '#111827' },
  dayRow: { flexDirection: 'row', marginBottom: 8 },
  dayLabel: {
    flex: 1, textAlign: 'center',
    fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.3,
  },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  dayCell: {
    flex: 1, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCellSelected: { backgroundColor: '#EA580C' },
  dayCellToday: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#EA580C' },
  dayCellText: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  dayCellTextSelected: { color: '#FFFFFF', fontWeight: '800' },
  dayCellTextToday: { color: '#EA580C', fontWeight: '700' },
  todayBtn: {
    marginTop: 12, alignSelf: 'center',
    paddingVertical: 10, paddingHorizontal: 32,
    backgroundColor: '#FFF7ED', borderRadius: 12,
    borderWidth: 1, borderColor: '#FDBA74',
  },
  todayBtnText: { fontSize: 14, fontWeight: '800', color: '#EA580C' },
});

// ─── DropdownModal ────────────────────────────────────────────────────────────
const DropdownModal = ({ visible, title, options, selectedValue, onSelect, onClose }) => {
  if (!visible) return null;
  return (
    <TouchableOpacity style={ddStyles.overlay} activeOpacity={1} onPress={onClose}>
      <View style={ddStyles.sheet}>
        <View style={ddStyles.header}>
          <Text style={ddStyles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={options}
          keyExtractor={item => item.value}
          renderItem={({ item }) => {
            const isSelected = item.value === selectedValue;
            return (
              <TouchableOpacity
                style={[ddStyles.option, isSelected && ddStyles.optionSelected]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={[ddStyles.optionText, isSelected && ddStyles.optionTextSelected]}>
                  {item.label}
                </Text>
                {isSelected && <Ionicons name="checkmark" size={18} color="#EA580C" />}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </TouchableOpacity>
  );
};

const ddStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  sheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24, maxHeight: '60%',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '800', color: '#111827' },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  optionSelected: { backgroundColor: '#FFF7ED' },
  optionText: { fontSize: 14, color: '#374151', fontWeight: '500', flex: 1, marginRight: 8 },
  optionTextSelected: { color: '#EA580C', fontWeight: '700' },
});

const LEAVE_TYPES = [
  { value: '2', label: 'Casual Leave' },
  { value: '1', label: 'Privilege Leave' },
  { value: '9', label: 'Earned Leave' },
];

const DAY_TYPES = [
  { value: '1', label: 'Full Day' },
  { value: '2', label: 'Half Day' },
];

const getIstToday = () => {
  const local = new Date();
  const utc = local.getTime() + (local.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 3600000;
  return new Date(utc + istOffset);
};

const formStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  overlayBackdrop: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
  },
  sheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30,
    paddingTop: 22, paddingBottom: Platform.OS === 'ios' ? 36 : 24, maxHeight: '90%',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '900', color: '#111827', letterSpacing: -0.3 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  formScroll: { paddingHorizontal: 24, gap: 16, paddingBottom: 20 },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 9, fontWeight: '800', color: '#9CA3AF', letterSpacing: 0.8 },
  selectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F9FAFB', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB',
  },
  selectBtnText: { fontSize: 14, color: '#374151', fontWeight: '600' },
  textInput: {
    backgroundColor: '#F9FAFB', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB',
    fontSize: 14, color: '#374151', minHeight: 80, textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row', backgroundColor: '#EA580C', paddingVertical: 14,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10,
    shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  submitBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
});

const LeaveBalanceScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inchargeName, setInchargeName] = useState('');

  // --- Leave Apply Modal states ---
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [facList, setFacList] = useState([]);
  const [facLoading, setFacLoading] = useState(false);

  // Form states
  const [selectedLeaveCode, setSelectedLeaveCode] = useState('2'); // default: Casual Leave
  const [leaveDate, setLeaveDate] = useState(getIstToday());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dayType, setDayType] = useState('1'); // default: Full Day
  const [workInCharge, setWorkInCharge] = useState('');
  const [remarks, setRemarks] = useState('');

  // Dropdown states for form
  const [leaveTypeDropdownOpen, setLeaveTypeDropdownOpen] = useState(false);
  const [dayTypeDropdownOpen, setDayTypeDropdownOpen] = useState(false);
  const [workInChargeDropdownOpen, setWorkInChargeDropdownOpen] = useState(false);

  const fetchFacultyList = useCallback(async () => {
    if (!user?.emp_id) return;
    setFacLoading(true);
    try {
      const data = await getDepartmentFacultyList(user.emp_id);
      // Filter out the current user themselves
      const filtered = (data || []).filter(f => f.EmpID !== user.emp_id);
      setFacList(filtered);
      if (filtered.length > 0) {
        setWorkInCharge(filtered[0].EmpID);
      }
    } catch (e) {
      console.warn('[LeaveBalance] Failed to fetch faculty list:', e);
    } finally {
      setFacLoading(false);
    }
  }, [user?.emp_id]);

  useEffect(() => {
    if (applyModalVisible) {
      fetchFacultyList();
    }
  }, [applyModalVisible, fetchFacultyList]);

  const handleSubmitLeave = async () => {
    if (!user?.emp_id) return;
    if (!workInCharge) {
      Alert.alert('Error', 'Please select a colleague for Work Assigned To.');
      return;
    }
    if (!remarks.trim()) {
      Alert.alert('Error', 'Please enter a remark / reason.');
      return;
    }

    setSubmittingLeave(true);
    try {
      // 1. Format date as MM/DD/YYYY
      const m = String(leaveDate.getMonth() + 1).padStart(2, '0');
      const d = String(leaveDate.getDate()).padStart(2, '0');
      const y = leaveDate.getFullYear();
      const attdt = `${m}/${d}/${y}`;

      // 2. Fetch balance for selected leave code
      const balances = summary?.balances || {};
      let balanceObj = { carry_forward: 0, accrued: 0 };
      if (selectedLeaveCode === '2') balanceObj = balances.casual || { carry_forward: 0, accrued: 0 };
      else if (selectedLeaveCode === '1') balanceObj = balances.privilege || { carry_forward: 0, accrued: 0 };
      else if (selectedLeaveCode === '9') balanceObj = balances.earned || { carry_forward: 0, accrued: 0 };

      const cf_lv = parseFloat(balanceObj.carry_forward || 0);
      const ac_lv = parseFloat(balanceObj.accrued || 0);

      // 3. Compute allocation
      const lv_tot = dayType === '1' ? 1.0 : 0.5;
      let lv_cf = 0.0;
      let lv_ac = 0.0;

      if (cf_lv >= lv_tot) {
        lv_cf = lv_tot;
        lv_ac = 0.0;
      } else if (cf_lv > 0) {
        lv_cf = cf_lv;
        lv_ac = lv_tot - cf_lv;
      } else {
        lv_cf = 0.0;
        lv_ac = lv_tot;
      }

      // 4. Construct payload
      const payload = {
        empid: user.emp_id,
        genno: '0',
        attdt: attdt,
        shift: '1',
        leavecd: selectedLeaveCode,
        daytype: dayType,
        rmrk: remarks.trim(),
        usrid: user.emp_id,
        reason: user.emp_id,
        apply: '1',
        deptcd: user.department_code || '60',
        lv_tot: String(lv_tot),
        lv_ac: String(lv_ac),
        lv_cf: String(lv_cf),
        WorkEmpid: workInCharge,
      };

      // 5. Submit
      const res = await applyFacultyLeave(payload);
      if (res.ok) {
        if (res.statusText && parseInt(res.statusText) > 0) {
          Alert.alert('Success', 'Leave application submitted successfully!');
          setApplyModalVisible(false);
          setRemarks('');
          setLeaveDate(getIstToday());
          setDayType('1');
          setSelectedLeaveCode('2');
          fetchLeaveSummary();
        } else {
          Alert.alert('Error', `ERP rejected request with status code: ${res.statusText}`);
        }
      } else {
        Alert.alert('Error', res.error || 'Failed to submit leave. Please check network connection.');
      }
    } catch (e) {
      console.warn('[LeaveBalance] Submit error:', e);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSubmittingLeave(false);
    }
  };

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
    if (!user?.emp_id) return;
    setLoading(true);
    setError(null);
    try {
      const [data, profile] = await Promise.all([
        getLeaveSummary(user.emp_id),
        getEmployeeERPProfile(user.emp_id)
      ]);
      if (data) {
        console.log('[LeaveBalanceScreen] fetched leave data leaves_taken:', JSON.stringify(data.leaves_taken));
        setSummary(data);
      } else {
        setError('No leave records found.');
      }
      if (profile && profile.INCHAGENAME) {
        setInchargeName(profile.INCHAGENAME);
      }
    } catch (e) {
      setError('Failed to fetch leave summary');
      console.warn('[LeaveBalance] Error:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.emp_id]);

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
      if (typeof dateStr === 'string' && dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          const localDate = new Date(y, m, d);
          return localDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      }
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
          <TouchableOpacity onPress={() => setApplyModalVisible(true)} style={styles.applyBtn}>
            <Ionicons name="add-circle-outline" size={22} color="#FFF" />
          </TouchableOpacity>
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
            <View style={styles.historyTitleRow}>
              <Text style={[styles.sectionTitle, { marginBottom: 0, marginTop: 0 }]}>Leaves Taken History</Text>
              <TouchableOpacity onPress={() => setApplyModalVisible(true)} style={styles.inlineApplyBtn}>
                <Ionicons name="add" size={16} color="#EA580C" style={{ marginRight: 4 }} />
                <Text style={styles.inlineApplyBtnText}>Apply Leave</Text>
              </TouchableOpacity>
            </View>
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
                      <Text style={styles.workInChargeText}>Work Assigned To: {item.work_in_charge}</Text>
                    </View>
                  ) : null}

                  {inchargeName ? (
                    <View style={[styles.workInChargeRow, { marginTop: 6 }]}>
                      <Ionicons name="shield-checkmark-outline" size={16} color="#6B7280" />
                      <Text style={styles.workInChargeText}>In-charge: {inchargeName}</Text>
                    </View>
                  ) : null}
                </View>
              ))
            )}

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>

      {/* Leave Application Slide-Up Sheet */}
      {applyModalVisible ? (
        <View style={formStyles.overlay}>
          <TouchableOpacity style={formStyles.overlayBackdrop} activeOpacity={1} onPress={() => setApplyModalVisible(false)} />
          <View style={formStyles.sheet}>
            <View style={formStyles.header}>
              <Text style={formStyles.title}>Apply for Leave</Text>
              <TouchableOpacity onPress={() => setApplyModalVisible(false)} style={formStyles.closeBtn}>
                <Ionicons name="close" size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={formStyles.formScroll} showsVerticalScrollIndicator={false}>
              
              {/* Leave Type Select */}
              <View style={formStyles.fieldWrap}>
                <Text style={formStyles.fieldLabel}>LEAVE TYPE</Text>
                <TouchableOpacity style={formStyles.selectBtn} onPress={() => setLeaveTypeDropdownOpen(true)}>
                  <Text style={formStyles.selectBtnText}>
                    {LEAVE_TYPES.find(t => t.value === selectedLeaveCode)?.label || 'Select Type'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Date Select */}
              <View style={formStyles.fieldWrap}>
                <Text style={formStyles.fieldLabel}>LEAVE DATE</Text>
                <TouchableOpacity style={formStyles.selectBtn} onPress={() => setShowDatePicker(true)}>
                  <Text style={formStyles.selectBtnText}>
                    {leaveDate ? leaveDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Select Date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color="#EA580C" />
                </TouchableOpacity>
              </View>

              {/* Day Type Select */}
              <View style={formStyles.fieldWrap}>
                <Text style={formStyles.fieldLabel}>DURATION</Text>
                <TouchableOpacity style={formStyles.selectBtn} onPress={() => setDayTypeDropdownOpen(true)}>
                  <Text style={formStyles.selectBtnText}>
                    {DAY_TYPES.find(t => t.value === dayType)?.label || 'Select Duration'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Work Assigned To Select */}
              <View style={formStyles.fieldWrap}>
                <Text style={formStyles.fieldLabel}>WORK ASSIGNED TO (COLLEAGUE)</Text>
                <TouchableOpacity 
                  style={formStyles.selectBtn} 
                  onPress={() => setWorkInChargeDropdownOpen(true)}
                  disabled={facLoading}
                >
                  {facLoading ? (
                    <ActivityIndicator size="small" color="#EA580C" style={{ marginRight: 8 }} />
                  ) : null}
                  <Text style={formStyles.selectBtnText} numberOfLines={1}>
                    {facList.find(f => f.EmpID === workInCharge)?.EmpName || (facLoading ? 'Loading colleagues...' : 'Select Colleague')}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Remarks/Reason Text Input */}
              <View style={formStyles.fieldWrap}>
                <Text style={formStyles.fieldLabel}>REASON / REMARKS</Text>
                <TextInput
                  style={formStyles.textInput}
                  placeholder="Explain the reason for leave..."
                  placeholderTextColor="#9CA3AF"
                  value={remarks}
                  onChangeText={setRemarks}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity 
                style={formStyles.submitBtn} 
                onPress={handleSubmitLeave}
                disabled={submittingLeave}
              >
                {submittingLeave ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={formStyles.submitBtnText}>Apply Leave</Text>
                  </>
                )}
              </TouchableOpacity>
              
            </ScrollView>
          </View>

          {/* Date Picker Calendar Modal Overlay */}
          <CalendarModal
            visible={showDatePicker}
            date={leaveDate}
            onSelect={(d) => setLeaveDate(d)}
            onClose={() => setShowDatePicker(false)}
          />

          {/* Leave Type Selection Modal Overlay */}
          <DropdownModal
            visible={leaveTypeDropdownOpen}
            title="Select Leave Type"
            options={LEAVE_TYPES}
            selectedValue={selectedLeaveCode}
            onSelect={(item) => setSelectedLeaveCode(item.value)}
            onClose={() => setLeaveTypeDropdownOpen(false)}
          />

          {/* Day Type Selection Modal Overlay */}
          <DropdownModal
            visible={dayTypeDropdownOpen}
            title="Select Duration"
            options={DAY_TYPES}
            selectedValue={dayType}
            onSelect={(item) => setDayType(item.value)}
            onClose={() => setDayTypeDropdownOpen(false)}
          />

          {/* Work Assigned To Selection Modal Overlay */}
          <DropdownModal
            visible={workInChargeDropdownOpen}
            title="Select Colleague (Work Assigned To)"
            options={facList.map(f => ({ value: f.EmpID, label: `${f.EmpName} (${f.Department})` }))}
            selectedValue={workInCharge}
            onSelect={(item) => setWorkInCharge(item.value)}
            onClose={() => setWorkInChargeDropdownOpen(false)}
          />
        </View>
      ) : null}
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
  applyBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 16,
  },
  inlineApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  inlineApplyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
  },
});

export default LeaveBalanceScreen;
