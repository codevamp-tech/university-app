import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  TextInput, Dimensions, Animated, Platform, ActivityIndicator, Alert, Modal
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getLogbook, getSubjectList, getStudentSubjectLogbook } from '../../data/apiService';

const { width } = Dimensions.get('window');

// ─── Category Configuration ───────────────────────────────────────────────────
const CATEGORY_MAP = {
  'SelfDirectedLearning': { label: 'Self-Directed Learning', icon: 'menu-book', color: '#3B82F6', iconType: 'material' },
  'PracticalStudentLab': { label: 'Practical Student Lab', icon: 'science', color: '#10B981', iconType: 'material' },
  'CertificationSkills': { label: 'Certification Skills', icon: 'verified-user', color: '#F59E0B', iconType: 'material' },
  'Vertical integration': { label: 'Vertical Integration', icon: 'layers', color: '#8B5CF6', iconType: 'material' },
  'Early clinical exposure': { label: 'Early Clinical Exposure', icon: 'baby-changing-station', color: '#EC4899', iconType: 'materialcommunity' },
  'Visit to clinical department': { label: 'Visit to Clinical Dept', icon: 'domain', color: '#06B6D4', iconType: 'material' },
  'default': { label: 'General Logbook', icon: 'assignment', color: '#6B7280', iconType: 'material' }
};

const CATEGORY_PILLS = [
  { key: 'ALL', label: 'All Categories' },
  { key: 'SelfDirectedLearning', label: 'Self-Directed Learning' },
  { key: 'PracticalStudentLab', label: 'Practical Lab' },
  { key: 'CertificationSkills', label: 'Certification' },
  { key: 'Vertical integration', label: 'Vertical Integration' },
  { key: 'Early clinical exposure', label: 'Early Clinical' },
  { key: 'Visit to clinical department', label: 'Clinical Visits' }
];



// ─── Attempt Badge ─────────────────────────────────────────────────────────────
const AttemptBadge = ({ val }) => {
  let bg = '#F3F4F6';
  let color = '#9CA3AF';
  if (val === 'C') {
    bg = '#D1FAE5';
    color = '#059669';
  } else if (val === 'M') {
    bg = '#FEF3C7';
    color = '#D97706';
  } else if (val === 'F') {
    bg = '#FEE2E2';
    color = '#DC2626';
  } else if (val === 'B') {
    bg = '#FCE7F3';
    color = '#DB2777';
  } else if (val === 'Re') {
    bg = '#F3E8FF';
    color = '#7C3AED';
  } else if (val === 'P') {
    bg = '#D1FAE5';
    color = '#059669';
  } else if (val === 'A') {
    bg = '#E2E8F0';
    color = '#475569';
  } else if (val === 'R') {
    bg = '#FFF7ED';
    color = '#EA580C';
  }
  return (
    <View style={{ paddingHorizontal: 6, height: 28, minWidth: 28, borderRadius: 8, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color }}>{val}</Text>
    </View>
  );
};

// ─── Skeleton Loader ────────────────────────────────────────────────────────────
const SkeletonBlock = ({ width, height, borderRadius, style }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: '#E2E8F0', opacity: pulseAnim }, style]} />
  );
};

