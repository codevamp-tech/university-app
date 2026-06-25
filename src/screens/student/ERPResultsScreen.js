import React, { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getAcademicSubjects } from '../../data/aiEngine';

import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { getResults } from '../../data/apiService';

const { width } = Dimensions.get('window');

const ERPResultsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, accessToken } = useUser();

  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const userSem = user?.semester || 7;
  const sgpaHistory = user?.sgpaHistory || [];

  const isMedical = user?.course?.replace(/\./g, '').toUpperCase().includes('MBBS') || user?.category?.toLowerCase() === 'medical';
  const termLabel = isMedical ? 'Phase' : 'Semester';

  const getDisplayTerm = (semKey) => {
    if (!isMedical) return semKey;
    if (semKey === 'I' || semKey === 'II') return 'I';
    if (semKey === 'III' || semKey === 'IV') return 'II';
    if (semKey === 'V' || semKey === 'VI') return 'III';
    if (semKey === 'VII') return 'IV';
    return semKey;
  };

  const getMedicalCircleText = (semKey) => {
    if (semKey === 'I' || semKey === 'II') return '1st';
    if (semKey === 'III' || semKey === 'IV') return '2nd';
    if (semKey === 'V' || semKey === 'VI') return '3rd P1';
    if (semKey === 'VII') return '3rd P2';
    return semKey;
  };

  const getMedicalProfName = (semKey) => {
    if (semKey === 'I' || semKey === 'II') return '1st Prof';
    if (semKey === 'III' || semKey === 'IV') return '2nd Prof';
    if (semKey === 'V' || semKey === 'VI') return '3rd Prof Part I';
    if (semKey === 'VII') return '3rd Prof Part II';
    return semKey;
  };

  const getMedicalProfCircleText = (profName) => {
    if (profName === '1st Prof') return '1st';
    if (profName === '2nd Prof') return '2nd';
    if (profName === '3rd Prof Part I') return '3rd P1';
    if (profName === '3rd Prof Part II') return '3rd P2';
    return profName;
  };

  // Dynamically expand to the current semester
  const currentSemRoman = roman[userSem - 1] || 'VII';
  const currentProfName = isMedical ? getMedicalProfName(currentSemRoman) : currentSemRoman;
  const [expandedSem, setExpandedSem] = useState(currentProfName);
  const [apiSemesterData, setApiSemesterData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadResults() {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      try {
        const data = await getResults(accessToken);
        if (data && data.length > 0) {
          const semMap = {};
          // Initialize semesters
          for (let i = 1; i <= userSem; i++) {
            const rName = roman[i - 1];
            const isCurrent = i === userSem;
            semMap[rName] = {
              label: isCurrent ? (isMedical ? `Year ${new Date().getFullYear()} • Ongoing` : `Fall ${new Date().getFullYear()} • Ongoing Evaluation`) : `Completed`,
              sgpa: isCurrent ? (isMedical ? '74.50%' : '8.50') : (isMedical ? '71.20%' : '8.00'),
              subjects: []
            };
          }

          data.forEach(item => {
            const semIndex = item.semester;
            const rName = roman[semIndex - 1] || `${semIndex}`;
            if (!semMap[rName]) {
              semMap[rName] = {
                label: semIndex === userSem ? (isMedical ? `Year ${new Date().getFullYear()} • Ongoing` : `Fall ${new Date().getFullYear()} • Ongoing Evaluation`) : `Completed`,
                sgpa: isMedical ? '70.00%' : '8.00',
                subjects: []
              };
            }

            if (isMedical) {
              const seedVal = item.subject_code.charCodeAt(0) + item.semester;
              const theory = 50 + (seedVal % 45);
              const practical = 55 + (seedVal % 40);
              const total = theory + practical;
              const max = 200;
              const pct = (total / max) * 100;
              semMap[rName].subjects.push({
                code: item.subject_code,
                name: item.subject_name || item.subject_code,
                theory,
                practical,
                total,
                max,
                result: pct >= 75 ? 'DISTINCTION' : 'PASS'
              });
            } else {
              semMap[rName].subjects.push({
                code: item.subject_code,
                name: item.subject_name || item.subject_code,
                credits: item.credits || 3,
                grade: item.grade || 'A'
              });
            }
          });

          // Apply historical SGPAs if they match
          Object.keys(semMap).forEach(rName => {
            const semIdx = roman.indexOf(rName);
            if (semIdx !== -1 && sgpaHistory[semIdx]) {
              if (isMedical) {
                const pctVal = 65 + (sgpaHistory[semIdx] * 1.5) + (semIdx * 0.5);
                semMap[rName].sgpa = `${pctVal.toFixed(2)}%`;
              } else {
                semMap[rName].sgpa = sgpaHistory[semIdx].toFixed(2);
              }
            }
          });

          setApiSemesterData(semMap);
        }
      } catch (err) {
        console.warn('[ResultsScreen] Error fetching results:', err);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [accessToken, userSem]);

  const semesterData = apiSemesterData || {};

  const displayData = React.useMemo(() => {
    if (!isMedical) return semesterData;

    const grouped = {};
    const order = ['1st Prof', '2nd Prof', '3rd Prof Part I', '3rd Prof Part II'];
    order.forEach(prof => {
      grouped[prof] = {
        label: 'Completed',
        sgpa: '0.00%',
        subjects: [],
        percentageSum: 0,
        count: 0
      };
    });

    Object.entries(semesterData).forEach(([semRoman, data]) => {
      const prof = getMedicalProfName(semRoman);
      if (!grouped[prof]) {
        grouped[prof] = {
          label: 'Completed',
          sgpa: '0.00%',
          subjects: [],
          percentageSum: 0,
          count: 0
        };
      }
      
      grouped[prof].subjects.push(...data.subjects);
      const pct = parseFloat(data.sgpa.replace('%', '')) || 0;
      grouped[prof].percentageSum += pct;
      grouped[prof].count += 1;
      
      if (data.label.includes('Ongoing')) {
        grouped[prof].label = data.label;
      }
    });

    const finalGrouped = {};
    order.forEach(prof => {
      const g = grouped[prof];
      if (g.count > 0) {
        const avg = g.percentageSum / g.count;
        finalGrouped[prof] = {
          label: g.label,
          sgpa: `${avg.toFixed(2)}%`,
          subjects: g.subjects
        };
      }
    });
    return finalGrouped;
  }, [semesterData, isMedical]);

  // Calculate total credits
  const totalCredits = 180;
  const completedCredits = semesterData ? Object.keys(semesterData).length * 22 : 0;
  const creditsPct = Math.min(Math.round((completedCredits / totalCredits) * 100), 100);

  // Medical journey calculation
  const totalYears = 4.5;
  const completedYears = Math.max(0, userSem - 1) * 0.5;
  const medicalProgressPct = Math.min(Math.round((completedYears / totalYears) * 100), 100);


  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('ERPHome')} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Academics</Text>
        </View>
      </View>



      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{isMedical ? 'Results' : `${termLabel} Results`}</Text>
          {(() => {
            const yearNum = Math.ceil(userSem / 2);
            const YEAR_ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
            const yearOrdinal = YEAR_ORDINALS[yearNum - 1] || `${yearNum}th`;
            return (
              <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
                {isMedical ? `MBBS ${yearOrdinal} year` : `${user?.course || 'B.Tech CSE'} • Semester ${currentSemRoman}`}
              </Text>
            );
          })()}
          <TouchableOpacity 
            style={[styles.downloadBtn, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border, borderWidth: 1, opacity: 0.85 }]}
            onPress={() => Alert.alert('🔒 Demo Lock', 'Downloading Provisional Marksheet is locked in this demo. Contact admin to unlock.')}
          >
            <MaterialIcons name="lock" size={18} color={isDark ? '#818CF8' : '#4338CA'} />
            <Text style={[styles.downloadBtnText, { color: isDark ? '#818CF8' : '#4338CA' }]}>Download Provisional Marksheet</Text>
          </TouchableOpacity>
        </View>




        {/* CGPA Card */}
        <View style={styles.sectionContainer}>
          <LinearGradient
            colors={isDark ? ['#7C2D12', '#431407'] : ['#F97316', '#EA580C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cgpaCard}
          >

            <Text style={[styles.cgpaLabel, { color: 'rgba(255,255,255,0.7)' }]}>
              {isMedical ? 'AGGREGATE PERCENTAGE' : 'CUMULATIVE GRADE'}
            </Text>
            <Text style={styles.cgpaValue}>
              {isMedical ? (displayData[currentProfName]?.sgpa || '76.40%') : (user ? user.cgpa.toFixed(2) : '8.42')}
            </Text>
            <View style={styles.cgpaBadge}>
              <MaterialIcons name={isMedical ? "check-circle" : "trending-up"} size={14} color="#FFFFFF" />
              <Text style={styles.cgpaBadgeText}>
                {isMedical ? 'PASSED ALL PAPERS' : 'TOP 5% OF BATCH'}
              </Text>
            </View>
          </LinearGradient>
        </View>


        {/* Credits */}
        <View style={styles.sectionContainer}>
          <View style={[styles.creditsCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <Text style={[styles.creditsLabel, { color: colors.textSecondary }]}>
              {isMedical ? 'MBBS ACADEMIC JOURNEY' : 'ACADEMIC PROGRESS'}
            </Text>
            <View style={styles.creditsRow}>
              {isMedical ? (
                <>
                  <Text style={[styles.creditsValue, { color: colors.textPrimary }]}>{completedYears.toFixed(1)}</Text>
                  <Text style={[styles.creditsTotal, { color: colors.textSecondary }]}>/ {totalYears} Years Completed</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.creditsValue, { color: colors.textPrimary }]}>{completedCredits}</Text>
                  <Text style={[styles.creditsTotal, { color: colors.textSecondary }]}>/ {totalCredits} Credits</Text>
                </>
              )}
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
              <View style={[
                styles.progressBarFill, 
                { 
                  width: `${isMedical ? medicalProgressPct : creditsPct}%`, 
                  backgroundColor: isDark ? '#34D399' : '#059669' 
                }
              ]} />
            </View>
          </View>
        </View>




        {/* Transcript Request */}
        <View style={styles.sectionContainer}>
          <LinearGradient colors={['#4953AC', '#343D96']} style={styles.transcriptCard}>
            <Text style={styles.transcriptTitle}>Official Transcript</Text>
            <Text style={styles.transcriptDesc}>Need a stamped and signed copy for higher studies or placements?</Text>
            <TouchableOpacity 
              style={styles.transcriptBtn}
              onPress={() => Alert.alert('🔒 Demo Lock', 'Official Transcript Request is locked in this demo. Contact admin to unlock.')}
            >
              <Text style={styles.transcriptBtnText}>🔒 Request Official Transcript</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Semester Timeline */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.timelineTitle, { color: colors.textPrimary }]}>Academic Timeline</Text>


          {Object.keys(displayData).length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, borderColor: colors.border, borderWidth: 1, marginBottom: 12 }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>No academic results available</Text>
            </View>
          ) : (
            Object.entries(displayData).map(([sem, data]) => {
              const isExpanded = expandedSem === sem;
              const isActive = isMedical ? (sem === currentProfName) : (sem === currentSemRoman);
              const displayTermName = getDisplayTerm(sem);
              return (
                <View key={sem}>
                  <TouchableOpacity
                    style={[
                      styles.semHeader,
                      { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
                      isActive && { borderColor: colors.primary, borderWidth: 1.5, backgroundColor: isDark ? 'rgba(234, 88, 12, 0.08)' : '#FFF7ED' }
                    ]}
                    onPress={() => setExpandedSem(isExpanded ? null : sem)}
                  >
                    <View style={styles.semHeaderLeft}>
                      <View style={[
                        styles.semCircle,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' },
                        isActive && { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.2)' : '#FFEDD5' }
                      ]}>
                        <Text style={[styles.semCircleText, { color: colors.textSecondary }, isActive && { color: colors.primary }]}>
                          {isMedical ? getMedicalProfCircleText(sem) : displayTermName}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.semName, { color: colors.textPrimary }]}>
                          {isMedical ? sem : `${termLabel} ${displayTermName}`}
                        </Text>
                        <Text style={[styles.semLabel, { color: colors.textSecondary }]}>{data.label}</Text>
                      </View>
                    </View>
                    <View style={styles.semRight}>
                      <View>
                        <Text style={[styles.sgpaLabel, { color: colors.textSecondary }]}>
                          {isMedical ? 'PERCENT' : 'SGPA'}
                        </Text>
                        <Text style={[styles.sgpaValue, { color: isActive ? colors.primary : colors.textPrimary }]}>{data.sgpa}</Text>
                      </View>
                      <MaterialIcons
                        name={isExpanded ? 'expand-less' : 'expand-more'}
                        size={24}
                        color={colors.textSecondary}
                      />
                    </View>
                  </TouchableOpacity>

                  {isExpanded && data.subjects.length > 0 && (
                    <View style={[styles.subjectsContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.background }]}>
                      {data.subjects.map((sub, idx) => (
                        <View key={idx} style={[styles.subjectRow, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                          <View style={styles.subjectInfo}>
                            <Text style={[styles.subjectCode, { color: isDark ? '#34D399' : '#059669' }]}>{sub.code}</Text>
                            <Text style={[styles.subjectName, { color: colors.textPrimary }]}>{sub.name}</Text>
                            {isMedical && (
                              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                                Theory: {sub.theory}/100 · Practical: {sub.practical}/100
                              </Text>
                            )}
                          </View>
                          <View style={styles.subjectRight}>
                            {isMedical ? (
                              <>
                                <View style={[styles.creditBox, { alignItems: 'flex-start', marginRight: 10 }]}>
                                  <Text style={[styles.creditLabel, { color: colors.textSecondary, fontSize: 8 }]}>MARKS</Text>
                                  <Text style={[styles.creditValue, { color: colors.textPrimary, fontSize: 12 }]}>{sub.theory + sub.practical}/200</Text>
                                </View>
                                <View style={[
                                  styles.gradeBox, 
                                  { 
                                    backgroundColor: sub.result === 'DISTINCTION' ? '#F59E0B' : '#10B981', 
                                    width: 62 
                                  }
                                ]}>
                                  <Text style={[styles.gradeText, { fontSize: 9, fontWeight: '900' }]}>
                                    {sub.result === 'DISTINCTION' ? 'DIST.' : 'PASS'}
                                  </Text>
                                </View>
                              </>
                            ) : (
                              <>
                                <View style={styles.creditBox}>
                                  <Text style={[styles.creditLabel, { color: colors.textSecondary }]}>CREDITS</Text>
                                  <Text style={[styles.creditValue, { color: colors.textPrimary }]}>{sub.credits}</Text>
                                </View>
                                <View style={[styles.gradeBox, { backgroundColor: colors.primary }]}>
                                  <Text style={styles.gradeText}>{sub.grade}</Text>
                                </View>
                              </>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}

          {Object.keys(displayData).length > 0 && (
            <TouchableOpacity style={styles.showAllBtn}>
              <MaterialIcons name="history" size={20} color={colors.primary} />
              <Text style={[styles.showAllText, { color: colors.primary }]}>
                Show All {isMedical ? 'Professional Years' : `${termLabel}s`} (I - {isMedical ? getMedicalProfCircleText(getMedicalProfName(roman[userSem - 2] || 'I')) : (userSem > 1 ? (roman[userSem - 2] || (userSem - 1)) : 'I')})
              </Text>
            </TouchableOpacity>
          )}


        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1,
  },

  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },

  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },

  notifBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 20 },
  sectionContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  heroTitle: { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  heroSub: { fontSize: 14, marginTop: 4, fontWeight: '500' },

  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 14, alignSelf: 'flex-start', marginTop: 16,
  },
  downloadBtnText: { fontSize: 13, fontWeight: '700' },


  cgpaCard: {
    borderRadius: 20, padding: 28, marginBottom: 4,
    shadowColor: '#EA580C', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 6, overflow: 'hidden',
  },
  cgpaLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  cgpaValue: { fontSize: 56, fontWeight: '900', color: '#FFFFFF', letterSpacing: -2 },
  cgpaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 8,
  },
  cgpaBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  creditsCard: {
    borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },

  creditsLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  creditsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8 },
  creditsValue: { fontSize: 36, fontWeight: '900' },
  creditsTotal: { fontSize: 15, fontWeight: '600' },

  progressBarBg: { height: 8, borderRadius: 4, marginTop: 20 },
  progressBarFill: { height: '100%', borderRadius: 4 },

  transcriptCard: { borderRadius: 20, padding: 24, overflow: 'hidden' },
  transcriptTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', marginBottom: 6 },
  transcriptDesc: { fontSize: 13, color: 'rgba(243,241,255,0.8)', lineHeight: 20, marginBottom: 18 },
  transcriptBtn: { backgroundColor: '#FFFFFF', paddingVertical: 14, borderRadius: 30, alignItems: 'center' },
  transcriptBtnText: { fontWeight: '800', color: '#4338CA', fontSize: 14 },
  timelineTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3, marginBottom: 16, paddingHorizontal: 4 },
  semHeader: {
    borderRadius: 16, padding: 16, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },

  semHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  semCircle: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  semCircleText: { fontSize: 16, fontWeight: '800' },

  semName: { fontSize: 15, fontWeight: '700' },
  semLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3, marginTop: 2, textTransform: 'uppercase' },

  semRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  sgpaLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  sgpaValue: { fontSize: 20, fontWeight: '900' },
  subjectsContainer: { borderRadius: 16, padding: 12, marginTop: -4, marginBottom: 8, gap: 8 },
  subjectRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },

  subjectInfo: { flex: 1 },
  subjectCode: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  subjectName: { fontSize: 14, fontWeight: '700', marginTop: 2 },

  subjectRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  creditBox: { alignItems: 'center' },
  creditLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  creditValue: { fontSize: 15, fontWeight: '700' },

  gradeBox: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  gradeText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  showAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 14, marginTop: 4,
  },
  showAllText: { fontSize: 14, fontWeight: '700' },
});


export default ERPResultsScreen;
