import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getWardenPendingOutpasses, getWardenAllOutpasses, actionWardenOutpass } from '../../data/apiService';

const WardenOutpassesScreen = () => {
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();
  const [outpasses, setOutpasses] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  const [loading, setLoading] = useState(true);

  const fetchOutpasses = async () => {
    setLoading(true);
    try {
      if (accessToken) {
        let data = [];
        if (activeTab === 'pending') {
          data = await getWardenPendingOutpasses(accessToken);
        } else {
          data = await getWardenAllOutpasses(accessToken);
        }
        setOutpasses(data || []);
      }
    } catch (err) {
      console.warn('[WardenOutpass] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutpasses();
  }, [activeTab, accessToken]);

  const handleAction = (id, status) => {
    Alert.alert(
      `${status === 'approved' ? 'Approve' : 'Reject'} Outpass`,
      `Are you sure you want to mark this outpass as ${status}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const res = await actionWardenOutpass(accessToken, id, status);
              if (res) {
                Alert.alert('Success', `Outpass successfully ${status}.`);
                fetchOutpasses();
              }
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to update outpass.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isPending = item.status?.toLowerCase() === 'pending';
    
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.studentInfo}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {item.studentName?.charAt(0).toUpperCase() || 'S'}
              </Text>
            </View>
            <View>
              <Text style={[styles.studentName, { color: colors.textPrimary }]}>{item.studentName || 'Student'}</Text>
              <Text style={[styles.studentMeta, { color: colors.textSecondary }]}>Roll No: {item.student_id?.slice(0, 8)}...</Text>
            </View>
          </View>
          <View style={[
            styles.statusBadge, 
            { 
              backgroundColor: 
                item.status === 'Approved' ? colors.successLight : 
                item.status === 'Rejected' ? colors.dangerLight : colors.warningLight 
            }
          ]}>
            <Text style={[
              styles.statusText, 
              { 
                color: 
                  item.status === 'Approved' ? colors.success : 
                  item.status === 'Rejected' ? colors.danger : colors.warning 
              }
            ]}>
              {item.status || 'Pending'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Feather name="map-pin" size={14} color={colors.textSecondary} style={styles.detailIcon} />
          <Text style={[styles.detailText, { color: colors.textPrimary }]}>
            Destination: <Text style={{ fontWeight: '600' }}>{item.reason?.split(';')[1] || 'Campus Gate Out'}</Text>
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Feather name="calendar" size={14} color={colors.textSecondary} style={styles.detailIcon} />
          <Text style={[styles.detailText, { color: colors.textPrimary }]}>
            Exit Time: <Text style={{ fontWeight: '600' }}>{item.from || 'N/A'}</Text>
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Feather name="clock" size={14} color={colors.textSecondary} style={styles.detailIcon} />
          <Text style={[styles.detailText, { color: colors.textPrimary }]}>
            Return Time: <Text style={{ fontWeight: '600' }}>{item.to || 'N/A'}</Text>
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Feather name="file-text" size={14} color={colors.textSecondary} style={styles.detailIcon} />
          <Text style={[styles.detailText, { color: colors.textPrimary }]}>
            Reason: <Text style={{ fontStyle: 'italic' }}>{item.reason?.split(';')[0] || item.reason || 'N/A'}</Text>
          </Text>
        </View>

        {isPending && (
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.rejectBtn, { backgroundColor: colors.dangerLight }]} 
              onPress={() => handleAction(item.id, 'rejected')}
            >
              <Feather name="x" size={16} color={colors.danger} style={{ marginRight: 6 }} />
              <Text style={[styles.btnText, { color: colors.danger }]}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, styles.approveBtn, { backgroundColor: colors.success }]} 
              onPress={() => handleAction(item.id, 'approved')}
            >
              <Feather name="check" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={[styles.btnText, { color: '#FFF' }]}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Page Title */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Outpass Approvals</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Review hostel entry and exit gatepasses</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'pending' ? colors.primary : colors.textSecondary },
            activeTab === 'pending' && styles.activeTabText
          ]}>
            Pending Review
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'history' ? colors.primary : colors.textSecondary },
            activeTab === 'history' && styles.activeTabText
          ]}>
            All History
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 12 }]}>Loading requests...</Text>
        </View>
      ) : outpasses.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textPrimary, marginTop: 16 }]}>No outpass requests found</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary, marginTop: 6 }]}>All requests are caught up!</Text>
        </View>
      ) : (
        <FlatList
          data={outpasses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 48,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
  },
  list: {
    padding: 20,
    paddingBottom: 90,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
  },
  studentMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
    opacity: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 8,
    width: 16,
  },
  detailText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  rejectBtn: {},
  approveBtn: {},
});

export default WardenOutpassesScreen;
