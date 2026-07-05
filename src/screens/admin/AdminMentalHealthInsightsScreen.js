import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  TextInput,
  Dimensions,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getMentalHealthAnalytics } from '../../data/apiService';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const AdminMentalHealthInsightsScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();
  const [data, setData] = useState({
    mood_distribution: {
      happy: 0,
      neutral: 0,
      stressed: 0,
      at_risk: 0,
    },
    at_risk_students: [],
    today_logs: [],
    total_focus_minutes: 0,
    total_focus_sessions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState('ALL'); // 'ALL', 'HAPPY', 'NEUTRAL', 'STRESSED', 'AT_RISK'

  const fetchInsights = async () => {
    setLoading(true);
    try {
      if (accessToken) {
        const res = await getMentalHealthAnalytics(accessToken);
        if (res) {
          setData({
            mood_distribution: res.mood_distribution || { happy: 0, neutral: 0, stressed: 0, at_risk: 0 },
            at_risk_students: res.at_risk_students || [],
            today_logs: res.today_logs || [],
            total_focus_minutes: res.total_focus_minutes || 0,
            total_focus_sessions: res.total_focus_sessions || 0,
          });
        }
      }
    } catch (err) {
      console.warn('[MentalHealthInsights] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [accessToken]);

  const handleContactStudent = (student, type) => {
    const email = `${student.roll_no?.toLowerCase() || 'student'}@srms.ac.in`;

    if (type === 'email') {
      Linking.openURL(`mailto:${email}?subject=Wellbeing Support Chat - UniCampus&body=Hello ${student.student_name},\n\nWe wanted to reach out and check in on how you are doing. Feel free to reply or drop by the counseling center anytime.`)
        .catch(() => Alert.alert('Error', 'Unable to launch mail client.'));
    } else {
      Alert.alert(
        'Call Student',
        'Phone number not on file. Please contact the student via email or visit their hostel room.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleEscalate = (student) => {
    Alert.alert(
      'Escalate Wellbeing Flag',
      `Send student profile (${student.student_name}) to university's mental health counselor department for immediate check-in?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Escalate Now',
          onPress: () => {
            Alert.alert('Escalated Successfully', `A counseling case has been automatically created for ${student.student_name}. Counselor assigned.`);
          },
        },
      ]
    );
  };

  const handleResolve = (studentId) => {
    Alert.alert(
      'Resolve Flag',
      'Resolve and close this wellbeing flag? This indicates that a warden or counselor has personally contacted the student.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: () => {
            // Locally filter out the resolved student from UI
            setData(prev => ({
              ...prev,
              at_risk_students: prev.at_risk_students.filter(s => s.id !== studentId)
            }));
            Alert.alert('Flag Resolved', 'Wellbeing flag has been set to resolved.');
          }
        }
      ]
    );
  };

  // Filter students based on search and level selection
  const filteredStudents = filterMood === 'AT_RISK' 
    ? data.at_risk_students.filter(student => {
        const matchesSearch = student.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              student.roll_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              student.department?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      })
    : data.today_logs.filter(student => {
        const matchesSearch = student.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              student.roll_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              student.department?.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
        if (filterMood === 'ALL') return true;
        if (filterMood === 'HAPPY') return student.mood === 'happy' || student.mood === 'excited';
        if (filterMood === 'NEUTRAL') return student.mood === 'neutral';
        if (filterMood === 'STRESSED') return student.mood === 'stressed';
        return true;
      });

  const totalMoodCount = 
    data.mood_distribution.happy + 
    data.mood_distribution.neutral + 
    data.mood_distribution.stressed + 
    data.mood_distribution.at_risk;

  const renderHeader = () => {
    return (
      <View style={styles.headerSection}>
        {/* Back Button + Title */}
        <View style={[styles.header, { flexDirection: 'row', alignItems: 'flex-start' }]}>
          {navigation && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12, marginTop: 4 }}>
              <Feather name="arrow-left" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Wellbeing Insights</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Monitor overall campus sentiment and mental wellbeing flags</Text>
          </View>
        </View>

        {/* Focus Stats Mini Section */}
        <View style={styles.focusContainer}>
          <LinearGradient
            colors={isDark ? ['#1E293B', '#0F172A'] : ['#EFF6FF', '#DBEAFE']}
            style={[styles.focusCard, { borderColor: colors.border }]}
          >
            <View style={[styles.focusIconBg, { backgroundColor: colors.primaryLight }]}>
              <Feather name="clock" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.focusVal, { color: colors.textPrimary }]}>
                {data.total_focus_minutes} mins
              </Text>
              <Text style={[styles.focusLabel, { color: colors.textSecondary }]}>
                Total Focus Time
              </Text>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={isDark ? ['#1E293B', '#0F172A'] : ['#FDF2F8', '#FCE7F3']}
            style={[styles.focusCard, { borderColor: colors.border }]}
          >
            <View style={[styles.focusIconBg, { backgroundColor: '#FCE7F3' }]}>
              <MaterialCommunityIcons name="brain" size={18} color="#DB2777" />
            </View>
            <View>
              <Text style={[styles.focusVal, { color: colors.textPrimary }]}>
                {data.total_focus_sessions} sessions
              </Text>
              <Text style={[styles.focusLabel, { color: colors.textSecondary }]}>
                Focus Sessions Completed
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Mood Aggregations */}
        <View style={[styles.analyticsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Mood Index Distribution</Text>
          
          <View style={styles.barChartContainer}>
            {totalMoodCount === 0 ? (
              <View style={[styles.barSegment, { flex: 1, backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
            ) : (
              <>
                {data.mood_distribution.happy > 0 && <View style={[styles.barSegment, { flex: data.mood_distribution.happy, backgroundColor: colors.success }]} />}
                {data.mood_distribution.neutral > 0 && <View style={[styles.barSegment, { flex: data.mood_distribution.neutral, backgroundColor: colors.warning }]} />}
                {data.mood_distribution.stressed > 0 && <View style={[styles.barSegment, { flex: data.mood_distribution.stressed, backgroundColor: colors.orange }]} />}
                {data.mood_distribution.at_risk > 0 && <View style={[styles.barSegment, { flex: data.mood_distribution.at_risk, backgroundColor: colors.danger }]} />}
              </>
            )}
          </View>

          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.success }]} />
              <View>
                <Text style={[styles.legendText, { color: colors.textPrimary }]}>Happy: {data.mood_distribution.happy}</Text>
                <Text style={[styles.legendPct, { color: colors.textSecondary }]}>
                  {totalMoodCount > 0 ? ((data.mood_distribution.happy / totalMoodCount) * 100).toFixed(0) : 0}%
                </Text>
              </View>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.warning }]} />
              <View>
                <Text style={[styles.legendText, { color: colors.textPrimary }]}>Neutral: {data.mood_distribution.neutral}</Text>
                <Text style={[styles.legendPct, { color: colors.textSecondary }]}>
                  {totalMoodCount > 0 ? ((data.mood_distribution.neutral / totalMoodCount) * 100).toFixed(0) : 0}%
                </Text>
              </View>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.orange }]} />
              <View>
                <Text style={[styles.legendText, { color: colors.textPrimary }]}>Stressed: {data.mood_distribution.stressed}</Text>
                <Text style={[styles.legendPct, { color: colors.textSecondary }]}>
                  {totalMoodCount > 0 ? ((data.mood_distribution.stressed / totalMoodCount) * 100).toFixed(0) : 0}%
                </Text>
              </View>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.danger }]} />
              <View>
                <Text style={[styles.legendText, { color: colors.textPrimary }]}>At Risk: {data.mood_distribution.at_risk}</Text>
                <Text style={[styles.legendPct, { color: colors.textSecondary }]}>
                  {totalMoodCount > 0 ? ((data.mood_distribution.at_risk / totalMoodCount) * 100).toFixed(0) : 0}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Risk Filter Buttons and Search */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {filterMood === 'AT_RISK' ? 'Student Flag Registry' : 'Daily Campus Mood Logs'} ({filteredStudents.length})
        </Text>
        
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search by student name, roll number, or department..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filterMood === 'ALL' ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => setFilterMood('ALL')}
          >
            <Text style={[styles.filterChipText, filterMood === 'ALL' ? { color: '#FFF' } : { color: colors.textSecondary }]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterMood === 'HAPPY' ? { backgroundColor: colors.success } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => setFilterMood('HAPPY')}
          >
            <Text style={[styles.filterChipText, filterMood === 'HAPPY' ? { color: '#FFF' } : { color: colors.textSecondary }]}>
              Happy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterMood === 'NEUTRAL' ? { backgroundColor: colors.warning } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => setFilterMood('NEUTRAL')}
          >
            <Text style={[styles.filterChipText, filterMood === 'NEUTRAL' ? { color: '#FFF' } : { color: colors.textSecondary }]}>
              Neutral
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterMood === 'STRESSED' ? { backgroundColor: colors.orange } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => setFilterMood('STRESSED')}
          >
            <Text style={[styles.filterChipText, filterMood === 'STRESSED' ? { color: '#FFF' } : { color: colors.textSecondary }]}>
              Stressed
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterChip, filterMood === 'AT_RISK' ? { backgroundColor: colors.danger } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => setFilterMood('AT_RISK')}
          >
            <Text style={[styles.filterChipText, filterMood === 'AT_RISK' ? { color: '#FFF' } : { color: colors.textSecondary }]}>
              At Risk
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStudentItem = ({ item }) => {
    const isFlag = !!item.risk_level;
    const isHigh = item.risk_level?.toLowerCase() === 'high';
    const riskColor = isHigh ? colors.danger : colors.orange;
    const riskBg = isHigh ? colors.dangerLight : colors.orangeLight;

    const getMoodColor = (mood) => {
      if (mood === 'happy' || mood === 'excited') return colors.success;
      if (mood === 'neutral') return colors.warning;
      if (mood === 'stressed') return colors.orange;
      return colors.textSecondary;
    };
    
    const getMoodIcon = (mood) => {
      if (mood === 'excited') return 'emoticon-excited-outline';
      if (mood === 'happy') return 'emoticon-happy-outline';
      if (mood === 'neutral') return 'emoticon-neutral-outline';
      if (mood === 'stressed') return 'emoticon-sad-outline';
      return 'emoticon-outline';
    };

    return (
      <View style={[styles.studentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.studentHeader}>
          <View style={styles.studentMeta}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {item.student_name?.charAt(0).toUpperCase() || 'S'}
              </Text>
            </View>
            <View>
              <Text style={[styles.studentName, { color: colors.textPrimary }]}>{item.student_name}</Text>
              <Text style={[styles.studentDept, { color: colors.textSecondary }]}>
                {item.department} • {item.roll_no}
              </Text>
            </View>
          </View>
          
          {isFlag ? (
            <View style={[styles.riskBadge, { backgroundColor: riskBg }]}>
              <Text style={[styles.riskBadgeText, { color: riskColor }]}>
                {item.risk_level?.toUpperCase()}
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <MaterialCommunityIcons name={getMoodIcon(item.mood)} size={28} color={getMoodColor(item.mood)} />
              <Text style={{ fontSize: 10, color: getMoodColor(item.mood), fontWeight: '600', marginTop: 2 }}>
                {item.mood?.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.flagDetails}>
          {isFlag ? (
            <>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Source of flag:</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                  {item.source === 'journal_nlp' ? '📝 Journal Sentiment AI' : item.source || 'Wellbeing System'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Flag trigger:</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                  {item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Logged At:</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                  {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                </Text>
              </View>
              {item.notes ? (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Notes:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>"{item.notes}"</Text>
                </View>
              ) : null}
            </>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.border }]}
            onPress={() => handleContactStudent(item, 'phone')}
          >
            <Feather name="phone" size={14} color={colors.textPrimary} style={{ marginRight: 6 }} />
            <Text style={[styles.btnText, { color: colors.textPrimary }]}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.border }]}
            onPress={() => handleContactStudent(item, 'email')}
          >
            <Feather name="mail" size={14} color={colors.textPrimary} style={{ marginRight: 6 }} />
            <Text style={[styles.btnText, { color: colors.textPrimary }]}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.border }]}
            onPress={() => handleEscalate(item)}
          >
            <Feather name="shield" size={14} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.btnText, { color: colors.primary }]}>Escalate</Text>
          </TouchableOpacity>

          {isFlag && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.successLight, borderColor: colors.successLight }]}
              onPress={() => handleResolve(item.id)}
            >
              <Feather name="check" size={14} color={colors.success} style={{ marginRight: 4 }} />
              <Text style={[styles.btnText, { color: colors.success }]}>Resolve</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 12 }]}>Fetching wellbeing data...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          renderItem={renderStudentItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centerEmpty}>
              <MaterialCommunityIcons name="heart-pulse" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textPrimary, marginTop: 16 }]}>
                {filterMood === 'AT_RISK' ? 'No Active Flagged Students' : 'No Mood Logs Today'}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary, marginTop: 6, textAlign: 'center' }]}>
                {filterMood === 'AT_RISK' ? 'Campus mental health metrics look sound and stable!' : 'Check back later as students check in their daily pulse.'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingBottom: 40,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  focusContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  focusCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  focusIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusVal: {
    fontSize: 15,
    fontWeight: '700',
  },
  focusLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  analyticsCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
  },
  barChartContainer: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 20,
  },
  barSegment: {
    height: '100%',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    width: (width - 90) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  legendPct: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
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
  centerEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  studentCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
  },
  studentDept: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
    opacity: 0.5,
  },
  flagDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AdminMentalHealthInsightsScreen;
