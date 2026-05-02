import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../hooks/useTheme';
import { APP_CONFIG } from '../../../config/appConfig';


const { width } = Dimensions.get('window');

const MentallyMainScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();


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
        <TouchableOpacity style={styles.settingsBtn}>
          <MaterialIcons name="settings" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
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
              {[60, 40, 85, 55, 30, 70, 90].map((height, index) => {
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                let bgColor = isDark ? 'rgba(141, 237, 236, 0.2)' : '#8DEDEC66'; // Default tertiary
                if (index === 2 || index === 6) bgColor = isDark ? 'rgba(254, 152, 50, 0.3)' : '#FE98324D'; // Orange for peaks
                if (index === 4) bgColor = isDark ? 'rgba(249, 86, 48, 0.2)' : '#F9563033'; // Error color for low
                return (
                  <View key={index} style={styles.chartBarCol}>
                    <View style={[styles.chartBar, { height: `${height}%`, backgroundColor: bgColor }]} />
                    <Text style={[styles.chartDay, { color: colors.textSecondary }]}>{days[index]}</Text>
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
                onPress={() => navigation.navigate(item.screen, item.params)}
              >
                <Image source={{ uri: item.image }} style={styles.breakImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.breakGradient}
                />
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
            <Text style={[styles.progressTitle, { color: colors.textPrimary }]}>You're doing great, Aryan</Text>
            <Text style={[styles.progressDesc, { color: colors.textSecondary }]}>
              You have completed 12 mindfulness sessions this week. Your focus is improving by 14%.
            </Text>

            <TouchableOpacity style={[styles.viewProgressBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
              <Text style={styles.viewProgressText}>View My Progress</Text>
            </TouchableOpacity>

          </View>
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
});

export default MentallyMainScreen;
