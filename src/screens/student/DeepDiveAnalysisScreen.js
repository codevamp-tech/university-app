import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

const DeepDiveAnalysisScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const skillGaps = [
    {
      title: 'Data Structures',
      score: 65,
      gaps: ['Graphs (Topological Sort)', 'DP (Space Optimization)', 'Segment Trees'],
      priority: 'MEDIUM',
      color: '#F59E0B'
    },
    {
      title: 'System Design',
      score: 40,
      gaps: ['Microservices Arch', 'Message Queues', 'Caching Strategies'],
      priority: 'HIGH',
      color: '#EF4444'
    },
    {
      title: 'Cloud Computing',
      score: 78,
      gaps: ['K8s Orchestration', 'CI/CD Pipelines'],
      priority: 'LOW',
      color: '#10B981'
    }
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Deep Dive Analysis</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Feather name="share-2" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={isDark ? ['#1E1B4B', '#312E81'] : ['#4338CA', '#312E81']}
          style={styles.heroCard}
        >
          <Text style={styles.heroTitle}>Overall Readiness</Text>
          <View style={styles.readinessRow}>
            <Text style={styles.readinessScore}>62%</Text>
            <View style={styles.readinessInfo}>
              <Text style={styles.readinessLabel}>FAANG MATCH</Text>
              <View style={styles.miniProgressBg}>
                <View style={[styles.miniProgressFill, { width: '62%' }]} />
              </View>
            </View>
          </View>
          <Text style={styles.heroSub}>You are 38% away from being a top-tier candidate.</Text>
        </LinearGradient>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Detailed Skill Breakdown</Text>

        {skillGaps.map((skill, index) => (
          <View key={index} style={[styles.skillCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.skillHeader}>
              <View>
                <Text style={[styles.skillTitle, { color: colors.textPrimary }]}>{skill.title}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: skill.color + '20' }]}>
                  <Text style={[styles.priorityText, { color: skill.color }]}>{skill.priority} PRIORITY</Text>
                </View>
              </View>
              <View style={styles.scoreBox}>
                <Text style={[styles.scoreVal, { color: skill.color }]}>{skill.score}%</Text>
              </View>
            </View>

            <View style={[styles.progressBg, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
              <View style={[styles.progressFill, { width: `${skill.score}%`, backgroundColor: skill.color }]} />
            </View>

            <View style={styles.gapSection}>
              <Text style={[styles.gapLabel, { color: colors.textSecondary }]}>Identified Gaps:</Text>
              <View style={styles.gapList}>
                {skill.gaps.map((gap, i) => (
                  <View key={i} style={styles.gapItem}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={14} color={skill.color} />
                    <Text style={[styles.gapText, { color: colors.textPrimary }]}>{gap}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity style={[styles.learnBtn, { borderColor: skill.color }]}>
              <Text style={[styles.learnBtnText, { color: skill.color }]}>Explore Learning Path</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  shareBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20 },
  heroCard: { borderRadius: 28, padding: 24, marginBottom: 32 },
  heroTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  readinessRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 12, marginBottom: 16 },
  readinessScore: { color: '#FFFFFF', fontSize: 48, fontWeight: '900' },
  readinessInfo: { flex: 1 },
  readinessLabel: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', marginBottom: 6 },
  miniProgressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 },
  miniProgressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 3 },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 18 },
  sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20 },
  skillCard: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 16 },
  skillHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  skillTitle: { fontSize: 18, fontWeight: '800' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 6, alignSelf: 'flex-start' },
  priorityText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  scoreBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.03)', justifyContent: 'center', alignItems: 'center' },
  scoreVal: { fontSize: 14, fontWeight: '900' },
  progressBg: { height: 8, borderRadius: 4, marginBottom: 20 },
  progressFill: { height: '100%', borderRadius: 4 },
  gapSection: { marginBottom: 20 },
  gapLabel: { fontSize: 12, fontWeight: '700', marginBottom: 12 },
  gapList: { gap: 8 },
  gapItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gapText: { fontSize: 14, fontWeight: '600' },
  learnBtn: { width: '100%', paddingVertical: 14, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  learnBtnText: { fontSize: 14, fontWeight: '800' },
});

export default DeepDiveAnalysisScreen;
