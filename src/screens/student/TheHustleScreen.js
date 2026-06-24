import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getAllStudents } from '../../data/apiService';
import { LeaderboardPageSkeleton } from '../../components/SkeletonLoader';
import { getDisplayCourse } from '../../utils/courseDisplay';

const { width } = Dimensions.get('window');

const TheHustleScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, accessToken } = useUser();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      const loadData = async () => {
        try {
          if (accessToken) {
            const list = await getAllStudents(accessToken);
            if (active) {
              const mapped = list.map(s => ({
                id: s.rollno || s.username || s.id,
                name: s.full_name || s.username || 'Student',
                course: s.course,
                branch: s.branch,
                cgpa: s.cgpa || 0,
                attendance: s.attendance || 0,
                certsDone: s.certificates_done || [],
                certsInProgress: s.certificates_in_progress || [],
                leadership: [],
                extracurricular: [],
                gender: 'M',
                avatar_url: s.avatar_url,
              }));
              setStudents(mapped);
            }
          }
        } catch (err) {
          console.warn('Leaderboard loading failed:', err);
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };
      loadData();
      return () => { active = false; };
    }, [accessToken])
  );

  // Compute leaderboard scores
  const computedLeaderboard = students.map(s => {
    // 1. Certificates done: 500 pts each
    const certCount = (s.certsDone || []).filter(c => {
      const cl = c.toLowerCase();
      return cl !== 'yes' && cl !== 'no' && cl !== 'na' && cl !== 'n/a' && cl !== 'none' && cl !== '';
    }).length;

    // 2. Leadership positions: 1000 pts each
    const leadCount = (s.leadership || []).filter(c => c && c.toLowerCase() !== 'no' && c.toLowerCase() !== 'na' && c.toLowerCase() !== 'n/a' && c.toLowerCase() !== 'none').length;

    // 3. Extracurricular activities: 500 pts each
    const extraCount = (s.extracurricular || []).filter(c => c && c.toLowerCase() !== 'no' && c.toLowerCase() !== 'na' && c.toLowerCase() !== 'n/a' && c.toLowerCase() !== 'none').length;

    // 4. CGPA & Attendance: CGPA * 200 + Attendance * 5
    // Scale down any CGPA entered as a percentage (>10) and cap at 10.0
    const cgpaVal = Math.min(s.cgpa > 10 ? s.cgpa / 10 : s.cgpa, 10.0);
    const academicScore = Math.round(cgpaVal * 200) + Math.round((s.attendance || 0) * 5);

    // 5. Special Google Student Ambassador bonus (5000 points)
    const hasAmbassador = (s.leadership || []).some(l => l && (l.toLowerCase().includes('ambassador') || l.toLowerCase().includes('ambassasor')));
    const ambassadorBonus = hasAmbassador ? 5000 : 0;

    const totalScore = (certCount * 500) + (extraCount * 500) + (leadCount * 1000) + academicScore + ambassadorBonus;

    // Robust check if this student record matches the logged-in user
    const isMe = !!(user && (
      (s.id && user.id && s.id.toString().trim().toLowerCase() === user.id.toString().trim().toLowerCase()) ||
      (s.id && user.username && s.id.toString().trim().toLowerCase() === user.username.toString().trim().toLowerCase()) ||
      (s.id && user.rollno && s.id.toString().trim().toLowerCase() === user.rollno.toString().trim().toLowerCase()) ||
      (s.email && user.email && s.email.trim().toLowerCase() === user.email.trim().toLowerCase()) ||
      (s.name && user.name && s.name.trim().toLowerCase() === user.name.trim().toLowerCase())
    ));

    // Determine avatar
    let avatar = s.avatar_url;
    if (!avatar) {
      if (isMe && user.avatar_url) {
        avatar = user.avatar_url;
      } else {
        avatar = getAvatarUrl(s.name);
      }
    }

    return {
      id: s.id,
      name: s.name,
      score: totalScore,
      certCount,
      leadCount,
      extraCount,
      isMe,
      avatar,
      course: s.course,
      branch: s.branch,
    };
  });

  // Sort by score descending
  computedLeaderboard.sort((a, b) => b.score - a.score);

  // Assign ranks
  computedLeaderboard.forEach((item, index) => {
    item.rank = index + 1;
  });

  // Get my record
  const myRecord = computedLeaderboard.find(item => item.isMe) || (user ? {
    id: user.id,
    name: user.name,
    score: 8450,
    rank: 12,
    leadCount: 1,
    extraCount: 2,
    certCount: 2,
    avatar: getAvatarUrl(user.avatar_url || user.name),
  } : {
    id: 'mock',
    name: 'Student',
    score: 8450,
    rank: 12,
    leadCount: 1,
    extraCount: 2,
    certCount: 2,
    avatar: getAvatarUrl('Student'),
  });

  const myRank = myRecord.rank;
  const myScore = myRecord.score;
  const isTop10 = myRank <= 10;
  const ptsToNext = isTop10 ? 0 : (computedLeaderboard[9]?.score || 10000) - myScore;
  const topScore = computedLeaderboard[0]?.score || 20000;
  const progressPercent = Math.min(Math.round((myScore / topScore) * 100), 100);

  // Layout list of top students
  const displayLeaderboard = computedLeaderboard.slice(0, 10);
  const showMeAtBottom = user && myRank > 10;

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        {/* Header still shows so the screen feels alive */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerIconBtn, { marginRight: 8 }]}>
              <MaterialIcons name="arrow-back" size={26} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>The Hustle</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <LeaderboardPageSkeleton />
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>

      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerIconBtn, { marginRight: 8 }]}>
            <MaterialIcons name="arrow-back" size={26} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>The Hustle</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <MaterialIcons name="notifications-none" size={26} color={colors.textSecondary} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <Image
            source={{ uri: myRecord.avatar }}
            style={[styles.avatarTiny, { borderColor: colors.primary }]}
          />
        </View>
      </View>


      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Main Pulse Points Card */}
        <View style={styles.sectionContainer}>
          <View style={[styles.pulseCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <Text style={[styles.pulseTitle, { color: colors.textMuted }]}>PULSE POINTS</Text>
            
            <View style={styles.scoreRow}>
              <Text style={[styles.largeScore, { color: colors.textPrimary }]}>{myScore.toLocaleString()}</Text>
              <View style={[styles.rankBox, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#FFF7ED', borderColor: colors.border }]}>
                <Text style={[styles.rankText, { color: colors.primary }]}>#{myRank}</Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {isTop10 ? 'Top 10 Player!' : `${ptsToNext.toLocaleString()} pts to Top 10`}
              </Text>
            </View>
            
            <Text style={[styles.pulseDesc, { backgroundColor: isDark ? colors.background : '#F9FAFB', color: colors.textSecondary }]}>
              You are ranked #{myRank} overall. {isTop10 ? 'You are in the Top 10! Keep maintaining your lead for early access to premium internships.' : `You need ${ptsToNext.toLocaleString()} more points to enter the Top 10 for early access to premium internships.`}
            </Text>
          </View>
        </View>


        {/* The Hustle Grid */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>The Hustle Grid</Text>
          
          <View style={styles.gridContainer}>
            {/* Certifications Card */}
            <View style={[styles.gridCard, { backgroundColor: isDark ? colors.card : '#FFF7ED', borderColor: colors.border }]}>
              <View style={[styles.gridIconBox, { backgroundColor: isDark ? colors.background : '#FFEDD5' }]}>
                <MaterialCommunityIcons name="trophy-outline" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.gridTitle, { color: colors.textPrimary }]}>Certifications</Text>
              <Text style={[styles.gridSub, { color: colors.textSecondary }]}>{myRecord.certCount} Earned Credentials</Text>
              <Text style={[styles.gridPoints, { color: colors.primary }]}>+{ (myRecord.certCount * 500).toLocaleString() } pts</Text>
            </View>
            
            {/* Social & Leadership Card */}
            <View style={[styles.gridCard, { backgroundColor: isDark ? '#0C0A09' : '#F0F9FF', borderColor: isDark ? '#292524' : '#E0F2FE' }]}>
              <View style={[styles.gridIconBox, { backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#E0F2FE' }]}>
                <MaterialCommunityIcons name="account-group-outline" size={28} color="#0284C7" />
              </View>
              <Text style={[styles.gridTitle, { color: colors.textPrimary }]}>Hustle Activity</Text>
              <Text style={[styles.gridSub, { color: colors.textSecondary }]}>{myRecord.leadCount} Roles • {myRecord.extraCount} Clubs</Text>
              <Text style={[styles.gridPoints, { color: '#0284C7' }]}>+{ ((myRecord.leadCount * 1000) + (myRecord.extraCount * 500)).toLocaleString() } pts</Text>
            </View>
          </View>
        </View>


        {/* Monthly Leaderboard */}
        <View style={styles.sectionContainer}>
          <View style={styles.leaderboardHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Monthly Leaderboard</Text>
            <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.border }]}>
              <Text style={[styles.filterText, { color: colors.textSecondary }]}>
                {getDisplayCourse(user) || 'B.Tech CS'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.leaderboardCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            {displayLeaderboard.map((item, index) => (
              <View key={item.id} style={[
                styles.boardItem, 
                item.isMe && [styles.boardItemActive, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.2)' : '#FFF7ED' }],
                index === displayLeaderboard.length - 1 && !showMeAtBottom && { borderBottomWidth: 0 },
                { borderBottomColor: colors.border }
              ]}>
                <View style={[styles.boardItemLeft, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.boardRank, { color: colors.textMuted }, item.rank <= 3 && { color: colors.primary }]}>{item.rank}</Text>
                  <Image source={{ uri: item.avatar }} style={styles.boardAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.boardName, { color: colors.textPrimary }, item.isMe && { color: colors.primary }]} numberOfLines={1}>
                      {item.name} {item.isMe && '(You)'}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.textSecondary || '#6B7280' }} numberOfLines={1}>
                      {getDisplayCourse({ course: item.course, branch: item.branch }) || ''}
                    </Text>
                  </View>
                </View>
                <View style={[styles.scorePill, { backgroundColor: colors.border }, item.isMe && { backgroundColor: colors.primary }]}>
                  <Text style={[styles.scorePillText, { color: colors.textSecondary }, item.isMe && { color: '#FFFFFF' }]}>
                    {item.score.toLocaleString()} pts
                  </Text>
                </View>
              </View>
            ))}

            {showMeAtBottom && (
              <>
                <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8, marginHorizontal: 12, borderStyle: 'dashed', borderRadius: 1 }} />
                <View style={[
                  styles.boardItem,
                  styles.boardItemActive,
                  { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.2)' : '#FFF7ED', borderBottomWidth: 0 }
                ]}>
                  <View style={[styles.boardItemLeft, { flex: 1, marginRight: 8 }]}>
                    <Text style={[styles.boardRank, { color: colors.primary }]}>{myRecord.rank}</Text>
                    <Image source={{ uri: myRecord.avatar }} style={styles.boardAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.boardName, { color: colors.primary }]} numberOfLines={1}>
                        {myRecord.name} (You)
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.textSecondary || '#6B7280' }} numberOfLines={1}>
                        {getDisplayCourse(user) || ''}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.scorePill, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.scorePillText, { color: '#FFFFFF' }]}>
                      {myRecord.score.toLocaleString()} pts
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
          
          <TouchableOpacity style={[styles.viewFullBtn, { backgroundColor: colors.border }]}>
            <Text style={[styles.viewFullText, { color: colors.textSecondary }]}>View Full Rankings</Text>
          </TouchableOpacity>
        </View>


        <View style={{ height: 100 }} />
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerIconBtn: {
    padding: 8,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarTiny: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#EA580C',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  scroll: {
    paddingBottom: 20,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  pulseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  pulseTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  largeScore: {
    fontSize: 48,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -1,
  },
  rankBox: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  rankText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#EA580C',
  },
  progressContainer: {
    marginTop: 24,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#EA580C',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'right',
  },
  pulseDesc: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginTop: 20,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFF7ED',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  gridIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  gridSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 18,
  },
  gridPoints: {
    fontSize: 14,
    fontWeight: '900',
    color: '#EA580C',
    marginTop: 16,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  leaderboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
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
    borderBottomColor: '#F3F4F6',
  },
  boardItemActive: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    borderBottomWidth: 0,
  },
  boardItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boardRank: {
    width: 24,
    fontSize: 16,
    fontWeight: '800',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  topRank: {
    color: '#EA580C',
  },
  boardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginHorizontal: 12,
  },
  boardName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  trendUp: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  trendDown: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: 2,
  },
  scorePill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scorePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4B5563',
  },
  viewFullBtn: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  viewFullText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4B5563',
  },
});

export default TheHustleScreen;
