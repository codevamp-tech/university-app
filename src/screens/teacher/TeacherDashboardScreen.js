import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TEACHER_USER, TEACHER_SCHEDULE } from '../../constants/data';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { icon: 'document-text-outline', label: 'Post Assignment', color: '#EA580C', bgColor: '#FFF7ED' },
  { icon: 'star-outline', label: 'Internal Marks', color: '#F59E0B', bgColor: '#FFFBEB' },
  { icon: 'mail-outline', label: 'Broadcast', color: '#10B981', bgColor: '#F0FDF4' },
];

const TeacherDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#1E1B4B', '#312E81']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={['#EA580C', '#9A3412']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>VK</Text>
            </LinearGradient>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerGreeting}>Welcome back,</Text>
              <Text style={styles.headerName}>Prof. Vikram</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
            <LinearGradient
              colors={['#FFFFFF', '#F9FAFB']}
              style={styles.bellGradient}
            >
              <Ionicons name="notifications-outline" size={20} color="#EA580C" />
              <View style={styles.bellBadge} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Lecture Card */}
        <LinearGradient
          colors={['#FFFFFF', '#F9FAFB']}
          style={styles.currentCard}
        >
          <View style={styles.currentHeader}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE NOW</Text>
            </View>
            <Text style={styles.currentTime}>10:00 AM</Text>
          </View>

          <Text style={styles.currentSubject}>🤖 AI & Machine Learning</Text>
          <Text style={styles.currentClass}>B.Tech CSE — 3rd Year • Section A</Text>

          <View style={styles.currentMeta}>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>Room 101, Academic Block</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>10:00 AM – 11:30 AM (90 mins)</Text>
            </View>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('MarkAttendance')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#EA580C', '#9A3412']}
                style={styles.primaryBtnGradient}
              >
                <Ionicons name="checkbox-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Mark Attendance</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85}>
              <Ionicons name="easel-outline" size={18} color="#EA580C" />
              <Text style={styles.secondaryBtnText}>Present</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickSection}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionCard}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[action.bgColor, action.bgColor]}
                  style={styles.actionIcon}
                >
                  <Ionicons name={action.icon} size={22} color={action.color} />
                </LinearGradient>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Department Stats */}
        <View style={styles.statsHeader}>
          <Text style={styles.sectionTitle}>📊 Department Overview</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('DepartmentOverview')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={['#FFFFFF', '#F9FAFB']}
          style={styles.statsCard}
        >
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>1,240</Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>42</Text>
              <Text style={styles.statLabel}>Faculty</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>84%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>CSE Department Attendance</Text>
              <Text style={styles.progressPercent}>84%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={['#EA580C', '#F97316']}
                style={[styles.progressBarFill, { width: '84%' }]}
              />
            </View>
          </View>
        </LinearGradient>

        {/* Today's Schedule */}
        <View style={styles.scheduleHeader}>
          <Text style={styles.sectionTitle}>📅 Today's Schedule</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.viewAllText}>See All →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleContainer}>
          {TEACHER_SCHEDULE.map((item, index) => (
            <LinearGradient
              key={item.id}
              colors={['#FFFFFF', '#F9FAFB']}
              style={styles.scheduleCard}
            >
              <View style={styles.scheduleTime}>
                <Text style={styles.scheduleTimeHour}>{item.time.split(' ')[0]}</Text>
                <Text style={styles.scheduleTimePeriod}>{item.time.split(' ')[1]}</Text>
              </View>
              <View style={styles.scheduleLine}>
                <LinearGradient
                  colors={['#EA580C', '#F97316']}
                  style={styles.scheduleDot}
                />
                {index < TEACHER_SCHEDULE.length - 1 && <View style={styles.scheduleLineConnector} />}
              </View>
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleSubject}>{item.subject}</Text>
                <Text style={styles.scheduleDetails}>{item.details}</Text>
                <View style={styles.scheduleMeta}>
                  <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                  <Text style={styles.scheduleLocation}>Room {item.room || '101'}</Text>
                </View>
              </View>
            </LinearGradient>
          ))}
        </View>

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
  headerGradient: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 24,
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerTextGroup: {
    gap: 2,
  },
  headerGreeting: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  headerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  bellBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bellGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
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
  currentCard: {
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
  },
  currentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  currentTime: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  currentSubject: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  currentClass: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '500',
    lineHeight: 18,
  },
  currentMeta: {
    gap: 8,
    marginBottom: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 18,
  },
  buttonGroup: {
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
    gap: 8,
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
    gap: 8,
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
  quickSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 13,
    color: '#EA580C',
    fontWeight: '800',
  },
  statsCard: {
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F3F4F6',
  },
  progressSection: {
    marginTop: 6,
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
    color: '#EA580C',
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
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  scheduleContainer: {
    gap: 10,
  },
  scheduleCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  scheduleTime: {
    width: 55,
    alignItems: 'flex-end',
  },
  scheduleTimeHour: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: -0.3,
  },
  scheduleTimePeriod: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scheduleLine: {
    alignItems: 'center',
    width: 18,
    position: 'relative',
  },
  scheduleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  scheduleLineConnector: {
    position: 'absolute',
    top: 20,
    width: 2,
    height: 72,
    backgroundColor: '#F3F4F6',
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleSubject: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  scheduleDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
    lineHeight: 16,
  },
  scheduleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduleLocation: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default TeacherDashboardScreen;