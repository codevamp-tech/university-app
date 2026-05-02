import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { APP_CONFIG } from '../../config/appConfig';

const { width } = Dimensions.get('window');

const PlacementRecordScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeYear, setActiveYear] = useState('2025');

  const years = ['2025', '2024', '2023', '2022'];

  const stats = {
    '2025': { placed: '850+', avg: '7.2 LPA', highest: '45 LPA', companies: '160+' },
    '2024': { placed: '820+', avg: '6.8 LPA', highest: '41 LPA', companies: '150+' },
    '2023': { placed: '760+', avg: '6.2 LPA', highest: '36 LPA', companies: '130+' },
    '2022': { placed: '680+', avg: '5.5 LPA', highest: '28 LPA', companies: '110+' },
  };

  const topRecruiters = [
    { name: 'TCS', logo: 'https://logo.clearbit.com/tcs.com', package: '7 LPA', sector: 'IT Services' },
    { name: 'Infosys', logo: 'https://logo.clearbit.com/infosys.com', package: '6.5 LPA', sector: 'IT Services' },
    { name: 'Wipro', logo: 'https://logo.clearbit.com/wipro.com', package: '6 LPA', sector: 'IT Services' },
    { name: 'Cognizant', logo: 'https://logo.clearbit.com/cognizant.com', package: '5.5 LPA', sector: 'IT Consulting' },
    { name: 'Tech Mahindra', logo: 'https://logo.clearbit.com/techmahindra.com', package: '6 LPA', sector: 'Telecom IT' },
    { name: 'HCL', logo: 'https://logo.clearbit.com/hcltech.com', package: '7.5 LPA', sector: 'IT Services' },
  ];

  const topPlacements = [
    { name: 'Rahul Sharma', company: 'Amazon', package: '41 LPA', branch: 'B.Tech CSE', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
    { name: 'Priya Singh', company: 'Microsoft', package: '32 LPA', branch: 'B.Tech AI/ML', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
    { name: 'Amit Kumar', company: 'Google', package: '28 LPA', branch: 'B.Tech CSE', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
    { name: 'Neha Verma', company: 'Flipkart', package: '24 LPA', branch: 'MBA Analytics', avatar: 'https://randomuser.me/api/portraits/women/4.jpg' },
  ];

  const sectors = [
    { name: 'Information Technology', percent: 52, color: '#4338CA' },
    { name: 'BFSI & Fintech', percent: 18, color: '#EA580C' },
    { name: 'Core Engineering', percent: 12, color: '#16A34A' },
    { name: 'Management & Consulting', percent: 10, color: '#0891B2' },
    { name: 'Others', percent: 8, color: '#9CA3AF' },
  ];

  const s = stats[activeYear];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={['#4338CA', '#312E81']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Placement Record</Text>
          <Text style={styles.headerSub}>{APP_CONFIG.UNIVERSITY_NAME} Placements</Text>
        </View>
        <MaterialCommunityIcons name="trending-up" size={22} color="rgba(255,255,255,0.7)" />
      </LinearGradient>

      {/* Year Tabs */}
      <View style={styles.yearTabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.yearScrollContent}
        >
          {years.map(y => (
            <TouchableOpacity
              key={y}
              style={[styles.yearBtn, activeYear === y && styles.yearBtnActive]}
              onPress={() => setActiveYear(y)}
            >
              <Text style={[styles.yearText, activeYear === y && styles.yearTextActive]}>Batch {y}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Students Placed', value: s.placed, icon: 'people', color: '#4338CA', bg: '#EEF2FF' },
            { label: 'Avg Package', value: s.avg, icon: 'trending-up', color: '#16A34A', bg: '#ECFDF5' },
            { label: 'Highest Package', value: s.highest, icon: 'emoji-events', color: '#EA580C', bg: '#FFF7ED' },
            { label: 'Recruiting Companies', value: s.companies, icon: 'business', color: '#0891B2', bg: '#F0FDFF' },
          ].map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: stat.bg }]}>
                <MaterialIcons name={stat.icon} size={22} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Sector-wise Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sector-wise Placement</Text>
          {sectors.map((s, i) => (
            <View key={i} style={styles.sectorRow}>
              <View style={styles.sectorLabelRow}>
                <Text style={styles.sectorName}>{s.name}</Text>
                <Text style={[styles.sectorPct, { color: s.color }]}>{s.percent}%</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${s.percent}%`, backgroundColor: s.color }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Top Recruiters */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Top Recruiting Companies</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.recruitersGrid}>
            {topRecruiters.map((r, i) => (
              <View key={i} style={styles.recruiterCard}>
                <View style={styles.logoContainer}>
                  <Image 
                    source={{ uri: r.logo }} 
                    style={styles.recruiterLogo} 
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.recruiterName} numberOfLines={1}>{r.name}</Text>
                <View style={styles.pkgBadge}>
                  <Text style={styles.recruiterPkg}>{r.package}</Text>
                </View>
                <Text style={styles.recruiterSector} numberOfLines={1}>{r.sector}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Star Placements */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>⭐ Star Placements {activeYear}</Text>
          {topPlacements.map((p, i) => (
            <View key={i} style={styles.placementRow}>
              <Image source={{ uri: p.avatar }} style={styles.placementAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.placementName}>{p.name}</Text>
                <Text style={styles.placementBranch}>{p.branch}</Text>
              </View>
              <View style={styles.placementRight}>
                <Text style={styles.placementCompany}>{p.company}</Text>
                <Text style={styles.placementPkg}>{p.package}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  yearTabsContainer: { 
    backgroundColor: '#FFFFFF', 
    height: 75,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  yearScrollContent: { 
    paddingHorizontal: 16, 
    alignItems: 'center',
    gap: 12,
  },
  yearBtn: {
    paddingHorizontal: 20, paddingVertical: 9,
    borderRadius: 22, backgroundColor: '#F3F4F6',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  yearBtnActive: { 
    backgroundColor: '#4338CA', 
    borderColor: '#4338CA',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  yearText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  yearTextActive: { color: '#FFFFFF', fontWeight: '900' },
  scroll: { padding: 16 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconBox: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  statValue: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: '600' },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  sectionHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 20,
  },
  viewAllText: { fontSize: 13, fontWeight: '700', color: '#4338CA' },
  sectorRow: { marginBottom: 14 },
  sectorLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  sectorName: { fontSize: 13, fontWeight: '600', color: '#374151' },
  sectorPct: { fontSize: 13, fontWeight: '800' },
  progressBg: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4 },
  progressFill: { height: 8, borderRadius: 4 },
  recruitersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recruiterCard: {
    width: (width - 84) / 3,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  logoContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recruiterLogo: {
    width: 34,
    height: 34,
  },
  recruiterName: { fontSize: 13, fontWeight: '800', color: '#111827', textAlign: 'center' },
  pkgBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 6,
  },
  recruiterPkg: { fontSize: 11, color: '#4338CA', fontWeight: '800' },
  recruiterSector: { fontSize: 9, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
  placementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  placementAvatar: { width: 46, height: 46, borderRadius: 14, borderWidth: 2, borderColor: '#EEF2FF' },
  placementName: { fontSize: 14, fontWeight: '800', color: '#111827' },
  placementBranch: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  placementRight: { alignItems: 'flex-end' },
  placementCompany: { fontSize: 13, fontWeight: '800', color: '#4338CA' },
  placementPkg: { fontSize: 14, fontWeight: '900', color: '#EA580C', marginTop: 2 },
});

export default PlacementRecordScreen;
