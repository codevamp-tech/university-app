import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { uploadAvatarAPI } from '../../data/apiService';
import { getAvatarUrl } from '../../utils/avatar';
import { ActivityIndicator, Alert } from 'react-native';

import { useTheme } from '../../hooks/useTheme';
import { APP_CONFIG } from '../../config/appConfig';
import { useUser } from '../../context/UserContext';
import { getCategoryLabel } from '../../data/aiEngine';


const { width } = Dimensions.get('window');

const TalentIdentityScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
    const { user, accessToken, updateAvatarUrl } = useUser();
  const [isUploading, setIsUploading] = React.useState(false);

  if (!user) return null;

  const displayCerts = [
    ...(user.certsDone || []),
    ...(user.certsInProgress || []),
  ].filter(c => {
    const cl = c.toLowerCase();
    return cl !== 'yes' && cl !== 'no' && cl !== 'na' && cl !== 'n/a' && cl !== 'none' && cl !== '';
  });

  const finalCerts = displayCerts.length > 0 
    ? displayCerts.map((name, idx) => ({
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
      }))
    : [
        {
          id: 0,
          name: user.course?.toLowerCase().includes('medicine') || user.course?.toLowerCase().includes('bpharma')
            ? 'Basic Pharmacology'
            : user.course?.toLowerCase().includes('mba') || user.course?.toLowerCase().includes('bba')
            ? 'Advanced Excel'
            : 'Python Foundations',
          issuer: `${APP_CONFIG.UNIVERSITY_SHORT_NAME} Academy`,
          date: 'Recommended Certification',
          img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&auto=format&fit=crop'
        },
        {
          id: 1,
          name: user.course?.toLowerCase().includes('medicine') || user.course?.toLowerCase().includes('bpharma')
            ? 'Clinical Trials & Ethics'
            : user.course?.toLowerCase().includes('mba') || user.course?.toLowerCase().includes('bba')
            ? 'Data Visualization with BI'
            : 'Cloud Architect Associate',
          issuer: 'AWS Academy Partner',
          date: 'Recommended Certification',
          img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop'
        }
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

  const avatarUrl = user?.avatar_url || getAvatarUrl(user?.id || user?.email || 'me');


  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="school" size={26} color={colors.primary} />
          <Text style={[styles.headerLogo, { color: colors.textPrimary }]}>{APP_CONFIG.UNIVERSITY_NAME}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('CampusJournal')}
          >
            <Image
              source={require('../../../assets/journal-logo.webp')}
              style={styles.journalIcon}
            />
          </TouchableOpacity>
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
                <TouchableOpacity onPress={handlePickImage} style={[styles.editPicBtn, { backgroundColor: colors.background }]}>
                  {isUploading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="camera" size={20} color={colors.textPrimary} />
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>


        {/* Major & Batch Info */}
        <View style={styles.basicInfo}>
          <Text style={[styles.majorText, { color: colors.primary }]}>{user?.course || 'Course'} {user?.branch ? `- ${user?.branch}` : ''}</Text>
          <Text style={[styles.batchSubText, { color: colors.textSecondary }]}>Year {user?.year || '1'} • {APP_CONFIG.CAMPUS_LOCATION}</Text>


          {/* LinkedIn-style Connections */}
          <View style={styles.networkStats}>
            <Text style={[styles.networkText, { color: isDark ? colors.primary : '#3474ec' }]}><Text style={[styles.networkBold, { color: colors.textPrimary }]}>1.2K</Text> Followers</Text>
            <Text style={[styles.networkDivider, { color: colors.textMuted }]}>•</Text>
            <Text style={[styles.networkText, { color: isDark ? colors.primary : '#3474ec' }]}><Text style={[styles.networkBold, { color: colors.textPrimary }]}>500+</Text> Connections</Text>
          </View>




          <View style={styles.capsuleRow}>
            <View style={[styles.capsule, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={styles.capsuleLabel}>CURRENT YEAR</Text>
              <Text style={[styles.capsuleValue, { color: colors.textPrimary }]}>Year {user?.year || '1'}</Text>
            </View>
            <View style={[styles.capsule, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={styles.capsuleLabel}>STUDENT ID</Text>
              <Text style={[styles.capsuleValue, { color: colors.textPrimary }]}>{user?.id || 'ID-XXX'}</Text>
            </View>
            <View style={[styles.capsule, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={styles.capsuleLabel}>VIBE CHECK</Text>
              <Text style={[styles.capsuleValue, { color: isDark ? '#2DD4BF' : '#006666' }]}>Innovator</Text>
            </View>
          </View>

        </View>

        {/* Editable About / Bio Section */}
        <View style={[styles.aboutSection, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.aboutHeader}>
            <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>About</Text>
            <TouchableOpacity style={[styles.editBioBtn, { backgroundColor: colors.border }]}>
              <MaterialIcons name="edit" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>

            Passionate software engineering student deeply interested in Full Stack Development and AI.
            Leading the SkyDrone project in the Venture Lab and actively organizing the {APP_CONFIG.UNIVERSITY_SHORT_NAME} Coding Club Hackathons.
            Always looking to connect with like-minded innovators!
          </Text>
        </View>

        {/* AI Pulse Card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Academic Performance</Text>
            <MaterialIcons name="trending-up" size={20} color={colors.primary} />
          </View>

          <View style={styles.acadGrid}>
            <View style={styles.acadItem}>
              <Text style={[styles.acadValue, { color: colors.primary }]}>{user?.cgpa || '0.0'} <Text style={[styles.acadMax, { color: colors.textMuted }]}>/ 10.0</Text></Text>
              <Text style={[styles.acadLabel, { color: colors.textMuted }]}>CUMULATIVE GPA</Text>
              <View style={[styles.pBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border }]}><View style={[styles.pFill, { width: `${(user?.cgpa || 0) * 10}%`, backgroundColor: colors.primary }]} /></View>
            </View>

            <View style={styles.acadItem}>
              <Text style={[styles.acadValue, { color: '#f59e0b' }]}>{user?.attendance || 0}%</Text>
              <Text style={[styles.acadLabel, { color: colors.textMuted }]}>ATTENDANCE</Text>
              <View style={[styles.pBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border }]}><View style={[styles.pFill, { width: `${user?.attendance || 0}%`, backgroundColor: '#f59e0b' }]} /></View>
            </View>

          </View>
        </View>


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
          <TouchableOpacity style={[styles.updateMoodBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF' }]}>
            <Text style={[styles.updateMoodText, { color: isDark ? '#D1FAE5' : '#004D40' }]}>UPDATE MOOD</Text>
          </TouchableOpacity>
        </View>



        {/* Social Impact Credits */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Social Impact Credits</Text>
              <Text style={[styles.cardSubSub, { color: colors.textSecondary }]}>Community Service & Volunteering</Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: colors.primaryLight }]}><Text style={[styles.scoreText, { color: colors.primary }]}>420 pts</Text></View>
          </View>


          <View style={styles.proofList}>
            <View style={[styles.proofItem, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={[styles.proofLeadIcon, { backgroundColor: colors.card }]}><MaterialIcons name="volunteer-activism" size={18} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.proofName, { color: colors.textPrimary }]}>Campus Green Drive</Text>
                <Text style={[styles.proofMeta, { color: colors.textSecondary }]}>12 Hours • NGO Partner</Text>
              </View>
              <TouchableOpacity><Text style={[styles.viewProofText, { color: colors.primary }]}>VIEW PROOF</Text></TouchableOpacity>
            </View>


            <View style={[styles.proofItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F3F4F6', borderColor: colors.border, borderWidth: 1 }]}>
              <View style={[styles.proofLeadIcon, { backgroundColor: colors.card }]}><MaterialIcons name="groups" size={18} color={isDark ? colors.primary : "#4953ac"} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.proofName, { color: colors.textPrimary }]}>Peer Mentorship</Text>
                <Text style={[styles.proofMeta, { color: colors.textSecondary }]}>Spring Semester '24</Text>
              </View>
              <TouchableOpacity><Text style={[styles.viewProofText, { color: colors.primary }]}>VIEW PROOF</Text></TouchableOpacity>
            </View>
          </View>
        </View>


        {/* Venture Lab (Black Card) */}
        <View style={[styles.ventureLabCard, { borderColor: colors.border, borderWidth: 1 }]}>
          <LinearGradient colors={isDark ? ['#111827', '#0F172A'] : ['#000000', '#1A1A1A']} style={styles.ventureInner}>
            <View style={styles.ventureHeader}>
              <Text style={styles.ventureTopTitle}>Venture Lab</Text>
              <View style={[styles.activeProjectBadge, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.2)' : 'rgba(254, 152, 50, 0.15)', borderColor: isDark ? 'rgba(234, 88, 12, 0.3)' : 'rgba(254, 152, 50, 0.3)' }]}>
                <Text style={[styles.activeProjectText, { color: colors.primary }]}>ACTIVE PROJECT</Text>
              </View>
            </View>

            <Text style={styles.ventureTitle}>SkyDrone Campus</Text>
            <Text style={styles.ventureDesc}>
              Leading a team of 5 to develop autonomous delivery drones for last-mile pharmaceutical logistics in rural regions.
            </Text>
            <View style={styles.ventureActions}>
              <TouchableOpacity style={styles.vActionBtn}>
                <Ionicons name="link-outline" size={14} color="#FFFFFF" />
                <Text style={styles.vActionText}>Project Proofs</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.vActionBtn}>
                <MaterialCommunityIcons name="rocket-launch" size={14} color="#FFFFFF" />
                <Text style={styles.vActionText}>Startup ID</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>


        {/* Certificates */}
        <View style={styles.certWrapper}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Earned Digital Certificates</Text>
            <TouchableOpacity style={styles.viewAllRow}>
              <Text style={[styles.viewAllCertText, { color: colors.primary }]}>VIEW ALL</Text>
              <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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

});

export default TalentIdentityScreen;
