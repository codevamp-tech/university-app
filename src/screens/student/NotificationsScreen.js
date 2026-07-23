import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';
import { getPendingRequestsAPI, acceptRequestAPI, getAllStudents } from '../../data/apiService';
import { getAvatarUrl } from '../../utils/avatar';
import { useTheme } from '../../hooks/useTheme';

const NotificationsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { accessToken } = useUser();
  const { markRequestsAsRead, refreshUnreadCounts } = useNotifications();
  const { colors, isDark } = useTheme();
  const [requests, setRequests] = useState([]);
  const [studentMap, setStudentMap] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getPendingRequestsAPI(accessToken);
      setRequests(data);
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
    // Priority: API full_name → student directory name/full_name → generic fallback (never raw username/roll no)
    const displayName = item.full_name || item.name
      || dirStudent?.full_name || dirStudent?.name
      || 'Student';
    const avatarUrl = item.avatar_url || dirStudent?.avatar || getAvatarUrl(item.username);

    return (
      <View style={[styles.requestCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
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

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequest}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted || '#D1D5DB'} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{loading ? 'Loading...' : 'No new notifications'}</Text>
          </View>
        }
      />
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
