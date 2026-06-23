import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert,
  Modal
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../hooks/useTheme';
import { APP_CONFIG } from '../../../config/appConfig';
import { useUser } from '../../../context/UserContext';
import { listMoodEntriesAPI, listFocusSessionsAPI } from '../../../data/apiService';
import { useHealthMetrics } from '../../../hooks/useHealthMetrics';


const { width } = Dimensions.get('window');

const MentallyMainScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useUser();
  const { metrics, goals } = useHealthMetrics();

  const [moodValues, setMoodValues] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [dayLabels, setDayLabels] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

  // Report & Progress Modal States
  const [totalSessions, setTotalSessions] = useState(0);
  const [focusStats, setFocusStats] = useState({ count: 0, minutes: 0 });
  const [moodLogsCount, setMoodLogsCount] = useState(0);
  const [avgMoodVal, setAvgMoodVal] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);

  const loadMoodData = useCallback(async () => {
    if (!user?.accessToken) return;
    try {
      const logs = await listMoodEntriesAPI(user.accessToken);
      
      const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const last7 = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7.push({
          dateStr: d.toDateString(),
          label: labels[d.getDay()],
        });
      }
      
      const heights = last7.map((day) => {
        const match = logs.find(log => new Date(log.created_at).toDateString() === day.dateStr);
        if (match) {
          return match.intensity * 20; // 1-5 scale to 20-100%
        }
        return 0; // Dynamic! 0 height for unlogged days
      });
      
      setMoodValues(heights);
      setDayLabels(last7.map(d => d.label));
    } catch (e) {
      console.warn('Failed to load mood data:', e);
    }
  }, [user?.accessToken]);

  const loadProgressStats = useCallback(async () => {
    if (!user?.accessToken) return;
    try {
      // 1. Mood journal entries
      const moodLogs = await listMoodEntriesAPI(user.accessToken);
      setMoodLogsCount(moodLogs.length);

      let totalMoodVal = 0;
      moodLogs.forEach(log => {
        totalMoodVal += (log.intensity * 20); // Scale to 100
      });
      const avgMood = moodLogs.length > 0 ? Math.round(totalMoodVal / moodLogs.length) : 0;
      setAvgMoodVal(avgMood);

      // 2. Focus sessions
      const focusLogs = await listFocusSessionsAPI(user.accessToken);
      const totalFocusMins = focusLogs.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      
      setFocusStats({
        count: focusLogs.length,
        minutes: totalFocusMins
      });

      // Total sessions completed
      setTotalSessions(moodLogs.length + focusLogs.length);
    } catch (e) {
      console.warn('[MentallyMain] Failed to load progress stats:', e);
    }
  }, [user?.accessToken]);

  useEffect(() => {
    loadMoodData();
    loadProgressStats();
    const unsubscribe = navigation.addListener('focus', () => {
      loadMoodData();
      loadProgressStats();
    });
    return unsubscribe;
  }, [navigation, loadMoodData, loadProgressStats]);


  const mindfulnessBreaks = [
    {
      id: 'journal',
      title: 'Daily Mood Journal',
      tag: 'DAILY VIBE',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkYPkZm4wg1dieX55BEyZhLJOxFHegph7YjKBi7kwcxmAJwYMVbTGgQfDGJbUubPrWiKybRSS3jwTgE95s8sT9AZofqIqsY328E9uKh1oCb0mShm_cZIXwpWLRXIX2yiFfuGlIGj6R-FGA99WFm-kxvqqcAEsic8Xo5DVmmVVF7WnsuIxedvpMUnoYnz1wTkD_zrUlhHVY24RwS-OwiyfMkDXY_NHxRVJ9YlkjoDJIRbyeKSzETIbWrW8ZGpkEShTG4FirU1gCHlIY',
      screen: 'MoodJournal',
      color: '#FE9832', // primary-fixed
    },
    {
      id: 'breathing',
      title: 'Deep Breathing',
      tag: 'VISUAL GUIDE',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhajXP1fsrYPUOMNqkRfjgJm_pkBYYxxtsMNxn8DGYgV67KS-0wWGjaLKfbXLZDezvv3Oa-4PSSlqHwUeyTAft9fa6FxhtZVT6HRatOF4tTSwlc33FeFUwLrjANckpasww8ncQYLqJW7RiekPhvlhKvhvwArZVGCTeVv1XQZjFpG2P7A-cXPBwOmZn1SIpVWfchc4zvOR4ouU28m7Dmnqo3bzf_IztUuR6zLXW9k_U6HwALxMqM3k_e8i1XzlQ5BjxPmzvAv1LmRjZ',
      screen: 'GuidedMeditation',
      params: { mode: 'Visual Guide' },
      color: '#8DEDEC', // tertiary-fixed
    },
    {
      id: 'music',
      title: 'Zen Music',
      tag: 'ATMOSPHERES',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAb26AichAlCJgPoXBQuOuOhNQy5UwTqkKeP17hfynEAarTFzk3e0ld7NHvevRLXP9wIV8Un32lgNfPRrdJYXjk5nYH0qbCuHZSIhMX5HJcxXKrHFiaZ1eZimtMFBDvySgooTi5DcnKyfeDVpsZ797_FElFhtcJw-1_pcWAjvzEwlhMlE8qbIPkNJ2XJDOaDAU8zjV1C77H2uZG9p2wmzs80IgThHCWl_W8oJoxjt3-NsngnTjhqTjI5srYbgi1I-HgQo3B5Xd83yIe',
      screen: 'ZenMusic',
      color: '#CBCEFF', // secondary-fixed
    },
    {
      id: 'counsellor',
      title: 'Book a Therapist',
      tag: 'PROFESSIONAL',
      image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1000&auto=format&fit=crop',
      screen: 'CounsellorBooking',
      color: '#F97316', // Orange
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>

      {/* Top Navigation */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} Mentally</Text>
        </View>
      </View>


      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Daily Affirmation */}
        <View style={styles.section}>
          <LinearGradient
            colors={['#8B4B00', '#FE9832']}
            style={styles.affirmationCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.affirmationContent}>
              <Text style={styles.affirmationTitle}>Daily Affirmation</Text>
              <Text style={styles.affirmationText}>
                "Your academic journey is a marathon, not a sprint. Every small step forward is a victory for your future self."
              </Text>
              <View style={styles.affirmationFooter}>
                <View style={styles.affirmationLine} />
                <Text style={styles.affirmationTag}>STAY MINDFUL</Text>
              </View>
            </View>
            <View style={styles.affirmationDecor} />
          </LinearGradient>
        </View>

        {/* Quick Relief */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Quick Relief</Text>
            <Text style={[styles.sectionBadge, { color: colors.textMuted }]}>EMERGENCY CALM</Text>
          </View>
          <View style={styles.reliefGrid}>

            <TouchableOpacity
              style={[styles.reliefCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => navigation.navigate('GuidedMeditation', { mode: 'Anxious' })}
            >
              <View style={[styles.reliefIconBg, { backgroundColor: 'rgba(176, 37, 0, 0.1)' }]}>
                <MaterialCommunityIcons name="volcano" size={24} color="#B02500" />
              </View>
              <Text style={[styles.reliefLabel, { color: colors.textPrimary }]}>Anxious?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.reliefCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => navigation.navigate('GuidedMeditation', { mode: 'Focus' })}
            >
              <View style={[styles.reliefIconBg, { backgroundColor: 'rgba(0, 102, 102, 0.1)' }]}>
                <MaterialCommunityIcons name="target" size={24} color="#006666" />
              </View>
              <Text style={[styles.reliefLabel, { color: colors.textPrimary }]}>Need Focus?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.reliefCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => navigation.navigate('GuidedMeditation', { mode: 'Burned Out' })}
            >
              <View style={[styles.reliefIconBg, { backgroundColor: 'rgba(139, 75, 0, 0.1)' }]}>
                <MaterialCommunityIcons name="battery-0" size={24} color="#8B4B00" />
              </View>
              <Text style={[styles.reliefLabel, { color: colors.textPrimary }]}>Burned Out?</Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* Mood Journal Preview */}
        <View style={styles.section}>
          <View style={[styles.moodBox, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.moodHeader}>
              <View>
                <Text style={[styles.moodTitle, { color: colors.textPrimary }]}>Mood Journal</Text>
                <Text style={[styles.moodSub, { color: colors.textSecondary }]}>Last 7 Days</Text>
              </View>

              <TouchableOpacity onPress={() => navigation.navigate('MoodJournal')} style={[styles.addMoodBtn, { backgroundColor: colors.border }]}>
                <MaterialIcons name="add" size={24} color={colors.primary} />
              </TouchableOpacity>

            </View>
            <View style={styles.chartContainer}>
              {moodValues.map((height, index) => {
                let bgColor = isDark ? 'rgba(141, 237, 236, 0.2)' : '#8DEDEC66'; // Default tertiary
                if (height >= 85) bgColor = isDark ? 'rgba(254, 152, 50, 0.3)' : '#FE98324D'; // Orange for peaks
                if (height < 50) bgColor = isDark ? 'rgba(249, 86, 48, 0.2)' : '#F9563033'; // Low mood color
                return (
                  <View key={index} style={styles.chartBarCol}>
                    <View style={[styles.chartBar, { height: `${height}%`, backgroundColor: bgColor }]} />
                    <Text style={[styles.chartDay, { color: colors.textSecondary }]}>{dayLabels[index]}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Mindfulness Breaks */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Mindfulness Breaks</Text>
          <View style={styles.breaksGrid}>

            {mindfulnessBreaks.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.breakCard}
                onPress={() => {
                  if (item.id === 'counsellor') {
                    Alert.alert(
                      '🔒 Trial Account Limit',
                      'Therapist booking is not available in trial accounts.',
                      [{ text: 'OK' }]
                    );
                    return;
                  }
                  navigation.navigate(item.screen, item.params);
                }}
              >
                <Image source={{ uri: item.image }} style={styles.breakImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.breakGradient}
                />
                {item.id === 'counsellor' && (
                  <View style={styles.lockBadge}>
                    <MaterialCommunityIcons name="lock" size={10} color="#FFFFFF" />
                    <Text style={styles.lockBadgeText}>DEMO LOCK</Text>
                  </View>
                )}
                <View style={styles.breakContent}>
                  <Text style={[styles.breakTag, { color: item.color }]}>{item.tag}</Text>
                  <Text style={styles.breakTitle}>{item.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.section}>
          <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.progressIconBg}>
              <MaterialCommunityIcons name="spa" size={32} color={isDark ? '#2DD4BF' : '#006666'} />
            </View>
            <Text style={[styles.progressTitle, { color: colors.textPrimary }]}>You're doing great, {user?.name || 'Student'}</Text>
            <Text style={[styles.progressDesc, { color: colors.textSecondary }]}>
              You have completed {totalSessions} mindfulness breaks so far. Keep prioritizing your headspace!
            </Text>

            <TouchableOpacity 
              style={[styles.viewProgressBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
              onPress={() => setShowProgressModal(true)}
            >
              <Text style={styles.viewProgressText}>View My Progress</Text>
            </TouchableOpacity>

          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Progress Report Modal */}
      <Modal
        visible={showProgressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProgressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="spa" size={24} color={colors.primary} />
                <Text style={[styles.modalHeaderTitle, { color: colors.textPrimary }]}>Student Wellness Report</Text>
              </View>
              <TouchableOpacity onPress={() => setShowProgressModal(false)} style={styles.closeModalBtn}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalGreeting, { color: colors.textPrimary }]}>Hi, {user?.name || 'Student'}</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Here is your live mindfulness & focus activity report:</Text>

              {/* Stats Grid */}
              <View style={styles.modalStatsGrid}>
                <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB' }]}>
                  <MaterialCommunityIcons name="run-fast" size={24} color="#8B4B00" />
                  <Text style={[styles.statNum, { color: colors.textPrimary }]}>{Math.round((metrics.calories / Math.max(1, goals.calories)) * 100)}%</Text>
                  <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Move Goal</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB' }]}>
                  <MaterialCommunityIcons name="fire" size={24} color="#006666" />
                  <Text style={[styles.statNum, { color: colors.textPrimary }]}>{metrics.calories} kcal</Text>
                  <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Calories Burned</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB' }]}>
                  <MaterialCommunityIcons name="notebook-outline" size={24} color="#4953AC" />
                  <Text style={[styles.statNum, { color: colors.textPrimary }]}>{moodLogsCount}</Text>
                  <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Mood Logs</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB' }]}>
                  <MaterialCommunityIcons name="heart-outline" size={24} color="#B02500" />
                  <Text style={[styles.statNum, { color: colors.textPrimary }]}>{avgMoodVal}%</Text>
                  <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Average Vibe</Text>
                </View>
              </View>

              <View style={[styles.insightBox, { backgroundColor: isDark ? 'rgba(0,102,102,0.1)' : '#F0FDF4', borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={[styles.insightTitle, { color: colors.primary }]}>Wellness Insight</Text>
                <Text style={[styles.insightDesc, { color: colors.textSecondary }]}>
                  {totalSessions > 0 
                    ? "Great progress! Regularly using breathing guides and writing in your journal helps reduce academic pressure, enhancing recall and memory retention by 15-20%."
                    : "You haven't completed any focus sessions or mood logs today. Navigate to the Daily Mood Journal or start a Deep Breathing session to build your wellness consistency!"}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  affirmationCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  affirmationContent: {
    zIndex: 10,
  },
  affirmationTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  affirmationText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 26,
    marginBottom: 24,
  },
  affirmationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  affirmationLine: {
    width: 32,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  affirmationTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2.5,
  },
  affirmationDecor: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4953AC', // secondary
  },
  sectionBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#595C5D',
    letterSpacing: 1.5,
  },
  reliefGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  reliefCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reliefIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  reliefLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C2F30',
  },
  moodBox: {
    borderRadius: 20,
    padding: 24,
  },

  moodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  moodTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C2F30',
  },
  moodSub: {
    fontSize: 12,
    color: '#595C5D',
    fontWeight: '600',
  },
  addMoodBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    paddingHorizontal: 8,
  },
  chartBarCol: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 8,
  },
  chartBar: {
    width: 24,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  chartDay: {
    fontSize: 9,
    fontWeight: '800',
    color: '#595C5D',
  },
  breaksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  breakCard: {
    width: (width - 56) / 2,
    height: (width - 56) / 2,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  breakImage: {
    ...StyleSheet.absoluteFillObject,
  },
  breakGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  breakContent: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  breakTag: {
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  breakTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    textAlign: 'center',
  },

  progressIconBg: {
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2C2F30',
    marginBottom: 8,
  },
  progressDesc: {
    fontSize: 14,
    color: '#595C5D',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  viewProgressBtn: {
    backgroundColor: '#8B4B00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  viewProgressText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  lockBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  lockBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  closeModalBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingBottom: 24,
  },
  modalGreeting: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 24,
  },
  modalStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 6,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLbl: {
    fontSize: 11,
    fontWeight: '600',
  },
  insightBox: {
    padding: 20,
    borderRadius: 20,
    gap: 8,
    marginTop: 10,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  insightDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});

export default MentallyMainScreen;
