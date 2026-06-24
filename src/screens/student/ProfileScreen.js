import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { APP_CONFIG } from '../../config/appConfig';
import { useUser } from '../../context/UserContext';
import { getPersonaBadge } from '../../data/aiEngine';
import { uploadAvatarAPI, connectionStatsAPI } from '../../data/apiService';
import { getAvatarUrl } from '../../utils/avatar';
import { isMedicalStudent, getDisplayCourse } from '../../utils/courseDisplay';


const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, accessToken, updateAvatarUrl } = useUser();
  const [stats, setStats] = React.useState({ followers: 0, following: 0, connections: 0 });
  const [isUploading, setIsUploading] = React.useState(false);

  const isMed = user ? isMedicalStudent(user) : false;

  React.useEffect(() => {
    if (accessToken) {
      connectionStatsAPI(accessToken).then(res => setStats(res || { followers: 0, following: 0, connections: 0 }));
    }
  }, [accessToken]);

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
          name: isMed
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
          name: isMed
            ? 'Clinical Trials & Ethics'
            : user.course?.toLowerCase().includes('mba') || user.course?.toLowerCase().includes('bba')
            ? 'Data Visualization with BI'
            : 'Cloud Architect Associate',
          issuer: 'AWS Academy Partner',
          date: 'Recommended Certification',
          img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop'
        }
      ];

  const avatarUrl = getAvatarUrl(user.avatar_url || user.name);


  const handlePickImage = async () => {
    Alert.alert("Clicked!", "Button works!");
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

  return (

    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="school" size={26} color="#F97316" />
          <Text style={styles.headerLogo}>{APP_CONFIG.UNIVERSITY_NAME}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <MaterialIcons name="smart-toy" size={22} color="#6B7280" />
          </TouchableOpacity>
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatarTiny}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Asymmetric Profile Section */}
        <View style={styles.profileSection}>
          
          <TouchableOpacity style={styles.profileImageWrap} onPress={handlePickImage} activeOpacity={0.8}>
            <Image 
              source={{ uri: avatarUrl }} 
              style={styles.profileImg} 
              resizeMode="cover"
            />
            {isUploading && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
            <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 15, padding: 6 }}>
              <MaterialIcons name="edit" size={16} color="#FFF" />
            </View>
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.imgOverlay}>

              <View style={styles.pulseEliteBadge}>
                <Text style={styles.pulseEliteText}>{getPersonaBadge(user.personaType).toUpperCase()}</Text>
              </View>
              <Text style={styles.profileName}>{user.name}</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.profileInfoWrap}>
            <Text style={styles.profileMajor}>{getDisplayCourse ? getDisplayCourse(user) : `${user.course} ${user.branch}`}</Text>
            {(() => {
              const currentYear = user?.year || user?.current_year || (user?.semester ? Math.ceil(parseInt(user.semester) / 2) : '1');
              const vibeCheck = isMed ? 'Clinician' : (user?.category?.toLowerCase().includes('management') ? 'Strategist' : (user?.category?.toLowerCase().includes('alliedhealth') ? 'Caregiver' : 'Innovator'));
              const vibeColor = isMed ? '#B91C1C' : '#006666';
              return (
                <>
                  <Text style={styles.profileSub}>Year {currentYear} • {APP_CONFIG.UNIVERSITY_NAME}</Text>
                  <View style={styles.infoCapsuleRow}>
                    <View style={styles.infoCapsule}>
                      <Text style={styles.infoLabel}>SEM</Text>
                      <Text style={styles.infoValue}>S{user.semester}</Text>
                    </View>
                    <View style={styles.infoCapsule}>
                      <Text style={styles.infoLabel}>ID</Text>
                      <Text style={styles.infoValue}>{user.id}</Text>
                    </View>
                    <View style={styles.infoCapsule}>
                      <Text style={styles.infoLabel}>VIBE</Text>
                      <Text style={[styles.infoValue, { color: vibeColor }]}>{vibeCheck}</Text>
                    </View>
                  </View>
                </>
              );
            })()}
            <View style={[styles.infoCapsuleRow, { marginTop: 8 }]}>
              <View style={styles.infoCapsule}>
                <Text style={styles.infoLabel}>FOLLOWERS</Text>
                <Text style={styles.infoValue}>{stats.followers}</Text>
              </View>
              <View style={styles.infoCapsule}>
                <Text style={styles.infoLabel}>CONNECTIONS</Text>
                <Text style={styles.infoValue}>{stats.connections}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* AI Insight Card */}
        <View style={styles.aiInsightCard}>
          <View style={styles.aiIconBox}>
            <MaterialIcons name="auto-awesome" size={32} color="#8b4b00" />
          </View>
          <View style={styles.aiContent}>
            <Text style={styles.aiTitle}>Personalized AI Pulse</Text>
            <Text style={styles.aiText}>
              "{user.name.split(' ')[0]}, your trajectory in <Text style={{ fontWeight: '800', color: '#4953ac' }}>{user.course}</Text> is exceptional. 
              Maintaining your {user.cgpa} CGPA while engaging in {user.extracurricular.length} clubs puts you in the top 5% of your batch."
            </Text>
          </View>
        </View>

        {/* Academic & Wellbeing Grid */}
        <View style={styles.bentoGrid}>
          <View style={styles.academicCard}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>Academic Performance</Text>
              <MaterialIcons name="trending-up" size={20} color="#4953ac" />
            </View>
            <View style={styles.statRow}>
              <View>
                <Text style={styles.bigStat}>{user.cgpa} <Text style={styles.statMax}>/ 10</Text></Text>
                <Text style={styles.statLabel}>CUMULATIVE GPA</Text>
                <View style={styles.miniBar}><View style={[styles.miniFill, { width: `${(user.cgpa/10)*100}%`, backgroundColor: '#4953ac' }]} /></View>
              </View>
              <View>
                <Text style={styles.bigStat}>{user.attendance}%</Text>
                <Text style={styles.statLabel}>ATTENDANCE</Text>
                <View style={styles.miniBar}><View style={[styles.miniFill, { width: `${user.attendance}%`, backgroundColor: '#8b4b00' }]} /></View>
              </View>
            </View>
          </View>

          <View style={styles.pulseCheckCard}>
            <View style={styles.pulseHeader}>
              <Text style={styles.cardTitle}>Pulse Check</Text>
              <View style={styles.blinkDot} />
            </View>
            <View style={styles.pulseCenter}>
              <MaterialIcons name="sentiment-satisfied" size={48} color="#006666" />
              <Text style={styles.pulseState}>Focused</Text>
            </View>
            <TouchableOpacity style={styles.updateMoodBtn}>
              <Text style={styles.updateMoodText}>UPDATE MOOD</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Social Impact & Venture Proofs */}
        <View style={styles.proofsSection}>
          <View style={styles.socialCard}>
            <View style={styles.proofHeader}>
              <View>
                <Text style={styles.proofTitle}>Hustle & Activities</Text>
                <Text style={styles.proofSub}>Leadership & Extracurriculars</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>
                  {user.social_credits || ((user.extracurricular?.length || 0) + (user.leadership?.length || 0)) * 100 + 120} pts
                </Text>
              </View>
            </View>

            {user.leadership && user.leadership.filter(Boolean).length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#6B7280', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                  Leadership Roles
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {user.leadership.filter(c => c && c.toLowerCase() !== 'no' && c.toLowerCase() !== 'na' && c.toLowerCase() !== 'n/a' && c.toLowerCase() !== 'none').map((item, index) => (
                    <View key={index} style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#C7D2FE', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <MaterialIcons name="grade" size={14} color="#4953ac" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#4953ac' }}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {user.extracurricular && user.extracurricular.filter(Boolean).length > 0 && (
              <View>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#6B7280', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                  Extracurriculars
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {user.extracurricular.filter(c => c && c.toLowerCase() !== 'no' && c.toLowerCase() !== 'na' && c.toLowerCase() !== 'n/a' && c.toLowerCase() !== 'none').map((item, index) => (
                    <View key={index} style={{ backgroundColor: '#FFF7ED', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#FFEDD5', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <MaterialIcons name="stars" size={14} color="#EA580C" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#EA580C' }}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.ventureCard}>
            <LinearGradient 
              colors={isMed ? ['#1e1b4b', '#311042'] : ['#1A1A2E', '#2c2f30']} 
              style={styles.ventureGradient}
            >
              <View style={styles.proofHeader}>
                <Text style={styles.proofTitleWhite}>{isMed ? 'Clinical Rotation' : 'Venture Lab'}</Text>
                <View style={[styles.activeLabel, isMed && { borderColor: 'rgba(168, 85, 247, 0.4)', backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}><Text style={[styles.activeText, isMed && { color: '#C084FC' }]}>ACTIVE</Text></View>
              </View>
              <Text style={styles.ventureName}>
                {isMed ? 'Rural Health Immersion' : (user.course.includes('Computer') ? 'SkyDrone Campus' : 'HealthTech Innovators')}
              </Text>
              <Text style={styles.ventureDesc}>
                {isMed 
                  ? 'Conducting community health screenings and analyzing pediatric immunization compliance.'
                  : `Leading a team of 5 to develop autonomous solutions in ${user.course}.`}
              </Text>
              <View style={styles.ventureActions}>
                <TouchableOpacity style={styles.vBtn}>
                  <MaterialIcons name={isMed ? "journal" : "link"} size={14} color="#FFFFFF" />
                  <Text style={styles.vBtnText}>{isMed ? 'Case Studies' : 'Proofs'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.vBtn}>
                  <MaterialIcons name={isMed ? "assignment-turned-in" : "rocket-launch"} size={14} color="#FFFFFF" />
                  <Text style={styles.vBtnText}>{isMed ? 'Logbook ID' : 'Startup ID'}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Certificates */}
        <View style={styles.certificatesWrapper}>
          <View style={styles.certHeader}>
            <Text style={styles.certSectionTitle}>Earned Digital Certificates</Text>
            <TouchableOpacity style={styles.certViewAll}>
              <Text style={styles.certViewAllText}>VIEW ALL</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#8b4b00" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.certsContainer}>
            {finalCerts.map((cert) => (
              <View key={cert.id} style={styles.certCard}>
                <View style={styles.certImgBox}>
                  <Image source={{ uri: cert.img }} style={styles.certImg} />
                </View>
                <Text style={styles.certName}>{cert.name}</Text>
                <Text style={styles.certIssuer}>{cert.issuer} • {cert.date}</Text>
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
    backgroundColor: '#F5F6F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#EA580C',
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
  avatarTiny: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#8b4b00',
  },
  scroll: {
    paddingBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    padding: 20,
    gap: 20,
  },
  profileImageWrap: {
    width: width * 0.35,
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  profileImg: {
    width: '100%',
    height: '100%',
  },
  imgOverlay: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'flex-end',
    padding: 16,
  },
  pulseEliteBadge: {
    backgroundColor: '#8b4b00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'baseline',
    marginBottom: 6,
  },
  pulseEliteText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  profileInfoWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  profileMajor: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4953ac',
    lineHeight: 22,
  },
  profileSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  infoCapsuleRow: {
    marginTop: 20,
    gap: 8,
  },
  infoCapsule: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8b4b00',
    marginTop: 2,
  },
  aiInsightCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  aiIconBox: {
    width: 56,
    height: 56,
    backgroundColor: '#fe983220',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiContent: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  aiText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  bentoGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  academicCard: {
    flex: 1.8,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
  },
  pulseCheckCard: {
    flex: 1,
    backgroundColor: '#8dedec30',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#8dedec60',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  statRow: {
    gap: 12,
    marginTop: 16,
  },
  bigStat: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: -1,
  },
  statMax: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginTop: 2,
  },
  miniBar: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 2,
  },
  pulseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  blinkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#006666',
  },
  pulseCenter: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  pulseState: {
    fontSize: 12,
    fontWeight: '800',
    color: '#006666',
    marginTop: 8,
  },
  updateMoodBtn: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 10,
    width: '100%',
    borderRadius: 20,
    alignItems: 'center',
  },
  updateMoodText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#005959',
    letterSpacing: 1,
  },
  proofsSection: {
    padding: 20,
    gap: 16,
  },
  socialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  proofHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  proofTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  proofSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  scoreBadge: {
    backgroundColor: '#cbceff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: {
    color: '#4953ac',
    fontWeight: '900',
    fontSize: 13,
  },
  proofItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  itemMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  viewProofText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4953ac',
    letterSpacing: 0.5,
  },
  ventureCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  ventureGradient: {
    padding: 24,
  },
  proofTitleWhite: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeLabel: {
    backgroundColor: 'rgba(139, 47, 201, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 201, 0.4)',
  },
  activeText: {
    color: '#fe9832',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  ventureName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fe9832',
    marginTop: 12,
  },
  ventureDesc: {
    fontSize: 13,
    color: '#dadddf',
    lineHeight: 20,
    marginTop: 8,
  },
  ventureActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  vBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  vBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  certificatesWrapper: {
    marginTop: 12,
  },
  certHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  certSectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
  },
  certViewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  certViewAllText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8b4b00',
    letterSpacing: 0.5,
  },
  certsContainer: {
    paddingLeft: 24,
    paddingRight: 24,
    gap: 16,
  },
  certCard: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e3e4',
  },
  certImgBox: {
    width: '100%',
    height: 140,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  certImg: {
    width: '100%',
    height: '100%',
  },
  certName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  certIssuer: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
});

export default ProfileScreen;