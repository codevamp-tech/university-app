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

const getParentSubjectName = (name, code) => {
  const c = (code || '').trim().toUpperCase();
  if (c === 'AN') return 'Anatomy';
  if (c === 'PY') return 'Physiology';
  if (c === 'BC') return 'Biochemistry_(CBME 2024)';
  if (c === 'BI') return 'Biochemistry_(CBME 2019)';
  if (c === 'PA') return 'Pathology';
  if (c === 'PH') return 'Pharmacology';
  if (c === 'MI') return 'Microbiology';
  if (c === 'FM') return 'FORENSIC MEDICINE';
  if (c === 'CM') return 'Community Medicine';
  if (c === 'IM') return 'General Medicine';
  if (c === 'SU') return 'GENERAL SURGERY';
  if (c === 'PE') return 'PAEDIATRICS';
  if (c === 'OG') return 'Obstetrics & Gynaecology';
  if (c === 'OP') return 'Ophthalmology';
  if (c === 'OR') return 'Orthopedics';
  if (c === 'EN') return 'Otorhinolaryngology';
  if (c === 'RD') return 'Radiodiagnosis';
  if (c === 'DE') return 'Dentistry';
  if (c === 'AS') return 'Anesthesiology';
  if (c === 'DR') return 'Dermatology, Venereology & Leprosy';
  if (c === 'CT') return 'Respiratory Medicine';
  if (c === 'PS') return 'Psychiatry';
  if (c === 'PM') return 'Physical Medicine & Rehabilitation';

  const n = (name || '').trim();
  const lower = n.toLowerCase();

  if (lower.includes('anatomy')) return 'Anatomy';
  if (lower.includes('physiology')) return 'Physiology';
  if (lower.includes('biochemistry')) {
    if (lower.includes('2024')) return 'Biochemistry_(CBME 2024)';
    if (lower.includes('2019')) return 'Biochemistry_(CBME 2019)';
    return 'Biochemistry_(CBME 2024)';
  }
  if (lower.includes('pathology')) return 'Pathology';
  if (lower.includes('pharmacology')) return 'Pharmacology';
  if (lower.includes('microb')) return 'Microbiology';
  if (lower.includes('forensic') || lower.includes('fmt')) return 'FORENSIC MEDICINE';
  if (lower.includes('community') || lower.includes('preventive') || lower.includes('psm') || lower.includes('family') || lower.includes('fap')) return 'Community Medicine';

  if (lower.includes('medicine') && !lower.includes('forensic') && !lower.includes('community') && !lower.includes('preventive') && !lower.includes('respiratory') && !lower.includes('physical')) {
    return 'General Medicine';
  }
  if (lower.includes('surgery')) return 'GENERAL SURGERY';
  if (lower.includes('pediatrics') || lower.includes('paediatrics')) return 'PAEDIATRICS';
  if (lower.includes('obstetrics') || lower.includes('gynecology') || lower.includes('gynaecology') || lower.includes('obg')) {
    return 'Obstetrics & Gynaecology';
  }
  if (lower.includes('ortho')) return 'Orthopedics';
  if (lower.includes('ent') || lower.includes('otorhinolaryngology') || lower.includes('otorhinolarygology') || lower.includes('e.n.t.')) return 'Otorhinolaryngology';
  if (lower.includes('ophthalmology') || lower.includes('optha') || lower.includes('eye')) return 'Ophthalmology';
  if (lower.includes('dermatology') || lower.includes('derma')) return 'Dermatology, Venereology & Leprosy';
  if (lower.includes('psychiatry')) return 'Psychiatry';
  if (lower.includes('radio') || lower.includes('x-ray')) return 'Radiodiagnosis';
  if (lower.includes('anesthesia') || lower.includes('anaesthesia') || lower.includes('anesthesiology')) return 'Anesthesiology';
  if (lower.includes('respiratory') || lower.includes('chest') || lower.includes('tb')) return 'Respiratory Medicine';
  if (lower.includes('dentistry') || lower.includes('dental')) return 'Dentistry';
  if (lower.includes('physical medicine') || lower.includes('pmr') || lower.includes('rehabilitation')) {
    return 'Physical Medicine & Rehabilitation';
  }

  return n.split(' ')[0];
};

// Standard MBBS abbreviation codes matching GetXtraFeeAmt and user specification
const SUBJECT_CODE_MAP = {
  'Anatomy': 'AN',
  'Physiology': 'PY',
  'Biochemistry_(CBME 2024)': 'BC',
  'Biochemistry_(CBME 2019)': 'BI',
  'Biochemistry': 'BC',
  'Community Medicine': 'CM',
  'Pathology': 'PA',
  'Pharmacology': 'PH',
  'Microbiology': 'MI',
  'FORENSIC MEDICINE': 'FM',
  'Forensic Medicine': 'FM',
  'General Medicine': 'IM',
  'Medicine': 'IM',
  'GENERAL SURGERY': 'SU',
  'Surgery': 'SU',
  'PAEDIATRICS': 'PE',
  'Pediatrics': 'PE',
  'Obstetrics & Gynaecology': 'OG',
  'Obs and gynae': 'OG',
  'Ophthalmology': 'OP',
  'Optha': 'OP',
  'Orthopedics': 'OR',
  'Ortho': 'OR',
  'Otorhinolaryngology': 'EN',
  'Ent': 'EN',
  'Radiodiagnosis': 'RD',
  'Dentistry': 'DE',
  'Anesthesiology': 'AS',
  'Anesthesia': 'AS',
  'Dermatology, Venereology & Leprosy': 'DR',
  'Derma': 'DR',
  'Respiratory Medicine': 'CT',
  'Respi': 'CT',
  'Psychiatry': 'PS',
  'Physical Medicine & Rehabilitation': 'PM',
};
const getSubjectCode = (parentName) => SUBJECT_CODE_MAP[parentName] || parentName.substring(0, 2).toUpperCase();

