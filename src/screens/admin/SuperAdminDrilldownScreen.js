import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getSuperAdminDrilldown, getAllStudents } from '../../data/apiService';
import { SkeletonBlock } from '../../components/SkeletonLoader';
import { APP_CONFIG } from '../../config/appConfig';

const StudentAvatar = ({ uri, name, colors }) => {
  if (uri) {
    return <Image source={{ uri }} style={styles.avatar} />;
  }
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'ST';
  return (
    <View style={[styles.avatar, { backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
        {initials}
      </Text>
    </View>
  );
};

const SuperAdminDrilldownScreen = ({ route, navigation }) => {
  const { category, title, department } = route.params || { category: 'ventures', title: 'Details', department: 'all' };
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState(department || 'all');
  const [activeFitnessFilter, setActiveFitnessFilter] = useState('student');

  useEffect(() => {
    if (route.params?.department) {
      setSelectedDept(route.params.department);
    }
  }, [route.params?.department]);

  const fetchData = async () => {
    try {
      if (accessToken) {
        if (category === 'student_directory') {
          const result = await getAllStudents(accessToken);
          if (result) {
            const mapped = (result || []).map(s => ({
              id: s?.rollno || s?.username || s?.id,
              student_name: s?.full_name || s?.username || 'Student',
              rollno: s?.rollno,
              course: s?.course,
              branch: s?.branch,
              category: s?.category || 'general',
              cgpa: s?.cgpa || 0.0,
              avatar_url: s?.avatar_url,
            }));
            setData(mapped);
          }
        } else if (category === 'fitness_students') {
          try {
            const result = await getSuperAdminDrilldown(accessToken, 'fitness_students');
            if (result && result.data) {
              const mapped = (result.data || []).map(item => ({
                id: item.id || item.user_id,
                student_name: item.student_name,
                avatar_url: item.avatar_url,
                steps: item.steps || 0,
                sleep_hours: parseFloat(item.sleep_hours || 0.0),
                kcal: item.kcal || 0,
                type: item.type || 'student',
                dept: item.branch || 'Medical'
              }));
              mapped.sort((a, b) => b.steps - a.steps);
              setData(mapped);
            }
          } catch (err) {
            console.warn('[DrilldownScreen] Fitness fetch error:', err);
          }
        } else {
          const result = await getSuperAdminDrilldown(accessToken, category);
          if (result) {
            setData(result);
          }
        }
      }
    } catch (err) {
      console.warn('[DrilldownScreen] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [category, accessToken]);

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
        Alert.alert('Cannot Open', 'Unable to open this type of link.');
      }
    } catch (e) {
      console.warn('[PitchDeck] Linking failed:', e);
      Alert.alert('Error', 'An error occurred while trying to open the pitch deck.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredData = data.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (
      (item?.student_name && item.student_name.toLowerCase().includes(q)) ||
      (item?.rollno && item.rollno.toLowerCase().includes(q)) ||
      (item?.name && item.name.toLowerCase().includes(q)) ||
      (item?.tagline && item.tagline.toLowerCase().includes(q))
    );
    if (category === 'student_directory' && selectedDept !== 'all') {
      return matchesSearch && String(item?.category || '').toLowerCase() === selectedDept.toLowerCase();
    }
    if (category === 'fitness_students') {
      return matchesSearch && item?.type === activeFitnessFilter;
    }
    return matchesSearch;
  });

  const renderSkeleton = () => (
    <View style={{ gap: 16, padding: 16 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border, gap: 12 },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <SkeletonBlock width={40} height={40} borderRadius={20} />
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBlock width={120} height={14} borderRadius={6} />
              <SkeletonBlock width={80} height={10} borderRadius={5} />
            </View>
            <SkeletonBlock width={70} height={22} borderRadius={11} />
          </View>
          <SkeletonBlock width="100%" height={32} borderRadius={8} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  );

  const getStageColor = stage => {
    switch (stage?.toLowerCase()) {
      case 'idea': return colors.primary;
      case 'pre_revenue': return colors.orange;
      case 'seed': return colors.success;
      case 'series_a': return '#8B5CF6';
      default: return colors.textSecondary;
    }
  };

  const renderItem = ({ item }) => {
    if (category === 'ventures') {
      return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <StudentAvatar uri={item.avatar_url} name={item.student_name} colors={colors} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.founderName, { color: colors.textPrimary }]}>{item.student_name}</Text>
                <Text style={[styles.ventureName, { color: colors.textMuted }]}>{item.name}</Text>
              </View>
            </View>
            <View style={[styles.badge, { backgroundColor: getStageColor(item.stage) + '20' }]}>
              <Text style={[styles.badgeText, { color: getStageColor(item.stage) }]}>
                {item.stage?.toUpperCase().replace('_', ' ')}
              </Text>
            </View>
          </View>

          <Text style={[styles.tagline, { color: colors.textSecondary }]}>"{item.tagline}"</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>{item.description}</Text>

          <View style={styles.cardFooter}>
            <Text style={[styles.footerStatus, { color: item.approval_status === 'approved' ? colors.success : colors.orange }]}>
              ● {item.approval_status === 'approved' ? 'Approved' : 'Pending Review'}
            </Text>
            {item.pitch_deck_url ? (
              <TouchableOpacity 
                style={styles.deckBtn}
                onPress={() => handleOpenLink(item.pitch_deck_url)}
              >
                <Feather name="file-text" size={14} color={colors.primary} />
                <Text style={[styles.deckBtnText, { color: colors.primary }]}>View Pitch Deck</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      );
    }

    if (category === 'tensed_students' || category === 'happy_students' || category === 'neutral_students') {
      const isStressed = item.mood === 'stressed' || item.mood === 'tensed';
      const isNeutral = item.mood === 'neutral';
      
      let badgeColor = colors.success;
      let badgeText = '🟢 HAPPY';
      if (isStressed) {
        badgeColor = colors.danger;
        badgeText = '🟡 TENSED';
      } else if (isNeutral) {
        badgeColor = colors.warning;
        badgeText = '⚪ NEUTRAL';
      }

      return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <StudentAvatar uri={item.avatar_url} name={item.student_name} colors={colors} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.founderName, { color: colors.textPrimary }]}>{item.student_name}</Text>
                <Text style={[styles.rollnoText, { color: colors.textSecondary }]}>{item.rollno}</Text>
              </View>
            </View>
            <View style={[styles.badge, { backgroundColor: badgeColor + '20' }]}>
              <Text style={[styles.badgeText, { color: badgeColor }]}>
                {badgeText}
              </Text>
            </View>
          </View>
          {item.notes ? (
            <View style={[styles.notesContainer, { backgroundColor: isDark ? colors.background : '#F9FAFB' }]}>
              <Text style={[styles.notesText, { color: colors.textPrimary }]}>"{item.notes}"</Text>
            </View>
          ) : null}
        </View>
      );
    }

    if (category === 'at_risk_students') {
      return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.danger, borderLeftWidth: 4 }]}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <StudentAvatar uri={item.avatar_url} name={item.student_name} colors={colors} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.founderName, { color: colors.textPrimary }]}>{item.student_name}</Text>
                <Text style={[styles.rollnoText, { color: colors.textSecondary }]}>{item.rollno}</Text>
              </View>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.danger + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.danger }]}>
                ⚠️ {item.risk_level?.toUpperCase()} RISK
              </Text>
            </View>
          </View>
          <View style={{ marginVertical: 8 }}>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              <Text style={{ fontWeight: '700' }}>Trigger Source:</Text> {item.source}
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary, marginTop: 4 }]}>
              <Text style={{ fontWeight: '700' }}>Status:</Text> {item.status?.toUpperCase()}
            </Text>
          </View>
        </View>
      );
    }

    if (category === 'hustle_students') {
      return (
        <TouchableOpacity 
          style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.navigate('OtherStudentProfile', { student: { id: item.user_id || item.student_id || item.id, name: item.student_name, avatar: item.avatar_url } })}
        >
          <StudentAvatar uri={item.avatar_url} name={item.student_name} colors={colors} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.founderName, { color: colors.textPrimary }]}>{item.student_name}</Text>
            <Text style={[styles.rollnoText, { color: colors.textSecondary }]}>
              {item.course} • {item.branch}
            </Text>
          </View>
          <View style={[styles.scorePill, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.scoreText, { color: colors.primary }]}>{item.score} pts</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (category === 'student_directory') {
      return (
        <TouchableOpacity 
          style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.navigate('OtherStudentProfile', { student: { id: item?.id || item?.user_id || item?.student_id, name: item?.student_name, avatar: item?.avatar_url } })}
          activeOpacity={0.7}
        >
          <StudentAvatar uri={item?.avatar_url} name={item?.student_name} colors={colors} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.founderName, { color: colors.textPrimary }]}>{item?.student_name}</Text>
            <Text style={[styles.rollnoText, { color: colors.textSecondary }]}>
              {item?.rollno} • {item?.course} ({item?.branch})
            </Text>
            <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700', textTransform: 'uppercase', marginTop: 3 }}>
              {item?.category}
            </Text>
          </View>
          <View style={[styles.scorePill, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.scoreText, { color: colors.primary }]}>CGPA: {item?.cgpa}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (category === 'cv_students') {
      return (
        <TouchableOpacity 
          style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.navigate('OtherStudentProfile', { student: { id: item.user_id || item.student_id || item.id, name: item.student_name, avatar: item.avatar_url } })}
        >
          <StudentAvatar uri={item.avatar_url} name={item.student_name} colors={colors} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.founderName, { color: colors.textPrimary }]}>{item.student_name}</Text>
            <Text style={[styles.rollnoText, { color: colors.textSecondary }]}>CGPA: {item.cgpa}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: item.cv_status === 'Compiled' ? colors.success + '20' : colors.orange + '20' }]}>
            <Text style={[styles.badgeText, { color: item.cv_status === 'Compiled' ? colors.success : colors.orange }]}>
              {item.cv_status}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (category === 'fitness_students') {
      const roleText = item.type === 'faculty' ? `Faculty (${item.dept})` : 'Medical Student';
      return (
        <View style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <StudentAvatar uri={item.avatar_url} name={item.student_name} colors={colors} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.founderName, { color: colors.textPrimary }]}>{item.student_name}</Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginBottom: 2 }}>{roleText}</Text>
            <Text style={[styles.rollnoText, { color: colors.textMuted }]}>
              Steps: {item.steps?.toLocaleString() || 0} • Sleep: {item.sleep_hours || 0}h
            </Text>
          </View>
          <View style={[styles.scorePill, { backgroundColor: colors.success + '20' }]}>
            <Text style={[styles.scoreText, { color: colors.success }]}>{item.kcal || 0} kcal</Text>
          </View>
        </View>
      );
    }

    if (category === 'grievances') {
      const getPriorityColor = pri => {
        if (pri === 'high') return colors.danger;
        if (pri === 'medium') return colors.orange;
        return colors.primary;
      };
      const getStatusColor = st => {
        if (st === 'resolved') return colors.success;
        if (st === 'in-progress') return colors.orange;
        return colors.danger;
      };

      return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <StudentAvatar uri={item?.avatar_url} name={item?.student_name} colors={colors} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.founderName, { color: colors.textPrimary }]}>{item?.student_name}</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{item?.category}</Text>
              </View>
            </View>
            <View style={[styles.badge, { backgroundColor: getPriorityColor(item?.priority) + '20' }]}>
              <Text style={[styles.badgeText, { color: getPriorityColor(item?.priority) }]}>
                {item?.priority?.toUpperCase()} PRIORITY
              </Text>
            </View>
          </View>
          
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginVertical: 6 }}>
            {item?.title}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
            {item?.description}
          </Text>

          <View style={[styles.cardFooter, { marginTop: 12, borderTopColor: colors.border }]}>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              Opened: {item?.created_at ? new Date(item?.created_at).toLocaleDateString() : 'N/A'}
            </Text>
            <View style={[styles.badge, { backgroundColor: getStatusColor(item?.status) + '20' }]}>
              <Text style={[styles.badgeText, { color: getStatusColor(item?.status) }]}>
                {item?.status?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={{ color: colors.textPrimary }}>{JSON.stringify(item)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Input */}
      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search student or roll number..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: colors.textPrimary }]}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Department Filter Pills (Only for student_directory category) */}
      {category === 'student_directory' && (
        <View style={styles.filterContainer}>
          {['all', 'medical', 'engineering', 'management'].map((dept) => {
            const isSel = selectedDept.toLowerCase() === dept.toLowerCase();
            return (
              <TouchableOpacity
                key={dept}
                style={[
                  styles.filterPill,
                  isSel ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }
                ]}
                onPress={() => setSelectedDept(dept)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, { color: isSel ? '#FFF' : colors.textPrimary }]}>
                  {dept.charAt(0).toUpperCase() + dept.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Fitness Filter Pills (Only for fitness_students category) */}
      {category === 'fitness_students' && (
        <View style={styles.filterContainer}>
          {[
            { label: 'Medical Students', value: 'student', icon: 'account-outline' },
            { label: 'Faculty & Staff', value: 'faculty', icon: 'school-outline' }
          ].map((pill) => {
            const isSel = activeFitnessFilter === pill.value;
            return (
              <TouchableOpacity
                key={pill.value}
                onPress={() => setActiveFitnessFilter(pill.value)}
                style={[
                  styles.filterPill,
                  isSel ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }
                ]}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons 
                    name={pill.icon} 
                    size={14} 
                    color={isSel ? '#FFFFFF' : colors.textSecondary} 
                  />
                  <Text style={[styles.filterPillText, isSel ? { color: '#FFFFFF', fontWeight: '700' } : { color: colors.textSecondary }]}>
                    {pill.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {loading ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="users" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No students found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  founderName: {
    fontSize: 15,
    fontWeight: '700',
  },
  ventureName: {
    fontSize: 12,
    marginTop: 2,
  },
  rollnoText: {
    fontSize: 12,
    marginTop: 2,
  },
  tagline: {
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '500',
    marginVertical: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  footerStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  deckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deckBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  notesContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  scorePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default SuperAdminDrilldownScreen;
