import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Dimensions, Image, Animated, Modal, Platform, RefreshControl,
  FlatList
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../hooks/useTheme';
import { getAllStudents, getPublicProfile } from '../../data/apiService';
import { populateStudentAvatars } from '../../utils/studentAvatarCache';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// ─── In-memory cache (persists across mounts, resets on app restart) ─────────
const STUDENT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const _studentCache = { data: null, timestamp: 0 };
let _lastSelectedPhaseFilter = null;
const ALL_PHASES = [1, 2, 3];


const getStudentPhase = (s) => {
  if (s.phase) return parseInt(s.phase);
  const batchYear = parseInt(s.batch_year || s.batchYear || 0);
  if (batchYear >= 2025) return 1;
  if (batchYear === 2024) return 2;
  if (batchYear > 0 && batchYear <= 2023) return 3;

  const sem = parseInt(s.semester || s.current_year * 2 - 1 || 1);
  if (sem <= 2) return 1;
  if (sem <= 4) return 2;
  if (sem <= 6) return 3;
  return 4;
};

const SkeletonBlock = ({ width, height, borderRadius, style }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: '#E5E7EB', opacity: pulseAnim }, style]} />
  );
};

const StudentListSkeleton = () => {
  return (
    <ScrollView contentContainerStyle={styles.listScroll} scrollEnabled={false} showsVerticalScrollIndicator={false}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={[styles.studentCard, { opacity: 0.8 }]}>
          <SkeletonBlock width={44} height={44} borderRadius={22} style={{ marginRight: 12 }} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBlock width="55%" height={15} borderRadius={4} />
            <SkeletonBlock width="35%" height={11} borderRadius={4} />
          </View>
          <SkeletonBlock width={55} height={18} borderRadius={8} />
        </View>
      ))}
    </ScrollView>
  );
};

const FacultyStudentsDirectoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, accessToken } = useUser();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    _studentCache.data = null;
    _studentCache.timestamp = 0;
    try {
      const data = await getAllStudents(accessToken);
      const studentData = data || [];
      _studentCache.data = studentData;
      _studentCache.timestamp = Date.now();
      populateStudentAvatars(studentData);
      setStudents(studentData);
      try {
        await AsyncStorage.setItem('@faculty_student_directory_cache', JSON.stringify({
          data: studentData,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.warn('[FacultyStudentsDirectory] AsyncStorage refresh save failed:', err);
      }
    } catch (e) {
      console.warn('[FacultyStudentsDirectory] Error refreshing students:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStudentClick = (student) => {
    // Fire-and-forget: trigger backend registration without blocking navigation
    // (awaiting this was causing a re-fetch whose data dropped the student count by 1)
    getPublicProfile(accessToken, student.id).catch(e =>
      console.warn('[FacultyStudentsDirectory] Registration error:', e)
    );
    // Navigate directly to ERPHub landing on Results tab
    navigation.navigate('ERPHub', {
      screen: 'ERPResultsTab',
      params: { student }
    });
  };

  // ── StudentCard: isolated component so each card has its own imgError state ──
  // This is critical for Android 13 / MIUI 14: the ERP image URLs at
  // myportal.srms.ac.in fail silently on older Android (TLS/cipher issues).
  // Without onError + per-card state, the Image just shows blank forever.
  const StudentCard = React.memo(({ student: s, onPress }) => {
    const [imgErr, setImgErr] = React.useState(false);
    const phase = getStudentPhase(s);
    const displayInitial = (s.full_name || s.username || 'S').charAt(0).toUpperCase();
    const hasRealImage = s.avatar_url && !s.avatar_url.includes('pravatar.cc') && !imgErr;

    return (
      <TouchableOpacity
        style={styles.studentCard}
        onPress={() => onPress(s)}
        activeOpacity={0.8}
      >
        <View style={styles.studentAvatar}>
          {hasRealImage ? (
            <Image
              source={{ uri: s.avatar_url }}
              style={styles.avatarImage}
              onError={() => setImgErr(true)}
            />
          ) : (
            <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.avatarGradient}>
              <Text style={styles.avatarInitial}>{displayInitial}</Text>
            </LinearGradient>
          )}
        </View>

        <View style={styles.studentInfo}>
          <Text style={styles.studentName} numberOfLines={1}>
            {s.full_name || s.username || 'Student'}
          </Text>
          <Text style={styles.studentSub}>
            Roll No: {s.rollno || '—'}  ·  {s.branch || s.course || 'MBBS'}
          </Text>
        </View>

        <View style={styles.studentBadge}>
          <Text style={styles.badgeText}>Phase {phase}</Text>
        </View>
      </TouchableOpacity>
    );
  });
  
  // Parse faculty's phases (e.g. "1,2" -> [1, 2], "1" -> [1])
  const facultyPhases = React.useMemo(() => {
    if (!user?.phase) return [1];
    return String(user.phase).split(',').map(p => parseInt(p.trim())).filter(Boolean);
  }, [user?.phase]);

  // Default filter: if multiple phases, show 'ALL' initially, otherwise show the single phase
  const [selectedPhaseFilterState, setSelectedPhaseFilterState] = useState(() => {
    if (_lastSelectedPhaseFilter !== null) {
      return _lastSelectedPhaseFilter;
    }
    return facultyPhases.length > 1 ? 'ALL' : facultyPhases[0];
  });

  const selectedPhaseFilter = selectedPhaseFilterState;
  const setSelectedPhaseFilter = (val) => {
    setSelectedPhaseFilterState(val);
    _lastSelectedPhaseFilter = val;
  };

  const batchCounts = React.useMemo(() => {
    const counts = { ALL: 0, 1: 0, 2: 0, 3: 0 };
    students.forEach(s => {
      const isStudent = s.role?.toLowerCase() === 'student';
      const isMedical = (!s.category && !s.branch && !s.course) ||
                        s.category === 'medical' || 
                        (s.branch && s.branch.toUpperCase() === 'MBBS') || 
                        (s.course && s.course.toUpperCase().includes('MBBS')) ||
                        (s.course && s.course.replace(/\./g, '').toUpperCase().includes('MBBS'));
                        
      if (isStudent && isMedical) {
        const studentPhase = getStudentPhase(s);
        counts[studentPhase] = (counts[studentPhase] || 0) + 1;
        counts.ALL += 1;
      }
    });
    return counts;
  }, [students]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      // Serve from in-memory cache if still fresh AND non-empty
      const now = Date.now();
      if (_studentCache.data && _studentCache.data.length > 0 && (now - _studentCache.timestamp) < STUDENT_CACHE_TTL) {
        setStudents(_studentCache.data);
        setLoading(false);
        return;
      }

      // Try loading from AsyncStorage cache first for instant display (only if non-empty)
      const cacheKey = '@faculty_student_directory_cache';
      try {
        const cachedStr = await AsyncStorage.getItem(cacheKey);
        if (cachedStr) {
          const parsed = JSON.parse(cachedStr);
          if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) {
            setStudents(parsed.data);
            populateStudentAvatars(parsed.data);
            setLoading(false);
          }
        }
      } catch (err) {
        console.warn('[FacultyStudentsDirectory] AsyncStorage load failed:', err);
      }

      try {
        const data = await getAllStudents(accessToken);
        const studentData = data || [];
        // Only cache non-empty results to avoid poisoning the cache with empty arrays
        if (studentData.length > 0) {
          _studentCache.data = studentData;
          _studentCache.timestamp = Date.now();
          try {
            await AsyncStorage.setItem(cacheKey, JSON.stringify({
              data: studentData,
              timestamp: Date.now()
            }));
          } catch (err) {
            console.warn('[FacultyStudentsDirectory] AsyncStorage save failed:', err);
          }
        } else {
          // Clear stale cache if server returned empty — triggers fresh fetch next time
          _studentCache.data = null;
          _studentCache.timestamp = 0;
          await AsyncStorage.removeItem(cacheKey).catch(() => {});
        }
        // Populate cross-screen avatar lookup so logbook can show real photos
        populateStudentAvatars(studentData);
        setStudents(studentData);
      } catch (e) {
        console.warn('[FacultyStudentsDirectory] Error fetching students:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [accessToken]);

  // Filter students based on phase permissions, selected filter, and search query
  const filteredStudents = React.useMemo(() => {
    const list = students.filter(s => {
      // Must be a student and belong to the medical/MBBS category
      const isStudent = s.role?.toLowerCase() === 'student';
      const isMedical = (!s.category && !s.branch && !s.course) ||
                        s.category === 'medical' || 
                        (s.branch && s.branch.toUpperCase() === 'MBBS') || 
                        (s.course && s.course.toUpperCase().includes('MBBS')) ||
                        (s.course && s.course.replace(/\./g, '').toUpperCase().includes('MBBS'));
                        
      if (!isStudent || !isMedical) {
        return false;
      }

      const studentPhase = getStudentPhase(s);

      // Filter by selected phase filter capsule
      if (selectedPhaseFilter !== 'ALL' && studentPhase !== selectedPhaseFilter) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = (s.full_name || s.username || '').toLowerCase();
        const roll = (s.rollno || '').toLowerCase();
        return name.includes(query) || roll.includes(query);
      }

      return true;
    });

    // Sort alphabetically by name / username
    return list.sort((a, b) => {
      const nameA = (a.full_name || a.username || '').trim().toLowerCase();
      const nameB = (b.full_name || b.username || '').trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [students, selectedPhaseFilter, searchQuery]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={['#FFFFFF', '#F9FAFB']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('TeacherMain')} style={styles.backButton}>
          <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={styles.backButtonBg}>
            <Ionicons name="arrow-back" size={20} color="#EA580C" />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Students Directory</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Search and Filters */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search by name or roll number..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Batch Dropdown Selector */}
        {(() => {
          const getBatchLabel = (phase) => {
            if (phase === 'ALL') return 'All Batches';
            const year = 2026 - parseInt(phase);
            return `${year} Batch`;
          };

          const getSelectedLabel = () => {
            const label = getBatchLabel(selectedPhaseFilter);
            const count = batchCounts[selectedPhaseFilter] || 0;
            return `${label} (${count})`;
          };

          return (
            <View style={styles.dropdownWrapper}>
              <Text style={[styles.dropdownLabel, { color: colors.textMuted }]}>SELECT BATCH / PHASE</Text>
              <TouchableOpacity 
                style={[styles.dropdownButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
                onPress={() => setDropdownVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dropdownButtonText, { color: colors.textPrimary }]}>
                  {getSelectedLabel()}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          );
        })()}
      </View>

      {/* Student List */}
      {loading ? (
        <StudentListSkeleton />
      ) : filteredStudents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>No Students Found</Text>
          <Text style={styles.emptySub}>
            {searchQuery ? 'Try adjusting your search filters.' : `No students registered under Phase ${user.phase || 1}.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={item => item.rollno || item.id}
          contentContainerStyle={styles.listScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#EA580C']}
              tintColor="#EA580C"
            />
          }
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          renderItem={({ item: student }) => (
            <StudentCard student={student} onPress={handleStudentClick} />
          )}
        />
      )}

      {/* Dropdown Selection Modal */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setDropdownVisible(false)}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Batch / Phase</Text>
              <TouchableOpacity onPress={() => setDropdownVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

             <ScrollView style={styles.modalOptionsList} showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    selectedPhaseFilter === 'ALL' && [styles.optionItemActive, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.1)' : '#FFF7ED' }]
                  ]}
                  onPress={() => {
                    setSelectedPhaseFilter('ALL');
                    setDropdownVisible(false);
                  }}
                >
                  <Text style={[
                    styles.optionText, 
                    { color: colors.textPrimary },
                    selectedPhaseFilter === 'ALL' && { color: '#EA580C', fontWeight: '700' }
                  ]}>
                    All Batches
                  </Text>
                  <Text style={[
                    styles.optionCount, 
                    { color: colors.textMuted },
                    selectedPhaseFilter === 'ALL' && { color: '#EA580C', fontWeight: '700' }
                  ]}>
                    {batchCounts.ALL} students
                  </Text>
                </TouchableOpacity>

              {ALL_PHASES.map(ph => {
                // Phase 1 -> 2025 Batch, Phase 2 -> 2024 Batch, Phase 3 -> 2023 Batch
                const year = 2026 - ph;
                const label = `${year} Batch`;
                const count = batchCounts[ph] || 0;
                const isSelected = selectedPhaseFilter === ph;

                return (
                  <TouchableOpacity
                    key={ph}
                    style={[
                      styles.optionItem,
                      isSelected && [styles.optionItemActive, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.1)' : '#FFF7ED' }]
                    ]}
                    onPress={() => {
                      setSelectedPhaseFilter(ph);
                      setDropdownVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.optionText, 
                      { color: colors.textPrimary },
                      isSelected && { color: '#EA580C', fontWeight: '700' }
                    ]}>
                      {label} (Phase {ph})
                    </Text>
                    <Text style={[
                      styles.optionCount, 
                      { color: colors.textMuted },
                      isSelected && { color: '#EA580C', fontWeight: '700' }
                    ]}>
                      {count} students
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backButtonBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  searchFilterContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  filterCapsule: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterCapsuleActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  filterCapsuleInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  filterCapsuleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterCapsuleTextActive: {
    color: '#FFFFFF',
  },
  filterCapsuleTextInactive: {
    color: '#4B5563',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4B5563',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  listScroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  studentSub: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  studentBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EA580C',
  },
  dropdownWrapper: {
    marginTop: 12,
    width: '100%',
  },
  dropdownLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalOptionsList: {
    marginTop: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionItemActive: {
    borderColor: '#EA580C',
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionCount: {
    fontSize: 12,
  },
});

export default FacultyStudentsDirectoryScreen;