// Mapping of subcategory names to actual 5-digit ERP subject codes
const ERP_SUBJECT_MAP = {
  "ANATOMY-THEORY": "84395",
  "PHYSIOLOGY-THEORY": "84396",
  "BIOCHEMISTRY-THEORY": "84397",
  "ANATOMY-DISSECTION/HISTOLOGY": "84398",
  "PHYSIOLOGY-PRACTICAL": "84399",
  "BIOCHEMISTRY-PRACTICAL": "84400",
  "COMMUNITY MEDICINE-THEORY": "84401",
  "COMMUNITY MEDICINE-PRACTICAL": "84402",
  "PANDEMIC MODULE-MICROBOLOGY": "84403",
  "PANDEMIC MODULE-MICROBIOLOGY": "84403",
  "ECE-ANATOMY": "84404",
  "ECE-PHYSIOLOGY": "84405",
  "ECE-BIOCHEMISTRY": "84406",
  "AETCOM-ANATOMY": "84407",
  "AETCOM-PHYSIOLOGY": "84408",
  "AETCOM-BIOCHEMISTRY": "84409",
  "AITO-PHYSIOLOGY": "84410",
  "SPORTS & EXTRACURRICULAR ACTIVITIES (SEA)": "84817",
  "SDL-ANATOMY": "84818",
  "SDL-PHYSIOLOGY": "84819",
  "SDL-BIOCHEMISTRY": "84820",
  "AITO-ANATOMY": "84821",
  "AITO-BIOCHEMISTRY": "84822",
  "PATHOLOGY-THEORY": "85790",
  "PATHOLOGY-PRACTICAL": "85791",
  "MICROBIOLOGY-THEORY": "85792",
  "MICROBIOLOGY-PRACTICAL": "85793",
  "PHARMACOLOGY-THEORY": "85794",
  "PHARMACOLOGY-PRACTICAL": "85795",
  "GENERAL MEDICINE-THEORY": "85796",
  "GENERAL MEDICINE-PRACTICAL": "85797",
  "GENERAL SURGERY-THEORY": "85798",
  "GENERAL SURGERY-PRACTICAL": "85799",
  "OBSTETRICS & GYNAECOLOGY-THEORY": "85800",
  "OBSTETRICS & GYNAECOLOGY-PRACTICAL": "85801",
  "FORENSIC MEDICINE & TOXICOLOGY-THEORY": "85802",
  "FORENSIC MEDICINE & TOXICOLOGY-PRACTICAL": "85803",
  "CLINICAL POSTING-GENERAL MEDICINE": "85804",
  "CLINICAL POSTING-GENERAL SURGERY": "85805",
  "CLINICAL POSTING-OBSTETRICS & GYNAECOLOGY": "85806",
  "CLINICAL POSTING-PAEDIATRICS": "85807",
  "CLINICAL POSTING-COMMUNITY MEDICINE": "85808",
  "CLINICAL POSTING-DERMATOLOGY, VENEREOLOGY & LEPROSY": "85809",
  "CLINICAL POSTING-ORTHOPAEDICS": "85810",
  "CLINICAL POSTING-DENTISTRY": "85811",
  "AETCOM MODULE-PHARMACOLOGY": "85812",
  "AETCOM MODULE-PATHOLOGY": "85813",
  "FAMILY ADOPTION PROGRAM-COMMUNITY MEDICINE": "85814",
  "PANDEMIC MODULE-GENERAL MEDICINE": "86328",
  "AETCOM MODULE-MICROBIOLOGY": "86331",
  "PANDEMIC MODULE-PHARMACOLOGY": "86415",
  "OPHTHALMOLOGY-THEORY": "87247",
  "OTORHINOLARYNGOLOGY (E.N.T.)-THEORY": "87248",
  "OPHTHALMOLOGY-PRACTICAL": "87249",
  "OTORHINOLARYNGOLOGY (E.N.T.)-PRACTICAL": "87250",
  "ORTHOPAEDICS-THEORY": "87251",
  "ORTHOPAEDICS-PRACTICAL": "87252",
  "PAEDIATRICS-THEORY": "87253",
  "PAEDIATRICS-PRACTICAL": "87254",
  "CLINICAL POSTINGS-OPHTHALMOLOGY": "87255",
  "CLINICAL POSTINGS-OTORHINOLARYGOLOGY (E.N.T.)": "87256",
  "CLINICAL POSTINGS-PSYCHIATRY": "87257",
  "AETCOM MODULE-FORENSIC MEDICINE & TOXICOLOGY": "87258",
  "AETCOM MODULE-COMMUNITY MEDICINE": "87259",
  "PANDEMIC MODULE-COMMUNITY MEDICINE": "87260",
  "AETCOM MODULE-OTORHINOLARYNGOLOEY (ENT)": "87574",
  "AETCOM MODULE-OPHTHALMOLOGY": "87575"
};

// ── Canonical subcategory types per subject code (as defined by client) ───────
// This defines exactly which type labels should appear under each subject.
const SUBJECT_SUBCATEGORY_TYPES = {
  // 1st Year
  'AN': ['Theory', 'Practical', 'AETCOM'],
  'PY': ['Theory', 'Practical', 'AETCOM'],
  'BC': ['Theory', 'Practical', 'AETCOM'],
  'BI': ['Theory', 'Practical', 'AETCOM'],
  // 2nd Year
  'PA': ['Theory', 'Practical', 'AETCOM'],
  'PH': ['Theory', 'Practical', 'AETCOM'],
  'MI': ['Theory', 'Practical', 'AETCOM', 'Pandemic'],
  // 3rd Year
  'FM': ['Theory', 'Practical', 'AETCOM'],
  'CM': ['Theory', 'Practical', 'Pandemic', 'AETCOM', 'Clinical Posting'],
  // 4th Year
  'IM': ['Theory', 'Practical', 'AETCOM', 'Clinical Posting'],
  'MD': ['Theory', 'Practical', 'AETCOM', 'Clinical Posting'],
  'SU': ['Theory', 'Practical', 'Clinical Posting', 'AETCOM'],
  'PD': ['Theory', 'Practical', 'Clinical Posting', 'AETCOM'],
  'PE': ['Theory', 'Practical', 'Clinical Posting', 'AETCOM'],
  'OG': ['Theory', 'Practical', 'Clinical Posting', 'AETCOM'],
  'OR': ['Theory', 'Practical', 'Clinical Posting'],
  'EN': ['Theory', 'Practical', 'Clinical Posting'],
  'OP': ['Theory', 'Practical', 'Clinical Posting'],
  'DR': ['Theory', 'Clinical Posting'],
  'PS': ['Theory', 'Practical', 'Clinical Posting'],
  'RD': ['Theory', 'Practical', 'Clinical Posting'],
  'AS': ['Theory', 'Practical'],
  'CT': ['Theory', 'Practical'],
  'DE': ['Clinical Posting'],
  'DN': ['Clinical Posting'],
};

/**
 * Given a raw ERP subcategory name (e.g. "ANATOMY-THEORY", "AETCOM-ANATOMY",
 * "CLINICAL POSTING-GENERAL MEDICINE"), return a clean canonical label
 * (Theory, Practical, AETCOM, Pandemic, Clinical Posting, Family Adoption).
 */
