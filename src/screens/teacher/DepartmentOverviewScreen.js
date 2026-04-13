import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEPT_STREAMS } from '../../constants/data';

const FACULTY_ACTIVITIES = [
  { id: '1', name: 'Dr. Ananya Ray', action: 'Published 2 new assignments for 3rd Year AI course.', time: '10 mins ago', color: '#8b2fc9' },
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dept. Overview</Text>
        <TouchableOpacity style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={20} color="#111827" />
          <View style={styles.bellBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <View style={styles.titleSection}>
          <Text style={styles.pageBadge}>CSE DEPARTMENT</Text>
          <Text style={styles.pageTitle}>Computer Science & Engineering</Text>
          <Text style={styles.pageSubtitle}>B.Tech Program • 2023-24</Text>
          <TouchableOpacity style={styles.reportBtn} activeOpacity={0.85}>
            <Ionicons name="download-outline" size={16} color="#FFFFFF" />
            <Text style={styles.reportBtnText}>Generate Report</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#8b2fc910' }]}>
              <Ionicons name="people-outline" size={22} color="#8b2fc9" />
            </View>
            <Text style={styles.statLabel}>TOTAL STUDENTS</Text>
            <Text style={styles.statValue}>1,248</Text>
            <Text style={styles.statSub}>+12 from last semester</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F59E0B10' }]}>
              <Ionicons name="person-outline" size={22} color="#F59E0B" />
            </View>
            <Text style={styles.statLabel}>FACULTY COUNT</Text>
            <Text style={styles.statValue}>42</Text>
            <Text style={styles.statSub}>8 Ph.D holders</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EF444410' }]}>
              <Ionicons name="bar-chart-outline" size={22} color="#EF4444" />
            </View>
            <Text style={styles.statLabel}>AVG. ATTENDANCE</Text>
            <Text style={styles.statValue}>88.4%</Text>
            <Text style={styles.statSub}>Needs attention in 2nd Year</Text>
          </View>
        </View>

        {/* Academic Streams */}
        <View style={styles.streamsHeader}>
          <Text style={styles.sectionTitle}>Academic Streams</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {DEPT_STREAMS.map((stream) => (
          <View key={stream.id} style={styles.streamCard}>
            <View style={styles.streamHeader}>
              <Text style={styles.streamYear}>{stream.year}</Text>
              <View style={[styles.statusBadge, { backgroundColor: stream.statusColor + '10' }]}>
                <Text style={[styles.statusText, { color: stream.statusColor }]}>{stream.status}</Text>
              </View>
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
          </View>
        ))}

        {/* Dept. Alerts */}
        <View style={styles.alertsSection}>
          <View style={styles.alertsHeader}>
            <Ionicons name="warning-outline" size={18} color="#F59E0B" />
            <Text style={styles.alertsTitle}>Department Alerts</Text>
          </View>

          {DEPT_ALERTS.map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
              <View style={[styles.alertIcon, { backgroundColor: alert.color + '10' }]}>
                <Ionicons name={alert.icon} size={18} color={alert.color} />
              </View>
              <View style={styles.alertContent}>
                <Text style={[styles.alertType, { color: alert.color }]}>{alert.type}</Text>
                <Text style={styles.alertDesc}>{alert.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Faculty Activities */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>

        {FACULTY_ACTIVITIES.map((fa) => (
          <View key={fa.id} style={styles.activityCard}>
            <View style={[styles.activityDot, { backgroundColor: fa.color }]} />
            <View style={styles.activityContent}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityName}>{fa.name}</Text>
                <Text style={styles.activityTime}>{fa.time}</Text>
              </View>
              <Text style={styles.activityAction}>{fa.action}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <Ionicons name="add" size={26} color="#FFFFFF" />
      </TouchableOpacity>
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
  titleSection: {
    marginBottom: 20,
  },
  pageBadge: {
    fontSize: 11,
    color: '#8b2fc9',
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
    fontWeight: '500',
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#8b2fc9',
    borderRadius: 40,
    paddingHorizontal: 18,
    paddingVertical: 11,
    alignSelf: 'flex-start',
    shadowColor: '#8b2fc9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  reportBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  statsGrid: {
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  statSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  streamsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.2,
  },
  viewAllText: {
    fontSize: 13,
    color: '#8b2fc9',
    fontWeight: '600',
  },
  streamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  streamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  streamYear: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.2,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sectionName: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  sectionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionAtt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  sectionAttAlert: {
    color: '#EF4444',
  },
  streamAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 9,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  streamAlertText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '500',
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
  alertsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.2,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertType: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  alertDesc: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 18,
  },
  activityCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
    paddingVertical: 6,
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
    marginBottom: 3,
  },
  activityName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.1,
  },
  activityTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  activityAction: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    fontWeight: '400',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8b2fc9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b2fc9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
});

export default DepartmentOverviewScreen;