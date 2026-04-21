import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
      <LinearGradient
        colors={['#FFFFFF', '#F9FAFB']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <LinearGradient
            colors={['#FFF7ED', '#FFEDD5']}
            style={styles.backButtonBg}
          >
            <Ionicons name="arrow-back" size={20} color="#EA580C" />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Management</Text>
        <TouchableOpacity style={styles.bellBtn}>
          <LinearGradient
            colors={['#FFFFFF', '#F9FAFB']}
            style={styles.bellGradient}
          >
            <Ionicons name="notifications-outline" size={20} color="#EA580C" />
            <View style={styles.bellBadge} />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Course Header */}
        <View style={styles.courseHeader}>
          <View style={styles.courseBadgeWrapper}>
            <LinearGradient
              colors={['#FFF7ED', '#FFEDD5']}
              style={styles.courseBadge}
            >
              <Text style={styles.courseBadgeText}>B.TECH CSE</Text>
            </LinearGradient>
          </View>
          <Text style={styles.courseTitle}>3rd Year • Section A</Text>
          <Text style={styles.courseSubtitle}>Academic Session 2023-24</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85}>
              <Ionicons name="document-text-outline" size={16} color="#EA580C" />
              <Text style={styles.secondaryBtnText}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85}>
              <LinearGradient
                colors={['#EA580C', '#9A3412']}
                style={styles.primaryBtnGradient}
              >
                <Ionicons name="people-outline" size={16} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Manage Batch</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Attendance */}
        <LinearGradient
          colors={['#FFFFFF', '#F9FAFB']}
          style={styles.attendanceCard}
        >
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
            <LinearGradient
              colors={['#EA580C', '#F97316']}
              style={[styles.progressBarFill, { width: '87.4%' }]}
            />
          </View>
        </LinearGradient>

        {/* Student Roster */}
        <View style={styles.rosterHeader}>
          <Text style={styles.sectionTitle}>Student Roster</Text>
          <Text style={styles.enrolledCount}>64 enrolled</Text>
        </View>

        <LinearGradient
          colors={['#FFFFFF', '#F9FAFB']}
          style={styles.rosterCard}
        >
          {STUDENTS_ROSTER.map((s, i) => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.rosterRow,
                i < STUDENTS_ROSTER.length - 1 && styles.rosterBorder,
              ]}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#FFF7ED', '#FFEDD5']}
                style={styles.rosterAvatar}
              >
                <Text style={styles.rosterAvatarText}>
                  {s.name.charAt(0)}{s.name.split(' ')[1]?.charAt(0) || ''}
                </Text>
              </LinearGradient>
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
        </LinearGradient>

        {/* Curriculum Oversight */}
        <View style={styles.curriculumHeader}>
          <Text style={styles.sectionTitle}>Curriculum Oversight</Text>
          <View style={styles.viewToggle}>
            <TouchableOpacity style={[styles.toggleBtn, styles.toggleBtnActive]} activeOpacity={0.8}>
              <Ionicons name="grid-outline" size={18} color="#EA580C" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toggleBtn} activeOpacity={0.8}>
              <Ionicons name="list-outline" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {CURRICULUM.map((course) => (
          <LinearGradient
            key={course.id}
            colors={['#FFFFFF', '#F9FAFB']}
            style={styles.currCard}
          >
            <View style={styles.currHeader}>
              <LinearGradient
                colors={[course.color + '12', course.color + '08']}
                style={styles.currIcon}
              >
                <Ionicons name="book-outline" size={20} color={course.color} />
              </LinearGradient>
              <LinearGradient
                colors={[course.color + '12', course.color + '08']}
                style={styles.currTypeBadge}
              >
                <Text style={[styles.currTypeText, { color: course.color }]}>{course.type}</Text>
              </LinearGradient>
            </View>

            <Text style={styles.currName}>{course.name}</Text>
            <Text style={styles.currDesc}>{course.description}</Text>

            <View style={styles.facultySection}>
              <Text style={styles.facultyLabel}>FACULTY ASSIGNED</Text>
              <View style={styles.facultyInfo}>
                <LinearGradient
                  colors={['#EA580C', '#9A3412']}
                  style={styles.facultyAvatar}
                >
                  <Text style={styles.facultyAvatarText}>
                    {course.faculty.charAt(0)}
                  </Text>
                </LinearGradient>
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
                <LinearGradient
                  colors={[course.color, course.color + 'CC']}
                  style={[styles.progressBarFill, { width: `${course.progress}%` }]}
                />
              </View>
            </View>
          </LinearGradient>
        ))}

        {/* Add Subject Button */}
        <TouchableOpacity style={styles.addSubjectBtn} activeOpacity={0.7}>
          <LinearGradient
            colors={['#FFF7ED', '#FFEDD5']}
            style={styles.addIcon}
          >
            <Ionicons name="add" size={24} color="#EA580C" />
          </LinearGradient>
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
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backButtonBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  bellBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bellGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    paddingTop: 20,
  },
  courseHeader: {
    marginBottom: 24,
  },
  courseBadgeWrapper: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  courseBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  courseBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: 0.8,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  courseSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
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
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#FFEDD5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryBtnText: {
    color: '#EA580C',
    fontWeight: '800',
    fontSize: 13,
  },
  attendanceCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
  attHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  attTitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  attPercent: {
    fontSize: 40,
    fontWeight: '900',
    color: '#EA580C',
    marginBottom: 4,
    letterSpacing: -1,
    lineHeight: 48,
  },
  attDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '500',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.3,
  },
  enrolledCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  rosterCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  rosterBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rosterAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EA580C',
  },
  rosterInfo: {
    flex: 1,
  },
  rosterName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  rosterRoll: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  viewAllBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA580C',
  },
  curriculumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleBtnActive: {
    backgroundColor: '#FFF7ED',
  },
  currCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  currHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  currIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  currTypeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  currName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  currDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 18,
    fontWeight: '500',
  },
  facultySection: {
    marginBottom: 18,
  },
  facultyLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  facultyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  facultyAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facultyAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  facultyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  facultyRole: {
    fontSize: 11,
    color: '#6B7280',
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
    color: '#6B7280',
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '800',
  },
  addSubjectBtn: {
    borderWidth: 1.5,
    borderColor: '#FFEDD5',
    borderStyle: 'dashed',
    borderRadius: 24,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  addIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addSubjectTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  addSubjectDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default CourseManagementScreen;