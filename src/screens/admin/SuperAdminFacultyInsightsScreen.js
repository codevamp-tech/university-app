import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import {
  getSuperAdminAnalytics,
  getSuperAdminDrilldown,
  getFacultyAttendance,
  getFoundationFacultyList,
} from '../../data/apiService';
import { LinearGradient } from 'expo-linear-gradient';
import { SkeletonBlock } from '../../components/SkeletonLoader';

const SuperAdminFacultyInsightsScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();
  const [data, setData] = useState(null);
  const [dbTeachers, setDbTeachers] = useState([]);
  const [srmsFaculties, setSrmsFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myPunches, setMyPunches] = useState([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'REGISTERED' | 'ALL_STAFF'

  // Department Searchable Modal state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptSearchQuery, setDeptSearchQuery] = useState('');

  const loadData = async () => {
    try {
      if (accessToken) {
        const [stats, teacherList, punches, srmsList] = await Promise.all([
          getSuperAdminAnalytics(accessToken),
          getSuperAdminDrilldown(accessToken, 'teachers'),
          getFacultyAttendance(accessToken),
          getFoundationFacultyList('0'),
        ]);
        if (stats) setData(stats);
        if (Array.isArray(teacherList)) setDbTeachers(teacherList);
        if (Array.isArray(punches)) setMyPunches(punches);
        if (Array.isArray(srmsList)) setSrmsFaculties(srmsList);
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

  // Keywords identifying Medical, Clinical, Paramedical & Hospital departments
  const MEDICAL_KEYWORDS = [
    'ANAESTHESIA', 'ANATOMY', 'BIOCHEMISTRY', 'COMMUNITY MEDICINE', 'DENTAL', 'DERMATOLOGY',
    'E.N.T.', 'EMERGENCY', 'FORENSIC', 'GENERAL MEDICINE', 'GENERAL SURGERY', 'IMMUNOHEMATOLOGY',
    'MICROBIOLOGY', 'NEPHROLOGY', 'NEURO', 'NUCLEAR MEDICINE', 'OBSTETRICS', 'OPHTHALMOLOGY',
    'ORTHOPEDICS', 'PAEDIATRICS', 'PAEDIA', 'PATHOLOGY', 'PHARMOCOLOGY', 'PHYSIOLOGY', 'PSYCHIATRY',
    'RADIATION ONCOLOGY', 'RADIO-DIAGNOSIS', 'RESPIRATORY MEDICINE', 'SKILL LAB', 'CARDIOLOGY', 'CARDIAC',
    'MEDICAL COLLEGE', 'DOCTOR', 'ICU', 'I.C.U.', 'IPD', 'I.P.D.', 'IVF', 'I.V.F', 'OT', 'O.T.',
    'OPD', 'O.P.D', 'M.S. OFFICE', 'BLOOD BANK', 'SURGICAL', 'M.R.I', 'NURSING', 'PARA MEDICAL'
  ];

  const isMedicalDept = (deptName) => {
    if (!deptName) return false;
    const d = deptName.toUpperCase().trim();
    return MEDICAL_KEYWORDS.some(kw => d.includes(kw));
  };

  // Combine SRMS ERP faculties with database registered teachers
  const mergedFaculties = useMemo(() => {
    const dbMap = {};
    dbTeachers.forEach(t => {
      const key = String(t.emp_id || t.user_id || t.username || '').toUpperCase().trim();
      if (key) dbMap[key] = t;
    });

    // Filter for Medical Departments by default
    const filteredSrms = activeTab === 'ALL_STAFF' 
      ? srmsFaculties 
      : srmsFaculties.filter(f => isMedicalDept(f.Department));

    const mapped = filteredSrms.map((f, idx) => {
      const empId = String(f.EmpID || '').trim();
      const key = empId.toUpperCase();
      const dbRecord = dbMap[key];

      return {
        id: dbRecord?.id || `srms_${empId}_${idx}`,
        emp_id: empId,
        name: (f.EmpName || dbRecord?.name || empId).trim(),
        department: (f.Department || dbRecord?.department || 'Medical Faculty').trim(),
        status: f.EmpCurStsCd || 'PERMANENT',
        email: dbRecord?.email || null,
        last_login: dbRecord?.last_login || null,
        is_registered: !!dbRecord,
        dbRecord: dbRecord || null,
      };
    });

    // Also include any DB teachers not present in SRMS payload
    const srmsKeys = new Set(mapped.map(m => m.emp_id.toUpperCase()));
    dbTeachers.forEach(t => {
      const key = String(t.emp_id || t.user_id || t.username || '').toUpperCase().trim();
      if (key && !srmsKeys.has(key)) {
        mapped.push({
          id: t.id,
          emp_id: t.emp_id || t.username || key,
          name: (t.name || t.username || key).trim(),
          department: (t.department || 'Faculty').trim(),
          status: 'REGISTERED',
          email: t.email || null,
          last_login: t.last_login || null,
          is_registered: true,
          dbRecord: t,
        });
      }
    });

    return mapped;
  }, [srmsFaculties, dbTeachers, activeTab]);

  // Unique departments for filter list (clean academic & clinical departments only)
  const departments = useMemo(() => {
    const set = new Set();
    const IGNORE_TAGS = ['OPD I', 'OPD II', 'OPD III', 'O.P.D-14', 'O.P.D-15', 'O.P.D.-12', 'DOCTOR', 'DOCTORS OTHERS', 'M.S. Office', 'RAIN BASERA', 'GUEST HOUSE/RAIN BASERA'];
    mergedFaculties.forEach(f => {
      if (f.department) {
        const d = f.department.trim();
        if (d && !IGNORE_TAGS.includes(d)) {
          set.add(d);
        }
      }
    });
    return ['ALL', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [mergedFaculties]);

  // Filtered faculty list based on tab, department, and search text
  const filteredFaculties = useMemo(() => {
    return mergedFaculties.filter(f => {
      if (activeTab === 'REGISTERED' && !f.is_registered) return false;
      if (selectedDept !== 'ALL' && f.department.toUpperCase() !== selectedDept.toUpperCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = f.name.toLowerCase().includes(q);
        const matchesId = f.emp_id.toLowerCase().includes(q);
        const matchesDept = f.department.toLowerCase().includes(q);
        return matchesName || matchesId || matchesDept;
      }
      return true;
    });
  }, [mergedFaculties, activeTab, selectedDept, searchQuery]);

  const registeredCount = useMemo(() => {
    return mergedFaculties.filter(f => f.is_registered).length;
  }, [mergedFaculties]);

  const formatLastLogin = (iso) => {
    if (!iso) return 'Not registered on app';
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

  const renderSkeleton = () => (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Skeleton */}
        <View style={[styles.header, { backgroundColor: colors.card, height: 95, justifyContent: 'center' }]}>
          <SkeletonBlock width={140} height={12} borderRadius={6} style={{ marginBottom: 8 }} />
          <SkeletonBlock width={220} height={18} borderRadius={9} />
        </View>

        {/* KPI Skeleton Cards */}
        <SkeletonBlock width={120} height={14} borderRadius={7} style={{ marginTop: 16, marginBottom: 12 }} />
        <View style={styles.grid}>
          <View style={[styles.gridCard, { backgroundColor: colors.card, gap: 8 }]}>
            <SkeletonBlock width={36} height={36} borderRadius={10} />
            <SkeletonBlock width={50} height={20} borderRadius={10} />
            <SkeletonBlock width={70} height={10} borderRadius={5} />
          </View>
          <View style={[styles.gridCard, { backgroundColor: colors.card, gap: 8 }]}>
            <SkeletonBlock width={36} height={36} borderRadius={10} />
            <SkeletonBlock width={50} height={20} borderRadius={10} />
            <SkeletonBlock width={70} height={10} borderRadius={5} />
          </View>
          <View style={[styles.gridCard, { backgroundColor: colors.card, gap: 8 }]}>
            <SkeletonBlock width={36} height={36} borderRadius={10} />
            <SkeletonBlock width={50} height={20} borderRadius={10} />
            <SkeletonBlock width={70} height={10} borderRadius={5} />
          </View>
        </View>

        {/* Search Bar Skeleton */}
        <SkeletonBlock width="100%" height={44} borderRadius={12} style={{ marginBottom: 16 }} />

        {/* Faculty List Skeletons */}
        <SkeletonBlock width={140} height={14} borderRadius={7} style={{ marginBottom: 12 }} />
        {[1, 2, 3, 4, 5].map((item) => (
          <View key={item} style={[styles.teacherCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SkeletonBlock width={44} height={44} borderRadius={22} />
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBlock width={140} height={14} borderRadius={7} />
              <SkeletonBlock width={180} height={11} borderRadius={5.5} />
              <SkeletonBlock width={90} height={10} borderRadius={5} />
            </View>
            <View style={{ gap: 6, alignItems: 'flex-end' }}>
              <SkeletonBlock width={45} height={16} borderRadius={8} />
              <SkeletonBlock width={35} height={10} borderRadius={5} />
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );

  if (loading) {
    return renderSkeleton();
  }

  // Common quick-access department list
  const quickDepts = ['ALL', 'PHYSIOLOGY', 'ANATOMY', 'BIOCHEMISTRY', 'COMMUNITY MEDICINE', 'GENERAL MEDICINE'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        keyboardShouldPersistTaps="handled"
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
              <Text style={[styles.title, { color: colors.textPrimary }]}>College Faculty Directory</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Live SRMS ERP Faculty Records & App Insights</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Faculty KPI Grid */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Faculty Overview</Text>
        <View style={styles.grid}>
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: colors.card }]}
            onPress={() => { setActiveTab('ALL'); setSelectedDept('ALL'); }}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Feather name="users" size={24} color="#10B981" />
            </View>
            <Text style={[styles.cardVal, { color: colors.textPrimary }]}>{mergedFaculties.length}</Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Medical Faculty</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: colors.card }]}
            onPress={() => { setActiveTab('REGISTERED'); setSelectedDept('ALL'); }}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Feather name="user-check" size={24} color="#6366F1" />
            </View>
            <Text style={[styles.cardVal, { color: colors.textPrimary }]}>{registeredCount}</Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>App Registered Users</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: colors.card }]}
            onPress={() => setShowDeptModal(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <Feather name="briefcase" size={24} color="#F59E0B" />
            </View>
            <Text style={[styles.cardVal, { color: colors.textPrimary }]}>{departments.length - 1}</Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Departments (Select)</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search by faculty name, Emp ID, or department..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Tabs & Department Selector */}
        <View style={{ marginBottom: 16 }}>
          {/* Main Filter Pills (Medical Only vs App Registered vs All Staff) */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <TouchableOpacity
              style={[
                styles.tabPill,
                { backgroundColor: activeTab === 'ALL' ? '#10B981' : colors.card, borderColor: activeTab === 'ALL' ? '#10B981' : colors.border }
              ]}
              onPress={() => setActiveTab('ALL')}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: activeTab === 'ALL' ? '#FFFFFF' : colors.textPrimary }}>
                Medical Faculty ({activeTab === 'ALL' ? mergedFaculties.length : ''})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabPill,
                { backgroundColor: activeTab === 'REGISTERED' ? '#6366F1' : colors.card, borderColor: activeTab === 'REGISTERED' ? '#6366F1' : colors.border }
              ]}
              onPress={() => setActiveTab('REGISTERED')}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: activeTab === 'REGISTERED' ? '#FFFFFF' : colors.textPrimary }}>
                App Registered ({registeredCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabPill,
                { backgroundColor: activeTab === 'ALL_STAFF' ? '#F59E0B' : colors.card, borderColor: activeTab === 'ALL_STAFF' ? '#F59E0B' : colors.border }
              ]}
              onPress={() => setActiveTab('ALL_STAFF')}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: activeTab === 'ALL_STAFF' ? '#FFFFFF' : colors.textPrimary }}>
                All Staff
              </Text>
            </TouchableOpacity>
          </View>

          {/* Department Search & Dropdown Bar */}
          <TouchableOpacity
            style={[
              styles.deptDropdownBtn,
              {
                backgroundColor: colors.card,
                borderColor: selectedDept !== 'ALL' ? '#10B981' : colors.border,
              }
            ]}
            onPress={() => setShowDeptModal(true)}
            activeOpacity={0.8}
          >
            <Feather name="filter" size={15} color={selectedDept !== 'ALL' ? '#10B981' : colors.textMuted} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: selectedDept !== 'ALL' ? '#10B981' : colors.textPrimary, flex: 1, marginLeft: 8 }} numberOfLines={1}>
              {selectedDept === 'ALL' ? 'Filter by Department (46 Medical)' : `Department: ${selectedDept}`}
            </Text>
            {selectedDept !== 'ALL' ? (
              <TouchableOpacity onPress={(e) => { e.stopPropagation(); setSelectedDept('ALL'); }} style={{ padding: 4 }}>
                <Feather name="x" size={16} color="#10B981" />
              </TouchableOpacity>
            ) : (
              <View style={styles.searchBadge}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginRight: 4 }}>Search & Select</Text>
                <Feather name="chevron-down" size={14} color={colors.textMuted} />
              </View>
            )}
          </TouchableOpacity>

          {/* Quick-Access Top Department Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 10 }}>
            {quickDepts.map(dept => {
              const isSelected = selectedDept.toUpperCase() === dept.toUpperCase();
              return (
                <TouchableOpacity
                  key={dept}
                  style={[
                    styles.deptChip,
                    {
                      backgroundColor: isSelected ? (isDark ? 'rgba(16, 185, 129, 0.25)' : '#E8F5E9') : colors.card,
                      borderColor: isSelected ? '#10B981' : colors.border,
                    }
                  ]}
                  onPress={() => setSelectedDept(dept)}
                >
                  <Text style={{ fontSize: 11, fontWeight: isSelected ? '800' : '600', color: isSelected ? '#10B981' : colors.textSecondary }}>
                    {dept === 'ALL' ? 'All Depts' : dept}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.deptChip, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#F0FDF4', borderColor: '#10B981' }]}
              onPress={() => setShowDeptModal(true)}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981' }}>
                + More ({departments.length - 1}) ▾
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Teacher Directory */}
        <View style={styles.directoryHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
            Faculty List ({filteredFaculties.length})
          </Text>
          {selectedDept !== 'ALL' || searchQuery || activeTab !== 'ALL' ? (
            <TouchableOpacity onPress={() => { setSelectedDept('ALL'); setSearchQuery(''); setActiveTab('ALL'); }}>
              <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '700' }}>Reset Filters</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {filteredFaculties.length === 0 ? (
          <View style={[styles.card, { backgroundColor: colors.card, alignItems: 'center', paddingVertical: 32 }]}>
            <Feather name="user-x" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 12 }]}>
              No matching faculty records found for your search criteria.
            </Text>
          </View>
        ) : (
          filteredFaculties.slice(0, 100).map((t, idx) => {
            const deptColors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];
            const avatarBg = deptColors[idx % deptColors.length] + '22';
            const avatarColor = deptColors[idx % deptColors.length];
            const initials = t.name
              ? t.name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
              : (t.emp_id || '??').slice(0, 2).toUpperCase();
            const isActiveToday = t.last_login && (new Date() - new Date(t.last_login)) < 86400000;

            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.teacherCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('AdminFacultyDetail', { teacher: t })}
                activeOpacity={0.7}
              >
                <View style={[styles.teacherAvatar, { backgroundColor: avatarBg }]}>
                  <Text style={[styles.teacherInitials, { color: avatarColor }]}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.teacherName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {t.name}
                  </Text>
                  <Text style={[styles.teacherDept, { color: colors.textSecondary }]} numberOfLines={1}>
                    {t.department}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textMuted }}>ID: {t.emp_id}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: t.status === 'PERMANENT' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)' }]}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: t.status === 'PERMANENT' ? '#10B981' : '#F59E0B' }}>
                        {t.status}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  {isActiveToday ? (
                    <View style={[styles.activeDot, { backgroundColor: '#D1FAE5' }]}>
                      <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                      <Text style={{ fontSize: 9, color: '#10B981', fontWeight: '700' }}>ONLINE</Text>
                    </View>
                  ) : t.is_registered ? (
                    <View style={[styles.activeDot, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                      <Text style={{ fontSize: 9, color: '#6366F1', fontWeight: '700' }}>APP USER</Text>
                    </View>
                  ) : (
                    <View style={[styles.activeDot, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
                      <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: '600' }}>SRMS</Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>{formatLastLogin(t.last_login)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {filteredFaculties.length > 100 ? (
          <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: 12, marginVertical: 12 }}>
            Showing first 100 of {filteredFaculties.length} faculties. Use search to narrow down.
          </Text>
        ) : null}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Searchable Department Selector Modal Sheet */}
      <Modal
        visible={showDeptModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDeptModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
          <View style={[
            styles.modalSheet,
            { backgroundColor: colors.card, borderColor: colors.border, maxHeight: '82%' }
          ]}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>
                  Filter by Department
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  {departments.length - 1} Medical Departments
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDeptModal(false)}
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)' }]}
              >
                <Feather name="x" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Department Search Input */}
            <View style={[styles.searchBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6', borderColor: colors.border, marginBottom: 14 }]}>
              <Feather name="search" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search department (e.g. Physiology, Surgery)..."
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.textPrimary }]}
                value={deptSearchQuery}
                onChangeText={setDeptSearchQuery}
                autoCapitalize="none"
              />
              {deptSearchQuery ? (
                <TouchableOpacity onPress={() => setDeptSearchQuery('')}>
                  <Feather name="x" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Department List */}
            <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {departments
                .filter(d => d === 'ALL' || d.toLowerCase().includes(deptSearchQuery.toLowerCase().trim()))
                .map(dept => {
                  const isSelected = selectedDept.toUpperCase() === dept.toUpperCase();
                  const count = dept === 'ALL'
                    ? mergedFaculties.length
                    : mergedFaculties.filter(f => f.department.toUpperCase() === dept.toUpperCase()).length;

                  return (
                    <TouchableOpacity
                      key={dept}
                      style={[
                        styles.deptListItem,
                        {
                          backgroundColor: isSelected ? (isDark ? 'rgba(16,185,129,0.15)' : '#E8F5E9') : 'transparent',
                          borderBottomColor: colors.border,
                        }
                      ]}
                      onPress={() => {
                        setSelectedDept(dept);
                        setShowDeptModal(false);
                        setDeptSearchQuery('');
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: isSelected ? '800' : '600', color: isSelected ? '#10B981' : colors.textPrimary, flex: 1 }}>
                        {dept === 'ALL' ? 'All Departments' : dept}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: isSelected ? '#10B981' : (isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6') }]}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? '#FFFFFF' : colors.textMuted }}>
                          {count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  grid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  gridCard: {
    flex: 1, borderRadius: 16, padding: 14,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3,
  },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardVal: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  cardLabel: { fontSize: 10, lineHeight: 13, fontWeight: '600' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 44,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },
  tabPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  deptDropdownBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, height: 46,
  },
  searchBadge: { flexDirection: 'row', alignItems: 'center' },
  deptChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1,
  },
  directoryHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12, marginTop: 4,
  },
  card: {
    borderRadius: 16, padding: 16, marginBottom: 16,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3,
  },
  teacherCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10, gap: 12,
  },
  teacherAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  teacherInitials: { fontSize: 15, fontWeight: '700' },
  teacherName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  teacherDept: { fontSize: 11, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  activeDot: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1,
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 36, width: '100%',
  },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  deptListItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

export default SuperAdminFacultyInsightsScreen;
