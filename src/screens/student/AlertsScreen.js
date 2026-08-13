import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, Modal, Pressable, Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_CONFIG } from '../../config/appConfig';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';
import { getAlerts, markAllAlertsRead, markAlertRead, getAdminGeneralNotifications } from '../../data/apiService';

const { width } = Dimensions.get('window');
const TABS = ['All Updates', 'Social', 'Marketplace', 'Announcements'];

const AlertsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('All Updates');
  const { colors, isDark } = useTheme();
  const { accessToken, user } = useUser();
  const { markAlertsAsRead, refreshUnreadCounts } = useNotifications();

  const [apiAlerts, setApiAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const loadAlerts = React.useCallback(async (isRefresh = false) => {
    if (!accessToken) { setLoading(false); setRefreshing(false); return; }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      // 1. Fetch backend alerts
      const res = await getAlerts(accessToken);
      const backendAlerts = res?.data || [];

      // 2. Fetch ERP general notifications
      const erpAnnouncements = await getAdminGeneralNotifications();
      let readErpIds = [];
      try {
        readErpIds = JSON.parse(await AsyncStorage.getItem('read_erp_announcements') || '[]');
      } catch {}

      const studentBatch = String(user?.batch_year || user?.batch || '').trim();

      const mappedErp = erpAnnouncements
        .filter(a => {
          const targetBatch = String(a.batch || '').trim();
          if (!targetBatch || targetBatch === '0' || targetBatch.toLowerCase() === 'null') {
            return true;
          }
          return studentBatch ? (targetBatch === studentBatch) : true;
        })
        .map(a => ({
          ...a,
          is_read: readErpIds.includes(a.id)
        }));

      // 3. Combine and sort by date descending
      const combined = [...backendAlerts, ...mappedErp].sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });

      setApiAlerts(combined);
      refreshUnreadCounts();
    } catch (e) {
      console.log('Error loading alerts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, user, refreshUnreadCounts]);

  const onRefresh = React.useCallback(() => {
    loadAlerts(true);
  }, [loadAlerts]);

  useEffect(() => {
    loadAlerts(false);
  }, [loadAlerts]);

  const handleMarkAllRead = async () => {
    try {
      if (accessToken) await markAllAlertsRead(accessToken);
      const erpIds = apiAlerts.filter(a => a.id.startsWith('erp-announcement-')).map(a => a.id);
      const readIds = JSON.parse(await AsyncStorage.getItem('read_erp_announcements') || '[]');
      const newReadIds = Array.from(new Set([...readIds, ...erpIds]));
      await AsyncStorage.setItem('read_erp_announcements', JSON.stringify(newReadIds));
    } catch {}
    setApiAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    markAlertsAsRead(0); // clear all unread alert counts
    setTimeout(() => {
      refreshUnreadCounts();
    }, 300);
  };

  const handleAlertTap = async (notif) => {
    // Mark as read optimistically
    if (notif.isNew) {
      if (String(notif.id).startsWith('erp-announcement-')) {
        try {
          const readIds = JSON.parse(await AsyncStorage.getItem('read_erp_announcements') || '[]');
          if (!readIds.includes(notif.id)) {
            readIds.push(notif.id);
            await AsyncStorage.setItem('read_erp_announcements', JSON.stringify(readIds));
          }
        } catch {}
      } else if (accessToken) {
        markAlertRead(accessToken, notif.id).catch(() => {});
      }
      setApiAlerts(prev => prev.map(a => a.id === notif.id ? { ...a, is_read: true } : a));
      markAlertsAsRead(1); // decrement by 1
      setTimeout(() => {
        refreshUnreadCounts();
      }, 300);
    }
    
    if (String(notif.id).startsWith('erp-announcement-')) {
      setSelectedAnnouncement(notif);
    } else {
      navigateAlert(notif);
    }
  };

  const navigateAlert = (notif) => {
    const raw = notif.raw || {};
    const type = notif.type;
    const subType = notif.subType;

    if (type === 'social') {
      // Like / comment / reaction / repost → Community tab
      if (subType === 'like' || subType === 'comment' || subType === 'reaction' || subType === 'repost') {
        navigation.navigate('Community');
        return;
      }
      // DM / message → Chat screen, then open DM conversation
      if (subType === 'dm' || subType === 'message') {
        const senderId = raw.sender_id || raw.from_user_id || null;
        const senderUsername = raw.sender_username || raw.sender?.username || null;
        const senderAvatar = raw.sender_avatar || raw.sender?.avatar_url || null;
        if (senderId) {
          navigation.navigate('Chat');
          setTimeout(() => {
            navigation.navigate('DMConversation', {
              contact: {
                user_id: senderId,
                username: senderUsername || senderId,
                avatar_url: senderAvatar || null,
              },
              source: 'social',
            });
          }, 350);
        } else {
          navigation.navigate('Chat');
        }
        return;
      }
      if (subType === 'follow' || subType === 'connection') {
        navigation.navigate('Notifications');
        return;
      }
      // Generic social (follow, mention, etc.) → Community tab
      navigation.navigate('Community');
      return;
    }

    if (type === 'marketplace') {
      // Marketplace enquiry / message → DMConversation with marketplace source
      if (raw.ref_type === 'marketplace_dm' && raw.ref_id) {
        navigation.navigate('Chat');
        setTimeout(() => {
          navigation.navigate('DMConversation', {
            contact: {
              user_id: raw.ref_id,
              username: 'Student', // Will be fetched inside DMConversationScreen
              is_marketplace: true,
            },
            source: 'marketplace',
          });
        }, 350);
      } else {
        navigation.navigate('Marketplace');
      }
      return;
    }

    // Announcements, grade, deadline → no deep-link action needed
  };

  // Dynamic mapping — infer sub-type from title/body for smart routing
  const allNotifs = apiAlerts.map(a => {
    let icon = 'notifications-outline';
    let color = a.urgency === 'high' ? '#EF4444' : a.urgency === 'medium' ? '#F59E0B' : colors.primary;

    if (a.type === 'social') { icon = 'people-outline'; color = '#8B5CF6'; }
    if (a.type === 'marketplace') { icon = 'storefront-outline'; color = '#10B981'; }
    if (a.type === 'announcement') { icon = 'megaphone-outline'; color = '#F59E0B'; }
    if (a.type === 'grade') { icon = 'school-outline'; color = colors.primary; }
    if (a.type === 'deadline') { icon = 'time-outline'; color = '#EF4444'; }

    // Infer sub-type if the API doesn't provide one
    const titleLower = (a.title || '').toLowerCase();
    const bodyLower  = (a.body || a.message || '').toLowerCase();
    let subType = a.sub_type || a.subType || '';
    if (!subType) {
      if (titleLower.includes('liked') || bodyLower.includes('liked') || titleLower.includes('reacted')) subType = 'like';
      else if (titleLower.includes('comment')) subType = 'comment';
      else if (titleLower.includes('repost')) subType = 'repost';
      else if (titleLower.includes('sent you a message') || bodyLower.includes('sent you a message') || titleLower.includes('messaged you')) subType = 'message';
      else if (titleLower.includes('dm ') || bodyLower.includes('direct message')) subType = 'dm';
      else if (titleLower.includes('follow') || titleLower.includes('connection')) subType = 'follow';
      else if (a.type === 'marketplace') subType = 'message';
    }

    const formatAlertTime = (isoString) => {
      if (!isoString) return 'Now';
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Now';

      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();

      const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      if (isToday) {
        return timeStr;
      }

      const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      return `${dateStr}, ${timeStr}`;
    };

    return {
      id: a.id,
      title: a.title || '',
      description: a.body || a.message || '',
      time: formatAlertTime(a.created_at),
      icon,
      color,
      isNew: !a.is_read,
      type: a.type || 'announcement',
      subType,
      raw: a,
      fromAPI: true,
    };
  });

  const filteredNotifs = activeTab === 'All Updates'
    ? allNotifs
    : activeTab === 'Social'
      ? allNotifs.filter(n => n.type === 'social')
      : activeTab === 'Marketplace'
      ? allNotifs.filter(n => n.type === 'marketplace')
      : allNotifs.filter(n => n.type === 'announcement');

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header with Dashboard Style */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.logoIconBg}
          >
            <MaterialIcons name="notifications" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.headerLogo, { color: colors.textPrimary }]}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} Alerts</Text>
        </View>
        <TouchableOpacity
          style={[styles.markAllButton, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border, borderWidth: 1 }]}
          onPress={handleMarkAllRead}
        >
          <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all as read</Text>
        </TouchableOpacity>
      </View>



      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Filter Tabs - Dashboard Style */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabWrapper, { backgroundColor: activeTab === tab ? 'transparent' : colors.card, borderColor: colors.border, borderWidth: activeTab === tab ? 0 : 1 }]}
              onPress={() => setActiveTab(tab)}
            >
              <LinearGradient
                colors={activeTab === tab ? [colors.primary, colors.primaryDark] : ['transparent', 'transparent']}
                style={styles.tab}
              >
                <Text style={[styles.tabText, { color: activeTab === tab ? '#FFFFFF' : colors.textSecondary }]}>
                  {tab}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}


          </ScrollView>
        </View>

        {/* Notification Items */}
        <View style={styles.notifsContainer}>
          <Text style={styles.sectionSubtitle}>
            {filteredNotifs.length} update{filteredNotifs.length !== 1 ? 's' : ''}
          </Text>

          {loading ? (
            [1, 2, 3].map(i => (
              <View key={i} style={[styles.notifCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <View style={[styles.notifIcon, { backgroundColor: colors.border }]} />
                <View style={{ flex: 1, gap: 8 }}>
                  <View style={{ height: 14, width: '70%', backgroundColor: colors.border, borderRadius: 6 }} />
                  <View style={{ height: 10, width: '90%', backgroundColor: colors.border, borderRadius: 6 }} />
                </View>
              </View>
            ))
          ) : filteredNotifs.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <MaterialIcons name="notifications-none" size={48} color={colors.textMuted} style={{ marginBottom: 16 }} />
              <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '600' }}>No {activeTab === 'All Updates' ? '' : activeTab.toLowerCase() + ' '}updates yet</Text>
            </View>
          ) : (
            filteredNotifs.map((notif, index) => {
              const isErp = String(notif.id).startsWith('erp-announcement-');
              const cardBgColors = isErp
                ? (isDark ? ['#3B2314', '#26140A'] : ['#FFF7ED', '#FFEFD6'])
                : [colors.card, colors.card];
              const cardBorderColor = isErp
                ? '#F97316'
                : (notif.isNew ? colors.primary + '40' : colors.border);

              return (
                <TouchableOpacity key={notif.id} onPress={() => handleAlertTap(notif)}>
                  <LinearGradient
                    colors={cardBgColors}
                    style={[styles.notifCard, { borderColor: cardBorderColor }, index === filteredNotifs.length - 1 && styles.lastNotifCard]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  >
                    <View style={[styles.notifIcon, { backgroundColor: isErp ? '#EA580C20' : notif.color + '15' }]}>
                      <Ionicons name={isErp ? 'megaphone' : notif.icon} size={22} color={isErp ? '#EA580C' : notif.color} />
                      {notif.isNew && <View style={[styles.newDot, { borderColor: isErp ? '#FFF7ED' : colors.card }]} />}
                    </View>
                    <View style={styles.notifContent}>
                      <View style={styles.notifHeader}>
                        <Text style={[styles.notifTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                          {notif.title}
                        </Text>
                        <Text style={[styles.notifTime, { color: colors.textSecondary }]}>{notif.time}</Text>
                      </View>
                      <Text style={[styles.notifDesc, { color: colors.textSecondary }]} numberOfLines={2}>{notif.description}</Text>
                      
                      {isErp && (
                        <View style={styles.tapHint}>
                          <Ionicons name="eye-outline" size={12} color="#EA580C" />
                          <Text style={[styles.tapHintText, { color: '#EA580C' }]}>Tap to read notice →</Text>
                        </View>
                      )}

                      {/* Tap hint for actionable alerts */}
                      {!isErp && (notif.type === 'social' || notif.type === 'marketplace') && (
                        <View style={styles.tapHint}>
                          <Ionicons
                            name={
                              notif.type === 'marketplace' ? 'chatbubble-ellipses-outline' :
                              (notif.subType === 'like' || notif.subType === 'comment' || notif.subType === 'reaction') ? 'open-outline' :
                              'chatbubble-outline'
                            }
                            size={11}
                            color={notif.color}
                          />
                          <Text style={[styles.tapHintText, { color: notif.color }]}>
                            {notif.type === 'marketplace' ? 'Open chat →' :
                             (notif.subType === 'like' || notif.subType === 'comment' || notif.subType === 'reaction') ? 'View post →' :
                             (notif.subType === 'dm' || notif.subType === 'message') ? 'Open message →' :
                             'View →'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ERP Announcement Modal Overlay */}
      <Modal
        visible={!!selectedAnnouncement}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAnnouncement(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedAnnouncement(null)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBg, { backgroundColor: '#EA580C15' }]}>
                <Ionicons name="megaphone" size={24} color="#EA580C" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {selectedAnnouncement?.title}
                </Text>
                <Text style={[styles.modalTime, { color: colors.textSecondary }]}>
                  Date Posted: {selectedAnnouncement?.time}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedAnnouncement(null)}
                style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]}
              >
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalBodyText, { color: colors.textPrimary }]}>
                {selectedAnnouncement?.description}
              </Text>
              
              {selectedAnnouncement?.raw?.attachment && (
                <TouchableOpacity
                  style={styles.attachmentButton}
                  onPress={() => {
                    Linking.openURL(selectedAnnouncement.raw.attachment).catch(err => {
                      console.warn("Could not open attachment URL", err);
                    });
                  }}
                >
                  <Ionicons name="document-attach-outline" size={18} color="#EA580C" style={{ marginRight: 8 }} />
                  <Text style={styles.attachmentButtonText}>View Attachment</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalCloseAction, { backgroundColor: colors.primary }]}
              onPress={() => setSelectedAnnouncement(null)}
            >
              <Text style={styles.modalCloseActionText}>Dismiss Notice</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
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

  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  urgentCardWrap: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  urgentCard: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
  },

  urgentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  urgentIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  urgentIconBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  urgentTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  urgentDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },

  urgentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },

  avatarOverlap: {
    marginLeft: -8,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarCount: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 12,
  },
  reviewBtn: {
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  reviewBtnGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  reviewBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  tabWrapper: {
    borderRadius: 40,
    overflow: 'hidden',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 40,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },

  notifsContainer: {
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  notifCard: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 16,
    borderWidth: 1,
  },

  lastNotifCard: {
    marginBottom: 0,
  },
  notifIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  newDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EA580C',
    borderWidth: 2,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },

  notifTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  notifDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  tapHintText: {
    fontSize: 12,
    fontWeight: '700',
  },
  notifLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalTime: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    marginBottom: 24,
    maxHeight: 300,
  },
  modalBodyText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
  },
  modalCloseAction: {
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  modalCloseActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EA580C10',
    marginTop: 16,
    borderColor: '#EA580C30',
    borderWidth: 1,
  },
  attachmentButtonText: {
    color: '#EA580C',
    fontWeight: '700',
    fontSize: 14,
  },
});


export default AlertsScreen;