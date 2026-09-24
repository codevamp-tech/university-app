import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, TextInput, Alert, ActivityIndicator, Modal, Switch
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { APP_CONFIG } from '../../config/appConfig';
import { useUser } from '../../context/UserContext';
import { getStartups, createStartup, submitPitch, triggerCofounderMatch, uploadDocumentAPI, updateStartup, deleteStartup, getErpIncubationProjects, getErpIncubationMeta } from '../../data/apiService';
import { getAvatarUrl } from '../../utils/avatar';
import { SafeStudentAvatar } from '../../components/SafeStudentAvatar';
import { ProfileDropdownModal } from '../../components/ProfileDropdownModal';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';

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

const hasValidDocument = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  if (trimmed.includes('university.edu/decks')) return false;
  return true;
};

const VentureScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { accessToken, user } = useUser();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const isMed = user && (
    user.course?.replace(/\./g, '').toLowerCase().includes('mbbs') ||
    user.course?.toLowerCase().includes('medicine') ||
    user.category?.toLowerCase().includes('medical')
  );

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

  // Submitted ideas in review across campus
  const [pendingStartups, setPendingStartups] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  // ERP Incubation Cell states
  const [erpProjects, setErpProjects] = useState([]);
  const [erpIncubationMeta, setErpIncubationMeta] = useState(null);

  const [proposalFile, setProposalFile] = useState(null);

  // Edit form states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingStartup, setEditingStartup] = useState(null);
  const [editVName, setEditVName] = useState('');
  const [editVPitch, setEditVPitch] = useState('');
  const [editVCategory, setEditVCategory] = useState('');
  const [editVLookingFor, setEditVLookingFor] = useState('');
  const [editProposalFile, setEditProposalFile] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

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

  const handlePickEditDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedFile = result.assets[0];
        setEditProposalFile({
          uri: pickedFile.uri,
          name: pickedFile.name,
          size: pickedFile.size,
        });
      }
    } catch (err) {
      console.warn('Error picking edit document:', err);
      Alert.alert('Error', 'Failed to select document.');
    }
  };

  const handleOpenEditModal = (startup) => {
    setEditingStartup(startup);
    setEditVName(startup.name);
    setEditVPitch(startup.tagline || startup.description || '');
    setEditVCategory(startup.category || '');
    setEditVLookingFor((startup.looking_for || []).join(', '));
    setEditProposalFile(hasValidDocument(startup.pitch_deck_url) ? { name: 'Current Pitch Deck / Proposal PDF', isExisting: true, uri: startup.pitch_deck_url } : null);
    setEditModalVisible(true);
  };

  const handleDeleteStartup = (id) => {
    Alert.alert(
      isMed ? 'Delete Proposal' : 'Delete Venture',
      isMed ? 'Are you sure you want to delete this clinical proposal?' : 'Are you sure you want to delete this venture pitch?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStartup(accessToken, id);
              Alert.alert('Success', isMed ? 'Proposal deleted successfully.' : 'Venture deleted successfully.');
              fetchAllStartups();
              fetchMyStartups();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete.');
            }
          }
        }
      ]
    );
  };

  const handleUpdateStartup = async () => {
    if (!editVName.trim() || !editVPitch.trim()) {
      Alert.alert('Validation Error', isMed ? 'Study / Proposal Name and Clinical Hypothesis are required.' : 'Venture Name and One-Sentence Pitch are required.');
      return;
    }

    setEditSubmitting(true);
    try {
      let deckUrl = editingStartup.pitch_deck_url;

      if (editProposalFile && !editProposalFile.isExisting) {
        const uploadRes = await uploadDocumentAPI(accessToken, editProposalFile.uri, editProposalFile.name);
        if (uploadRes.ok && uploadRes.json?.success) {
          deckUrl = uploadRes.json.data.document_url;
        } else {
          throw new Error(uploadRes.json?.message || "Failed to upload document to Cloudinary");
        }
      } else if (!editProposalFile) {
        deckUrl = null;
      }

      const payload = {
        name: editVName.trim(),
        tagline: editVPitch.trim(),
        description: editVPitch.trim(),
        category: editVCategory,
        looking_for: editVLookingFor.split(',').map(s => s.trim()).filter(Boolean),
        pitch_deck_url: deckUrl
      };

      await updateStartup(accessToken, editingStartup.id, payload);

      Alert.alert('Success', isMed ? 'Proposal updated successfully.' : 'Venture updated successfully.');
      setEditModalVisible(false);
      fetchAllStartups();
      fetchMyStartups();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update.');
    } finally {
      setEditSubmitting(false);
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
    setPendingLoading(true);
    try {
      const [allVenturesRes, incubationRes, metaRes, myVenturesRes] = await Promise.allSettled([
        getStartups(accessToken, 0, 100, false, 'all'),
        !isMed && accessToken ? getErpIncubationProjects(accessToken) : Promise.resolve([]),
        !isMed && accessToken ? getErpIncubationMeta(accessToken) : Promise.resolve(null),
        accessToken ? getStartups(accessToken, 0, 50, true) : Promise.resolve([]),
      ]);

      let allList = [];
      if (allVenturesRes.status === 'fulfilled' && Array.isArray(allVenturesRes.value)) {
        allList = allVenturesRes.value;
      }

      let myData = [];
      if (myVenturesRes.status === 'fulfilled' && Array.isArray(myVenturesRes.value)) {
        myData = myVenturesRes.value;
        setMyStartups(myData);
      }

      // Merge myData into allList if missing
      const mergedMap = new Map();
      allList.forEach(item => { if (item?.id) mergedMap.set(item.id, item); });
      myData.forEach(item => { if (item?.id && !mergedMap.has(item.id)) mergedMap.set(item.id, item); });
      const fullList = Array.from(mergedMap.values());

      const approvedList = fullList.filter(s => {
        const st = (s.status || s.approval_status || '').toLowerCase();
        return st === 'approved' || st === 'live' || st === 'active';
      });
      const pendingList = fullList.filter(s => {
        const st = (s.status || s.approval_status || 'pending').toLowerCase();
        return st === 'pending' || st === 'pending_review' || st === 'under_review' || st === 'in_review';
      });

      setStartups(approvedList);
      setPendingStartups(pendingList);

      if (incubationRes.status === 'fulfilled' && Array.isArray(incubationRes.value)) {
        setErpProjects(incubationRes.value);
      }
      if (metaRes.status === 'fulfilled' && metaRes.value) {
        setErpIncubationMeta(metaRes.value);
      }
    } catch (err) {
      console.warn('[VentureScreen] Failed to fetch startups from API, using fallback:', err.message);
      setStartups(FALLBACK_STARTUPS);
      setPendingStartups([]);
    } finally {
      setLoading(false);
      setPendingLoading(false);
    }
  }, [accessToken, isMed]);

  const fetchMyStartups = useCallback(async () => {
    if (!accessToken) return;
    setMyLoading(true);
    try {
      const data = await getStartups(accessToken, 0, 50, true);
      if (data) {
        setMyStartups(data);
        // Also update pending list if it contains new items
        setPendingStartups(prev => {
          const map = new Map();
          prev.forEach(p => map.set(p.id, p));
          data.forEach(d => {
            const st = (d.status || d.approval_status || 'pending').toLowerCase();
            if ((st === 'pending' || st === 'pending_review' || st === 'under_review' || st === 'in_review') && !map.has(d.id)) {
              map.set(d.id, d);
            }
          });
          return Array.from(map.values());
        });
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
      // 1. Upload the pitch deck / proposal if selected
      let deckUrl = null;
      if (proposalFile) {
        const uploadRes = await uploadDocumentAPI(accessToken, proposalFile.uri, proposalFile.name);
        const data = uploadRes.json?.data || {};
        deckUrl = data.document_url || data.file_url || data.url || null;
      }

      // 2. Create the startup with pitch_deck_url
      const payload = {
        name: vName.trim(),
        tagline: vPitch.trim(),
        description: vPitch.trim(),
        category: vCategory || (isMed ? 'HealthTech' : 'Tech'),
        looking_for: vLookingFor.split(',').map(s => s.trim()).filter(Boolean),
        pitch_deck_url: deckUrl,
      };

      const newVenture = await createStartup(accessToken, payload);

      if (!newVenture || !newVenture.id) {
        throw new Error(isMed ? "Proposal was registered but response was invalid." : "Venture was registered but response was invalid.");
      }

      // 3. Also submit pitch if deckUrl exists
      if (deckUrl) {
        try {
          await submitPitch(accessToken, {
            venture_id: newVenture.id,
            deck_url: deckUrl,
          });
        } catch (_) {}
      }

      Alert.alert(
        '🚀 Venture Published to Feed!',
        isMed
          ? 'Your clinical research proposal has been registered, submitted for review, and automatically shared on the Scholar Feed for peer collaboration!'
          : 'Your venture pitch has been submitted for incubation review and automatically published to the Scholar Feed with your Pitch Deck! 🚀'
      );

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

  const avatarUrl = getAvatarUrl(user?.avatar_url || user?.name, user?.rollno || user?.username);

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
          <Text style={[styles.headerLogo, { color: colors.textPrimary }]}>{isMed ? 'Innovation & Research' : `${APP_CONFIG.UNIVERSITY_SHORT_NAME} Ventures`}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowProfileMenu(true)} activeOpacity={0.85}>
            <SafeStudentAvatar
              uri={avatarUrl}
              rollno={user?.rollno || user?.username}
              name={user?.name || user?.full_name || 'S'}
              style={[styles.avatarSmall, { borderColor: colors.primary }]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Compact Venture Launchpad Hero */}
        <LinearGradient
          colors={isMed 
            ? (isDark ? ['#881337', '#4C0519'] : ['#E11D48', '#9F1239'])
            : (isDark ? ['#312E81', '#1E1B4B'] : ['#4F46E5', '#3730A3'])
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.compactHeroCard}
        >
          <View style={styles.compactHeroContent}>
            <View style={styles.compactHeroBadge}>
              <MaterialIcons name={isMed ? "biotech" : "rocket-launch"} size={12} color="#FDE047" />
              <Text style={styles.compactHeroBadgeText}>
                {isMed ? 'CLINICAL RESEARCH HUB' : 'VENTURE LAUNCHPAD'}
              </Text>
            </View>
            <Text style={styles.compactHeroTitle}>
              {isMed ? "Where Clinical Ideas Go Live." : "Where Ideas Go Infinite."}
            </Text>
            <Text style={styles.compactHeroSub}>
              {isMed ? "Submit clinical hypotheses & find medical collaborators" : "Pitch student startups & match with co-founders across campus"}
            </Text>

            <View style={styles.compactHeroActions}>
              <TouchableOpacity 
                style={styles.compactPitchBtn} 
                onPress={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                activeOpacity={0.85}
              >
                <MaterialIcons name="add-circle" size={16} color={isMed ? '#9F1239' : '#4338CA'} />
                <Text style={[styles.compactPitchBtnText, { color: isMed ? '#9F1239' : '#4338CA' }]}>
                  {isMed ? 'Submit Proposal' : 'Pitch Your Idea'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.compactExploreBtn} 
                onPress={() => scrollViewRef.current?.scrollTo({ y: 220, animated: true })}
                activeOpacity={0.85}
              >
                <MaterialIcons name="explore" size={15} color="#FFFFFF" />
                <Text style={styles.compactExploreBtnText}>
                  {isMed ? 'Explore' : 'Explore Startups'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Compact AI Co-founder Matching Strip */}
        <View style={[styles.compactMatchStrip, { backgroundColor: colors.card, borderColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.15)' }]}>
          <View style={styles.compactMatchLeft}>
            <LinearGradient
              colors={isMed ? ['#E11D48', '#BE123C'] : ['#6366F1', '#4F46E5']}
              style={styles.compactMatchIconBg}
            >
              <MaterialIcons name={isMed ? "psychology" : "groups"} size={18} color="#FFFFFF" />
            </LinearGradient>
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.compactMatchTitle, { color: colors.textPrimary }]}>
                {isMed ? 'Find Research Collaborators' : 'AI Co-founder Match'}
              </Text>
              <View style={styles.compactPeerRow}>
                <View style={styles.compactMiniAvatars}>
                  <View style={[styles.compactMAvatar, { backgroundColor: '#60A5FA', borderColor: colors.card }]} />
                  <View style={[styles.compactMAvatar, { marginLeft: -6, backgroundColor: '#34D399', borderColor: colors.card }]} />
                  <View style={[styles.compactMAvatar, { marginLeft: -6, backgroundColor: '#F472B6', borderColor: colors.card }]} />
                </View>
                <Text style={[styles.compactMatchSub, { color: colors.textSecondary }]}>
                  42+ campus peers active
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.compactMatchBtn, { backgroundColor: isMed ? '#E11D48' : '#4F46E5', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12 }]}
            onPress={() => {
              Alert.alert(
                '🔒 Demo Locked — Enterprise Feature',
                isMed
                  ? 'AI Research Matchmaking is demo locked in this release.\n\nCross-departmental clinical research team matching, skill complementarity analysis, and grant readiness algorithms are pre-configured for campus deployment.'
                  : 'AI Co-Founder Matching is demo locked in this release.\n\nCross-discipline peer founder matching, technical skill complementarity, and incubation synergy algorithms are pre-configured for campus deployment.'
              );
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="lock-closed" size={12} color="#FFFFFF" />
            <Text style={styles.compactMatchBtnText}>
              {isMed ? 'Connect' : 'Match'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Official Incubation Cell Projects (ERP live data) */}
        {!isMed && erpProjects.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Incubation Cell Projects</Text>
                <MaterialIcons name="verified" size={18} color="#10B981" />
              </View>
              {erpIncubationMeta?.total_funded_amount && (
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981' }}>
                  ₹{erpIncubationMeta.total_funded_amount} Grants
                </Text>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.startupScroll} contentContainerStyle={styles.startupContainer}>
              {erpProjects.map((proj, pIdx) => (
                <View
                  key={proj.id || pIdx}
                  style={[
                    styles.startupCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: proj.status === 'incubated' ? '#10B981' : colors.border,
                      borderWidth: 1.5,
                      width: 260,
                    }
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={[styles.startupLabel, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }]}>
                      <Text style={[styles.startupLabelText, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
                        {(proj.stage || proj.status || 'INCUBATED').toUpperCase()}
                      </Text>
                    </View>
                    {proj.batch_cohort && (
                      <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '700' }}>
                        Cohort {proj.batch_cohort}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.startupName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {proj.title || proj.name || 'Incubation Project'}
                  </Text>
                  <Text style={[styles.startupDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                    {proj.description || proj.pitch || 'University Incubated Venture'}
                  </Text>
                  <View style={{ marginTop: 'auto', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                      {proj.domain || proj.category || 'Tech'}
                    </Text>
                    {proj.grant_received && (
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#10B981' }}>
                        Grant: ₹{proj.grant_received}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Top Startups */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {isMed ? 'Top Clinical Proposals' : 'Top Startups'}
            </Text>
            <MaterialIcons name="star" size={18} color={colors.primary} />
          </View>
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)' }]}
            onPress={fetchAllStartups}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="refresh" size={12} color={colors.primary} />
            <Text style={[styles.refreshBtnText, { color: colors.primary }]}>Refresh</Text>
          </TouchableOpacity>
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

                  {hasValidDocument(startup.pitch_deck_url) ? (
                    <TouchableOpacity
                      style={[
                        styles.startupDeckBtn,
                        {
                          borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
                          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                        }
                      ]}
                      onPress={async () => {
                        try {
                          const cleanUrl = startup.pitch_deck_url.replace(/\.pdf\.pdf$/i, '.pdf');
                          await WebBrowser.openBrowserAsync(cleanUrl);
                        } catch {
                          Alert.alert('Cannot open', 'Unable to open pitch deck document.');
                        }
                      }}
                    >
                      <MaterialCommunityIcons name="file-pdf-box" size={16} color="#E53E3E" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#FCA5A5' : '#B91C1C', flex: 1 }} numberOfLines={1}>
                        {isMed ? 'View Proposal (PDF)' : 'View Pitch Deck (PDF)'}
                      </Text>
                      <MaterialIcons name="open-in-new" size={12} color={isDark ? '#FCA5A5' : '#B91C1C'} />
                    </TouchableOpacity>
                  ) : null}

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

        {/* Submitted Ideas Under Review (Campus Pitch Pipeline) */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {isMed ? 'Proposals In Review' : 'Submitted Ideas'}
            </Text>
            <View style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#D97706' }}>
                {pendingStartups.length} IN REVIEW
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)' }]}
            onPress={fetchAllStartups}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="refresh" size={12} color={colors.primary} />
            <Text style={[styles.refreshBtnText, { color: colors.primary }]}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {pendingLoading ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#D97706" />
          </View>
        ) : pendingStartups.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, marginBottom: 20 }]}>
            <MaterialCommunityIcons name="clipboard-text-clock-outline" size={36} color={colors.textMuted} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>
              {isMed ? 'No clinical proposals currently pending review.' : 'All submitted venture ideas have been reviewed! Submit a new pitch below.'}
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.startupScroll} contentContainerStyle={styles.startupContainer}>
            {pendingStartups.map((startup) => {
              const iconInfo = getStartupIconInfo(startup.category, isDark);
              return (
                <View
                  key={startup.id}
                  style={[
                    styles.startupCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#FDE68A',
                      borderWidth: 1.5,
                      width: 270,
                    }
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={[styles.startupLabel, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }]}>
                      <Text style={[styles.startupLabelText, { color: '#B45309' }]}>
                        ⏳ UNDER REVIEW
                      </Text>
                    </View>
                    <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>
                      {new Date(startup.created_at).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <View style={[styles.startupIcon, { width: 34, height: 34, borderRadius: 8, backgroundColor: iconInfo.bgColor, marginBottom: 0 }]}>
                      <MaterialIcons name={iconInfo.name} size={20} color={iconInfo.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.startupName, { color: colors.textPrimary, marginBottom: 0 }]} numberOfLines={1}>
                        {startup.name}
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.textMuted }}>
                        by {startup.founder_name || 'Student Founder'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.startupDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                    {startup.tagline || startup.description}
                  </Text>

                  {hasValidDocument(startup.pitch_deck_url) ? (
                    <TouchableOpacity
                      style={[
                        styles.startupDeckBtn,
                        {
                          borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
                          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                          marginTop: 8,
                        }
                      ]}
                      onPress={async () => {
                        try {
                          const cleanUrl = startup.pitch_deck_url.replace(/\.pdf\.pdf$/i, '.pdf');
                          await WebBrowser.openBrowserAsync(cleanUrl);
                        } catch {
                          Alert.alert('Cannot open', 'Unable to open pitch deck document.');
                        }
                      }}
                    >
                      <MaterialCommunityIcons name="file-pdf-box" size={16} color="#E53E3E" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#FCA5A5' : '#B91C1C', flex: 1 }} numberOfLines={1}>
                        {isMed ? 'View Proposal (PDF)' : 'View Pitch Deck (PDF)'}
                      </Text>
                      <MaterialIcons name="open-in-new" size={12} color={isDark ? '#FCA5A5' : '#B91C1C'} />
                    </TouchableOpacity>
                  ) : null}

                  <View style={{ marginTop: 'auto', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                      {startup.category || 'Tech'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <MaterialCommunityIcons name="clock-outline" size={12} color="#D97706" />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#D97706' }}>
                        Incubation Review
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* My Posted Ideas */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {isMed ? 'My Clinical Proposals' : 'My Posted Ideas'}
            </Text>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={colors.primary} />
            {myStartups.length > 0 && (
              <View style={{ backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: colors.primary }}>
                  {myStartups.length}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)' }]}
            onPress={fetchMyStartups}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="refresh" size={12} color={colors.primary} />
            <Text style={[styles.refreshBtnText, { color: colors.primary }]}>Refresh</Text>
          </TouchableOpacity>
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
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <View style={[styles.myStatusBadge, { backgroundColor: iconInfo.tagBg }]}>
                        <Text style={[styles.myStatusBadgeText, { color: iconInfo.tagColor }]}>
                          {getStageLabel(startup.stage)}
                        </Text>
                      </View>
                      {(() => {
                        const st = (startup.status || startup.approval_status || 'pending').toLowerCase();
                        if (st === 'approved' || st === 'live' || st === 'active') {
                          return (
                            <View style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ fontSize: 9, fontWeight: '800', color: '#15803D' }}>✓ APPROVED</Text>
                            </View>
                          );
                        }
                        if (st === 'rejected') {
                          return (
                            <View style={{ backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ fontSize: 9, fontWeight: '800', color: '#DC2626' }}>✕ REJECTED</Text>
                            </View>
                          );
                        }
                        return (
                          <View style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: '#B45309' }}>⏳ UNDER REVIEW</Text>
                          </View>
                        );
                      })()}
                    </View>
                  </View>
                  <Text style={[styles.myStartupDescText, { color: colors.textSecondary }]}>
                    {startup.tagline || startup.description}
                  </Text>

                  {hasValidDocument(startup.pitch_deck_url) ? (
                    <TouchableOpacity
                      style={[
                        styles.pitchDeckPill,
                        {
                          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                          borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#FCA5A5',
                        }
                      ]}
                      onPress={async () => {
                        try {
                          const cleanUrl = startup.pitch_deck_url.replace(/\.pdf\.pdf$/i, '.pdf');
                          await WebBrowser.openBrowserAsync(cleanUrl);
                        } catch {
                          Alert.alert('Cannot open', 'Unable to open document.');
                        }
                      }}
                    >
                      <MaterialCommunityIcons name="file-pdf-box" size={24} color="#E53E3E" />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={[styles.pitchDeckTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                          {isMed ? 'Clinical Proposal Document' : 'Pitch Deck Document'}
                        </Text>
                        <Text style={{ fontSize: 11, color: isDark ? '#FCA5A5' : '#DC2626', fontWeight: '600', marginTop: 1 }}>
                          PDF attached · Tap to view
                        </Text>
                      </View>
                      <MaterialIcons name="open-in-new" size={18} color={isDark ? '#FCA5A5' : '#DC2626'} />
                    </TouchableOpacity>
                  ) : null}

                  <View style={styles.myProgressSection}>
                    <View style={styles.myProgressHeader}>
                      <Text style={[styles.myProgressLabel, { color: colors.textMuted }]}>Milestone Progress</Text>
                      <Text style={[styles.myProgressVal, { color: colors.primary }]}>{milestone}%</Text>
                    </View>
                    <View style={[styles.myProgressBarBg, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
                      <View style={[styles.myProgressBarFill, { width: `${milestone}%`, backgroundColor: colors.primary }]} />
                    </View>
                  </View>

                  <View style={styles.myStartupActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: colors.primary }]}
                      onPress={() => handleOpenEditModal(startup)}
                    >
                      <MaterialIcons name="edit" size={14} color={colors.primary} />
                      <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: '#EF4444' }]}
                      onPress={() => handleDeleteStartup(startup.id)}
                    >
                      <MaterialIcons name="delete-outline" size={14} color="#EF4444" />
                      <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
                    </TouchableOpacity>
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

      {/* Edit Proposal Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {isMed ? 'Edit Clinical Proposal' : 'Edit Venture Pitch'}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {isMed ? 'STUDY / PROPOSAL NAME' : 'VENTURE NAME'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? colors.background : '#F3F4F6', color: colors.textPrimary, borderColor: colors.border, borderWidth: 1 }]}
                  placeholder={isMed ? 'e.g. NutriClinic AI Study' : 'e.g. Acme Tech'}
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                  value={editVName}
                  onChangeText={setEditVName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {isMed ? 'CLINICAL HYPOTHESIS & OBJECTIVE' : 'ONE-SENTENCE PITCH'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? colors.background : '#F3F4F6', color: colors.textPrimary, borderColor: colors.border, borderWidth: 1, height: 100, textAlignVertical: 'top' }]}
                  placeholder={isMed ? 'What clinical problem or research question are you addressing?' : 'What problem are you solving?'}
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                  multiline
                  value={editVPitch}
                  onChangeText={setEditVPitch}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {isMed ? 'SPECIALTY & FIELD (e.g. Cardiology, Pediatrics, Pharma)' : 'CATEGORY (e.g. Agriculture, Education, Pharma, Tech)'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? colors.background : '#F3F4F6', color: colors.textPrimary, borderColor: colors.border, borderWidth: 1 }]}
                  placeholder={isMed ? 'e.g. Cardiology' : 'e.g. Pharma'}
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                  value={editVCategory}
                  onChangeText={setEditVCategory}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {isMed ? 'COLLABORATORS NEEDED (comma separated)' : 'LOOKING FOR (comma separated)'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? colors.background : '#F3F4F6', color: colors.textPrimary, borderColor: colors.border, borderWidth: 1 }]}
                  placeholder={isMed ? 'e.g. Statistician, Lab Tech, Clinical Lead' : 'e.g. Developer, Marketing, Co-founder'}
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                  value={editVLookingFor}
                  onChangeText={setEditVLookingFor}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.uploadArea,
                  {
                    borderColor: editProposalFile ? colors.primary : colors.border,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
                  }
                ]}
                onPress={handlePickEditDocument}
              >
                <MaterialIcons name={editProposalFile ? "check-circle" : "upload-file"} size={24} color={editProposalFile ? colors.primary : colors.textSecondary} />
                <Text style={[styles.uploadText, { color: editProposalFile ? colors.primary : colors.textSecondary }]}>
                  {editProposalFile
                    ? `${editProposalFile.name}`
                    : (isMed ? 'UPLOAD NEW RESEARCH PROPOSAL / HYPOTHESIS (PDF)' : 'UPLOAD NEW PITCH DECK (PDF)')}
                </Text>
                {editProposalFile && (
                  <TouchableOpacity
                    style={{ marginTop: 8 }}
                    onPress={(e) => {
                      e.stopPropagation();
                      setEditProposalFile(null);
                    }}
                  >
                    <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 11 }}>REMOVE FILE</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: colors.border, borderWidth: 1 }]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={[styles.modalCancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
                  onPress={handleUpdateStartup}
                  disabled={editSubmitting}
                >
                  {editSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSaveBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Profile Dropdown Modal */}
      <ProfileDropdownModal
        visible={showProfileMenu}
        onClose={() => setShowProfileMenu(false)}
        navigation={navigation}
      />
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
  compactHeroCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  compactHeroContent: {
    gap: 6,
  },
  compactHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  compactHeroBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  compactHeroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  compactHeroSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 16,
  },
  compactHeroActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  compactPitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  compactPitchBtnText: {
    fontWeight: '800',
    fontSize: 13,
  },
  compactExploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  compactExploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  compactMatchStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  compactMatchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactMatchIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactMatchTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  compactPeerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  compactMiniAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactMAvatar: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  compactMatchSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  compactMatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  compactMatchBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
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
    alignItems: 'center',
  },
  mAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: '#60A5FA',
  },
  startMatchBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  startMatchBtnText: {
    fontWeight: '800',
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
  myStartupActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '90%',
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '950',
  },
  modalScroll: {
    paddingBottom: 24,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontWeight: '800',
    fontSize: 15,
  },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  // Pitch deck document styles in cards
  pitchDeckPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    marginBottom: 4,
  },
  pitchDeckTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  startupDeckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 4,
  },
});

export default VentureScreen;
