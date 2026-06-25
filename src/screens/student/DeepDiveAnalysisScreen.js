import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { computeSkillGap, generateLearningPath } from '../../data/aiEngine';
import { TimelineSkeleton, SkeletonBlock } from '../../components/SkeletonLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getResults } from '../../data/apiService';

const { width } = Dimensions.get('window');

const DeepDiveAnalysisScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const { user, accessToken } = useUser();
  const isMed = user && (
    user.course?.replace(/\./g, '').toLowerCase().includes('mbbs') ||
    user.course?.toLowerCase().includes('medicine') ||
    user.category?.toLowerCase().includes('medical')
  );

  // Fetch academic results to power real-score competency analysis
  const [academicResults, setAcademicResults] = useState([]);
  useEffect(() => {
    if (!accessToken) return;
    getResults(accessToken)
      .then(data => { if (data && data.length > 0) setAcademicResults(data); })
      .catch(() => {});
  }, [accessToken]);

  // Compute gap data reactively whenever results or user changes
  const gapData = useMemo(() => {
    if (!user) return { matchPct: 0, missingSkills: [], expectedSkills: [], academicExpectedSkills: [], academicMissingSkills: [], academicMatchPct: 0, industryExpectedSkills: [], industryMissingSkills: [], industryMatchPct: 0, skillScores: {}, completedPhases: [] };
    return computeSkillGap(user, academicResults);
  }, [user, academicResults]);

  const [activeTab, setActiveTab] = useState('academic');
  const [activeSkill, setActiveSkill] = useState(null);
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewedSkills, setViewedSkills] = useState({});

  React.useEffect(() => {
    AsyncStorage.getItem('@viewed_syllabus_gaps').then(val => {
      if (val) setViewedSkills(JSON.parse(val));
    });
  }, []);

  const handleExplorePath = async (skillName) => {
    setActiveSkill(skillName);
    setLoading(true);
    setLearningPath(null);
    try {
      const cacheKey = `@deepdive_path_${skillName.replace(/\s+/g, '_')}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        setLearningPath(JSON.parse(cached));
      } else {
        const path = await generateLearningPath(user, skillName, accessToken);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(path));
        setLearningPath(path);
      }
      
      const updated = { ...viewedSkills, [skillName]: true };
      setViewedSkills(updated);
      await AsyncStorage.setItem('@viewed_syllabus_gaps', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const listExpected = activeTab === 'academic' ? gapData.academicExpectedSkills : gapData.industryExpectedSkills;
  const listMissing = activeTab === 'academic' ? gapData.academicMissingSkills : gapData.industryMissingSkills;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{isMed ? 'Clinical Competency Analysis' : 'Deep Dive Analysis'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <LinearGradient
          colors={isDark ? ['#1E1B4B', '#312E81'] : ['#4338CA', '#312E81']}
          style={styles.heroCard}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.heroTitle}>{isMed ? 'Overall Clinical Readiness' : 'Overall Readiness'}</Text>
              <Text style={styles.readinessScore}>{gapData.matchPct}%</Text>
            </View>
            <MaterialCommunityIcons name="shield-check-outline" size={44} color="rgba(255,255,255,0.4)" />
          </View>
          
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 14 }} />

          {/* Academic & Industry Split Bars */}
          <View style={{ gap: 12 }}>
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>{isMed ? 'PROF THEORY PREPARATION' : 'ACADEMIC PREPARATION'}</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>{gapData.academicMatchPct}%</Text>
              </View>
              <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 }}>
                <View style={{ height: '100%', width: `${gapData.academicMatchPct}%`, backgroundColor: '#3B82F6', borderRadius: 3 }} />
              </View>
            </View>

            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>{isMed ? 'CLINICAL COMPETENCY' : 'INDUSTRY ALIGNMENT'}</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>{gapData.industryMatchPct}%</Text>
              </View>
              <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 }}>
                <View style={{ height: '100%', width: `${gapData.industryMatchPct}%`, backgroundColor: '#A78BFA', borderRadius: 3 }} />
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Completed Phases Strip — MBBS only, shown above the tab selector */}
        {isMed && gapData.completedPhases && gapData.completedPhases.length > 0 && (
          <View style={{ marginBottom: 24, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Completed Professional Years</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {gapData.completedPhases.map((cp, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: isDark ? 'rgba(16,185,129,0.25)' : '#A7F3D0' }}>
                  <MaterialCommunityIcons name="check-circle" size={14} color="#10B981" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#10B981' }}>{cp.phase}</Text>
                  <View style={{ width: 1, height: 12, backgroundColor: isDark ? 'rgba(16,185,129,0.3)' : '#A7F3D0' }} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#6EE7B7' : '#059669' }}>Avg {cp.avg}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}


        {/* Tab Selector */}
        <View style={{ flexDirection: 'row', backgroundColor: isDark ? colors.card : '#F1F5F9', borderRadius: 16, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
          <TouchableOpacity 
            style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: activeTab === 'academic' ? (isDark ? '#312E81' : '#FFFFFF') : 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: activeTab === 'academic' ? 0.05 : 0, shadowRadius: 3, elevation: activeTab === 'academic' ? 2 : 0 }}
            onPress={() => setActiveTab('academic')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="book" size={16} color={activeTab === 'academic' ? colors.primary : colors.textSecondary} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: activeTab === 'academic' ? colors.textPrimary : colors.textSecondary }}>{isMed ? 'Prof Subjects' : 'Academic Subjects'}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: activeTab === 'industry' ? (isDark ? '#312E81' : '#FFFFFF') : 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: activeTab === 'industry' ? 0.05 : 0, shadowRadius: 3, elevation: activeTab === 'industry' ? 2 : 0 }}
            onPress={() => setActiveTab('industry')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {isMed ? (
                <MaterialCommunityIcons name="stethoscope" size={16} color={activeTab === 'industry' ? colors.primary : colors.textSecondary} />
              ) : (
                <Feather name="briefcase" size={16} color={activeTab === 'industry' ? colors.primary : colors.textSecondary} />
              )}
              <Text style={{ fontSize: 13, fontWeight: '800', color: activeTab === 'industry' ? colors.textPrimary : colors.textSecondary }}>{isMed ? 'Clinical Skills' : 'Industry Skills'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: 18, marginBottom: 16 }]}>
          {activeTab === 'academic' 
            ? (isMed ? 'Prof Syllabus Gaps' : 'Course Syllabus Gaps') 
            : (isMed ? 'Clinical Competency Gaps' : 'Career Skill Gaps')}
        </Text>

        {listExpected.map((skill, index) => {
          const isMissing = listMissing.includes(skill);
          // Use the precomputed score from gapData.skillScores (derived from real marks or
          // deterministic hash fallback). Never show 0% for MBBS students.
          const score = gapData.skillScores?.[skill] ??
            (isMissing ? 62 : 90); // safe fallback if skillScores missing
          const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
          const priority = isMissing ? (score < 50 ? 'HIGH' : 'MEDIUM') : 'LOW';

          return (
            <View key={index} style={[styles.skillCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.skillHeader}>
                <View>
                  <Text style={[styles.skillTitle, { color: colors.textPrimary }]}>{skill}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.priorityText, { color: color }]}>{priority} PRIORITY</Text>
                  </View>
                </View>
                <View style={styles.scoreBox}>
                  <Text style={[styles.scoreVal, { color: color }]}>{score}%</Text>
                </View>
              </View>

              <View style={[styles.progressBg, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
                <View style={[styles.progressFill, { width: `${score}%`, backgroundColor: color }]} />
              </View>

              <View style={styles.gapSection}>
                <Text style={[styles.gapLabel, { color: colors.textSecondary }]}>Status:</Text>
                <View style={styles.gapItem}>
                  <MaterialCommunityIcons 
                    name={isMissing ? "alert-circle-outline" : "check-circle-outline"} 
                    size={16} 
                    color={color} 
                  />
                  <Text style={[styles.gapText, { color: colors.textPrimary }]}>
                    {isMissing 
                      ? (activeTab === 'academic' 
                          ? (isMed ? "This subject is currently a gap in your professional preparation." : "This subject is currently a gap in your academic syllabus.") 
                          : (isMed ? "This clinical skill is currently a gap in your clinical competency." : "This skill is currently a gap in your career readiness."))
                      : (activeTab === 'academic' 
                          ? (isMed ? "You have completed this professional subject." : "You have completed this subject syllabus.") 
                          : (isMed ? "You have verified clinical proficiency." : "You have verified proficiency in this skill."))
                    }
                  </Text>
                </View>
              </View>

              {isMissing && (() => {
                const isViewed = viewedSkills[skill];
                const btnBorderColor = isViewed ? '#10B981' : '#EA580C';
                const btnTextColor = isViewed ? '#10B981' : '#EA580C';
                const btnText = isViewed 
                  ? 'View'
                  : (activeTab === 'academic' 
                      ? (isMed ? 'Explore Clinical Syllabus Guide' : 'Explore Syllabus Guide') 
                      : (isMed ? 'Explore Clinical Pathway' : 'Explore Learning Path'));

                return (
                  <TouchableOpacity 
                    style={[styles.learnBtn, { borderColor: btnBorderColor }]}
                    onPress={() => handleExplorePath(skill)}
                  >
                    <Text style={[styles.learnBtnText, { color: btnTextColor }]}>
                      {btnText}
                    </Text>
                  </TouchableOpacity>
                );
              })()}
            </View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Learning Path Modal */}
      <Modal
        visible={activeSkill !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveSkill(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{isMed ? 'Clinical Learning Path' : 'AI Learning Path'}</Text>
              <TouchableOpacity onPress={() => setActiveSkill(null)} style={styles.modalCloseBtn}>
                <Feather name="x" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.modalLoading}>
                <SkeletonBlock width={'60%'} height={24} borderRadius={10} style={{ marginBottom: 8 }} />
                <SkeletonBlock width={'80%'} height={13} borderRadius={6} style={{ marginBottom: 24 }} />
                <TimelineSkeleton steps={3} />
              </View>
            ) : learningPath ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                <Text style={[styles.skillSubject, { color: colors.textPrimary }]}>{learningPath.skill}</Text>
                <Text style={[styles.skillSummary, { color: colors.textSecondary }]}>{learningPath.summary}</Text>

                <View style={styles.timeline}>
                  {learningPath.steps.map((step, idx) => (
                    <View key={idx} style={styles.timelineStep}>
                      <View style={styles.timelineLeft}>
                        <View style={styles.timelineNode}>
                          <Text style={styles.nodeText}>{step.step}</Text>
                        </View>
                        {idx < learningPath.steps.length - 1 && <View style={styles.timelineLine} />}
                      </View>

                      <View style={styles.timelineRight}>
                        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>{step.title}</Text>
                        <View style={styles.timeBadge}>
                          <Feather name="clock" size={12} color="#EA580C" />
                          <Text style={styles.timeText}>{step.timeframe}</Text>
                        </View>

                        <Text style={[styles.subTitleLabel, { color: colors.textSecondary }]}>{isMed ? 'Clinical Topics / High-yield Points:' : 'Core Topics:'}</Text>
                        <View style={styles.topicsGrid}>
                          {step.topics.map((topic, i) => (
                            <View key={i} style={[styles.topicChip, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                              <Text style={[styles.topicChipText, { color: colors.textPrimary }]}>{topic}</Text>
                            </View>
                          ))}
                        </View>

                        <Text style={[styles.subTitleLabel, { color: colors.textSecondary }]}>{isMed ? 'Standard Textbooks & Clinical Guides:' : 'Recommended Resources:'}</Text>
                        {step.resources.map((res, i) => (
                          <View key={i} style={styles.resourceItem}>
                            <Feather name="book-open" size={14} color="#4338CA" />
                            <Text style={[styles.resourceText, { color: colors.textPrimary }]}>{res}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.modalLoading}>
                <Text style={{ color: colors.textPrimary }}>Failed to load learning path.</Text>
              </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  scroll: { padding: 20 },
  heroCard: { borderRadius: 28, padding: 24, marginBottom: 32 },
  heroTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  readinessRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 12, marginBottom: 16 },
  readinessScore: { color: '#FFFFFF', fontSize: 48, fontWeight: '900' },
  readinessInfo: { flex: 1 },
  readinessLabel: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', marginBottom: 6 },
  miniProgressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 },
  miniProgressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 3 },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 18 },
  sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20 },
  skillCard: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 16 },
  skillHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  skillTitle: { fontSize: 18, fontWeight: '800' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 6, alignSelf: 'flex-start' },
  priorityText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  scoreBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.03)', justifyContent: 'center', alignItems: 'center' },
  scoreVal: { fontSize: 14, fontWeight: '900' },
  progressBg: { height: 8, borderRadius: 4, marginBottom: 20 },
  progressFill: { height: '100%', borderRadius: 4 },
  gapSection: { marginBottom: 20 },
  gapLabel: { fontSize: 12, fontWeight: '700', marginBottom: 12 },
  gapItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gapText: { fontSize: 14, fontWeight: '600', flex: 1 },
  learnBtn: { width: '100%', paddingVertical: 14, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  learnBtnText: { fontSize: 14, fontWeight: '800' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
    paddingHorizontal: 24,
    maxHeight: '85%',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalLoading: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
    paddingHorizontal: 30,
  },
  modalScroll: {
    paddingVertical: 24,
  },
  skillSubject: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  skillSummary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineStep: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  timelineLeft: {
    alignItems: 'center',
  },
  timelineNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 8,
    marginBottom: -8,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(234,88,12,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 16,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
  },
  subTitleLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  topicChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  topicChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  resourceText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default DeepDiveAnalysisScreen;
