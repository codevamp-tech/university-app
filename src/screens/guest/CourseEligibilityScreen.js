import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CourseEligibilityScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [expandedCourse, setExpandedCourse] = useState(null);

  const courses = [
    {
      id: 1,
      name: 'B.Tech (All Branches)',
      duration: '4 Years',
      seats: '480 Seats',
      category: 'Engineering',
      color: ['#4338CA', '#312E81'],
      icon: '🖥️',
      eligibility: '10+2 with PCM / PCB (min 45% marks)',
      entranceExam: 'JEE Main / UPSEE / Direct Admission',
      ageLimit: 'Max 25 years as on Oct 1, 2026',
      lateral: 'Diploma holders eligible for direct 2nd year',
      branches: ['CSE', 'AI & ML', 'Cloud Computing', 'IoT', 'Mechanical', 'Civil', 'Electronics'],
      note: 'JEE percentile-based merit list maintained.',
    },
    {
      id: 2,
      name: 'BCA / B.Sc CS',
      duration: '3 Years',
      seats: '180 Seats',
      category: 'Computer Applications',
      color: ['#0891B2', '#065F73'],
      icon: '💻',
      eligibility: '10+2 in any stream with Maths (min 40%)',
      entranceExam: 'Merit / UPSEE',
      ageLimit: 'Max 25 years',
      lateral: 'Not applicable',
      branches: ['BCA Data Science', 'BCA AI & ML', 'B.Sc CS', 'B.Sc IT'],
      note: 'Maths is mandatory in 10+2 for BCA.',
    },
    {
      id: 3,
      name: 'MBA (All Specializations)',
      duration: '2 Years',
      seats: '240 Seats',
      category: 'Management',
      color: ['#EA580C', '#9A3412'],
      icon: '📊',
      eligibility: 'Graduation in any discipline (min 50%)',
      entranceExam: 'CAT / MAT / CMAT / Direct Admission',
      ageLimit: 'No upper age limit',
      lateral: 'Not applicable',
      branches: ['Finance', 'HR', 'Marketing', 'Business Analytics', 'Fintech'],
      note: 'CAT/MAT scores preferred but not mandatory.',
    },
    {
      id: 4,
      name: 'LL.B / BA LLB / BBA LLB',
      duration: '3 / 5 Years',
      seats: '120 Seats',
      category: 'Law & Legal',
      color: ['#B45309', '#78350F'],
      icon: '⚖️',
      eligibility: '10+2 any stream (for 5yr) / Graduation (for 3yr)',
      entranceExam: 'CLAT / LSAT / State Law Entrance',
      ageLimit: '5-yr: max 20 yrs | 3-yr: max 30 yrs',
      lateral: 'Graduates eligible for 3-year LL.B directly',
      branches: ['LL.B (3 Yr)', 'BA LLB (5 Yr)', 'BBA LLB (5 Yr)'],
      note: 'Bar Council of India norms apply.',
    },
    {
      id: 5,
      name: 'B.Sc Agriculture',
      duration: '4 Years',
      seats: '60 Seats',
      category: 'Agriculture',
      color: ['#65A30D', '#4D7C0F'],
      icon: '🌾',
      eligibility: '10+2 with PCB / Agriculture (min 50%)',
      entranceExam: 'UPCATET / Direct Merit',
      ageLimit: 'Max 25 years',
      lateral: 'Not applicable',
      branches: ['B.Sc Agriculture', 'M.Sc Agriculture'],
      note: 'NRI / NRI sponsored seats available.',
    },
    {
      id: 6,
      name: 'M.Tech Programs',
      duration: '2 Years',
      seats: '60 Seats',
      category: 'Engineering PG',
      color: ['#7C3AED', '#5B21B6'],
      icon: '🔬',
      eligibility: 'B.Tech / BE in relevant branch (min 55%)',
      entranceExam: 'GATE / UPSEE PG',
      ageLimit: 'No upper age limit',
      lateral: 'Not applicable',
      branches: ['M.Tech CSE', 'M.Tech Electronics', 'M.Tech Mechanical'],
      note: 'GATE-qualified candidates get fee relaxation.',
    },
  ];

  const admissionProcess = [
    { step: 1, title: 'Register Online', desc: 'Fill the application form on our portal', icon: 'edit' },
    { step: 2, title: 'Submit Documents', desc: 'Upload marksheets, ID proof, photo', icon: 'upload-file' },
    { step: 3, title: 'Entrance / Merit', desc: 'Submit JEE / CAT score or merit certificate', icon: 'assignment' },
    { step: 4, title: 'Counselling', desc: 'Attend online/offline counseling session', icon: 'people' },
    { step: 5, title: 'Fee Payment', desc: 'Confirm seat by paying registration fee', icon: 'payment' },
    { step: 6, title: 'Admission Confirmed', desc: 'Receive offer letter & report for classes', icon: 'verified' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={['#0891B2', '#065F73']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Course Eligibility</Text>
          <Text style={styles.headerSub}>Admission Criteria 2025–26</Text>
        </View>
        <MaterialCommunityIcons name="clipboard-check" size={22} color="rgba(255,255,255,0.7)" />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Quick Tip */}
        <LinearGradient colors={['#F0FDFF', '#E0F7FF']} style={styles.tipCard}>
          <MaterialIcons name="lightbulb-outline" size={22} color="#0891B2" />
          <Text style={styles.tipText}>
            Tap on any course to see detailed eligibility criteria and admission procedure.
          </Text>
        </LinearGradient>

        {/* Course Accordion */}
        {courses.map((course) => (
          <View key={course.id} style={styles.courseCard}>
            <TouchableOpacity
              style={styles.courseHeader}
              onPress={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
              activeOpacity={0.8}
            >
              <LinearGradient colors={course.color} style={styles.courseIconBox}>
                <Text style={styles.courseEmoji}>{course.icon}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.courseName}>{course.name}</Text>
                <View style={styles.courseMeta}>
                  <View style={styles.metaTag}>
                    <MaterialIcons name="schedule" size={10} color="#6B7280" />
                    <Text style={styles.metaTagText}>{course.duration}</Text>
                  </View>
                  <View style={styles.metaTag}>
                    <MaterialIcons name="people" size={10} color="#6B7280" />
                    <Text style={styles.metaTagText}>{course.seats}</Text>
                  </View>
                </View>
              </View>
              <Feather
                name={expandedCourse === course.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>

            {expandedCourse === course.id && (
              <View style={styles.courseDetails}>
                <View style={styles.detailDivider} />

                {[
                  { label: 'Eligibility', value: course.eligibility, icon: 'check-circle-outline', color: '#16A34A' },
                  { label: 'Entrance Exam', value: course.entranceExam, icon: 'assignment', color: '#4338CA' },
                  { label: 'Age Limit', value: course.ageLimit, icon: 'event', color: '#EA580C' },
                  { label: 'Lateral Entry', value: course.lateral, icon: 'call-split', color: '#0891B2' },
                ].map((d, i) => (
                  <View key={i} style={styles.detailRow}>
                    <MaterialIcons name={d.icon} size={16} color={d.color} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>{d.label}</Text>
                      <Text style={styles.detailValue}>{d.value}</Text>
                    </View>
                  </View>
                ))}

                <Text style={styles.branchesLabel}>Available Programs</Text>
                <View style={styles.branchesRow}>
                  {course.branches.map((b, i) => (
                    <LinearGradient key={i} colors={course.color} style={styles.branchChip}>
                      <Text style={styles.branchChipText}>{b}</Text>
                    </LinearGradient>
                  ))}
                </View>

                <View style={styles.noteBox}>
                  <MaterialIcons name="info" size={14} color="#EA580C" />
                  <Text style={styles.noteText}>{course.note}</Text>
                </View>
              </View>
            )}
          </View>
        ))}

        {/* Admission Process */}
        <Text style={styles.bigTitle}>Admission Process</Text>
        {admissionProcess.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <LinearGradient
              colors={i === admissionProcess.length - 1 ? ['#16A34A', '#0A6C34'] : ['#EA580C', '#9A3412']}
              style={styles.stepNumBg}
            >
              <Text style={styles.stepNum}>{step.step}</Text>
            </LinearGradient>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
            <MaterialIcons name={step.icon} size={22} color="#E5E7EB" />
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  scroll: { padding: 16 },
  tipCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 16, marginBottom: 16,
  },
  tipText: { flex: 1, fontSize: 13, color: '#0891B2', lineHeight: 18, fontWeight: '600' },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10, elevation: 3,
    overflow: 'hidden',
  },
  courseHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
  },
  courseIconBox: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  courseEmoji: { fontSize: 22 },
  courseName: { fontSize: 14, fontWeight: '800', color: '#111827' },
  courseMeta: { flexDirection: 'row', gap: 6, marginTop: 5 },
  metaTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F3F4F6', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6,
  },
  metaTagText: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
  courseDetails: { paddingHorizontal: 16, paddingBottom: 16 },
  detailDivider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 14 },
  detailRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginBottom: 12,
  },
  detailLabel: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 2 },
  branchesLabel: { fontSize: 11, fontWeight: '800', color: '#9CA3AF', marginTop: 4, marginBottom: 8, letterSpacing: 0.5 },
  branchesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  branchChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  branchChipText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  noteBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FFF7ED', borderRadius: 10, padding: 10,
  },
  noteText: { fontSize: 12, color: '#9A3412', flex: 1, lineHeight: 17 },
  bigTitle: { fontSize: 20, fontWeight: '900', color: '#111827', marginTop: 8, marginBottom: 16 },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6, elevation: 1,
  },
  stepNumBg: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  stepNum: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  stepDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});

export default CourseEligibilityScreen;
