import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, Alert, Modal, ScrollView, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../context/UserContext';
import { searchUsersAPI, followUserAPI } from '../../data/apiService';
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

  useEffect(() => {
    // Don't search on empty query — show prompt instead
    if (!searchQuery.trim() && filters.year === 'All' && filters.branch === 'All' && filters.status === 'All') {
      setUsers([]);
      setLoading(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchUsersAPI(accessToken, searchQuery, filters);
        setUsers(Array.isArray(results) ? results : []);
      } catch(e) {
        console.warn("Search error:", e);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, accessToken, filters]);

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

  const renderStudent = ({ item }) => (
    <TouchableOpacity 
      style={[styles.studentCard, { backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1 }]}
      onPress={() => handleProfileClick(item)}
    >
      <View style={styles.avatarPlaceholder}>
        <Image source={{ uri: getAvatarUrl(item.avatar_url || item.username) }} style={{ width: 50, height: 50, borderRadius: 25 }} />
      </View>
      <View style={styles.studentInfo}>
        <Text style={[styles.studentName, { color: colors.textPrimary, fontSize: 16 }]}>{item.name || item.username}</Text>
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
          {filters.year !== 'All' && <FilterPill label={`Year: ${filters.year}`} onRemove={() => setFilters(f => ({...f, year: 'All'}))} />}
          {filters.branch !== 'All' && <FilterPill label={`Branch: ${filters.branch}`} onRemove={() => setFilters(f => ({...f, branch: 'All'}))} />}
          {filters.status !== 'All' && <FilterPill label={`Status: ${filters.status}`} onRemove={() => setFilters(f => ({...f, status: 'All'}))} />}
        </View>
      )}

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderStudent}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {loading ? (
              <>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary, marginTop: 12 }]}>Searching...</Text>
              </>
            ) : !searchQuery.trim() && filters.year === 'All' && filters.branch === 'All' && filters.status === 'All' ? (
              <>
                <Ionicons name="search-outline" size={48} color={colors.textMuted || "#D1D5DB"} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Search students by name or roll no.</Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 24 }}>Use filters to browse by year or branch.</Text>
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
              <Text style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>Year</Text>
              <View style={styles.filterOptions}>
                {['All', '1', '2', '3', '4'].map(y => (
                  <TouchableOpacity key={y} onPress={() => setFilters(f => ({...f, year: y}))} style={[styles.filterOption, filters.year === y && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    <Text style={[styles.filterOptionText, { color: filters.year === y ? '#FFF' : colors.textPrimary }]}>{y === 'All' ? 'All Years' : `Year ${y}`}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.filterSectionTitle, { color: colors.textSecondary, marginTop: 16 }]}>Branch</Text>
              <View style={styles.filterOptions}>
                {['All', 'CSE', 'EE', 'MBBS', 'Engineering', 'Management'].map(b => (
                  <TouchableOpacity key={b} onPress={() => setFilters(f => ({...f, branch: b}))} style={[styles.filterOption, filters.branch === b && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    <Text style={[styles.filterOptionText, { color: filters.branch === b ? '#FFF' : colors.textPrimary }]}>{b}</Text>
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
