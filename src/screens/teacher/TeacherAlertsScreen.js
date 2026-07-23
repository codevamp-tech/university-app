import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
  ActivityIndicator, RefreshControl, Modal, Pressable, Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';
import { getAlerts, markAllAlertsRead, markAlertRead, getAdminGeneralNotifications } from '../../data/apiService';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');
const TABS = ['All Updates', 'Announcements', 'Deadlines'];

const TeacherAlertsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { accessToken } = useUser();
  const { markAlertsAsRead, refreshUnreadCounts } = useNotifications();

  const [activeTab, setActiveTab] = useState('All Updates');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const loadAlerts = useCallback(async (isRefresh = false) => {
    if (!accessToken) { setLoading(false); setRefreshing(false); return; }
    if (!isRefresh) setLoading(true);
    try {
      // 1. Fetch backend alerts
      const res = await getAlerts(accessToken);
      const backendAlerts = res?.data || [];

      // 2. Fetch ERP general notifications (same source as student AlertsScreen)
      const erpAnnouncements = await getAdminGeneralNotifications();
      let readErpIds = [];
      try {
        readErpIds = JSON.parse(await AsyncStorage.getItem('read_erp_announcements_teacher') || '[]');
      } catch {}

      const mappedErp = erpAnnouncements.map(a => ({
        ...a,
        is_read: readErpIds.includes(a.id),
      }));

      // 3. Combine and sort by date descending
      const combined = [...backendAlerts, ...mappedErp].sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });

      setAlerts(combined);
      refreshUnreadCounts();
    } catch (e) {
      console.warn('Error loading teacher alerts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, refreshUnreadCounts]);

  const onRefresh = useCallback(() => {
    loadAlerts(true);
  }, [loadAlerts]);

  useEffect(() => {
    loadAlerts(false);
  }, [loadAlerts]);

  const handleMarkAllRead = async () => {
    if (!accessToken) return;
    try {
      await markAllAlertsRead(accessToken);
      // Also mark ERP announcements as read locally
      const erpIds = alerts.filter(a => String(a.id).startsWith('erp-announcement-')).map(a => a.id);
      const stored = JSON.parse(await AsyncStorage.getItem('read_erp_announcements_teacher') || '[]');
      await AsyncStorage.setItem('read_erp_announcements_teacher', JSON.stringify(Array.from(new Set([...stored, ...erpIds]))));
    } catch (e) {
      console.warn(e);
    }
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    markAlertsAsRead(0);
    setTimeout(() => {
      refreshUnreadCounts();
    }, 300);
  };

  const handleAlertTap = async (alert) => {
    const isErp = String(alert.id).startsWith('erp-announcement-');

    if (!alert.is_read) {
      if (isErp) {
        try {
          const stored = JSON.parse(await AsyncStorage.getItem('read_erp_announcements_teacher') || '[]');
          if (!stored.includes(alert.id)) {
            stored.push(alert.id);
            await AsyncStorage.setItem('read_erp_announcements_teacher', JSON.stringify(stored));
          }
        } catch {}
      } else if (accessToken) {
        markAlertRead(accessToken, alert.id).catch(() => {});
      }
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, is_read: true } : a));
      markAlertsAsRead(1);
      setTimeout(() => {
        refreshUnreadCounts();
      }, 300);
    }

    if (isErp) {
      setSelectedAnnouncement(alert);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    const titleLower = (a.title || '').toLowerCase();
    const bodyLower = (a.body || a.description || '').toLowerCase();
    const isDeadline = a.type === 'deadline' || titleLower.includes('deadline') || titleLower.includes('due') || bodyLower.includes('deadline') || bodyLower.includes('due');

    if (activeTab === 'Announcements') return !isDeadline;
    if (activeTab === 'Deadlines') return isDeadline;
    return true;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Campus Alerts</Text>
          <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAllRead}>
            <Text style={styles.markReadText}>Mark Read</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(tab => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, isActive && styles.activeTabBtn]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabBtnText, isActive && styles.activeTabBtnText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadAlerts(true); }}
              colors={['#EA580C']}
              tintColor="#EA580C"
            />
          }
        >
          {filteredAlerts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No alerts found</Text>
              <Text style={styles.emptySub}>Announcements from the admin panel will appear here.</Text>
            </View>
          ) : (
            filteredAlerts.map((alert) => {
              const isErp = String(alert.id).startsWith('erp-announcement-');
              const isDeadline = alert.type === 'deadline' || (alert.title || '').toLowerCase().includes('deadline') || (alert.title || '').toLowerCase().includes('due');
              const iconName = isErp ? 'megaphone-outline' : (isDeadline ? 'time-outline' : 'megaphone-outline');
              const iconColor = isErp ? '#EA580C' : (isDeadline ? '#EF4444' : '#F59E0B');
              const timeStr = alert.created_at ? new Date(alert.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Now';
              const bodyText = alert.body || alert.description || '';

              return (
                <TouchableOpacity
                  key={alert.id}
                  activeOpacity={0.9}
                  onPress={() => handleAlertTap(alert)}
                >
                  <LinearGradient
                    colors={isErp ? ['#FFF7ED', '#FFEFD6'] : ['#FFFFFF', '#F9FAFB']}
                    style={[
                      styles.alertCard,
                      !alert.is_read && styles.unreadCard,
                      isErp && styles.erpCard,
                    ]}
                  >
                    <View style={[styles.iconBg, { backgroundColor: iconColor + '20' }]}>
                      <Ionicons name={iconName} size={22} color={iconColor} />
                      {!alert.is_read && <View style={[styles.newDot, { backgroundColor: iconColor }]} />}
                    </View>

                    <View style={styles.content}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.title} numberOfLines={1}>
                          {alert.title}
                        </Text>
                        <Text style={styles.time}>{timeStr}</Text>
                      </View>
                      <Text style={styles.body} numberOfLines={2}>
                        {bodyText}
                      </Text>
                      {isErp && (
                        <View style={styles.tapHint}>
                          <Ionicons name="eye-outline" size={12} color="#EA580C" />
                          <Text style={styles.tapHintText}>Tap to read notice →</Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ERP Announcement Modal */}
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBg}>
                <Ionicons name="megaphone" size={24} color="#EA580C" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalTitle} numberOfLines={2}>
                  {selectedAnnouncement?.title}
                </Text>
                <Text style={styles.modalTime}>
                  Date Posted: {selectedAnnouncement ? new Date(selectedAnnouncement.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedAnnouncement(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalBodyText}>
                {selectedAnnouncement?.body || selectedAnnouncement?.description || ''}
              </Text>

              {/* View Attachment — only shown when an attachment URL exists */}
              {selectedAnnouncement?.attachment && (
                <TouchableOpacity
                  style={styles.attachmentButton}
                  onPress={() => {
                    Linking.openURL(selectedAnnouncement.attachment).catch(err => {
                      console.warn('Could not open attachment URL', err);
                    });
                  }}
                >
                  <Ionicons name="document-attach-outline" size={18} color="#EA580C" style={{ marginRight: 8 }} />
                  <Text style={styles.attachmentButtonText}>View Attachment</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseAction}
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
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  markReadBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.15)' },
  markReadText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 20, marginVertical: 16, gap: 10 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  activeTabBtn: { backgroundColor: '#EA580C', borderColor: '#EA580C' },
  tabBtnText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  activeTabBtnText: { color: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280', fontWeight: '500' },
  scroll: { paddingHorizontal: 20 },
  emptyCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 40,
    alignItems: 'center', borderWidth: 1, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
    marginTop: 20,
  },
  emptyText: { fontSize: 16, fontWeight: '800', color: '#4B5563', marginBottom: 4 },
  emptySub: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
  alertCard: {
    flexDirection: 'row', padding: 16, borderRadius: 20, marginBottom: 12,
    borderWidth: 1, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
  },
  unreadCard: { borderColor: 'rgba(234, 88, 12, 0.25)' },
  erpCard: { borderColor: '#F97316' },
  iconBg: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  newDot: { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4 },
  content: { flex: 1, marginLeft: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 14, fontWeight: '800', color: '#111827', flex: 1, marginRight: 8 },
  time: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  body: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  tapHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  tapHintText: { fontSize: 11, fontWeight: '700', color: '#EA580C' },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: 28,
    padding: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  modalIconBg: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#EA580C15',
  },
  modalTitle: { fontSize: 15, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  modalTime: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginTop: 2 },
  closeButton: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  modalBody: { marginBottom: 24, maxHeight: 300 },
  modalBodyText: { fontSize: 15, lineHeight: 24, fontWeight: '500', color: '#374151' },
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
  attachmentButtonText: { color: '#EA580C', fontWeight: '700', fontSize: 14 },
  modalCloseAction: {
    borderRadius: 20, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EA580C', elevation: 2,
  },
  modalCloseActionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

export default TeacherAlertsScreen;
