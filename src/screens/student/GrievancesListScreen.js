import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { listGrievancesAPI, deleteGrievanceAPI } from '../../data/apiService';

const { width } = Dimensions.get('window');

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'rejected', label: 'Rejected' },
];

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All Categories', icon: 'apps' },
  { id: 'academic', label: 'Academic', icon: 'school-outline' },
  { id: 'technical', label: 'Technical', icon: 'laptop' },
  { id: 'fees', label: 'Fees', icon: 'cash-outline' },
  { id: 'hostel', label: 'Hostel', icon: 'bed-outline' },
  { id: 'transport', label: 'Transport', icon: 'bus-outline' },
  { id: 'admin', label: 'Admin', icon: 'office-building-outline' },
  { id: 'safety', label: 'Safety', icon: 'shield-check-outline' },
];

const GrievancesListScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const fetchIssues = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    try {
      const data = await listGrievancesAPI(accessToken);
      if (Array.isArray(data)) {
        setIssues(data);
      } else {
        setIssues([]);
      }
    } catch (err) {
      console.warn('[GrievancesList] Error fetching issues:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchIssues();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchIssues();
    });
    return unsubscribe;
  }, [navigation, fetchIssues]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchIssues();
    setRefreshing(false);
  }, [fetchIssues]);

  const handleDelete = (issueId) => {
    Alert.alert(
      'Delete Support Ticket',
      'Are you sure you want to delete this issue? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(issueId);
            try {
              await deleteGrievanceAPI(accessToken, issueId);
              setIssues(prev => prev.filter(i => i.id !== issueId));
              Alert.alert('Deleted', 'Support ticket has been deleted successfully.');
            } catch (err) {
              Alert.alert('Delete Failed', err.message || 'Could not delete ticket.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  // Filtered issues calculation
  const filteredIssues = issues.filter(issue => {
    // Status filter
    const statusNorm = (issue.status || '').toLowerCase().replace('-', '_');
    if (selectedStatus !== 'all' && statusNorm !== selectedStatus) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && (issue.category || '').toLowerCase() !== selectedCategory) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const subjectMatch = (issue.subject || '').toLowerCase().includes(q);
      const descMatch = (issue.description || '').toLowerCase().includes(q);
      const catMatch = (issue.category || '').toLowerCase().includes(q);
      if (!subjectMatch && !descMatch && !catMatch) return false;
    }

    return true;
  });

  const getStatusBadgeConfig = (statusStr) => {
    const s = (statusStr || '').toLowerCase().replace('-', '_');
    if (s === 'resolved') return { color: '#10B981', bg: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5', label: 'RESOLVED' };
    if (s === 'in_progress') return { color: '#F59E0B', bg: isDark ? 'rgba(245,158,11,0.15)' : '#FFFBEB', label: 'IN PROGRESS' };
    if (s === 'rejected') return { color: '#EF4444', bg: isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2', label: 'REJECTED' };
    return { color: '#3B82F6', bg: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF', label: 'PENDING' };
  };

  const getCategoryIcon = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat === 'academic') return 'school-outline';
    if (cat === 'technical') return 'laptop';
    if (cat === 'fees') return 'cash-outline';
    if (cat === 'hostel') return 'bed-outline';
    if (cat === 'transport') return 'bus-outline';
    if (cat === 'admin') return 'office-building-outline';
    if (cat === 'safety') return 'shield-check-outline';
    return 'alert-circle-outline';
  };

  const extractAttachmentUrl = (desc, issueAtt) => {
    if (issueAtt) return issueAtt;
    if (!desc) return null;
    const match = desc.match(/Attachment:\s*(https?:\/\/\S+)/i);
    return match ? match[1] : null;
  };

  const cleanDescription = (desc) => {
    if (!desc) return '';
    return desc.replace(/Attachment:\s*https?:\/\/\S+/gi, '').trim();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Support Tickets</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {issues.length} {issues.length === 1 ? 'ticket' : 'tickets'} raised total
          </Text>
        </View>
        <TouchableOpacity
          style={styles.raiseNewBtn}
          onPress={() => navigation.navigate('RaiseIssue')}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.raiseNewGradient}>
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.raiseNewText}>Raise Ticket</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search tickets by keyword..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs Scroll */}
      <View style={styles.filterSection}>
        {/* Status Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {STATUS_FILTERS.map(st => {
            const count = st.id === 'all'
              ? issues.length
              : issues.filter(i => (i.status || '').toLowerCase().replace('-', '_') === st.id).length;
            const isSelected = selectedStatus === st.id;

            return (
              <TouchableOpacity
                key={st.id}
                style={[
                  styles.statusPill,
                  { backgroundColor: isDark ? colors.card : '#F3F4F6', borderColor: colors.border },
                  isSelected && { backgroundColor: '#EA580C', borderColor: '#EA580C' }
                ]}
                onPress={() => setSelectedStatus(st.id)}
              >
                <Text style={[styles.statusPillText, { color: colors.textSecondary }, isSelected && { color: '#FFF', fontWeight: '700' }]}>
                  {st.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.pillsScroll, { paddingTop: 6 }]}
        >
          {CATEGORY_FILTERS.map(cat => {
            const isSelected = selectedCategory === cat.id;

            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryPill,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: colors.border },
                  isSelected && { backgroundColor: isDark ? 'rgba(234,88,12,0.2)' : '#FFF7ED', borderColor: '#EA580C' }
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <MaterialCommunityIcons
                  name={cat.icon}
                  size={14}
                  color={isSelected ? '#EA580C' : colors.textMuted}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.categoryPillText, { color: colors.textSecondary }, isSelected && { color: '#EA580C', fontWeight: '700' }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Ticket Cards List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#EA580C']}
            tintColor="#EA580C"
          />
        }
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#EA580C" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading support tickets...</Text>
          </View>
        ) : filteredIssues.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="ticket-confirmation-outline" size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Support Tickets Found</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              {issues.length === 0
                ? "You haven't raised any support tickets yet."
                : "No support tickets match your selected filters."}
            </Text>
            {issues.length > 0 && (
              <TouchableOpacity
                style={styles.resetFilterBtn}
                onPress={() => { setSelectedStatus('all'); setSelectedCategory('all'); setSearchQuery(''); }}
              >
                <Text style={styles.resetFilterText}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredIssues.map(issue => {
            const statusConfig = getStatusBadgeConfig(issue.status);
            const categoryIcon = getCategoryIcon(issue.category);
            const attachmentUrl = extractAttachmentUrl(issue.description, issue.attachment_url);
            const displayDesc = cleanDescription(issue.description);
            const isPending = (issue.status || '').toLowerCase() === 'pending';
            const isDeleting = deletingId === issue.id;

            return (
              <View key={issue.id} style={[styles.ticketCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(234,88,12,0.15)' : '#FFF7ED' }]}>
                    <MaterialCommunityIcons name={categoryIcon} size={20} color="#EA580C" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.ticketSubject, { color: colors.textPrimary }]} numberOfLines={2}>
                      {issue.subject || 'Support Ticket'}
                    </Text>
                    <Text style={[styles.ticketMetaText, { color: colors.textMuted }]}>
                      {(issue.category || 'General').toUpperCase()} • Priority: {(issue.priority || 'Medium').toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                {/* Description Body */}
                <Text style={[styles.ticketDesc, { color: colors.textSecondary }]}>
                  {displayDesc}
                </Text>

                {/* Attachment Preview */}
                {attachmentUrl && (
                  <View style={[styles.attachmentRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB', borderColor: colors.border }]}>
                    <Image
                      source={{ uri: attachmentUrl }}
                      style={styles.attachmentImg}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MaterialCommunityIcons name="paperclip" size={14} color="#EA580C" />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>Image Attachment</Text>
                      </View>
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>Tap to view attachment</Text>
                    </View>
                  </View>
                )}

                {/* Admin Remarks if available */}
                {issue.admin_remarks ? (
                  <View style={[styles.adminRemarksBox, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#F0FDF4', borderColor: isDark ? 'rgba(16,185,129,0.2)' : '#DCFCE7' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <MaterialIcons name="admin-panel-settings" size={16} color="#10B981" />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#10B981' }}>ADMIN REMARKS</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: colors.textPrimary, lineHeight: 18 }}>
                      {issue.admin_remarks}
                    </Text>
                  </View>
                ) : null}

                {/* Footer Action Row */}
                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>
                    {new Date(issue.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(issue.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>

                  <View style={styles.actionBtnsRow}>
                    {/* Edit Option (if Pending) */}
                    {isPending && (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('RaiseIssue', { editMode: true, issue })}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="edit" size={16} color="#EA580C" />
                        <Text style={[styles.actionBtnText, { color: '#EA580C' }]}>Edit</Text>
                      </TouchableOpacity>
                    )}

                    {/* Delete Option (For All Raised Tickets) */}
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleDelete(issue.id)}
                      disabled={isDeleting}
                      activeOpacity={0.7}
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <>
                          <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
                          <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, marginTop: 1 },
  raiseNewBtn: { borderRadius: 14, overflow: 'hidden' },
  raiseNewGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  raiseNewText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, height: 44,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterSection: { paddingBottom: 8 },
  pillsScroll: { paddingHorizontal: 16, gap: 8 },
  statusPill: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  statusPillText: { fontSize: 12, fontWeight: '600' },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1,
  },
  categoryPillText: { fontSize: 12, fontWeight: '500' },
  listContainer: { padding: 16, paddingBottom: 40 },
  centerBox: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '600' },
  emptyCard: {
    padding: 32, borderRadius: 24, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginTop: 20,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', marginTop: 8 },
  emptySub: { fontSize: 13, textAlign: 'center', marginTop: 4, paddingHorizontal: 16 },
  resetFilterBtn: {
    marginTop: 16, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 12, backgroundColor: '#EA580C',
  },
  resetFilterText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  ticketCard: {
    borderRadius: 20, borderWidth: 1, padding: 16,
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconCircle: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  ticketSubject: { fontSize: 15, fontWeight: '800' },
  ticketMetaText: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  ticketDesc: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  attachmentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 10, borderRadius: 14, borderWidth: 1, marginBottom: 12,
  },
  attachmentImg: { width: 60, height: 42, borderRadius: 8 },
  adminRemarksBox: {
    padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10, borderTopWidth: 1,
  },
  dateText: { fontSize: 11, fontWeight: '500' },
  actionBtnsRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
});

export default GrievancesListScreen;
