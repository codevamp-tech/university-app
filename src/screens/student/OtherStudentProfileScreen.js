import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_CONFIG } from '../../config/appConfig';
import { followUserAPI, getPublicProfile, connectionStatsAPI } from '../../data/apiService';
import { getAvatarUrl } from '../../utils/avatar';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
const OtherStudentProfileScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { student } = route.params || {};
  const { accessToken } = useUser();
  const { colors, isDark } = useTheme();
  const [connectionStatus, setConnectionStatus] = useState('Follow'); // 'Follow', 'Pending', 'Following', 'Follow Back', 'Connected'

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ followers: 0, following: 0, connections: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!student?.id || !accessToken) {
        setLoading(false);
        return;
      }
      try {
        const [profData, statsData] = await Promise.all([
          getPublicProfile(accessToken, student.id),
          connectionStatsAPI(accessToken, student.id)
        ]);
        if (isMounted) {
          if (profData) {
            setProfile(profData);
            if (profData.connection_status) {
              setConnectionStatus(profData.connection_status);
            }
          }
          if (statsData) setStats(statsData);
        }
      } catch (err) {
        console.warn('Error loading public profile data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [student?.id, accessToken]);

  const handleConnect = async () => {
    if ((connectionStatus === 'Follow' || connectionStatus === 'Follow Back') && student?.id) {
      const prevStatus = connectionStatus;
      setConnectionStatus('Pending');
      try {
        await followUserAPI(accessToken, student.id);
      } catch(e) {
        setConnectionStatus(prevStatus);
        console.warn('Follow error', e);
      }
    }
  };

  const handleMessage = () => {
    navigation.navigate('DMConversation', {
      contact: {
        user_id: student?.id,
        username: student?.name,
        avatar_url: student?.avatar_url,
      },
      source: 'social',
    });
  };

  if (!student) return null;

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const courseTitle = profile?.course 
    ? (profile.branch ? `${profile.course} ${profile.branch}` : profile.course)
    : (student?.course || 'Student');

  const disableActionBtn = connectionStatus === 'Pending' || connectionStatus === 'Following' || connectionStatus === 'Connected';

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
        <TouchableOpacity style={styles.headerIconBtn}>
          <MaterialIcons name="more-horiz" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Header Image */}
        <View style={styles.profileHeroSection}>
          <View style={styles.profileHeroCard}>
            <LinearGradient colors={['#4953ac', '#8b2fc9']} style={styles.heroImgPlaceholder}>
              <Image source={{ uri: getAvatarUrl(profile?.avatar_url || student.avatar_url || student.name) }} style={{ width: '100%', height: '100%', opacity: 0.6 }} />            </LinearGradient>
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.heroOverlay}>
              <Text style={styles.heroName}>{profile?.full_name || student.name}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Major & Batch Info */}
        <View style={styles.basicInfo}>
          <Text style={[styles.majorText, { color: colors.primary }]}>{courseTitle}</Text>
          <Text style={[styles.batchSubText, { color: colors.textSecondary }]}>Batch of {profile?.batch_year || '2025'} • {profile?.rollno || student.rollNo}</Text>
          
          <View style={styles.capsuleRow}>
            <View style={[styles.capsule, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.capsuleLabel}>FOLLOWERS</Text>
              <Text style={[styles.capsuleValue, { color: colors.textPrimary }]}>{stats.followers}</Text>
            </View>
            <View style={[styles.capsule, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.capsuleLabel}>CONNECTIONS</Text>
              <Text style={[styles.capsuleValue, { color: colors.textPrimary }]}>{stats.connections}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[
                styles.actionBtnPrimary, 
                { backgroundColor: colors.primary, shadowColor: colors.primary },
                disableActionBtn && [styles.actionBtnPending, { backgroundColor: colors.border }]
              ]}
              onPress={handleConnect}
              disabled={disableActionBtn}
            >
              <Ionicons 
                name={disableActionBtn ? "checkmark-outline" : "person-add-outline"} 
                size={18} 
                color={disableActionBtn ? colors.textSecondary : '#FFFFFF'} 
              />
              <Text style={[
                styles.actionBtnTextPrimary,
                disableActionBtn && { color: colors.textSecondary }
              ]}>
                {connectionStatus}
              </Text>
            </TouchableOpacity>

            {connectionStatus === 'Connected' && (
              <TouchableOpacity style={[styles.actionBtnSecondary, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleMessage}>
                <Ionicons name="chatbubble-outline" size={18} color={colors.textPrimary} />
                <Text style={[styles.actionBtnTextSecondary, { color: colors.textPrimary }]}>Message</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Bio */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>About</Text>
          <Text style={[styles.bioText, { color: colors.textSecondary }]}>
            {profile?.bio || 'No biography details provided.'}
          </Text>
        </View>

        {/* Skills */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Top Skills</Text>
          <View style={styles.skillsRow}>
            {profile?.current_skills && profile.current_skills.length > 0 ? (
              profile.current_skills.map((skill, idx) => (
                <View key={idx} style={[styles.skillBadge, { backgroundColor: isDark ? colors.background : '#F3F4F6', borderColor: colors.border }]}>
                  <Text style={[styles.skillText, { color: colors.textPrimary }]}>{skill}</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No skills listed yet.</Text>
            )}
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
    backgroundColor: '#F5F6F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerIconBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
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
    backgroundColor: '#000',
  },
  heroImgPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInitial: {
    fontSize: 80,
    fontWeight: '900',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'flex-end',
    padding: 24,
  },
  heroName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  basicInfo: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  majorText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4953ac',
  },
  batchSubText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  capsuleRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  capsule: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  capsuleLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  capsuleValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1F2937',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: '#8b2fc9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#8b2fc9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnPending: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionBtnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  actionBtnTextPending: {
    color: '#4B5563',
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  actionBtnTextSecondary: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionCard: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skillText: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
  },
});

export default OtherStudentProfileScreen;
