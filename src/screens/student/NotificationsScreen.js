import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';
import { getPendingRequestsAPI, acceptRequestAPI, getAllStudents, getAlerts } from '../../data/apiService';
import { getAvatarUrl } from '../../utils/avatar';
import { fixImageUrl } from '../../utils/imageUrl';
import { useTheme } from '../../hooks/useTheme';

const formatNotifTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const NotificationsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { accessToken } = useUser();
  const { markRequestsAsRead, refreshUnreadCounts } = useNotifications();
  const { colors, isDark } = useTheme();
  const [requests, setRequests] = useState([]);
  const [activityNotifs, setActivityNotifs] = useState([]);
  const [studentMap, setStudentMap] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [data, alertsRes] = await Promise.all([
        getPendingRequestsAPI(accessToken),
        getAlerts(accessToken, 0, 30),
      ]);
      setRequests(data);

      // Show only SOCIAL type alerts in this screen
      if (alertsRes?.data) {
        const socialAlerts = alertsRes.data.filter(a => a.type === 'social');
        setActivityNotifs(socialAlerts);
      }
      refreshUnreadCounts();

      try {
        const students = await getAllStudents(accessToken);
        const map = {};
        if (Array.isArray(students)) {
          students.forEach(s => {
            if (s.username) {
              map[s.username.toLowerCase()] = s;
            }
          });
        }
        setStudentMap(map);
      } catch (err) {
        console.warn('Failed to load student directory for name lookup', err);
      }
    } catch (e) {
      console.warn('Failed to load pending requests', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [accessToken]);

  const handleAccept = async (connectionId) => {
    try {
      await acceptRequestAPI(accessToken, connectionId);
      markRequestsAsRead(1);
      Alert.alert("Success", "Follow request accepted!");
      fetchRequests();
    } catch (e) {
      console.warn("Failed to accept", e);
      Alert.alert("Error", "Failed to accept request");
    }
  };

  const renderRequest = ({ item }) => {
    const usernameLower = item.username ? item.username.toLowerCase() : '';
    const dirStudent = studentMap[usernameLower];
    // Priority: API full_name → student directory name/full_name → generic fallback
    const displayName = item.full_name || item.name
      || dirStudent?.full_name || dirStudent?.name
      || 'Student';
    const rawAvatar = item.avatar_url || dirStudent?.avatar || getAvatarUrl(item.username, displayName);
    const avatarUrl = fixImageUrl(rawAvatar);

    const studentId = item.follower_id || item.user_id || dirStudent?.id;

    return (
      <View style={[styles.requestCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
        <TouchableOpacity
          style={{ flexDirection: 'row', flex: 1, alignItems: 'center', marginRight: 8 }}
          onPress={() => {
            if (studentId) {
              navigation.navigate('OtherStudentProfile', {
                student: {
                  id: studentId,
                  user_id: studentId,
                  name: displayName,
                  avatar_url: avatarUrl,
                  rollNo: item.username || dirStudent?.rollno,
                }
              });
            }
          }}
        >
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View style={styles.info}>
            <Text style={[styles.username, { color: colors.textPrimary }]}>{displayName}</Text>
            {item.username && item.username !== displayName && (
              <Text style={{ fontSize: 12, color: colors.textMuted || '#9CA3AF', marginTop: 1 }}>
                {item.username}
              </Text>
            )}
            <Text style={[styles.message, { color: colors.textSecondary }]}>Wants to follow you</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
            onPress={() => handleAccept(item.id)}
          >
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {/* Connection Requests */}
          {requests.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CONNECTION REQUESTS</Text>
              {requests.map(item => (
                <View key={item.id}>{renderRequest({ item })}</View>
              ))}
            </>
          )}

          {/* Social Activity Notifications */}
          {activityNotifs.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: requests.length > 0 ? 16 : 0 }]}>ACTIVITY</Text>
              {activityNotifs.map((notif, idx) => {
                const isConnNotif = notif.ref_type === 'connection' || notif.title?.toLowerCase().includes('connection') || notif.title?.toLowerCase().includes('follow');
                const targetStudentId = notif.ref_id || notif.sender_id;
                return (
                  <TouchableOpacity
                    key={notif.id || idx}
                    style={[styles.requestCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', opacity: notif.is_read ? 0.65 : 1 }]}
                    onPress={() => {
                      if (isConnNotif && targetStudentId) {
                        navigation.navigate('OtherStudentProfile', {
                          student: {
                            id: targetStudentId,
                            user_id: targetStudentId,
                            name: notif.title || 'Student Profile',
                          }
                        });
                      }
                    }}
                  >
                    <View style={[{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(234,88,12,0.15)' : '#FFF7ED' }]}>
                      <Ionicons
                        name={notif.title?.includes('comment') ? 'chatbubble-outline' : notif.title?.includes('repost') ? 'repeat-outline' : 'heart-outline'}
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.info}>
                      <Text style={[styles.username, { color: colors.textPrimary, fontWeight: notif.is_read ? '500' : '700' }]}>{notif.title || 'Social activity'}</Text>
                      {notif.body ? (
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={2}>{notif.body}</Text>
                      ) : null}
                      <Text style={{ fontSize: 11, color: colors.textMuted || '#9CA3AF', marginTop: 4 }}>
                        {formatNotifTime(notif.created_at)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {requests.length === 0 && activityNotifs.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted || '#D1D5DB'} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No notifications yet</Text>
            </View>
          )}
        </ScrollView>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
    color: '#6B7280',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  message: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    backgroundColor: '#8B4B00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  acceptText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default NotificationsScreen;
