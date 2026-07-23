import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SkeletonBlock } from '../../components/SkeletonLoader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const ERP_BASE = 'https://myportal.srms.ac.in/SRMSERP';
const COLG_CD = '11';
const COURSE_TPY = 'PG';
const DEPT_CD = 'MCA'; // required by ReportDept API

const BATCH_OPTIONS = [2025, 2024, 2023];

const KPI_CONFIG = [
  { key: 'Academic',     label: 'Academic',      icon: 'book-open-variant',   color: '#3B82F6' },
  { key: 'ClinicalList', label: 'Clinical List',  icon: 'stethoscope',         color: '#10B981' },
  { key: 'Additional',   label: 'Additional',     icon: 'plus-circle-outline', color: '#F59E0B' },
  { key: 'Mandatory',    label: 'Mandatory',      icon: 'clipboard-check',     color: '#8B5CF6' },
  { key: 'DRP',          label: 'DRP',            icon: 'file-document',       color: '#EF4444' },
];

// ── Helper: Capitalise department name nicely ─────────────────────────────────
const titleCase = (str) =>
  (str || '').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

// ── KPI Hero Tile ─────────────────────────────────────────────────────────────
const KpiTile = ({ item, isSelected, onPress, colors, isDark }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.82}
    style={[
      styles.kpiTile,
      {
        backgroundColor: isSelected ? item.color + '20' : (isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC'),
        borderColor: isSelected ? item.color : colors.border,
        borderWidth: isSelected ? 2 : 1,
      },
    ]}
  >
    <View style={[styles.kpiIconBg, { backgroundColor: item.color + '20' }]}>
      <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
    </View>
    <Text style={[styles.kpiValue, { color: isSelected ? item.color : colors.textPrimary }]}>
      {item.value?.toLocaleString() ?? '–'}
    </Text>
    <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{item.label}</Text>
  </TouchableOpacity>
);

// ── Department Row ────────────────────────────────────────────────────────────
const DeptRow = ({ item, selectedKey, onPress, colors, isDark }) => {
  const val = item[selectedKey] ?? 0;
  const cfg = KPI_CONFIG.find(k => k.key === selectedKey) || KPI_CONFIG[0];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.deptRow, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.deptIconBg, { backgroundColor: cfg.color + '18' }]}>
        <MaterialCommunityIcons name="hospital-building" size={18} color={cfg.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.deptName, { color: colors.textPrimary }]} numberOfLines={2}>
          {titleCase(item.sem_dept)}
        </Text>
      </View>
      <View style={[styles.deptBadge, { backgroundColor: val > 0 ? cfg.color + '18' : colors.border }]}>
        <Text style={[styles.deptBadgeText, { color: val > 0 ? cfg.color : colors.textMuted }]}>
          {val.toLocaleString()}
        </Text>
      </View>
      <Feather name="chevron-right" size={15} color={colors.textMuted} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
};

