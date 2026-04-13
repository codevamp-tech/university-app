import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

const COURSES = [
  {
    id: 1,
    title: 'Advanced Data Structures',
    code: 'CS-301',
    students: 54,
    lectures: 'Mon, Wed, Fri',
    progress: 75,
    icon: 'code-brackets',
  },
  {
    id: 2,
    title: 'Machine Learning',
    code: 'CS-402',
    students: 42,
    lectures: 'Tue, Thu',
    progress: 60,
    icon: 'brain',
  },
  {
    id: 3,
    title: 'Database Systems',
    code: 'CS-205',
    students: 60,
    lectures: 'Mon, Thu',
    progress: 90,
    icon: 'database',
  },
];

const MyCoursesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Courses</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stats Overview */}
        <View style={styles.statsOverview}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.statsCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Active Courses</Text>
              <Text style={styles.statValue}>3</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Students</Text>
              <Text style={styles.statValue}>156</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Course List */}
        <Text style={styles.sectionTitle}>Current Semester</Text>
        {COURSES.map((course) => (
          <TouchableOpacity 
            key={course.id} 
            style={styles.courseCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CourseManagement', { courseId: course.id })}
          >
            <View style={styles.courseIconContainer}>
              <MaterialCommunityIcons name={course.icon} size={28} color={Colors.primary} />
            </View>
            <View style={styles.courseDetails}>
              <View style={styles.courseHeader}>
                <Text style={styles.courseCode}>{course.code}</Text>
                <View style={styles.studentsBadge}>
                  <Ionicons name="people" size={12} color={Colors.primary} />
                  <Text style={styles.studentsCount}>{course.students}</Text>
                </View>
              </View>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <View style={styles.lectureInfo}>
                <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.lectureText}>{course.lectures}</Text>
              </View>
              
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Course Completion</Text>
                  <Text style={styles.progressValue}>{course.progress}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${course.progress}%` }]} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  scrollContent: {
    padding: 20,
  },
  statsOverview: {
    marginBottom: 25,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-around',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 5,
  },
  statValue: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  courseCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  courseIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  courseDetails: {
    flex: 1,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  studentsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  studentsCount: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
    marginLeft: 4,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  lectureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lectureText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 5,
  },
  progressContainer: {
    marginTop: 5,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
});

export default MyCoursesScreen;
