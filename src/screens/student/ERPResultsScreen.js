import React, { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';

import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const semesterData = {
  VII: {
    label: 'Fall 2023 • Ongoing Evaluation',
    sgpa: '8.90',
    subjects: [
      { code: 'CS701', name: 'Artificial Intelligence & Robotics', credits: 4, grade: 'A+' },
      { code: 'CS702', name: 'Cloud Computing Architectures', credits: 3, grade: 'A' },
      { code: 'CS703', name: 'Network Security & Cryptography', credits: 4, grade: 'O' },
    ],
  },
  VI: { label: 'Spring 2023 • Completed', sgpa: '8.25', subjects: [] },
  V: { label: 'Fall 2022 • Completed', sgpa: '8.10', subjects: [] },
};

const ERPResultsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [expandedSem, setExpandedSem] = useState('VII');


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
        <TouchableOpacity style={styles.notifBtn}>
          <MaterialIcons name="notifications-none" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>



      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Semester Results</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>B.Tech Computer Science & Engineering • VII Sem</Text>
          <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border, borderWidth: 1 }]}>
            <MaterialIcons name="download" size={18} color={isDark ? '#818CF8' : '#4338CA'} />
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

            <Text style={[styles.cgpaLabel, { color: 'rgba(255,255,255,0.7)' }]}>CUMULATIVE GRADE</Text>
            <Text style={styles.cgpaValue}>8.42</Text>
            <View style={styles.cgpaBadge}>
              <MaterialIcons name="trending-up" size={14} color="#FFFFFF" />
              <Text style={styles.cgpaBadgeText}>TOP 5% OF BATCH</Text>
            </View>
          </LinearGradient>
        </View>


        {/* Credits */}
        <View style={styles.sectionContainer}>
          <View style={[styles.creditsCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <Text style={[styles.creditsLabel, { color: colors.textSecondary }]}>ACADEMIC PROGRESS</Text>
            <View style={styles.creditsRow}>
              <Text style={[styles.creditsValue, { color: colors.textPrimary }]}>142</Text>
              <Text style={[styles.creditsTotal, { color: colors.textSecondary }]}>/ 180 Credits</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
              <View style={[styles.progressBarFill, { width: '78%', backgroundColor: isDark ? '#34D399' : '#059669' }]} />
            </View>
          </View>
        </View>




        {/* Transcript Request */}
        <View style={styles.sectionContainer}>
          <LinearGradient colors={['#4953AC', '#343D96']} style={styles.transcriptCard}>
            <Text style={styles.transcriptTitle}>Official Transcript</Text>
            <Text style={styles.transcriptDesc}>Need a stamped and signed copy for higher studies or placements?</Text>
            <TouchableOpacity style={styles.transcriptBtn}>
              <Text style={styles.transcriptBtnText}>Request Official Transcript</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Semester Timeline */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.timelineTitle, { color: colors.textPrimary }]}>Academic Timeline</Text>


          {Object.entries(semesterData).map(([sem, data]) => {
            const isExpanded = expandedSem === sem;
            const isActive = sem === 'VII';
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
                      <Text style={[styles.semCircleText, { color: colors.textSecondary }, isActive && { color: colors.primary }]}>{sem}</Text>
                    </View>
                    <View>
                      <Text style={[styles.semName, { color: colors.textPrimary }]}>Semester {sem}</Text>
                      <Text style={[styles.semLabel, { color: colors.textSecondary }]}>{data.label}</Text>
                    </View>
                  </View>
                  <View style={styles.semRight}>
                    <View>
                      <Text style={[styles.sgpaLabel, { color: colors.textSecondary }]}>SGPA</Text>
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
                    ))}
                  </View>
                )}



              </View>
            );
          })}

          <TouchableOpacity style={styles.showAllBtn}>
            <MaterialIcons name="history" size={20} color={colors.primary} />
            <Text style={[styles.showAllText, { color: colors.primary }]}>Show All Semesters (I - IV)</Text>
          </TouchableOpacity>


        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
