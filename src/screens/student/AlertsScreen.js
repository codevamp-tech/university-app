import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NOTIFICATIONS } from '../../constants/data';
import { useTheme } from '../../hooks/useTheme';


const { width } = Dimensions.get('window');
const TABS = ['All Updates', 'Grades', 'Deadlines'];

const AlertsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('All Updates');
  const { colors, isDark } = useTheme();


  const filteredNotifs = activeTab === 'All Updates'
    ? NOTIFICATIONS
    : activeTab === 'Grades'
      ? NOTIFICATIONS.filter(n => n.type === 'grade')
      : NOTIFICATIONS.filter(n => n.type === 'deadline');

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header with Dashboard Style */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.logoIconBg}
          >
            <MaterialIcons name="notifications" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.headerLogo, { color: colors.textPrimary }]}>Invertis University</Text>
        </View>
        <TouchableOpacity style={[styles.markAllButton, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all as read</Text>
        </TouchableOpacity>
      </View>



      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Urgent Alert Card - Redesigned with Gradient */}
        <View style={styles.urgentCardWrap}>
          <LinearGradient
            colors={isDark ? ['#1E1B4B', '#111827'] : ['#FFFFFF', '#FFF7ED']}
            style={[styles.urgentCard, { borderColor: colors.border }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >

            <View style={styles.urgentHeader}>
              <View style={styles.urgentIconWrapper}>
                <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.urgentIconBg}>
                  <Ionicons name="alert-circle" size={28} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <LinearGradient colors={isDark ? ['#7C2D12', '#431407'] : ['#FFEDD5', '#FED7AA']} style={styles.dueBadge}>
                <Text style={[styles.dueBadgeText, { color: isDark ? '#FFEDD5' : '#9A3412' }]}>DUE IN 2H</Text>
              </LinearGradient>

            </View>

            <Text style={[styles.urgentTitle, { color: colors.textPrimary }]}>Physics II: Lab Report</Text>
            <Text style={[styles.urgentDesc, { color: colors.textSecondary }]}>Submission window closing soon. Ensure all variables are correctly documented.</Text>


            <View style={styles.urgentFooter}>
              <View style={styles.avatarStack}>
                <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={[styles.avatar, { borderColor: isDark ? colors.border : '#FFFFFF' }]}>
                  <Text style={styles.avatarText}>JD</Text>
                </LinearGradient>
                <LinearGradient colors={[colors.primary, colors.primaryDark]} style={[styles.avatar, styles.avatarOverlap, { borderColor: isDark ? colors.border : '#FFFFFF' }]}>
                  <Text style={styles.avatarText}>MK</Text>
                </LinearGradient>
                <Text style={[styles.avatarCount, { color: colors.textSecondary }]}>+2</Text>
              </View>

              <TouchableOpacity style={styles.reviewBtn}>
                <LinearGradient colors={isDark ? ['#312E81', '#1E1B4B'] : ['#1F2937', '#111827']} style={styles.reviewBtnGradient}>
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
              style={[styles.tabWrapper, { backgroundColor: activeTab === tab ? 'transparent' : colors.card, borderColor: colors.border, borderWidth: activeTab === tab ? 0 : 1 }]}
              onPress={() => setActiveTab(tab)}
            >
              <LinearGradient
                colors={activeTab === tab ? [colors.primary, colors.primaryDark] : ['transparent', 'transparent']}
                style={styles.tab}
              >
                <Text style={[styles.tabText, { color: activeTab === tab ? '#FFFFFF' : colors.textSecondary }]}>
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
              colors={[colors.card, colors.card]}
              style={[styles.notifCard, { borderColor: colors.border }, index === filteredNotifs.length - 1 && styles.lastNotifCard]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >

              <View style={[styles.notifIcon, { backgroundColor: notif.color + '15' }]}>
                <Ionicons name={notif.icon} size={22} color={notif.color} />
                {notif.isNew && <View style={[styles.newDot, { borderColor: colors.card }]} />}
              </View>


              <View style={styles.notifContent}>
                <View style={styles.notifHeader}>
                  <Text style={[styles.notifTitle, { color: colors.textPrimary }]}>{notif.title}</Text>
                  <Text style={[styles.notifTime, { color: colors.textSecondary }]}>{notif.time}</Text>
                </View>

                <Text style={[styles.notifDesc, { color: colors.textSecondary }]}>{notif.description}</Text>
                {notif.link && (
                  <TouchableOpacity>
                    <Text style={[styles.notifLink, { color: colors.primary }]}>{notif.link} →</Text>
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
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    letterSpacing: -0.5,
  },

  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  markAllText: {
    fontSize: 13,
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
    letterSpacing: 0.5,
  },
  urgentTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  urgentDesc: {
    fontSize: 14,
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
  },
  tab: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 40,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },

  notifsContainer: {
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 12,
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
    flex: 1,
    marginRight: 8,
  },

  notifTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  notifDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
  },

  notifLink: {
    fontSize: 13,
    fontWeight: '700',
  },
});


export default AlertsScreen;