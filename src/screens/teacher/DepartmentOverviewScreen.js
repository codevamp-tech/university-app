import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { DEPT_STREAMS } from '../../constants/data';

const FACULTY_ACTIVITIES = [
  { id: '1', name: 'Dr. Ananya Ray', action: 'Published 2 new assignments for 3rd Year AI course.', time: '10 mins ago', color: '#EA580C' },
  { id: '2', name: 'Prof. Vikram Singh', action: 'Marked mid-term attendance for CSE-A.', time: '45 mins ago', color: '#F59E0B' },
  { id: '3', name: 'Sarah Jenkins (TA)', action: 'Uploaded Lab Manual v2.1 to Student Portal.', time: '2 hours ago', color: '#10B981' },
];

const DEPT_ALERTS = [
  { id: '1', type: 'SYLLABUS LAG', desc: 'CSE-C Data Structures lagging by 2 units.', color: '#F59E0B', icon: 'book-outline' },
  { id: '2', type: 'EXTREME ABSENCES', desc: '15 students from CSE-B absent for 3 days.', color: '#EF4444', icon: 'alert-circle-outline' },
];

const DepartmentOverviewScreen = ({ navigation }) => {
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
        <Text style={styles.headerTitle}>Dept. Overview</Text>
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
        {/* Page Title */}
        <View style={styles.titleSection}>
          <LinearGradient
            colors={['#FFF7ED', '#FFEDD5']}
            style={styles.pageBadge}
          >
            <Text style={styles.pageBadgeText}>CSE DEPARTMENT</Text>
          </LinearGradient>
          <Text style={styles.pageTitle}>Computer Science & Engineering</Text>
          <Text style={styles.pageSubtitle}>B.Tech Program • 2023-24</Text>
          <TouchableOpacity style={styles.reportBtn} activeOpacity={0.85}>
            <LinearGradient
              colors={['#EA580C', '#9A3412']}
              style={styles.reportBtnGradient}
            >
              <Ionicons name="download-outline" size={16} color="#FFFFFF" />
              <Text style={styles.reportBtnText}>Generate Report</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <LinearGradient
            colors={['#FFFFFF', '#F9FAFB']}
            style={styles.statCard}
          >
            <LinearGradient
              colors={['#FFF7ED', '#FFEDD5']}
              style={styles.statIcon}
            >
              <Ionicons name="people-outline" size={22} color="#EA580C" />
            </LinearGradient>
            <Text style={styles.statLabel}>TOTAL STUDENTS</Text>
            <Text style={styles.statValue}>1,248</Text>
            <Text style={styles.statSub}>+12 from last semester</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#FFFFFF', '#F9FAFB']}
            style={styles.statCard}
          >
            <LinearGradient
              colors={['#FFFBEB', '#FEF3C7']}
              style={[styles.statIcon, { backgroundColor: '#F59E0B10' }]}
            >
              <Ionicons name="person-outline" size={22} color="#F59E0B" />
            </LinearGradient>
            <Text style={styles.statLabel}>FACULTY COUNT</Text>
            <Text style={styles.statValue}>42</Text>
            <Text style={styles.statSub}>8 Ph.D holders</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#FFFFFF', '#F9FAFB']}
            style={styles.statCard}
          >
            <LinearGradient
              colors={['#FEF2F2', '#FEE2E2']}
              style={[styles.statIcon, { backgroundColor: '#EF444410' }]}
            >
              <Ionicons name="bar-chart-outline" size={22} color="#EF4444" />
            </LinearGradient>
            <Text style={styles.statLabel}>AVG. ATTENDANCE</Text>
            <Text style={styles.statValue}>88.4%</Text>
            <Text style={styles.statSub}>Needs attention in 2nd Year</Text>
          </LinearGradient>
        </View>

        {/* Academic Streams */}
        <View style={styles.streamsHeader}>
          <Text style={styles.sectionTitle}>Academic Streams</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {DEPT_STREAMS.map((stream) => (
          <LinearGradient
            key={stream.id}
            colors={['#FFFFFF', '#F9FAFB']}
            style={styles.streamCard}
          >
            <View style={styles.streamHeader}>
              <Text style={styles.streamYear}>{stream.year}</Text>
              <LinearGradient
                colors={[stream.statusColor + '15', stream.statusColor + '08']}
                style={styles.statusBadge}
              >
                <Text style={[styles.statusText, { color: stream.statusColor }]}>{stream.status}</Text>
              </LinearGradient>
            </View>

            {stream.sections.map((sec, i) => (
              <View key={i} style={styles.sectionRow}>
                <Text style={styles.sectionName}>{sec.name}</Text>
                <View style={styles.sectionStats}>
                  <Text style={[styles.sectionAtt, sec.alert && styles.sectionAttAlert]}>
                    {sec.attendance}% Attd.
                  </Text>
                  {sec.alert && (
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  )}
                </View>
              </View>
            ))}

            {stream.alert && (
              <View style={styles.streamAlert}>
                <Ionicons name="alert-circle" size={13} color="#F59E0B" />
                <Text style={styles.streamAlertText}>{stream.alert}</Text>
              </View>
            )}
          </LinearGradient>
        ))}

        {/* Dept. Alerts */}
        <View style={styles.alertsSection}>
          <View style={styles.alertsHeader}>
            <LinearGradient
              colors={['#FFFBEB', '#FEF3C7']}
              style={styles.alertsIconWrapper}
            >
              <Ionicons name="warning-outline" size={16} color="#F59E0B" />
            </LinearGradient>
            <Text style={styles.alertsTitle}>Department Alerts</Text>
          </View>

          {DEPT_ALERTS.map((alert) => (
            <LinearGradient
              key={alert.id}
              colors={['#FFFFFF', '#F9FAFB']}
              style={styles.alertCard}
            >
              <LinearGradient
                colors={[alert.color + '15', alert.color + '08']}
                style={styles.alertIcon}
              >
                <Ionicons name={alert.icon} size={18} color={alert.color} />
              </LinearGradient>
              <View style={styles.alertContent}>
                <Text style={[styles.alertType, { color: alert.color }]}>{alert.type}</Text>
                <Text style={styles.alertDesc}>{alert.desc}</Text>
              </View>
            </LinearGradient>
          ))}
        </View>

        {/* Faculty Activities */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>

        {FACULTY_ACTIVITIES.map((fa) => (
          <LinearGradient
            key={fa.id}
            colors={['#FFFFFF', '#F9FAFB']}
            style={styles.activityCard}
          >
            <View style={[styles.activityDot, { backgroundColor: fa.color }]} />
            <View style={styles.activityContent}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityName}>{fa.name}</Text>
                <Text style={styles.activityTime}>{fa.time}</Text>
              </View>
              <Text style={styles.activityAction}>{fa.action}</Text>
            </View>
          </LinearGradient>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <LinearGradient
          colors={['#EA580C', '#9A3412']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
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
  titleSection: {
    marginBottom: 24,
  },
  pageBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
  },
  pageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: 0.8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '500',
  },
  reportBtn: {
    borderRadius: 40,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  reportBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  reportBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  statsGrid: {
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  statSub: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  streamsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  viewAllText: {
    fontSize: 13,
    color: '#EA580C',
    fontWeight: '800',
  },
  streamCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  streamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  streamYear: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sectionName: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  sectionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionAtt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  sectionAttAlert: {
    color: '#EF4444',
  },
  streamAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  streamAlertText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
  },
  alertsSection: {
    marginBottom: 24,
    marginTop: 6,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  alertsIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertType: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  alertDesc: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 18,
  },
  activityCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },
  activityTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  activityAction: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DepartmentOverviewScreen;