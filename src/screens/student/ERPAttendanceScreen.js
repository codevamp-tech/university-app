import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getAcademicSubjects } from '../../data/aiEngine';

import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, Animated, RefreshControl, Modal
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_CONFIG } from '../../config/appConfig';

import { getAttendance } from '../../data/apiService';

const { width } = Dimensions.get('window');

// ─── Attendance Skeleton Component ─────────────────────────────────────────────
const AnimatedSkeleton = ({ style, isDark }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: isDark ? [0.06, 0.18] : [0.08, 0.22],
  });

  return (
    <Animated.View style={[{ backgroundColor: isDark ? '#FFF' : '#000', opacity }, style]} />
  );
};

const SkeletonOverallCard = ({ isDark }) => (
  <View style={{
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    backgroundColor: isDark ? '#1E293B' : '#FFF',
    gap: 16,
    marginBottom: 20
  }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <AnimatedSkeleton style={{ width: 120, height: 16, borderRadius: 8 }} isDark={isDark} />
      <AnimatedSkeleton style={{ width: 24, height: 24, borderRadius: 12 }} isDark={isDark} />
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <AnimatedSkeleton style={{ width: 90, height: 48, borderRadius: 12 }} isDark={isDark} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <AnimatedSkeleton style={{ width: 40, height: 16, borderRadius: 8 }} isDark={isDark} />
          <AnimatedSkeleton style={{ width: 50, height: 12, borderRadius: 6 }} isDark={isDark} />
        </View>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <AnimatedSkeleton style={{ width: 40, height: 16, borderRadius: 8 }} isDark={isDark} />
          <AnimatedSkeleton style={{ width: 50, height: 12, borderRadius: 6 }} isDark={isDark} />
        </View>
      </View>
    </View>
    <View style={{ height: 8, borderRadius: 4, backgroundColor: isDark ? '#334155' : '#F3F4F6' }}>
      <AnimatedSkeleton style={{ width: '100%', height: '100%', borderRadius: 4 }} isDark={isDark} />
    </View>
    <AnimatedSkeleton style={{ width: '70%', height: 12, borderRadius: 6 }} isDark={isDark} />
  </View>
);

const SkeletonPhaseRow = ({ isDark }) => (
  <View style={{
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    backgroundColor: isDark ? '#1E293B' : '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <AnimatedSkeleton style={{ width: 48, height: 48, borderRadius: 24 }} isDark={isDark} />
      <View style={{ gap: 6 }}>
        <AnimatedSkeleton style={{ width: 100, height: 16, borderRadius: 8 }} isDark={isDark} />
        <AnimatedSkeleton style={{ width: 80, height: 12, borderRadius: 6 }} isDark={isDark} />
      </View>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <AnimatedSkeleton style={{ width: 40, height: 10, borderRadius: 5 }} isDark={isDark} />
        <AnimatedSkeleton style={{ width: 35, height: 16, borderRadius: 8 }} isDark={isDark} />
      </View>
      <AnimatedSkeleton style={{ width: 24, height: 24, borderRadius: 12 }} isDark={isDark} />
    </View>
  </View>
);

const getParentSubjectName = (name) => {
  const n = name.trim();
  const lower = n.toLowerCase();

  if (lower.includes('anatomy')) return 'Anatomy';
  if (lower.includes('physiology')) return 'Physiology';
  if (lower.includes('biochemistry')) return 'Biochemistry';
  if (lower.includes('pathology')) return 'Pathology';
  if (lower.includes('pharmacology')) return 'Pharmacology';
  if (lower.includes('microbiology')) return 'Microbiology';
  if (lower.includes('forensic') || lower.includes('fmt')) return 'Forensic Medicine';
  if (lower.includes('community medicine') || lower.includes('psm') || lower.includes('preventive')) return 'Community Medicine';
  if (lower.includes('medicine')) return 'Medicine';
  if (lower.includes('surgery')) return 'Surgery';
  if (lower.includes('pediatrics') || lower.includes('paediatrics')) return 'Pediatrics';
  if (lower.includes('obstetrics') || lower.includes('gynecology') || lower.includes('obg')) return 'Obstetrics & Gynecology';
  if (lower.includes('ophthalmology') || lower.includes('eye')) return 'Ophthalmology';
  if (lower.includes('ent') || lower.includes('ear')) return 'ENT';

  return n.split(' ')[0];
};

// Standard MBBS abbreviation codes
const SUBJECT_CODE_MAP = {
  'Anatomy':              'AN',
  'Physiology':           'PY',
  'Biochemistry':         'BC',
  'Community Medicine':   'CM',
  'Pathology':            'PA',
  'Pharmacology':         'PH',
  'Microbiology':         'MI',
  'Forensic Medicine':    'FM',
  'Medicine':             'ME',
  'Surgery':              'SU',
  'Pediatrics':           'PE',
  'Obstetrics & Gynecology': 'OG',
  'Ophthalmology':        'OP',
  'ENT':                  'EN',
  'Orthopedics':          'OR',
  'Dermatology':          'DE',
  'Psychiatry':           'PS',
  'Radiodiagnosis':       'RD',
  'Anesthesia':           'AE',
  'Respiratory Medicine': 'RM',
  'Dentistry':            'DN',
};
const getSubjectCode = (parentName) => SUBJECT_CODE_MAP[parentName] || parentName.substring(0, 2).toUpperCase();

const ERPAttendanceScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user: contextUser, accessToken } = useUser();
  const passedStudent = route?.params?.student;
  const user = passedStudent || contextUser;
  const isFaculty = contextUser && contextUser.role === 'teacher';

  const [apiAttendance, setApiAttendance] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const [expandedPhase, setExpandedPhase] = React.useState(null);
  const [expandedSubject, setExpandedSubject] = React.useState(null);

  // ─── Attendance Detail Modal (subcategory tap) ────────────────────────────
  const [detailModal, setDetailModal] = React.useState({ visible: false, subCatName: '', erpCode: null, records: [], loading: false, error: null });
  // ─── Today's Attendance Modal (eye icon) ─────────────────────────────────
  const [todayModal, setTodayModal] = React.useState({ visible: false, subjectName: '', rows: [], loading: false, error: null });

  const studentUid = user?.rollno || user?.id || user?.username || '';

  const openDetailModal = React.useCallback(async (subCatName, erpCode) => {
    setDetailModal({ visible: true, subCatName, erpCode, records: [], loading: true, error: null });
    try {
      const resp = await fetch('https://myportal.srms.ac.in/SRMSERP/Home/GetAttendanceRollNoSubjectWsie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: String(studentUid), sub_cd: String(erpCode), Curr_colgcd: '11' }),
      });
      const json = await resp.json();
      const records = Array.isArray(json) ? json : (json?.d ? JSON.parse(json.d) : []);
      setDetailModal(prev => ({ ...prev, loading: false, records }));
    } catch (e) {
      setDetailModal(prev => ({ ...prev, loading: false, error: 'Failed to load attendance details.' }));
    }
  }, [studentUid]);

  const openTodayModal = React.useCallback(async (subCatName, erpCode) => {
    setTodayModal({ visible: true, subjectName: subCatName, rows: [], loading: true, error: null });
    try {
      const resp = await fetch('https://myportal.srms.ac.in/SRMSERP/Home/GetStudentLectureRollnoWise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: String(studentUid), lecturecd: String(erpCode) }),
      });
      const json = await resp.json();
      const rows = Array.isArray(json) ? json : (json?.d ? JSON.parse(json.d) : []);
      setTodayModal(prev => ({ ...prev, loading: false, rows }));
    } catch (e) {
      setTodayModal(prev => ({ ...prev, loading: false, error: 'Failed to load today\'s attendance.' }));
    }
  }, [studentUid]);

  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const semNum = parseInt(user?.semester) || 7;
  const isMedical = user?.course?.replace(/\./g, '').toUpperCase().includes('MBBS') || user?.category?.toLowerCase() === 'medical';
  const getPhaseRomanLocal = (sem) => {
    const s = parseInt(sem);
    if (s <= 2) return 'I';
    if (s <= 4) return 'II';
    if (s <= 6) return 'III';
    return 'IV';
  };
  const getMedicalProfNameFromSemLocal = (sem) => {
    const s = parseInt(sem);
    if (s <= 2) return '1st Prof';
    if (s <= 4) return '2nd Prof';
    if (s <= 6) return '3rd Prof Part I';
    return '3rd Prof Part II';
  };
  const currentSemRoman = roman[semNum - 1] || 'VII';
  const currentPhaseName = isMedical ? getMedicalProfNameFromSemLocal(semNum) : `Semester ${currentSemRoman}`;
  const displaySem = isMedical ? getPhaseRomanLocal(semNum) : currentSemRoman;
  const termLabel = isMedical ? 'Phase' : 'Semester';

  React.useEffect(() => {
    if (currentPhaseName) {
      setExpandedPhase(currentPhaseName);
    }
  }, [currentPhaseName]);

  const [refreshing, setRefreshing] = React.useState(false);

  const fetchAttendance = React.useCallback(async (force = false) => {
    if (!accessToken) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (force) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const studentId = user?.rollno || user?.id || user?.username;
      const data = await getAttendance(accessToken, studentId, force);
      if (data && data.length > 0) {
        // Filter out exam/sessional components (where attendance_pct is null or undefined)
        const validRecords = data.filter(
          item => item.attendance_pct !== null && item.attendance_pct !== undefined
        );

        const subjects = validRecords.map(item => {
          const percentage = Math.round(item.attendance_pct || 0);

          // NMC criteria: 80% for clinical postings/practicals/labs, 75% for theory classes
          const nameUpper = (item.subject_name || item.subject_code || '').toUpperCase();
          const isPractical = nameUpper.includes('PRACTICAL') ||
            nameUpper.includes('CLINICAL') ||
            nameUpper.includes('DISSECTION') ||
            nameUpper.includes('POSTING') ||
            nameUpper.includes('LAB');
          const requiredPct = isPractical ? 80 : 75;

          // Safe if above threshold, warning if nearing, danger if below
          const status = percentage >= requiredPct
            ? 'safe'
            : percentage >= (requiredPct - 5)
              ? 'warning'
              : 'danger';

          return {
            code: item.subject_code,
            name: item.subject_name || item.subject_code,
            percentage,
            status,
            isPractical,
            requiredPct,
            semester: item.semester
          };
        });

        const overall = subjects.length > 0
          ? Math.round(subjects.reduce((sum, s) => sum + s.percentage, 0) / subjects.length)
          : 0;

        setApiAttendance({
          overall: user?.attendance || overall,
          totalClasses: subjects.length * 30, // estimate for display
          attendedClasses: Math.round((user?.attendance || overall) * 0.01 * (subjects.length * 30)),
          subjects
        });
      }
    } catch (err) {
      console.warn('[AttendanceScreen] Error fetching from API:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, user?.rollno, user?.id, user?.username, user?.attendance]);

  React.useEffect(() => {
    fetchAttendance(false);
  }, [fetchAttendance]);

  const handleRefresh = React.useCallback(() => {
    fetchAttendance(true);
  }, [fetchAttendance]);

  const attendanceData = apiAttendance || {
    overall: '-',
    totalClasses: 0,
    attendedClasses: 0,
    subjects: []
  };

  const displayData = React.useMemo(() => {
    if (!attendanceData.subjects || attendanceData.subjects.length === 0) {
      return {};
    }

    const grouped = {};
    const order = isMedical
      ? ['1st Prof', '2nd Prof', '3rd Prof Part I', '3rd Prof Part II']
      : roman.slice(0, semNum).map(sem => `Semester ${sem}`);

    // Pre-initialize groupings up to current semester / year
    order.forEach(phase => {
      grouped[phase] = {
        label: phase === currentPhaseName ? 'Ongoing' : 'Completed',
        percentageSum: 0,
        count: 0,
        subjects: []
      };
    });

    // MBBS subject → canonical phase mapping (by subject name)
    // Community Medicine appears in both 1st Prof (year 1) and 3rd Prof Part I (year 3),
    // so it uses a semester-based tiebreaker.
    const MBBS_SUBJECT_PHASE = {
      // ── 1st Prof (1st Year) ───────────────────────────────────
      'anatomy': '1st Prof',
      'physiology': '1st Prof',
      'biochemistry': '1st Prof',
      // ── 2nd Prof (2nd Year) ───────────────────────────────────
      'pathology': '2nd Prof',
      'pharmacology': '2nd Prof',
      'microbiology': '2nd Prof',
      // ── 3rd Prof Part I (3rd Year) ────────────────────────────
      'forensic': '3rd Prof Part I',
      'fmt': '3rd Prof Part I',
      // ── 3rd Prof Part II (4th Year) ───────────────────────────
      'medicine': '3rd Prof Part II',
      'surgery': '3rd Prof Part II',
      'clinical posting': '3rd Prof Part II',
      'pediatrics': '3rd Prof Part II',
      'paediatrics': '3rd Prof Part II',
      'obstetrics': '3rd Prof Part II',
      'gynecology': '3rd Prof Part II',
      'gynaecology': '3rd Prof Part II',
      'obg': '3rd Prof Part II',
      'ortho': '3rd Prof Part II',
      'ophthalmology': '3rd Prof Part II',
      'optha': '3rd Prof Part II',
      'ent': '3rd Prof Part II',
      'otorhinolaryngology': '3rd Prof Part II',
      'dermatology': '3rd Prof Part II',
      'derma': '3rd Prof Part II',
      'psychiatry': '3rd Prof Part II',
      'radiodiagnosis': '3rd Prof Part II',
      'radiology': '3rd Prof Part II',
      'anesthesia': '3rd Prof Part II',
      'anaesthesia': '3rd Prof Part II',
      'respiratory': '3rd Prof Part II',
      'respi': '3rd Prof Part II',
      'dentistry': '3rd Prof Part II',
      'dental': '3rd Prof Part II',
      'aetcom': '3rd Prof Part II', // AETCOM module standalone entries
    };

    const getMedicalPhaseForSubject = (subName, semNumber) => {
      if (!isMedical) return null;
      const lower = (subName || '').toLowerCase();

      // Community Medicine: semester 1-2 → 1st Prof, semester 5+ → 3rd Prof Part I
      if (lower.includes('community medicine') || lower.includes('preventive') || lower.includes('psm')) {
        return semNumber <= 2 ? '1st Prof' : '3rd Prof Part I';
      }

      // Check all other keywords
      for (const [keyword, phase] of Object.entries(MBBS_SUBJECT_PHASE)) {
        if (lower.includes(keyword)) return phase;
      }

      // Fallback: use semester-based mapping
      return getMedicalProfNameFromSemLocal(semNumber);
    };

    attendanceData.subjects.forEach(sub => {
      const semRoman = roman[sub.semester - 1] || `${sub.semester}`;
      const phaseName = isMedical
        ? getMedicalPhaseForSubject(sub.name, sub.semester)
        : `Semester ${semRoman}`;

      if (!grouped[phaseName]) {
        grouped[phaseName] = {
          label: phaseName === currentPhaseName ? 'Ongoing' : (order.indexOf(phaseName) < order.indexOf(currentPhaseName) ? 'Completed' : 'Upcoming'),
          percentageSum: 0,
          count: 0,
          subjects: []
        };
      }

      grouped[phaseName].subjects.push(sub);
      grouped[phaseName].percentageSum += sub.percentage;
      grouped[phaseName].count += 1;
    });

    // Filter out groups with no subjects, but keep the current ongoing phase if it exists
    const finalGrouped = {};
    Object.entries(grouped).forEach(([phase, data]) => {
      if (data.count > 0 || phase === currentPhaseName) {
        const avg = data.count > 0 ? Math.round(data.percentageSum / data.count) : 0;

        // Group subjects by parent subject name
        const parentMap = {};
        data.subjects.forEach(sub => {
          const parentName = getParentSubjectName(sub.name);
          if (!parentMap[parentName]) {
            parentMap[parentName] = {
              name: parentName,
              code: getSubjectCode(parentName),
              percentageSum: 0,
              count: 0,
              subCategories: []
            };
          }
          parentMap[parentName].subCategories.push({ ...sub, erpCode: sub.code });
          parentMap[parentName].percentageSum += sub.percentage;
          parentMap[parentName].count += 1;
        });

        const groupedSubjects = Object.values(parentMap).map(parent => {
          const avgPct = Math.round(parent.percentageSum / parent.count);
          const requiredPct = parent.subCategories[0]?.requiredPct || 75;
          const status = avgPct >= requiredPct
            ? 'safe'
            : avgPct >= (requiredPct - 5)
              ? 'warning'
              : 'danger';

          return {
            name: parent.name,
            code: parent.code,
            percentage: avgPct,
            status,
            requiredPct,
            subCategories: parent.subCategories
          };
        });

        finalGrouped[phase] = {
          label: data.label,
          overallPct: avg,
          subjects: groupedSubjects
        };
      }
    });

    return finalGrouped;
  }, [attendanceData.subjects, isMedical, currentPhaseName, semNum]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'safe': return isDark ? '#34D399' : '#059669'; // Green
      case 'warning': return isDark ? '#FBBF24' : '#D97706'; // Yellow/Orange
      case 'danger': return isDark ? '#F87171' : '#DC2626'; // Red
      default: return colors.primary;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => {
            if (isFaculty) {
              navigation.navigate('FacultyStudentsDirectory');
            } else if (passedStudent) {
              navigation.goBack();
            } else {
              navigation.navigate('ERPHome');
            }
          }} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Attendance</Text>
        </View>
      </View>

      {loading ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#EA580C']}
              tintColor={isDark ? '#FFF' : '#EA580C'}
            />
          }
        >
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <SkeletonOverallCard isDark={isDark} />
            <SkeletonPhaseRow isDark={isDark} />
            <SkeletonPhaseRow isDark={isDark} />
            <SkeletonPhaseRow isDark={isDark} />
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#EA580C']}
              tintColor={isDark ? '#FFF' : '#EA580C'}
            />
          }
        >
          {/* Hero Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Attendance Insights</Text>
            <Text style={[styles.heroSub, { color: colors.textSecondary }]}>{termLabel} {displaySem} • {APP_CONFIG.UNIVERSITY_NAME}</Text>
          </View>

          {/* Overall Attendance Card */}
          <View style={styles.sectionContainer}>
            <LinearGradient
              colors={isDark ? ['#1E1B4B', '#312E81'] : ['#EEF2FF', '#E0E7FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.overallCard, { borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}
            >
              <View style={styles.overallHeader}>
                <Text style={[styles.overallLabel, { color: isDark ? '#818CF8' : '#4338CA' }]}>OVERALL ATTENDANCE</Text>
                <MaterialCommunityIcons name="shield-check" size={24} color={isDark ? '#818CF8' : '#4338CA'} />
              </View>

              <View style={styles.overallMain}>
                <Text style={[styles.overallPercentage, { color: isDark ? '#A5B4FC' : '#312E81' }]}>
                  {attendanceData.overall}{attendanceData.overall !== '-' ? '%' : ''}
                </Text>
                <View style={styles.overallStats}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: isDark ? '#A5B4FC' : '#312E81' }]}>{attendanceData.attendedClasses}</Text>
                    <Text style={[styles.statLabel, { color: isDark ? 'rgba(165,180,252,0.7)' : 'rgba(49,46,129,0.7)' }]}>Attended</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: isDark ? '#A5B4FC' : '#312E81' }]}>{attendanceData.totalClasses}</Text>
                    <Text style={[styles.statLabel, { color: isDark ? 'rgba(165,180,252,0.7)' : 'rgba(49,46,129,0.7)' }]}>Total</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#C7D2FE' }]}>
                <View style={[styles.progressBarFill, { width: attendanceData.overall === '-' ? '0%' : `${attendanceData.overall}%`, backgroundColor: isDark ? '#818CF8' : '#4338CA' }]} />
              </View>
              <Text style={[styles.progressHint, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(67,56,202,0.7)' }]}>
                {attendanceData.overall === '-' ? 'No attendance records available.' : (attendanceData.overall >= 75 ? 'You are above the 75% minimum criteria. Keep it up!' : 'Warning: Your attendance is below the 75% minimum criteria.')}
              </Text>
            </LinearGradient>
          </View>

          {/* Subject-wise Breakdown Accordions */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              {isMedical ? 'Professional Year Breakdown' : 'Semester-wise Breakdown'}
            </Text>

            <View style={styles.subjectsList}>
              {Object.keys(displayData).length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, borderColor: colors.border, borderWidth: 1 }}>
                  <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>No attendance data available</Text>
                </View>
              ) : (
                Object.entries(displayData).map(([phase, phaseData]) => {
                  const isExpanded = expandedPhase === phase;
                  const isActive = phase === currentPhaseName;

                  return (
                    <View key={phase} style={styles.phaseContainer}>
                      {/* Accordion Header */}
                      <TouchableOpacity
                        style={[
                          styles.semHeader,
                          { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
                          isActive && { borderColor: colors.primary, borderWidth: 1.5, backgroundColor: isDark ? 'rgba(234, 88, 12, 0.08)' : '#FFF7ED' }
                        ]}
                        onPress={() => setExpandedPhase(isExpanded ? null : phase)}
                      >
                        <View style={styles.semHeaderLeft}>
                          <View style={[
                            styles.semCircle,
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' },
                            isActive && { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.2)' : '#FFEDD5' }
                          ]}>
                            <Text style={[styles.semCircleText, { color: colors.textSecondary }, isActive && { color: colors.primary }]}>
                              {isMedical ? (phase.includes('1st') ? '1st' : phase.includes('2nd') ? '2nd' : phase.includes('Part I') ? '3rd P1' : '3rd P2') : phase.replace('Semester ', '')}
                            </Text>
                          </View>
                          <View>
                            <Text style={[styles.semName, { color: colors.textPrimary }]}>
                              {phase}
                            </Text>
                            <Text style={[styles.semLabel, { color: colors.textSecondary }]}>
                              {isActive ? 'Ongoing Evaluation' : 'Completed Phase'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.semRight}>
                          <View style={{ alignItems: 'flex-end', marginRight: 4 }}>
                            <Text style={[styles.sgpaLabel, { color: colors.textSecondary }]}>
                              OVERALL
                            </Text>
                            <Text style={[styles.sgpaValue, { color: isActive ? colors.primary : colors.textPrimary }]}>
                              {phaseData.overallPct}%
                            </Text>
                          </View>
                          <MaterialIcons
                            name={isExpanded ? 'expand-less' : 'expand-more'}
                            size={24}
                            color={colors.textSecondary}
                          />
                        </View>
                      </TouchableOpacity>

                      {/* Expanded Subject Cards */}
                      {isExpanded && (
                        <View style={[styles.subjectsContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }]}>
                          {phaseData.subjects.length === 0 ? (
                            <View style={{ padding: 16, alignItems: 'center' }}>
                              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No active subjects registered for this phase.</Text>
                            </View>
                          ) : (
                            phaseData.subjects.map((subject, idx) => {
                              const statusColor = getStatusColor(subject.status);
                              const isSubjectExpanded = expandedSubject === `${phase}_${subject.name}`;

                              return (
                                <View key={idx} style={[styles.subjectCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, marginTop: idx > 0 ? 12 : 0 }]}>
                                  <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => setExpandedSubject(isSubjectExpanded ? null : `${phase}_${subject.name}`)}
                                  >
                                    <View style={styles.subjectHeader}>
                                      <View style={{ flex: 1, paddingRight: 10 }}>
                                        <Text style={[styles.subjectCode, { color: colors.textSecondary }]}>{subject.code}</Text>
                                        <Text style={[styles.subjectName, { color: colors.textPrimary }]} numberOfLines={1}>{subject.name}</Text>
                                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                                          {subject.subCategories.length} sub-categor{subject.subCategories.length === 1 ? 'y' : 'ies'} • Target: {subject.requiredPct}%
                                        </Text>
                                      </View>
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <View style={[styles.percentageBadge, { backgroundColor: statusColor + '20' }]}>
                                          <Text style={[styles.percentageText, { color: statusColor }]}>{subject.percentage}%</Text>
                                        </View>
                                        <MaterialIcons
                                          name={isSubjectExpanded ? 'expand-less' : 'expand-more'}
                                          size={20}
                                          color={colors.textSecondary}
                                        />
                                      </View>
                                    </View>

                                    <View style={[styles.subjectProgressBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6', marginBottom: isSubjectExpanded ? 12 : 0 }]}>
                                      <View style={[styles.subjectProgressFill, { width: `${subject.percentage}%`, backgroundColor: statusColor }]} />
                                    </View>
                                  </TouchableOpacity>

                                  {isSubjectExpanded && (
                                    <View style={{
                                      marginTop: 4,
                                      paddingLeft: 8,
                                      borderLeftWidth: 2,
                                      borderLeftColor: colors.border,
                                      gap: 8,
                                    }}>
                                      {subject.subCategories.map((subCat, subIdx) => {
                                        const subColor = getStatusColor(subCat.status);
                                        return (
                                          <TouchableOpacity
                                            key={subIdx}
                                            onPress={() => openDetailModal(subCat.name, subCat.erpCode)}
                                            activeOpacity={0.7}
                                            style={{
                                              flexDirection: 'row',
                                              justifyContent: 'space-between',
                                              alignItems: 'center',
                                              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F9FAFB',
                                              borderColor: colors.border,
                                              borderWidth: 1,
                                              borderRadius: 12,
                                              padding: 10,
                                            }}
                                          >
                                            <View style={{ flex: 1, paddingRight: 8 }}>
                                              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>
                                                {subCat.name}
                                              </Text>
                                              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                                                {subCat.isPractical ? 'Practical / Posting' : 'Theory'} • Target: {subCat.requiredPct}% • Tap for details
                                              </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                              {/* Eye icon — Today's Attendance */}
                                              <TouchableOpacity
                                                onPress={(e) => { e.stopPropagation?.(); openTodayModal(subCat.name, subCat.erpCode); }}
                                                style={[
                                                  styles.eyeBtn,
                                                  { backgroundColor: isDark ? 'rgba(129,140,248,0.15)' : '#EEF2FF', borderColor: isDark ? '#818CF8' : '#6366F1' }
                                                ]}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                              >
                                                <MaterialCommunityIcons name="eye-outline" size={16} color={isDark ? '#818CF8' : '#6366F1'} />
                                              </TouchableOpacity>
                                              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: subColor + '20' }}>
                                                <Text style={{ fontSize: 12, fontWeight: '800', color: subColor }}>{subCat.percentage}%</Text>
                                              </View>
                                              <MaterialIcons name="chevron-right" size={16} color={colors.textMuted || colors.textSecondary} />
                                            </View>
                                          </TouchableOpacity>
                                        );
                                      })}
                                    </View>
                                  )}
                                </View>
                              );
                            })
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </View>

        </ScrollView>
      )}

      {/* ═══════════════════════════════════════════════════════
          ATTENDANCE HISTORY MODAL  (subcategory tap)
      ═══════════════════════════════════════════════════════ */}
      <Modal
        visible={detailModal.visible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
          <View style={[
            styles.modalSheet,
            { backgroundColor: colors.card, borderColor: colors.border }
          ]}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>{detailModal.subCatName}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Attendance History</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModal(prev => ({ ...prev, visible: false }))} style={styles.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {detailModal.loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading records…</Text>
              </View>
            ) : detailModal.error ? (
              <Text style={{ color: '#F87171', textAlign: 'center', padding: 20 }}>{detailModal.error}</Text>
            ) : detailModal.records.length === 0 ? (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>No attendance records found.</Text>
            ) : (
              <>
                {/* Table header */}
                <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
                  <Text style={[styles.tableCell, styles.tableCellNo, styles.tableHeaderText, { color: colors.textSecondary }]}>S.No</Text>
                  <Text style={[styles.tableCell, styles.tableCellDate, styles.tableHeaderText, { color: colors.textSecondary }]}>Lecture Date</Text>
                  <Text style={[styles.tableCell, styles.tableCellAtt, styles.tableHeaderText, { color: colors.textSecondary }]}>Attendance</Text>
                  <Text style={[styles.tableCell, styles.tableCellPunch, styles.tableHeaderText, { color: colors.textSecondary }]}>Punch Time</Text>
                </View>
                <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                  {detailModal.records.map((rec, i) => {
                    const att = (rec.attendance || rec.Attendance || '').trim();
                    const attColor = att === 'P' ? '#34D399' : att === 'A' ? '#F87171' : colors.textSecondary;
                    return (
                      <View key={i} style={[
                        styles.tableRow,
                        { borderBottomColor: colors.border, borderBottomWidth: 1, backgroundColor: i % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA') }
                      ]}>
                        <Text style={[styles.tableCell, styles.tableCellNo, { color: colors.textSecondary }]}>{i + 1}</Text>
                        <Text style={[styles.tableCell, styles.tableCellDate, { color: colors.textPrimary }]}>
                          {rec.lecturedt || rec.LectureDate || rec.lecture_date || '-'}
                        </Text>
                        <Text style={[styles.tableCell, styles.tableCellAtt, { color: attColor, fontWeight: '800' }]}>
                          {att || 'N.A.'}
                        </Text>
                        <Text style={[styles.tableCell, styles.tableCellPunch, { color: colors.textSecondary }]}>
                          {rec.punchtime || rec.PunchTime || rec.punch_time || '-'}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          TODAY'S ATTENDANCE MODAL  (eye icon tap)
      ═══════════════════════════════════════════════════════ */}
      <Modal
        visible={todayModal.visible}
        animationType="slide"
        transparent
        onRequestClose={() => setTodayModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>{todayModal.subjectName}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Today's Attendance</Text>
              </View>
              <TouchableOpacity onPress={() => setTodayModal(prev => ({ ...prev, visible: false }))} style={styles.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {todayModal.loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color="#818CF8" />
                <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Fetching today's records…</Text>
              </View>
            ) : todayModal.error ? (
              <Text style={{ color: '#F87171', textAlign: 'center', padding: 20 }}>{todayModal.error}</Text>
            ) : (
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {todayModal.rows.length === 0 ? (
                  <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>No lecture punches found for today.</Text>
                ) : (
                  todayModal.rows.map((row, ri) => {
                    const att = (row.attendance || row.Attendance || '').trim();
                    const attColor = att === 'P' ? '#34D399' : att === 'A' ? '#F87171' : colors.textSecondary;
                    return (
                      <View key={ri} style={[
                        styles.todayRow,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB', borderColor: colors.border }
                      ]}>
                        <View style={{ flex: 1, gap: 4 }}>
                          <Text style={{ fontSize: 13, color: colors.textSecondary }}>Punch Time: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{row.punchtime || '-'}</Text></Text>
                          <Text style={{ fontSize: 13, color: colors.textSecondary }}>Faculty In: <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{row.faculty_inpunch || '-'}</Text></Text>
                          <Text style={{ fontSize: 13, color: colors.textSecondary }}>Faculty Out: <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{row.faculty_outpunch || '-'}</Text></Text>
                        </View>
                        <View style={[
                          styles.todayBadge,
                          { backgroundColor: attColor + '20' }
                        ]}>
                          <Text style={{ fontSize: 18, fontWeight: '900', color: attColor }}>
                            {att || 'N.A.'}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  notifBtn: { padding: 8 },
  scroll: { paddingBottom: 140 },
  sectionContainer: { paddingHorizontal: 20, marginTop: 24 },
  heroTitle: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  heroSub: { fontSize: 14, fontWeight: '500' },

  overallCard: {
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  overallHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  overallLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  overallMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  overallPercentage: { fontSize: 48, fontWeight: '800', lineHeight: 56 },
  overallStats: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 4 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', lineHeight: 22 },
  statLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(0,0,0,0.1)', marginHorizontal: 6 },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressHint: { fontSize: 12, fontWeight: '500' },

  sectionHeading: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  subjectsList: { gap: 16 },
  subjectCard: { padding: 16, borderRadius: 16 },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  subjectCode: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  subjectName: { fontSize: 15, fontWeight: '600', maxWidth: width * 0.55 },
  percentageBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  percentageText: { fontSize: 14, fontWeight: '700' },
  subjectProgressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  subjectProgressFill: { height: '100%', borderRadius: 3 },
  warningText: { fontSize: 12, fontWeight: '500', marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  phaseContainer: { marginBottom: 12 },
  semHeader: {
    borderRadius: 16, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  semHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  semCircle: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  semCircleText: { fontSize: 14, fontWeight: '800' },
  semName: { fontSize: 15, fontWeight: '700' },
  semLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3, marginTop: 2, textTransform: 'uppercase' },
  semRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  sgpaLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  sgpaValue: { fontSize: 18, fontWeight: '900' },
  subjectsContainer: { borderRadius: 16, padding: 8, marginTop: 8, gap: 12 },
  eyeBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 40,
    width: '100%',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeader: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderText: {
    fontWeight: '700',
    fontSize: 12,
  },
  tableCell: {
    fontSize: 12,
    textAlign: 'center',
  },
  tableCellNo: {
    width: '15%',
    textAlign: 'left',
  },
  tableCellDate: {
    width: '35%',
    textAlign: 'left',
  },
  tableCellAtt: {
    width: '25%',
  },
  tableCellPunch: {
    width: '25%',
    textAlign: 'right',
  },
  todayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  todayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
});

export default ERPAttendanceScreen;
