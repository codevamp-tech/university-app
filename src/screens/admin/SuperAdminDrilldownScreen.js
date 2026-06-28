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
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getSuperAdminDrilldown } from '../../data/apiService';
import { SkeletonBlock } from '../../components/SkeletonLoader';

const SuperAdminDrilldownScreen = ({ route, navigation }) => {
  const { category, title } = route.params || { category: 'ventures', title: 'Details' };
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      if (accessToken) {
        const result = await getSuperAdminDrilldown(accessToken, category);
        if (result) {
          setData(result);
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredData = data.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      (item.student_name && item.student_name.toLowerCase().includes(q)) ||
      (item.rollno && item.rollno.toLowerCase().includes(q)) ||
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.tagline && item.tagline.toLowerCase().includes(q))
    );
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
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
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
              <TouchableOpacity style={styles.deckBtn}>
                <Feather name="file-text" size={14} color={colors.primary} />
                <Text style={[styles.deckBtnText, { color: colors.primary }]}>View Pitch Deck</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      );
    }

    if (category === 'tensed_students' || category === 'happy_students') {
      const isStressed = item.mood === 'stressed' || item.mood === 'tensed';
      return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.founderName, { color: colors.textPrimary }]}>{item.student_name}</Text>
                <Text style={[styles.rollnoText, { color: colors.textSecondary }]}>{item.rollno}</Text>
              </View>
            </View>
            <View style={[styles.badge, { backgroundColor: isStressed ? colors.danger + '20' : colors.success + '20' }]}>
              <Text style={[styles.badgeText, { color: isStressed ? colors.danger : colors.success }]}>
                {isStressed ? '🟡 TENSED' : '🟢 HAPPY'}
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
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
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
        <View style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.founderName, { color: colors.textPrimary }]}>{item.student_name}</Text>
            <Text style={[styles.rollnoText, { color: colors.textSecondary }]}>
              {item.course} • {item.branch}
            </Text>
          </View>
          <View style={[styles.scorePill, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.scoreText, { color: colors.primary }]}>{item.score} pts</Text>
          </View>
        </View>
      );
    }

    if (category === 'cv_students') {
      return (
        <View style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.founderName, { color: colors.textPrimary }]}>{item.student_name}</Text>
            <Text style={[styles.rollnoText, { color: colors.textSecondary }]}>CGPA: {item.cgpa}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: item.cv_status === 'Compiled' ? colors.success + '20' : colors.orange + '20' }]}>
            <Text style={[styles.badgeText, { color: item.cv_status === 'Compiled' ? colors.success : colors.orange }]}>
              {item.cv_status}
            </Text>
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
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.founderName, { color: colors.textPrimary }]}>{item.student_name}</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{item.category}</Text>
              </View>
            </View>
            <View style={[styles.badge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
              <Text style={[styles.badgeText, { color: getPriorityColor(item.priority) }]}>
                {item.priority?.toUpperCase()} PRIORITY
              </Text>
            </View>
          </View>
          
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginVertical: 6 }}>
            {item.title}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
            {item.description}
          </Text>

          <View style={[styles.cardFooter, { marginTop: 12, borderTopColor: colors.border }]}>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              Opened: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
            </Text>
            <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                {item.status?.toUpperCase()}
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
});

export default SuperAdminDrilldownScreen;
