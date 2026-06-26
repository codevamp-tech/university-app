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

const formatScore = (val) => {
  if (val === '-' || val === null || val === undefined) return '-';
  if (typeof val === 'string' && val.includes('/')) {
    return val.split('/').map(v => formatScore(v.trim())).join(' / ');
  }
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return num % 1 === 0 ? num.toString() : num.toFixed(1);
};

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
          if (isMedical && data[0].is_sessional) {
            setApiSemesterData({ type: 'sessional', marks: data });
          } else {
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
    if (isMedical) {
      const STANDARDIZED_PROF_SUBJECTS = {
        "1st Prof": [
          { code: "AN", name: "ANATOMY" },
          { code: "PY", name: "PHYSIOLOGY" },
          { code: "BI", name: "BIOCHEMISTRY" },
          { code: "CM", name: "COMMUNITY MEDICINE" }
        ],
        "2nd Prof": [
          { code: "MI", name: "MICROBIOLOGY" },
          { code: "PA", name: "PATHOLOGY" },
          { code: "PH", name: "PHARMACOLOGY" }
        ],
        "3rd Prof Part I": [
          { code: "CM", name: "COMMUNITY MEDICINE" },
          { code: "FM", name: "FORENSIC MEDICINE" },
          { code: "TX", name: "toxicology" },
          { code: "ENT", name: "ENT" },
          { code: "OPH", name: "OPYHTHALMOLOGY" }
        ],
        "3rd Prof Part II": [
          { code: "IM", name: "GENERAL MEDICINE" },
          { code: "SU", name: "GENERAL SURGERY" },
          { code: "PE", name: "PEDIATRICS" },
          { code: "OG", name: "OBSTETRICS & GYNAECOLOGY" }
        ]
      };

      const parsedData = {};
      const order = ['1st Prof', '2nd Prof', '3rd Prof Part I', '3rd Prof Part II'];

      order.forEach(prof => {
        const isCurrent = prof === currentProfName;
        parsedData[prof] = {
          label: isCurrent ? 'Ongoing Evaluation' : (order.indexOf(prof) < order.indexOf(currentProfName) ? 'Completed Phase' : 'Upcoming Phase'),
          sgpa: '-',
          subjects: STANDARDIZED_PROF_SUBJECTS[prof].map(s => ({
            name: s.name,
            code: s.code,
            sess1: '-',
            sess2: '-',
            preUniv: '-',
            univ: '-'
          }))
        };
      });

      // Populate actual marks if present
      const marksList = apiSemesterData?.type === 'sessional' ? (apiSemesterData.marks || []) : [];
      marksList.forEach(m => {
        // Find which prof year contains this subject code
        let profName = null;
        for (const [pName, subjects] of Object.entries(STANDARDIZED_PROF_SUBJECTS)) {
          if (subjects.some(s => s.code.toLowerCase() === m.subject_code.toLowerCase())) {
            // Special case for CM (Community Medicine) which exists in both 1st Prof and 3rd Prof Part I
            if (m.subject_code.toLowerCase() === 'cm') {
              if (m.yr_fk === '3') {
                profName = '3rd Prof Part I';
              } else {
                profName = '1st Prof';
              }
            } else {
              profName = pName;
            }
            break;
          }
        }

        if (!profName || !parsedData[profName]) return;

        const sub = parsedData[profName].subjects.find(s => s.code.toLowerCase() === m.subject_code.toLowerCase());
        if (!sub) return;

        const paperName = (m.subject_name || m.paper_name || '').toLowerCase();
        const scoreStr = m.obtained_marks !== null && m.obtained_marks !== undefined ? m.obtained_marks.toString() : '-';

        if (paperName.includes('1st sessional') || paperName.includes('1st sessional exam') || paperName.includes('first sessional') || paperName.includes('1 sessional')) {
          sub.sess1 = scoreStr;
        } else if (paperName.includes('2nd sessional') || paperName.includes('2nd sessional exam') || paperName.includes('second sessional') || paperName.includes('2 sessional')) {
          sub.sess2 = scoreStr;
        } else if (paperName.includes('3rd sessional') || paperName.includes('pre university') || paperName.includes('pre-university') || paperName.includes('pre university(100+100)') || paperName.includes('3 sessional')) {
          if (sub.preUniv === '-') {
            sub.preUniv = scoreStr;
          } else {
            sub.preUniv = `${sub.preUniv} / ${scoreStr}`;
          }
        } else if (paperName.includes('university') && !paperName.includes('pre')) {
          sub.univ = scoreStr;
        }
      });

      // Compute dynamic SGPA (percentage) for each Prof from scores
      order.forEach(prof => {
        const g = parsedData[prof];
        if (g.label === 'Ongoing Evaluation' || g.label === 'Upcoming Phase') {
          g.sgpa = '-';
          return;
        }
        let sum = 0;
        let count = 0;
        g.subjects.forEach(sub => {
          const scores = [];
          if (sub.sess1 !== '-') scores.push(parseFloat(sub.sess1));
          if (sub.sess2 !== '-') scores.push(parseFloat(sub.sess2));
          if (sub.preUniv !== '-') {
            sub.preUniv.split('/').forEach(val => {
              const v = parseFloat(val.trim());
              if (!isNaN(v)) scores.push(v);
            });
          }
          if (sub.univ !== '-') scores.push(parseFloat(sub.univ));

          if (scores.length > 0) {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            // Heuristic to scale out-of-50 scores to 100
            sum += avg < 50 ? avg * 2 : avg;
            count += 1;
          }
        });

        if (count > 0) {
          g.sgpa = `${(sum / count).toFixed(2)}%`;
        } else {
          g.sgpa = '-';
        }
      });

      return parsedData;
    }

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
  }, [semesterData, isMedical, apiSemesterData, currentProfName]);

  const aggregatePercentage = React.useMemo(() => {
    if (!isMedical) return null;
    const completedProfScores = [];
    Object.values(displayData).forEach(g => {
      if (g.sgpa !== '-') {
        const val = parseFloat(g.sgpa.replace('%', ''));
        if (!isNaN(val)) {
          completedProfScores.push(val);
        }
      }
    });
    if (completedProfScores.length > 0) {
      const avg = completedProfScores.reduce((a, b) => a + b, 0) / completedProfScores.length;
      return `${avg.toFixed(2)}%`;
    }
    return '-';
  }, [displayData, isMedical]);

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
              {isMedical ? aggregatePercentage : (user ? user.cgpa.toFixed(2) : '8.42')}
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
                      {isMedical ? (
                        <View style={[styles.medicalTable, { borderColor: colors.border }]}>
                          <View style={[styles.tableHeader, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB', borderBottomColor: colors.border }]}>
                            <Text style={[styles.headerCell, styles.subjectHeaderCell, { color: colors.textSecondary }]}>SUBJECT</Text>
                            <Text style={[styles.headerCell, styles.scoreHeaderCell, { color: colors.textSecondary }]}>SESS I</Text>
                            <Text style={[styles.headerCell, styles.scoreHeaderCell, { color: colors.textSecondary }]}>SESS II</Text>
                            <Text style={[styles.headerCell, styles.preUnivHeaderCell, { color: colors.textSecondary }]}>PRE-UNIV</Text>
                            <Text style={[styles.headerCell, styles.scoreHeaderCell, { color: colors.textSecondary }]}>UNIV</Text>
                          </View>
                          {data.subjects.map((sub, idx) => (
                            <View 
                              key={idx} 
                              style={[
                                styles.tableRow, 
                                { 
                                  borderBottomWidth: idx === data.subjects.length - 1 ? 0 : 1,
                                  borderBottomColor: colors.border,
                                  backgroundColor: idx % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)')
                                }
                              ]}
                            >
                              <View style={styles.subjectNameCell}>
                                <Text style={[styles.subjectCodeText, { color: isDark ? '#34D399' : '#059669' }]}>{sub.code}</Text>
                                <Text style={[styles.subjectNameText, { color: colors.textPrimary }]} numberOfLines={2}>{sub.name}</Text>
                              </View>
                              <Text style={[styles.scoreCell, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{formatScore(sub.sess1)}</Text>
                              <Text style={[styles.scoreCell, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{formatScore(sub.sess2)}</Text>
                              <Text style={[styles.preUnivCell, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{formatScore(sub.preUniv)}</Text>
                              <Text style={[styles.scoreCell, { color: colors.textPrimary, fontWeight: sub.univ !== '-' ? '700' : '400' }]} numberOfLines={1} adjustsFontSizeToFit>{formatScore(sub.univ)}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        data.subjects.map((sub, idx) => (
                          <View key={idx} style={[styles.subjectRow, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                            <View style={styles.subjectInfo}>
                              <Text style={[styles.subjectCode, { color: isDark ? '#34D399' : '#059669' }]}>{sub.code}</Text>
                              <Text style={[styles.subjectName, { color: colors.textPrimary }]}>{sub.name}</Text>
                            </View>
                            <View style={styles.subjectRight}>
                              <View style={styles.creditBox}>
                                <Text style={[styles.creditLabel, { color: colors.textSecondary }]}>CREDITS</Text>
                                <Text style={[styles.creditValue, { color: colors.textPrimary }]}>{sub.credits}</Text>
                              </View>
                              <View style={[styles.gradeBox, { backgroundColor: colors.primary }]}>
                                <Text style={styles.gradeText}>{sub.grade}</Text>
                              </View>
                            </View>
                          </View>
                        ))
                      )}
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

  // Medical sessional table styles
  medicalTable: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  headerCell: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subjectHeaderCell: {
    flex: 2.2,
  },
  scoreHeaderCell: {
    flex: 1,
    textAlign: 'center',
  },
  preUnivHeaderCell: {
    flex: 1.4,
    textAlign: 'center',
  },
  subjectNameCell: {
    flex: 2.2,
    justifyContent: 'center',
    paddingRight: 4,
  },
  subjectCodeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 1,
    textTransform: 'uppercase',
  },
  subjectNameText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 15,
  },
  scoreCell: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  preUnivCell: {
    flex: 1.4,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});


export default ERPResultsScreen;
