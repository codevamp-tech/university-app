import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './UserContext';
import { getAlerts, getAdminGeneralNotifications, getPendingRequestsAPI } from '../data/apiService';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { accessToken, user } = useUser();
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [unreadRequestsCount, setUnreadRequestsCount] = useState(0);

  const fetchUnreadCounts = useCallback(async () => {
    if (!accessToken) {
      setUnreadAlertsCount(0);
      setUnreadRequestsCount(0);
      return;
    }

    try {
      let backendUnread = 0;
      let erpUnread = 0;
      let pendingRequestsCount = 0;

      // 1. Fetch backend alerts
      try {
        const res = await getAlerts(accessToken);
        if (res && Array.isArray(res.data)) {
          backendUnread = res.data.filter(a => !a.is_read).length;
        }
      } catch (err) {
        console.log('[NotificationContext] Error loading backend alerts:', err);
      }

      // 2. Fetch ERP general notifications
      try {
        const erpAnnouncements = await getAdminGeneralNotifications();
        let readErpIds = [];
        try {
          const asyncKey = user?.role === 'teacher' ? 'read_erp_announcements_teacher' : 'read_erp_announcements';
          const stored = await AsyncStorage.getItem(asyncKey);
          if (stored) readErpIds = JSON.parse(stored);
        } catch (_) {}

        const studentBatch = String(user?.batch_year || user?.batch || '').trim();
        const filteredErp = erpAnnouncements.filter(a => {
          const targetBatch = String(a.batch || '').trim();
          if (!targetBatch || targetBatch === '0' || targetBatch.toLowerCase() === 'null') {
            return true;
          }
          return studentBatch ? (targetBatch === studentBatch) : true;
        });

        erpUnread = filteredErp.filter(a => !readErpIds.includes(a.id)).length;
      } catch (err) {
        console.log('[NotificationContext] Error loading ERP announcements:', err);
      }

      // 3. Fetch Pending Social Follow Requests (students only)
      if (user?.role !== 'teacher') {
        try {
          const requests = await getPendingRequestsAPI(accessToken);
          if (Array.isArray(requests)) {
            pendingRequestsCount = requests.length;
          }
        } catch (err) {
          console.log('[NotificationContext] Error loading pending requests:', err);
        }
      }

      setUnreadAlertsCount(backendUnread + erpUnread);
      setUnreadRequestsCount(pendingRequestsCount);
    } catch (err) {
      console.warn('[NotificationContext] Error fetching unread counts:', err);
    }
  }, [accessToken, user]);

  useEffect(() => {
    fetchUnreadCounts();
    // Poll every 30 seconds to keep unread badge updated
    const interval = setInterval(fetchUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCounts]);

  const markAlertsAsRead = useCallback((count = null) => {
    if (count === null || count <= 0) {
      setUnreadAlertsCount(0);
    } else {
      setUnreadAlertsCount(prev => Math.max(0, prev - count));
    }
  }, []);

  const markRequestsAsRead = useCallback((count = 1) => {
    setUnreadRequestsCount(prev => Math.max(0, prev - count));
  }, []);

  const totalUnreadCount = unreadAlertsCount + unreadRequestsCount;

  return (
    <NotificationContext.Provider
      value={{
        unreadAlertsCount,
        unreadRequestsCount,
        totalUnreadCount,
        refreshUnreadCounts: fetchUnreadCounts,
        markAlertsAsRead,
        markRequestsAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      unreadAlertsCount: 0,
      unreadRequestsCount: 0,
      totalUnreadCount: 0,
      refreshUnreadCounts: () => {},
      markAlertsAsRead: () => {},
      markRequestsAsRead: () => {},
    };
  }
  return context;
};

/**
 * Reusable Red Notification Count Badge overlay
 */
export const NotificationBadge = ({ count, style, size = 'small' }) => {
  if (!count || count <= 0) return null;

  const displayCount = count > 99 ? '99+' : String(count);
  const isLarge = size === 'large';

  return (
    <View style={[styles.badge, isLarge && styles.badgeLarge, style]}>
      <Text style={[styles.badgeText, isLarge && styles.badgeTextLarge]}>
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
    elevation: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 12,
  },
  badgeLarge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    top: -6,
    right: -8,
  },
  badgeTextLarge: {
    fontSize: 11,
  },
});