// ── Activity Row ──────────────────────────────────────────────────────────────
const ActivityRow = ({ item, colors, idx }) => {
  const pendFac = item.FacultyTotalPending ?? 0;
  const verFac  = item.FacultyTotalVerify  ?? 0;
  const pendHod = item.HODTotalPending     ?? 0;
  const verHod  = item.HODTotalVerify      ?? 0;
  const total   = item.TotalEntries        ?? 0;

  return (
    <View style={[styles.actRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View style={[styles.actIndexBg, { backgroundColor: '#3B82F618' }]}>
          <Text style={[styles.actIndex, { color: '#3B82F6' }]}>{idx + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.actName, { color: colors.textPrimary }]}>
            {item.ActivityName || item.EventType}
          </Text>
          <Text style={[styles.actEventType, { color: colors.textMuted }]}>{item.EventType}</Text>
        </View>
        <View style={[styles.totalBadge, { backgroundColor: total > 0 ? '#10B98118' : colors.border }]}>
          <Text style={[styles.totalBadgeText, { color: total > 0 ? '#10B981' : colors.textMuted }]}>
            {total} entries
          </Text>
        </View>
      </View>
      <View style={[styles.actStatRow, { borderTopColor: colors.border }]}>
        <View style={styles.actStat}>
          <Text style={[styles.actStatLabel, { color: colors.textMuted }]}>Fac. Pending</Text>
          <Text style={[styles.actStatVal, { color: pendFac > 0 ? '#F59E0B' : colors.textSecondary }]}>{pendFac}</Text>
        </View>
        <View style={[styles.actStatDivider, { backgroundColor: colors.border }]} />
        <View style={styles.actStat}>
          <Text style={[styles.actStatLabel, { color: colors.textMuted }]}>Fac. Verified</Text>
          <Text style={[styles.actStatVal, { color: verFac > 0 ? '#10B981' : colors.textSecondary }]}>{verFac}</Text>
        </View>
        <View style={[styles.actStatDivider, { backgroundColor: colors.border }]} />
        <View style={styles.actStat}>
          <Text style={[styles.actStatLabel, { color: colors.textMuted }]}>HOD Pending</Text>
          <Text style={[styles.actStatVal, { color: pendHod > 0 ? '#EF4444' : colors.textSecondary }]}>{pendHod}</Text>
        </View>
        <View style={[styles.actStatDivider, { backgroundColor: colors.border }]} />
        <View style={styles.actStat}>
          <Text style={[styles.actStatLabel, { color: colors.textMuted }]}>HOD Verified</Text>
          <Text style={[styles.actStatVal, { color: verHod > 0 ? '#8B5CF6' : colors.textSecondary }]}>{verHod}</Text>
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const PGLogbookInsightsScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();
  const insets = useSafeAreaInsets();

  // ── State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]             = useState('kpis'); // 'kpis' | 'monthly'
  const [batch, setBatch]                     = useState(2025);
  const [showBatchPicker, setShowBatchPicker] = useState(false);

  // Level 1: overall KPIs
  const [kpiData, setKpiData]         = useState(null);
  const [kpiLoading, setKpiLoading]   = useState(true);

  // Level 2: dept breakdown
  const [selectedKpi, setSelectedKpi]     = useState(null); // e.g. 'Academic'
  const [deptData, setDeptData]           = useState(null);
  const [deptLoading, setDeptLoading]     = useState(false);

  // Level 3: activity breakdown for a dept
  const [selectedDept, setSelectedDept]   = useState(null); // full dept item
  const [actData, setActData]             = useState(null);
  const [actLoading, setActLoading]       = useState(false);

  // Monthly Audit State
  const MONTHS = [
    { name: 'January', short: 'Jan', val: 0 },
    { name: 'February', short: 'Feb', val: 1 },
    { name: 'March', short: 'Mar', val: 2 },
    { name: 'April', short: 'Apr', val: 3 },
    { name: 'May', short: 'May', val: 4 },
    { name: 'June', short: 'Jun', val: 5 },
    { name: 'July', short: 'Jul', val: 6 },
    { name: 'August', short: 'Aug', val: 7 },
    { name: 'September', short: 'Sep', val: 8 },
    { name: 'October', short: 'Oct', val: 9 },
    { name: 'November', short: 'Nov', val: 10 },
    { name: 'December', short: 'Dec', val: 11 },
  ];

  const DEPT_LIST = [
    'PHYSIOLOGY', 'PATHOLOGY', 'ANATOMY', 'ANAESTHESIA',
    'RADIATION ONCOLOGY', 'NEUROLOGY', 'PHARMOCOLOGY',
    'COMMUNITY MEDICINE', 'BIOCHEMISTRY', 'OBSTETRICS & GYNAECOLOGY'
  ];

  const [selectedMonth, setSelectedMonth] = useState(6); // Default July
  const [monthlyDept, setMonthlyDept]     = useState('PHYSIOLOGY');
  const [monthlyData, setMonthlyData]     = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Student Detail State (monthlypgrecorddetaild)
  const [selectedStudentRoll, setSelectedStudentRoll]   = useState(null);
  const [studentDetailsMap, setStudentDetailsMap]       = useState({});
  const [studentDetailsLoading, setStudentDetailsLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch KPIs ────────────────────────────────────────────────────────────
  const fetchKpis = useCallback(async (batchVal) => {
    setKpiLoading(true);
    setSelectedKpi(null);
    setDeptData(null);
    setSelectedDept(null);
    setActData(null);
    try {
      const res = await fetch(`${ERP_BASE}/Faculty/Get_PG_Records?batch=${batchVal}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) setKpiData(json[0]);
    } catch (err) {
      console.warn('[PGLogbook] KPI fetch failed:', err);
    } finally {
      setKpiLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Fetch Departments ─────────────────────────────────────────────────────
  const fetchDepts = useCallback(async (kpiKey) => {
    setDeptLoading(true);
    setSelectedDept(null);
    setActData(null);
    try {
      const res = await fetch(`${ERP_BASE}/Faculty/Get_PG_Dept_Records?batch=${batch}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      const json = await res.json();
      if (Array.isArray(json)) {
        setDeptData(json.sort((a, b) => (b[kpiKey] ?? 0) - (a[kpiKey] ?? 0)));
      }
    } catch (err) {
      console.warn('[PGLogbook] Dept fetch failed:', err);
    } finally {
      setDeptLoading(false);
    }
  }, [batch]);

  // ── Fetch Activity Details ────────────────────────────────────────────────
  const fetchActivities = useCallback(async (deptItem) => {
    setActLoading(true);
    try {
      const res = await fetch(`${ERP_BASE}/LMSReport/ReportDept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colg_cd: COLG_CD,
          dep: DEPT_CD,
          batch: String(batch),
          courseTpy: COURSE_TPY,
          depepart: deptItem.sem_dept,
        }),
      });
      const json = await res.json();
      if (Array.isArray(json)) setActData(json);
      else setActData([]);
    } catch (err) {
      console.warn('[PGLogbook] Activity fetch failed:', err);
      setActData([]);
    } finally {
      setActLoading(false);
    }
  }, [batch]);

  // ── Fetch Monthly Records ─────────────────────────────────────────────────
  const fetchMonthlyRecords = useCallback(async (monthIdx, deptName, batchVal) => {
    setMonthlyLoading(true);
    try {
      const mStr = String(monthIdx + 1).padStart(2, '0');
      const yr = 2026;
      const fdt = `${yr}-${mStr}-01`;
      const lastDay = new Date(yr, monthIdx + 1, 0).getDate();
      const tdt = `${yr}-${mStr}-${String(lastDay).padStart(2, '0')}`;

      const res = await fetch(
        `${ERP_BASE}/Faculty/monthlypgrecord?dep=${encodeURIComponent(deptName)}&fdt=${fdt}&tdt=${tdt}&batch=${batchVal}`
      );
      const json = await res.json();
      if (Array.isArray(json)) setMonthlyData(json);
      else setMonthlyData([]);
    } catch (err) {
      console.warn('[PGLogbook] Monthly fetch failed:', err);
      setMonthlyData([]);
    } finally {
      setMonthlyLoading(false);
    }
  }, []);

  // ── Fetch Student Detailed Records (monthlypgrecorddetaild) ────────────────
  const handleStudentPress = useCallback(async (student) => {
    if (selectedStudentRoll === student.rollno) {
      setSelectedStudentRoll(null);
      return;
    }

    setSelectedStudentRoll(student.rollno);
    if (!studentDetailsMap[student.rollno]) {
      setStudentDetailsLoading(true);
      try {
        const mStr = String(selectedMonth + 1).padStart(2, '0');
        const yr = 2026;
        const fdt = `${yr}-${mStr}-01`;
        const lastDay = new Date(yr, selectedMonth + 1, 0).getDate();
        const tdt = `${yr}-${mStr}-${String(lastDay).padStart(2, '0')}`;

        const res = await fetch(
          `${ERP_BASE}/Faculty/monthlypgrecorddetaild?dep=${encodeURIComponent(monthlyDept)}&fdt=${fdt}&tdt=${tdt}&roll=${student.rollno}&batch=${batch}`
        );
        const json = await res.json();
        if (Array.isArray(json)) {
          setStudentDetailsMap(prev => ({ ...prev, [student.rollno]: json }));
        }
      } catch (err) {
        console.warn('[PGLogbook] Student detail fetch failed:', err);
      } finally {
        setStudentDetailsLoading(false);
      }
    }
  }, [selectedStudentRoll, studentDetailsMap, selectedMonth, monthlyDept, batch]);

  // ── On mount / batch change ───────────────────────────────────────────────
  useEffect(() => { fetchKpis(batch); }, [batch]);

  useEffect(() => {
    if (activeTab === 'monthly') {
      fetchMonthlyRecords(selectedMonth, monthlyDept, batch);
    }
  }, [activeTab, selectedMonth, monthlyDept, batch, fetchMonthlyRecords]);

  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'kpis') {
      fetchKpis(batch);
    } else {
      fetchMonthlyRecords(selectedMonth, monthlyDept, batch);
      setRefreshing(false);
    }
  };

  // ── KPI Tap ───────────────────────────────────────────────────────────────
  const handleKpiPress = (key) => {
    if (selectedKpi === key) {
      setSelectedKpi(null);
      setDeptData(null);
      setSelectedDept(null);
      setActData(null);
      return;
    }
    setSelectedKpi(key);
    fetchDepts(key);
  };

  // ── Dept Tap ──────────────────────────────────────────────────────────────
  const handleDeptPress = (deptItem) => {
    if (selectedDept?.sem_dept === deptItem.sem_dept) {
      setSelectedDept(null);
      setActData(null);
      return;
    }
    setSelectedDept(deptItem);
    fetchActivities(deptItem);
  };

  const kpiCfg = selectedKpi ? KPI_CONFIG.find(k => k.key === selectedKpi) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <LinearGradient
        colors={isDark ? ['#0f172a', '#1e1b4b'] : ['#EFF6FF', '#DBEAFE']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTag, { color: '#3B82F6' }]}>PG LOGBOOK</Text>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Logbook Analytics</Text>
          </View>
          {/* Batch picker */}
          <TouchableOpacity
            style={[styles.batchPill, { backgroundColor: isDark ? 'rgba(59,130,246,0.18)' : '#DBEAFE', borderColor: '#3B82F6' }]}
            onPress={() => setShowBatchPicker(v => !v)}
          >
            <Text style={[styles.batchPillText, { color: '#3B82F6' }]}>Batch {batch}</Text>
            <Feather name={showBatchPicker ? 'chevron-up' : 'chevron-down'} size={14} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        {showBatchPicker && (
          <View style={[styles.batchDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {BATCH_OPTIONS.map(b => (
              <TouchableOpacity
                key={b}
                style={[styles.batchOption, { borderBottomColor: colors.border }, batch === b && { backgroundColor: '#3B82F618' }]}
                onPress={() => { setBatch(b); setShowBatchPicker(false); }}
              >
                <Text style={[styles.batchOptionText, { color: batch === b ? '#3B82F6' : colors.textPrimary }]}>
                  {batch === b ? '✓  ' : '    '}Batch {b}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Segmented Control Tabs ──────────────────────────────────────── */}
        <View style={[styles.tabBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'kpis' && [styles.tabBtnActive, { backgroundColor: colors.card }]]}
            onPress={() => setActiveTab('kpis')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="chart-box-outline" size={16} color={activeTab === 'kpis' ? '#3B82F6' : colors.textMuted} />
            <Text style={[styles.tabBtnText, { color: activeTab === 'kpis' ? colors.textPrimary : colors.textMuted }]}>
              Cumulative Totals
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'monthly' && [styles.tabBtnActive, { backgroundColor: colors.card }]]}
            onPress={() => setActiveTab('monthly')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="calendar-month-outline" size={16} color={activeTab === 'monthly' ? '#3B82F6' : colors.textMuted} />
            <Text style={[styles.tabBtnText, { color: activeTab === 'monthly' ? colors.textPrimary : colors.textMuted }]}>
              Monthly Student Audit
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'kpis' ? (
          <>
            {/* ── Level 1: KPI Tiles ─────────────────────────────────────────── */}
            <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Overall Summary — {batch}</Text>
            <Text style={[styles.sectionSub, { color: colors.textMuted }]}>Tap any KPI to see department breakdown</Text>

            {kpiLoading ? (
              <View style={styles.kpiGrid}>
                {KPI_CONFIG.map(c => (
                  <SkeletonBlock key={c.key} width={(width - 48) / 2 - 6} height={100} borderRadius={16} style={{ marginBottom: 12 }} />
                ))}
              </View>
            ) : kpiData ? (
              <View style={styles.kpiGrid}>
                {KPI_CONFIG.map(cfg => (
                  <KpiTile
                    key={cfg.key}
                    item={{ ...cfg, value: kpiData[cfg.key] }}
                    isSelected={selectedKpi === cfg.key}
                    onPress={() => handleKpiPress(cfg.key)}
                    colors={colors}
                    isDark={isDark}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="database-off" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No KPI data available</Text>
              </View>
            )}

            {/* ── Level 2: Department Breakdown ──────────────────────────────── */}
            {selectedKpi && (
              <>
                <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />
                <View style={styles.sectionLabelRow}>
                  <View style={[styles.kpiDot, { backgroundColor: kpiCfg?.color }]} />
                  <Text style={[styles.sectionLabel, { color: colors.textPrimary, marginBottom: 0 }]}>
                    {kpiCfg?.label} by Department
                  </Text>
                </View>
                <Text style={[styles.sectionSub, { color: colors.textMuted }]}>Tap a department to see activity details</Text>

                {deptLoading ? (
                  <View style={{ gap: 10, marginTop: 8 }}>
                    {[1, 2, 3, 4].map(i => <SkeletonBlock key={i} width="100%" height={64} borderRadius={14} />)}
                  </View>
                ) : deptData && deptData.length > 0 ? (
                  <View style={{ gap: 8, marginTop: 4 }}>
                    {deptData.map(dept => (
                      <React.Fragment key={dept.sem_dept}>
                        <DeptRow
                          item={dept}
                          selectedKey={selectedKpi}
                          onPress={() => handleDeptPress(dept)}
                          colors={colors}
                          isDark={isDark}
                        />

                        {/* ── Level 3: Activity Details ──────────────────── */}
                        {selectedDept?.sem_dept === dept.sem_dept && (
                          <View style={[styles.actContainer, { borderColor: kpiCfg?.color + '40', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                              <Text style={[styles.actContainerTitle, { color: kpiCfg?.color, flex: 1, marginBottom: 0 }]}>
                                {titleCase(dept.sem_dept)} — {selectedKpi} Activities
                              </Text>
                            </View>

                            {actLoading ? (
                              <View style={{ gap: 8, padding: 12 }}>
                                {[1, 2, 3].map(i => <SkeletonBlock key={i} width="100%" height={90} borderRadius={12} />)}
                              </View>
                            ) : (() => {
                              const kpiFilterMap = {
                                Mandatory: ['BCBR', 'BCLSACLS'],
                                DRP: ['DRP'],
                                ClinicalList: ['ProcedureSkill', 'ANAESTHESIAREGIONAL', 'ANAESTHESIAGEN', 'LabActivity'],
                                Additional: ['ConfrenceCMEWorkshop', 'PAPERPRESENTED', 'GUESTSLECTURE', 'INTER_INTRASDEPARTMENTALROTATION'],
                              };

                              let filtered = [];
                              if (actData && Array.isArray(actData)) {
                                if (selectedKpi && kpiFilterMap[selectedKpi]) {
                                  const allowed = kpiFilterMap[selectedKpi];
                                  filtered = actData.filter(a => allowed.includes(a.EventType));
                                } else if (selectedKpi === 'Academic') {
                                  const excluded = ['BCBR', 'BCLSACLS', 'DRP', 'ProcedureSkill', 'ConfrenceCMEWorkshop', 'PAPERPRESENTED', 'GUESTSLECTURE'];
                                  filtered = actData.filter(a => !excluded.includes(a.EventType));
                                } else {
                                  filtered = actData;
                                }
                              }

                              if (filtered.length > 0) {
                                return (
                                  <View style={{ gap: 8, padding: 12 }}>
                                    {filtered.map((act, idx) => (
                                      <ActivityRow key={act.EventType + idx} item={act} colors={colors} idx={idx} />
                                    ))}
                                  </View>
                                );
                              }

                              return (
                                <View style={styles.emptyBox}>
                                  <MaterialCommunityIcons name="clipboard-text-off" size={32} color={colors.textMuted} />
                                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                    No {selectedKpi} activities found for {titleCase(dept.sem_dept)}
                                  </Text>
                                </View>
                              );
                            })()}
                          </View>
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyBox}>
                    <MaterialCommunityIcons name="hospital-off" size={36} color={colors.textMuted} />
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No department data found</Text>
                  </View>
                )}
              </>
            )}
          </>
        ) : (
          /* ── Monthly Student Audit Tab ───────────────────────────────────── */
          <View style={{ gap: 16 }}>
            <Text style={[styles.sectionLabel, { color: colors.textPrimary, marginBottom: 0 }]}>
              Monthly Student Performance Audit
            </Text>
            <Text style={[styles.sectionSub, { color: colors.textMuted, marginBottom: 4 }]}>
              Select a month and department to inspect student logbook completion
            </Text>

            {/* Month Horizontal Selector */}
            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>
                Select Month (2026)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {MONTHS.map(m => (
                  <TouchableOpacity
                    key={m.val}
                    style={[
                      styles.monthPill,
                      {
                        backgroundColor: selectedMonth === m.val ? '#3B82F6' : (isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'),
                        borderColor: selectedMonth === m.val ? '#3B82F6' : colors.border,
                      }
                    ]}
                    onPress={() => setSelectedMonth(m.val)}
                  >
                    <Text style={[styles.monthPillText, { color: selectedMonth === m.val ? '#FFF' : colors.textPrimary }]}>
                      {m.short}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Department Horizontal Selector */}
            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>
                Select Department
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {DEPT_LIST.map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.monthPill,
                      {
                        backgroundColor: monthlyDept === d ? '#8B5CF6' : (isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'),
                        borderColor: monthlyDept === d ? '#8B5CF6' : colors.border,
                      }
                    ]}
                    onPress={() => setMonthlyDept(d)}
                  >
                    <Text style={[styles.monthPillText, { color: monthlyDept === d ? '#FFF' : colors.textPrimary }]}>
                      {titleCase(d)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Monthly Data Results */}
            {monthlyLoading ? (
              <View style={{ gap: 10, marginTop: 8 }}>
                {[1, 2, 3].map(i => <SkeletonBlock key={i} width="100%" height={90} borderRadius={14} />)}
              </View>
            ) : monthlyData && monthlyData.length > 0 ? (
              <View style={{ gap: 10, marginTop: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>
                  Showing {monthlyData.length} student records for {MONTHS[selectedMonth].name} ({titleCase(monthlyDept)})
                </Text>
                {monthlyData.map((item, idx) => {
                  const isExpanded = selectedStudentRoll === item.rollno;
                  const details = studentDetailsMap[item.rollno];
                  return (
                    <TouchableOpacity
                      key={item.rollno + idx}
                      activeOpacity={0.85}
                      onPress={() => handleStudentPress(item)}
                      style={[
                        styles.actRow,
                        {
                          backgroundColor: colors.card,
                          borderColor: isExpanded ? '#3B82F6' : colors.border,
                          borderWidth: isExpanded ? 2 : 1,
                        }
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.actName, { color: colors.textPrimary, fontSize: 14, fontWeight: '800' }]}>
                              {item.Pg_stud_name}
                            </Text>
                            <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={isExpanded ? '#3B82F6' : colors.textMuted} />
                          </View>
                          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                            Roll: {item.rollno} · {item.sem_dept}
                          </Text>
                        </View>
                        <View style={{ backgroundColor: '#6366F118', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                          <Text style={{ color: '#6366F1', fontWeight: '800', fontSize: 13 }}>
                            Target: {item.totalcout}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.actStatRow, { borderTopColor: colors.border, marginTop: 10, paddingTop: 10 }]}>
                        <View style={styles.actStat}>
                          <Text style={[styles.actStatLabel, { color: colors.textMuted }]}>Fac Pending</Text>
                          <Text style={[styles.actStatVal, { color: item.unver > 0 ? '#F59E0B' : colors.textSecondary }]}>{item.unver}</Text>
                        </View>
                        <View style={[styles.actStatDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.actStat}>
                          <Text style={[styles.actStatLabel, { color: colors.textMuted }]}>Fac Verified</Text>
                          <Text style={[styles.actStatVal, { color: item.ver > 0 ? '#10B981' : colors.textSecondary }]}>{item.ver}</Text>
                        </View>
                        <View style={[styles.actStatDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.actStat}>
                          <Text style={[styles.actStatLabel, { color: colors.textMuted }]}>HOD Pending</Text>
                          <Text style={[styles.actStatVal, { color: item.Hunver > 0 ? '#EF4444' : colors.textSecondary }]}>{item.Hunver}</Text>
                        </View>
                        <View style={[styles.actStatDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.actStat}>
                          <Text style={[styles.actStatLabel, { color: colors.textMuted }]}>HOD Verified</Text>
                          <Text style={[styles.actStatVal, { color: item.Hver > 0 ? '#8B5CF6' : colors.textSecondary }]}>{item.Hver}</Text>
                        </View>
                      </View>

                      {/* ── Expanded Student Detail Breakdown ───────────── */}
                      {isExpanded && (
                        <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#3B82F6', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Activity Details — {item.Pg_stud_name}
                          </Text>

                          {studentDetailsLoading && !details ? (
                            <View style={{ gap: 8 }}>
                              {[1, 2].map(i => <SkeletonBlock key={i} width="100%" height={60} borderRadius={10} />)}
                            </View>
                          ) : details && details.length > 0 ? (
                            <View style={{ gap: 8 }}>
                              {details.map((det, dIdx) => (
                                <View
                                  key={det.pgtype + (det.monthN || '') + dIdx}
                                  style={{
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                                    borderRadius: 12,
                                    padding: 12,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                  }}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>
                                        {det.ActivityName || det.pgtype}
                                      </Text>
                                      {det.monthN && (
                                        <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>
                                          Period: {det.monthN} {det.yr}
                                        </Text>
                                      )}
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                      {(det.Present > 0 || det.Attended > 0) && (
                                        <View style={{ backgroundColor: '#3B82F618', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 }}>
                                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#3B82F6' }}>
                                            Attended: {det.Attended}/{det.Present}
                                          </Text>
                                        </View>
                                      )}
                                      <View style={{ backgroundColor: '#10B98118', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#10B981' }}>
                                          {det.total} entries
                                        </Text>
                                      </View>
                                    </View>
                                  </View>

                                  <View style={[styles.actStatRow, { borderTopColor: colors.border, paddingTop: 8, marginTop: 4 }]}>
                                    <View style={styles.actStat}>
                                      <Text style={[styles.actStatLabel, { color: colors.textMuted }]}>Fac Pend</Text>
                                      <Text style={[styles.actStatVal, { fontSize: 13, color: det.unver > 0 ? '#F59E0B' : colors.textSecondary }]}>{det.unver}</Text>
                                    </View>
                                    <View style={[styles.actStatDivider, { backgroundColor: colors.border }]} />
                                    <View style={styles.actStat}>
                                      <Text style={[styles.actStatLabel, { color: colors.textMuted }]}>Fac Ver</Text>
                                      <Text style={[styles.actStatVal, { fontSize: 13, color: det.ver > 0 ? '#10B981' : colors.textSecondary }]}>{det.ver}</Text>
                                    </View>
                                    <View style={[styles.actStatDivider, { backgroundColor: colors.border }]} />
                                    <View style={styles.actStat}>
                                      <Text style={[styles.actStatLabel, { color: colors.textMuted }]}>HOD Pend</Text>
                                      <Text style={[styles.actStatVal, { fontSize: 13, color: det.Hunver > 0 ? '#EF4444' : colors.textSecondary }]}>{det.Hunver}</Text>
                                    </View>
                                    <View style={[styles.actStatDivider, { backgroundColor: colors.border }]} />
                                    <View style={styles.actStat}>
                                      <Text style={[styles.actStatLabel, { color: colors.textMuted }]}>HOD Ver</Text>
                                      <Text style={[styles.actStatVal, { fontSize: 13, color: det.Hver > 0 ? '#8B5CF6' : colors.textSecondary }]}>{det.Hver}</Text>
                                    </View>
                                  </View>
                                </View>
                              ))}
                            </View>
                          ) : (
                            <Text style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic' }}>
                              No detailed activity records found for this student.
                            </Text>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="account-search-outline" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No monthly logbook records found for {MONTHS[selectedMonth].name} in {titleCase(monthlyDept)}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:     { flex: 1 },
  header:        { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:       { padding: 8, borderRadius: 10 },
  headerTag:     { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 2 },
  headerTitle:   { fontSize: 22, fontWeight: '800' },

  batchPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  batchPillText: { fontSize: 13, fontWeight: '700' },
  batchDropdown: {
    marginTop: 10, borderRadius: 14, borderWidth: 1,
    overflow: 'hidden',
  },
  batchOption:   { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  batchOptionText: { fontSize: 14, fontWeight: '600' },

  scrollContent: { padding: 16 },
  sectionLabel:  { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  sectionSub:    { fontSize: 12, marginBottom: 14 },
  sectionDivider: { height: 1, marginVertical: 18 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  kpiDot:        { width: 10, height: 10, borderRadius: 5 },

  kpiGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiTile: {
    width: (width - 48) / 2 - 5,
    borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 6,
  },
  kpiIconBg:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  kpiValue:      { fontSize: 26, fontWeight: '900' },
  kpiLabel:      { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  deptRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, padding: 12, borderWidth: 1,
  },
  deptIconBg:    { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  deptName:      { fontSize: 13, fontWeight: '700', flexShrink: 1 },
  deptBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  deptBadgeText: { fontSize: 13, fontWeight: '800' },

  actContainer: {
    borderWidth: 1.5, borderRadius: 16,
    marginTop: 2, marginLeft: 8, overflow: 'hidden',
  },
  actContainerTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, padding: 12, paddingBottom: 4 },

  actRow: {
    borderRadius: 12, padding: 12, borderWidth: 1,
    overflow: 'hidden',
  },
  actIndexBg:   { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  actIndex:     { fontSize: 11, fontWeight: '800' },
  actName:      { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  actEventType: { fontSize: 10, fontWeight: '500' },
  totalBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  totalBadgeText: { fontSize: 11, fontWeight: '800' },

  actStatRow: {
    flexDirection: 'row', marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, alignItems: 'center',
  },
  actStat:      { flex: 1, alignItems: 'center' },
  actStatLabel: { fontSize: 9, fontWeight: '600', marginBottom: 3, textAlign: 'center' },
  actStatVal:   { fontSize: 15, fontWeight: '800' },
  actStatDivider: { width: 1, height: 28 },

  emptyBox:   { alignItems: 'center', paddingVertical: 30, gap: 8 },
  emptyText:  { fontSize: 13, fontWeight: '500' },

  tabBar: {
    flexDirection: 'row',
    marginTop: 14,
    borderRadius: 12,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  monthPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  monthPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default PGLogbookInsightsScreen;
