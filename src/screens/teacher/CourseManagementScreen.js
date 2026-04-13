import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CURRICULUM } from '../../constants/data';

const STUDENTS_ROSTER = [
  { id: '1', name: 'Aravind Sharma', roll: 'Roll No: 102' },
  { id: '2', name: 'Meera Patel', roll: 'Roll No: 108' },
  { id: '3', name: 'Rohan Verma', roll: 'Roll No: 115' },
];

const CourseManagementScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Management</Text>
        <TouchableOpacity style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={20} color="#111827" />
          <View style={styles.bellBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Course Header */}
        <View style={styles.courseHeader}>
          <Text style={styles.courseBadge}>B.TECH CSE</Text>
          <Text style={styles.courseTitle}>3rd Year • Section A</Text>
          <Text style={styles.courseSubtitle}>Academic Session 2023-24</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85}>
              <Ionicons name="document-text-outline" size={16} color="#8b2fc9" />
              <Text style={styles.secondaryBtnText}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85}>
              <Ionicons name="people-outline" size={16} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Manage Batch</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Attendance */}
        <View style={styles.attendanceCard}>
          <View style={styles.attHeader}>
            <Text style={styles.attTitle}>Section Attendance</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.attPercent}>87.4%</Text>
          <Text style={styles.attDesc}>Average daily presence this semester</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '87.4%' }]} />
          </View>
        </View>

        {/* Student Roster */}
        <View style={styles.rosterHeader}>
          <Text style={styles.sectionTitle}>Student Roster</Text>
          <Text style={styles.enrolledCount}>64 enrolled</Text>
        </View>

        <View style={styles.rosterCard}>
          {STUDENTS_ROSTER.map((s, i) => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.rosterRow,
                i < STUDENTS_ROSTER.length - 1 && styles.rosterBorder,
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.rosterAvatar}>
                <Text style={styles.rosterAvatarText}>
                  {s.name.charAt(0)}{s.name.split(' ')[1]?.charAt(0) || ''}
                </Text>
              </View>
              <View style={styles.rosterInfo}>
                <Text style={styles.rosterName}>{s.name}</Text>
                <Text style={styles.rosterRoll}>{s.roll}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.viewAllBtn} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View Full Directory →</Text>
          </TouchableOpacity>
        </View>

        {/* Curriculum Oversight */}
        <View style={styles.curriculumHeader}>
          <Text style={styles.sectionTitle}>Curriculum Oversight</Text>
          <View style={styles.viewToggle}>
            <TouchableOpacity style={[styles.toggleBtn, styles.toggleBtnActive]} activeOpacity={0.8}>
              <Ionicons name="grid-outline" size={18} color="#8b2fc9" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toggleBtn} activeOpacity={0.8}>
              <Ionicons name="list-outline" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {CURRICULUM.map((course) => (
          <View key={course.id} style={styles.currCard}>
            <View style={styles.currHeader}>
              <View style={[styles.currIcon, { backgroundColor: course.color + '12' }]}>
                <Ionicons name="book-outline" size={20} color={course.color} />
              </View>
              <View style={[styles.currTypeBadge, { backgroundColor: course.color + '12' }]}>
                <Text style={[styles.currTypeText, { color: course.color }]}>{course.type}</Text>
              </View>
            </View>

            <Text style={styles.currName}>{course.name}</Text>
            <Text style={styles.currDesc}>{course.description}</Text>

            <View style={styles.facultySection}>
              <Text style={styles.facultyLabel}>FACULTY ASSIGNED</Text>
              <View style={styles.facultyInfo}>
                <View style={styles.facultyAvatar}>
                  <Text style={styles.facultyAvatarText}>
                    {course.faculty.charAt(0)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.facultyName}>{course.faculty}</Text>
                  <Text style={styles.facultyRole}>{course.role}</Text>
                </View>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Syllabus Progress</Text>
                <Text style={[styles.progressPercent, { color: course.color }]}>{course.progress}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${course.progress}%`, backgroundColor: course.color }]} />
              </View>
            </View>
          </View>
        ))}

        {/* Add Subject Button */}
        <TouchableOpacity style={styles.addSubjectBtn} activeOpacity={0.7}>
          <View style={styles.addIcon}>
            <Ionicons name="add" size={24} color="#8b2fc9" />
          </View>
          <Text style={styles.addSubjectTitle}>Assign New Subject</Text>
          <Text style={styles.addSubjectDesc}>Configure elective or minor courses</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.2,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  courseHeader: {
    marginBottom: 20,
  },
  courseBadge: {
    fontSize: 11,
    color: '#8b2fc9',
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  courseTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  courseSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#8b2fc9',
    borderRadius: 40,
    paddingVertical: 11,
    shadowColor: '#8b2fc9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: '#8b2fc920',
  },
  secondaryBtnText: {
    color: '#8b2fc9',
    fontWeight: '600',
    fontSize: 13,
  },
  attendanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  attHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  attTitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  attPercent: {
    fontSize: 36,
    fontWeight: '700',
    color: '#8b2fc9',
    marginBottom: 2,
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  attDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    fontWeight: '500',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8b2fc9',
    borderRadius: 4,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.2,
  },
  enrolledCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  rosterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  rosterBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rosterAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b2fc910',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterAvatarText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8b2fc9',
  },
  rosterInfo: {
    flex: 1,
  },
  rosterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  rosterRoll: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  viewAllBtn: {
    alignItems: 'center',
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b2fc9',
  },
  curriculumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 6,
  },
  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#8b2fc912',
  },
  currCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  currHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currTypeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  currTypeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  currName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  currDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
    fontWeight: '400',
  },
  facultySection: {
    marginBottom: 16,
  },
  facultyLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  facultyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  facultyAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#8b2fc9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  facultyAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  facultyName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 1,
  },
  facultyRole: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  progressSection: {
    marginTop: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '600',
  },
  addSubjectBtn: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  addIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b2fc910',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addSubjectTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.2,
  },
  addSubjectDesc: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
});

export default CourseManagementScreen;