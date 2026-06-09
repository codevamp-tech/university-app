import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { APP_CONFIG } from '../../config/appConfig';
import { useUser } from '../../context/UserContext';
import { getStartups, createStartup, submitPitch, triggerCofounderMatch } from '../../data/apiService';

const { width } = Dimensions.get('window');

const FALLBACK_STARTUPS = [
  {
    id: 'mock-1',
    name: 'AgriTech Campus',
    tagline: 'Smart IoT solutions for sugarcane farmers',
    description: 'Smart IoT solutions for local sugarcane farmers to optimize irrigation.',
    category: 'Agriculture',
    stage: 'SERIES A SEED',
    milestone_pct: 85,
    looking_for: ['Co-founder', 'Investors']
  },
  {
    id: 'mock-2',
    name: 'EduSolve',
    tagline: 'AI-driven vernacular language learning',
    description: 'AI-driven vernacular language learning specifically for Rural UP students.',
    category: 'Education',
    stage: 'PRE-REVENUE',
    milestone_pct: 40,
    looking_for: ['React Native Developer', 'Marketing Lead']
  }
];

const getStartupIconInfo = (category, isDark) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('agri')) {
    return {
      name: 'agriculture',
      color: isDark ? '#34D399' : '#16A34A',
      bgColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4',
      tagBg: isDark ? 'rgba(5, 150, 105, 0.2)' : '#DCFCE7',
      tagColor: isDark ? '#A7F3D0' : '#166534'
    };
  }
  if (cat.includes('edu') || cat.includes('learn')) {
    return {
      name: 'auto-stories',
      color: isDark ? '#60A5FA' : '#2563EB',
      bgColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
      tagBg: isDark ? 'rgba(30, 64, 175, 0.2)' : '#DBEAFE',
      tagColor: isDark ? '#DBEAFE' : '#1D4ED8'
    };
  }
  if (cat.includes('health') || cat.includes('med') || cat.includes('pharma') || cat.includes('clinic')) {
    return {
      name: 'medical-services',
      color: isDark ? '#F87171' : '#DC2626',
      bgColor: isDark ? 'rgba(248, 113, 113, 0.1)' : '#FEF2F2',
      tagBg: isDark ? 'rgba(185, 28, 28, 0.2)' : '#FEE2E2',
      tagColor: isDark ? '#FCA5A5' : '#991B1B'
    };
  }
  return {
    name: 'lightbulb',
    color: isDark ? '#FBBF24' : '#D97706',
    bgColor: isDark ? 'rgba(251, 191, 36, 0.1)' : '#FEF3C7',
    tagBg: isDark ? 'rgba(180, 83, 9, 0.2)' : '#FEF3C7',
    tagColor: isDark ? '#FDE68A' : '#78350F'
  };
};

const VentureScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { accessToken, user } = useUser();

  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [vName, setVName] = useState('');
  const [vPitch, setVPitch] = useState('');
  const [vCategory, setVCategory] = useState(user?.category || 'Tech');
  const [vLookingFor, setVLookingFor] = useState('Developer, Marketing');

  const fetchAllStartups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStartups(accessToken);
      if (data && data.length > 0) {
        setStartups(data);
      } else {
        setStartups(FALLBACK_STARTUPS);
      }
    } catch (err) {
      console.warn('[VentureScreen] Failed to fetch startups from API, using fallback:', err.message);
      setStartups(FALLBACK_STARTUPS);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchAllStartups();
  }, [fetchAllStartups]);

  const handleCoFounderMatch = async () => {
    if (!accessToken) {
      Alert.alert('Login Required', 'You must be logged in to match with co-founders.');
      return;
    }
    setMatching(true);
    try {
      await triggerCofounderMatch(accessToken);
      Alert.alert(
        'AI Matchmaking Triggered',
        'We have analyzed student profiles and triggered background matches. Check back soon for connections!'
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to trigger matchmaking.');
    } finally {
      setMatching(false);
    }
  }, [accessToken]);

  const handleSubmitPitch = async () => {
    if (!vName.trim() || !vPitch.trim()) {
      Alert.alert('Validation Error', 'Venture Name and One-Sentence Pitch are required.');
      return;
    }

    if (!accessToken) {
      Alert.alert('Login Required', 'You must be logged in to submit a pitch.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the startup
      const payload = {
        name: vName.trim(),
        tagline: vPitch.trim(),
        description: vPitch.trim(),
        category: vCategory,
        looking_for: vLookingFor.split(',').map(s => s.trim()).filter(Boolean),
      };

      const newVenture = await createStartup(accessToken, payload);
      
      // 2. Submit the pitch deck
      if (newVenture?.id) {
        const deckUrl = `https://university.edu/decks/${encodeURIComponent(vName.trim().replace(/\s+/g, '_'))}_deck.pdf`;
        await submitPitch(accessToken, {
          venture_id: newVenture.id,
          deck_url: deckUrl
        });
      }

      Alert.alert('Success', 'Your venture has been registered and pitch deck submitted successfully!');
      
      // Reset form fields
      setVName('');
      setVPitch('');
      
      // Refresh list
      fetchAllStartups();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit pitch.');
    } finally {
      setSubmitting(false);
    }
  };

  const isFemaleAvatar = user?.gender === 'F' || user?.gender === 'Female';
  const avatarUrl = isFemaleAvatar
    ? 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500'
    : 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500';

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="school" size={26} color={colors.primary} />
          <Text style={[styles.headerLogo, { color: colors.primary }]}>{APP_CONFIG.UNIVERSITY_NAME}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.headerIconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => navigation.navigate('SuggestWithAI')}
          >
            <MaterialIcons name="auto-awesome" size={22} color={colors.primary} />
          </TouchableOpacity>

          <Image
            source={{ uri: avatarUrl }}
            style={[styles.avatarSmall, { borderColor: colors.primary }]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Venture Launchpad Hero */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJYwvpBtdoJt5aKLdQ72OYOygma4LnW_oNAVjJu2C_VvQZx-o-1JqrQht7GAy50UqE6UC4mGjQhFbFfZaJEmjgSWF6AaAdNbDn_9DSGxhASKaEhR5J6E_ce19eohauoRtH8UzVZmwqwd9U-ynvnfSDT6rKBAcQ1PLQrR4J4ApuUj0-Gvh4oOWUD58xaxKVznX_fIhfS5GwjQbAUVch42xxoKuwk405fU04rM_q4zuMMPVrYoXve-cBe7dniDZGiUjjuqvTapsWklN3' }}
            style={styles.heroImg}
          />
          <LinearGradient
            colors={isDark ? ['rgba(0,0,0,0.85)', 'rgba(139, 75, 0, 0.4)'] : ['rgba(139, 75, 0, 0.95)', 'rgba(122, 65, 0, 0.4)']}
            style={styles.heroOverlay}
          >
            <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.heroBadgeText}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} PULSE LAB</Text>
            </View>
            <Text style={styles.heroTitle}>Where Ideas {"\n"}<Text style={styles.heroTitleItalic}>Go Infinite.</Text></Text>
            <View style={styles.heroBtns}>
              <TouchableOpacity style={styles.pitchBtn}>
                <Text style={[styles.pitchBtnText, { color: colors.primary }]}>Pitch Your Idea</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.exploreBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={styles.exploreBtnText}>Explore Startups</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Co-founder Match Card */}
        <View style={[styles.matchCard, { backgroundColor: isDark ? '#1E1B4B' : '#4338CA', shadowColor: '#4338CA' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <MaterialIcons name="psychology-alt" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.cardHeaderTitle}>Find a Co-founder</Text>
          </View>
          <Text style={[styles.cardDesc, { color: '#E0E7FF' }]}>Our AI matches your vision with students across Engineering, Design, and MBA departments.</Text>
          <View style={styles.matchingFooter}>
            <View style={styles.miniAvatars}>
              <View style={[styles.mAvatar, { borderColor: isDark ? '#1E1B4B' : '#4338CA' }]} />
              <View style={[styles.mAvatar, { marginLeft: -8, borderColor: isDark ? '#1E1B4B' : '#4338CA' }]} />
              <View style={[styles.mAvatar, { marginLeft: -8, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderColor: isDark ? '#1E1B4B' : '#4338CA' }]}>
                <Text style={{ fontSize: 9, color: '#FFFFFF', fontWeight: '800' }}>+42</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.startMatchBtn}
              onPress={handleCoFounderMatch}
              disabled={matching}
            >
              {matching ? (
                <ActivityIndicator size="small" color={isDark ? '#E0E7FF' : '#4338CA'} />
              ) : (
                <Text style={[styles.startMatchBtnText, { color: isDark ? '#E0E7FF' : '#4338CA' }]}>Start Matching</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Startups */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Top Startups</Text>
            <MaterialIcons name="star" size={20} color={colors.primary} />
          </View>
          <TouchableOpacity onPress={fetchAllStartups}><Text style={[styles.viewAllText, { color: colors.primary }]}>Refresh</Text></TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.startupScroll} contentContainerStyle={styles.startupContainer}>
            {startups.map((startup) => {
              const iconInfo = getStartupIconInfo(startup.category, isDark);
              const milestone = startup.milestone_pct !== undefined ? startup.milestone_pct : 50;
              return (
                <View key={startup.id} style={[styles.startupCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                  <View style={[styles.startupIcon, { backgroundColor: iconInfo.bgColor }]}>
                    <MaterialIcons name={iconInfo.name} size={28} color={iconInfo.color} />
                  </View>
                  <View style={[styles.startupLabel, { backgroundColor: iconInfo.tagBg }]}>
                    <Text style={[styles.startupLabelText, { color: iconInfo.tagColor }]}>
                      {startup.stage || 'PRE-REVENUE'}
                    </Text>
                  </View>
                  <Text style={[styles.startupName, { color: colors.textPrimary }]}>{startup.name}</Text>
                  <Text style={[styles.startupDesc, { color: colors.textSecondary }]}>{startup.tagline || startup.description}</Text>

                  <View style={styles.progressRow}>
                    <View style={styles.progressHeader}>
                      <Text style={[styles.progressText, { color: colors.textSecondary }]}>Milestone</Text>
                      <Text style={[styles.progressPct, { color: colors.primary }]}>{milestone}%</Text>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}><View style={[styles.progressFill, { width: `${milestone}%`, backgroundColor: colors.primary }]} /></View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Pitch Form Card */}
        <View style={[styles.pitchCard, { backgroundColor: isDark ? colors.card : '#F3F4F6', borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.pitchTitle, { color: colors.textPrimary }]}>Pitch Your Idea</Text>
          <Text style={[styles.pitchSub, { color: colors.textSecondary }]}>Ready to disrupt the market? Submit your pitch deck.</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>VENTURE NAME</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? colors.background : '#FFFFFF', color: colors.textPrimary, borderColor: colors.border, borderWidth: 1 }]} 
              placeholder={`e.g. ${APP_CONFIG.UNIVERSITY_SHORT_NAME} AI`} 
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'} 
              value={vName}
              onChangeText={setVName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>ONE-SENTENCE PITCH</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? colors.background : '#FFFFFF', color: colors.textPrimary, borderColor: colors.border, borderWidth: 1, height: 80, textAlignVertical: 'top' }]} 
              placeholder="What problem are you solving?" 
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'} 
              multiline 
              value={vPitch}
              onChangeText={setVPitch}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>CATEGORY (e.g. Agriculture, Education, Pharma, Tech)</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? colors.background : '#FFFFFF', color: colors.textPrimary, borderColor: colors.border, borderWidth: 1 }]} 
              placeholder="e.g. Pharma" 
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'} 
              value={vCategory}
              onChangeText={setVCategory}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>LOOKING FOR (comma separated)</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? colors.background : '#FFFFFF', color: colors.textPrimary, borderColor: colors.border, borderWidth: 1 }]} 
              placeholder="e.g. Developer, Marketing, Co-founder" 
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'} 
              value={vLookingFor}
              onChangeText={setVLookingFor}
            />
          </View>

          <TouchableOpacity style={[styles.uploadArea, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
            <MaterialIcons name="upload-file" size={24} color={colors.textSecondary} />
            <Text style={[styles.uploadText, { color: colors.textSecondary }]}>UPLOAD PITCH DECK (PDF)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            onPress={handleSubmitPitch}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Pitch</Text>
            )}
          </TouchableOpacity>
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
    paddingVertical: 15,
    borderBottomWidth: 1,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    padding: 8,
    borderRadius: 20,
  },

  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
  },
  scroll: {
    paddingBottom: 20,
  },
  heroSection: {
    height: 380,
    position: 'relative',
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'center',
    padding: 24,
  },
  heroBadge: {
    alignSelf: 'baseline',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 52,
  },
  heroTitleItalic: {
    opacity: 0.7,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  heroBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  pitchBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pitchBtnText: {
    fontWeight: '800',
    fontSize: 14,
  },
  exploreBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  matchCard: {
    margin: 16,
    borderRadius: 24,
    padding: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  matchingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  miniAvatars: {
    flexDirection: 'row',
  },
  mAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#cbceff',
    borderWidth: 2,
  },
  startMatchBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startMatchBtnText: {
    fontWeight: '800',
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  startupScroll: {
    paddingLeft: 16,
  },
  startupContainer: {
    paddingRight: 24,
    gap: 16,
  },
  startupCard: {
    width: width * 0.7,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  startupIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  startupLabel: {
    alignSelf: 'baseline',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  startupLabelText: {
    fontSize: 9,
    fontWeight: '800',
  },
  startupName: {
    fontSize: 18,
    fontWeight: '800',
  },
  startupDesc: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  progressRow: {
    marginTop: 20,
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
  },
  progressPct: {
    fontSize: 10,
    fontWeight: '800',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  pitchCard: {
    margin: 16,
    borderRadius: 24,
    padding: 24,
  },
  pitchTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  pitchSub: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginVertical: 12,
  },
  uploadText: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 8,
  },
  submitBtn: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#8b4b00',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b4b00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 12,
  },
});

export default VentureScreen;
