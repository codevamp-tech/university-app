import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_CONFIG } from '../../config/appConfig';
import { followUserAPI, getPublicProfile, connectionStatsAPI, getConnectionList } from '../../data/apiService';
import { getAvatarUrl } from '../../utils/avatar';
import { getDisplayCourse } from '../../utils/courseDisplay';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { Modal } from 'react-native';
const OtherStudentProfileScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { student } = route.params || {};
  const { accessToken } = useUser();
  const { colors, isDark } = useTheme();
  const [connectionStatus, setConnectionStatus] = useState('Connect'); // 'Connect', 'Pending', 'Connected'

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ followers: 0, following: 0, connections: 0 });
  const [loading, setLoading] = useState(true);

  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [connectionsList, setConnectionsList] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);

  const handleOpenConnectionsModal = async () => {
    setShowConnectionsModal(true);
    setLoadingConnections(true);
    try {
      const data = await getConnectionList(accessToken, student?.id);
      setConnectionsList(data.connections || []);
    } catch (e) {
      console.warn("Error loading connection list:", e);
    } finally {
      setLoadingConnections(false);
    }
  };

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
              const statusMap = {
                'Follow': 'Connect',
                'Following': 'Connected',
                'Follow Back': 'Connect',
              };
              setConnectionStatus(statusMap[profData.connection_status] || profData.connection_status);
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
    if (connectionStatus === 'Connected') {
      Alert.alert(
        "Remove Connection",
        `Remove ${profile?.full_name || student?.name} from your connections?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              setConnectionStatus('Connect');
              try {
                if (profile?.connection_id) {
                  await removeConnectionAPI(accessToken, profile.connection_id);
                }
              } catch (e) {
                console.warn('Remove connection error', e);
              }
            }
          }
        ]
      );
      return;
    }

    if (connectionStatus === 'Connect' && student?.id) {
      const prevStatus = connectionStatus;
      setConnectionStatus('Pending');
      try {
        await followUserAPI(accessToken, student.id);
      } catch(e) {
        setConnectionStatus(prevStatus);
        console.warn('Connect error', e);
      }
    }
  };

  const handleMessage = () => {
    navigation.navigate('DMConversation', {
      recipientId: student?.id,
      recipientName: profile?.full_name || student?.name,
      contact: {
        user_id: student?.id,
        username: profile?.full_name || student?.name,
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

  const courseTitle = getDisplayCourse({ ...(student || {}), ...(profile || {}) });

  const disableActionBtn = connectionStatus === 'Pending';

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
              <Image 
                source={{ 
                  uri: getAvatarUrl(
                    ([profile?.avatar_url, student?.avatar_url].find(url => url && typeof url === 'string' && url.startsWith('http') && !url.includes('ui-avatars.com') && !url.includes('pravatar.cc'))) || profile?.full_name || student?.name, 
                    profile?.rollno || student?.rollNo || student?.username
                  ) 
                }} 
                style={{ width: '100%', height: '100%' }} 
                resizeMode="cover"
              />
            </LinearGradient>
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
            <TouchableOpacity style={[styles.capsule, { flex: 1, backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleOpenConnectionsModal}>
              <Text style={styles.capsuleLabel}>CONNECTIONS</Text>
              <Text style={[styles.capsuleValue, { color: colors.textPrimary }]}>{stats.connections}</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[
                styles.actionBtnPrimary, 
                { backgroundColor: connectionStatus === 'Connected' ? colors.card : colors.primary, borderWidth: connectionStatus === 'Connected' ? 1 : 0, borderColor: colors.border },
                disableActionBtn && [styles.actionBtnPending, { backgroundColor: colors.border }]
              ]}
              onPress={handleConnect}
              disabled={disableActionBtn}
            >
              <Ionicons 
                name={connectionStatus === 'Connected' ? "checkmark-circle" : (connectionStatus === 'Pending' ? "time-outline" : "person-add-outline")} 
                size={18} 
                color={connectionStatus === 'Connected' ? "#10B981" : (disableActionBtn ? colors.textSecondary : '#FFFFFF')} 
              />
              <Text style={[
                styles.actionBtnTextPrimary,
                connectionStatus === 'Connected' && { color: colors.textPrimary },
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

      {/* Connections/Followers list Modal */}
      <Modal visible={showConnectionsModal} transparent animationType="slide" onRequestClose={() => setShowConnectionsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Connections ({connectionsList.length})
              </Text>
              <TouchableOpacity onPress={() => setShowConnectionsModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {loadingConnections ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
            ) : connectionsList.length === 0 ? (
              <View style={styles.emptyConnections}>
                <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyConnectionsText, { color: colors.textSecondary }]}>No users found</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}>
                {connectionsList.map((item) => (
                  <View key={item.id} style={[styles.connectionItem, { borderBottomColor: colors.border }]}>
                    <Image source={{ uri: getAvatarUrl(item.avatar_url || item.username) }} style={styles.connectionAvatar} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.connectionName, { color: colors.textPrimary }]}>{item.full_name || item.username}</Text>
                      <Text style={[styles.connectionUsername, { color: colors.textMuted }]}>@{item.username}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  emptyConnections: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyConnectionsText: {
    fontSize: 15,
    marginTop: 12,
    fontWeight: '600',
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  connectionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  connectionName: {
    fontSize: 15,
    fontWeight: '700',
  },
  connectionUsername: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default OtherStudentProfileScreen;
