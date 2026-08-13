/**
 * ERPResultsScreen.js
 * ─────────────────────────────────────────────────────────────────
 * 3-level drill-down: Phase → Subject → 4-tab Detail
 *
 * Tab 1: Competencies Based   — competency codes + marks (≥50% green)
 * Tab 2: Attempted Paper      — real exam paper UI (sections/questions)
 * Tab 3: Progress Chart       — SVG donut/pie chart (react-native-svg)
 * Tab 4: Clinical / Logbook   — UG logbook activities with attempts
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, FlatList, Dimensions, Animated, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, G, Text as SvgText, Path } from 'react-native-svg';

import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { APP_CONFIG } from '../../config/appConfig';
import {
  getResults,
  getDetailedResults,
  getPaperList,
  getPaperCompetencies,
  getCompetencyChart,
  getPracticalMarks,
  getAttemptedPaper,
} from '../../data/apiService';

const { width } = Dimensions.get('window');

// ─── Pie/Donut Chart ──────────────────────────────────────────────────────────
const CHART_COLORS = [
  '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444',
  '#8B5CF6', '#14B8A6', '#F97316', '#22D3EE', '#A3E635', '#FB923C',
  '#E879F9', '#34D399', '#FCD34D', '#60A5FA', '#F472B6', '#4ADE80',
];

function PieChart({ data = [], size = 220, overallPct = 0 }) {
  if (!data || data.length === 0) return null;
  const total = data.length;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 16;
  const innerR = r * 0.55;

  let cumulativeAngle = -Math.PI / 2;
  const slices = data.map((item, i) => {
    const fraction = 1 / total;
    const angle = fraction * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumulativeAngle);
    const y1 = cy + r * Math.sin(cumulativeAngle);
    cumulativeAngle += angle;
    const x2 = cx + r * Math.cos(cumulativeAngle);
    const y2 = cy + r * Math.sin(cumulativeAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const ix1 = cx + innerR * Math.cos(cumulativeAngle - angle);
    const iy1 = cy + innerR * Math.sin(cumulativeAngle - angle);
    const ix2 = cx + innerR * Math.cos(cumulativeAngle);
    const iy2 = cy + innerR * Math.sin(cumulativeAngle);

    const d = [
      `M ${ix1} ${iy1}`,
      `L ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      'Z',
    ].join(' ');

    return { d, color: CHART_COLORS[i % CHART_COLORS.length], label: item.label, value: item.value };
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {slices.map((s, i) => (
          <Path key={i} d={s.d} fill={s.color} stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
        ))}
        <SvgText x={cx} y={cy - 6} textAnchor="middle" fill="#888" fontSize="11" fontWeight="600">Overall</SvgText>
        <SvgText x={cx} y={cy + 14} textAnchor="middle" fill="#6366F1" fontSize="22" fontWeight="900">{overallPct}%</SvgText>
      </Svg>
    </View>
  );
}

// ─── Prof / Phase Helpers ─────────────────────────────────────────────────────
const getMBBSPhaseLabel = (yr) => {
  const y = parseInt(yr);
  if (y <= 1) return '1st Prof';
  if (y === 2) return '2nd Prof';
  if (y === 3) return '3rd Prof Part I';
  return '3rd Prof Part II';
};

const getPhaseSortOrder = (label) => {
  if (label.includes('1st')) return 0;
  if (label.includes('2nd')) return 1;
  if (label.includes('Part I')) return 2;
  return 3;
};

const getPhaseForSubject = (subjectName) => {
  const name = (subjectName || '').toLowerCase().trim();
  
  // 1st Prof: Anatomy, Physiology, Biochemistry
  if (name.includes('anatomy') || name.includes('physiology') || name.includes('biochem') || name.includes('bio chem') || name.includes('biio chem')) {
    return '1st Prof';
  }
  
  // 2nd Prof: Pathology, Pharmacology, Microbiology
  if (name.includes('pathology') || name.includes('pharmacology') || name.includes('pharmocology') || name.includes('microbiology') || name.includes('microb')) {
    return '2nd Prof';
  }
  
  // 3rd Prof Part I: Forensic Medicine, Community Medicine
  if (name.includes('forensic') || name.includes('fmt') || name.includes('community medicine') || name.includes('preventive') || name.includes('psm')) {
    return '3rd Prof Part I';
  }
  
  // 3rd Prof Part II (Final Prof): General Medicine, General Surgery, Paediatrics, Obstetrics & Gynaecology, etc.
  return '3rd Prof Part II';
};



// ─── Empty State Component ─────────────────────────────────────────────────────
const EmptyTabState = ({ icon, title, subtitle, colors }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 }}>
    <View style={[{ width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
      <MaterialIcons name={icon} size={32} color={colors.textMuted} />
    </View>
    <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' }}>{title}</Text>
    <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>{subtitle}</Text>
  </View>
);

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
  }
  return (
    <View style={{ paddingHorizontal: 6, height: 28, minWidth: 28, borderRadius: 8, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color }}>{val}</Text>
    </View>
  );
};

const AnimatedSkeleton = ({ style, isDark }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
    outputRange: [isDark ? 0.06 : 0.08, isDark ? 0.18 : 0.22],
  });

  return (
    <Animated.View style={[{ backgroundColor: isDark ? '#FFF' : '#000', opacity }, style]} />
  );
};

const SkeletonRow = ({ isDark }) => (
  <View style={{
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    backgroundColor: isDark ? '#1E293B' : '#FFF',
    gap: 12,
    marginBottom: 12
  }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <AnimatedSkeleton style={{ width: 100, height: 16, borderRadius: 8 }} isDark={isDark} />
      <AnimatedSkeleton style={{ width: 45, height: 20, borderRadius: 10 }} isDark={isDark} />
    </View>
    <AnimatedSkeleton style={{ width: '70%', height: 12, borderRadius: 6 }} isDark={isDark} />
    <View style={{ height: 6, borderRadius: 3, backgroundColor: isDark ? '#334155' : '#F3F4F6', overflow: 'hidden' }}>
      <AnimatedSkeleton style={{ width: '100%', height: '100%', borderRadius: 3 }} isDark={isDark} />
    </View>
  </View>
);

const SkeletonHeader = ({ isDark }) => (
  <View style={{
    padding: 16,
    borderRadius: 16,
    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0',
    gap: 10,
    marginBottom: 16
  }}>
    <AnimatedSkeleton style={{ width: '50%', height: 18, borderRadius: 9 }} isDark={isDark} />
    <AnimatedSkeleton style={{ width: '80%', height: 14, borderRadius: 7 }} isDark={isDark} />
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
      <AnimatedSkeleton style={{ width: 80, height: 12, borderRadius: 6 }} isDark={isDark} />
      <AnimatedSkeleton style={{ width: 100, height: 12, borderRadius: 6 }} isDark={isDark} />
    </View>
  </View>
);

const SkeletonCircle = ({ isDark }) => (
  <View style={{ width: 200, height: 200, borderRadius: 100, borderWidth: 15, borderColor: isDark ? '#334155' : '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
    <AnimatedSkeleton style={{ width: 60, height: 16, borderRadius: 8, marginBottom: 8 }} isDark={isDark} />
    <AnimatedSkeleton style={{ width: 85, height: 22, borderRadius: 11 }} isDark={isDark} />
  </View>
);

const SkeletonLegendRow = ({ isDark }) => (
  <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    backgroundColor: isDark ? '#1E293B' : '#FFF',
    gap: 12
  }}>
    <AnimatedSkeleton style={{ width: 12, height: 12, borderRadius: 6 }} isDark={isDark} />
    <AnimatedSkeleton style={{ width: 60, height: 14, borderRadius: 7 }} isDark={isDark} />
    <View style={{ flex: 1 }}>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: isDark ? '#334155' : '#F3F4F6' }}>
        <AnimatedSkeleton style={{ width: '100%', height: '100%', borderRadius: 3 }} isDark={isDark} />
      </View>
    </View>
    <AnimatedSkeleton style={{ width: 35, height: 14, borderRadius: 7 }} isDark={isDark} />
  </View>
);

const SkeletonLogbookCard = ({ isDark }) => (
  <View style={{
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    backgroundColor: isDark ? '#1E293B' : '#FFF',
    gap: 12,
    marginBottom: 12
  }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <View style={{ flex: 1, gap: 8 }}>
        <AnimatedSkeleton style={{ width: '90%', height: 14, borderRadius: 7 }} isDark={isDark} />
        <AnimatedSkeleton style={{ width: 100, height: 18, borderRadius: 9 }} isDark={isDark} />
      </View>
      <AnimatedSkeleton style={{ width: 60, height: 20, borderRadius: 10 }} isDark={isDark} />
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3].map(i => (
          <AnimatedSkeleton key={i} style={{ width: 28, height: 28, borderRadius: 8 }} isDark={isDark} />
        ))}
      </View>
      <View style={{ flex: 1, paddingLeft: 12, gap: 4 }}>
        <AnimatedSkeleton style={{ width: 50, height: 10, borderRadius: 5 }} isDark={isDark} />
        <AnimatedSkeleton style={{ width: 90, height: 12, borderRadius: 6 }} isDark={isDark} />
      </View>
    </View>
  </View>
);

const SkeletonSubQuestion = ({ isDark }) => (
  <View style={{
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#E2E8F0',
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
    gap: 10,
    marginTop: 8
  }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <AnimatedSkeleton style={{ width: 60, height: 14, borderRadius: 6 }} isDark={isDark} />
        <AnimatedSkeleton style={{ width: 45, height: 16, borderRadius: 6 }} isDark={isDark} />
      </View>
      <AnimatedSkeleton style={{ width: 40, height: 18, borderRadius: 8 }} isDark={isDark} />
    </View>
    <AnimatedSkeleton style={{ width: '85%', height: 12, borderRadius: 6 }} isDark={isDark} />
    <AnimatedSkeleton style={{ width: '60%', height: 10, borderRadius: 5 }} isDark={isDark} />
  </View>
);

// ─── Subject Detail Modal (4 Tabs) ────────────────────────────────────────────
const SubjectDetailModal = ({ visible, subject, onClose, accessToken, student }) => {
  const { colors, isDark } = useTheme();
  const { user: contextUser } = useUser();
  const user = student || contextUser;
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [competencies, setCompetencies] = useState([]);
  const [attempted, setAttempted] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [practicalMarks, setPracticalMarks] = useState(null);
  const [loadingPractical, setLoadingPractical] = useState(false);
  const [paperCache, setPaperCache] = useState({});
  const slideAnim = useRef(new Animated.Value(0)).current;

  const tabs = ['Competencies', 'Attempted Paper', 'Progress Chart', 'Practical Marks'];
  const tabIcons = ['assignment', 'description', 'pie-chart', 'grade'];

  useEffect(() => {
    if (visible && subject) {
      setSelectedPaper(null);
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, tension: 80 }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible, subject]);

  const loadData = async (pcode, force = false) => {
    if (!accessToken || !pcode) return;
    
    // Only use memory cache if force is false AND cached data is not empty
    if (!force && paperCache[pcode] && paperCache[pcode].practicalMarks !== undefined &&
        (paperCache[pcode].chartData?.length > 0 || paperCache[pcode].competencies?.length > 0)) {
      const cached = paperCache[pcode];
      setCompetencies(cached.competencies);
      setAttempted(cached.attempted);
      setChartData(cached.chartData);
      setPracticalMarks(cached.practicalMarks || null);
      setLoading(false);
      setLoadingPractical(false);
      return;
    }

    setLoading(true);
    setLoadingPractical(true);

    const cacheKey = `@erp_paper_cache_${user?.id || 'default'}`;
    if (!force) {
      try {
        const persistedStr = await AsyncStorage.getItem(cacheKey);
        if (persistedStr) {
          const persisted = JSON.parse(persistedStr);
          if (persisted && persisted[pcode] && persisted[pcode].practicalMarks !== undefined &&
              (persisted[pcode].chartData?.length > 0 || persisted[pcode].competencies?.length > 0)) {
            const cached = persisted[pcode];
            setCompetencies(cached.competencies || []);
            setAttempted(cached.attempted || []);
            setChartData(cached.chartData || []);
            setPracticalMarks(cached.practicalMarks || null);
            
            setPaperCache(prev => ({
              ...prev,
              [pcode]: cached
            }));
            setLoading(false);
            setLoadingPractical(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to load persisted paper cache:', e);
      }
    }

    try {
      const studentId = user?.rollno || user?.username || user?.id;
      const [compData, chartResp, pracResp, attemptedResp] = await Promise.allSettled([
        getPaperCompetencies(accessToken, pcode, studentId),
        getCompetencyChart(accessToken, pcode, '1', studentId),
        getPracticalMarks(accessToken, pcode, studentId),
        getAttemptedPaper(accessToken, pcode, studentId),
      ]);

      let nextComps = [];
      if (compData.status === 'fulfilled') {
        const raw = compData.value?.data || compData.value || {};
        const list = raw.competencies || raw.data?.competencies || (Array.isArray(raw) ? raw : []);
        nextComps = list.map(c => {
          const compCode = c.competency || c.code || c.comp_code || 'COMP';
          const scoreStr = String(c.score || '').trim();
          let obt = 0;
          let tot = 10;
          if (scoreStr.includes('/')) {
            const m = scoreStr.match(/([\d.]+)\s*\/\s*([\d.]+)/);
            if (m) {
              obt = parseFloat(m[1]);
              tot = parseFloat(m[2]);
            }
          } else {
            obt = parseFloat(c.obtained || c.obtained_marks || 0);
            tot = parseFloat(c.total || c.total_marks || 10);
          }
          return {
            code: compCode,
            description: compCode,
            obtained: obt,
            total: tot,
          };
        });
      }
      setCompetencies(nextComps);

      let nextAttempted = [];
      if (attemptedResp.status === 'fulfilled' && Array.isArray(attemptedResp.value) && attemptedResp.value.length > 0) {
        // Backend proxy returned enriched attempted paper (main questions + subquestions)
        nextAttempted = attemptedResp.value.map((item, idx) => {
          if (item.section && item.mainQuestions) return item;
          // If flat list returned from backend
          return {
            section: item.section || 'General Section',
            mainQuestions: [{
              no: item.mqno || String(idx + 1),
              text: item.Main_question || item.ques || 'Question details',
              quescode: item.quescode,
              obtained: parseFloat(item.obtainedmarks || 0),
              total: parseFloat(item.totalmarks || item.ques_wtg || 0),
              subquestions: (item.subquestions || []).map(sq => ({
                id: sq.subquesid,
                no: sq.optno || '',
                type: sq.QType || 'DESC',
                text: sq.ques || '',
                op1: sq.optionA || '',
                op2: sq.optionB || '',
                op3: sq.optionC || '',
                op4: sq.optionD || '',
                obtained: parseFloat(sq.obtainedmarks || 0),
                total: parseFloat(sq.ques_wtg || 0),
                correct: sq.QType === 'MCQ' ? parseFloat(sq.obtainedmarks) > 0 : undefined
              })),
              loadingSubquestions: false
            }]
          };
        });
        setAttempted(nextAttempted);
      } else {
        // Fallback: direct client fetch if proxy returns empty
        try {
          const rollno = String(user?.username || user?.rollno || '');
          if (rollno) {
            const mainResp = await fetch('https://myportal.srms.ac.in/SRMSERP/Faculty/printdetailpaperTheoryResult', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
              body: JSON.stringify({ papercode: String(pcode), stud_rollno: rollno })
            });
            const mainData = await mainResp.json();
            if (Array.isArray(mainData) && mainData.length > 0) {
              const sectionsMap = {};
              mainData.forEach((mq, idx) => {
                const secName = mq.section || 'General Section';
                if (!sectionsMap[secName]) {
                  sectionsMap[secName] = { section: secName, mainQuestions: [] };
                }
                sectionsMap[secName].mainQuestions.push({
                  no: mq.mqno || String(idx + 1),
                  text: mq.Main_question || mq.ques || 'Question details',
                  quescode: mq.quescode,
                  obtained: parseFloat(mq.obtainedmarks || 0),
                  total: parseFloat(mq.totalmarks || mq.ques_wtg || 0),
                  subquestions: [],
                  loadingSubquestions: true
                });
              });
              nextAttempted = Object.values(sectionsMap);
              setAttempted(nextAttempted);
            }
          }
        } catch (err) {
          console.warn('[ResultsScreen] Direct attempted paper fetch failed:', err);
        }
      }

      let nextChart = [];
      if (chartResp.status === 'fulfilled' && chartResp.value) {
        const val = chartResp.value;
        const raw = Array.isArray(val) ? val : (val?.data || []);
        if (Array.isArray(raw) && raw.length > 0) {
          nextChart = raw.map(d => ({
            label: d.comp_code || d.label || d.competency || 'COMP',
            value: typeof d.pct === 'number' ? d.pct : (parseFloat(d.pct || d.value || 0) || 0)
          }));
        }
      }

      // Guaranteed fallback: If chart API returned empty, generate chart directly from loaded competencies
      if (nextChart.length === 0 && nextComps.length > 0) {
        nextChart = nextComps.map(c => ({
          label: c.code,
          value: c.total > 0 ? Math.round((c.obtained / c.total) * 100) : 0
        }));
      }
      setChartData(nextChart);

      // Fetch Practical Marks from ERP via backend proxy
      let nextPractical = null;
      if (pracResp.status === 'fulfilled' && pracResp.value) {
        const pval = pracResp.value;
        if (pval.obtained_marks !== null && pval.obtained_marks !== undefined) {
          nextPractical = {
            obtained_marks: pval.obtained_marks,
            max_marks: pval.max_marks || 100
          };
        } else if (pval.data && pval.data.obtained_marks !== undefined) {
          nextPractical = {
            obtained_marks: pval.data.obtained_marks,
            max_marks: pval.data.max_marks || 100
          };
        }
      }
      setPracticalMarks(nextPractical);

      const cacheValue = {
        competencies: nextComps,
        attempted: nextAttempted,
        chartData: nextChart,
        practicalMarks: nextPractical
      };

      setPaperCache(prev => ({
        ...prev,
        [pcode]: cacheValue
      }));

      try {
        const persistedStr = await AsyncStorage.getItem(cacheKey);
        const persisted = persistedStr ? JSON.parse(persistedStr) : {};
        persisted[pcode] = cacheValue;
        await AsyncStorage.setItem(cacheKey, JSON.stringify(persisted));
      } catch (e) {
        console.warn('Failed to save paper cache:', e);
      }
    } catch (e) {
      console.warn('[SubjectModal] load error:', e);
    } finally {
      setLoading(false);
      setLoadingPractical(false);
    }
  };

  const handleSelectPaper = (paper) => {
    setSelectedPaper(paper);
    loadData(paper.paper_code);
  };

  const renderPapersList = () => {
    const allPapers = subject.papers || [];
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 4, letterSpacing: 0.5 }}>
          EXAMS & PAPERS
        </Text>
        {allPapers.length === 0 ? (
          <View style={{ padding: 32, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }}>No Exams Taken Yet</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center' }}>
              Results will appear here as soon as exams are conducted and marks are updated.
            </Text>
          </View>
        ) : (
          allPapers.map((paper, idx) => {
            const isGap = paper.pct < 50;
            return (
              <TouchableOpacity
                key={idx}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: isGap ? '#FCA5A5' : colors.border,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                onPress={() => handleSelectPaper(paper)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1, marginRight: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {(() => {
                      const nameLower = paper.paper_name.toLowerCase();
                      const isPreUni = nameLower.includes('pre-uni') || nameLower.includes('pre university') || nameLower.includes('preuniversity');
                      const isUni = nameLower.includes('university') && !isPreUni;
                      
                      let bg = isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF';
                      let textCol = '#6366F1';
                      let label = 'Internal';

                      if (isPreUni) {
                        bg = isDark ? 'rgba(13,148,136,0.15)' : '#E6F4F1';
                        textCol = '#0D9488';
                        label = 'Pre-University';
                      } else if (isUni) {
                        bg = isDark ? 'rgba(245,158,11,0.15)' : '#FFFBEB';
                        textCol = '#D97706';
                        label = 'University';
                      }

                      return (
                        <View style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor: bg,
                        }}>
                          <Text style={{
                            fontSize: 10,
                            fontWeight: '800',
                            color: textCol,
                            textTransform: 'uppercase',
                          }}>
                            {label}
                          </Text>
                        </View>
                      );
                    })()}
                    {isGap && (
                      <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: '#EF4444' }}>GAP DETECTED</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary }}>
                    {paper.paper_name}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                    Paper Code: {paper.paper_code}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: isGap ? '#EF4444' : '#10B981' }}>
                      {paper.pct}%
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      {paper.obtained_marks} / {paper.total_marks} M
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    );
  };

  if (!subject) return null;

  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [800, 0] });

  const gaps = competencies.filter(c => {
    const pct = c.total > 0 ? (c.obtained / c.total) * 100 : c.obtained;
    return pct < 50;
  });

  const renderSkeleton = () => {
    if (activeTab === 0) {
      return (
        <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4].map(idx => (
            <SkeletonRow key={idx} isDark={isDark} />
          ))}
        </ScrollView>
      );
    } else if (activeTab === 1) {
      return (
        <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          <SkeletonHeader isDark={isDark} />
          {[1, 2].map(idx => (
            <SkeletonRow key={idx} isDark={isDark} />
          ))}
        </ScrollView>
      );
    } else {
      return (
        <ScrollView style={{ padding: 16 }} contentContainerStyle={{ alignItems: 'center' }} showsVerticalScrollIndicator={false}>
          <SkeletonCircle isDark={isDark} />
          <View style={{ width: '100%', marginTop: 24, gap: 8 }}>
            {[1, 2, 3].map(idx => (
              <SkeletonLegendRow key={idx} isDark={isDark} />
            ))}
          </View>
        </ScrollView>
      );
    }
  };

  // ── Tab 1: Competencies Based ──
  const renderCompetencies = () => {
    if (!competencies || competencies.length === 0) {
      return (
        <EmptyTabState
          icon="assignment"
          title="No Competencies Found"
          subtitle="There are no competencies uploaded or available for this subject yet."
          colors={colors}
        />
      );
    }
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 10 }}>
        {gaps.length > 0 && (
          <View style={[styles.gapWarning, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', borderColor: '#FCA5A5' }]}>
            <MaterialIcons name="warning" size={16} color="#DC2626" />
            <Text style={{ color: '#DC2626', fontSize: 12, fontWeight: '700', flex: 1, marginLeft: 8 }}>
              {gaps.length} competenc{gaps.length === 1 ? 'y' : 'ies'} below 50% — NMC gap identified
            </Text>
          </View>
        )}
        {competencies.map((c, i) => {
          const pct = c.total > 0 ? Math.round((c.obtained / c.total) * 100) : (c.obtained || 0);
          const isGap = pct < 50;
          const barColor = isGap ? '#EF4444' : pct >= 75 ? '#10B981' : '#F59E0B';
          return (
            <View key={i} style={[styles.compCard, { backgroundColor: colors.card, borderColor: isGap ? '#FCA5A5' : colors.border }]}>
              <View style={styles.compHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.compCodeBadge, { backgroundColor: isGap ? '#FEE2E2' : isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }]}>
                      <Text style={[styles.compCode, { color: isGap ? '#DC2626' : '#6366F1' }]}>{c.code || c.comp_code}</Text>
                    </View>
                    {isGap && <View style={styles.gapBadge}><Text style={styles.gapBadgeText}>GAP</Text></View>}
                  </View>
                  <Text style={[styles.compDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                    {c.description || c.comp_description || c.competency_name}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.compPct, { color: barColor }]}>{pct}%</Text>
                  <Text style={[styles.compMarks, { color: colors.textMuted }]}>{c.obtained}/{c.total}</Text>
                </View>
              </View>
              <View style={[styles.compBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                <View style={[styles.compBarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }]} />
                <View style={[styles.threshold50, { left: '50%' }]} />
              </View>
              <Text style={[styles.compThresholdLabel, { color: colors.textMuted }]}>NMC min: 50%</Text>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  // ── Tab 2: Attempted Paper ──
  const renderAttemptedPaper = () => {
    if (!attempted || attempted.length === 0) {
      return (
        <EmptyTabState
          icon="description"
          title="No Exam Paper Found"
          subtitle="Detailed exam paper and question-wise attempt data are not available for this subject."
          colors={colors}
        />
      );
    }
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {/* Paper Header */}
        <View style={[styles.paperHeader, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}>
          <Text style={[styles.paperUniversity, { color: colors.textPrimary }]}>{APP_CONFIG.UNIVERSITY_NAME}</Text>
          <Text style={[styles.paperExamTitle, { color: colors.textSecondary }]}>
            {subject.subject_name} — {subject.university?.[0]?.paper_name || 'Theory Examination'}
          </Text>
        </View>

        {/* Sections */}
        {attempted.map((sec, si) => (
          <View key={si} style={{ marginTop: 20 }}>
            <View style={[styles.sectionHeader, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }]}>
              <Text style={[styles.sectionTitle, { color: '#6366F1' }]}>{sec.section}</Text>
            </View>

            {/* Main Questions */}
            {(sec.mainQuestions || []).map((mq, mqi) => (
              <View key={mqi} style={[styles.mainQuestionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Main Question Header */}
                <View style={styles.mainQuestionHeader}>
                  <Text style={[styles.mainQuestionNo, { color: colors.textSecondary }]}>Q{mq.no}.</Text>
                  <View style={[styles.mainQuestionScoreBadge, { backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : '#FEF3C7' }]}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#D97706' }}>
                      Section Score: {mq.obtained} / {mq.total} Marks
                    </Text>
                  </View>
                </View>

                {/* Main Question Text */}
                <Text style={[styles.mainQuestionText, { color: colors.textPrimary }]}>{mq.text}</Text>

                {/* Sub Questions */}
                {mq.loadingSubquestions ? (
                  <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', paddingTop: 12, gap: 8 }}>
                    <SkeletonSubQuestion isDark={isDark} />
                    <SkeletonSubQuestion isDark={isDark} />
                  </View>
                ) : mq.subquestions && mq.subquestions.length > 0 ? (
                  <View style={{ marginTop: 12, gap: 12, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', paddingTop: 12 }}>
                    {mq.subquestions.map((sq, sqi) => {
                      const sqPct = sq.total > 0 ? (sq.obtained / sq.total) * 100 : 0;
                      const isFail = sqPct < 50;
                      return (
                        <View
                          key={sqi}
                          style={[
                            styles.subQuestionRow,
                            {
                              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                              borderColor: colors.border,
                              position: 'relative',
                              overflow: 'hidden'
                            }
                          ]}
                        >
                          {/* Sub Question Header */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary }}>Sub Q {sq.no}.</Text>
                              <View style={[styles.qCompBadge, { backgroundColor: sq.type === 'MCQ' ? '#DBEAFE' : '#CCFBF1' }]}>
                                <Text style={[styles.qCompText, { color: sq.type === 'MCQ' ? '#1E40AF' : '#0F766E' }]}>{sq.type}</Text>
                              </View>
                            </View>
                            <View style={[styles.marksChip, { backgroundColor: isFail ? '#FEE2E2' : '#D1FAE5' }]}>
                              <Text style={[styles.marksChipText, { color: isFail ? '#DC2626' : '#059669' }]}>
                                {sq.obtained}/{sq.total}
                              </Text>
                            </View>
                          </View>

                          {/* Sub Question Text */}
                          <Text style={[styles.subQuestionText, { color: colors.textPrimary, zIndex: 1 }]}>{sq.text}</Text>

                          {/* MCQ Options Rendering */}
                          {sq.type === 'MCQ' && (
                            <View style={{ marginTop: 6, gap: 6, zIndex: 1 }}>
                              {[sq.op1, sq.op2, sq.op3, sq.op4].map((opVal, opIdx) => {
                                if (!opVal) return null;
                                return (
                                  <View key={opIdx} style={[styles.mcqOptionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <View style={styles.mcqOptionCircle}>
                                      <Text style={{ fontSize: 9, fontWeight: '800', color: colors.textSecondary }}>
                                        {String.fromCharCode(65 + opIdx)}
                                      </Text>
                                    </View>
                                    <Text style={{ fontSize: 12, color: colors.textPrimary, flex: 1 }}>{opVal}</Text>
                                  </View>
                                );
                              })}
                            </View>
                          )}

                          {sq.type === 'MCQ' && sq.correct !== undefined && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, zIndex: 1 }}>
                              <MaterialIcons
                                name={sq.correct ? 'check-circle' : 'cancel'}
                                size={14}
                                color={sq.correct ? '#10B981' : '#EF4444'}
                              />
                              <Text style={{ fontSize: 11, color: sq.correct ? '#10B981' : '#EF4444', fontWeight: '700' }}>
                                {sq.correct ? 'Correct Answer' : 'Incorrect Answer'}
                              </Text>
                            </View>
                          )}

                          {/* Human-like checking stamp layered on top */}
                          <View
                            pointerEvents="none"
                            style={{
                              position: 'absolute',
                              right: 25,
                              top: 0,
                              bottom: 0,
                              justifyContent: 'center',
                              alignItems: 'center',
                              zIndex: 10
                            }}
                          >
                            {sq.obtained > 0 ? (
                              <Feather
                                name="check"
                                size={90}
                                color="#10B981"
                                style={{ opacity: isDark ? 0.09 : 0.14, transform: [{ rotate: '-18deg' }] }}
                              />
                            ) : (
                              <Feather
                                name="x"
                                size={90}
                                color="#EF4444"
                                style={{ opacity: isDark ? 0.09 : 0.14, transform: [{ rotate: '12deg' }] }}
                              />
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // ── Tab 3: Competencies Progress Chart ──
  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <EmptyTabState
          icon="pie-chart"
          title="No Chart Data"
          subtitle="Competency progress chart data has not been generated for this subject yet."
          colors={colors}
        />
      );
    }
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, alignItems: 'center', gap: 16 }}>
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Competency-wise Distribution</Text>
        <Text style={[styles.chartSub, { color: colors.textSecondary }]}>
          Each slice represents one competency. The center displays the overall score.
        </Text>
        <PieChart data={chartData} size={240} overallPct={selectedPaper.pct} />
        <View style={{ width: '100%', gap: 8 }}>
          {chartData.map((d, i) => (
            <View key={i} style={[styles.legendRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.legendDot, { backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }]} />
              <Text style={[styles.legendLabel, { color: colors.textPrimary }]}>{d.label}</Text>
              <View style={{ flex: 1 }}>
                <View style={[styles.legendBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                  <View style={[styles.legendBarFill, { width: `${Math.min(d.value, 100)}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + 'CC' }]} />
                </View>
              </View>
              <Text style={[styles.legendPct, { color: d.value < 50 ? '#EF4444' : colors.textSecondary }]}>{d.value}%</Text>
            </View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  const renderPracticalMarks = () => {
    if (loadingPractical) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>Fetching practical marks...</Text>
        </View>
      );
    }

    if (!practicalMarks) {
      return (
        <EmptyTabState
          icon="grade"
          title="No Practical Marks"
          subtitle="No practical marks entries were found for this student paper."
          colors={colors}
        />
      );
    }

    const percentage = practicalMarks.max_marks > 0 ? Math.round((practicalMarks.obtained_marks / practicalMarks.max_marks) * 100) : 0;
    const isPass = percentage >= 50;

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 24,
          padding: 24,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          gap: 16,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 8
        }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: isPass ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: isPass ? '#10B981' : '#EF4444'
          }}>
            <MaterialIcons name="grade" size={40} color={isPass ? '#10B981' : '#EF4444'} />
          </View>

          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: colors.textPrimary }}>Practical Score Card</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
              Student practical exam marks fetched from SRMS ERP
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 16,
            width: '100%',
            borderWidth: 1,
            borderColor: colors.border
          }}>
            <Text style={{ fontSize: 32, fontWeight: '900', color: colors.textPrimary }}>
              {practicalMarks.obtained_marks}
            </Text>
            <Text style={{ fontSize: 24, color: colors.textMuted, fontWeight: '300' }}>/</Text>
            <Text style={{ fontSize: 24, color: colors.textSecondary, fontWeight: '700' }}>
              {practicalMarks.max_marks}
            </Text>
          </View>

          <View style={{ width: '100%', gap: 12, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>Percentage Obtained</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>{percentage}%</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>Exam Result Status</Text>
              <Text style={{ fontSize: 13, fontWeight: '800', color: isPass ? '#10B981' : '#EF4444' }}>
                {isPass ? 'PASS' : 'FAIL'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };



  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[styles.modalSheet, { backgroundColor: colors.background, transform: [{ translateY }] }]}>
          {/* Modal Handle */}
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              {selectedPaper ? (
                <TouchableOpacity onPress={() => setSelectedPaper(null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialIcons name="arrow-back" size={20} color={colors.primary} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>Back to Papers</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <Text style={[styles.modalSubjectCode, { color: colors.textMuted }]}>{subject.subject_code}</Text>
                  <Text style={[styles.modalSubjectName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {subject.subject_name}
                  </Text>
                </>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.card }]}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {!selectedPaper ? (
            renderPapersList()
          ) : (
            <>
              {/* Paper Title Banner */}
              <View style={{ paddingHorizontal: 20, paddingVertical: 12, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary }}>{selectedPaper.paper_name}</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Marks: {selectedPaper.obtained_marks}/{selectedPaper.total_marks} ({selectedPaper.pct}%)</Text>
                </View>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 }}
                  onPress={() => loadData(selectedPaper.paper_code, true)}
                >
                  <Ionicons name="refresh" size={14} color={colors.primary} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>Resync ERP</Text>
                </TouchableOpacity>
              </View>

              {/* Tab Bar */}
              <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                {tabs.map((tab, i) => (
                  <TouchableOpacity key={i} style={[styles.tabItem, activeTab === i && styles.tabItemActive]} onPress={() => setActiveTab(i)}>
                    <MaterialIcons name={tabIcons[i]} size={16} color={activeTab === i ? colors.primary : colors.textMuted} />
                    <Text style={[styles.tabLabel, { color: activeTab === i ? colors.primary : colors.textMuted }]} numberOfLines={1}>
                      {tab}
                    </Text>
                    {activeTab === i && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tab Content */}
              {loading ? (
                renderSkeleton()
              ) : (
                <View style={{ flex: 1 }}>
                  {activeTab === 0 && renderCompetencies()}
                  {activeTab === 1 && renderAttemptedPaper()}
                  {activeTab === 2 && renderChart()}
                  {activeTab === 3 && renderPracticalMarks()}
                </View>
              )}
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const ERPResultsScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user: contextUser, accessToken } = useUser();
  const passedStudent = route?.params?.student;
  const user = passedStudent || contextUser;
  const isFaculty = contextUser && contextUser.role === 'teacher';

  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const isMedical = user?.course?.replace(/\./g, '').toUpperCase().includes('MBBS')
    || user?.category?.toLowerCase() === 'medical';

  useEffect(() => {
    loadResults(false);
  }, [accessToken]);

  const loadResults = async (forceFetch = false) => {
    const cacheKey = `@erp_results_cache_${user?.id || 'default'}`;
    
    if (!forceFetch) {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.phases) {
            setPhases(parsed.phases);
            if (parsed.phases.length > 0) {
              setExpandedPhase(parsed.phases[parsed.phases.length - 1].phase);
            }
            setLoading(false);
            // Update in background silently
            performFetch(cacheKey, false).catch(err => console.warn(err));
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to load cached results:', e);
      }
    }

    if (forceFetch) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    await performFetch(cacheKey, true, forceFetch);
  };

  const performFetch = async (cacheKey, shouldSetLoading, forceSync = false) => {
    try {
      if (!accessToken) {
        setPhases([]);
        if (shouldSetLoading) setLoading(false);
        setRefreshing(false);
        return;
      }

      const studentId = user?.rollno || user?.id || user?.username;
      const [rawResults, paperListData] = await Promise.allSettled([
        getDetailedResults(accessToken, studentId, forceSync),
        getPaperList(accessToken, studentId)
      ]);

      const detailed = rawResults.status === 'fulfilled' ? rawResults.value : [];
      const paperList = paperListData.status === 'fulfilled' ? paperListData.value : [];

      const listData = paperList?.data || paperList || [];
      if (listData.length === 0) {
        setPhases([]);
        if (shouldSetLoading) setLoading(false);
        setRefreshing(false);
        return;
      }

      const getPhaseForPaper = (paperName, dbYrFk, defaultPhase) => {
        if (dbYrFk) {
          const yr = String(dbYrFk);
          if (yr === '1') return '1st Prof';
          if (yr === '2') return '2nd Prof';
          if (yr === '3') return '3rd Prof Part I';
          if (yr === '4') return '3rd Prof Part II';
        }

        const name = String(paperName || '').toLowerCase();
        if (name.includes('1st prof') || name.includes('1prof')) return '1st Prof';
        if (name.includes('2nd prof') || name.includes('2prof') || name.includes('2nd professional')) return '2nd Prof';
        if (name.includes('3rd prof') || name.includes('3prof') || name.includes('3rd professional')) {
          if (name.includes('part-i') || name.includes('part i') || name.includes('part-1')) {
            return '3rd Prof Part I';
          }
          return '3rd Prof Part II';
        }
        return defaultPhase;
      };

      const byPhase = {};
      listData.forEach(item => {
        const subjectName = item.subject || 'Unknown Subject';
        const defaultPhase = getPhaseForSubject(subjectName);

        (item.papers || []).forEach(p => {
          let obtained = null;
          let found = false;
          let dbYrFk = null;

          for (const det of detailed) {
            const allMarks = [...(det.sessional || []), ...(det.university || [])];
            const matchMark = allMarks.find(m => String(m.paper_code) === String(p.paperCode));
            if (matchMark) {
              obtained = matchMark.obtained_marks || 0;
              dbYrFk = matchMark.yr_fk;
              found = true;
              break;
            }
          }

          const paperPhase = getPhaseForPaper(p.paperName, dbYrFk, defaultPhase);

          if (!byPhase[paperPhase]) {
            const canonicalYr = paperPhase.includes('1st') ? 1 
                              : paperPhase.includes('2nd') ? 2 
                              : paperPhase.includes('Part I') ? 3 
                              : 4;
            byPhase[paperPhase] = {
              phase: paperPhase,
              yr_fk: canonicalYr,
              subjectsMap: {},
              subjects: []
            };
          }

          const maxWtg = parseFloat(p.marksWtg || 100);
          const rawObtained = obtained !== null ? parseFloat(obtained) : 0;
          const paperObj = {
            paper_code: p.paperCode,
            paper_name: p.paperName,
            obtained_marks: rawObtained,
            total_marks: maxWtg,
            pct: maxWtg > 0 ? Math.round((rawObtained / maxWtg) * 100) : 0,
            notTaken: !found
          };

          const subjMap = byPhase[paperPhase].subjectsMap;
          if (!subjMap[subjectName]) {
            subjMap[subjectName] = {
              subject_code: p.code || item.code || subjectName.substring(0, 2).toUpperCase(),
              subject_name: subjectName,
              papers: []
            };
          }
          if (!paperObj.notTaken) {
            subjMap[subjectName].papers.push(paperObj);
          }
        });
      });

      // Process subjects Map inside each phase
      Object.values(byPhase).forEach(pInfo => {
        pInfo.subjects = Object.values(pInfo.subjectsMap).map(sub => {
          const papersList = sub.papers;
          const sessional = papersList.filter(p => !p.paper_name.toLowerCase().includes('university') && !p.paper_name.toLowerCase().includes('pre-uni') && !p.paper_name.toLowerCase().includes('pre university'));
          const university = papersList.filter(p => p.paper_name.toLowerCase().includes('university') || p.paper_name.toLowerCase().includes('pre-uni') || p.paper_name.toLowerCase().includes('pre university'));

          const takenPapers = papersList.filter(p => !p.notTaken);
          const combinedPct = takenPapers.length > 0
            ? Math.round(takenPapers.reduce((s, p) => s + p.pct, 0) / takenPapers.length)
            : null;

          return {
            ...sub,
            sessional,
            university,
            combinedPct
          };
        });
        delete pInfo.subjectsMap;
      });

      // Compute Phase-level Combined Percentages
      Object.values(byPhase).forEach(p => {
        const takenSubjects = p.subjects.filter(s => s.combinedPct !== null);
        p.combinedPct = takenSubjects.length > 0
          ? Math.round(takenSubjects.reduce((s, sub) => s + sub.combinedPct, 0) / takenSubjects.length)
          : null;
      });

      // Filter out future phases beyond current year
      // Filter out future phases beyond current year using robust batch-year fallback
      const studentYear = (() => {
        // For MBBS, batch_year is the authoritative source of truth for the phase.
        // Prioritize it over current_year/year to bypass stale cached profiles.
        const by = parseInt(user?.batch_year || user?.batchYear || 0, 10);
        if (by >= 2025) return 1;
        if (by === 2024) return 2;
        if (by === 2023) return 3;
        if (by > 0 && by <= 2022) return 4;

        const cy = parseInt(user?.current_year || user?.year, 10);
        if (cy && cy >= 1 && cy <= 4) return cy;
        return 3;
      })();
      const sorted = Object.values(byPhase)
        .sort((a, b) => getPhaseSortOrder(a.phase) - getPhaseSortOrder(b.phase))
        .filter(p => isMedical ? (p.yr_fk <= studentYear) : (p.combinedPct !== null || p.yr_fk <= studentYear));

      setPhases(sorted);
      if (sorted.length > 0) setExpandedPhase(sorted[sorted.length - 1].phase);

      // Save to cache
      await AsyncStorage.setItem(cacheKey, JSON.stringify({ phases: sorted }));
    } catch (e) {
      console.warn('[ERPResults] performFetch Error:', e);
    } finally {
      if (shouldSetLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  const openSubject = (subject) => {
    setSelectedSubject(subject);
    setModalVisible(true);
  };

  // Overall aggregate
  // Overall aggregate of taken phases
  const takenPhases = phases.filter(p => p.combinedPct !== null);
  const overallPct = takenPhases.length > 0
    ? Math.round(takenPhases.reduce((s, p) => s + p.combinedPct, 0) / takenPhases.length)
    : 0;

  const totalGaps = phases.reduce((s, p) => s + p.subjects.filter(sub => sub.combinedPct !== null && sub.combinedPct < 50).length, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => {
          if (isFaculty) {
            navigation.navigate('FacultyStudentsDirectory');
          } else if (passedStudent) {
            navigation.goBack();
          } else {
            navigation.navigate('ERPHome');
          }
        }}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Academic Results</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{APP_CONFIG.UNIVERSITY_NAME}</Text>
        </View>
      </View>

      {loading ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
          <SkeletonHeader isDark={isDark} />
          <View style={{ gap: 12 }}>
            <SkeletonRow isDark={isDark} />
            <SkeletonRow isDark={isDark} />
            <SkeletonRow isDark={isDark} />
          </View>
        </ScrollView>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadResults(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >

          {/* Hero Banner */}
          <View style={styles.sectionContainer}>
            <LinearGradient
              colors={isDark ? ['#1E1B4B', '#312E81', '#1E1B4B'] : ['#312E81', '#4338CA']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.heroBanner}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <View style={[styles.heroBadge]}>
                  <MaterialCommunityIcons name="lightning-bolt" size={10} color="#EA580C" />
                  <Text style={styles.heroBadgeText}>NMC CBME RESULTS</Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>Overall Performance</Text>
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatVal}>{overallPct}%</Text>
                  <Text style={styles.heroStatLabel}>Combined Avg</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatVal}>{phases.length}</Text>
                  <Text style={styles.heroStatLabel}>Phases</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatVal, totalGaps > 0 ? { color: '#FCA5A5' } : {}]}>{totalGaps}</Text>
                  <Text style={styles.heroStatLabel}>Gaps Found</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* NMC Info */}
          <View style={[styles.nmcInfo, { backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : '#FEF2F2', borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#FCA5A5', marginHorizontal: 20, marginTop: 16 }]}>
            <MaterialIcons name="info-outline" size={14} color="#DC2626" />
            <Text style={[styles.nmcText, { color: '#DC2626' }]}>
              NMC 2024: ≥50% required in each competency. Red = Competency Gap.
            </Text>
          </View>

          {/* Phase Cards */}
          <View style={[styles.sectionContainer, { marginTop: 24 }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {isMedical ? 'Professional Year Results' : 'Semester Results'}
            </Text>
            {phases.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: colors.card, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.border, borderRadius: 16 }}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.textMuted} />
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginTop: 12 }}>No Academic Results Available</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                  We couldn't retrieve your professional year/semester results from the ERP portal. Please verify if your batch details are registered correctly.
                </Text>
              </View>
            ) : (
              phases.map((phase, pi) => {
                const isExpanded = expandedPhase === phase.phase;
                const hasGaps = phase.subjects.some(s => s.combinedPct !== null && s.combinedPct < 50);
                return (
                  <View key={pi} style={styles.phaseBlock}>
                    {/* Phase Header */}
                    <TouchableOpacity
                      style={[styles.phaseCard, {
                        backgroundColor: colors.card,
                        borderColor: hasGaps ? '#FCA5A5' : colors.border,
                      }]}
                      onPress={() => setExpandedPhase(isExpanded ? null : phase.phase)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={isExpanded
                          ? (isDark ? ['#312E81', '#1E1B4B'] : ['#EEF2FF', '#E0E7FF'])
                          : ['transparent', 'transparent']}
                        style={styles.phaseCardInner}
                      >
                        <View style={styles.phaseLeft}>
                          <LinearGradient
                            colors={isExpanded ? ['#6366F1', '#4338CA'] : (isDark ? ['#374151', '#1F2937'] : ['#E5E7EB', '#D1D5DB'])}
                            style={styles.phaseCircle}
                          >
                            <Text style={[styles.phaseCircleText, { color: isExpanded ? '#FFF' : colors.textSecondary }]}>
                              {isMedical
                                ? (phase.phase.includes('1st') ? '1' : phase.phase.includes('2nd') ? '2' : phase.phase.includes('Part I') ? '3A' : '3B')
                                : phase.yr_fk}
                            </Text>
                          </LinearGradient>
                          <View>
                            <Text style={[styles.phaseName, { color: isExpanded ? (isDark ? '#A5B4FC' : '#4338CA') : colors.textPrimary }]}>
                              {phase.phase}
                            </Text>
                            <Text style={[styles.phaseSubCount, { color: colors.textSecondary }]}>
                              {phase.subjects.length} subjects · {hasGaps ? `${phase.subjects.filter(s => s.combinedPct !== null && s.combinedPct < 50).length} gap(s)` : 'All clear'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.phaseRight}>
                          <Text style={[styles.phasePct, {
                            color: phase.combinedPct === null
                              ? colors.textMuted
                              : (phase.combinedPct >= 50
                                  ? (isExpanded ? (isDark ? '#818CF8' : '#4338CA') : colors.textPrimary)
                                  : '#EF4444')
                          }]}>
                            {phase.combinedPct !== null ? `${phase.combinedPct}%` : 'Pending'}
                          </Text>
                          <MaterialIcons name={isExpanded ? 'expand-less' : 'expand-more'} size={24} color={colors.textMuted} />
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Subject List (expanded) */}
                    {isExpanded && (
                      <View style={styles.subjectList}>
                        {phase.subjects.map((sub, si) => {
                          const isGap = sub.combinedPct !== null && sub.combinedPct < 50;
                          const sessTotal = sub.sessional?.reduce((s, p) => s + (p.obtained_marks || 0), 0) || 0;
                          const uniTotal = sub.university?.reduce((s, p) => s + (p.obtained_marks || 0), 0) || 0;

                          return (
                            <TouchableOpacity
                              key={si}
                              style={[styles.subjectCard, {
                                backgroundColor: colors.card,
                                borderColor: isGap ? '#FCA5A5' : colors.border,
                              }]}
                              onPress={() => openSubject(sub)}
                              activeOpacity={0.8}
                            >
                              <View style={styles.subjectTop}>
                                <View style={{ flex: 1 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={[styles.subjectCode, { color: colors.textMuted }]}>{sub.subject_code}</Text>
                                    {isGap && (
                                      <View style={styles.gapBadge}><Text style={styles.gapBadgeText}>GAP</Text></View>
                                    )}
                                  </View>
                                  <Text style={[styles.subjectName, { color: colors.textPrimary }]}>{sub.subject_name}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                  <Text style={[styles.subjectPct, {
                                    color: sub.combinedPct === null ? colors.textMuted : (isGap ? '#EF4444' : '#10B981')
                                  }]}>
                                    {sub.combinedPct !== null ? `${sub.combinedPct}%` : 'Pending'}
                                  </Text>
                                  <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                                </View>
                              </View>

                              {/* Internal vs University Marks Row */}
                              <View style={[styles.marksRow, { borderTopColor: colors.border }]}>
                                <View style={styles.markItem}>
                                  <View style={[styles.markDot, { backgroundColor: '#6366F1' }]} />
                                  <View>
                                    <Text style={[styles.markLabel, { color: colors.textMuted }]}>Internal</Text>
                                    <Text style={[styles.markVal, { color: '#6366F1' }]}>{sessTotal} M</Text>
                                  </View>
                                </View>
                                <View style={[styles.marksDivider, { backgroundColor: colors.border }]} />
                                <View style={styles.markItem}>
                                  <View style={[styles.markDot, { backgroundColor: '#F59E0B' }]} />
                                  <View>
                                    <Text style={[styles.markLabel, { color: colors.textMuted }]}>University</Text>
                                    <Text style={[styles.markVal, { color: '#F59E0B' }]}>{uniTotal} M</Text>
                                  </View>
                                </View>
                                <View style={[styles.marksDivider, { backgroundColor: colors.border }]} />
                                <View style={styles.markItem}>
                                  <Text style={[styles.viewDetailText, { color: colors.primary }]}>View Details →</Text>
                                </View>
                              </View>

                              {/* Progress Bar */}
                              <View style={[styles.subjectBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                                <View style={[styles.subjectBarFill, {
                                  width: `${sub.combinedPct !== null ? Math.min(sub.combinedPct, 100) : 0}%`,
                                  backgroundColor: sub.combinedPct === null ? colors.border : (isGap ? '#EF4444' : sub.combinedPct >= 75 ? '#10B981' : '#F59E0B'),
                                }]} />
                                <View style={styles.thresholdMarker50} />
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              }))}
          </View>
        </ScrollView>
      )}

      {/* Subject Detail Modal */}
      <SubjectDetailModal
        visible={modalVisible}
        subject={selectedSubject}
        onClose={() => setModalVisible(false)}
        accessToken={accessToken}
        student={user}
      />
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  sectionContainer: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },

  // Hero
  heroBanner: { borderRadius: 24, padding: 24, overflow: 'hidden' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  heroBadgeText: { fontSize: 10, fontWeight: '800', color: '#EA580C' },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', marginBottom: 16 },
  heroStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, gap: 8 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatVal: { fontSize: 26, fontWeight: '900', color: '#FFF' },
  heroStatLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  nmcInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  nmcText: { fontSize: 11, fontWeight: '600', flex: 1 },

  // Phase
  phaseBlock: { marginBottom: 16 },
  phaseCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  phaseCardInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  phaseLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  phaseCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  phaseCircleText: { fontSize: 14, fontWeight: '900' },
  phaseName: { fontSize: 16, fontWeight: '800' },
  phaseSubCount: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  phaseRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  phasePct: { fontSize: 22, fontWeight: '900' },

  // Subject
  subjectList: { gap: 10, paddingTop: 10, paddingLeft: 8 },
  subjectCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  subjectTop: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, paddingBottom: 12 },
  subjectCode: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  subjectName: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  subjectPct: { fontSize: 20, fontWeight: '900' },
  marksRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  markItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  markDot: { width: 8, height: 8, borderRadius: 4 },
  markLabel: { fontSize: 10, fontWeight: '600' },
  markVal: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  marksDivider: { width: 1, marginHorizontal: 4 },
  viewDetailText: { fontSize: 12, fontWeight: '700' },
  subjectBar: { height: 6, marginHorizontal: 16, marginBottom: 14, borderRadius: 3, overflow: 'hidden' },
  subjectBarFill: { height: '100%', borderRadius: 3 },
  thresholdMarker50: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(0,0,0,0.15)' },
  gapBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  gapBadgeText: { fontSize: 9, fontWeight: '900', color: '#DC2626' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { height: '92%', borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  modalSubjectCode: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  modalSubjectName: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  marksSummaryRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  marksSummaryItem: { flex: 1, alignItems: 'center' },
  marksSummaryLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  marksSummaryVal: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  marksSummaryDivider: { width: 1 },

  // Tab Bar
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 8 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3, position: 'relative' },
  tabItemActive: {},
  tabLabel: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  tabIndicator: { position: 'absolute', bottom: 0, left: 8, right: 8, height: 3, borderTopLeftRadius: 2, borderTopRightRadius: 2 },

  // Competency Tab
  gapWarning: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 4 },
  compCard: { borderRadius: 16, padding: 14, borderWidth: 1 },
  compHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  compCodeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  compCode: { fontSize: 11, fontWeight: '800' },
  compDesc: { fontSize: 12, lineHeight: 17, marginTop: 6 },
  compPct: { fontSize: 20, fontWeight: '900' },
  compMarks: { fontSize: 11, marginTop: 2 },
  compBar: { height: 8, borderRadius: 4, overflow: 'hidden', position: 'relative' },
  compBarFill: { height: '100%', borderRadius: 4 },
  threshold50: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(0,0,0,0.2)' },
  compThresholdLabel: { fontSize: 10, marginTop: 4 },

  // Attempted Paper Tab
  paperHeader: { borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 8 },
  paperUniversity: { fontSize: 15, fontWeight: '900', textAlign: 'center' },
  paperExamTitle: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  paperMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  paperMetaText: { fontSize: 12, fontWeight: '600' },
  paperDivider: { height: 1, marginVertical: 12 },
  paperInst: { fontSize: 11, lineHeight: 16, fontStyle: 'italic' },
  sectionHeader: { padding: 10, borderRadius: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '800' },
  mainQuestionCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16, gap: 10 },
  mainQuestionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mainQuestionNo: { fontSize: 13, fontWeight: '900' },
  mainQuestionScoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  mainQuestionText: { fontSize: 13, fontWeight: '800', lineHeight: 19 },
  subQuestionRow: { borderRadius: 12, padding: 12, borderWidth: 1, gap: 8, marginTop: 4 },
  subQuestionText: { fontSize: 12, lineHeight: 17, fontWeight: '750' },
  mcqOptionCard: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, borderWidth: 1, gap: 8 },
  mcqOptionCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  qCompBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  qCompText: { fontSize: 10, fontWeight: '700', color: '#6366F1' },
  marksChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  marksChipText: { fontSize: 11, fontWeight: '800' },

  // Chart Tab
  chartTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  chartSub: { fontSize: 12, textAlign: 'center', marginBottom: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, borderWidth: 1 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, fontWeight: '700', width: 50 },
  legendBar: { height: 6, borderRadius: 3, flex: 1, overflow: 'hidden' },
  legendBarFill: { height: '100%', borderRadius: 3 },
  legendPct: { fontSize: 12, fontWeight: '800', width: 36, textAlign: 'right' },

});

export default ERPResultsScreen;
