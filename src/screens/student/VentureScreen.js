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
import { getStartups, createStartup, submitPitch, triggerCofounderMatch, uploadDocumentAPI } from '../../data/apiService';
import { getAvatarUrl } from '../../utils/avatar';
import * as DocumentPicker from 'expo-document-picker';

const { width } = Dimensions.get('window');

const FALLBACK_STARTUPS = [];

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
  const isMed = user && (user.course?.toLowerCase().includes('mbbs') || user.course?.toLowerCase().includes('medicine') || user.category?.toLowerCase().includes('medical'));

  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const scrollViewRef = React.useRef(null);

  // Form states
  const [vName, setVName] = useState('');
  const [vPitch, setVPitch] = useState('');
  const [vCategory, setVCategory] = useState('');
  const [vLookingFor, setVLookingFor] = useState(isMed ? 'Statistician, Clinical Lead' : 'Developer, Marketing');

  // Student's own posted startups states
  const [myStartups, setMyStartups] = useState([]);
  const [myLoading, setMyLoading] = useState(false);

  const [proposalFile, setProposalFile] = useState(null);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedFile = result.assets[0];
        setProposalFile({
          uri: pickedFile.uri,
          name: pickedFile.name,
          size: pickedFile.size,
        });
      }
    } catch (err) {
      console.warn('Error picking document:', err);
      Alert.alert('Error', 'Failed to select document.');
    }
  };

  const getStageLabel = (stage) => {
    if (isMed) {
      const s = (stage || 'IDEA').toLowerCase();
      if (s.includes('revenue') || s.includes('trial') || s.includes('clinical')) return 'Clinical Trial';
      if (s.includes('idea') || s.includes('hypothesis') || s.includes('concept')) return 'Hypothesis';
      if (s.includes('mvp') || s.includes('prototype')) return 'Prototype / Study';
      if (s.includes('scale') || s.includes('practice')) return 'Clinical Practice';
      return 'Hypothesis';
    }
    return (stage || 'PRE-REVENUE').replace(/[-_]/g, ' ').toUpperCase();
  };

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

  const fetchMyStartups = useCallback(async () => {
    if (!accessToken) return;
    setMyLoading(true);
    try {
      const data = await getStartups(accessToken, 0, 50, true);
      if (data) {
        setMyStartups(data);
      }
    } catch (err) {
      console.warn('[VentureScreen] Failed to fetch my startups:', err.message);
    } finally {
      setMyLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchAllStartups();
    fetchMyStartups();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAllStartups();
      fetchMyStartups();
    });
    return unsubscribe;
  }, [navigation, fetchAllStartups, fetchMyStartups]);

  const handleCoFounderMatch = useCallback(async () => {
    if (!accessToken) {
      Alert.alert('Login Required', isMed ? 'You must be logged in to match with research collaborators.' : 'You must be logged in to match with co-founders.');
      return;
    }
    setMatching(true);
    try {
      await triggerCofounderMatch(accessToken);
      Alert.alert(
        isMed ? 'AI Research Matchmaking' : 'AI Matchmaking Triggered',
        isMed 
          ? 'We have analyzed profiles and triggered background collaboration matches. Check back soon for connections!'
          : 'We have analyzed student profiles and triggered background matches. Check back soon for connections!'
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to trigger matchmaking.');
    } finally {
      setMatching(false);
    }
  }, [accessToken, isMed]);

  const handleSubmitPitch = async () => {
    if (!vName.trim() || !vPitch.trim()) {
      Alert.alert('Validation Error', isMed ? 'Study / Proposal Name and Clinical Hypothesis are required.' : 'Venture Name and One-Sentence Pitch are required.');
      return;
    }

    if (!accessToken) {
      Alert.alert('Login Required', isMed ? 'You must be logged in to submit a proposal.' : 'You must be logged in to submit a pitch.');
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
      
      // 2. Upload and submit the pitch deck
      if (newVenture && newVenture.id) {
        let deckUrl = `https://university.edu/decks/${encodeURIComponent(vName.trim().replace(/\s+/g, '_'))}_deck.pdf`;
        if (proposalFile) {
          const uploadRes = await uploadDocumentAPI(accessToken, proposalFile.uri, proposalFile.name);
          if (uploadRes.ok && uploadRes.json?.success) {
            deckUrl = uploadRes.json.data.document_url;
          } else {
            throw new Error(uploadRes.json?.message || "Failed to upload document to Cloudinary");
          }
        }
        await submitPitch(accessToken, {
          venture_id: newVenture.id,
          deck_url: deckUrl
        });
      } else {
        throw new Error(isMed ? "Proposal was registered but response was invalid." : "Venture was registered but response was invalid.");
      }

      Alert.alert('Success', isMed ? 'Your research proposal has been registered and clinical outline submitted successfully!' : 'Your venture has been registered and pitch deck submitted successfully!');
      
      // Reset form fields
      setVName('');
      setVPitch('');
      setProposalFile(null);
      
      // Refresh list
      fetchAllStartups();
      fetchMyStartups();
    } catch (err) {
      Alert.alert('Error', err.message || (isMed ? 'Failed to submit proposal.' : 'Failed to submit pitch.'));
    } finally {
      setSubmitting(false);
    }
  };

  const avatarUrl = user?.avatar_url || getAvatarUrl(user?.name);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={isMed ? (isDark ? ['#9F1239', '#4C0519'] : ['#E11D48', '#9F1239']) : (isDark ? ['#9A3412', '#7C2D12'] : ['#EA580C', '#9A3412'])}
            style={styles.logoIconBg}
          >
            <MaterialIcons name={isMed ? "biotech" : "lightbulb"} size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.headerLogo, { color: colors.textPrimary }]}>{isMed ? 'Clinical Innovation & Research' : `${APP_CONFIG.UNIVERSITY_SHORT_NAME} Ventures`}</Text>
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

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Venture Launchpad Hero */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJYwvpBtdoJt5aKLdQ72OYOygma4LnW_oNAVjJu2C_VvQZx-o-1JqrQht7GAy50UqE6UC4mGjQhFbFfZaJEmjgSWF6AaAdNbDn_9DSGxhASKaEhR5J6E_ce19eohauoRtH8UzVZmwqwd9U-ynvnfSDT6rKBAcQ1PLQrR4J4ApuUj0-Gvh4oOWUD58xaxKVznX_fIhfS5GwjQbAUVch42xxoKuwk405fU04rM_q4zuMMPVrYoXve-cBe7dniDZGiUjjuqvTapsWklN3' }}
            style={styles.heroImg}
          />
          <LinearGradient
            colors={isMed ? (isDark ? ['rgba(0,0,0,0.85)', 'rgba(159, 18, 57, 0.4)'] : ['rgba(159, 18, 57, 0.95)', 'rgba(136, 19, 55, 0.4)']) : (isDark ? ['rgba(0,0,0,0.85)', 'rgba(139, 75, 0, 0.4)'] : ['rgba(139, 75, 0, 0.95)', 'rgba(122, 65, 0, 0.4)'])}
            style={styles.heroOverlay}
          >
            <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.heroBadgeText}>{isMed ? 'CLINICAL PULSE LAB' : `${APP_CONFIG.UNIVERSITY_SHORT_NAME} PULSE LAB`}</Text>
            </View>
            <Text style={styles.heroTitle}>{isMed ? "Where Research \n" : "Where Ideas \n"}<Text style={styles.heroTitleItalic}>{isMed ? "Go Clinical." : "Go Infinite."}</Text></Text>
            <View style={styles.heroBtns}>
              <TouchableOpacity style={styles.pitchBtn} onPress={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
                <Text style={[styles.pitchBtnText, { color: colors.primary }]}>{isMed ? 'Submit Proposal' : 'Pitch Your Idea'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.exploreBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }]} onPress={() => scrollViewRef.current?.scrollTo({ y: 550, animated: true })}>
                <Text style={styles.exploreBtnText}>{isMed ? 'Explore Proposals' : 'Explore Startups'}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Co-founder Match Card */}
        <View style={[styles.matchCard, { backgroundColor: isMed ? (isDark ? '#4C0519' : '#BE123C') : (isDark ? '#1E1B4B' : '#4338CA'), shadowColor: isMed ? '#BE123C' : '#4338CA' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <MaterialIcons name={isMed ? "biotech" : "psychology-alt"} size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.cardHeaderTitle}>{isMed ? 'Find a Collaborator' : 'Find a Co-founder'}</Text>
          </View>
          <Text style={[styles.cardDesc, { color: '#E0E7FF' }]}>{isMed ? 'Our AI matches your clinical hypothesis with peers across Medicine, Pharmacology, and Bio-Engineering.' : 'Our AI matches your vision with students across Engineering, Design, and MBA departments.'}</Text>
          <View style={styles.matchingFooter}>
            <View style={styles.miniAvatars}>
              <View style={[styles.mAvatar, { borderColor: isMed ? (isDark ? '#4C0519' : '#BE123C') : (isDark ? '#1E1B4B' : '#4338CA') }]} />
              <View style={[styles.mAvatar, { marginLeft: -8, borderColor: isMed ? (isDark ? '#4C0519' : '#BE123C') : (isDark ? '#1E1B4B' : '#4338CA') }]} />
              <View style={[styles.mAvatar, { marginLeft: -8, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderColor: isMed ? (isDark ? '#4C0519' : '#BE123C') : (isDark ? '#1E1B4B' : '#4338CA') }]}>
                <Text style={{ fontSize: 9, color: '#FFFFFF', fontWeight: '800' }}>+42</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[
                styles.startMatchBtn,
                isMed && {
                  opacity: 0.85,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }
              ]}
              onPress={() => {
                if (isMed) {
                  Alert.alert('Premium Feature', 'This feature is locked in the free trial.');
                } else {
                  handleCoFounderMatch();
                }
              }}
              disabled={!isMed && matching}
            >
              {matching ? (
                <ActivityIndicator size="small" color={isDark ? '#E0E7FF' : (isMed ? '#BE123C' : '#4338CA')} />
              ) : (
                <>
                  {isMed && <MaterialIcons name="lock" size={14} color={isDark ? '#E0E7FF' : '#BE123C'} />}
                  <Text style={[styles.startMatchBtnText, { color: isDark ? '#E0E7FF' : (isMed ? '#BE123C' : '#4338CA') }]}>
                    {isMed ? 'Start Collaborating' : 'Start Matching'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Startups */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{isMed ? 'Top Clinical Proposals' : 'Top Startups'}</Text>
            <MaterialIcons name="star" size={20} color={colors.primary} />
          </View>
          <TouchableOpacity onPress={fetchAllStartups}><Text style={[styles.viewAllText, { color: colors.primary }]}>Refresh</Text></TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : startups.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <MaterialIcons name="lightbulb-outline" size={40} color={colors.textSecondary} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>
              {isMed ? 'No clinical proposals active. There are currently no research proposals registered.' : 'No startups active. There are currently no startups registered on the launchpad.'}
            </Text>
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
                      {getStageLabel(startup.stage)}
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

        {/* My Posted Ideas */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{isMed ? 'My Clinical Proposals' : 'My Posted Ideas'}</Text>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={22} color={colors.primary} />
          </View>
        </View>

        {myLoading ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : myStartups.length === 0 ? (
          <View style={[styles.myEmptyCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <MaterialCommunityIcons name="lightbulb-outline" size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>
              {isMed ? "You haven't posted any research proposals yet." : "You haven't posted any venture ideas yet."}
            </Text>
          </View>
        ) : (
          <View style={styles.myStartupsList}>
            {myStartups.map((startup) => {
              const iconInfo = getStartupIconInfo(startup.category, isDark);
              const milestone = startup.milestone_pct !== undefined ? startup.milestone_pct : 0;
              return (
                <View key={startup.id} style={[styles.myStartupItemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.myStartupHeader}>
                    <View style={[styles.myStartupIconCircle, { backgroundColor: iconInfo.bgColor }]}>
                      <MaterialIcons name={iconInfo.name} size={20} color={iconInfo.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.myStartupNameText, { color: colors.textPrimary }]}>{startup.name}</Text>
                      <Text style={[styles.myStartupCategoryText, { color: colors.textMuted }]}>
                        {(startup.category || '').toUpperCase()} • {getStageLabel(startup.stage)}
                      </Text>
                    </View>
                    <View style={[styles.myStatusBadge, { backgroundColor: iconInfo.tagBg }]}>
                      <Text style={[styles.myStatusBadgeText, { color: iconInfo.tagColor }]}>
                        {getStageLabel(startup.stage)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.myStartupDescText, { color: colors.textSecondary }]}>
                    {startup.tagline || startup.description}
                  </Text>
                  
                  <View style={styles.myProgressSection}>
                    <View style={styles.myProgressHeader}>
                      <Text style={[styles.myProgressLabel, { color: colors.textMuted }]}>Milestone Progress</Text>
                      <Text style={[styles.myProgressVal, { color: colors.primary }]}>{milestone}%</Text>
                    </View>
                    <View style={[styles.myProgressBarBg, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
                      <View style={[styles.myProgressBarFill, { width: `${milestone}%`, backgroundColor: colors.primary }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Pitch Form Card */}
        <View style={[styles.pitchCard, { backgroundColor: isDark ? colors.card : '#F3F4F6', borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.pitchTitle, { color: colors.textPrimary }]}>{isMed ? 'Submit Clinical Research Proposal' : 'Pitch Your Idea'}</Text>
          <Text style={[styles.pitchSub, { color: colors.textSecondary }]}>{isMed ? 'Ready to share your clinical hypothesis? Submit your research proposal outline.' : 'Ready to disrupt the market? Submit your pitch deck.'}</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{isMed ? 'STUDY / PROPOSAL NAME' : 'VENTURE NAME'}</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? colors.background : '#FFFFFF', color: colors.textPrimary, borderColor: colors.border, borderWidth: 1 }]} 
              placeholder={isMed ? 'e.g. NutriClinic AI Study' : `e.g. ${APP_CONFIG.UNIVERSITY_SHORT_NAME} AI`} 
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'} 
              value={vName}
              onChangeText={setVName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{isMed ? 'CLINICAL HYPOTHESIS & OBJECTIVE' : 'ONE-SENTENCE PITCH'}</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? colors.background : '#FFFFFF', color: colors.textPrimary, borderColor: colors.border, borderWidth: 1, height: 80, textAlignVertical: 'top' }]} 
              placeholder={isMed ? 'What clinical problem or research question are you addressing?' : 'What problem are you solving?'} 
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'} 
              multiline 
              value={vPitch}
              onChangeText={setVPitch}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{isMed ? 'SPECIALTY & FIELD (e.g. Cardiology, Pediatrics, Pharma)' : 'CATEGORY (e.g. Agriculture, Education, Pharma, Tech)'}</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? colors.background : '#FFFFFF', color: colors.textPrimary, borderColor: colors.border, borderWidth: 1 }]} 
              placeholder={isMed ? 'e.g. Cardiology' : 'e.g. Pharma'} 
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'} 
              value={vCategory}
              onChangeText={setVCategory}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{isMed ? 'COLLABORATORS NEEDED (comma separated)' : 'LOOKING FOR (comma separated)'}</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? colors.background : '#FFFFFF', color: colors.textPrimary, borderColor: colors.border, borderWidth: 1 }]} 
              placeholder={isMed ? 'e.g. Statistician, Lab Tech, Clinical Lead' : 'e.g. Developer, Marketing, Co-founder'} 
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'} 
              value={vLookingFor}
              onChangeText={setVLookingFor}
            />
          </View>

          <TouchableOpacity 
            style={[
              styles.uploadArea, 
              { 
                borderColor: proposalFile ? colors.primary : colors.border, 
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' 
              }
            ]}
            onPress={handlePickDocument}
          >
            <MaterialIcons name={proposalFile ? "check-circle" : "upload-file"} size={24} color={proposalFile ? colors.primary : colors.textSecondary} />
            <Text style={[styles.uploadText, { color: proposalFile ? colors.primary : colors.textSecondary }]}>
              {proposalFile 
                ? `${proposalFile.name} (${(proposalFile.size / (1024 * 1024)).toFixed(2)} MB)`
                : (isMed ? 'UPLOAD RESEARCH PROPOSAL / HYPOTHESIS (PDF)' : 'UPLOAD PITCH DECK (PDF)')}
            </Text>
            {proposalFile && (
              <TouchableOpacity 
                style={{ marginTop: 8 }} 
                onPress={(e) => {
                  e.stopPropagation();
                  setProposalFile(null);
                }}
              >
                <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 11 }}>REMOVE FILE</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            onPress={handleSubmitPitch}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>{isMed ? 'Submit Research Proposal' : 'Submit Pitch'}</Text>
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
  emptyCard: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyCardText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  myEmptyCard: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  myStartupsList: {
    gap: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  myStartupItemCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  myStartupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  myStartupIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myStartupNameText: {
    fontSize: 16,
    fontWeight: '800',
  },
  myStartupCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  myStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  myStatusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  myStartupDescText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  myProgressSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
    paddingTop: 12,
  },
  myProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  myProgressLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  myProgressVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  myProgressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  myProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default VentureScreen;
