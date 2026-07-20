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
  'SelfDirectedLearning': { label: 'Self Directed Learning', icon: 'menu-book', color: '#3B82F6', iconType: 'material' },
  'RefSelfDirectedLearning': { label: 'Reflection on Self Directed Learning', icon: 'menu-book', color: '#3B82F6', iconType: 'material' },
  'PracticalStudentLab': { label: 'Practical Student Lab', icon: 'science', color: '#10B981', iconType: 'material' },
  'CertificationSkills': { label: 'Certification Skills', icon: 'verified-user', color: '#F59E0B', iconType: 'material' },
  'VerticalIntegration': { label: 'Vertical Integration', icon: 'layers', color: '#8B5CF6', iconType: 'material' },
  'EarlyClinicalExposure': { label: 'Early Clinical Exposure', icon: 'baby-changing-station', color: '#EC4899', iconType: 'materialcommunity' },
  'ClinicalVisitDepartment': { label: 'Visit to Clinical Dept', icon: 'domain', color: '#06B6D4', iconType: 'material' },
  'default': { label: 'General Logbook', icon: 'assignment', color: '#6B7280', iconType: 'material' }
};

const CATEGORY_PILLS = [
  { key: 'ALL', label: 'All Categories' },
  { key: 'SelfDirectedLearning', label: 'Self Directed Learning' },
  { key: 'RefSelfDirectedLearning', label: 'Reflection on Self-Directed Learning' },
  { key: 'PracticalStudentLab', label: 'Practical Lab' },
  { key: 'CertificationSkills', label: 'Certification' },
  { key: 'VerticalIntegration', label: 'Vertical Integration' },
  { key: 'EarlyClinicalExposure', label: 'Early Clinical' },
  { key: 'ClinicalVisitDepartment', label: 'Clinical Visits' }
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

// ─── CalendarModal ───────────────────────────────────────────────────────────
const CalendarModal = ({ visible, date, colors, isDark, onSelect, onClose }) => {
  const [viewYear, setViewYear] = useState(date.getFullYear());
  const [viewMonth, setViewMonth] = useState(date.getMonth());

  useEffect(() => {
    if (visible) {
      setViewYear(date.getFullYear());
      setViewMonth(date.getMonth());
    }
  }, [visible, date]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
          {/* Month nav */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <TouchableOpacity onPress={prevMonth} style={{ padding: 6, borderRadius: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF7ED' }}>
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={{ padding: 6, borderRadius: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF7ED' }}>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Day labels */}
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {DAY_NAMES.map(d => (
              <Text key={d} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>{d}</Text>
            ))}
          </View>

          {/* Date grid */}
          {weeks.map((week, wi) => (
            <View key={wi} style={{ flexDirection: 'row', marginBottom: 4 }}>
              {week.map((day, di) => {
                const sel = isSelected(day);
                const tod = isToday(day);
                return (
                  <TouchableOpacity
                    key={di}
                    style={[
                      { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
                      sel && { backgroundColor: colors.primary },
                      tod && !sel && { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FFF7ED', borderWidth: 1, borderColor: colors.primary }
                    ]}
                    onPress={() => {
                      if (day) { onSelect(new Date(viewYear, viewMonth, day)); onClose(); }
                    }}
                    activeOpacity={day ? 0.7 : 1}
                  >
                    <Text style={[
                      { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
                      sel && { color: '#FFFFFF', fontWeight: '800' },
                      tod && !sel && { color: colors.primary, fontWeight: '700' },
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
            style={{ marginTop: 12, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 32, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF7ED', borderRadius: 12, borderWidth: 1, borderColor: colors.primary }}
            onPress={() => { onSelect(new Date()); onClose(); }}
          >
            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primary }}>Today</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── Reflection Summary Card (for RefSelfDirectedLearning entries) ───────────────────
const RefSummaryCard = ({ entry, colors, isDark, onSignOff, signingOffId }) => {
  const isSignedOff = entry.student_verified;
  const isVerified = entry.verified;
  const isSubmitting = signingOffId === entry.actmstid;

  return (
    <View style={[
      styles.logbookCard,
      { backgroundColor: colors.card, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: isVerified ? '#10B981' : '#F59E0B' }
    ]}>
      {/* Date & Status */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>
          SUBMITTED ON: {entry.date}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <View style={[styles.statusBadge, { backgroundColor: isVerified ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)' }]}>
            <Text style={{ fontSize: 9, fontWeight: '800', color: isVerified ? '#10B981' : '#F59E0B' }}>
              {isVerified ? 'FACULTY: VERIFIED' : 'FACULTY: PENDING'}
            </Text>
          </View>
        </View>
      </View>

      {/* Topic */}
      <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary }}>
        Topic: {entry.activity}
      </Text>

      {/* A1, A2, A3 Q&As */}
      <View style={{ gap: 8, marginTop: 4 }}>
        <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', padding: 8, borderRadius: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary }}>What Happened?</Text>
          <Text style={{ fontSize: 12, color: colors.textPrimary, marginTop: 2 }}>{entry.a1 || '—'}</Text>
        </View>
        <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', padding: 8, borderRadius: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary }}>So What?</Text>
          <Text style={{ fontSize: 12, color: colors.textPrimary, marginTop: 2 }}>{entry.a2 || '—'}</Text>
        </View>
        <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', padding: 8, borderRadius: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary }}>What Next?</Text>
          <Text style={{ fontSize: 12, color: colors.textPrimary, marginTop: 2 }}>{entry.a3 || '—'}</Text>
        </View>
      </View>

      {/* Faculty Sign-off details */}
      {isVerified && (
        <View style={{ marginTop: 6, gap: 2 }}>
          <Text style={{ fontSize: 10, color: colors.textMuted, fontStyle: 'italic' }}>
            Verified by {entry.faculty}
          </Text>
          {entry.verifiedDate && entry.verifiedDate !== 'Pending' && (
            <Text style={{ fontSize: 10, color: colors.textMuted, fontStyle: 'italic' }}>
              Verification Date: {entry.verifiedDate}
            </Text>
          )}
        </View>
      )}

      {/* Faculty Remarks */}
      {entry.remarks && entry.remarks.trim() !== '' && (
        <View style={{ marginTop: 8, backgroundColor: isDark ? 'rgba(239,68,68,0.05)' : '#FEF2F2', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2' }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#DC2626' }}>Faculty Remarks:</Text>
          <Text style={{ fontSize: 12, color: colors.textPrimary, marginTop: 2 }}>{entry.remarks}</Text>
        </View>
      )}

      {/* Bottom Action Row (Student Sign-Off/Initial of learner) */}
      <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary }}>
          STUDENT SIGN-OFF:
        </Text>
        {isSignedOff ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#10B981' }}>COMPLETED</Text>
          </View>
        ) : isVerified ? (
          <TouchableOpacity
            onPress={() => onSignOff(entry)}
            disabled={isSubmitting}
            style={{ backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="create-outline" size={12} color="#FFF" />
            )}
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFF' }}>Sign Off Reflection</Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted }}>
            Waiting for Faculty Verification
          </Text>
        )}
      </View>
    </View>
  );
};

const PHASE_CURRICULUM = {
  '1': ['AN', 'PY', 'BC', 'BI', 'F'],
  '2': ['PA', 'PH', 'MI'],
  '3': ['FM', 'CM'],
  '4': ['IM', 'SU', 'PE', 'OG', 'OR', 'EN', 'OP', 'DR', 'PS', 'RD', 'AS', 'CT', 'DE', 'PM'],
};

const isSubjectInPhase = (subj, phaseStr) => {
  const code = (subj.subject_Code || subj.code || '').toUpperCase().trim();
  const name = (subj.subject_name || subj.name || '').toLowerCase().trim();
  const phase = String(phaseStr);

  const validCodes = PHASE_CURRICULUM[phase];
  if (validCodes && validCodes.includes(code)) {
    return true;
  }

  if (phase === '1') {
    return name.includes('anatomy') || name.includes('physiology') || name.includes('biochemistry') || name.includes('foundation');
  } else if (phase === '2') {
    return name.includes('pathology') || name.includes('pharmacology') || name.includes('pharmocology') || name.includes('microbiol');
  } else if (phase === '3') {
    return (name.includes('forensic') || name.includes('fmt')) || (name.includes('community') || name.includes('preventive') || name.includes('psm'));
  } else if (phase === '4') {
    return name.includes('medicine') || name.includes('surgery') || name.includes('pediatrics') || name.includes('paediatrics') ||
           name.includes('obstetrics') || name.includes('gynecology') || name.includes('gynaecology') || name.includes('obg') ||
           name.includes('ortho') || name.includes('ent') || name.includes('otorhinolaryngology') || name.includes('ophthalmology') ||
           name.includes('optha') || name.includes('dermatology') || name.includes('derma') || name.includes('psychiatry') ||
           name.includes('radiodiagnosis') || name.includes('radiology') || name.includes('anesthes') || name.includes('anaesthes') ||
           name.includes('respirat') || name.includes('respi') || name.includes('dentis') || name.includes('dental') || name.includes('pmr');
  }

  return false;
};

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
  const getInitialPhase = () => {
    if (user?.current_year) return String(user.current_year);
    const yr = parseInt(user?.batch_year || user?.year || '2024', 10);
    if (yr >= 2025) return '1';
    if (yr === 2024) return '2';
    if (yr === 2023) return '3';
    return '2';
  };

  const [activePhase, setActivePhase] = useState(getInitialPhase());
  const [showFilters, setShowFilters] = useState(false);
  const [showLegendModal, setShowLegendModal] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showReflectionForm, setShowReflectionForm] = useState(false);

  const STATUS_MAP = {
    'ALL': 'All Statuses',
    'FAC_VERIFIED': 'Faculty Verified',
    'FAC_PENDING': 'Faculty Pending',
    'STUD_VERIFIED': 'Student Verified',
    'STUD_PENDING': 'Student Pending'
  };
  const activeFilterLabel = STATUS_MAP[activeFilter] || 'All Statuses';
  const activeCategoryLabel = CATEGORY_PILLS.find(p => p.key === activeCategory)?.label || 'All Categories';

  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formTopic, setFormTopic] = useState('');
  const [formWhatHappened, setFormWhatHappened] = useState('');
  const [formSoWhat, setFormSoWhat] = useState('');
  const [formWhatNext, setFormWhatNext] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  const handleSaveReflection = async () => {
    if (!activeSubject) {
      Alert.alert('Subject Required', 'Please select a Subject from the filters before submitting a reflection.');
      return;
    }

    if (!formTopic.trim() || !formWhatHappened.trim() || !formSoWhat.trim() || !formWhatNext.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in all fields (Topic, What Happened, So What, What Next) before saving.');
      return;
    }

    const rollNumber = String(user?.username || user?.rollno || user?.id || '');
    if (!rollNumber) {
      Alert.alert('Error', 'Unable to retrieve your roll number. Please log in again.');
      return;
    }
    
    const userBatchYear = parseInt(user?.batch_year || user?.year || '2024', 10);
    const BATCH_YEAR_TO_CD = {
      2025: "66", 2024: "63", 2023: "60", 2022: "61",
      2021: "62", 2020: "64", 2019: "65"
    };
    const finalBatchcd = BATCH_YEAR_TO_CD[userBatchYear] || '63';
    const finalCbmeyear = userBatchYear <= 2023 ? '2023' : '2024';

    setFormSaving(true);
    try {
      const payload = {
        LMS_LogBook_ActivityData: {
          rollno: rollNumber,
          lbtype: 'RefSelfDirectedLearning',
          comp_code: '',
          actmstid: 0,
          cbmeyear: finalCbmeyear,
          batchcd: finalBatchcd,
          received: 0,
          colgcd: '11',
          coursetype: 'UG',
          coursecd: '1',
          branchcd: '1',
          phase: String(activePhase),
          subjcode: String(activeSubject.subject_Code),
          ActivityName: formTopic.trim(),
          Acdt: formDate,
          crtdt: formDate,
          A1: formWhatHappened.trim(),
          A2: formSoWhat.trim(),
          A3: formWhatNext.trim(),
          topiccode: 0,
          empid: '',
          VerifiedBy: '',
          VerifiedId: '',
          remarks: '',
          ac_status: 0,
          verified_dt: '1900-01-01 00:00:00'
        }
      };

      const response = await fetch('https://myportal.srms.ac.in/SRMSERP/PGMBBS/PracticalStudLabSave', {
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
        res.Mess === 'Save' ||
        res.message === 'Save' ||
        res.Mess === 'Update' ||
        res.message === 'Update'
      );

      if (isSuccess) {
        Alert.alert('Saved!', 'Your reflection has been submitted to the ERP successfully.');
        setFormTopic('');
        setFormWhatHappened('');
        setFormSoWhat('');
        setFormWhatNext('');
        setShowReflectionForm(false);
        // Refresh the list!
        loadLogbook(false);
        loadSubjectEntries(false);
      } else {
        Alert.alert('Save Failed', res?.Mess || res?.message || 'The ERP did not accept the submission. Please try again.');
      }
    } catch (err) {
      console.warn('[LogBookScreen] Save Reflection error:', err);
      Alert.alert('Error', 'Could not reach the ERP server. Please check your connection and try again.');
    } finally {
      setFormSaving(false);
    }
  };

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
              const parseErpDate = (dateStr) => {
                if (!dateStr) return 'Pending';
                const match = String(dateStr).match(/-?\d+/);
                if (!match) return 'Pending';
                const ms = parseInt(match[0], 10);
                if (ms <= 0) return 'Pending';
                return new Date(ms).toISOString().split('T')[0];
              };
              const dateStr = parseErpDate(act.Acdt || act.crtdt);
              const verifiedDate = parseErpDate(act.verified_dt);

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
                verifiedDate: verifiedDate,
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
      // Deduplicate by subject_Code and filter by current phase curriculum
      const seen = new Set();
      const filtered = list.filter(s => {
        if (!isSubjectInPhase(s, activePhase)) return false;
        if (seen.has(s.subject_Code)) return false;
        seen.add(s.subject_Code);
        return true;
      });
      if (!cancelled) setSubjectList(filtered);
      setSubjectsLoading(false);
    };
    fetchSubjects();
    return () => { cancelled = true; };
  }, [activePhase]);

  const loadSubjectEntries = async (showLoading = true) => {
    if (!activeSubject) {
      setSubjectEntries([]);
      return;
    }
    const rollno = user?.rollno || user?.id || user?.username;
    if (!rollno) return;
    if (showLoading) setSubjectEntriesLoading(true);

    // Resolve student entry batch details to determine batchcd
    const userBatchYear = parseInt(user?.batch_year || user?.year || '2024', 10);
    const BATCH_YEAR_TO_CD = {
      2025: "66", 2024: "63", 2023: "60", 2022: "61",
      2021: "62", 2020: "64", 2019: "65"
    };
    const finalBatchcd = BATCH_YEAR_TO_CD[userBatchYear] || '63';

    // cbmeyear corresponds to regulations curriculum year dynamically determined by student batch
    const finalCbmeyear = userBatchYear <= 2023 ? '2023' : '2024';

    let raw = [];
    if (activeCategory === 'ALL') {
      const categoriesToFetch = [
        'RefSelfDirectedLearning',
        'PracticalStudentLab',
        'CertificationSkills',
        'Vertical integration',
        'Early clinical exposure',
        'Visit to clinical department'
      ];
      try {
        const results = await Promise.all(
          categoriesToFetch.map(cat =>
            getStudentSubjectLogbook(
              rollno,
              activePhase,
              activeSubject.subject_Code,
              cat,
              finalCbmeyear,
              finalBatchcd
            )
          )
        );
        raw = results.flat();
      } catch (e) {
        console.warn('[LogBookScreen] Error in parallel category fetch:', e);
        raw = [];
      }
    } else {
      const fetchCat = activeCategory;
      raw = await getStudentSubjectLogbook(
        rollno,
        activePhase,
        activeSubject.subject_Code,
        fetchCat,
        finalCbmeyear,
        finalBatchcd
      );
    }

    // Normalise ERP raw entries to match existing logbook entry shape
    const parseErpDate = (dateStr) => {
      if (!dateStr) return 'Pending';
      const match = String(dateStr).match(/-?\d+/);
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
      date: parseErpDate(act.Acdt || act.crtdt),
      verifiedDate: parseErpDate(act.verified_dt),
      category: activeCategory === 'RefSelfDirectedLearning' ? 'RefSelfDirectedLearning' : (act.lbtype || (activeCategory !== 'ALL' ? activeCategory : 'PracticalStudentLab')),
      department: act.Department || activeSubject.subject_name || '',
      comp_code: act.comp_code || act.compCode || '',
      actmstid: act.actmstid ? String(act.actmstid) : '',
      cbmeyear: act.cbmeyear ? String(act.cbmeyear) : '',
      phase: String(activePhase),
      remarks: (act.remarks || act.Remarks || '').trim(),
    }));
    setSubjectEntries(normalised);
    setSubjectEntriesLoading(false);
  };

  // When a subject is selected, fetch its logbook entries directly from ERP
  useEffect(() => {
    let cancelled = false;
    if (!activeSubject) {
      setSubjectEntries([]);
      return;
    }
    loadSubjectEntries();
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

  const [signingOffId, setSigningOffId] = useState(null);

  const handleStudentSignOff = async (entry) => {
    setSigningOffId(entry.actmstid);
    try {
      const rollNumber = String(user?.username || user?.rollno || '');
      if (!rollNumber) {
        Alert.alert('Error', 'Unable to retrieve student roll number. Please try logging in again.');
        return;
      }
      const batchYear = String(user?.batch_year || user?.year || '');

      const payload = {
        LMS_LogBook_ActivityData: {
          rollno: rollNumber,
          lbtype: 'SelfDirectedLearning',
          comp_code: entry.comp_code || entry.competency || 'SDL',
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
        Alert.alert('Success', 'Reflection verification completed successfully.');
        loadLogbook(false);
      } else {
        Alert.alert('Error', res?.Mess || res?.message || 'Failed to verify log entry on ERP.');
      }
    } catch (err) {
      console.warn('[LogBookScreen] Error signing off:', err);
      Alert.alert('Error', 'An error occurred while communicating with the ERP.');
    } finally {
      setSigningOffId(null);
    }
  };

  // Use subjectEntries when a subject is selected, otherwise use the full logbook.
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

    // Filter by Category. Reflections are always filtered to SDL category regardless of subject state.
    let matchesCategory = true;
    if (activeCategory !== 'ALL') {
      if (activeCategory === 'RefSelfDirectedLearning') {
        matchesCategory = entry.category === 'SelfDirectedLearning' || entry.category === 'RefSelfDirectedLearning';
      } else {
        matchesCategory = entry.category === activeCategory;
      }
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
            } else if (passedStudent) {
              navigation.goBack();
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
                {/* 1. Subject Dropdown Filter (Locked to student's phase) */}
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>Subject</Text>
                    {subjectsLoading && (
                      <ActivityIndicator size={12} color={colors.primary} style={{ marginLeft: 6 }} />
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowSubjectPicker(true)}
                    activeOpacity={0.8}
                    style={[styles.dropdownTrigger, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Text style={[styles.dropdownTriggerText, { color: colors.textPrimary }]} numberOfLines={1}>
                      {activeSubject?.subject_name || 'All Subjects'}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>

                  {/* Loading overlay when fetching subject entries */}
                  {subjectEntriesLoading && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <ActivityIndicator size={12} color={colors.primary} />
                      <Text style={{ fontSize: 11, color: colors.primary }}>Loading {activeSubject?.subject_name} entries…</Text>
                    </View>
                  )}
                </View>

                {/* 2. Status and Category Dropdowns (Side-by-Side) */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  {/* Status Dropdown */}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.filterSectionTitle, { color: colors.textSecondary, marginBottom: 4 }]}>Status</Text>
                    <TouchableOpacity
                      onPress={() => setShowStatusPicker(true)}
                      activeOpacity={0.8}
                      style={[styles.dropdownTrigger, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <Text style={[styles.dropdownTriggerText, { color: colors.textPrimary }]} numberOfLines={1}>
                        {activeFilterLabel}
                      </Text>
                      <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Category Dropdown */}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.filterSectionTitle, { color: colors.textSecondary, marginBottom: 4 }]}>Category</Text>
                    <TouchableOpacity
                      onPress={() => setShowCategoryPicker(true)}
                      activeOpacity={0.8}
                      style={[styles.dropdownTrigger, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <Text style={[styles.dropdownTriggerText, { color: colors.textPrimary }]} numberOfLines={1}>
                        {activeCategoryLabel}
                      </Text>
                      <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Logbook entries list */}
          <View style={{ padding: 16, gap: 12 }}>
            {/* Show Subject Selection warning if Category is Reflection on Self-Directed Learning but no subject is selected */}
            {activeCategory === 'RefSelfDirectedLearning' && !activeSubject && (
              <View style={[styles.logbookCard, { backgroundColor: colors.card, borderColor: '#EF4444', borderLeftWidth: 4, borderLeftColor: '#EF4444', padding: 16, alignItems: 'center' }]}>
                <Ionicons name="alert-circle-outline" size={32} color="#EF4444" style={{ marginBottom: 8 }} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 4 }}>
                  Subject Selection Required
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
                  Please select a Subject from the filters above to submit or view your reflections.
                </Text>
              </View>
            )}

            {/* Show New Reflection Form Card if Category is Reflection on Self-Directed Learning, subject is selected, and form is active or no entries exist yet */}
            {activeCategory === 'RefSelfDirectedLearning' && activeSubject && !subjectEntriesLoading && (filteredLogbook.length === 0 || showReflectionForm) && (
              <View style={[styles.logbookCard, { backgroundColor: colors.card, borderColor: '#F59E0B', borderLeftWidth: 4, borderLeftColor: '#F59E0B' }]}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: colors.primary, marginBottom: 12 }}>
                  New Reflection on Self-Directed Learning
                </Text>
                
                {/* Date Input */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 }}>Date (YYYY-MM-DD)</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.8}
                    style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, height: 40, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }}
                  >
                    <Ionicons name="calendar-outline" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text style={{ flex: 1, fontSize: 13, color: colors.textPrimary }}>
                      {formDate}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Topic Input */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 }}>
                    Topic <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <TextInput
                    value={formTopic}
                    onChangeText={setFormTopic}
                    placeholder="Enter reflection topic"
                    placeholderTextColor={colors.textMuted}
                    style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 10, height: 40, fontSize: 13, color: colors.textPrimary, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }}
                  />
                </View>

                {/* What Happened Input */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 }}>
                    What Happened <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <TextInput
                    value={formWhatHappened}
                    onChangeText={setFormWhatHappened}
                    placeholder="Describe the event or learning experience"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: colors.textPrimary, minHeight: 60, textAlignVertical: 'top', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }}
                  />
                </View>

                {/* So What Input */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 }}>
                    So What <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <TextInput
                    value={formSoWhat}
                    onChangeText={setFormSoWhat}
                    placeholder="What did it mean to you / what did you learn?"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: colors.textPrimary, minHeight: 60, textAlignVertical: 'top', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }}
                  />
                </View>

                {/* What Next Input */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 }}>
                    What Next <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <TextInput
                    value={formWhatNext}
                    onChangeText={setFormWhatNext}
                    placeholder="How will you apply this learning?"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: colors.textPrimary, minHeight: 60, textAlignVertical: 'top', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }}
                  />
                </View>

                {/* Save button */}
                <TouchableOpacity
                  onPress={handleSaveReflection}
                  disabled={formSaving}
                  style={{ backgroundColor: '#F59E0B', height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6, opacity: formSaving ? 0.7 : 1 }}
                >
                  {formSaving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="save-outline" size={16} color="#FFF" />
                  )}
                  <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800' }}>
                    {formSaving ? 'Saving...' : 'Save Reflection'}
                  </Text>
                </TouchableOpacity>

                {/* Cancel button if there are existing entries */}
                {filteredLogbook.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setShowReflectionForm(false)}
                    disabled={formSaving}
                    style={{ borderWidth: 1.5, borderColor: colors.border, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 }}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '700' }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Show Add New Reflection button and Summary List Header when Category is Reflection on Self-Directed Learning and entries exist */}
            {activeCategory === 'RefSelfDirectedLearning' && filteredLogbook.length > 0 && (
              <View style={{ marginTop: 12 }}>
                {!showReflectionForm && (
                  <TouchableOpacity
                    onPress={() => {
                      setFormTopic('');
                      setFormWhatHappened('');
                      setFormSoWhat('');
                      setFormWhatNext('');
                      setFormDate(new Date().toISOString().split('T')[0]);
                      setShowReflectionForm(true);
                    }}
                    style={{
                      backgroundColor: '#F59E0B',
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      marginBottom: 12,
                      borderWidth: 1.5,
                      borderColor: '#D97706'
                    }}
                  >
                    <Ionicons name="add-circle" size={18} color="#FFF" />
                    <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800' }}>
                      + Add New Reflection
                    </Text>
                  </TouchableOpacity>
                )}
                <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary, marginBottom: 4 }}>
                  Final Summary List
                </Text>
              </View>
            )}

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
                // Reflection on Self-Directed Learning entries get a dedicated reflection UI
                if (entry.category === 'RefSelfDirectedLearning' || (entry.category === 'SelfDirectedLearning' && activeCategory === 'RefSelfDirectedLearning')) {
                  return (
                    <RefSummaryCard 
                      key={i} 
                      entry={entry} 
                      colors={colors} 
                      isDark={isDark} 
                      onSignOff={handleStudentSignOff} 
                      signingOffId={signingOffId} 
                    />
                  );
                }
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

      {/* Status Picker Modal */}
      <Modal
        visible={showStatusPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowStatusPicker(false)}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeaderLine, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Status</Text>
              <TouchableOpacity onPress={() => setShowStatusPicker(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              {Object.entries(STATUS_MAP).map(([key, val]) => {
                const isActive = activeFilter === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.modalOptionRow, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setActiveFilter(key);
                      setShowStatusPicker(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, { color: colors.textPrimary }, isActive && { color: colors.primary, fontWeight: '700' }]}>
                      {val}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowCategoryPicker(false)}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeaderLine, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              {CATEGORY_PILLS.map((pill) => {
                const isActive = activeCategory === pill.key;
                const catInfo = CATEGORY_MAP[pill.key] || CATEGORY_MAP['default'];
                const accentColor = pill.key === 'ALL' ? colors.primary : catInfo.color;

                return (
                  <TouchableOpacity
                    key={pill.key}
                    style={[styles.modalOptionRow, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setActiveCategory(pill.key);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={[
                        styles.catFilterIconBox,
                        { backgroundColor: isActive ? accentColor : (isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'), width: 24, height: 24 }
                      ]}>
                        {pill.key === 'ALL' ? (
                          <MaterialIcons name="grid-view" size={12} color={isActive ? '#FFF' : colors.textSecondary} />
                        ) : (
                          catInfo.iconType === 'materialcommunity' ? (
                            <MaterialCommunityIcons name={catInfo.icon} size={12} color={isActive ? '#FFF' : accentColor} />
                          ) : (
                            <MaterialIcons name={catInfo.icon} size={12} color={isActive ? '#FFF' : accentColor} />
                          )
                        )}
                      </View>
                      <Text style={[styles.modalOptionText, { color: colors.textPrimary }, isActive && { color: accentColor, fontWeight: '700' }]}>
                        {pill.label}
                      </Text>
                    </View>
                    {isActive && <Ionicons name="checkmark" size={18} color={accentColor} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Subject Picker Modal */}
      <Modal
        visible={showSubjectPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubjectPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowSubjectPicker(false)}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeaderLine, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Subject</Text>
              <TouchableOpacity onPress={() => setShowSubjectPicker(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              {/* All Subjects option */}
              <TouchableOpacity
                style={[styles.modalOptionRow, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setActiveSubject(null);
                  setShowSubjectPicker(false);
                }}
              >
                <Text style={[styles.modalOptionText, { color: colors.textPrimary }, !activeSubject && { color: colors.primary, fontWeight: '700' }]}>
                  All Subjects
                </Text>
                {!activeSubject && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>

              {/* Subject list */}
              {subjectList.map((subj) => {
                const isActive = activeSubject?.subject_Code === subj.subject_Code;
                return (
                  <TouchableOpacity
                    key={subj.subject_Code}
                    style={[styles.modalOptionRow, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setActiveSubject(subj);
                      setShowSubjectPicker(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, { color: colors.textPrimary }, isActive && { color: colors.primary, fontWeight: '700' }]} numberOfLines={1}>
                      {subj.subject_name}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Calendar Date Picker Modal */}
      <CalendarModal
        visible={showDatePicker}
        date={new Date(formDate)}
        colors={colors}
        isDark={isDark}
        onSelect={(newDate) => {
          const yyyy = newDate.getFullYear();
          const mm = String(newDate.getMonth() + 1).padStart(2, '0');
          const dd = String(newDate.getDate()).padStart(2, '0');
          setFormDate(`${yyyy}-${mm}-${dd}`);
        }}
        onClose={() => setShowDatePicker(false)}
      />
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
  catFilterGridItem: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 46,
    marginBottom: 2,
  },
  catFilterIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catFilterGridText: {
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
    lineHeight: 13,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  dropdownTriggerText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '60%',
  },
  modalHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  modalOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
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
  },
  reflectionInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    minHeight: 90,
    lineHeight: 20,
  },
  reflectionSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 13,
    borderRadius: 14,
  },
  reflectionSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default ERPLogBookScreen;
