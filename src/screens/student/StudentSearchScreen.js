import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, Alert, Modal, ScrollView, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../context/UserContext';
import { searchUsersAPI, followUserAPI, getAllStudents } from '../../data/apiService';
import { getAvatarUrl } from '../../utils/avatar';
import { useTheme } from '../../hooks/useTheme';

const StudentSearchScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { accessToken, user } = useUser();
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ year: 'All', branch: 'All', status: 'All' });
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [skip, setSkip] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const isInitialLoad = !searchQuery.trim();
    const delay = isInitialLoad ? 0 : 300;

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      setSkip(0);
      setHasMore(true);
      try {
        let results = await searchUsersAPI(accessToken, searchQuery, filters, 0, 20);

        // Fallback: if searchUsersAPI returned no results on initial empty search, fetch from getAllStudents
        if ((!results || results.length === 0) && !searchQuery.trim()) {
          const studs = await getAllStudents(accessToken);
          if (Array.isArray(studs) && studs.length > 0) {
            results = studs.map(s => ({
              user_id: s.user_id || s.id,
              id: s.user_id || s.id,
              name: s.full_name || s.name || s.username || 'Student',
              username: s.username,
              avatar_url: s.avatar_url || s.avatar,
              rollNo: s.username || s.rollno,
              course: s.course,
              branch: s.branch,
              year: s.year || s.batch_year,
              followers: s.followers || 0,
              connections: s.connections || 0,
              connection_status: s.connection_status || 'Connect',
            }));
          }
        }

        // Client-side search fallback if searchUsersAPI returns empty on a query
        if ((!results || results.length === 0) && searchQuery.trim()) {
          const studs = await getAllStudents(accessToken);
          if (Array.isArray(studs) && studs.length > 0) {
            const qLower = searchQuery.trim().toLowerCase();
            const matched = studs.filter(s => {
              const nameMatch = (s.full_name || s.name || '').toLowerCase().includes(qLower);
              const userMatch = (s.username || s.rollno || '').toLowerCase().includes(qLower);
              return nameMatch || userMatch;
            });
            results = matched.map(s => ({
              user_id: s.user_id || s.id,
              id: s.user_id || s.id,
              name: s.full_name || s.name || s.username || 'Student',
              username: s.username,
              avatar_url: s.avatar_url || s.avatar,
              rollNo: s.username || s.rollno,
              course: s.course,
              branch: s.branch,
              year: s.year || s.batch_year,
              followers: s.followers || 0,
              connections: s.connections || 0,
              connection_status: s.connection_status || 'Connect',
            }));
          }
        }

        let finalUsers = Array.isArray(results) ? results : [];
        if (filters.branch === 'All') {
          finalUsers = finalUsers.filter(s => {
            const cStr = String(s.course || '').toUpperCase();
            const bStr = String(s.branch || '').toUpperCase();
            if (cStr.includes('B.TECH') || bStr.includes('CSE') || cStr.includes('ENGINEERING')) return false;
            return true;
          });
        }
        if (finalUsers.length < 20) {
          setHasMore(false);
        }
        setUsers(finalUsers);
      } catch(e) {
        console.warn("Search error:", e);
        try {
          const studs = await getAllStudents(accessToken);
          if (Array.isArray(studs)) {
            const qLower = searchQuery.trim().toLowerCase();
            const filtered = qLower
              ? studs.filter(s => (s.full_name || s.name || '').toLowerCase().includes(qLower) || (s.username || '').toLowerCase().includes(qLower))
              : studs;
            const mapped = filtered.map(s => ({
              user_id: s.user_id || s.id,
              id: s.user_id || s.id,
              name: s.full_name || s.name || s.username || 'Student',
              username: s.username,
              avatar_url: s.avatar_url || s.avatar,
              rollNo: s.username || s.rollno,
              course: s.course,
              branch: s.branch,
              year: s.year || s.batch_year,
              followers: s.followers || 0,
              connections: s.connections || 0,
              connection_status: s.connection_status || 'Connect',
            }));
            setUsers(mapped);
            setHasMore(false);
          } else {
            setUsers([]);
          }
        } catch (fallbackErr) {
          setUsers([]);
        }
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, accessToken, filters]);

  const handleLoadMore = async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextSkip = skip + 20;
    try {
      let nextBatch = await searchUsersAPI(accessToken, searchQuery, filters, nextSkip, 20);
      let newBatch = Array.isArray(nextBatch) ? nextBatch : [];
      if (filters.branch === 'All') {
        newBatch = newBatch.filter(s => {
          const cStr = String(s.course || '').toUpperCase();
          const bStr = String(s.branch || '').toUpperCase();
          if (cStr.includes('B.TECH') || bStr.includes('CSE') || cStr.includes('ENGINEERING')) return false;
          return true;
        });
      }
      if (newBatch.length < 20) {
        setHasMore(false);
      }
      setUsers(prev => {
        const existingIds = new Set(prev.map(u => u.id));
        const uniqueNext = newBatch.filter(u => !existingIds.has(u.id));
        return [...prev, ...uniqueNext];
      });
      setSkip(nextSkip);
    } catch (e) {
      console.warn("Load more error:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFollow = async (targetUserId) => {
    try {
      const res = await followUserAPI(accessToken, targetUserId);
      if (res) {
        const targetUser = users.find(u => u.id === targetUserId);
        const name = targetUser?.name || targetUser?.username || 'Student';
        Alert.alert('Connection Request Sent', `Your connection request has been sent to ${name}.`);
        setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, connection_status: 'Pending' } : u));
      }
    } catch (error) {
      console.warn("Follow error:", error);
      Alert.alert("Error", "Failed to send connection request.");
    }
  };

  const handleProfileClick = async (item) => {
    try {
      // Mark profile as viewed and store viewed by (local simulation)
      let viewsData = await AsyncStorage.getItem('@unicampus_profile_views');
      let views = viewsData ? JSON.parse(viewsData) : [];
      views.unshift({
        viewer_id: user?.id || 'current_user',
        viewer_name: user?.name || 'You',
        viewed_profile_id: item.id,
        timestamp: new Date().toISOString()
      });
      await AsyncStorage.setItem('@unicampus_profile_views', JSON.stringify(views.slice(0, 50)));
    } catch(e) {
      console.warn("Error saving profile view", e);
    }
    
    // Navigate with full student data
    navigation.navigate('OtherStudentProfile', { student: item });
  };

  const renderStudent = ({ item }) => {
    let displayName = item.name || item.full_name;
    if (!displayName || /^\d+$/.test(String(displayName).trim())) {
      displayName = 'Student';
    }

    return (
      <TouchableOpacity 
        style={[styles.studentCard, { backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1 }]}
        onPress={() => handleProfileClick(item)}
      >
        <View style={styles.avatarPlaceholder}>
          <Image source={{ uri: getAvatarUrl(item.avatar_url || item.username, item.username || item.rollNo) }} style={{ width: 50, height: 50, borderRadius: 25 }} />
        </View>
        <View style={styles.studentInfo}>
          <Text style={[styles.studentName, { color: colors.textPrimary, fontSize: 16 }]}>{displayName}</Text>
        {(() => {
          const isMed = String(item.course || '').toUpperCase().includes('MBBS') || 
                        String(item.branch || '').toUpperCase().includes('MBBS');
          
          let formattedYear = '';
          if (item.year) {
            const y = parseInt(item.year);
            if (y === 1) formattedYear = '1st Prof';
            else if (y === 2) formattedYear = '2nd Prof';
            else if (y === 3) formattedYear = '3rd Prof';
            else if (y === 4) formattedYear = '4th Prof';
            else formattedYear = `${item.year} Prof`;
          }

          if (isMed) {
            return (
              <>
                <Text style={[styles.studentCourse, { color: colors.textSecondary, fontSize: 13, marginTop: 2 }]}>
                  {formattedYear ? `${formattedYear} • ` : ''}MBBS
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  {item.followers || 0} followers
                </Text>
              </>
            );
          }

          return (
            <>
              <Text style={[styles.studentCourse, { color: colors.textSecondary, fontSize: 13, marginTop: 2 }]}>
                {item.course || 'Student'} {item.branch ? `• ${item.branch}` : ''}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                {item.year ? `Year ${item.year} ` : ''}• {item.followers || 0} followers
              </Text>
            </>
          );
        })()}
      </View>
      <TouchableOpacity 
        style={{ 
          backgroundColor: item.connection_status === 'Pending' || item.connection_status === 'Connected' ? colors.border : (isDark ? colors.background : '#F3F4F6'), 
          paddingHorizontal: 14, 
          paddingVertical: 6, 
          borderRadius: 16, 
          borderWidth: 1, 
          borderColor: colors.border 
        }}
        disabled={item.connection_status === 'Pending' || item.connection_status === 'Connected'}
        onPress={() => handleFollow(item.id)}
      >
        <Text style={{ color: item.connection_status === 'Pending' || item.connection_status === 'Connected' ? colors.textSecondary : colors.primary, fontWeight: '700', fontSize: 12 }}>
          {item.connection_status === 'Pending' ? 'Pending' : item.connection_status === 'Connected' ? 'Connected' : 'Connect'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

  const FilterPill = ({ label, onRemove }) => (
    <View style={[styles.filterPill, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
      <Text style={[styles.filterPillText, { color: colors.primary }]}>{label}</Text>
      <TouchableOpacity onPress={onRemove} style={{ marginLeft: 4 }}>
        <Ionicons name="close" size={14} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Network Search</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? colors.card : '#F3F4F6' }]}>
          <Ionicons name="search" size={20} color={colors.textMuted || "#6B7280"} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search students by name or roll no..."
            placeholderTextColor={colors.textMuted || "#9CA3AF"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted || "#9CA3AF"} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowFilterModal(true)} style={{ marginLeft: 12, padding: 4 }}>
            <Ionicons name="options-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Filters */}
      {(filters.year !== 'All' || filters.branch !== 'All' || filters.status !== 'All') && (
        <View style={styles.activeFiltersContainer}>
          {filters.year !== 'All' && (
            <FilterPill
              label={`Prof: ${filters.year === '1' ? '1st Prof' : filters.year === '2' ? '2nd Prof' : filters.year === '3' ? '3rd Prof' : 'Final Prof'}`}
              onRemove={() => setFilters(f => ({...f, year: 'All'}))}
            />
          )}
          {filters.branch !== 'All' && <FilterPill label={`Stream: ${filters.branch}`} onRemove={() => setFilters(f => ({...f, branch: 'All'}))} />}
          {filters.status !== 'All' && <FilterPill label={`Status: ${filters.status === 'Connect' ? 'Not Connected' : filters.status}`} onRemove={() => setFilters(f => ({...f, status: 'All'}))} />}
        </View>
      )}

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderStudent}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {loading ? (
              <>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary, marginTop: 12 }]}>Loading students...</Text>
              </>
            ) : (
              <>
                <Ionicons name="people-outline" size={48} color={colors.textMuted || "#D1D5DB"} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No students found</Text>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>Try a different name or adjust filters.</Text>
              </>
            )}
          </View>
        }
      />
      <Modal visible={showFilterModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>Professional Year</Text>
              <View style={styles.filterOptions}>
                {[
                  { id: 'All', label: 'All Profs' },
                  { id: '1', label: '1st Prof' },
                  { id: '2', label: '2nd Prof' },
                  { id: '3', label: '3rd Prof' },
                  { id: '4', label: 'Final Prof' }
                ].map(y => (
                  <TouchableOpacity key={y.id} onPress={() => setFilters(f => ({...f, year: y.id}))} style={[styles.filterOption, filters.year === y.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    <Text style={[styles.filterOptionText, { color: filters.year === y.id ? '#FFF' : colors.textPrimary }]}>{y.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.filterSectionTitle, { color: colors.textSecondary, marginTop: 16 }]}>Medical Stream / Department</Text>
              <View style={styles.filterOptions}>
                {[
                  { id: 'All', label: 'All Streams' },
                  { id: 'MBBS', label: 'MBBS' },
                  { id: 'Pre-Clinical', label: 'Pre-Clinical' },
                  { id: 'Para-Clinical', label: 'Para-Clinical' },
                  { id: 'Clinical', label: 'Clinical' },
                  { id: 'Internship', label: 'Internship' }
                ].map(b => (
                  <TouchableOpacity key={b.id} onPress={() => setFilters(f => ({...f, branch: b.id}))} style={[styles.filterOption, filters.branch === b.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    <Text style={[styles.filterOptionText, { color: filters.branch === b.id ? '#FFF' : colors.textPrimary }]}>{b.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.filterSectionTitle, { color: colors.textSecondary, marginTop: 16 }]}>Connection Status</Text>
              <View style={styles.filterOptions}>
                {['All', 'Connect', 'Pending', 'Connected'].map(s => (
                  <TouchableOpacity key={s} onPress={() => setFilters(f => ({...f, status: s}))} style={[styles.filterOption, filters.status === s && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    <Text style={[styles.filterOptionText, { color: filters.status === s ? '#FFF' : colors.textPrimary }]}>{s === 'Connect' ? 'Not Connected' : s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <TouchableOpacity 
              style={[styles.applyButton, { backgroundColor: colors.primary }]} 
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b4b0020',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8b4b00',
  },
  studentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  studentCourse: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalScroll: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default StudentSearchScreen;
