import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { useNotifications, NotificationBadge } from '../../context/NotificationContext';
import { getAllStudents } from '../../data/apiService';
import { LeaderboardPageSkeleton } from '../../components/SkeletonLoader';
import { SafeStudentAvatar } from '../../components/SafeStudentAvatar';
import { getAvatarUrl } from '../../utils/avatar';
import { getDisplayCourse, isMedicalStudent, getMBBSProfLabel } from '../../utils/courseDisplay';

const { width } = Dimensions.get('window');

const getStudentYearNum = (s) => {
  if (!s) return 1;
  let yr = s.year || s.current_year;
  if (yr) {
    const match = yr.toString().match(/\d+/);
    if (match) return parseInt(match[0]);
  }
  if (s.semester) return Math.ceil(parseInt(s.semester) / 2);
  return 1;
};

const TheHustleScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, accessToken } = useUser();
  const { totalUnreadCount } = useNotifications();

  const isStudentUser = !user?.role || user?.role === 'student';
  const userYearNum = getStudentYearNum(user);
  const userIsMed = isMedicalStudent(user);

  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All'); // 'All', 'MyCourse', 'MyYear', or specific course
  const [viewFullRankings, setViewFullRankings] = useState(false);

  const userCourse = (user?.course || (userIsMed ? 'MBBS' : 'MCA')).trim();

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
                course: s.course || (isMedicalStudent(s) ? 'MBBS' : 'MCA'),
                branch: s.branch,
                category: s.category,
                year: s.year || s.current_year,
                current_year: s.current_year || s.year,
                semester: s.semester,
                batch: s.batch_year || s.batch,
                cgpa: s.cgpa || 0,
                attendance: s.attendance || 0,
                certsDone: s.certificates_done || s.certsDone || [],
                certsInProgress: s.certificates_in_progress || s.certsInProgress || [],
                leadership: s.leadership || [],
                extracurricular: s.extracurricular || [],
                current_skills: s.current_skills || s.skills || [],
                gender: 'M',
                avatar_url: s.avatar_url,
              }));

              // Ensure the current user is in the list with full active session user properties
              const meMatchIndex = mapped.findIndex(s =>
                (user?.rollno && s.id && String(s.id).trim() === String(user.rollno).trim()) ||
                (user?.username && s.id && String(s.id).trim() === String(user.username).trim()) ||
                (user?.id && s.id && String(s.id).trim() === String(user.id).trim()) ||
                (user?.name && s.name && String(s.name).trim().toLowerCase() === String(user.name).trim().toLowerCase())
              );

              if (meMatchIndex >= 0) {
                mapped[meMatchIndex] = {
                  ...mapped[meMatchIndex],
                  name: user.name || user.full_name || mapped[meMatchIndex].name,
                  course: user.course || mapped[meMatchIndex].course,
                  branch: user.branch || mapped[meMatchIndex].branch,
                  cgpa: user.cgpa !== undefined ? user.cgpa : mapped[meMatchIndex].cgpa,
                  attendance: user.attendance !== undefined ? user.attendance : mapped[meMatchIndex].attendance,
                  certsDone: (user.certsDone && user.certsDone.length > 0) ? user.certsDone : (user.certificates_done || mapped[meMatchIndex].certsDone),
                  leadership: (user.leadership && user.leadership.length > 0) ? user.leadership : mapped[meMatchIndex].leadership,
                  extracurricular: (user.extracurricular && user.extracurricular.length > 0) ? user.extracurricular : mapped[meMatchIndex].extracurricular,
                  current_skills: (user.current_skills && user.current_skills.length > 0) ? user.current_skills : (user.skills || mapped[meMatchIndex].current_skills),
                  avatar_url: user.avatar_url || mapped[meMatchIndex].avatar_url,
                };
              } else if (user) {
                mapped.unshift({
                  id: user.rollno || user.username || user.id,
                  name: user.name || user.full_name || 'Student',
                  course: user.course || (userIsMed ? 'MBBS' : 'BCA'),
                  branch: user.branch || (userIsMed ? 'Clinical Medicine' : 'Computer Applications'),
                  category: user.category || 'tech',
                  year: user.year || user.current_year || 1,
                  current_year: user.current_year || user.year || 1,
                  semester: user.semester || 1,
                  batch: user.admission_year || 2025,
                  cgpa: user.cgpa || 8.0,
                  attendance: user.attendance || 80.0,
                  certsDone: user.certsDone || user.certificates_done || [],
                  certsInProgress: user.certsInProgress || [],
                  leadership: user.leadership || [],
                  extracurricular: user.extracurricular || [],
                  current_skills: user.current_skills || user.skills || [],
                  gender: 'M',
                  avatar_url: user.avatar_url,
                });
              }

              setAllStudents(mapped);
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
    }, [accessToken, user, userIsMed])
  );

  // Extract distinct course names from the student body
  const availableCourses = React.useMemo(() => {
    const set = new Set();
    allStudents.forEach(s => {
      if (s.course) {
        const c = s.course.trim();
        if (c && !c.toLowerCase().includes('undefined') && !c.toLowerCase().includes('null')) {
          set.add(c);
        }
      }
    });
    return Array.from(set).sort();
  }, [allStudents]);

  // Filter students based on selection (Course-wise / Year / All)
  const filteredStudents = allStudents.filter(s => {
    if (filterType === 'All') return true;
    if (filterType === 'MyYear') {
      const studentYr = getStudentYearNum(s);
      return studentYr === userYearNum;
    }
    if (filterType === 'MyCourse') {
      const myC = userCourse.toLowerCase();
      const studentC = (s.course || '').toLowerCase().trim();
      return studentC.includes(myC) || myC.includes(studentC);
    }
    // Specific course selection
    const targetC = filterType.toLowerCase().trim();
    const studentC = (s.course || '').toLowerCase().trim();
    return studentC.includes(targetC) || targetC.includes(studentC);
  });

  // Compute leaderboard scores dynamically based on all student KPIs
  const computedLeaderboard = filteredStudents.map(s => {
    // 1. Certificates done: 500 pts each
    const certCount = (s.certsDone || []).filter(c => {
      const cl = (c || '').toLowerCase();
      return cl !== 'yes' && cl !== 'no' && cl !== 'na' && cl !== 'n/a' && cl !== 'none' && cl !== '';
    }).length;

    // 2. Leadership positions: 1000 pts each
    const leadCount = (s.leadership || []).filter(c => {
      const cl = (c || '').toLowerCase();
      return cl !== 'yes' && cl !== 'no' && cl !== 'na' && cl !== 'n/a' && cl !== 'none' && cl !== '';
    }).length;

    // 3. Extracurricular activities: 500 pts each
    const extraCount = (s.extracurricular || []).filter(c => {
      const cl = (c || '').toLowerCase();
      return cl !== 'yes' && cl !== 'no' && cl !== 'na' && cl !== 'n/a' && cl !== 'none' && cl !== '';
    }).length;

    // 4. Skills & Competencies: 250 pts each
    const rawSkills = s.current_skills || s.skills || [];
    const skillCount = Array.isArray(rawSkills) ? rawSkills.filter(Boolean).length : 0;

    // 5. Academic & Attendance: CGPA * 200 + Attendance * 10
    const cgpaVal = Math.min(s.cgpa > 10 ? s.cgpa / 10 : (s.cgpa || 0), 10.0);
    const attendanceVal = Number(s.attendance || 0);
    const academicScore = Math.round(cgpaVal * 200) + Math.round(attendanceVal * 10);

    // 6. Special Google Student Ambassador bonus (5000 points)
    const hasAmbassador = (s.leadership || []).some(l => l && (l.toLowerCase().includes('ambassador') || l.toLowerCase().includes('ambassasor')));
    const ambassadorBonus = hasAmbassador ? 5000 : 0;

    const totalScore = (certCount * 500) + (extraCount * 500) + (leadCount * 1000) + (skillCount * 250) + academicScore + ambassadorBonus;

    // Robust check if this student record matches the logged-in user
    const isMe = !!(user && (
      (s.id && user.id && String(s.id).trim().toLowerCase() === String(user.id).trim().toLowerCase()) ||
      (s.id && user.username && String(s.id).trim().toLowerCase() === String(user.username).trim().toLowerCase()) ||
      (s.id && user.rollno && String(s.id).trim().toLowerCase() === String(user.rollno).trim().toLowerCase()) ||
      (s.email && user.email && s.email.trim().toLowerCase() === user.email.trim().toLowerCase()) ||
      (s.name && user.name && s.name.trim().toLowerCase() === user.name.trim().toLowerCase())
    ));

    let avatar = s.avatar_url;
    if (!avatar) {
      if (isMe && user.avatar_url) {
        avatar = user.avatar_url;
      } else {
        avatar = getAvatarUrl(s.name, s.id);
      }
    }

    return {
      id: s.id,
      name: s.name,
      score: totalScore,
      certCount,
      leadCount,
      extraCount,
      skillCount,
      cgpa: cgpaVal,
      attendance: attendanceVal,
      academicScore,
      isMe,
      avatar,
      course: s.course,
      branch: s.branch,
      category: s.category,
      year: s.year,
      current_year: s.current_year,
      semester: s.semester,
    };
  });

  // Sort by score descending
  computedLeaderboard.sort((a, b) => b.score - a.score);

  // Assign ranks
  computedLeaderboard.forEach((item, index) => {
    item.rank = index + 1;
  });

  // Get my record dynamically
  const myRecord = computedLeaderboard.find(item => item.isMe) || {
    id: user?.id || 'me',
    name: user?.name || 'Student',
    score: 8450,
    rank: 1,
    leadCount: (user?.leadership || []).length || 1,
    extraCount: (user?.extracurricular || []).length || 2,
    certCount: (user?.certsDone || user?.certificates_done || []).length || 2,
    skillCount: (user?.current_skills || user?.skills || []).length || 6,
    cgpa: user?.cgpa || 7.8,
    attendance: user?.attendance || 76.81,
    academicScore: Math.round((user?.cgpa || 7.8) * 200) + Math.round((user?.attendance || 76.81) * 10),
    avatar: getAvatarUrl(user?.avatar_url || user?.name),
  };

  const myRank = myRecord.rank || 1;
  const myScore = myRecord.score;
  const isTop10 = myRank <= 10;
  const ptsToNext = isTop10 ? 0 : Math.max(0, (computedLeaderboard[9]?.score || 10000) - myScore);
  const topScore = computedLeaderboard[0]?.score || 20000;
  const progressPercent = Math.min(Math.round((myScore / topScore) * 100), 100);

  // Layout list of top students
  const displayLeaderboard = viewFullRankings ? computedLeaderboard : computedLeaderboard.slice(0, 10);
  const showMeAtBottom = user && myRank > 10 && !viewFullRankings;

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
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
          <TouchableOpacity
            style={[styles.headerIconBtn, { position: 'relative' }]}
            onPress={() => navigation.navigate(isStudentUser ? 'Alerts' : 'TeacherAlerts')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="notifications-none" size={26} color={colors.textSecondary} />
            <NotificationBadge count={totalUnreadCount} />
          </TouchableOpacity>
          <SafeStudentAvatar
            uri={user?.avatar_url || myRecord.avatar}
            rollno={user?.rollno}
            name={user?.name || user?.full_name || myRecord.name}
            style={[styles.avatarTiny, { borderColor: colors.primary, borderWidth: 2 }]}
            primaryColor={colors.primary}
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
              You are ranked #{myRank} in this view. {isTop10 ? 'You are in the Top 10! Keep maintaining your lead for early access to premium internships.' : `You need ${ptsToNext.toLocaleString()} more points to enter the Top 10 for early access to premium internships.`}
            </Text>
          </View>
        </View>

        {/* The Hustle Grid (4 Dynamic KPI Pillars) */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>The Hustle Grid</Text>

          <View style={styles.gridContainer}>
            {/* 1. Certifications Card */}
            <View style={[styles.gridCard, { backgroundColor: isDark ? colors.card : '#FFF7ED', borderColor: colors.border }]}>
              <View style={[styles.gridIconBox, { backgroundColor: isDark ? colors.background : '#FFEDD5' }]}>
                <MaterialCommunityIcons name="trophy-outline" size={26} color={colors.primary} />
              </View>
              <Text style={[styles.gridTitle, { color: colors.textPrimary }]}>Certifications</Text>
              <Text style={[styles.gridSub, { color: colors.textSecondary }]}>{myRecord.certCount || 0} Credentials</Text>
              <Text style={[styles.gridPoints, { color: colors.primary }]}>+{((myRecord.certCount || 0) * 500).toLocaleString()} pts</Text>
            </View>

            {/* 2. Social & Leadership Card */}
            <View style={[styles.gridCard, { backgroundColor: isDark ? '#0C0A09' : '#F0F9FF', borderColor: isDark ? '#292524' : '#E0F2FE' }]}>
              <View style={[styles.gridIconBox, { backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#E0F2FE' }]}>
                <MaterialCommunityIcons name="account-group-outline" size={26} color="#0284C7" />
              </View>
              <Text style={[styles.gridTitle, { color: colors.textPrimary }]}>Hustle Activity</Text>
              <Text style={[styles.gridSub, { color: colors.textSecondary }]}>{myRecord.leadCount || 0} Roles • {myRecord.extraCount || 0} Clubs</Text>
              <Text style={[styles.gridPoints, { color: '#0284C7' }]}>+{(((myRecord.leadCount || 0) * 1000) + ((myRecord.extraCount || 0) * 500)).toLocaleString()} pts</Text>
            </View>

            {/* 3. Verified Skills Card */}
            <View style={[styles.gridCard, { backgroundColor: isDark ? colors.card : '#F5F3FF', borderColor: isDark ? '#312E81' : '#EDE9FE' }]}>
              <View style={[styles.gridIconBox, { backgroundColor: isDark ? colors.background : '#EDE9FE' }]}>
                <MaterialCommunityIcons name="lightning-bolt" size={26} color="#7C3AED" />
              </View>
              <Text style={[styles.gridTitle, { color: colors.textPrimary }]}>Core Skills</Text>
              <Text style={[styles.gridSub, { color: colors.textSecondary }]}>{myRecord.skillCount || 0} Competencies</Text>
              <Text style={[styles.gridPoints, { color: '#7C3AED' }]}>+{((myRecord.skillCount || 0) * 250).toLocaleString()} pts</Text>
            </View>

            {/* 4. Academic & Attendance Card */}
            <View style={[styles.gridCard, { backgroundColor: isDark ? colors.card : '#ECFDF5', borderColor: isDark ? '#064E3B' : '#D1FAE5' }]}>
              <View style={[styles.gridIconBox, { backgroundColor: isDark ? colors.background : '#D1FAE5' }]}>
                <MaterialIcons name="trending-up" size={26} color="#059669" />
              </View>
              <Text style={[styles.gridTitle, { color: colors.textPrimary }]}>Academics</Text>
              <Text style={[styles.gridSub, { color: colors.textSecondary }]}>{myRecord.cgpa ? myRecord.cgpa.toFixed(1) : '0.0'} GPA • {myRecord.attendance || 0}% Att.</Text>
              <Text style={[styles.gridPoints, { color: '#059669' }]}>+{(myRecord.academicScore || 0).toLocaleString()} pts</Text>
            </View>
          </View>
        </View>

        {/* Monthly Leaderboard */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>Monthly Leaderboard</Text>

          {/* Course-Wise & Standing Filter Pills Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
            {/* 1. All Students */}
            <TouchableOpacity
              style={[
                styles.filterPill,
                filterType === 'All'
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border }
              ]}
              onPress={() => setFilterType('All')}
            >
              <Text style={[styles.filterPillText, filterType === 'All' ? { color: '#FFFFFF' } : { color: colors.textSecondary }]}>
                All Students
              </Text>
            </TouchableOpacity>

            {/* 2. My Course */}
            {isStudentUser && (
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filterType === 'MyCourse'
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border }
                ]}
                onPress={() => setFilterType('MyCourse')}
              >
                <Text style={[styles.filterPillText, filterType === 'MyCourse' ? { color: '#FFFFFF' } : { color: colors.textSecondary }]}>
                  My Course ({userCourse})
                </Text>
              </TouchableOpacity>
            )}

            {/* 3. My Year */}
            {isStudentUser && (
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filterType === 'MyYear'
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border }
                ]}
                onPress={() => setFilterType('MyYear')}
              >
                <Text style={[styles.filterPillText, filterType === 'MyYear' ? { color: '#FFFFFF' } : { color: colors.textSecondary }]}>
                  {userIsMed ? `My Prof (${getMBBSProfLabel(userYearNum)})` : `My Year (${userYearNum}${userYearNum === 1 ? 'st' : userYearNum === 2 ? 'nd' : userYearNum === 3 ? 'rd' : 'th'} Yr)`}
                </Text>
              </TouchableOpacity>
            )}

            {/* 4. Dynamic Course Tabs */}
            {availableCourses.map((cName, cIdx) => {
              if (isStudentUser && cName.toLowerCase() === userCourse.toLowerCase()) return null;
              const isSelected = filterType === cName;
              return (
                <TouchableOpacity
                  key={cIdx}
                  style={[
                    styles.filterPill,
                    isSelected
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border }
                  ]}
                  onPress={() => setFilterType(cName)}
                >
                  <Text style={[styles.filterPillText, isSelected ? { color: '#FFFFFF' } : { color: colors.textSecondary }]}>
                    {cName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={[styles.leaderboardCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            {displayLeaderboard.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>No students found in this filter.</Text>
              </View>
            ) : (
              displayLeaderboard.map((item, index) => (
                <View key={item.id} style={[
                  styles.boardItem,
                  item.isMe && [styles.boardItemActive, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.2)' : '#FFF7ED' }],
                  index === displayLeaderboard.length - 1 && !showMeAtBottom && { borderBottomWidth: 0 },
                  { borderBottomColor: colors.border }
                ]}>
                  <View style={[styles.boardItemLeft, { flex: 1, marginRight: 8 }]}>
                    <Text style={[styles.boardRank, { color: colors.textMuted }, item.rank <= 3 && { color: colors.primary }]}>{item.rank}</Text>
                    <SafeStudentAvatar
                      uri={item.isMe ? (user?.avatar_url || item.avatar) : item.avatar}
                      rollno={item.isMe ? user?.rollno : item.id}
                      name={item.name}
                      style={styles.boardAvatar}
                      primaryColor={colors.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.boardName, { color: colors.textPrimary }, item.isMe && { color: colors.primary }]} numberOfLines={1}>
                        {item.name} {item.isMe && '(You)'}
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.textSecondary || '#6B7280' }} numberOfLines={1}>
                        {getDisplayCourse(item) || ''}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.scorePill, { backgroundColor: colors.border }, item.isMe && { backgroundColor: colors.primary }]}>
                    <Text style={[styles.scorePillText, { color: colors.textSecondary }, item.isMe && { color: '#FFFFFF' }]}>
                      {item.score.toLocaleString()} pts
                    </Text>
                  </View>
                </View>
              ))
            )}

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
                    <SafeStudentAvatar
                      uri={user?.avatar_url || myRecord.avatar}
                      rollno={user?.rollno}
                      name={user?.name || user?.full_name || myRecord.name}
                      style={styles.boardAvatar}
                      primaryColor={colors.primary}
                    />
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

          <TouchableOpacity 
            style={[styles.viewFullBtn, { backgroundColor: colors.border }]}
            onPress={() => setViewFullRankings(!viewFullRankings)}
          >
            <Text style={[styles.viewFullText, { color: colors.textSecondary }]}>
              {viewFullRankings ? 'Show Top 10 Only' : 'View Full Rankings'}
            </Text>
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFF7ED',
    borderRadius: 24,
    padding: 16,
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
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '800',
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
