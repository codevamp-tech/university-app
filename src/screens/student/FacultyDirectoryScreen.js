import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getFacultyContactsAPI } from '../../data/apiService';

const FacultyDirectoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();

  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  const fetchFaculty = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getFacultyContactsAPI(accessToken);
      setFaculties(data || []);
    } catch (e) {
      console.warn('[FacultyDirectory] Load failed:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  // Extract unique departments for filtering
  const departments = React.useMemo(() => {
    const depts = new Set();
    faculties.forEach((f) => {
      if (f.department) {
        depts.add(f.department.trim().toUpperCase());
      }
    });
    return ['ALL', ...Array.from(depts).sort()];
  }, [faculties]);

  // Filtered faculties list
  const filteredFaculties = React.useMemo(() => {
    return faculties.filter((f) => {
      const matchesSearch =
        (f.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.empid || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.department || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept =
        selectedDept === 'ALL' ||
        (f.department || '').trim().toUpperCase() === selectedDept;

      return matchesSearch && matchesDept;
    });
  }, [faculties, searchQuery, selectedDept]);

  const renderFacultyItem = ({ item }) => {
    const initials = (item.username || 'F')
      .split(' ')
      .slice(0, 2)
      .map((w) => w.charAt(0))
      .join('')
      .toUpperCase();

    // Render each faculty card
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.85}
        onPress={() => {
          navigation.navigate('DMConversation', {
            contact: {
              user_id: item.user_id,
              username: item.username,
              full_name: item.username,
            },
            source: 'faculty',
          });
        }}
      >
        <View style={styles.cardHeader}>
          {/* Avatar with gradient */}
          <LinearGradient
            colors={isDark ? ['#581C87', '#7E22CE'] : ['#F3E8FF', '#E9D5FF']}
            style={styles.avatar}
          >
            <Text style={[styles.avatarText, { color: isDark ? '#C084FC' : '#7E22CE' }]}>
              {initials}
            </Text>
          </LinearGradient>

          {/* Details */}
          <View style={styles.details}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{item.username}</Text>
            <View style={styles.deptBadge}>
              <MaterialCommunityIcons name="domain" size={13} color={colors.textSecondary} />
              <Text style={[styles.deptText, { color: colors.textSecondary }]}>
                {item.department || 'General Faculty'}
              </Text>
            </View>
            <Text style={[styles.empid, { color: colors.textMuted }]}>ID: {item.empid}</Text>
          </View>

          {/* Chat Icon */}
          <View style={[styles.chatBtn, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#FFF7ED' }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Faculty Contacts</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search by name, ID or department..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="clear" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Department Chips Filter */}
      {!loading && departments.length > 1 && (
        <View style={styles.deptFilterContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={departments}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.deptList}
            renderItem={({ item }) => {
              const isActive = selectedDept === item;
              return (
                <TouchableOpacity
                  onPress={() => setSelectedDept(item)}
                  style={[
                    styles.deptChip,
                    {
                      backgroundColor: isActive ? colors.primary + '15' : colors.card,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.deptChipText,
                      {
                        color: isActive ? colors.primary : colors.textSecondary,
                        fontWeight: isActive ? '800' : '600',
                      },
                    ]}
                  >
                    {item === 'ALL' ? 'All Departments' : item.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* List content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading faculty list...</Text>
        </View>
      ) : filteredFaculties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-search-outline" size={60} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No faculty found matching filters.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFaculties}
          keyExtractor={(item) => item.user_id}
          renderItem={renderFacultyItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchFaculty(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  deptFilterContainer: {
    paddingVertical: 8,
  },
  deptList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  deptChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  deptChipText: {
    fontSize: 12.5,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  details: {
    flex: 1,
    marginLeft: 14,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
  },
  deptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  deptText: {
    fontSize: 12,
    fontWeight: '600',
  },
  empid: {
    fontSize: 11,
    fontWeight: '500',
  },
  chatBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FacultyDirectoryScreen;
