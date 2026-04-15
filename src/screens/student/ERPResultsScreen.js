import React, { useState } from 'react';
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
  const [expandedSem, setExpandedSem] = useState('VII');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('ERPHome')} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color="#312E81" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Academics</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <MaterialIcons name="notifications-none" size={24} color="#EA580C" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.sectionContainer}>
          <Text style={styles.heroTitle}>Semester Results</Text>
          <Text style={styles.heroSub}>B.Tech Computer Science & Engineering • VII Sem</Text>
          <TouchableOpacity style={styles.downloadBtn}>
            <MaterialIcons name="download" size={18} color="#4953AC" />
            <Text style={styles.downloadBtnText}>Download Provisional Marksheet</Text>
          </TouchableOpacity>
        </View>

        {/* CGPA Card */}
        <View style={styles.sectionContainer}>
          <LinearGradient
            colors={['#8B4B00', '#FE9832']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cgpaCard}
          >
            <Text style={styles.cgpaLabel}>CUMULATIVE GRADE</Text>
            <Text style={styles.cgpaValue}>8.42</Text>
            <View style={styles.cgpaBadge}>
              <MaterialIcons name="trending-up" size={14} color="#FFFFFF" />
              <Text style={styles.cgpaBadgeText}>TOP 5% OF BATCH</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Credits */}
        <View style={styles.sectionContainer}>
          <View style={styles.creditsCard}>
            <Text style={styles.creditsLabel}>ACADEMIC PROGRESS</Text>
            <View style={styles.creditsRow}>
              <Text style={styles.creditsValue}>142</Text>
              <Text style={styles.creditsTotal}>/ 180 Credits</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '78%' }]} />
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
          <Text style={styles.timelineTitle}>Academic Timeline</Text>

          {Object.entries(semesterData).map(([sem, data]) => {
            const isExpanded = expandedSem === sem;
            const isActive = sem === 'VII';
            return (
              <View key={sem}>
                <TouchableOpacity
                  style={[styles.semHeader, isActive && styles.semHeaderActive]}
                  onPress={() => setExpandedSem(isExpanded ? null : sem)}
                >
                  <View style={styles.semHeaderLeft}>
                    <View style={[styles.semCircle, isActive && styles.semCircleActive]}>
                      <Text style={[styles.semCircleText, isActive && styles.semCircleTextActive]}>{sem}</Text>
                    </View>
                    <View>
                      <Text style={styles.semName}>Semester {sem}</Text>
                      <Text style={styles.semLabel}>{data.label}</Text>
                    </View>
                  </View>
                  <View style={styles.semRight}>
                    <View>
                      <Text style={styles.sgpaLabel}>SGPA</Text>
                      <Text style={[styles.sgpaValue, isActive && { color: '#EA580C' }]}>{data.sgpa}</Text>
                    </View>
                    <MaterialIcons
                      name={isExpanded ? 'expand-less' : 'expand-more'}
                      size={24}
                      color="#6B7280"
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && data.subjects.length > 0 && (
                  <View style={styles.subjectsContainer}>
                    {data.subjects.map((sub, idx) => (
                      <View key={idx} style={styles.subjectRow}>
                        <View style={styles.subjectInfo}>
                          <Text style={styles.subjectCode}>{sub.code}</Text>
                          <Text style={styles.subjectName}>{sub.name}</Text>
                        </View>
                        <View style={styles.subjectRight}>
                          <View style={styles.creditBox}>
                            <Text style={styles.creditLabel}>CREDITS</Text>
                            <Text style={styles.creditValue}>{sub.credits}</Text>
                          </View>
                          <View style={styles.gradeBox}>
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
            <MaterialIcons name="history" size={20} color="#4953AC" />
            <Text style={styles.showAllText}>Show All Semesters (I - IV)</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F7' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#312E81', letterSpacing: -0.5 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 20 },
  sectionContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  heroTitle: { fontSize: 34, fontWeight: '900', color: '#1F2937', letterSpacing: -1 },
  heroSub: { fontSize: 14, color: '#6B7280', marginTop: 4, fontWeight: '500' },
  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#DADDDF', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 14, alignSelf: 'flex-start', marginTop: 16,
  },
  downloadBtnText: { fontSize: 13, fontWeight: '700', color: '#4953AC' },
  cgpaCard: {
    borderRadius: 20, padding: 28, marginBottom: 4,
    shadowColor: '#EA580C', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 6, overflow: 'hidden',
  },
  cgpaLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 2 },
  cgpaValue: { fontSize: 56, fontWeight: '900', color: '#FFFFFF', letterSpacing: -2 },
  cgpaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 8,
  },
  cgpaBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  creditsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  creditsLabel: { fontSize: 11, fontWeight: '800', color: '#6B7280', letterSpacing: 1 },
  creditsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8 },
  creditsValue: { fontSize: 36, fontWeight: '900', color: '#1F2937' },
  creditsTotal: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: '#E6E8EA', marginTop: 20 },
  progressBarFill: { height: '100%', borderRadius: 4, backgroundColor: '#006666' },
  transcriptCard: { borderRadius: 20, padding: 24, overflow: 'hidden' },
  transcriptTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', marginBottom: 6 },
  transcriptDesc: { fontSize: 13, color: 'rgba(243,241,255,0.8)', lineHeight: 20, marginBottom: 18 },
  transcriptBtn: { backgroundColor: '#FFFFFF', paddingVertical: 14, borderRadius: 30, alignItems: 'center' },
  transcriptBtnText: { fontWeight: '800', color: '#4953AC', fontSize: 14 },
  timelineTitle: { fontSize: 22, fontWeight: '900', color: '#4953AC', letterSpacing: -0.3, marginBottom: 16, paddingHorizontal: 4 },
  semHeader: {
    backgroundColor: '#EFF1F2', borderRadius: 16, padding: 16, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  semHeaderActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  semHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  semCircle: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#DADDDF',
    justifyContent: 'center', alignItems: 'center',
  },
  semCircleActive: { backgroundColor: '#FFF7ED' },
  semCircleText: { fontSize: 16, fontWeight: '800', color: '#6B7280' },
  semCircleTextActive: { color: '#EA580C' },
  semName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  semLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', letterSpacing: 0.3, marginTop: 2, textTransform: 'uppercase' },
  semRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  sgpaLabel: { fontSize: 9, fontWeight: '800', color: '#6B7280', letterSpacing: 0.5 },
  sgpaValue: { fontSize: 20, fontWeight: '900', color: '#6B7280' },
  subjectsContainer: { backgroundColor: '#FAFAFA', borderRadius: 16, padding: 12, marginTop: -4, marginBottom: 8, gap: 8 },
  subjectRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  subjectInfo: { flex: 1 },
  subjectCode: { fontSize: 10, fontWeight: '800', color: '#006666', letterSpacing: 1.5, textTransform: 'uppercase' },
  subjectName: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginTop: 2 },
  subjectRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  creditBox: { alignItems: 'center' },
  creditLabel: { fontSize: 8, fontWeight: '800', color: '#6B7280', letterSpacing: 0.5 },
  creditValue: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  gradeBox: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#F97316',
    justifyContent: 'center', alignItems: 'center',
  },
  gradeText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  showAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 14, marginTop: 4,
  },
  showAllText: { fontSize: 14, fontWeight: '700', color: '#4953AC' },
});

export default ERPResultsScreen;
