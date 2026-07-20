import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  Image,
  TextInput,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { listGrievancesAPI, updateGrievanceStatusAPI } from '../../data/apiService';

const CATEGORIES = ['All', 'Hostel', 'Academics', 'Canteen', 'Transport', 'Library', 'Other'];
const STATUSES = ['all', 'pending', 'in_progress', 'resolved'];

const AdminGrievanceInboxScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('all');
  const [activeCategory, setActiveCategory] = useState('All');

  // Status Update Modal
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [adminRemark, setAdminRemark] = useState('');

  const fetchGrievances = async () => {
    setLoading(true);
    try {
      if (accessToken) {
        // Map UI category 'All' to empty string for API
        const cat = activeCategory === 'All' ? '' : activeCategory.toLowerCase();
        // Map UI status 'all' to empty string for API
        const stat = activeStatus === 'all' ? '' : activeStatus;

        const data = await listGrievancesAPI(accessToken, cat, stat);
        setGrievances(data || []);
      }
    } catch (err) {
      console.warn('[GrievanceInbox] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, [activeStatus, activeCategory, accessToken]);

  const openStatusModal = (item) => {
    setSelectedGrievance(item);
    setAdminRemark(item?.admin_remarks || '');
    setStatusModalVisible(true);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedGrievance) return;
    setActionInProgress(true);
    try {
      const res = await updateGrievanceStatusAPI(accessToken, selectedGrievance.id, newStatus, adminRemark);
      if (res) {
        setStatusModalVisible(false);
        Alert.alert('Status Updated', `Grievance has been marked as ${newStatus.replace('_', ' ')}.`);
        fetchGrievances();
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update grievance status.');
    } finally {
      setActionInProgress(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return colors.danger;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const renderItem = ({ item }) => {
    const createdDate = item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Today';

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => openStatusModal(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.categoryRow}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.categoryText, { color: colors.primary }]}>{item.category || 'Support'}</Text>
            </View>
            <View style={[styles.priorityBadge, { borderColor: getPriorityColor(item.priority) }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                {item.priority?.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'resolved' ? colors.successLight :
                  item.status === 'in_progress' ? colors.orangeLight : colors.dangerLight
            }
          ]}>
            <Text style={[
              styles.statusText,
              {
                color:
                  item.status === 'resolved' ? colors.success :
                    item.status === 'in_progress' ? colors.orange : colors.danger
              }
            ]}>
              {item.status?.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <Text style={[styles.subject, { color: colors.textPrimary }]}>{item.subject}</Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>

        <View style={styles.cardFooter}>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            Student ID: {item.student_id?.slice(0, 8)}...
          </Text>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {createdDate}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  console.log("selectedGrievance", selectedGrievance);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Title */}
      <View style={[styles.header, { flexDirection: 'row', alignItems: 'flex-start' }]}>
        {navigation && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12, marginTop: 4 }}>
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Grievance Inbox</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Address support complaints and academic grievances</Text>
        </View>
      </View>

      {/* Category Horizontal Filter List */}
      <View style={styles.filterListContainer}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalFilters}
          renderItem={({ item }) => {
            const isActive = activeCategory === item;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  isActive ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border }
                ]}
                onPress={() => setActiveCategory(item)}
              >
                <Text style={[
                  styles.filterChipText,
                  { color: isActive ? '#FFF' : colors.textPrimary }
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Status Filter Tab Bar */}
      <View style={[styles.tabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {STATUSES.map((stat) => (
          <TouchableOpacity
            key={stat}
            style={[styles.tab, activeStatus === stat && [styles.activeTab, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveStatus(stat)}
          >
            <Text style={[
              styles.tabText,
              { color: activeStatus === stat ? colors.primary : colors.textSecondary },
              activeStatus === stat && styles.activeTabText
            ]}>
              {stat.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grid List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 12 }]}>Loading tickets...</Text>
        </View>
      ) : grievances.length === 0 ? (
        <View style={styles.center}>
          <Feather name="check-circle" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textPrimary, marginTop: 16 }]}>Inbox is clear!</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary, marginTop: 6 }]}>No grievances matched your filters.</Text>
        </View>
      ) : (
        <FlatList
          data={grievances}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Status Modification Modal */}
      <Modal
        visible={statusModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Manage Grievance</Text>

            {selectedGrievance && (
              <View style={styles.modalTicketDetails}>
                <Text style={[styles.modalSubject, { color: colors.textPrimary }]}>{selectedGrievance.subject}</Text>
                <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>{selectedGrievance.description}</Text>
                {(selectedGrievance.attachment_url || (selectedGrievance.description && /(https?:\/\/[^\s]+)/i.test(selectedGrievance.description))) && (
                  <Image
                    source={{ uri: selectedGrievance.attachment_url || selectedGrievance.description.match(/(https?:\/\/[^\s]+)/i)[0] }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                )}
              </View>
            )}

            <Text style={[styles.modalSectionTitle, { color: colors.textPrimary, marginTop: 12 }]}>Admin Remark:</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 10,
                fontSize: 13,
                color: colors.textPrimary,
                backgroundColor: colors.card,
                minHeight: 60,
                textAlignVertical: 'top',
                marginBottom: 16,
              }}
              multiline
              placeholder="Add resolution remark or notes..."
              placeholderTextColor={colors.textMuted}
              value={adminRemark}
              onChangeText={setAdminRemark}
            />

            <Text style={[styles.modalSectionTitle, { color: colors.textPrimary }]}>Update Resolution Status:</Text>

            {actionInProgress ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
            ) : (
              <View style={styles.statusButtonsContainer}>
                <TouchableOpacity
                  style={[styles.statusBtn, { backgroundColor: colors.dangerLight }]}
                  onPress={() => handleUpdateStatus('pending')}
                >
                  <Text style={[styles.statusBtnText, { color: colors.danger }]}>Mark Pending</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusBtn, { backgroundColor: colors.orangeLight }]}
                  onPress={() => handleUpdateStatus('in_progress')}
                >
                  <Text style={[styles.statusBtnText, { color: colors.orange }]}>Move In-Progress</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusBtn, { backgroundColor: colors.successLight }]}
                  onPress={() => handleUpdateStatus('resolved')}
                >
                  <Text style={[styles.statusBtnText, { color: colors.success }]}>Resolve ticket</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: colors.border }]}
              onPress={() => setStatusModalVisible(false)}
              disabled={actionInProgress}
            >
              <Text style={[styles.modalCloseBtnText, { color: colors.textPrimary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  filterListContainer: {
    marginBottom: 8,
  },
  horizontalFilters: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
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
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  subject: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalTicketDetails: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  modalSubject: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 12,
    backgroundColor: '#f0f0f0',
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  statusButtonsContainer: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 20,
  },
  statusBtn: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalCloseBtn: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default AdminGrievanceInboxScreen;
