import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../context/UserContext';
import { getAlerts, markAllAlertsRead, markAlertRead } from '../../data/apiService';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');
const TABS = ['All Updates', 'Announcements', 'Deadlines'];

const TeacherAlertsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { accessToken } = useUser();

  const [activeTab, setActiveTab] = useState('All Updates');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlerts = useCallback(async (isRefresh = false) => {
    if (!accessToken) { setLoading(false); setRefreshing(false); return; }
    if (!isRefresh) setLoading(true);
    try {
      const res = await getAlerts(accessToken);
      setAlerts(res?.data || []);
    } catch (e) {
      console.warn('[TeacherAlertsScreen] failed to load alerts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleMarkAllRead = async () => {
    if (!accessToken) return;
    try {
      await markAllAlertsRead(accessToken);
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleAlertTap = async (notif) => {
    if (!notif.is_read && accessToken) {
      try {
        await markAlertRead(accessToken, notif.id);
        setAlerts(prev => prev.map(a => a.id === notif.id ? { ...a, is_read: true } : a));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const filteredAlerts = alerts.filter(a => {
    const titleLower = (a.title || '').toLowerCase();
    const bodyLower = (a.body || '').toLowerCase();
    const isDeadline = a.type === 'deadline' || titleLower.includes('deadline') || titleLower.includes('due') || bodyLower.includes('deadline') || bodyLower.includes('due');
    
    if (activeTab === 'Announcements') {
      return !isDeadline;
    }
    if (activeTab === 'Deadlines') {
      return isDeadline;
    }
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
            filteredAlerts.map((alert, index) => {
              const isDeadline = alert.type === 'deadline' || (alert.title || '').toLowerCase().includes('deadline') || (alert.title || '').toLowerCase().includes('due');
              const iconName = isDeadline ? 'time-outline' : 'megaphone-outline';
              const iconColor = isDeadline ? '#EF4444' : '#F59E0B';
              const timeStr = alert.created_at ? new Date(alert.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Now';

              return (
                <TouchableOpacity
                  key={alert.id}
                  activeOpacity={0.9}
                  onPress={() => handleAlertTap(alert)}
                >
                  <LinearGradient
                    colors={['#FFFFFF', '#F9FAFB']}
                    style={[styles.alertCard, !alert.is_read && styles.unreadCard]}
                  >
                    <View style={[styles.iconBg, { backgroundColor: iconColor + '15' }]}>
                      <Ionicons name={iconName} size={22} color={iconColor} />
                      {!alert.is_read && <View style={styles.newDot} />}
                    </View>

                    <View style={styles.content}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.title} numberOfLines={1}>
                          {alert.title}
                        </Text>
                        <Text style={styles.time}>{timeStr}</Text>
                      </View>
                      <Text style={styles.body} numberOfLines={2}>
                        {alert.body}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  unreadCard: {
    borderColor: 'rgba(234, 88, 12, 0.25)',
  },
  iconBg: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  newDot: { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EA580C' },
  content: { flex: 1, marginLeft: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 14, fontWeight: '850', color: '#111827', flex: 1, marginRight: 8 },
  time: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  body: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
});

export default TeacherAlertsScreen;
