import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../hooks/useTheme';
import { APP_CONFIG } from '../../../config/appConfig';


const { width } = Dimensions.get('window');

const MoodJournalScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [activeMood, setActiveMood] = React.useState('Inspired');


  const moods = [
    { label: 'Calm', emoji: '😌', color: '#006666' },
    { label: 'Inspired', emoji: '✨', color: '#8B4B00' },
    { label: 'Tired', emoji: '😴', color: '#4953AC' },
    { label: 'Pensive', emoji: '🤔', color: '#595C5D' },
  ];

  const recentLogs = [
    {
      id: 1,
      title: 'Campus Evening Walk',
      emoji: '🌿',
      date: 'Yesterday, 9:30 PM',
      desc: 'The sunset over the main block was stunning. Feeling a bit relieved after the Python test results came in...',
      bgColor: 'rgba(0, 102, 102, 0.1)',
    },
    {
      id: 2,
      title: 'Project Milestone',
      emoji: '📚',
      date: 'Oct 24, 11:15 AM',
      desc: 'Finally cracked the logic for the Agora bento grid layout! Feeling very productive and energized for the rest of the day.',
      bgColor: 'rgba(73, 83, 172, 0.1)',
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
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Wellness Hub</Text>
        </View>
        <TouchableOpacity style={[styles.profileCircle, { backgroundColor: isDark ? 'rgba(254, 152, 50, 0.2)' : 'rgba(139, 75, 0, 0.1)' }]}>
          <MaterialCommunityIcons name="notebook-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>


      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Header */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Mood Journal</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>How’s your headspace today, {APP_CONFIG.UNIVERSITY_SHORT_NAME} student?</Text>
        </View>


        {/* Mood Selector & AI Insights Row */}
        <View style={styles.bentoRow}>
          {/* Vibe Picker */}
          <View style={[styles.vibeCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <Text style={[styles.vibeLabel, { color: isDark ? '#818CF8' : '#4953AC' }]}>CURRENT VIBE</Text>
            <View style={styles.moodGrid}>

              {moods.map((mood) => (
                <TouchableOpacity
                  key={mood.label}
                  style={[
                    styles.moodItem,
                    { backgroundColor: isDark ? colors.background : '#F5F6F7' },
                    activeMood === mood.label && [styles.moodItemActive, { borderColor: mood.color, backgroundColor: mood.color + '15' }],
                  ]}
                  onPress={() => setActiveMood(mood.label)}
                >

                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[
                    styles.moodLabel,
                    activeMood === mood.label && { color: mood.color }
                  ]}>
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* AI Emotional Insight */}
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.aiInsightCard}
          >
            <View style={styles.aiHeader}>
              <MaterialIcons name="auto-awesome" size={14} color="#FFFFFF" />
              <Text style={styles.aiLabel}>AI EMOTIONAL INSIGHTS</Text>
            </View>
            <Text style={styles.aiText}>
              "Your week shows a steady climb in academic focus. Remember to breathe between B.Tech labs. You're doing great!"
            </Text>
            <MaterialCommunityIcons
              name="cog-outline"
              size={120}
              color="rgba(255,255,255,0.1)"
              style={styles.aiDecorIcon}
            />
          </LinearGradient>

        </View>

        {/* Thought Prompt Section */}
        <View style={[styles.promptSection, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.promptTag, { color: colors.textMuted }]}>THOUGHT PROMPT</Text>
          <Text style={[styles.promptTitle, { color: isDark ? '#818CF8' : '#4953AC' }]}>What are you grateful for today?</Text>
          <TextInput
            style={[styles.journalInput, { backgroundColor: isDark ? colors.background : '#F5F6F7', color: colors.textPrimary }]}
            placeholder="Write your thoughts here..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.inputFooter}>
            <View style={styles.attachmentIcons}>
              <TouchableOpacity style={[styles.attachBtn, { backgroundColor: isDark ? colors.background : '#F5F6F7' }]}>
                <MaterialIcons name="image" size={20} color={isDark ? '#818CF8' : '#4953AC'} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.attachBtn, { backgroundColor: isDark ? colors.background : '#F5F6F7' }]}>
                <MaterialIcons name="mic" size={20} color={isDark ? '#818CF8' : '#4953AC'} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.logBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
              onPress={() => {
                alert('Journal entry saved successfully!');
                navigation.goBack();
              }}
            >
              <Text style={styles.logBtnText}>Log Entry</Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* Recent Logs */}
        <View style={styles.logsSection}>
          <View style={styles.logsHeader}>
            <Text style={[styles.logsTitle, { color: colors.textPrimary }]}>Recent Logs</Text>
            <TouchableOpacity><Text style={[styles.viewAllBtn, { color: colors.primary }]}>View All</Text></TouchableOpacity>
          </View>

          <View style={styles.logsList}>
            {/* Log 1 */}
            <TouchableOpacity style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={[styles.logEmojiBg, { backgroundColor: isDark ? 'rgba(0, 102, 102, 0.2)' : '#E0F2F1' }]}>
                <MaterialCommunityIcons name="leaf" size={28} color={isDark ? '#2DD4BF' : '#006666'} />
              </View>

              <View style={styles.logInfo}>
                <View style={styles.logHeaderRow}>
                  <Text style={[styles.logDate, { color: colors.textMuted }]}>YESTERDAY, 9:30 PM</Text>
                  <MaterialIcons name="more-vert" size={20} color={colors.textMuted} />
                </View>
                <Text style={[styles.logTitle, { color: colors.textPrimary }]}>Campus Evening Walk</Text>
                <Text style={[styles.logDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  The sunset over the main block was stunning. Feeling a bit relieved aft...
                </Text>
              </View>

            </TouchableOpacity>

            {/* Log 2 */}
            <TouchableOpacity style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={[styles.logEmojiBg, { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.2)' : '#E8EAF6' }]}>
                <MaterialCommunityIcons name="bookshelf" size={28} color={isDark ? '#818CF8' : '#4953AC'} />
              </View>

              <View style={styles.logInfo}>
                <View style={styles.logHeaderRow}>
                  <Text style={[styles.logDate, { color: colors.textMuted }]}>OCT 24, 11:15 AM</Text>
                  <MaterialIcons name="more-vert" size={20} color={colors.textMuted} />
                </View>
                <Text style={[styles.logTitle, { color: colors.textPrimary }]}>Project Milestone</Text>
                <Text style={[styles.logDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  Finally cracked the logic for the Agora bento grid layout! Feeling...
                </Text>
              </View>

            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 120 }} />
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
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scroll: {
    paddingBottom: 20,
  },
  heroSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 40,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },

  heroSub: {
    fontSize: 15,
    marginTop: 4,
    fontWeight: '500',
  },

  bentoRow: {
    paddingHorizontal: 20,
    gap: 20,
    marginBottom: 40,
  },
  vibeCard: {
    borderRadius: 24,
    padding: 24,
  },

  vibeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 20,
  },

  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodItem: {
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    width: '22%',
  },

  moodItemActive: {
    backgroundColor: 'rgba(139, 75, 0, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(139, 75, 0, 0.2)',
    transform: [{ scale: 1.1 }],
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: '800',
  },

  aiInsightCard: {
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    opacity: 0.9,
    letterSpacing: 1.5,
  },
  aiText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
    zIndex: 1,
  },
  aiDecorIcon: {
    position: 'absolute',
    bottom: -20,
    right: -20,
  },
  promptSection: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 32,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 32,
    elevation: 2,
  },

  promptTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 12,
  },

  promptTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 24,
  },

  journalInput: {
    borderRadius: 16,
    padding: 20,
    fontSize: 15,
    height: 160,
    marginBottom: 24,
  },

  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attachmentIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logBtn: {
    backgroundColor: '#8B4B00',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#8B4B00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  logBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  logsSection: {
    paddingHorizontal: 20,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  logsTitle: {
    fontSize: 22,
    fontWeight: '900',
  },

  viewAllBtn: {
    fontSize: 14,
    fontWeight: '800',
  },

  logsList: {
    gap: 16,
  },
  logCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 24,
    gap: 16,
  },

  logEmojiBg: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logEmoji: {
    fontSize: 24,
  },
  logInfo: {
    flex: 1,
  },
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logDate: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ABADAE',
    textTransform: 'uppercase',
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },

  logDesc: {
    fontSize: 13,
    lineHeight: 18,
  },


});

export default MoodJournalScreen;