const getCanonicalSubcategoryLabel = (rawName) => {
  const lower = (rawName || '').toLowerCase();
  if (lower.includes('aetcom')) return 'AETCOM';
  if (lower.includes('family adoption') || lower.includes('fap')) return 'Family Adoption';
  if (lower.includes('pandemic')) return 'Pandemic';
  if (lower.includes('clinical posting') || lower.includes('clinical postings')) return 'Clinical Posting';
  if (lower.includes('practical') || lower.includes('dissection') || lower.includes('histology') || lower.includes('lab')) return 'Practical';
  if (lower.includes('theory')) return 'Theory';
  if (lower.includes('sdl')) return 'SDL';
  if (lower.includes('ece')) return 'ECE';
  if (lower.includes('aito')) return 'AITO';
  if (lower.includes('sea') || lower.includes('extracurricular')) return 'SEA';
  return rawName; // fallback: show as-is
};

const getSubcategoryCategory = (name) => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('aetcom')) return 'AETCOM';
  if (lower.includes('family adoption') || lower.includes('family planning') || lower.includes('fap')) return 'PRACTICAL';
  if (lower.includes('pandemic')) return 'PANDEMIC';
  if (lower.includes('clinical posting') || lower.includes('clinical postings')) return 'CLINICAL_POSTING';
  if (lower.includes('practical') || lower.includes('dissection') || lower.includes('histology') || lower.includes('lab')) return 'PRACTICAL';
  if (lower.includes('theory')) return 'THEORY';
  return 'OTHER';
};



const ERPAttendanceScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user: contextUser, accessToken } = useUser();
  const passedStudent = route?.params?.student;
  const user = passedStudent || contextUser;
  const isFaculty = contextUser && contextUser.role === 'teacher';

  const [apiAttendance, setApiAttendance] = React.useState(null);
  const [dynamicSubjectCodes, setDynamicSubjectCodes] = React.useState({});
  const [loading, setLoading] = React.useState(true);

  const [expandedPhase, setExpandedPhase] = React.useState(null);
  const [expandedSubject, setExpandedSubject] = React.useState(null);

  // ─── Attendance Detail Modal (subcategory tap) ────────────────────────────
  const [detailModal, setDetailModal] = React.useState({ visible: false, subCatName: '', erpCode: null, records: [], loading: false, error: null });
  const [historyFilter, setHistoryFilter] = React.useState('ALL'); // 'ALL', 'P', 'A'
  const [activeCategoryFilter, setActiveCategoryFilter] = React.useState('ALL'); // 'ALL', 'THEORY', 'PRACTICAL', 'AETCOM', 'SDL'
  // ─── Today's Attendance Modal (eye icon) ─────────────────────────────────
  const [todayModal, setTodayModal] = React.useState({ visible: false, subjectName: '', rows: [], loading: false, error: null });

  // ─── Pulse Animation for Skeleton Loader ──────────────────────────────────
  const shimmerAnim = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    let animation;
    if (detailModal.loading) {
      shimmerAnim.setValue(0.3);
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      if (animation) {
        animation.stop();
      }
    }
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [detailModal.loading]);

  const studentUid = user?.rollno || user?.username || user?.id || '';

  const openDetailModal = React.useCallback(async (subCatName, erpCode) => {
    setHistoryFilter('ALL');
    setDetailModal({ visible: true, subCatName, erpCode, records: [], loading: true, error: null });
    try {
      const resp = await fetch('https://myportal.srms.ac.in/SRMSERP/Home/GetAttendanceRollNoSubjectWsie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: String(studentUid), sub_cd: String(erpCode), Curr_colgcd: '11' }),
      });
      const json = await resp.json();
      const records = Array.isArray(json) ? json : (json?.d ? JSON.parse(json.d) : []);

      const parseDate = (dStr) => {
        if (!dStr) return 0;
        const parts = dStr.split('/');
        if (parts.length !== 3) return 0;
        return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
      };

      const sortedRecords = [...records].sort((a, b) => {
        const da = parseDate(a.lecturedt || a.LectureDate || a.lecture_date);
        const db = parseDate(b.lecturedt || b.LectureDate || b.lecture_date);
        return db - da;
      });

      setDetailModal(prev => ({ ...prev, loading: false, records: sortedRecords }));
    } catch (e) {
      setDetailModal(prev => ({ ...prev, loading: false, error: 'Failed to load attendance details.' }));
    }
  }, [studentUid]);

  const openTodayModal = React.useCallback(async (subjectName, subCategories) => {
    setTodayModal({ visible: true, subjectName, rows: [], loading: true, error: null });
    try {
      // Step 1: Get the authoritative subject list from ERP for this student
      let erpSubjects = [];
      try {
        const subResp = await fetch(
          `https://myportal.srms.ac.in/SRMSERP/Faculty/GetUGSubjectCode?stud_roll_no=${studentUid}`,
          { method: 'GET' }
        );
        const subJson = await subResp.json();
        erpSubjects = subJson.success && Array.isArray(subJson.data)
          ? subJson.data
          : Array.isArray(subJson) ? subJson : [];
      } catch (e) {
        console.warn('[TodayModal] Failed to fetch GetUGSubjectCode:', e);
      }

      // Step 2: Match ERP subjects to subCategories by name
      // For each subCategory, find its ERP code (sub_cd) from GetUGSubjectCode
      const subCatCodes = subCategories.map(sc => {
        const nameUpper = (sc.name || '').toUpperCase().trim();
        // Find matching ERP subject (by name similarity)
        const erpMatch = erpSubjects.find(s => {
          const erpUpper = (s.sub_name || '').toUpperCase().trim();
          return erpUpper === nameUpper || erpUpper.includes(nameUpper) || nameUpper.includes(erpUpper);
        });
        return {
          name: sc.name,
          erpCode: erpMatch?.sub_cd || sc.erpCode || sc.code,
        };
      });

      // Step 3: For each sub_cd, check GetTodayLecture then GetStudentLectureRollnoWise
      const results = await Promise.all(
        subCatCodes.map(async (sc) => {
          if (!sc.erpCode) return null;
          try {
            const todayLectureResp = await fetch(
              `https://myportal.srms.ac.in/SRMSERP/Faculty/GetTodayLecture?stud_roll_no=${studentUid}&sub_cd=${sc.erpCode}`,
              { method: 'GET' }
            );
            const todayLectureJson = await todayLectureResp.json();
            const lectures = todayLectureJson.success && Array.isArray(todayLectureJson.data)
              ? todayLectureJson.data
              : Array.isArray(todayLectureJson) ? todayLectureJson : [];

            if (lectures.length === 0) {
              return null; // Not scheduled today
            }

            const lecturecd = lectures[0].ID || lectures[0].id;
            const resp = await fetch('https://myportal.srms.ac.in/SRMSERP/Home/GetStudentLectureRollnoWise', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ uid: String(studentUid), lecturecd: String(lecturecd) }),
            });
            const json = await resp.json();
            const rows = Array.isArray(json) ? json : (json?.d ? JSON.parse(json.d) : []);
            return { name: sc.name, data: rows, scheduled: true };
          } catch {
            return null;
          }
        })
      );

      // Only show subjects that have lectures scheduled today
      const activeRows = results.filter(r => r !== null);
      setTodayModal(prev => ({ ...prev, loading: false, rows: activeRows }));
    } catch (e) {
      setTodayModal(prev => ({ ...prev, loading: false, error: "Failed to load today's attendance." }));
    }
  }, [studentUid]);

  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const isMedical = user?.course?.replace(/\./g, '').toUpperCase().includes('MBBS') || user?.category?.toLowerCase() === 'medical';

  // For MBBS students: use current_year (= ERP phase 1/2/3/4) directly.
  // The backend sets current_year = batch phase from the ERP, never from academic records.
  // semester is intentionally null for MBBS students — do NOT use it.
  const getMedicalProfNameFromYear = (yr) => {
    const y = parseInt(yr) || 1;
    if (y <= 1) return '1st Prof';
    if (y === 2) return '2nd Prof';
    if (y === 3) return '3rd Prof Part I';
    return '3rd Prof Part II';
  };
  const getMedicalProfNameFromSemLocal = getMedicalProfNameFromYear; // keep alias for internal use

  const getPhaseRomanLocal = (yr) => {
    const y = parseInt(yr) || 1;
    if (y <= 1) return 'I';
    if (y === 2) return 'II';
    if (y === 3) return 'III';
    return 'IV';
  };

  // medYear: ERP phase (1=1st Prof, 2=2nd Prof, 3=3rd Prof Part I, 4=3rd Prof Part II)
  const medYear = (() => {
    // For MBBS, batch_year is the authoritative source of truth for the phase.
    // Prioritize it over current_year/year to bypass stale cached profiles.
    const by = parseInt(user?.batch_year || user?.batchYear || 0);
    if (by >= 2025) return 1;
    if (by === 2024) return 2;
    if (by === 2023) return 3;
    if (by > 0 && by <= 2022) return 4;

    const cy = parseInt(user?.current_year) || parseInt(user?.year);
    if (cy && cy >= 1 && cy <= 4) return cy;
    return 1;
  })();
  // semNum: only used for non-medical semester display
  const semNum = isMedical ? (medYear * 2 - 1) : (parseInt(user?.semester) || 1);

  const currentSemRoman = roman[semNum - 1] || 'I';
  const currentPhaseName = isMedical ? getMedicalProfNameFromYear(medYear) : `Semester ${currentSemRoman}`;
  const displaySem = isMedical ? getPhaseRomanLocal(medYear) : currentSemRoman;
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
      const studentId = user?.rollno || user?.username || user?.id;

      // ── Step 1: fetch ERP subject list (authoritative list of subjects + ERP codes) ──
      let erpSubjectList = []; // [{sub_name, sub_cd, department}]
      try {
        const cacheBuster = force ? `&_t=${Date.now()}` : '';
        const getSubResp = await fetch(`https://myportal.srms.ac.in/SRMSERP/Faculty/GetUGSubjectCode?stud_roll_no=${studentId}${cacheBuster}`, {
          method: 'GET',
          headers: force ? { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' } : {}
        });
        const resJson = await getSubResp.json();
        erpSubjectList = resJson.success && Array.isArray(resJson.data) ? resJson.data : [];

        const dynamicMap = {};
        erpSubjectList.forEach(s => {
          if (s.sub_name && s.sub_cd) {
            dynamicMap[s.sub_name.toUpperCase().trim()] = s.sub_cd;
          }
        });
        setDynamicSubjectCodes(dynamicMap);
      } catch (subErr) {
        console.warn('[AttendanceScreen] Failed to fetch ERP subject codes:', subErr);
      }

      // ── Step 2: fetch backend attendance AND live ERP attendance ──
      // Backend may not have synced all subjects yet, so we ALSO call the ERP
      // attendance endpoint directly to get live percentages for every subject.
      const data = await getAttendance(accessToken, studentId, force);

      // Build a lookup map: SUBJECT_NAME_UPPER → attendance record (backend)
      const backendMap = {};
      if (data && data.length > 0) {
        data.forEach(item => {
          if (item.subject_name) {
            backendMap[item.subject_name.toUpperCase().trim()] = item;
          }
        });
      }

      // ── Step 2.5: fetch live ERP attendance directly (fills gaps backend hasn't synced) ──
      // The ERP endpoint is the same one the backend syncs from. By calling it directly
      // we ensure ALL registered subjects get their real percentage, not 0%.
      try {
        const batchCandidates = ['63', '60', '66', '61', '62', '64', '65', '67', '68', '69', '70'];
        const cacheBuster = force ? `&_t=${Date.now()}` : '';
        for (const bcd of batchCandidates) {
          try {
            const erpAttResp = await fetch(
              `https://myportal.srms.ac.in/SRMSERP/Faculty/getattendancementees?roll_no=${studentId}&batch_cd=${bcd}${cacheBuster}`,
              {
                method: 'GET',
                headers: force ? { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' } : {}
              }
            );
            if (erpAttResp.ok) {
              const erpAttData = await erpAttResp.json();
              if (Array.isArray(erpAttData) && erpAttData.length > 0) {
                // Supplement backendMap with ERP live data for any missing subjects
                erpAttData.forEach(item => {
                  const nameUpper = (item.sub_name || '').toUpperCase().trim();
                  if (nameUpper && !backendMap[nameUpper]) {
                    // Not in backend yet — add directly from ERP with real percentage
                    backendMap[nameUpper] = {
                      subject_name: item.sub_name,
                      subject_code: String(item.dpid || ''),
                      attendance_pct: parseFloat(item.perc || 0),
                      semester: null, // will be resolved by phase mapping
                    };
                  } else if (nameUpper && backendMap[nameUpper]) {
                    // Backend has it — prefer ERP live data for freshness
                    backendMap[nameUpper].attendance_pct = parseFloat(item.perc || 0);
                  }
                });
                break; // found valid batch, stop trying
              }
            }
          } catch (_) { /* try next batch */ }
        }
      } catch (erpAttErr) {
        console.warn('[AttendanceScreen] Direct ERP attendance fetch failed:', erpAttErr);
      }

      // ── Step 3: build subject list ──
      // Primary: use ERP subject list (correct names + codes), merge percentages from
      // backendMap (which now includes both backend-synced AND ERP-live data).
      // Fallback: if ERP subject list is empty, use backend records directly.
      let subjects = [];

      if (erpSubjectList.length > 0) {
        // Use ERP list as the source of truth for subject names and codes.
        subjects = erpSubjectList
          .filter(s => {
            if (!s.sub_name || !s.sub_cd) return false;
            const nameUpper = s.sub_name.toUpperCase().trim();
            const code = String(s.sub_cd).trim();
            if (code === '84817' || nameUpper.includes('SPORTS') || nameUpper.includes('EXTRACURRICULAR')) {
              return false;
            }
            return true;
          })
          .map(s => {
            const nameUpper = s.sub_name.toUpperCase().trim();
            const backendRecord = backendMap[nameUpper];
            const percentage = backendRecord
              ? Math.round(backendRecord.attendance_pct || 0)
              : null; // null = ERP returned this subject but with no recorded lectures yet

            const isPractical = nameUpper.includes('PRACTICAL') ||
              nameUpper.includes('CLINICAL') ||
              nameUpper.includes('DISSECTION') ||
              nameUpper.includes('POSTING') ||
              nameUpper.includes('LAB');
            const requiredPct = isPractical ? 80 : 75;

            const status = percentage === null
              ? 'safe' // unknown → treat as safe (no class yet)
              : percentage >= requiredPct
                ? 'safe'
                : percentage >= (requiredPct - 5)
                  ? 'warning'
                  : 'danger';

            // For MBBS: use subject-name-based phase mapping (NOT backend semester which is wrong).
            // We pass medYear as the fallback semester so grouping works correctly.
            return {
              code: s.sub_cd,
              name: s.sub_name,
              percentage: percentage !== null ? percentage : 0,
              hasData: percentage !== null,
              status,
              isPractical,
              requiredPct,
              // semester intentionally set to medYear for MBBS so phase mapping falls back correctly
              semester: isMedical ? medYear : (backendRecord?.semester || semNum),
            };
          })
          // Always show ALL ERP-registered subjects.
          // Subjects not yet in backend show 0% — they are registered but classes haven't
          // been recorded yet. The hasData flag can be used for dimming if needed.
      } else if (data && data.length > 0) {
        // Fallback: use backend records directly
        const validRecords = data.filter(item => {
          if (item.attendance_pct === null || item.attendance_pct === undefined) return false;
          const nameUpper = (item.subject_name || item.subject_code || '').toUpperCase().trim();
          const code = String(item.subject_code || '').trim();
          if (code === '84817' || nameUpper.includes('SPORTS') || nameUpper.includes('EXTRACURRICULAR')) {
            return false;
          }
          return true;
        });
        subjects = validRecords.map(item => {
          const percentage = Math.round(item.attendance_pct || 0);
          const nameUpper = (item.subject_name || item.subject_code || '').toUpperCase();
          const isPractical = nameUpper.includes('PRACTICAL') ||
            nameUpper.includes('CLINICAL') ||
            nameUpper.includes('DISSECTION') ||
            nameUpper.includes('POSTING') ||
            nameUpper.includes('LAB');
          const requiredPct = isPractical ? 80 : 75;
          const status = percentage >= requiredPct
            ? 'safe'
            : percentage >= (requiredPct - 5)
              ? 'warning'
              : 'danger';
          return {
            code: item.subject_code,
            name: item.subject_name || item.subject_code,
            percentage,
            hasData: true,
            status,
            isPractical,
            requiredPct,
            // CRITICAL FIX: backend semester is always 1 for MBBS students (sync bug).
            // Override with medYear so phase mapping works correctly.
            semester: item.semester || item.sem_no || item.sem_year || (isMedical ? medYear : semNum),
          };
        });
      }

      if (subjects.length > 0) {
        const overall = Math.round(
          subjects.reduce((sum, s) => sum + s.percentage, 0) / subjects.length
        );

        setApiAttendance({
          overall: user?.attendance || overall,
          totalClasses: subjects.length * 30,
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
  }, [accessToken, user?.rollno, user?.id, user?.username, user?.attendance, isMedical, medYear, semNum, user?.batch_year]);


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
    const ALL_MEDICAL_PHASES = ['1st Prof', '2nd Prof', '3rd Prof Part I', '3rd Prof Part II'];
    // For MBBS, only show phases up to (and including) the student's current phase
    const currentPhaseIdx = isMedical ? ALL_MEDICAL_PHASES.indexOf(currentPhaseName) : -1;
    const order = isMedical
      ? ALL_MEDICAL_PHASES.slice(0, currentPhaseIdx + 1)
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

    // ── Direct parent-name → MBBS phase mapping ──────────────────────────────
    const PARENT_NAME_TO_PHASE = {
      // 1st Prof (1st Year) ─ 4 Subjects: AN, PY, BC, CM (84401, 84402)
      'Anatomy':                       '1st Prof',
      'Physiology':                    '1st Prof',
      'Biochemistry_(CBME 2024)':      '1st Prof',
      'Biochemistry_(CBME 2019)':      '1st Prof',
      'Biochemistry':                  '1st Prof',

      // 2nd Prof (2nd Year) ─ 9 Subjects: PA, PH, MI, Gen Med, Gen Surg, OBG, Paed, Derm, Ortho (+ Dentistry, FMT)
      'Pathology':                     '2nd Prof',
      'Pharmacology':                  '2nd Prof',
      'Microbiology':                  '2nd Prof',

      // 3rd Prof Part I (3rd Year) ─ 11 Subjects: CM, FMT, Ophtha, ENT, Gen Med, Gen Surg, OBG, Paed, Ortho, Derm, Dentistry
      'FORENSIC MEDICINE':             '3rd Prof Part I',
      'Community Medicine':            '3rd Prof Part I',

      // 3rd Prof Part II (4th Year)
      'General Medicine':              '3rd Prof Part II',
      'GENERAL SURGERY':               '3rd Prof Part II',
      'PAEDIATRICS':                   '3rd Prof Part II',
      'Obstetrics & Gynaecology':      '3rd Prof Part II',
      'Orthopedics':                   '3rd Prof Part II',
      'Otorhinolaryngology':           '3rd Prof Part II',
      'Ophthalmology':                 '3rd Prof Part II',
      'Dermatology, Venereology & Leprosy': '3rd Prof Part II',
      'Psychiatry':                    '3rd Prof Part II',
      'Radiodiagnosis':                '3rd Prof Part II',
      'Anesthesiology':                '3rd Prof Part II',
      'Respiratory Medicine':          '3rd Prof Part II',
      'Dentistry':                     '3rd Prof Part II',
      'Physical Medicine & Rehabilitation': '3rd Prof Part II',
    };

    // ── Phase-Specific MBBS Subcategory / Code Evaluator ─────────────────────
    // PHASE 1 = 4 parents: Anatomy, Physiology, Biochemistry, Community Medicine
    // PHASE 2 = 9 parents: Pathology, Microbiology, Pharmacology, GenMed, GenSurg, OBG, Paed, Derm, Ortho
    // PHASE 3 = 11 parents: CommMed, FMT, Ophthalmology, ENT, GenMed, GenSurg, OBG, Paed, Ortho, Derm, Dentistry
    const getMedicalPhaseForSubcategory = (sub, semNumber) => {
      if (!isMedical) return null;
      const code = String(sub.erpCode || sub.code || '').trim();
      const subNameUpper = String(sub.name || '').toUpperCase().trim();
      const parentName = getParentSubjectName(sub.name, sub.code);

      // ── PHASE 1 (4 parent subjects) ──────────────────────────────────────────
      const PHASE1_CODES = new Set([
        '84395','84396','84397','84398','84399','84400', // Anatomy
        '84817','84818','84819','84820','84821','84822', // Anatomy (CBME)
        '87224','87225','87226','87227','87228','87229','87230','87231','87232', // Physiology/Biochem
        '84401','84402', // Community Medicine Phase 1
      ]);
      if (PHASE1_CODES.has(code) ||
          ['Anatomy', 'Physiology', 'Biochemistry_(CBME 2024)', 'Biochemistry_(CBME 2019)', 'Biochemistry'].includes(parentName) ||
          subNameUpper === 'COMMUNITY MEDICINE-THEORY' ||
          subNameUpper === 'COMMUNITY MEDICINE-PRACTICAL' ||
          subNameUpper.includes('FAMILY ADOPTION') ||
          subNameUpper.includes('SPORTS') ||
          subNameUpper.includes('EXTRACURRICULAR')) {
        return '1st Prof';
      }

      // ── 2nd Prof parentName GUARD (runs before PHASE3_CODES) ─────────────────
      // For 2nd Prof students: if the ERP has assigned a Phase 3 code to what is
      // actually a Phase 2 subject (e.g. Paed with code 87253 instead of 85807),
      // the parentName check must run FIRST so it isn't intercepted by PHASE3_CODES.
      if (currentPhaseName === '2nd Prof') {
        const PHASE2_PARENT_NAMES = [
          'Pathology', 'Pharmacology', 'Microbiology',
          'General Medicine', 'GENERAL SURGERY',
          'Obstetrics & Gynaecology', 'PAEDIATRICS',
          'Dermatology, Venereology & Leprosy', 'Orthopedics',
        ];
        if (PHASE2_PARENT_NAMES.includes(parentName) ||
            subNameUpper.includes('PATHOLOGY') ||
            subNameUpper.includes('MICROBIOLOGY') ||
            subNameUpper.includes('PHARMACOLOGY') ||
            subNameUpper.includes('DERMATOLOGY') ||
            subNameUpper.includes('VENEREOLOGY') ||
            subNameUpper.includes('ORTHOPAEDICS') ||
            subNameUpper.includes('OBSTETRICS') ||
            subNameUpper.includes('GYNAECOLOGY') ||
            subNameUpper.includes('PAEDIATRICS') ||
            subNameUpper.includes('1ST SESSIONAL') ||
            subNameUpper.includes('2ND SESSIONAL')) {
          return '2nd Prof';
        }
      }

      // ── PHASE 3 EXCLUSIVE (always 3rd Prof Part I, filtered out for Phase 1/2 students) ─
      // These codes ONLY belong in Phase 3. For Phase 2 students they are excluded via subPhaseIdx filter.
      const PHASE3_CODES = new Set([
        '87247','87249','87255',         // Ophthalmology
        '87248','87250','87256','87574', // ENT
        '87253','87254',                 // Paediatrics Phase 3
        '87251','87252','87575',         // Orthopedics Phase 3
        '85797',                         // General Medicine Phase 3
        '85799',                         // General Surgery Phase 3
        '85801',                         // OBG Phase 3
        '85802','85803','87258',         // Forensic Medicine & Toxicology
        '85808','87259','87260',         // Community Medicine Posting
        '85811',                         // Dentistry
      ]);
      if (PHASE3_CODES.has(code) ||
          ['Ophthalmology', 'Otorhinolaryngology', 'Dentistry', 'FORENSIC MEDICINE'].includes(parentName) ||
          subNameUpper.includes('OPHTHALMOLOGY') ||
          subNameUpper.includes('OTORHINOLARYNGOLOGY') ||
          subNameUpper.includes('OTORHINOLARYGOLOGY') ||
          subNameUpper.includes('E.N.T.') ||
          subNameUpper.includes('FORENSIC MEDICINE') ||
          subNameUpper.includes('DENTISTRY') ||
          subNameUpper.includes('CLINICAL POSTING-COMMUNITY MEDICINE')) {
        return '3rd Prof Part I';
      }

      // ── PHASE 2 EXCLUSIVE (9 parent subjects) ────────────────────────────────
      // Explicit numeric codes for Phase 2 records.
      // NOTE: 85809 (Derm) is NOT here — it's handled below so 3rd Prof students
      //       can see Derm in Phase 3 via the ambiguous fallback.
      const PHASE2_CODES = new Set([
        '85790','85791', // Pathology
        '85792','85793', // Microbiology
        '85794','85795', // Pharmacology
        '85796','85804', // General Medicine Phase 2
        '85798','85805', // General Surgery Phase 2
        '85800','85806', // OBG Phase 2
        '85807',         // Paediatrics Phase 2
        '85810',         // Orthopedics Phase 2
      ]);
      if (PHASE2_CODES.has(code) ||
          ['Pathology', 'Pharmacology', 'Microbiology'].includes(parentName) ||
          subNameUpper.includes('MICROBIOLOGY') ||
          subNameUpper.includes('PATHOLOGY') ||
          subNameUpper.includes('PHARMACOLOGY') ||
          subNameUpper.includes('1ST SESSIONAL') ||
          subNameUpper.includes('2ND SESSIONAL')) {
        return '2nd Prof';
      }

      // ── DERMATOLOGY SPECIAL HANDLING ─────────────────────────────────────────
      // 85809 = Derm Phase 2 posting. ALWAYS routes to 2nd Prof so Phase 2 = 9.
      // For 3rd Prof students, Derm is ALSO manually cloned into Phase 3 in the
      // forEach loop below so Phase 3 = 11 (see DERM CLONE block).
      if (code === '85809' ||
          subNameUpper.includes('DERMATOLOGY') ||
          subNameUpper.includes('VENEREOLOGY') ||
          parentName === 'Dermatology, Venereology & Leprosy') {
        return '2nd Prof';
      }

      // ── SHARED CLINICAL SUBJECTS (GenMed, GenSurg, OBG, Paed, Ortho by name) ─
      // For subjects with abbreviation codes that didn't match PHASE2_CODES above.
      if (currentPhaseName === '2nd Prof' &&
          ['General Medicine', 'GENERAL SURGERY', 'Obstetrics & Gynaecology', 'PAEDIATRICS', 'Orthopedics'].includes(parentName)) {
        return '2nd Prof';
      }

      // ── 3rd Prof students: remaining subjects are Phase 3 active ─────────────
      if (currentPhaseName.includes('3rd Prof')) {
        return '3rd Prof Part I';
      }

      return '2nd Prof';
    };

    attendanceData.subjects.forEach(sub => {
      if (activeCategoryFilter !== 'ALL') {
        const subCat = getSubcategoryCategory(sub.name);
        if (subCat !== activeCategoryFilter) {
          return;
        }
      }
      const semRoman = roman[sub.semester - 1] || `${sub.semester}`;
      const phaseName = isMedical
        ? getMedicalPhaseForSubcategory(sub, sub.semester)
        : `Semester ${semRoman}`;

      // Skip subjects that belong to a future phase (beyond student's current year)
      if (isMedical) {
        const subPhaseIdx = ALL_MEDICAL_PHASES.indexOf(phaseName);
        if (subPhaseIdx > currentPhaseIdx) return;
      }

      const addToGroup = (phase, s) => {
        if (!grouped[phase]) {
          grouped[phase] = {
            label: phase === currentPhaseName ? 'Ongoing' : (order.indexOf(phase) < order.indexOf(currentPhaseName) ? 'Completed' : 'Upcoming'),
            percentageSum: 0,
            count: 0,
            subjects: []
          };
        }
        grouped[phase].subjects.push(s);
        grouped[phase].percentageSum += s.percentage;
        grouped[phase].count += 1;
      };

      addToGroup(phaseName, sub);

      // ── DERM CLONE for 3rd Prof students ─────────────────────────────────────
      // Dermatology (85809) goes to Phase 2 (history). For 3rd Prof students it
      // also belongs in Phase 3 Part I as an active subject (11th parent subject).
      // We clone the same record into Phase 3 so both counts are correct.
      if (isMedical && currentPhaseName.includes('3rd Prof') && phaseName === '2nd Prof') {
        const subCode = String(sub.code || '').trim();
        const subNameUp = String(sub.name || '').toUpperCase().trim();
        const isDerm = subCode === '85809' ||
          subNameUp.includes('DERMATOLOGY') ||
          subNameUp.includes('VENEREOLOGY') ||
          getParentSubjectName(sub.name, sub.code) === 'Dermatology, Venereology & Leprosy';
        if (isDerm) {
          addToGroup('3rd Prof Part I', { ...sub, _clonedForPhase3: true });
        }
      }
    });

    // Filter out groups with no subjects, but keep the current ongoing phase if it exists.
    // Also skip any phase that is beyond the student's current phase (out-of-year ERP data).
    const finalGrouped = {};
    Object.entries(grouped).forEach(([phase, data]) => {
      const phaseIdx = isMedical ? ALL_MEDICAL_PHASES.indexOf(phase) : order.indexOf(phase);
      const curIdx = isMedical ? ALL_MEDICAL_PHASES.indexOf(currentPhaseName) : order.indexOf(currentPhaseName);
      if (phaseIdx > curIdx) return; // skip future phases
      if (data.count > 0 || phase === currentPhaseName) {
        const avg = data.count > 0 ? Math.round(data.percentageSum / data.count) : 0;

        // Group subjects by parent subject name
        const parentMap = {};
        data.subjects.forEach(sub => {
          const parentName = getParentSubjectName(sub.name, sub.code);
          if (!parentMap[parentName]) {
            parentMap[parentName] = {
              name: parentName,
              code: getSubjectCode(parentName),
              percentageSum: 0,
              count: 0,
              subCategories: []
            };
          }
          const subNameUpper = (sub.name || '').toUpperCase().trim();
          const realCode = dynamicSubjectCodes[subNameUpper] || ERP_SUBJECT_MAP[subNameUpper] || sub.code;
          parentMap[parentName].subCategories.push({ ...sub, erpCode: realCode });
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

        const overallPhasePct = groupedSubjects.length > 0
          ? Math.round(groupedSubjects.reduce((sum, s) => sum + s.percentage, 0) / groupedSubjects.length)
          : 0;

        finalGrouped[phase] = {
          label: data.label,
          overallPct: overallPhasePct,
          subjects: groupedSubjects
        };
      }
    });

    return finalGrouped;
  }, [attendanceData.subjects, isMedical, currentPhaseName, semNum, activeCategoryFilter, dynamicSubjectCodes]);

  const activePhaseData = displayData[currentPhaseName];
  const erpUserAttendance = (user?.attendance !== undefined && user?.attendance !== null && !isNaN(Number(user.attendance)))
    ? Math.floor(Number(user.attendance))
    : null;
  const activePhaseOverall = erpUserAttendance !== null
    ? erpUserAttendance
    : (activePhaseData ? activePhaseData.overallPct : '-');

  // Calculate total subject-wise subcategories in active phase
  let activePhaseSubCategoriesCount = 0;
  if (activePhaseData) {
    activePhaseData.subjects.forEach(sub => {
      activePhaseSubCategoriesCount += sub.subCategories.length;
    });
  }
  const activePhaseTotalClasses = activePhaseSubCategoriesCount * 30;
  const activePhaseAttendedClasses = activePhaseOverall !== '-' ? Math.round(activePhaseOverall * 0.01 * activePhaseTotalClasses) : 0;

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
                  {activePhaseOverall}{activePhaseOverall !== '-' ? '%' : ''}
                </Text>
                <View style={styles.overallStats}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: isDark ? '#A5B4FC' : '#312E81' }]}>{activePhaseAttendedClasses}</Text>
                    <Text style={[styles.statLabel, { color: isDark ? 'rgba(165,180,252,0.7)' : 'rgba(49,46,129,0.7)' }]}>Attended</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: isDark ? '#A5B4FC' : '#312E81' }]}>{activePhaseTotalClasses}</Text>
                    <Text style={[styles.statLabel, { color: isDark ? 'rgba(165,180,252,0.7)' : 'rgba(49,46,129,0.7)' }]}>Total</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#C7D2FE' }]}>
                <View style={[styles.progressBarFill, { width: activePhaseOverall === '-' ? '0%' : `${activePhaseOverall}%`, backgroundColor: isDark ? '#818CF8' : '#4338CA' }]} />
              </View>
              <Text style={[styles.progressHint, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(67,56,202,0.7)' }]}>
                {activePhaseOverall === '-' ? 'No attendance records available.' : (activePhaseOverall >= 75 ? 'You are above the 75% minimum criteria. Keep it up!' : 'Warning: Your attendance is below the 75% minimum criteria.')}
              </Text>
            </LinearGradient>
          </View>

          {/* Main Category Filter Chips */}
          <View style={[styles.sectionContainer, { marginBottom: 4 }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {[
                { key: 'ALL', label: 'All' },
                { key: 'THEORY', label: 'Theory' },
                { key: 'PRACTICAL', label: 'Practical' },
                { key: 'CLINICAL_POSTING', label: 'Clinical Posting' },
                { key: 'AETCOM', label: 'AETCOM' },
                { key: 'PANDEMIC', label: 'Pandemic' }
              ].map((item) => {
                const isActive = activeCategoryFilter === item.key;
                const activeColor = colors.primary;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setActiveCategoryFilter(item.key)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: isActive ? activeColor + '20' : (isDark ? 'rgba(255,255,255,0.04)' : '#F3F4F6'),
                      borderColor: isActive ? activeColor : 'transparent',
                      borderWidth: 1,
                    }}
                  >
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: isActive ? activeColor : colors.textSecondary,
                    }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
                                        {/* Today's attendance eye button */}
                                        <TouchableOpacity
                                          onPress={(e) => { e.stopPropagation?.(); openTodayModal(subject.name, subject.subCategories); }}
                                          style={[
                                            styles.eyeBtn,
                                            { backgroundColor: isDark ? 'rgba(129,140,248,0.15)' : '#EEF2FF', borderColor: isDark ? '#818CF8' : '#6366F1' }
                                          ]}
                                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                          <MaterialCommunityIcons name="eye-outline" size={18} color={isDark ? '#818CF8' : '#6366F1'} />
                                        </TouchableOpacity>
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
              <View style={{ gap: 12, paddingVertical: 10 }}>
                {/* Skeleton header */}
                <Animated.View style={{ height: 35, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6', borderRadius: 8, opacity: shimmerAnim }} />
                {/* 5 Skeleton rows */}
                {[1, 2, 3, 4, 5].map((idx) => (
                  <View key={idx} style={{ flexDirection: 'row', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Animated.View style={{ width: 40, height: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#E5E7EB', borderRadius: 4, opacity: shimmerAnim }} />
                    <Animated.View style={{ flex: 2, height: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#E5E7EB', borderRadius: 4, opacity: shimmerAnim }} />
                    <Animated.View style={{ flex: 1, height: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#E5E7EB', borderRadius: 4, opacity: shimmerAnim }} />
                    <Animated.View style={{ flex: 1.2, height: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#E5E7EB', borderRadius: 4, opacity: shimmerAnim }} />
                  </View>
                ))}
              </View>
            ) : detailModal.error ? (
              <Text style={{ color: '#F87171', textAlign: 'center', padding: 20 }}>{detailModal.error}</Text>
            ) : detailModal.records.length === 0 ? (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>No attendance records found.</Text>
            ) : (() => {
              const filteredRecords = detailModal.records.filter(rec => {
                if (historyFilter === 'ALL') return true;
                return (rec.attendance || rec.Attendance || '').trim().toUpperCase() === historyFilter;
              });

              return (
                <>
                  {/* Filter chips */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                    {['ALL', 'P', 'A'].map((f) => {
                      const isActive = historyFilter === f;
                      const label = f === 'ALL' ? 'All' : f === 'P' ? 'Present' : 'Absent';
                      const activeColor = f === 'P' ? '#34D399' : f === 'A' ? '#F87171' : colors.primary;
                      return (
                        <TouchableOpacity
                          key={f}
                          onPress={() => setHistoryFilter(f)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 20,
                            backgroundColor: isActive ? activeColor + '20' : (isDark ? 'rgba(255,255,255,0.04)' : '#F3F4F6'),
                            borderColor: isActive ? activeColor : 'transparent',
                            borderWidth: 1,
                          }}
                        >
                          <Text style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: isActive ? activeColor : colors.textSecondary,
                          }}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {filteredRecords.length === 0 ? (
                    <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 40 }}>
                      {historyFilter === 'P' ? 'No present records found.' : 'No absent records found.'}
                    </Text>
                  ) : (
                    <>
                      {/* Table header */}
                      <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
                        <Text style={[styles.tableCell, styles.tableCellNo, styles.tableHeaderText, { color: colors.textSecondary }]}>S.No</Text>
                        <Text style={[styles.tableCell, styles.tableCellDate, styles.tableHeaderText, { color: colors.textSecondary }]}>Lecture Date</Text>
                        <Text style={[styles.tableCell, styles.tableCellAtt, styles.tableHeaderText, { color: colors.textSecondary }]}>Attendance</Text>
                        <Text style={[styles.tableCell, styles.tableCellPunch, styles.tableHeaderText, { color: colors.textSecondary }]}>Punch Time</Text>
                      </View>
                      <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                        {filteredRecords.map((rec, i) => {
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
                </>
              );
            })()}
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
                  <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                    <MaterialCommunityIcons name="calendar-remove-outline" size={40} color={colors.textMuted} />
                    <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 12, fontSize: 14 }}>
                      Attendance not updated in the ERP for today.
                    </Text>
                  </View>
                ) : (
                  todayModal.rows.map((row, ri) => {
                    const first = row.data?.[0] || null;
                    const att = first ? (first.attendance || first.Attendance || '').trim() : null;
                    const notYetMarked = !first; // Scheduled but no punch record yet
                    const attColor = notYetMarked
                      ? colors.textMuted
                      : att === 'P' ? '#34D399'
                        : att === 'A' ? '#F87171'
                          : colors.textSecondary;
                    return (
                      <View key={ri} style={[
                        styles.todayRow,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB', borderColor: colors.border }
                      ]}>
                        <View style={{ flex: 1, gap: 4 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 }}>{row.name}</Text>
                          {notYetMarked ? (
                            <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: 'italic' }}>
                              Lecture scheduled — attendance not yet marked
                            </Text>
                          ) : (
                            <>
                              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Punch Time: <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{first?.punchtime || '-'}</Text></Text>
                              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Faculty In: <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{first?.faculty_inpunch || '-'}</Text></Text>
                              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Faculty Out: <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{first?.faculty_outpunch || '-'}</Text></Text>
                            </>
                          )}
                        </View>
                        <View style={[
                          styles.todayBadge,
                          { backgroundColor: attColor + '20' }
                        ]}>
                          <Text style={{ fontSize: notYetMarked ? 11 : 18, fontWeight: '900', color: attColor }}>
                            {notYetMarked ? 'Pending' : (att || 'N.A.')}
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
