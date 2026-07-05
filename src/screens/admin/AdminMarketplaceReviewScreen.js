import React, { useState, useEffect, useCallback } from 'react';
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
  Image,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getAdminPendingListings, approveShopListing, rejectShopListing } from '../../data/apiService';

const AdminMarketplaceReviewScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Reject modal state
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState(null);
  const [selectedListingTitle, setSelectedListingTitle] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');

  const fetchPendingListings = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await getAdminPendingListings(accessToken);
      setListings(data || []);
    } catch (err) {
      console.warn('[MarketplaceReview] Fetch error:', err);
      setListings([]);
    }
  }, [accessToken]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchPendingListings();
      setLoading(false);
    })();
  }, [fetchPendingListings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingListings();
    setRefreshing(false);
  };

  const handleApprove = (id, title) => {
    Alert.alert(
      'Approve Listing',
      `Approve "${title}"? It will be published on the Marketplace and visible to all students.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setActionInProgress(true);
            try {
              await approveShopListing(accessToken, id);
              setListings(prev => prev.filter(l => l.id !== id));
              Alert.alert('✅ Approved', `"${title}" is now live on the Marketplace.`);
            } catch (err) {
              Alert.alert('Error', 'Could not approve listing. Please try again.');
            } finally {
              setActionInProgress(false);
            }
          },
        },
      ]
    );
  };

  const openRejectModal = (id, title) => {
    setSelectedListingId(id);
    setSelectedListingTitle(title);
    setRejectionNotes('');
    setRejectModalVisible(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedListingId) return;
    setActionInProgress(true);
    setRejectModalVisible(false);
    try {
      await rejectShopListing(accessToken, selectedListingId, rejectionNotes || null);
      setListings(prev => prev.filter(l => l.id !== selectedListingId));
      Alert.alert('❌ Rejected', `"${selectedListingTitle}" has been rejected and the seller has been notified.`);
    } catch (err) {
      Alert.alert('Error', 'Could not reject listing. Please try again.');
    } finally {
      setActionInProgress(false);
      setSelectedListingId(null);
      setSelectedListingTitle('');
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getCategoryColor = (category) => {
    const map = {
      books: ['#3B82F6', '#1D4ED8'],
      electronics: ['#8B5CF6', '#6D28D9'],
      gear: ['#F59E0B', '#D97706'],
      gig: ['#10B981', '#059669'],
      request: ['#EF4444', '#DC2626'],
      other: ['#6B7280', '#4B5563'],
    };
    return map[category] || map.other;
  };

  const renderListing = ({ item }) => {
    const sellerName = item.seller?.full_name || item.seller?.username || 'Student';
    const imgUrl = item.image_url || item.images?.[0] || null;
    const catColors = getCategoryColor(item.category);

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Image + Category badge */}
        <View style={styles.cardImageRow}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.cardImage} />
          ) : (
            <LinearGradient colors={isDark ? ['#1F2937', '#374151'] : ['#F3F4F6', '#E5E7EB']} style={styles.cardImagePlaceholder}>
              <MaterialIcons name="image-not-supported" size={28} color={colors.textMuted} />
            </LinearGradient>
          )}
          <LinearGradient colors={catColors} style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{(item.category || 'other').toUpperCase()}</Text>
          </LinearGradient>
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.cardMeta}>
            <MaterialCommunityIcons name="account-circle-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.cardMetaText, { color: colors.textSecondary }]}>
              {sellerName}
            </Text>
            <Text style={[styles.cardMetaDot, { color: colors.textMuted }]}>·</Text>
            <Feather name="clock" size={12} color={colors.textMuted} />
            <Text style={[styles.cardMetaText, { color: colors.textMuted }]}>
              {formatTime(item.created_at)}
            </Text>
          </View>

          <Text style={[styles.cardPrice, { color: colors.textPrimary }]}>
            ₹{Number(item.price).toLocaleString('en-IN')}
          </Text>

          {item.description ? (
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn, { borderColor: '#EF4444' }]}
              onPress={() => openRejectModal(item.id, item.title)}
              disabled={actionInProgress}
            >
              <Feather name="x-circle" size={16} color="#EF4444" />
              <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleApprove(item.id, item.title)}
              disabled={actionInProgress}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.approveBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="check-circle" size={16} color="#FFFFFF" />
                <Text style={styles.approveBtnText}>Approve</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={isDark ? ['#1F2937', '#111827'] : ['#F0FDF4', '#DCFCE7']}
        style={styles.emptyIconBg}
      >
        <MaterialCommunityIcons name="check-decagram" size={48} color="#10B981" />
      </LinearGradient>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>All Clear!</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        No pending listings. Every student post has been reviewed.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#1a1a2e', '#16213e'] : ['#FFFFFF', '#F9FAFB']}
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#EA580C', '#9A3412']}
            style={styles.headerIconBg}
          >
            <MaterialCommunityIcons name="storefront-outline" size={20} color="#FFFFFF" />
          </LinearGradient>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Marketplace Approvals</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {listings.length > 0
                ? `${listings.length} listing${listings.length !== 1 ? 's' : ''} pending review`
                : 'Review student listings before publishing'}
            </Text>
          </View>
        </View>

        {listings.length > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{listings.length}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Body */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Fetching pending listings…
          </Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderListing}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            listings.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Reject Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="alert-octagon" size={28} color="#EF4444" />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Reject Listing</Text>
            </View>

            <Text style={[styles.modalListingName, { color: colors.textSecondary }]} numberOfLines={2}>
              "{selectedListingTitle}"
            </Text>

            <Text style={[styles.modalLabel, { color: colors.textPrimary }]}>
              Reason (optional)
            </Text>
            <TextInput
              style={[styles.modalInput, {
                backgroundColor: colors.background,
                color: colors.textPrimary,
                borderColor: colors.border,
              }]}
              placeholder="e.g. Inappropriate content, incomplete description..."
              placeholderTextColor={colors.textMuted}
              value={rejectionNotes}
              onChangeText={setRejectionNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={[styles.modalNote, { color: colors.textMuted }]}>
              The student will receive a notification with this reason.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalRejectBtn}
                onPress={handleRejectConfirm}
                disabled={actionInProgress}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.modalRejectGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.modalRejectText}>Send Rejection</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  pendingBadge: {
    backgroundColor: '#EF4444',
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  pendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },

  listContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },

  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardImageRow: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  cardContent: {
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardMetaDot: {
    fontSize: 14,
    marginHorizontal: 2,
  },
  cardPrice: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtn: {
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 6,
  },
  approveBtn: {
    flex: 1.5,
  },
  approveBtnGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 260,
  },

  // Reject Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderTopWidth: 1,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalListingName: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 80,
  },
  modalNote: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    paddingBottom: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalRejectBtn: {
    flex: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalRejectGradient: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  modalRejectText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default AdminMarketplaceReviewScreen;
