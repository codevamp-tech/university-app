import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NOTIFICATIONS } from '../../constants/data';

const { width } = Dimensions.get('window');
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
      {/* Header with Dashboard Style */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#EA580C', '#9A3412']}
            style={styles.logoIconBg}
          >
            <MaterialIcons name="notifications" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.headerLogo}>Invertis University</Text>
        </View>
        <TouchableOpacity style={styles.markAllButton}>
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Urgent Alert Card - Redesigned with Gradient */}
        <View style={styles.urgentCardWrap}>
          <LinearGradient
            colors={['#FFFFFF', '#FFF7ED']}
            style={styles.urgentCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <View style={styles.urgentHeader}>
              <View style={styles.urgentIconWrapper}>
                <LinearGradient colors={['#F97316', '#EA580C']} style={styles.urgentIconBg}>
                  <Ionicons name="alert-circle" size={28} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <LinearGradient colors={['#FFEDD5', '#FED7AA']} style={styles.dueBadge}>
                <Text style={styles.dueBadgeText}>DUE IN 2H</Text>
              </LinearGradient>
            </View>

            <Text style={styles.urgentTitle}>Physics II: Lab Report</Text>
            <Text style={styles.urgentDesc}>Submission window closing soon. Ensure all variables are correctly documented.</Text>

            <View style={styles.urgentFooter}>
              <View style={styles.avatarStack}>
                <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.avatar}>
                  <Text style={styles.avatarText}>JD</Text>
                </LinearGradient>
                <LinearGradient colors={['#EA580C', '#9A3412']} style={[styles.avatar, styles.avatarOverlap]}>
                  <Text style={styles.avatarText}>MK</Text>
                </LinearGradient>
                <Text style={styles.avatarCount}>+2</Text>
              </View>
              <TouchableOpacity style={styles.reviewBtn}>
                <LinearGradient colors={['#1F2937', '#111827']} style={styles.reviewBtnGradient}>
                  <Text style={styles.reviewBtnText}>Review Now →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Filter Tabs - Dashboard Style */}
        <View style={styles.tabsContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabWrapper}
              onPress={() => setActiveTab(tab)}
            >
              <LinearGradient
                colors={activeTab === tab ? ['#F97316', '#EA580C'] : ['#F9FAFB', '#F3F4F6']}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notification Items */}
        <View style={styles.notifsContainer}>
          <Text style={styles.sectionSubtitle}>
            {filteredNotifs.length} updates
          </Text>

          {filteredNotifs.map((notif, index) => (
            <LinearGradient
              key={notif.id}
              colors={['#FFFFFF', '#F9FAFB']}
              style={[styles.notifCard, index === filteredNotifs.length - 1 && styles.lastNotifCard]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <View style={[styles.notifIcon, { backgroundColor: notif.color + '15' }]}>
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
            </LinearGradient>
          ))}
        </View>

        <View style={{ height: 100 }} />
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
    backgroundColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLogo: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  markAllText: {
    fontSize: 13,
    color: '#EA580C',
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  urgentCardWrap: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  urgentCard: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  urgentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  urgentIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  urgentIconBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9A3412',
    letterSpacing: 0.5,
  },
  urgentTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
  },
  urgentDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 12,
  },
  reviewBtn: {
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  reviewBtnGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  reviewBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  tabWrapper: {
    flex: 1,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 40,
  },
  tabActive: {
    borderWidth: 0,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
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
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  notifCard: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  lastNotifCard: {
    marginBottom: 0,
  },
  notifIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  newDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EA580C',
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
    fontSize: 16,
    fontWeight: '700',
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
    color: '#EA580C',
    fontWeight: '700',
  },
});

export default AlertsScreen;