import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import { Colors } from '../../constants/colors';
import { SEMESTER_RESULTS, STUDENT_USER } from '../../constants/data';

const GRADE_COLOR = (g) => {
  if (g.startsWith('A')) return Colors.success;
  if (g.startsWith('B')) return Colors.primary;
  return Colors.warning;
};

const ResultsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header title="Welcome back" onBellPress={() => navigation.navigate('Alerts')} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* GPA Hero Card */}
        <Card style={styles.gpaCard} padding={24}>
          <Text style={styles.gpaTag}>CUMULATIVE GPA</Text>
          <Text style={styles.gpaValue}>{STUDENT_USER.gpa}</Text>
          <Text style={styles.gpaStatus}>Dean's List Status • Senior Year</Text>
          <View style={styles.gpaStatsRow}>
            <View style={styles.gpaStat}>
              <View style={[styles.gpaStatIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="school" size={20} color={Colors.white} />
              </View>
              <Text style={styles.gpaStatLabel}>128 CREDITS</Text>
            </View>
            <View style={styles.gpaStat}>
              <View style={[styles.gpaStatIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="trending-up" size={20} color={Colors.white} />
              </View>
              <Text style={styles.gpaStatLabel}>TOP 5%</Text>
            </View>
          </View>
        </Card>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Academic Performance</Text>
            <Text style={styles.sectionDesc}>Comprehensive breakdown of your modular achievements and historical transcript data.</Text>
          </View>
          <TouchableOpacity style={styles.downloadBtn}>
            <Text style={styles.downloadText}>Download{'\n'}Full PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Semester Cards */}
        {SEMESTER_RESULTS.map((sem) => (
          <Card key={sem.id} style={styles.semCard} padding={20}>
            <View style={styles.semHeader}>
              <View>
                <View style={styles.semTag}>
                  <Text style={styles.semTagText}>{sem.semester}</Text>
                </View>
                <Text style={styles.semLabel}>{sem.label}</Text>
              </View>
              <View style={styles.semGpa}>
                <Text style={styles.semGpaLabel}>SEMESTER GPA</Text>
                <Text style={styles.semGpaValue}>{sem.gpa}</Text>
              </View>
            </View>
            {sem.courses.map((course) => (
              <View key={course.id} style={styles.courseRow}>
                <View style={[styles.courseIconBox, { backgroundColor: course.color + '20' }]}>
                  <Text style={[styles.courseIconText, { color: course.color }]}>{course.code}</Text>
                </View>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseName}>{course.name}</Text>
                  <Text style={styles.courseDetails}>{course.details}</Text>
                </View>
                <View style={styles.courseGradeCol}>
                  <Text style={styles.creditLabel}>CREDITS GRADE</Text>
                  <View style={styles.creditGradeRow}>
                    <Text style={styles.creditValue}>{course.credits}</Text>
                    <Text style={[styles.gradeValue, { color: GRADE_COLOR(course.grade) }]}>{course.grade}</Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 16, paddingTop: 12 },
  gpaCard: { marginBottom: 20, backgroundColor: Colors.primary },
  gpaTag: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1, textAlign: 'center', marginBottom: 4 },
  gpaValue: { fontSize: 52, fontWeight: '900', color: Colors.white, textAlign: 'center', lineHeight: 60 },
  gpaStatus: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500', textAlign: 'center', marginBottom: 16 },
  gpaStatsRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  gpaStat: { alignItems: 'center', gap: 6 },
  gpaStatIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  gpaStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '700', letterSpacing: 0.5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, flex: 1 },
  downloadBtn: { backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  downloadText: { color: Colors.primary, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  semCard: { marginBottom: 16 },
  semHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  semTag: { backgroundColor: Colors.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 6 },
  semTagText: { fontSize: 10, color: Colors.primary, fontWeight: '700', letterSpacing: 0.5 },
  semLabel: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  semGpa: { alignItems: 'flex-end' },
  semGpaLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', marginBottom: 2 },
  semGpaValue: { fontSize: 24, fontWeight: '900', color: Colors.primary },
  courseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  courseIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  courseIconText: { fontSize: 14, fontWeight: '800' },
  courseInfo: { flex: 1 },
  courseName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  courseDetails: { fontSize: 12, color: Colors.textSecondary },
  courseGradeCol: { alignItems: 'flex-end' },
  creditLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.3, marginBottom: 4 },
  creditGradeRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  creditValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  gradeValue: { fontSize: 18, fontWeight: '800' },
});

export default ResultsScreen;
