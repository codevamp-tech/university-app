import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NOTIFICATIONS } from '../../constants/data';

const TABS = ['All Updates', 'Grades', 'Deadlines'];

const AlertsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('All Updates');

  const filteredNotifs = activeTab === 'All Updates'
    ? NOTIFICATIONS
    : activeTab === 'Grades'
      ? NOTIFICATIONS.filter(n => n.type === 'grade')
      : NOTIFICATIONS.filter(n => n.type === 'deadline');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alerts</Text>
        <TouchableOpacity style={styles.markAllButton}>
          <Text style={styles.markAllText}>Mark all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Urgent Alert Card */}
        <View style={styles.urgentCard}>
          <View style={styles.urgentHeader}>
            <View style={styles.urgentIcon}>
              <Ionicons name="alert-circle" size={24} color="#D97706" />
            </View>
            <View style={styles.dueBadge}>
              <Text style={styles.dueBadgeText}>DUE IN 2H</Text>
            </View>
          </View>

          <Text style={styles.urgentTitle}>Physics II: Lab Report</Text>
          <Text style={styles.urgentDesc}>Submission window closing soon</Text>

          <View style={styles.urgentFooter}>
            <View style={styles.avatarStack}>
              <View style={[styles.avatar, { backgroundColor: '#8B5CF6' }]}>
                <Text style={styles.avatarText}>JD</Text>
              </View>
              <View style={[styles.avatar, { backgroundColor: '#F59E0B', marginLeft: -8 }]}>
                <Text style={styles.avatarText}>MK</Text>
              </View>
              <Text style={styles.avatarCount}>+2</Text>
            </View>
            <TouchableOpacity style={styles.reviewBtn}>
              <Text style={styles.reviewBtnText}>Review →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notification Items */}
        <View style={styles.notifsContainer}>
          <Text style={styles.sectionSubtitle}>
            {filteredNotifs.length} updates
          </Text>

          {filteredNotifs.map((notif, index) => (
            <View key={notif.id} style={[styles.notifCard, index === filteredNotifs.length - 1 && styles.lastNotifCard]}>
              <View style={[styles.notifIcon, { backgroundColor: notif.color + '12' }]}>
                <Ionicons name={notif.icon} size={22} color={notif.color} />
                {notif.isNew && <View style={styles.newDot} />}
              </View>

              <View style={styles.notifContent}>
                <View style={styles.notifHeader}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  <Text style={styles.notifTime}>{notif.time}</Text>
                </View>
                <Text style={styles.notifDesc}>{notif.description}</Text>
                {notif.link && (
                  <TouchableOpacity>
                    <Text style={styles.notifLink}>{notif.link} →</Text>
                  </TouchableOpacity>
                )}
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 13,
    color: '#3474ec',
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  urgentCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  urgentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  urgentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  urgentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  urgentDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  urgentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FEF3C7',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  reviewBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 40,
  },
  reviewBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 40,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: '#8b2fc9',
    borderColor: '#8b2fc9',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  notifsContainer: {
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 14,
  },
  lastNotifCard: {
    marginBottom: 0,
  },
  notifIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  newDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8b2fc9',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  notifTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  notifDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
    marginBottom: 6,
  },
  notifLink: {
    fontSize: 13,
    color: '#3474ec',
    fontWeight: '600',
  },
});

export default AlertsScreen;