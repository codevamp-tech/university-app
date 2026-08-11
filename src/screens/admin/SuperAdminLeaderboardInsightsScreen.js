import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Image,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getSuperAdminAnalytics, getAllStudents } from '../../data/apiService';
import { LinearGradient } from 'expo-linear-gradient';
import { SkeletonBlock } from '../../components/SkeletonLoader';
import { getStudentAvatar } from '../../utils/studentAvatarCache';

const SafeLeaderboardAvatar = ({ uri, name, style, colors }) => {
  const [error, setError] = useState(false);
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'ST';

  if (!uri || error || uri.includes('pravatar.cc')) {
    return (
      <View style={[styles.avatarInitialsContainer, { backgroundColor: colors.primaryLight }]}>
        <Text style={[styles.avatarInitialsText, { color: colors.primary }]}>
          {initials}
        </Text>
      </View>
    );
  }

  return (
    <Image 
      source={{ uri }} 
      style={style} 
      onError={() => setError(true)}
    />
  );
};

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

const SuperAdminLeaderboardInsightsScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();
  const [data, setData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState('ALL');
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const loadData = async () => {
    try {
      if (accessToken) {
        const [stats, list] = await Promise.all([
          getSuperAdminAnalytics(accessToken),
          getAllStudents(accessToken, true)
        ]);
        if (stats) setData(stats);
        if (list) {
          const mapped = list.map(s => ({
            id: s.rollno || s.username || s.id,
            name: s.full_name || s.username || 'Student',
            course: s.course,
            branch: s.branch,
            category: s.category,
            role: s.role,
            cgpa: s.cgpa || 0,
            attendance: s.attendance || 0,
            certsDone: s.certificates_done || [],
            certsInProgress: s.certificates_in_progress || [],
            leadership: [],
            extracurricular: [],
            gender: 'M',
            avatar_url: s.avatar_url,
            batch_year: s.batch_year || s.batchYear,
            semester: s.semester,
            current_year: s.current_year || s.currentYear,
            phase: s.phase,
            rollno: s.rollno,
            username: s.username,
          }));
          setStudents(mapped);
        }
      }
    } catch (err) {
      console.warn('[LeaderboardInsights] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Only include Medical/MBBS students (filter out non-student roles and explicit engineering/management)
  const medicalStudents = students.filter(s => {
    const isStudent = s.role?.toLowerCase() === 'student';
    if (!isStudent) return false;

    // Filter out mock/seeded student accounts strictly by username, id, or rollno
    const userLower = (s.username || '').toLowerCase();
    const idLower = (s.id || '').toLowerCase();
    const rollLower = (s.rollno || '').toLowerCase();
    if (
      ['aarav', 'ishani', 'kabir', 'meera', 'rohan', 'dummy_user123', 'na'].includes(userLower) ||
      ['aarav', 'ishani', 'kabir', 'meera', 'rohan', 'dummy_user123', 'na'].includes(idLower) ||
      ['aarav', 'ishani', 'kabir', 'meera', 'rohan', 'dummy_user123', 'na'].includes(rollLower) ||
      idLower.startsWith('10000000-0000-')
    ) {
      return false;
    }

    const cat = (s.category || '').toLowerCase();
    if (cat === 'engineering' || cat === 'management') {
      return false;
    }
    return true;
  });

  // Compute batch counts for filter selector
  const batchCounts = React.useMemo(() => {
    const counts = { ALL: 0, 1: 0, 2: 0, 3: 0 };
    medicalStudents.forEach(s => {
      const studentPhase = getStudentPhase(s);
      if (counts[studentPhase] !== undefined) {
        counts[studentPhase] += 1;
      }
      counts.ALL += 1;
    });
    return counts;
  }, [medicalStudents]);

  const renderSkeleton = () => (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { backgroundColor: colors.card, height: 110, justifyContent: 'center' }]}>
          <SkeletonBlock width={120} height={12} borderRadius={6} style={{ marginBottom: 8 }} />
          <SkeletonBlock width={180} height={18} borderRadius={9} />
        </View>

        <SkeletonBlock width={150} height={16} borderRadius={8} style={{ marginTop: 24, marginBottom: 16 }} />
        <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.card, gap: 12 }}>
          <SkeletonBlock width="100%" height={30} borderRadius={8} />
          <SkeletonBlock width="100%" height={30} borderRadius={8} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  if (loading) {
    return renderSkeleton();
  }

  const lStats = data?.leaderboard || { top_dept: 'Medical', avg_social_credits: 0, rewards_claimed: 0 };

  // Compute leaderboard scores for medical students only
  const computedLeaderboard = medicalStudents
    .filter(s => {
      if (selectedPhaseFilter === 'ALL') return true;
      return getStudentPhase(s) === selectedPhaseFilter;
    })
    .map(s => {
      const certCount = (s.certsDone || []).filter(c => {
        const cl = c.toLowerCase();
        return cl !== 'yes' && cl !== 'no' && cl !== 'na' && cl !== 'n/a' && cl !== 'none' && cl !== '';
      }).length;

      const leadCount = (s.leadership || []).filter(c => c && c.toLowerCase() !== 'no' && c.toLowerCase() !== 'na' && c.toLowerCase() !== 'n/a' && c.toLowerCase() !== 'none').length;
      const extraCount = (s.extracurricular || []).filter(c => c && c.toLowerCase() !== 'no' && c.toLowerCase() !== 'na' && c.toLowerCase() !== 'n/a' && c.toLowerCase() !== 'none').length;
      const cgpaVal = Math.min(s.cgpa > 10 ? s.cgpa / 10 : s.cgpa, 10.0);
      const academicScore = Math.round(cgpaVal * 200) + Math.round((s.attendance || 0) * 5);
      const hasAmbassador = (s.leadership || []).some(l => l && (l.toLowerCase().includes('ambassador') || l.toLowerCase().includes('ambassasor')));
      const ambassadorBonus = hasAmbassador ? 5000 : 0;
      const totalScore = (certCount * 500) + (extraCount * 500) + (leadCount * 1000) + academicScore + ambassadorBonus;

      let avatar = s.avatar_url || getStudentAvatar(s.rollno) || null;

      return {
        id: s.id,
        name: s.name,
        score: totalScore,
        avatar,
        course: s.course,
        branch: s.branch,
        category: s.category,
        batch_year: s.batch_year,
        semester: s.semester,
        current_year: s.current_year,
        phase: s.phase,
      };
    });

  // Sort by score descending
  computedLeaderboard.sort((a, b) => b.score - a.score);

  // Assign ranks based on sorted scores
  computedLeaderboard.forEach((item, index) => {
    item.rank = index + 1;
  });

  const displayLeaderboard = computedLeaderboard; // Show all students

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header Block */}
        <LinearGradient
          colors={isDark ? ['#1E3A8A', '#0F172A'] : ['#FEF3C7', '#FFFFFF']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            {navigation && (
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
                <Feather name="arrow-left" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
            <MaterialCommunityIcons name="trophy" size={28} color="#FBBF24" />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>The Hustle Leaderboard</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Showing {medicalStudents.length} registered MBBS students</Text>
            </View>
          </View>
        </LinearGradient>



        {/* Phase Filter Selector */}
        {(() => {
          const getBatchLabel = (phase) => {
            if (phase === 'ALL') return 'All Batches';
            const year = new Date().getFullYear() - parseInt(phase);
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

        {/* Dynamic Leaderboard matching student design */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>MBBS Student Standings</Text>
        <View style={[styles.leaderboardCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          {displayLeaderboard.length === 0 ? (
            <Text style={{ padding: 16, textAlign: 'center', color: colors.textSecondary }}>No student leaderboard data found.</Text>
          ) : (
            displayLeaderboard.map((item, index) => (
              <View key={item.id || index.toString()} style={[
                styles.boardItem,
                index === displayLeaderboard.length - 1 && { borderBottomWidth: 0 },
                { borderBottomColor: colors.border }
              ]}>
                <View style={[styles.boardItemLeft, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.boardRank, { color: colors.textMuted }, item.rank <= 3 && { color: '#EA580C' }]}>{item.rank}</Text>
                  <SafeLeaderboardAvatar
                    uri={item.avatar}
                    name={item.name}
                    style={styles.boardAvatar}
                    colors={colors}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.boardName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.textSecondary || '#6B7280' }} numberOfLines={1}>
                      {(() => {
                        const course = (item.course || '').trim();
                        const branch = (item.branch || '').trim();
                        let displayVal = '';
                        
                        if (item.category === 'medical' || (!course && !branch)) {
                          displayVal = 'MBBS';
                        } else if (!course) {
                          displayVal = branch;
                        } else if (!branch) {
                          displayVal = course;
                        } else {
                          const courseNorm = course.replace(/\./g, '').toUpperCase();
                          const branchNorm = branch.replace(/\./g, '').toUpperCase();
                          
                          if (courseNorm.includes(branchNorm) || branchNorm.includes(courseNorm)) {
                            displayVal = course;
                          } else {
                            displayVal = `${course} (${branch})`;
                          }
                        }
                        
                        // Override 'Medical' or 'medical' to 'MBBS'
                        if (displayVal && (displayVal.toUpperCase() === 'MEDICAL' || displayVal.toUpperCase().includes('MEDICAL'))) {
                          displayVal = 'MBBS';
                        }
                        
                        // Compute Phase
                        const phase = getStudentPhase(item);
                        if (phase) {
                          return `${displayVal} · Phase ${phase}`;
                        }
                        return displayVal;
                      })()}
                    </Text>
                  </View>
                </View>
                <View style={[styles.scorePill, { backgroundColor: colors.border }]}>
                  <Text style={[styles.scorePillText, { color: colors.textSecondary }]}>
                    {item.score.toLocaleString()} pts
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Padding for absolute bottom tab bar */}
        <View style={{ height: 80 }} />
      </ScrollView>

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

              {[1, 2, 3].map(ph => {
                const year = new Date().getFullYear() - ph;
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  gridCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardVal: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  leaderboardCard: {
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  boardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  boardItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boardRank: {
    width: 24,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  boardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginHorizontal: 12,
  },
  avatarInitialsContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialsText: {
    fontSize: 14,
    fontWeight: '700',
  },
  boardName: {
    fontSize: 16,
    fontWeight: '800',
  },
  scorePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scorePillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  distRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  distLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  distVal: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  dropdownWrapper: {
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 8,
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

export default SuperAdminLeaderboardInsightsScreen;
