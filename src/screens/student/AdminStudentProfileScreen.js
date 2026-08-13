import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, TextInput,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { uploadAvatarAPI, updateMyProfile, connectionStatsAPI, getStartups, getPublicProfile, getMoodEntriesAPI, logMoodAPI, getConnectionList, removeConnectionAPI } from '../../data/apiService';
import { getAvatarUrl } from '../../utils/avatar';
import { ActivityIndicator, Alert, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../../hooks/useTheme';
import { APP_CONFIG } from '../../config/appConfig';
import { useUser } from '../../context/UserContext';
import { getCategoryLabel } from '../../data/aiEngine';
import { getDisplayCourse, isMedicalStudent } from '../../utils/courseDisplay';


const { width } = Dimensions.get('window');

const AdminStudentProfileScreen = ({ navigation, route }) => {
  const passedStudent = route?.params?.student;
  const isOwnProfile = !passedStudent;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user: contextUser, accessToken, updateAvatarUrl } = useUser();
  const [publicProfile, setPublicProfile] = React.useState(null);
  const user = isOwnProfile ? contextUser : { ...(passedStudent || {}), ...(publicProfile || {}) };
  const [isUploading, setIsUploading] = React.useState(false);

  const isMed = user ? isMedicalStudent(user) : false;

  const defaultBio = isMed
    ? `Dedicated medical student in MBBS, passionate about clinical practice, community health, and patient care. Leading rotation reports at primary clinics and practicing diagnostic reasoning.`
    : `Passionate student deeply interested in technology, learning, and projects. Active member of campus groups, always looking to build and collaborate with like-minded peers!`;
  const [userBio, setUserBio] = React.useState(user?.bio || defaultBio);
  const [stats, setStats] = React.useState({ followers: 0, following: 0, connections: 0 });
  const [myStartups, setMyStartups] = React.useState([]);
  const [loadingData, setLoadingData] = React.useState(true);

  const [activeMood, setActiveMood] = React.useState(2);

  const [showConnectionsModal, setShowConnectionsModal] = React.useState(false);
  const [connectionsModalType, setConnectionsModalType] = React.useState('connections');
  const [connectionsList, setConnectionsList] = React.useState([]);
  const [loadingConnections, setLoadingConnections] = React.useState(false);

  const handleOpenConnectionsModal = async (type = 'connections') => {
    setConnectionsModalType(type);
    setShowConnectionsModal(true);
    setLoadingConnections(true);
    try {
      const data = await getConnectionList(accessToken);
      const list = Array.isArray(data) ? data : (data?.connections || []);
      setConnectionsList(list);
    } catch (e) {
      console.warn("Error loading connection list:", e);
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleRemoveConnection = async (targetId) => {
    try {
      await removeConnectionAPI(accessToken, targetId);
      setConnectionsList(prev => prev.filter(c => (c.id || c.user_id) !== targetId));
      setStats(prev => ({ ...prev, connections: Math.max(0, prev.connections - 1) }));
    } catch (e) {
      console.warn("Error removing connection:", e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;

      const loadData = async () => {
        if (!accessToken) return;
        try {
          if (isOwnProfile) {
            try {
              const moodRes = await getMoodEntriesAPI(accessToken);
              if (isMounted && moodRes && moodRes.length > 0) {
                const latestMood = moodRes[0];
                const moodDate = new Date(latestMood.created_at);
                const today = new Date();
                if (moodDate.getDate() === today.getDate() && moodDate.getMonth() === today.getMonth() && moodDate.getFullYear() === today.getFullYear()) {
                  const apiValToId = { 'excited': 0, 'happy': 1, 'neutral': 2, 'stressed': 3, 'focused': 0 };
                  if (apiValToId[latestMood.mood] !== undefined) {
                    setActiveMood(apiValToId[latestMood.mood]);
                  }
                }
              }
            } catch (e) {
              console.warn("Failed to fetch today's mood:", e);
            }
          }

          if (passedStudent?.id) {
            const profData = await getPublicProfile(accessToken, passedStudent.id);
            if (isMounted && profData) {
              setPublicProfile(profData);
              setUserBio(profData.bio || defaultBio);
            }
          }

          const targetId = passedStudent?.id;
          const res = await connectionStatsAPI(accessToken, targetId);
          if (isMounted && res) setStats(res);

        } catch (err) {
          console.warn('[AdminStudentProfileScreen] data error:', err);
        } finally {
          if (isMounted) setLoadingData(false);
        }
      };

      loadData();

      return () => {
        isMounted = false;
      };
    }, [accessToken, passedStudent?.id])
  );

  const [showEditBioModal, setShowEditBioModal] = React.useState(false);
  const [editBioInput, setEditBioInput] = React.useState('');

  const handleOpenEditBioModal = () => {
    setEditBioInput(userBio);
    setShowEditBioModal(true);
  };

  const handleSaveBio = async () => {
    const trimmed = editBioInput.trim();
    setUserBio(trimmed);
    setShowEditBioModal(false);
    if (accessToken) {
      try {
        await updateMyProfile(accessToken, { bio: trimmed });
      } catch (err) {
        console.warn("Failed to save bio on backend:", err);
      }
    }
  };

  const handleAiGenerateBio = () => {
    const generated = isMed
      ? `MBBS candidate deeply committed to clinical excellence and evidence-based patient care. Actively engaging in clinical rotations, pediatric diagnostics, and rural health screenings.`
      : `Student specializing in university projects and academic logic. Passionate about building scalable applications, learning, and open-source tooling.`;
    setEditBioInput(generated);
  };

  if (!user) return null;

  const displayCerts = [
    ...(user.certsDone || []),
    ...(user.certsInProgress || []),
  ].filter(c => {
    const cl = c.toLowerCase();
    return cl !== 'yes' && cl !== 'no' && cl !== 'na' && cl !== 'n/a' && cl !== 'none' && cl !== '';
  });

  const finalCerts = displayCerts.map((name, idx) => ({
    id: idx,
    name: name,
    issuer: name.toLowerCase().includes('aws') || name.toLowerCase().includes('cloud')
      ? 'AWS Academy'
      : name.toLowerCase().includes('google')
        ? 'Google Cloud'
        : name.toLowerCase().includes('nptel') || name.toLowerCase().includes('swayam')
          ? 'NPTEL'
          : `${APP_CONFIG.UNIVERSITY_SHORT_NAME} Venture Lab`,
    date: 'Issued recently',
    img: idx % 2 === 0
      ? 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&auto=format&fit=crop'
      : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop'
  }));

  const leadershipItems = (user.leadership || []).filter(c => {
    const cl = (c || '').toLowerCase();
    return cl !== 'yes' && cl !== 'no' && cl !== 'na' && cl !== 'n/a' && cl !== 'none' && cl !== '';
  });

  const extracurricularItems = (user.extracurricular || []).filter(c => {
    const cl = (c || '').toLowerCase();
    return cl !== 'yes' && cl !== 'no' && cl !== 'na' && cl !== 'n/a' && cl !== 'none' && cl !== '';
  });

  const allSocialActivities = [
    ...leadershipItems.map(item => ({ name: item, type: 'Leadership Role', icon: 'grade' })),
    ...extracurricularItems.map(item => ({ name: item, type: 'Extracurricular', icon: 'stars' })),
  ];

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission required', 'Permission to access camera roll is required!');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
      });

      if (!pickerResult.canceled && pickerResult.assets?.length > 0) {
        setIsUploading(true);
        const res = await uploadAvatarAPI(accessToken, pickerResult.assets[0].uri);
        if (res.ok && res.json?.success) {
          updateAvatarUrl(res.json.data.avatar_url);
        } else {
          Alert.alert('Upload Failed', 'Could not upload profile picture.');
        }
      }
    } catch (e) {
      console.warn("Error picking image:", e);
      Alert.alert('Error', 'An error occurred while picking the image.');
    } finally {
      setIsUploading(false);
    }
  };

  const avatarUrl = getAvatarUrl(user?.avatar_url || user?.name || user?.full_name || user?.username, user?.rollNo || user?.rollno || user?.username);


  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <View style={styles.headerLeft}>
          {!isOwnProfile && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          <LinearGradient
            colors={isDark ? ['#9A3412', '#7C2D12'] : ['#EA580C', '#9A3412']}
            style={styles.logoIconBg}
          >
            <MaterialIcons name="person" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.headerLogo, { color: colors.textPrimary }]}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} Profile</Text>
        </View>

        <View style={styles.headerRight}>
          {/* <TouchableOpacity 
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('CampusJournal')}
          >
            <Image
              source={require('../../../assets/journal-logo.webp')}
              style={styles.journalIcon}
            />
          </TouchableOpacity> */}
          <Image
            source={{ uri: avatarUrl }}
            style={[styles.avatarSmall, { borderColor: colors.primary }]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Header Image */}
        <View style={styles.profileHeroSection}>
          <View style={[styles.profileHeroCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
            <Image
              source={{ uri: avatarUrl }}
              style={styles.heroImg}
              resizeMode="cover"
            />
            <LinearGradient colors={['transparent', isDark ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.85)']} style={styles.heroOverlay}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <View>
                  <View style={[styles.eliteBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.eliteBadgeText}>PULSE ELITE</Text>
                  </View>
                  <Text style={styles.heroName}>{user?.name || 'Student'}</Text>
                </View>
                {/* Editable Profile Picture Icon */}
                {/* <TouchableOpacity onPress={handlePickImage} style={[styles.editPicBtn, { backgroundColor: colors.background }]}>
                  {isUploading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="camera" size={20} color={colors.textPrimary} />
                  )}
                </TouchableOpacity> */}
              </View>
            </LinearGradient>
          </View>
        </View>


        {/* Major & Batch Info */}
        <View style={styles.basicInfo}>
          <Text style={[styles.majorText, { color: colors.primary }]}>{getDisplayCourse(user)}</Text>
          <Text style={[styles.batchSubText, { color: colors.textSecondary }]}>{APP_CONFIG.CAMPUS_LOCATION}</Text>


          {/* Connections */}
          <View style={styles.networkStats}>
            <TouchableOpacity onPress={() => handleOpenConnectionsModal('connections')}>
              <Text style={[styles.networkText, { color: isDark ? colors.primary : '#3474ec' }]}><Text style={[styles.networkBold, { color: colors.textPrimary }]}>{stats.connections}</Text> Connections</Text>
            </TouchableOpacity>
          </View>




          <View style={styles.capsuleRow}>
            <View style={[styles.capsule, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={styles.capsuleLabel}>CURRENT YEAR</Text>
              <Text style={[styles.capsuleValue, { color: colors.textPrimary }]}>Year {user?.year || user?.current_year || (user?.semester ? Math.ceil(parseInt(user.semester) / 2) : '1')}</Text>
            </View>
            <View style={[styles.capsule, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={styles.capsuleLabel}>STUDENT ID</Text>
              <Text style={[styles.capsuleValue, { color: colors.textPrimary }]}>{user?.username || 'ID-XXX'}</Text>
            </View>
            <View style={[styles.capsule, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={styles.capsuleLabel}>VIBE CHECK</Text>
              <Text style={[styles.capsuleValue, { color: isMed ? (isDark ? '#F87171' : '#B91C1C') : (isDark ? '#2DD4BF' : '#006666') }]}>
                {isMed ? 'Clinician' : (user?.category?.toLowerCase().includes('management') ? 'Strategist' : (user?.category?.toLowerCase().includes('alliedhealth') ? 'Caregiver' : 'Innovator'))}
              </Text>
            </View>
          </View>

        </View>

        {isOwnProfile && (
          <View style={{ marginTop: 16, marginHorizontal: 16 }}>
            <View style={[styles.pulseCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={styles.pulseHeaderRow}>
                <View>
                  <Text style={[styles.pulseTitle, { color: colors.textPrimary }]}>Pulse Check</Text>
                  <Text style={[styles.pulseSub, { color: colors.textSecondary }]}>How are you feeling today?</Text>
                </View>
                <MaterialCommunityIcons name="heart-pulse" size={24} color="#EA580C" opacity={0.5} />
              </View>

              <View style={styles.moodRow}>
                {[
                  { id: 0, icon: 'emoticon-excited-outline', apiVal: 'excited' },
                  { id: 1, icon: 'emoticon-happy-outline', apiVal: 'happy' },
                  { id: 2, icon: 'emoticon-neutral-outline', apiVal: 'neutral' },
                  { id: 3, icon: 'emoticon-sad-outline', apiVal: 'stressed' },
                ].map((mood) => (
                  <TouchableOpacity
                    key={mood.id}
                    onPress={async () => {
                      setActiveMood(mood.id);
                      try {
                        await logMoodAPI(accessToken, mood.apiVal);
                      } catch (e) {
                        console.warn("Failed to log mood:", e);
                      }
                    }}
                    style={[
                      styles.moodBtn,
                      { backgroundColor: activeMood === mood.id ? '#EA580C' : isDark ? '#1F2937' : '#F1F5F9' }
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={mood.icon}
                      size={26}
                      color={activeMood === mood.id ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Editable About / Bio Section */}
        <View style={[styles.aboutSection, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.aboutHeader}>
            <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>About</Text>
            <TouchableOpacity style={[styles.editBioBtn, { backgroundColor: colors.border }]} onPress={handleOpenEditBioModal}>
              <MaterialIcons name="edit" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            {userBio}
          </Text>
        </View>

        {/* Academic Performance Card - Only visible on own profile */}
        {isOwnProfile && (
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Academic Performance</Text>
              <MaterialIcons name="trending-up" size={20} color={colors.primary} />
            </View>
            <View style={styles.acadGrid}>
              <TouchableOpacity
                style={styles.acadItem}
                onPress={() => navigation.navigate('ERPHub', {
                  screen: 'ERPResultsTab',
                  params: { student: user }
                })}
                activeOpacity={0.7}
              >
                <Text style={[styles.acadValue, { color: colors.primary }]}>
                  {isMed 
                    ? `${Math.round((user?.cgpa ? (user.cgpa > 10 ? user.cgpa : user.cgpa * 10) : 75))}%` 
                    : `${user?.cgpa || '0.0'}`}
                  {!isMed && <Text style={[styles.acadMax, { color: colors.textMuted }]}> / 10.0</Text>}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={[styles.acadLabel, { color: colors.textMuted }]}>
                    {isMed ? 'ACADEMIC MARKS' : 'CUMULATIVE GPA'}
                  </Text>
                  <Ionicons name="chevron-forward" size={10} color={colors.textMuted} />
                </View>
                <View style={[styles.pBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border }]}>
                  <View style={[styles.pFill, { width: `${isMed ? Math.min(100, Math.round((user?.cgpa ? (user.cgpa > 10 ? user.cgpa : user.cgpa * 10) : 75))) : ((user?.cgpa || 0) * 10)}%`, backgroundColor: colors.primary }]} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acadItem}
                onPress={() => navigation.navigate('ERPHub', {
                  screen: 'ERPAttendanceTab',
                  params: { student: user }
                })}
                activeOpacity={0.7}
              >
                <Text style={[styles.acadValue, { color: '#f59e0b' }]}>{user?.attendance || 0}%</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={[styles.acadLabel, { color: colors.textMuted }]}>ATTENDANCE</Text>
                  <Ionicons name="chevron-forward" size={10} color={colors.textMuted} />
                </View>
                <View style={[styles.pBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border }]}><View style={[styles.pFill, { width: `${user?.attendance || 0}%`, backgroundColor: '#f59e0b' }]} /></View>
              </TouchableOpacity>
            </View>
          </View>
        )}


        {/* Pulse Check (Mood) */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#E0F2F1', borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#80CBC4', borderWidth: 1 }]}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.cardTitle, { color: isDark ? '#D1FAE5' : '#004D40' }]}>Pulse Check</Text>
              <View style={[styles.tealDot, { backgroundColor: isDark ? '#10B981' : '#00695C' }]} />
            </View>
          </View>
          <Text style={[styles.pulseSubText, { color: isDark ? '#A7F3D0' : '#4B5563' }]}>Your well-being is our priority.</Text>
          <View style={styles.wellbeingContent}>
            <MaterialIcons name="sentiment-very-satisfied" size={48} color={isDark ? '#D1FAE5' : '#004D40'} />
            <Text style={[styles.wellbeingState, { color: isDark ? '#D1FAE5' : '#004D40' }]}>Current State: Focused</Text>
          </View>
          {/* <TouchableOpacity style={[styles.updateMoodBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF' }]}>
            <Text style={[styles.updateMoodText, { color: isDark ? '#D1FAE5' : '#004D40' }]}>UPDATE MOOD</Text>
          </TouchableOpacity> */}
        </View>



        {/* Social Impact Credits */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Social Impact Credits</Text>
              <Text style={[styles.cardSubSub, { color: colors.textSecondary }]}>Community Service & Volunteering</Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: colors.primaryLight }]}><Text style={[styles.scoreText, { color: colors.primary }]}>{user?.social_credits || allSocialActivities.length * 100} pts</Text></View>
          </View>


          <View style={styles.proofList}>
            {allSocialActivities.length > 0 ? (
              allSocialActivities.map((activity, index) => (
                <View key={index} style={[styles.proofItem, { backgroundColor: index % 2 === 0 ? colors.background : (isDark ? 'rgba(255,255,255,0.03)' : '#F3F4F6'), borderColor: colors.border, borderWidth: 1 }]}>
                  <View style={[styles.proofLeadIcon, { backgroundColor: colors.card }]}><MaterialIcons name={activity.icon} size={18} color={colors.primary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.proofName, { color: colors.textPrimary }]}>{activity.name}</Text>
                    <Text style={[styles.proofMeta, { color: colors.textSecondary }]}>{activity.type}</Text>
                  </View>
                  <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>100 pts</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
                  No campus activities or volunteering records found.
                </Text>
              </View>
            )}
          </View>
        </View>


        {/* Venture Lab (Black/Indigo Card) */}
        <View style={[styles.ventureLabCard, { borderColor: colors.border, borderWidth: 1 }]}>
          <LinearGradient
            colors={isMed
              ? (isDark ? ['#1E1B4B', '#311042'] : ['#F5F3FF', '#EDE9FE'])
              : (isDark ? ['#111827', '#0F172A'] : ['#000000', '#1A1A1A'])}
            style={styles.ventureInner}
          >
            <View style={styles.ventureHeader}>
              <Text style={[styles.ventureTopTitle, { color: isMed ? (isDark ? '#C084FC' : '#6B21A8') : '#FFFFFF' }]}>
                {isMed ? 'Clinical Research' : 'Venture Lab'}
              </Text>
              <View style={[
                styles.activeProjectBadge,
                isMed
                  ? { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)', borderColor: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.2)' }
                  : { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.2)' : 'rgba(254, 152, 50, 0.15)', borderColor: isDark ? 'rgba(234, 88, 12, 0.3)' : 'rgba(254, 152, 50, 0.3)' }
              ]}>
                <Text style={[styles.activeProjectText, { color: isMed ? (isDark ? '#C084FC' : '#6B21A8') : colors.primary }]}>
                  {myStartups.length > 0 ? (isMed ? 'ACTIVE PROPOSAL' : 'ACTIVE VENTURE') : 'INACTIVE'}
                </Text>
              </View>
            </View>

            <Text style={[styles.ventureTitle, { color: isMed ? colors.textPrimary : '#fe9832' }]}>
              {myStartups.length > 0
                ? myStartups[0].name
                : (isMed ? 'No Active Research' : 'No Active Venture')}
            </Text>
            <Text style={[styles.ventureDesc, { color: isMed ? colors.textSecondary : '#dadddf' }]}>
              {myStartups.length > 0
                ? (myStartups[0].tagline || myStartups[0].description)
                : (isMed
                  ? 'Submit your clinical research proposal outline on the Research tab to showcase it on your profile.'
                  : 'Pitch your startup idea on the Venture tab to showcase it on your profile.')}
            </Text>
          </LinearGradient>
        </View>


        {/* Certificates */}
        <View style={styles.certWrapper}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Earned Digital Certificates</Text>
            {/* View All Certs Button Removed For Admin */}
          </View>

          {finalCerts.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.certScroll}>
              {finalCerts.map((cert) => (
                <View key={cert.id} style={[styles.certCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Image
                    source={{ uri: cert.img }}
                    style={styles.certImg}
                  />
                  <Text style={[styles.certName, { color: colors.textPrimary }]}>{cert.name}</Text>
                  <Text style={[styles.certIssuer, { color: colors.textSecondary }]}>{cert.issuer} • {cert.date}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={{ padding: 24, alignItems: 'center', backgroundColor: colors.card, borderRadius: 20, borderColor: colors.border, borderWidth: 1, marginHorizontal: 16 }}>
              <MaterialCommunityIcons name="certificate-outline" size={40} color={colors.textSecondary} style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>No Earned Certificates</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 4 }}>Complete courses or verify credentials to see them here.</Text>
            </View>
          )}

        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      {/* Connections/Followers list Modal */}
      <Modal visible={showConnectionsModal} transparent animationType="slide" onRequestClose={() => setShowConnectionsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {connectionsModalType === 'followers' ? 'Followers' : 'Connections'} ({connectionsList.length})
              </Text>
              <TouchableOpacity onPress={() => setShowConnectionsModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {loadingConnections ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
            ) : connectionsList.length === 0 ? (
              <View style={styles.emptyConnections}>
                <Ionicons name="people-outline" size={48} color={colors.textMuted || '#9CA3AF'} />
                <Text style={[styles.emptyConnectionsText, { color: colors.textSecondary }]}>No users found</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ gap: 12, paddingVertical: 8 }} showsVerticalScrollIndicator={false}>
                {connectionsList.map((item) => {
                  const targetId = item.id || item.user_id;
                  const displayName = item.full_name || item.name || item.username || 'Student';
                  return (
                    <View key={targetId} style={[styles.connectionRow, { borderColor: colors.border }]}>
                      <TouchableOpacity 
                        style={styles.connectionUserInfo}
                        onPress={() => {
                          setShowConnectionsModal(false);
                          navigation.navigate('OtherStudentProfile', { student: { id: targetId, name: displayName, avatar_url: item.avatar_url, rollNo: item.rollno || item.username } });
                        }}
                      >
                        <Image 
                          source={{ uri: getAvatarUrl(item.avatar_url || displayName, item.rollno || item.username) }} 
                          style={styles.connectionAvatar} 
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.connectionName, { color: colors.textPrimary }]}>{displayName}</Text>
                          <Text style={[styles.connectionRole, { color: colors.textSecondary }]}>
                            {item.course || 'MBBS'} {item.branch ? `• ${item.branch}` : ''}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      {connectionsModalType === 'connections' && (
                        <TouchableOpacity 
                          style={[styles.removeBtn, { borderColor: colors.border }]}
                          onPress={() => handleRemoveConnection(targetId)}
                        >
                          <Text style={[styles.removeBtnText, { color: colors.textSecondary }]}>Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Bio Modal */}
      <Modal visible={showEditBioModal} transparent animationType="fade" onRequestClose={() => setShowEditBioModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, padding: 24, borderRadius: 24 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit About Section</Text>
              <TouchableOpacity onPress={() => setShowEditBioModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.bioTextInput,
                { 
                  backgroundColor: isDark ? colors.background : '#F9FAFB', 
                  color: colors.textPrimary,
                  borderColor: colors.border
                }
              ]}
              multiline
              numberOfLines={4}
              value={editBioInput}
              onChangeText={setEditBioInput}
              placeholder="Write your biography or about section here..."
              placeholderTextColor={colors.textMuted || '#9CA3AF'}
              textAlignVertical="top"
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 12 }}>
              <TouchableOpacity 
                style={[styles.aiGenBtn, { backgroundColor: isDark ? '#374151' : '#F3F4F6', borderColor: colors.border }]}
                onPress={handleAiGenerateBio}
              >
                <MaterialCommunityIcons name="sparkles" size={18} color={colors.primary} />
                <Text style={[styles.aiGenBtnText, { color: colors.textPrimary }]}>AI Draft</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveBioBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveBio}
              >
                <Text style={styles.saveBioBtnText}>Save Bio</Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  },
  journalIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
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
  profileHeroSection: {
    padding: 16,
  },
  profileHeroCard: {
    height: 320,
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
    justifyContent: 'flex-end',
    padding: 24,
  },
  eliteBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'baseline',
    marginBottom: 8,
  },
  eliteBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  heroName: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  basicInfo: {
    paddingHorizontal: 16,
  },
  majorText: {
    fontSize: 18,
    fontWeight: '800',
  },

  batchSubText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  capsuleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  capsule: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
  },

  capsuleLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  capsuleValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },

  aiPulseWrap: {
    padding: 16,
    marginTop: 8,
  },
  aiPulseInner: {
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  orangeBorder: {
    position: 'absolute',
    inset: 0,
    borderWidth: 1.5,
    borderColor: '#fe9832',
    borderRadius: 24,
  },
  aiSparkleBox: {
    width: 64,
    height: 64,
    backgroundColor: '#fe983220',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiPulseTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
    marginBottom: 12,
  },
  aiPulseText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16, paddingLeft: 20,
    paddingRight: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',

  },
  cardSubSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  acadGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  acadItem: {
    flex: 1,
  },
  acadValue: {
    fontSize: 28,
    fontWeight: '900',
  },

  acadMax: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  acadLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },

  pBar: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  pFill: {
    height: '100%',
    borderRadius: 2,
  },

  tealDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pulseSubText: {
    fontSize: 13,
  },

  wellbeingContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  wellbeingState: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
  },
  updateMoodBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  updateMoodText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },


  scoreBadge: {
    backgroundColor: '#cbceff60',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 15,
    fontWeight: '900',
  },

  proofList: {
    gap: 12,
  },
  proofItem: {
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  proofLeadIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proofName: {
    fontSize: 14,
    fontWeight: '800',
  },

  proofMeta: {
    fontSize: 11,
    marginTop: 2,
  },

  viewProofText: {
    fontSize: 9,
    fontWeight: '800',
  },

  ventureLabCard: {
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  ventureInner: {
    padding: 24,
  },
  ventureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ventureTopTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeProjectBadge: {
    backgroundColor: 'rgba(254, 152, 50, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(254, 152, 50, 0.3)',
  },
  activeProjectText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  ventureTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fe9832',
    marginTop: 16,
  },
  ventureDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 20,
    marginTop: 10,
  },
  ventureActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  vActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
  },
  vActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  certWrapper: {
    marginTop: 20,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllCertText: {
    fontSize: 11,
    fontWeight: '800',
  },
  certScroll: {
    paddingLeft: 16,
    paddingRight: 16,
    gap: 16,
  },
  certCard: {
    width: 250,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    elevation: 4,
  },
  certImg: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  certName: {
    fontSize: 16,
    fontWeight: '800',
  },
  certIssuer: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },

  networkStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  networkText: {
    fontSize: 14,
  },

  networkBold: {
    fontWeight: '800',
  },
  networkDivider: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  pulseCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  pulseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  pulseTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  pulseSub: {
    fontSize: 13,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodBtn: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '22%',
  },
  aboutSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  aboutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: '800',
  },

  editBioBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 4,
  },
  emptyConnections: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyConnectionsText: {
    marginTop: 12,
    fontSize: 15,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  connectionUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  connectionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  connectionName: {
    fontSize: 15,
    fontWeight: '600',
  },
  connectionRole: {
    fontSize: 13,
    marginTop: 2,
  },
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  bioTextInput: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    minHeight: 110,
    marginTop: 8,
  },
  aiGenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  aiGenBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBioBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  saveBioBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

});

export default AdminStudentProfileScreen;