const LogBookSkeleton = ({ colors }) => (
  <View style={{ gap: 16, padding: 16 }}>
    <View style={[styles.summaryCardSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]} />
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <SkeletonBlock width={80} height={32} borderRadius={16} />
      <SkeletonBlock width={100} height={32} borderRadius={16} />
      <SkeletonBlock width={100} height={32} borderRadius={16} />
    </View>
    {[1, 2, 3].map((i) => (
      <View key={i} style={[styles.logbookCardSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBlock width="80%" height={16} borderRadius={4} />
            <SkeletonBlock width={80} height={12} borderRadius={4} />
          </View>
          <SkeletonBlock width={60} height={20} borderRadius={10} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <SkeletonBlock width={30} height={30} borderRadius={6} />
          <SkeletonBlock width={30} height={30} borderRadius={6} />
          <SkeletonBlock width={30} height={30} borderRadius={6} />
          <View style={{ flex: 1, gap: 4, marginLeft: 12 }}>
            <SkeletonBlock width="40%" height={10} borderRadius={3} />
            <SkeletonBlock width="70%" height={14} borderRadius={4} />
          </View>
        </View>
      </View>
    ))}
  </View>
);

const ERPLogBookScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user: contextUser, accessToken } = useUser();
  const passedStudent = route?.params?.student;
  const user = passedStudent || contextUser;
  const isFaculty = contextUser && contextUser.role === 'teacher';

  const [logbook, setLogbook] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activePhase, setActivePhase] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [showLegendModal, setShowLegendModal] = useState(false);

  // Subject filter state
  const [subjectList, setSubjectList] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [activeSubject, setActiveSubject] = useState(null); // { subject_Code, subject_name } or null
  const [subjectEntries, setSubjectEntries] = useState([]); // ERP entries for the selected subject
  const [subjectEntriesLoading, setSubjectEntriesLoading] = useState(false);

  const loadLogbook = async (showLoading = true) => {
    if (!accessToken) return;
    if (showLoading) setLoading(true);
    try {
      const studentId = user?.rollno || user?.id || user?.username;
      const resp = await getLogbook(accessToken, studentId);
      let rawList = [];
      if (resp && resp.success && Array.isArray(resp.data)) {
        rawList = resp.data;
      } else if (resp && Array.isArray(resp)) {
        rawList = resp;
      }

      if (rawList.length > 0) {
        const flattened = [];
        rawList.forEach(deptGroup => {
          const deptName = deptGroup.department || 'General';
          const categories = deptGroup.categories || [];
          categories.forEach(catGroup => {
            const catName = catGroup.category || 'default';
            const activities = catGroup.activities || [];
            activities.forEach(act => {
              let dateStr = 'Pending';
              if (act.verified_dt) {
                const match = act.verified_dt.match(/\d+/);
                if (match) {
                  const ms = parseInt(match[0], 10);
                  const dt = new Date(ms);
                  dateStr = dt.toISOString().split('T')[0];
                }
              }

              const isVerified = act.VerifiedBy ? true : false;

              const isStudentVerified = act.received === 1 || act.recieved === 1 || act.student_verified === 1 || false;

              flattened.push({
                activity: act.activityName || 'Clinical Rotation',
                competency: act.compCode || act.code || 'MB1.1',
                verified: isVerified,
                student_verified: isStudentVerified,
                a1: act.A1 || '-',
                a2: act.A2 || '-',
                a3: act.A3 || '-',
                faculty: act.VerifiedBy ? act.VerifiedBy.trim() : 'Faculty Desk',
                date: dateStr,
                category: catName,
                department: deptName,
                comp_code: act.compCode || act.code || '',
                actmstid: act.actmstid ? String(act.actmstid) : '',
                cbmeyear: act.cbmeyear ? String(act.cbmeyear) : '',
                phase: act.phase ? String(act.phase) : '',
                remarks: (act.remarks || act.remark || act.Remarks || act.remarksFac || '').trim()
              });
            });
          });
        });

        if (flattened.length > 0) {
          setLogbook(flattened);
        } else {
          setLogbook([]);
        }
      } else {
        setLogbook([]);
      }
    } catch (err) {
      console.warn('[LogBookScreen] Error loading logbook:', err);
      setLogbook([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogbook();
  }, [accessToken]);

  // When phase changes, fetch subjects for that phase (clear subject selection)
  useEffect(() => {
    setActiveSubject(null);
    setSubjectEntries([]);
    if (activePhase === 'ALL') {
      setSubjectList([]);
      return;
    }
    let cancelled = false;
    const fetchSubjects = async () => {
      setSubjectsLoading(true);
      const list = await getSubjectList(activePhase);
      // Deduplicate by subject_Code (ERP sometimes returns duplicates)
      const seen = new Set();
      const unique = list.filter(s => {
        if (seen.has(s.subject_Code)) return false;
        seen.add(s.subject_Code);
        return true;
      });
      if (!cancelled) setSubjectList(unique);
      setSubjectsLoading(false);
    };
    fetchSubjects();
    return () => { cancelled = true; };
  }, [activePhase]);

  // When a subject is selected, fetch its logbook entries directly from ERP
  useEffect(() => {
    if (!activeSubject) {
      setSubjectEntries([]);
      return;
    }
    let cancelled = false;
    const fetchSubjectEntries = async () => {
      const rollno = user?.rollno || user?.id || user?.username;
      if (!rollno) return;
      setSubjectEntriesLoading(true);
      const lbtype = activeCategory !== 'ALL' ? activeCategory : 'PracticalStudentLab';
      
      // Resolve the student's actual cohort details from profile
      const userBatchYear = parseInt(user?.batch_year || user?.year || '2024', 10);
      const BATCH_YEAR_TO_CD = {
        2025: "66", 2024: "63", 2023: "60", 2022: "61",
        2021: "62", 2020: "64", 2019: "65"
      };
      const finalCbmeyear = String(userBatchYear || '2024');
      const finalBatchcd = BATCH_YEAR_TO_CD[userBatchYear] || '63';

      const raw = await getStudentSubjectLogbook(
        rollno, 
        activePhase, 
        activeSubject.subject_Code, 
        lbtype,
        finalCbmeyear,
        finalBatchcd
      );
      if (!cancelled) {
        // Normalise ERP raw entries to match existing logbook entry shape
        const parseErpDate = (dateStr) => {
          if (!dateStr) return 'Pending';
          const match = String(dateStr).match(/\d+/);
          if (!match) return 'Pending';
          const ms = parseInt(match[0], 10);
          if (ms <= 0) return 'Pending';
          return new Date(ms).toISOString().split('T')[0];
        };
        const normalised = raw.map((act) => ({
          activity: act.ActivityName || act.activityName || 'Clinical Rotation',
          competency: act.comp_code || act.compCode || '',
          verified: !!act.VerifiedBy,
          student_verified: act.received === 1,
          a1: act.A1 || '-',
          a2: act.A2 || '-',
          a3: act.A3 || '-',
          faculty: act.VerifiedBy ? act.VerifiedBy.trim() : 'Faculty Desk',
          date: parseErpDate(act.verified_dt || act.Acdt),
          category: act.lbtype || lbtype,
          department: act.Department || activeSubject.subject_name || '',
          comp_code: act.comp_code || act.compCode || '',
          actmstid: act.actmstid ? String(act.actmstid) : '',
          cbmeyear: act.cbmeyear ? String(act.cbmeyear) : '',
          phase: String(activePhase),
          remarks: (act.remarks || act.Remarks || '').trim(),
        }));
        setSubjectEntries(normalised);
      }
      setSubjectEntriesLoading(false);
    };
    fetchSubjectEntries();
    return () => { cancelled = true; };
  }, [activeSubject, activePhase, activeCategory]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLogbook(false);
  };

  const handleFacultySignOff = (index) => {
    const updated = [...logbook];
    updated[index].verified = true;
    updated[index].faculty = user?.name || 'Dr. Subhra Kumari';
    updated[index].date = new Date().toISOString().split('T')[0];
    setLogbook(updated);
    Alert.alert('Success', 'Faculty verification completed successfully.');
  };

  const handleStudentSignOff = async (index) => {
    const entry = logbook[index];
    try {
      const rollNumber = String(user?.username || '');
      if (!rollNumber) {
        Alert.alert('Error', 'Unable to retrieve student roll number. Please try logging in again.');
        return;
      }
      const batchYear = String(user?.batch_year || user?.year || '');

      const payload = {
        LMS_LogBook_ActivityData: {
          rollno: rollNumber,
          lbtype: entry.category || '',
          comp_code: entry.comp_code || entry.competency || '',
          actmstid: String(entry.actmstid || ''),
          cbmeyear: String(entry.cbmeyear || batchYear),
          received: 1
        }
      };

      const response = await fetch('https://myportal.srms.ac.in/SRMSERP/PGMBBS/updateReceivedstud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify(payload)
      });

      const res = await response.json();
      const isSuccess = res && (
        res.success || 
        res.message === 'Success' || 
        res.Mess === 'Update' || 
        res.message === 'Update'
      );

      if (isSuccess) {
        const updated = [...logbook];
        updated[index].student_verified = true;
        setLogbook(updated);
        Alert.alert('Success', 'Logbook entry verified and locked by student.');
      } else {
        Alert.alert('Error', res?.Mess || res?.message || 'Failed to verify log entry on ERP.');
      }
    } catch (err) {
      console.warn('[LogBookScreen] Error signing off:', err);
      Alert.alert('Error', 'An error occurred while communicating with the ERP.');
    }
  };

  // Use subjectEntries when a subject is selected, otherwise use the full logbook
  const baseList = activeSubject ? subjectEntries : logbook;

  const filteredLogbook = baseList.filter(entry => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (
      (entry.activity && entry.activity.toLowerCase().includes(q)) ||
      (entry.competency && entry.competency.toLowerCase().includes(q)) ||
      (entry.faculty && entry.faculty.toLowerCase().includes(q))
    );

    // Filter by verification status
    let matchesStatus = true;
    if (activeFilter === 'FAC_VERIFIED') {
      matchesStatus = entry.verified;
    } else if (activeFilter === 'FAC_PENDING') {
      matchesStatus = !entry.verified;
    } else if (activeFilter === 'STUD_VERIFIED') {
      matchesStatus = entry.student_verified;
    } else if (activeFilter === 'STUD_PENDING') {
      matchesStatus = !entry.student_verified;
    }

    // Filter by Category (not applied when subject-mode is active, since lbtype was used in the API call)
    let matchesCategory = true;
    if (!activeSubject && activeCategory !== 'ALL') {
      matchesCategory = entry.category === activeCategory;
    }

    // Filter by Phase (not applied when subject-mode is active — phase was the API param)
    let matchesPhase = true;
    if (!activeSubject && activePhase !== 'ALL') {
      matchesPhase = String(entry.phase) === String(activePhase);
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesPhase;
  });

  const verifiedCount = baseList.filter(e => e.verified).length;
  const totalCount = activeSubject ? baseList.length : logbook.length;
  const progressPct = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  const availablePhases = ['ALL', ...new Set(logbook.map(e => e.phase).filter(Boolean).sort((a, b) => a - b))];


  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => {
            if (isFaculty) {
              navigation.navigate('FacultyStudentsDirectory');
            } else {
              navigation.navigate('ERPHome');
            }
          }} style={[styles.backBtn, { backgroundColor: colors.card }]}>
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>UG Log book</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Clinical Rotations & Competencies</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => loadLogbook(true)} style={[styles.syncBtn, { backgroundColor: colors.card }]}>
          <Feather name="refresh-cw" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <LogBookSkeleton colors={colors} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
          }
        >
          {/* Progress Card */}
          <View style={styles.statsContainer}>
            <LinearGradient
              colors={isDark ? ['#0F766E', '#115E59'] : ['#14B8A6', '#0F766E']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.statsCard}
            >
              <View style={styles.statsTop}>
                <View style={styles.statsSummary}>
                  <Text style={styles.statsVal}>{verifiedCount}/{totalCount}</Text>
                  <Text style={styles.statsLabel}>Verified Competencies</Text>
                </View>
                <View style={styles.progressCircleContainer}>
                  <Text style={styles.progressCircleText}>{progressPct}%</Text>
                </View>
              </View>

              <View style={styles.progressBarWrapper}>
                <View style={[styles.progressBarTrack, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <View style={[styles.progressBarFill, { width: `${progressPct}%`, backgroundColor: '#FFF' }]} />
                </View>
                <View style={styles.progressFooter}>
                  <Text style={styles.progressLimitText}>NMC Criteria: 75% for exam eligibility</Text>
                  <Text style={styles.progressTargetText}>Target: {progressPct >= 75 ? 'Achieved ✓' : 'Short'}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Search bar & Filters */}
          <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 12 }}>
            <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
              <TextInput
                placeholder="Search activity, competency or faculty..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: colors.textPrimary }]}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Toggle & Info Bar */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <TouchableOpacity
                onPress={() => setShowFilters(!showFilters)}
                style={[styles.filterToggleBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <Ionicons name="funnel-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.filterToggleText, { color: colors.textPrimary }]}>
                  {showFilters ? 'Hide Filters' : 'Filter & Phase'}
                </Text>
                {((activeFilter !== 'ALL' || activeCategory !== 'ALL' || activePhase !== 'ALL' || !!activeSubject)) && (
                  <View style={[styles.filterCountBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.filterCountText}>
                      {Number(activeFilter !== 'ALL') + Number(activeCategory !== 'ALL') + Number(activePhase !== 'ALL') + Number(!!activeSubject)}
                    </Text>
                  </View>
                )}
                <Ionicons name={showFilters ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textSecondary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowLegendModal(true)}
                style={[styles.legendLinkBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <Ionicons name="information-circle-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.legendLinkText, { color: colors.primary }]}>Attempt Legend</Text>
              </TouchableOpacity>
            </View>

            {/* Active Filter Badges */}
            {!showFilters && (activeFilter !== 'ALL' || activeCategory !== 'ALL' || activePhase !== 'ALL' || !!activeSubject) && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2, marginTop: 4 }}>
                {activeFilter !== 'ALL' && (
                  <TouchableOpacity onPress={() => setActiveFilter('ALL')} style={[styles.activeFilterChip, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <Text style={[styles.activeFilterChipText, { color: colors.textSecondary }]}>
                      Status: {activeFilter === 'FAC_VERIFIED' ? 'Fac Ver' : activeFilter === 'FAC_PENDING' ? 'Fac Pend' : activeFilter === 'STUD_VERIFIED' ? 'Stud Ver' : 'Stud Pend'}
                    </Text>
                    <Ionicons name="close" size={12} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                )}
                {activePhase !== 'ALL' && (
                  <TouchableOpacity onPress={() => setActivePhase('ALL')} style={[styles.activeFilterChip, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <Text style={[styles.activeFilterChipText, { color: colors.textSecondary }]}>Phase {activePhase}</Text>
                    <Ionicons name="close" size={12} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                )}
                {activeSubject && (
                  <TouchableOpacity onPress={() => setActiveSubject(null)} style={[styles.activeFilterChip, { borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                    <Ionicons name="book-outline" size={11} color="#F59E0B" style={{ marginRight: 3 }} />
                    <Text style={[styles.activeFilterChipText, { color: '#F59E0B' }]}>
                      {activeSubject.subject_name}
                    </Text>
                    <Ionicons name="close" size={12} color="#F59E0B" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                )}
                {activeCategory !== 'ALL' && (
                  <TouchableOpacity onPress={() => setActiveCategory('ALL')} style={[styles.activeFilterChip, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <Text style={[styles.activeFilterChipText, { color: colors.textSecondary }]}>
                      Cat: {CATEGORY_MAP[activeCategory]?.label || activeCategory}
                    </Text>
                    <Ionicons name="close" size={12} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}

            {/* Collapsible filters panel */}
            {showFilters && (
              <View style={[styles.collapsibleFilterPanel, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderColor: colors.border, borderRadius: 12, padding: 12, gap: 12, borderWidth: 1, marginTop: 4 }]}>
                {/* Verification Status Filter pills */}
                <View>
                  <Text style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>Verification Status</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2, marginTop: 4 }}>
                    {[
                      ['ALL', 'All Statuses'],
                      ['FAC_VERIFIED', 'Faculty Verified'],
                      ['FAC_PENDING', 'Faculty Pending'],
                      ['STUD_VERIFIED', 'Student Verified'],
                      ['STUD_PENDING', 'Student Pending']
                    ].map(([key, label]) => {
                      const isActive = activeFilter === key;
                      return (
                        <TouchableOpacity
                          key={key}
                          onPress={() => setActiveFilter(key)}
                          style={[
                            styles.filterPill,
                            { backgroundColor: colors.card, borderColor: colors.border },
                            isActive && { backgroundColor: colors.primary, borderColor: colors.primary }
                          ]}
                        >
                          <Text style={[styles.filterText, { color: colors.textSecondary }, isActive && { color: '#FFF', fontWeight: '800' }]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Phase Filter pills */}
                <View>
                  <Text style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>Phase</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2, marginTop: 4 }}>
                    {availablePhases.map((ph) => {
                      const isActive = activePhase === ph;
                      const label = ph === 'ALL' ? 'All Phases' : `Phase ${ph}`;
                      return (
                        <TouchableOpacity
                          key={ph}
                          onPress={() => setActivePhase(ph)}
                          style={[
                            styles.filterPill,
                            { backgroundColor: colors.card, borderColor: colors.border },
                            isActive && { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }
                          ]}
                        >
                          <Text style={[styles.filterText, { color: colors.textSecondary }, isActive && { color: '#FFF', fontWeight: '800' }]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Subject Filter pills — only shown when a phase is selected */}
                {activePhase !== 'ALL' && (
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                      <Text style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>Subject</Text>
                      {subjectsLoading && (
                        <ActivityIndicator size={12} color={colors.primary} style={{ marginLeft: 6 }} />
                      )}
                    </View>
                    {!subjectsLoading && subjectList.length === 0 ? (
                      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>No subjects found for this phase.</Text>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2, marginTop: 4 }}>
                        {/* All subjects (clear) pill */}
                        <TouchableOpacity
                          onPress={() => setActiveSubject(null)}
                          style={[
                            styles.filterPill,
                            { backgroundColor: colors.card, borderColor: colors.border },
                            !activeSubject && { backgroundColor: '#F59E0B', borderColor: '#F59E0B' }
                          ]}
                        >
                          <Text style={[styles.filterText, { color: colors.textSecondary }, !activeSubject && { color: '#FFF', fontWeight: '800' }]}>
                            All Subjects
                          </Text>
                        </TouchableOpacity>
                        {subjectList.map((subj, idx) => {
                          const isActive = activeSubject?.subject_Code === subj.subject_Code;
                          return (
                            <TouchableOpacity
                              key={`${subj.subject_Code}-${idx}`}
                              onPress={() => setActiveSubject(subj)}
                              style={[
                                styles.filterPill,
                                { backgroundColor: colors.card, borderColor: colors.border },
                                isActive && { backgroundColor: '#F59E0B', borderColor: '#F59E0B' }
                              ]}
                            >
                              <Text style={[styles.filterText, { color: colors.textSecondary }, isActive && { color: '#FFF', fontWeight: '800' }]}>
                                {subj.subject_name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}
                    {/* Loading overlay when fetching subject entries */}
                    {subjectEntriesLoading && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <ActivityIndicator size={12} color='#F59E0B' />
                        <Text style={{ fontSize: 11, color: '#F59E0B' }}>Loading {activeSubject?.subject_name} entries…</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Category Filter Pills (Horizontal Scroll) */}
                <View>
                  <Text style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2, marginTop: 4 }}>
                    {CATEGORY_PILLS.map((pill) => {
                      const isActive = activeCategory === pill.key;
                      const catInfo = CATEGORY_MAP[pill.key] || CATEGORY_MAP['default'];
                      const accentColor = pill.key === 'ALL' ? colors.primary : catInfo.color;

                      return (
                        <TouchableOpacity
                          key={pill.key}
                          onPress={() => setActiveCategory(pill.key)}
                          style={[
                            styles.catFilterPill,
                            { backgroundColor: colors.card, borderColor: colors.border },
                            isActive && { backgroundColor: accentColor, borderColor: accentColor }
                          ]}
                        >
                          {pill.key !== 'ALL' && (
                            catInfo.iconType === 'materialcommunity' ? (
                              <MaterialCommunityIcons
                                name={catInfo.icon}
                                size={11}
                                color={isActive ? '#FFF' : accentColor}
                                style={{ marginRight: 4 }}
                              />
                            ) : (
                              <MaterialIcons
                                name={catInfo.icon}
                                size={11}
                                color={isActive ? '#FFF' : accentColor}
                                style={{ marginRight: 4 }}
                              />
                            )
                          )}
                          <Text style={[
                            styles.catFilterText,
                            { color: colors.textSecondary },
                            isActive && { color: '#FFF', fontWeight: '800' }
                          ]}>
                            {pill.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            )}
          </View>

          {/* Logbook entries list */}
          <View style={{ padding: 16, gap: 12 }}>
            {subjectEntriesLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
                <ActivityIndicator size="large" color='#F59E0B' />
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  Loading {activeSubject?.subject_name} entries…
                </Text>
              </View>
            ) : filteredLogbook.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="hospital-box-outline" size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No entries found</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  {activeSubject
                    ? `No logbook entries found for ${activeSubject.subject_name} in Phase ${activePhase}.`
                    : 'No entries found matching the selected status or category filters.'}
                </Text>
              </View>
            ) : (
              filteredLogbook.map((entry, i) => {
                const catInfo = CATEGORY_MAP[entry.category] || CATEGORY_MAP['default'];
                return (
                  <View key={i} style={[styles.logbookCard, { backgroundColor: colors.card, borderColor: (entry.verified && entry.student_verified) ? '#86EFAC' : colors.border }]}>
                    {/* Category Label at Top of Card */}
                    <View style={styles.cardHeader}>
                      <View style={[styles.categoryBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderColor: colors.border }]}>
                        {catInfo.iconType === 'materialcommunity' ? (
                          <MaterialCommunityIcons name={catInfo.icon} size={12} color={catInfo.color} />
                        ) : (
                          <MaterialIcons name={catInfo.icon} size={12} color={catInfo.color} />
                        )}
                        <Text style={[styles.categoryBadgeText, { color: colors.textSecondary }]}>
                          {catInfo.label}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        {/* Faculty Verification Badge */}
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: entry.verified ? (isDark ? 'rgba(5, 150, 105, 0.15)' : '#D1FAE5') : (isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6') }
                        ]}>
                          <MaterialIcons
                            name={entry.verified ? 'check' : 'pending'}
                            size={10}
                            color={entry.verified ? '#059669' : '#9CA3AF'}
                          />
                          <Text style={[
                            styles.statusBadgeText,
                            { color: entry.verified ? '#059669' : '#9CA3AF' }
                          ]}>
                            FACULTY: {entry.verified ? 'VERIFIED' : 'PENDING'}
                          </Text>
                        </View>

                        {/* Student Verification Badge */}
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: entry.student_verified ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5') : (isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6') }
                        ]}>
                          <MaterialIcons
                            name={entry.student_verified ? 'done-all' : 'pending'}
                            size={10}
                            color={entry.student_verified ? '#10B981' : '#9CA3AF'}
                          />
                          <Text style={[
                            styles.statusBadgeText,
                            { color: entry.student_verified ? '#10B981' : '#9CA3AF' }
                          ]}>
                            STUDENT: {entry.student_verified ? 'VERIFIED' : 'PENDING'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.logbookBody}>
                      <Text style={[styles.logbookActivity, { color: colors.textPrimary }]}>{entry.activity}</Text>
                      <View style={[styles.logCompBadge, { backgroundColor: isDark ? 'rgba(20,184,166,0.1)' : '#CCFBF1' }]}>
                        <Text style={[styles.logCompText, { color: '#14B8A6' }]}>{entry.competency} • {entry.department}</Text>
                      </View>
                    </View>

                    <View style={styles.logbookAttempts}>
                      {['a1', 'a2', 'a3'].map((a, ai) => (
                        <View key={ai} style={{ alignItems: 'center', gap: 4 }}>
                          <Text style={{ fontSize: 10, color: colors.textMuted }}>A{ai + 1}</Text>
                          <AttemptBadge val={entry[a] || '-'} />
                        </View>
                      ))}
                      <View style={{ flex: 1, paddingLeft: 12 }}>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>Faculty Sign-off</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginTop: 2 }}>{entry.faculty}</Text>
                        <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>Date: {entry.date}</Text>
                      </View>
                    </View>

                    {entry.remarks ? (
                      <View style={[styles.remarksContainer, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.05)' : '#FFF7ED', borderColor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#FFEDD5', borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 12, marginBottom: 4 }]}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>Remarks:</Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{entry.remarks}</Text>
                      </View>
                    ) : null}

                    {/* Verification Actions at Bottom of Card */}
                    <View style={[styles.verificationActionRow, { borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', paddingTop: 12 }]}>
                      <Text style={{ fontSize: 10, color: colors.textMuted, fontStyle: 'italic' }}>
                        {(entry.verified && entry.student_verified) ? 'Locked & finalized' : 'Requires verification'}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {isFaculty && !entry.verified && (
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.primary }]}
                            onPress={() => handleFacultySignOff(i)}
                            activeOpacity={0.8}
                          >
                            <MaterialIcons name="check" size={13} color="#FFF" />
                            <Text style={styles.actionButtonText}>Verify as Faculty</Text>
                          </TouchableOpacity>
                        )}
                        {!isFaculty && entry.verified && !entry.student_verified && (
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                            onPress={() => handleStudentSignOff(i)}
                            activeOpacity={0.8}
                          >
                            <MaterialIcons name="border-color" size={11} color="#FFF" />
                            <Text style={styles.actionButtonText}>Verify Log entry</Text>
                          </TouchableOpacity>
                        )}
                        {entry.verified && entry.student_verified && (
                          <View style={styles.fullyLockedBadge}>
                            <MaterialIcons name="lock" size={12} color="#10B981" />
                            <Text style={styles.fullyLockedText}>LOCKED</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={showLegendModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLegendModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.legendModalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Attempt Status Legend</Text>
              <TouchableOpacity onPress={() => setShowLegendModal(false)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350, marginTop: 12 }} showsVerticalScrollIndicator={false}>
              <View style={styles.legendModalGrid}>
                {[
                  ['F', 'First Attempt'],
                  ['M', 'Mastered'],
                  ['C', 'Competent'],
                  ['B', 'Below Expectation'],
                  ['Re', 'Remedial'],
                  ['R', 'Repeated'],
                  ['P', 'Present'],
                  ['A', 'Absent']
                ].map(([val, label]) => (
                  <View key={val} style={styles.modalLegendItem}>
                    <View style={{ width: 34, alignItems: 'center' }}>
                      <AttemptBadge val={val} />
                    </View>
                    <Text style={[styles.modalLegendText, { color: colors.textSecondary }]}>{label}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  statsContainer: { paddingHorizontal: 16, marginTop: 16 },
  statsCard: {
    borderRadius: 24,
    padding: 20,
    elevation: 4,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  statsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsSummary: { gap: 4 },
  statsVal: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
  statsLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  progressCircleContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleText: { fontSize: 14, fontWeight: '900', color: '#FFF' },
  progressBarWrapper: { marginTop: 18 },
  progressBarTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLimitText: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
  progressTargetText: { fontSize: 10, color: '#FFF', fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  filterText: { fontSize: 11, fontWeight: '600' },
  categoryHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  categoryScrollContainer: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  catFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    borderWidth: 1,
  },
  catFilterText: { fontSize: 11, fontWeight: '600' },
  emptyCard: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 20,
  },
  emptyText: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  emptySub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  logbookCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    flexShrink: 1,
    marginRight: 8,
  },
  categoryBadgeText: { fontSize: 10, fontWeight: '700' },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  logbookBody: {
    gap: 6,
  },
  logbookActivity: { fontSize: 14, fontWeight: '800', lineHeight: 20 },
  logCompBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  logCompText: { fontSize: 10, fontWeight: '800' },
  logbookAttempts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(156,163,175,0.1)',
    paddingTop: 12,
  },
  summaryCardSkeleton: {
    height: 120,
    borderRadius: 24,
    borderWidth: 1,
  },
  logbookCardSkeleton: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  filterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterCountBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginLeft: 6,
  },
  filterCountText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  legendLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  legendLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
  },
  activeFilterChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  collapsibleFilterPanel: {
    borderWidth: 1,
  },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  legendModalContent: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  legendModalGrid: {
    gap: 12,
  },
  modalLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  modalLegendText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 22,
    borderRadius: 6,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  verificationActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  fullyLockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 6,
    gap: 4,
  },
  fullyLockedText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  }
});

export default ERPLogBookScreen;
