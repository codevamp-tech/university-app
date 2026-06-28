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
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getPendingStartups, reviewStartup } from '../../data/apiService';

const AdminVentureReviewScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();
  const [ventures, setVentures] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Rejection Modal State
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedVentureId, setSelectedVentureId] = useState(null);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

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
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Cannot Open Deck', 'This URL is not supported.');
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to open pitch deck link.');
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.pitchHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.categoryText, { color: colors.primary }]}>{item.category || 'Idea'}</Text>
            </View>
            <Text style={[styles.stageBadge, { color: colors.textSecondary }]}>Stage: {item.stage?.toUpperCase()}</Text>
          </View>
          <Text style={[styles.ventureName, { color: colors.textPrimary }]}>{item.name}</Text>
          {item.tagline && <Text style={[styles.tagline, { color: colors.textSecondary }]}>{item.tagline}</Text>}
        </View>

        <View style={styles.divider} />

        <Text style={[styles.desc, { color: colors.textPrimary }]}>{item.description || 'No description provided.'}</Text>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Feather name="user" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>Founder ID: {item.founder_id?.slice(0, 8)}...</Text>
          </View>
        </View>

        {item.pitch_deck_url && (
          <TouchableOpacity 
            style={[styles.deckLinkBtn, { borderColor: colors.border }]}
            onPress={() => handleOpenLink(item.pitch_deck_url)}
          >
            <MaterialCommunityIcons name="file-pdf-box" size={20} color={colors.danger} style={{ marginRight: 8 }} />
            <Text style={[styles.deckLinkText, { color: colors.textPrimary }]}>View Pitch Deck</Text>
            <Feather name="external-link" size={12} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        )}

        <View style={styles.actions}>
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

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 12 }]}>Loading pitches...</Text>
        </View>
      ) : ventures.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="rocket-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textPrimary, marginTop: 16 }]}>No pending startups</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary, marginTop: 6 }]}>All pitches are reviewed!</Text>
        </View>
      ) : (
        <FlatList
          data={ventures}
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
