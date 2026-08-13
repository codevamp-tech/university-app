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
  TextInput,
  Linking,
  SafeAreaView,
  Image,
  ScrollView,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getPendingStartups, reviewStartup, getAllStudents } from '../../data/apiService';
import { APP_CONFIG } from '../../config/appConfig';
import { getAvatarUrl } from '../../utils/avatar';

const TABS = ['All', 'Pending', 'Approved', 'Rejected'];

const AdminVentureReviewScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();
  const [ventures, setVentures] = useState([]);
  const [studentMap, setStudentMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  // Rejection Modal State
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedVentureId, setSelectedVentureId] = useState(null);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    if (accessToken) {
      getAllStudents(accessToken)
        .then(students => {
          if (students && Array.isArray(students)) {
            const map = {};
            students.forEach(s => {
              if (s.id) map[s.id.toLowerCase()] = s;
              if (s.user_id) map[s.user_id.toLowerCase()] = s;
              if (s.username) map[s.username.toLowerCase()] = s;
              if (s.rollno) map[s.rollno.toLowerCase()] = s;
              if (s.full_name) map[s.full_name.trim().toLowerCase()] = s;
            });
            setStudentMap(map);
          }
        })
        .catch(err => console.warn('[VentureReview] Failed to load student directory:', err));
    }
  }, [accessToken]);

  const fetchPendingVentures = async () => {
    setLoading(true);
    try {
      if (accessToken) {
        const data = await getPendingStartups(accessToken);
        setVentures(data || []);
      }
    } catch (err) {
      console.warn('[VentureReview] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingVentures();
  }, [accessToken]);

  const handleApprove = (id, name) => {
    Alert.alert(
      'Approve Venture',
      `Are you sure you want to approve '${name}'? It will be published on the Venture Ecosystem leaderboard.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              const res = await reviewStartup(accessToken, id, 'approved', '');
              if (res) {
                Alert.alert('Approved!', `'${name}' has been successfully approved.`);
                fetchPendingVentures();
              }
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to approve venture.');
            }
          },
        },
      ]
    );
  };

  const openRejectModal = (id) => {
    setSelectedVentureId(id);
    setRejectionNotes('');
    setRejectModalVisible(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionNotes.trim()) {
      Alert.alert('Feedback Required', 'Please write a brief reason or feedback for the student.');
      return;
    }

    setActionInProgress(true);
    try {
      const res = await reviewStartup(accessToken, selectedVentureId, 'rejected', rejectionNotes.trim());
      if (res) {
        setRejectModalVisible(false);
        Alert.alert('Rejected', 'Venture pitch has been rejected with your comments.');
        fetchPendingVentures();
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to reject venture.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleOpenLink = async (url) => {
    if (!url) return;
    let formattedUrl = url;

    if (formattedUrl.startsWith('/')) {
      formattedUrl = `${APP_CONFIG.API_BASE_URL}${formattedUrl}`;
    } else if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    try {
      const supported = await Linking.canOpenURL(formattedUrl);
      if (supported) {
        await Linking.openURL(formattedUrl);
      } else {
        Alert.alert('Cannot Open Link', 'The pitch deck URL format is invalid.');
      }
    } catch (e) {
      console.warn('[PitchDeck] Linking failed:', e);
      Alert.alert('Error', 'An error occurred while trying to open the pitch deck.');
    }
  };

  const filteredVentures = ventures.filter(item => {
    const statusStr = (item.approval_status || 'pending_review').toLowerCase();
    if (activeTab === 'Pending') return statusStr === 'pending_review' || statusStr === 'pending';
    if (activeTab === 'Approved') return statusStr === 'approved';
    if (activeTab === 'Rejected') return statusStr === 'rejected';
    return true;
  });

  const renderItem = ({ item }) => {
    const statusStr = (item.approval_status || 'pending_review').toLowerCase();
    const isApproved = statusStr === 'approved';
    const isRejected = statusStr === 'rejected';
    const isPending = !isApproved && !isRejected;

    const founderIdKey = (item.founder_id || '').toLowerCase();
    const founderUserKey = (item.founder_username || '').toLowerCase();
    const founderNameKey = (item.founder_name || '').trim().toLowerCase();

    const student = studentMap[founderIdKey] || studentMap[founderUserKey] || studentMap[founderNameKey] || {};

    const founderName = item.founder_name || student.full_name || student.name || item.founder_username || 'Student Founder';
    const rollNo = student.rollno || item.founder_username || '';
    const courseBranch = student.course || student.branch || 'M.B.B.S.';
    const currentYear = student.current_year ? `Year ${student.current_year}` : (student.semester ? `Sem ${student.semester}` : '');

    const avatarUrl = item.avatar_url || student.avatar_url || getAvatarUrl(founderName, rollNo || founderName);

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.border, marginRight: 10 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
              {founderName}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
              {rollNo ? (
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>
                  Roll: {rollNo}
                </Text>
              ) : null}
              {courseBranch ? (
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  • {courseBranch} {currentYear ? `(${currentYear})` : ''}
                </Text>
              ) : null}
            </View>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
              Category: {item.category || 'Idea'} • Stage: {(item.stage || 'idea').toUpperCase()}
            </Text>
          </View>

          <View style={[
            styles.statusBadge,
            {
              backgroundColor: isApproved ? colors.successLight : isRejected ? colors.dangerLight : colors.warningLight,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              alignSelf: 'flex-start',
              marginTop: 2,
            }
          ]}>
            <Text style={[
              styles.statusText,
              {
                fontSize: 11,
                fontWeight: '700',
                color: isApproved ? colors.success : isRejected ? colors.danger : colors.warning
              }
            ]}>
              {isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : 'PENDING'}
            </Text>
          </View>
        </View>

        <Text style={[styles.ventureName, { color: colors.textPrimary }]}>{item.name}</Text>
        {item.tagline && <Text style={[styles.tagline, { color: colors.textSecondary }]}>{item.tagline}</Text>}

        <View style={styles.divider} />

        <Text style={[styles.desc, { color: colors.textPrimary }]}>{item.description || 'No description provided.'}</Text>

        {item.pitch_deck_url && (
          <TouchableOpacity
            style={[styles.deckLinkBtn, { borderColor: colors.border, marginTop: 12 }]}
            onPress={() => handleOpenLink(item.pitch_deck_url)}
          >
            <MaterialCommunityIcons name="file-pdf-box" size={20} color={colors.danger} style={{ marginRight: 8 }} />
            <Text style={[styles.deckLinkText, { color: colors.textPrimary }]}>View Pitch Deck</Text>
            <Feather name="external-link" size={12} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        )}

        <View style={[styles.actions, { marginTop: 14 }]}>
          {isPending ? (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn, { backgroundColor: colors.dangerLight }]}
                onPress={() => openRejectModal(item.id)}
              >
                <Feather name="x" size={16} color={colors.danger} style={{ marginRight: 6 }} />
                <Text style={[styles.btnText, { color: colors.danger }]}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn, { backgroundColor: colors.success }]}
                onPress={() => handleApprove(item.id, item.name)}
              >
                <Feather name="check" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={[styles.btnText, { color: '#FFF' }]}>Approve</Text>
              </TouchableOpacity>
            </>
          ) : isApproved ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="check-circle" size={16} color={colors.success} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.success }}>Approved & Published</Text>
              </View>
              <TouchableOpacity
                style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.dangerLight }}
                onPress={() => openRejectModal(item.id)}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.danger }}>Revoke Approval</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="x-circle" size={16} color={colors.danger} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.danger }}>Rejected</Text>
              </View>
              <TouchableOpacity
                style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.successLight }}
                onPress={() => handleApprove(item.id, item.name)}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.success }}>Re-Approve</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

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
          <Text style={[styles.title, { color: colors.textPrimary }]}>Startup Approval Hub</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Review student startup pitches and incubate ideas</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isActive ? colors.primary : (isDark ? '#1F2937' : '#F3F4F6'),
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: isActive ? '#FFF' : colors.textSecondary }}>
                  {tab} ({
                    tab === 'All' ? ventures.length :
                    tab === 'Pending' ? ventures.filter(v => (v.approval_status || 'pending_review').toLowerCase() === 'pending_review' || (v.approval_status || '').toLowerCase() === 'pending').length :
                    tab === 'Approved' ? ventures.filter(v => (v.approval_status || '').toLowerCase() === 'approved').length :
                    ventures.filter(v => (v.approval_status || '').toLowerCase() === 'rejected').length
                  })
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 12 }]}>Loading pitches...</Text>
        </View>
      ) : filteredVentures.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="rocket-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textPrimary, marginTop: 16 }]}>No {activeTab.toLowerCase()} startups</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary, marginTop: 6 }]}>No venture pitches found in this filter.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVentures}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Rejection Feedback Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Provide Review Feedback</Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Enter constructive feedback. The student will receive this to refine their startup pitch.
            </Text>

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}
              multiline
              numberOfLines={4}
              placeholder="e.g. Please refine your financial projections and include details about your target addressable market (TAM)."
              placeholderTextColor={colors.textMuted}
              value={rejectionNotes}
              onChangeText={setRejectionNotes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.border }]}
                onPress={() => setRejectModalVisible(false)}
                disabled={actionInProgress}
              >
                <Text style={[styles.modalBtnText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.danger }]}
                onPress={handleRejectSubmit}
                disabled={actionInProgress}
              >
                {actionInProgress ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Confirm Reject</Text>
                )}
              </TouchableOpacity>
            </View>
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
  pitchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  stageBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  ventureName: {
    fontSize: 18,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
    opacity: 0.5,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 11,
    fontWeight: '500',
  },
  deckLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  deckLinkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
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
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default AdminVentureReviewScreen;
