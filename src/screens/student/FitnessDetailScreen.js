import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

const FitnessDetailScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const activityData = [
    { label: 'Steps', value: '8,420', goal: '10,000', unit: 'steps', color: '#EF4444', icon: 'run' },
    { label: 'Calories', value: '420', goal: '600', unit: 'kcal', color: '#10B981', icon: 'fire' },
    { label: 'Focus', value: '45', goal: '60', unit: 'min', color: '#3B82F6', icon: 'brain' },
    { label: 'Sleep', value: '7.2', goal: '8.0', unit: 'hrs', color: '#8B5CF6', icon: 'bed' },
  ];

  const [weight, setWeight] = React.useState('70');
  const [height, setHeight] = React.useState('175');
  const [bmi, setBmi] = React.useState(22.9);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Campus Fitness</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Feather name="share-2" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Main Rings Section */}
        <View style={styles.ringsSection}>
          <View style={styles.mainRings}>
            <View style={[styles.ringBig, { borderColor: '#EF444420' }]}>
               <View style={[styles.ringBigFill, { borderColor: '#EF4444', borderRightColor: 'transparent', transform: [{ rotate: '45deg' }] }]} />
            </View>
            <View style={[styles.ringMed, { borderColor: '#10B98120' }]}>
               <View style={[styles.ringMedFill, { borderColor: '#10B981', borderBottomColor: 'transparent', transform: [{ rotate: '-15deg' }] }]} />
            </View>
            <View style={[styles.ringSmall, { borderColor: '#3B82F620' }]}>
               <View style={[styles.ringSmallFill, { borderColor: '#3B82F6', borderLeftColor: 'transparent', transform: [{ rotate: '120deg' }] }]} />
            </View>
          </View>
          <View style={styles.ringsInfo}>
             <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>Daily Activity</Text>
             <Text style={[styles.activitySub, { color: colors.textSecondary }]}>You're almost at your goal!</Text>
          </View>
        </View>

        {/* Detailed Stats Grid */}
        <View style={styles.statsGrid}>
          {activityData.map((item, index) => {
            const cleanVal = parseFloat(item.value.toString().replace(/,/g, ''));
            const cleanGoal = parseFloat(item.goal.toString().replace(/,/g, ''));
            const progressPercent = Math.min((cleanVal / cleanGoal) * 100, 100);

            return (
              <View key={index} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
                  <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={[styles.statVal, { color: colors.textPrimary }]}>{item.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{item.label} ({item.unit})</Text>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBg, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
                    <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: item.color }]} />
                  </View>
                  <Text style={[styles.goalText, { color: colors.textMuted }]}>Goal: {item.goal}</Text>
                </View>
              </View>
            );
          })}
        </View>


        {/* BMI Calculator Section */}
        <View style={[styles.bmiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.bmiTitle, { color: colors.textPrimary }]}>BMI Calculator</Text>
          <View style={styles.bmiForm}>
            <View style={styles.bmiInputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Weight (kg)</Text>
              <TextInput 
                style={[styles.bmiInput, { color: colors.textPrimary, borderColor: colors.border }]} 
                value={weight} 
                onChangeText={setWeight}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.bmiInputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Height (cm)</Text>
              <TextInput 
                style={[styles.bmiInput, { color: colors.textPrimary, borderColor: colors.border }]} 
                value={height} 
                onChangeText={setHeight}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.bmiResultRow}>
            <View style={styles.bmiCircle}>
              <Text style={styles.bmiValText}>{bmi}</Text>
              <Text style={styles.bmiLabelText}>NORMAL</Text>
            </View>
            <View style={styles.bmiAdvice}>
              <Text style={[styles.adviceTitle, { color: colors.textPrimary }]}>Healthy Weight</Text>
              <Text style={[styles.adviceDesc, { color: colors.textSecondary }]}>Maintain your current routine to stay in the green zone.</Text>
            </View>
          </View>

          <View style={styles.planButtons}>
            <TouchableOpacity style={styles.planBtn}>
              <LinearGradient colors={['#059669', '#064E3B']} style={styles.planBtnGradient}>
                <View style={styles.planBtnHeader}>
                  <MaterialCommunityIcons name="food-apple" size={20} color="#FFFFFF" />
                  <Text style={styles.planBtnTitle}>Get AI Diet Plan</Text>
                </View>
                <View style={styles.paidBadge}>
                  <Text style={styles.paidBadgeText}>₹49 • PAID</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.planBtn}>
              <LinearGradient colors={['#4338CA', '#312E81']} style={styles.planBtnGradient}>
                <View style={styles.planBtnHeader}>
                  <MaterialCommunityIcons name="dumbbell" size={20} color="#FFFFFF" />
                  <Text style={styles.planBtnTitle}>AI Exercise Plan</Text>
                </View>
                <View style={styles.paidBadge}>
                  <Text style={styles.paidBadgeText}>₹20 • PAID</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly Progress Chart Placeholder */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Weekly Consistency</Text>
          <View style={styles.barChart}>
            {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
              <View key={i} style={styles.barCol}>
                <View style={[styles.bar, { height: h, backgroundColor: i === 3 ? '#EF4444' : '#4338CA' }]} />
                <Text style={[styles.barDay, { color: colors.textMuted }]}>{['M','T','W','T','F','S','S'][i]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  shareBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20 },
  ringsSection: { flexDirection: 'row', alignItems: 'center', gap: 30, marginBottom: 40, paddingVertical: 20 },
  mainRings: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center' },
  ringBig: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 12 },
  ringBigFill: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 12 },
  ringMed: { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 12 },
  ringMedFill: { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 12 },
  ringSmall: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 12 },
  ringSmallFill: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 12 },
  ringsInfo: { flex: 1 },
  activityTitle: { fontSize: 24, fontWeight: '900' },
  activitySub: { fontSize: 14, marginTop: 4, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  statCard: { width: (width - 56) / 2, padding: 20, borderRadius: 24, borderWidth: 1 },
  iconCircle: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statVal: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 12, fontWeight: '700', marginBottom: 12 },
  progressContainer: { width: '100%' },
  progressBg: { height: 6, borderRadius: 3, marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 3 },
  goalText: { fontSize: 10, fontWeight: '700' },
  chartCard: { padding: 24, borderRadius: 28, borderWidth: 1 },
  chartTitle: { fontSize: 18, fontWeight: '800', marginBottom: 24 },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
  barCol: { alignItems: 'center', gap: 8 },
  bar: { width: 16, borderRadius: 8 },
  barDay: { fontSize: 10, fontWeight: '800' },
  insightCard: { padding: 24, borderRadius: 28, borderWidth: 1, marginBottom: 24 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  insightTitle: { fontSize: 18, fontWeight: '800' },
  insightDesc: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
  
  bmiCard: { padding: 24, borderRadius: 28, borderWidth: 1, marginBottom: 24 },
  bmiTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20 },
  bmiForm: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  bmiInputGroup: { flex: 1 },
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  bmiInput: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, fontWeight: '700' },
  bmiResultRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, width: '100%' },
  bmiCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  bmiValText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  bmiLabelText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  bmiAdvice: { flex: 1, flexShrink: 1 },
  adviceTitle: { fontSize: 17, fontWeight: '900', marginBottom: 4 },
  adviceDesc: { fontSize: 13, fontWeight: '500', lineHeight: 18, color: '#64748B' },
  planButtons: { gap: 12 },
  planBtn: { borderRadius: 20, overflow: 'hidden' },
  planBtnGradient: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planBtnHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planBtnTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  paidBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  paidBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
});

export default FitnessDetailScreen;
