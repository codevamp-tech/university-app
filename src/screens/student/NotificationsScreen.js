import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  getPendingRequestsAPI, acceptRequestAPI, declineRequestAPI,
  getAlerts, markAlertRead, markAllAlertsRead,
} from '../../data/apiService';
import { SafeStudentAvatar } from '../../components/SafeStudentAvatar';
import { useTheme } from '../../hooks/useTheme';

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getNotifMeta(notif) {
  const type = notif.type || '';
  const subType = notif.subType || notif.sub_type || '';
  const title = (notif.title || '').toLowerCase();

  if (type === 'social' || notif._source === 'social') {
    if (subType === 'like' || title.includes('liked') || title.includes('reacted'))
      return { icon: 'heart', color: '#EF4444', label: 'Liked your post' };
    if (subType === 'comment' || title.includes('comment'))
      return { icon: 'chatbubble', color: '#3B82F6', label: 'Commented on your post' };
    if (subType === 'repost' || title.includes('repost'))
      return { icon: 'repeat', color: '#10B981', label: 'Reposted your post' };
    if (subType === 'follow' || subType === 'connection' || title.includes('follow'))
      return { icon: 'person-add', color: '#8B5CF6', label: 'Started following you' };
    if (subType === 'dm' || subType === 'message' || title.includes('message'))
      return { icon: 'chatbubble-ellipses', color: '#F59E0B', label: 'Sent you a message' };
    if (subType === 'reaction' || title.includes('reaction'))
      return { icon: 'happy', color: '#F59E0B', label: 'Reacted to your post' };
  }
  return { icon: 'notifications', color: '#6B7280', label: notif.title || 'Notification' };
}

// ─── Component ──────────────────────────────────────────────────────────────

const NotificationsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { accessToken } = useUser();
  const { markRequestsAsRead, markAlertsAsRead, refreshUnreadCounts } = useNotifications();
  const { colors, isDark } = useTheme();

  const [requests, setRequests] = useState([]);
  const [socialNotifs, setSocialNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const load = useCallback(async (isRefresh = false) => {
    if (!accessToken) { setLoading(false); setRefreshing(false); return; }
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [pendingRes, alertsRes] = await Promise.all([
        getPendingRequestsAPI(accessToken).catch(() => []),
        getAlerts(accessToken, 0, 50).catch(() => ({ data: [] })),
      ]);

      setRequests(Array.isArray(pendingRes) ? pendingRes : []);

      // Only social-source alerts belong here
      const social = (alertsRes?.data || [])
        .filter(a => a.type === 'social' || a._source === 'social')
        .map(a => {
          const title = (a.title || '').toLowerCase();
          let subType = a.sub_type || a.subType || '';
          if (!subType) {
            if (title.includes('liked') || title.includes('reacted')) subType = 'like';
            else if (title.includes('comment')) subType = 'comment';
            else if (title.includes('repost')) subType = 'repost';
            else if (title.includes('message') || title.includes('dm')) subType = 'dm';
            else if (title.includes('follow') || title.includes('connection')) subType = 'follow';
            else if (title.includes('reaction')) subType = 'reaction';
          }
          return { ...a, subType };
        })
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

      setSocialNotifs(social);
      refreshUnreadCounts();
    } catch (e) {
      console.warn('NotificationsScreen load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, refreshUnreadCounts]);

  useEffect(() => { load(); }, [load]);

  const handleAccept = async (req) => {
    try {
      await acceptRequestAPI(accessToken, req.id);
      markRequestsAsRead(1);
      setRequests(prev => prev.filter(r => r.id !== req.id));
      refreshUnreadCounts();
    } catch {
      Alert.alert('Error', 'Failed to accept request. Please try again.');
    }
  };

  const handleDecline = async (req) => {
    try {
      await declineRequestAPI(accessToken, req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));
      refreshUnreadCounts();
    } catch {
      Alert.alert('Error', 'Failed to decline request.');
    }
  };

  const handleSocialTap = async (notif) => {
    if (!notif.is_read) {
      markAlertRead(accessToken, notif.id).catch(() => {});
      setSocialNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      markAlertsAsRead(1);
      setTimeout(() => refreshUnreadCounts(), 300);
    }
    const sub = notif.subType;
    if (sub === 'like' || sub === 'comment' || sub === 'repost' || sub === 'reaction') {
      navigation.navigate('Community');
    } else if (sub === 'dm' || sub === 'message') {
      navigation.navigate('Chat');
    } else {
      navigation.navigate('Community');
    }
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderConnectionRequest = ({ item }) => {
    const displayName = item.full_name || item.name || 'Student';
    const avatarUrl = item.avatar_url || null;

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SafeStudentAvatar
          uri={avatarUrl}
          rollno={item.username}
          name={displayName}
          style={styles.avatar}
          primaryColor={colors.primary}
        />
        <View style={styles.cardContent}>
          <Text style={[styles.cardName, { color: colors.textPrimary }]} numberOfLines={1}>
            {displayName}
          </Text>
          {item.username && item.username !== displayName && (
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
              @{item.username}
            </Text>
          )}
          <Text style={[styles.cardMsg, { color: colors.textSecondary }]}>
            Wants to follow you
          </Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
            onPress={() => handleAccept(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.declineBtn, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}
            onPress={() => handleDecline(item)}
            activeOpacity={0.8}
          >
            <Text style={[styles.declineText, { color: colors.textSecondary }]}>Ignore</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSocialNotif = ({ item }) => {
    const { icon, color, label } = getNotifMeta(item);
    const isUnread = !item.is_read;
    const senderName = item.sender_name || item.from_name || item.title || 'Someone';

    return (
      <TouchableOpacity
        onPress={() => handleSocialTap(item)}
        activeOpacity={0.8}
      >
        <View style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: isUnread ? color + '40' : colors.border },
          isUnread && { backgroundColor: isDark ? color + '15' : color + '08' },
        ]}>
          {/* Icon badge */}
          <View style={[styles.notifIconBg, { backgroundColor: color + '18' }]}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardName, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.title || senderName}
            </Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.body || item.message || label}
            </Text>
            <Text style={[styles.cardTime, { color: colors.textMuted || colors.textSecondary }]}>
              {timeAgo(item.created_at)}
            </Text>
          </View>
          {isUnread && (
            <View style={[styles.unreadDot, { backgroundColor: color }]} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Tab data ─────────────────────────────────────────────────────────────

  const TABS = [
    { key: 'All', label: 'All' },
    { key: 'Requests', label: `Requests${requests.length > 0 ? ` (${requests.length})` : ''}` },
    { key: 'Activity', label: 'Activity' },
  ];

  const showRequests = activeTab === 'All' || activeTab === 'Requests';
  const showSocial = activeTab === 'All' || activeTab === 'Activity';

  const combinedData = [];
  if (showRequests && requests.length > 0) {
    combinedData.push({ _type: 'section', _id: 'sec-req', label: 'Follow Requests' });
    requests.forEach(r => combinedData.push({ _type: 'request', _id: r.id, ...r }));
  }
  if (showSocial && socialNotifs.length > 0) {
    combinedData.push({ _type: 'section', _id: 'sec-act', label: 'Activity' });
    socialNotifs.forEach(n => combinedData.push({ _type: 'social', _id: n.id, ...n }));
  }

  const isEmpty = combinedData.length === 0 && !loading;

  const renderItem = ({ item }) => {
    if (item._type === 'section') {
      return (
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {item.label.toUpperCase()}
        </Text>
      );
    }
    if (item._type === 'request') return renderConnectionRequest({ item });
    if (item._type === 'social') return renderSocialNotif({ item });
    return null;
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
        {socialNotifs.some(n => !n.is_read) ? (
          <TouchableOpacity
            onPress={async () => {
              await markAllAlertsRead(accessToken).catch(() => {});
              setSocialNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
              markAlertsAsRead(0);
              setTimeout(() => refreshUnreadCounts(), 300);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabBtn}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, { color: isActive ? colors.primary : colors.textSecondary, fontWeight: isActive ? '700' : '500' }]}>
                {tab.label}
              </Text>
              {isActive && (
                <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.skeletonWrap}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={[styles.card, styles.skeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.skeletonCircle, { backgroundColor: colors.border }]} />
              <View style={{ flex: 1, gap: 8 }}>
                <View style={[styles.skeletonLine, { width: '55%', backgroundColor: colors.border }]} />
                <View style={[styles.skeletonLine, { width: '80%', backgroundColor: colors.border }]} />
              </View>
            </View>
          ))}
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyWrap}>
          <MaterialCommunityIcons name="bell-sleep-outline" size={56} color={colors.textMuted || colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>You're all caught up!</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Likes, comments, follow requests and other activity will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={combinedData}
          keyExtractor={item => String(item._id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  markAllText: { fontSize: 12, fontWeight: '700' },

  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabText: { fontSize: 13 },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2.5,
    borderRadius: 2,
  },

  list: { padding: 16, gap: 10 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    flexShrink: 0,
  },
  notifIconBg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  cardContent: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', marginBottom: 1 },
  cardSub: { fontSize: 12, lineHeight: 16, marginBottom: 2 },
  cardMsg: { fontSize: 12, marginTop: 1 },
  cardTime: { fontSize: 11, marginTop: 3 },

  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    flexShrink: 0,
    alignSelf: 'flex-start',
    marginTop: 4,
  },

  cardActions: { flexDirection: 'column', gap: 6, alignItems: 'stretch', minWidth: 72 },
  acceptBtn: {
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  acceptText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  declineBtn: {
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  declineText: { fontWeight: '700', fontSize: 12 },

  skeletonWrap: { padding: 16, gap: 10 },
  skeleton: { opacity: 0.5 },
  skeletonCircle: { width: 46, height: 46, borderRadius: 23 },
  skeletonLine: { height: 10, borderRadius: 6 },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

export default NotificationsScreen;
