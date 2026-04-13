import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TEACHER_USER, TEACHER_SCHEDULE } from '../../constants/data';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { icon: 'document-text-outline', label: 'Post Assignment', color: '#8B2FC9', bgColor: '#8B2FC912' },
  { icon: 'star-outline', label: 'Internal Marks', color: '#F59E0B', bgColor: '#F59E0B12' },
  { icon: 'mail-outline', label: 'Broadcast', color: '#10B981', bgColor: '#10B98112' },
];

const TeacherDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Gradient Effect */}
      <LinearGradient
        colors={['#c4ccff', '#b6c0ff', '#eef1ff', '#e0e5ff', '#d2d9ff']}
        locations={[0, 0.3, 0.55, 0.8, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}


      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>VK</Text>
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerGreeting}>Welcome back,</Text>
              <Text style={styles.headerName}>Prof. Vikram</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            <View style={styles.bellBadge} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Lecture Card */}
        <View style={styles.currentCard}>
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
              <Ionicons name="checkbox-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Mark Attendance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85}>
              <Ionicons name="easel-outline" size={18} color="#8B2FC9" />
              <Text style={styles.secondaryBtnText}>Present</Text>
            </TouchableOpacity>
          </View>
        </View>

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
                <View style={[styles.actionIcon, { backgroundColor: action.bgColor }]}>
                  <Ionicons name={action.icon} size={22} color={action.color} />
                </View>
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

        <View style={styles.statsCard}>
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
              <View style={[styles.progressBarFill, { width: '84%' }]} />
            </View>
          </View>
        </View>

        {/* Today's Schedule */}
        <View style={styles.scheduleHeader}>
          <Text style={styles.sectionTitle}>📅 Today's Schedule</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.viewAllText}>See All →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleContainer}>
          {TEACHER_SCHEDULE.map((item, index) => (
            <View key={item.id} style={styles.scheduleCard}>
              <View style={styles.scheduleTime}>
                <Text style={styles.scheduleTimeHour}>{item.time.split(' ')[0]}</Text>
                <Text style={styles.scheduleTimePeriod}>{item.time.split(' ')[1]}</Text>
              </View>
              <View style={styles.scheduleLine}>
                <View style={styles.scheduleDot} />
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
            </View>
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
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 20,
    shadowColor: '#8B2FC9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B2FC9',
    letterSpacing: -0.3,
  },
  headerTextGroup: {
    gap: 2,
  },
  headerGreeting: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
    opacity: 0.9,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.2,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 11,
    right: 11,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 5,
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
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  currentTime: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  currentSubject: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.3,
    lineHeight: 26,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B2FC9',
    borderRadius: 40,
    paddingVertical: 12,
    shadowColor: '#8B2FC9',
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
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#8B2FC915',
  },
  secondaryBtnText: {
    color: '#8B2FC9',
    fontWeight: '600',
    fontSize: 13,
  },
  quickSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 14,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
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
    color: '#8B2FC9',
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
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
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B2FC9',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8B2FC9',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 2,
  },
  scheduleTime: {
    width: 55,
    alignItems: 'flex-end',
  },
  scheduleTimeHour: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B2FC9',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  scheduleTimePeriod: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
    backgroundColor: '#8B2FC9',
    marginTop: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  scheduleLineConnector: {
    position: 'absolute',
    top: 20,
    width: 2,
    height: 72,
    backgroundColor: '#E5E7EB',
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.2,
    lineHeight: 20,
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