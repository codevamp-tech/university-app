import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const TheHustleScreen = () => {
  const insets = useSafeAreaInsets();

  const leaderboardData = [
    { id: '1', name: 'Kabir Das', score: '9.1k', rank: 1, avatar: 'https://i.pravatar.cc/150?u=kabir', trend: 'up' },
    { id: '2', name: 'Sneha Kapoor', score: '8.8k', rank: 2, avatar: 'https://i.pravatar.cc/150?u=sneha', trend: 'same' },
    { id: '3', name: 'Aryan Singh', score: '8.4k', rank: 3, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6mmtjUA28NY_AB8YFu2Ri2e3lSkRbJCYpAbrgwHHzzLntRM9rNTLFJIT-pf3fW5gQ-_hRX8LB8ZDdqw5ls_d4bA10oIXuBlKp8kv7onee50cVXADdy7BPVn6kAg4Co9Gbp6XiTx5yITLttWLtkQQag4sVTILELHpLT0_-WAXmJWUVCHpSfhFuYmROstnRxdO_T4ym_KOCd8CmJm60WORR2yoPF8RiqYCiJsTUrQcbumydveuPeijNqG_991IufFMlU7g1DbJ3nqtG', trend: 'up', isMe: true },
    { id: '4', name: 'Meera Patel', score: '8.2k', rank: 4, avatar: 'https://i.pravatar.cc/150?u=meera', trend: 'down' },
    { id: '5', name: 'Ishaan Sharma', score: '7.9k', rank: 5, avatar: 'https://i.pravatar.cc/150?u=ishaan', trend: 'same' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn}>
          <MaterialIcons name="menu" size={26} color="#EA580C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>The Hustle</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <MaterialIcons name="notifications-none" size={26} color="#4B5563" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6mmtjUA28NY_AB8YFu2Ri2e3lSkRbJCYpAbrgwHHzzLntRM9rNTLFJIT-pf3fW5gQ-_hRX8LB8ZDdqw5ls_d4bA10oIXuBlKp8kv7onee50cVXADdy7BPVn6kAg4Co9Gbp6XiTx5yITLttWLtkQQag4sVTILELHpLT0_-WAXmJWUVCHpSfhFuYmROstnRxdO_T4ym_KOCd8CmJm60WORR2yoPF8RiqYCiJsTUrQcbumydveuPeijNqG_991IufFMlU7g1DbJ3nqtG' }}
            style={styles.avatarTiny}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Main Pulse Points Card */}
        <View style={styles.sectionContainer}>
          <View style={styles.pulseCard}>
            <Text style={styles.pulseTitle}>PULSE POINTS</Text>
            
            <View style={styles.scoreRow}>
              <Text style={styles.largeScore}>8,450</Text>
              <View style={styles.rankBox}>
                <Text style={styles.rankText}>#12</Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '85%' }]} />
              </View>
              <Text style={styles.progressText}>550 pts to Top 10</Text>
            </View>
            
            <Text style={styles.pulseDesc}>
              You are ranked #12 in Computer Science. Top 10 gets early access to premium internships.
            </Text>
          </View>
        </View>

        {/* The Hustle Grid */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>The Hustle Grid</Text>
          
          <View style={styles.gridContainer}>
            {/* Hackathons Card */}
            <View style={styles.gridCard}>
              <View style={styles.gridIconBox}>
                <MaterialCommunityIcons name="trophy-outline" size={28} color="#EA580C" />
              </View>
              <Text style={styles.gridTitle}>Hackathons</Text>
              <Text style={styles.gridSub}>2 Wins • 4 Participations</Text>
              <Text style={styles.gridPoints}>+1,200 pts</Text>
            </View>
            
            {/* Social Clubs Card */}
            <View style={[styles.gridCard, { backgroundColor: '#F0F9FF', borderColor: '#E0F2FE' }]}>
              <View style={[styles.gridIconBox, { backgroundColor: '#E0F2FE' }]}>
                <MaterialCommunityIcons name="account-group-outline" size={28} color="#0284C7" />
              </View>
              <Text style={styles.gridTitle}>Social Clubs</Text>
              <Text style={styles.gridSub}>Event Lead (Coding Club)</Text>
              <Text style={[styles.gridPoints, { color: '#0284C7' }]}>+850 pts</Text>
            </View>
          </View>
        </View>

        {/* Monthly Leaderboard */}
        <View style={styles.sectionContainer}>
          <View style={styles.leaderboardHeader}>
            <Text style={styles.sectionTitle}>Monthly Leaderboard</Text>
            <TouchableOpacity style={styles.filterBtn}>
              <Text style={styles.filterText}>B.Tech CS</Text>
              <MaterialIcons name="keyboard-arrow-down" size={16} color="#4B5563" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.leaderboardCard}>
            {leaderboardData.map((item, index) => (
              <View key={item.id} style={[
                styles.boardItem, 
                item.isMe && styles.boardItemActive,
                index === leaderboardData.length - 1 && { borderBottomWidth: 0 }
              ]}>
                <View style={styles.boardItemLeft}>
                  <Text style={[styles.boardRank, item.rank <= 3 && styles.topRank]}>{item.rank}</Text>
                  <Image source={{ uri: item.avatar }} style={styles.boardAvatar} />
                  <View>
                    <Text style={[styles.boardName, item.isMe && { color: '#EA580C' }]}>
                      {item.name} {item.isMe && '(You)'}
                    </Text>
                    {item.trend === 'up' && <Text style={styles.trendUp}>Up 2 spots ↗</Text>}
                    {item.trend === 'down' && <Text style={styles.trendDown}>Down 1 spot ↘</Text>}
                  </View>
                </View>
                <View style={[styles.scorePill, item.isMe && { backgroundColor: '#EA580C' }]}>
                  <Text style={[styles.scorePillText, item.isMe && { color: '#FFFFFF' }]}>{item.score}</Text>
                </View>
              </View>
            ))}
          </View>
          
          <TouchableOpacity style={styles.viewFullBtn}>
            <Text style={styles.viewFullText}>View Full Rankings</Text>
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
    padding: 16,
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  boardItemActive: {
    backgroundColor: '#FFF7ED',
    marginHorizontal: -16,
    paddingHorizontal: 16,
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
