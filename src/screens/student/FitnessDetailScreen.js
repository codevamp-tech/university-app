import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, TextInput, ActivityIndicator, Modal, Share, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { useHealthMetrics } from '../../hooks/useHealthMetrics';
import { generateFitnessPlanAPI, getTodayFitnessPlansAPI } from '../../data/apiService';
import FocusTimerModal from '../../components/FocusTimerModal';
import ActivityRing from '../../components/ActivityRing';
import * as Print from 'expo-print';

const { width } = Dimensions.get('window');

const renderFormattedContent = (content, colors) => {
  if (!content) return null;

  const lines = content.split('\n');
  return lines.map((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return <View key={index} style={{ height: 8 }} />;
    }

    if (trimmed.startsWith('# ')) {
      return (
        <Text key={index} style={[styles.h1, { color: colors.textPrimary, marginTop: 16, marginBottom: 8 }]}>
          {trimmed.slice(2)}
        </Text>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <Text key={index} style={[styles.h2, { color: colors.textPrimary, marginTop: 14, marginBottom: 6 }]}>
          {trimmed.slice(3)}
        </Text>
      );
    }
    if (trimmed.startsWith('### ')) {
      return (
        <Text key={index} style={[styles.h3, { color: colors.textPrimary, marginTop: 12, marginBottom: 6 }]}>
          {trimmed.slice(4)}
        </Text>
      );
    }
    if (trimmed.startsWith('#### ')) {
      return (
        <Text key={index} style={[styles.h3, { color: colors.textPrimary, marginTop: 10, marginBottom: 4, fontWeight: '700' }]}>
          {trimmed.slice(5)}
        </Text>
      );
    }

    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
    const isNumbered = /^\d+\.\s/.test(trimmed);

    let cleanText = trimmed;
    if (isBullet) {
      cleanText = trimmed.slice(2);
    } else if (isNumbered) {
      const match = trimmed.match(/^\d+\.\s(.*)/);
      if (match) cleanText = match[1];
    }

    const parts = [];
    let remaining = cleanText;
    const regex = /\*\*(.*?)\*\*/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        parts.push(remaining.substring(lastIndex, match.index));
      }
      parts.push(
        <Text key={`bold-${match.index}`} style={{ fontWeight: '800', color: colors.textPrimary }}>
          {match[1]}
        </Text>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < remaining.length) {
      parts.push(remaining.substring(lastIndex));
    }

    if (isBullet) {
      return (
        <View key={index} style={styles.bulletRow}>
          <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
          <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
            {parts}
          </Text>
        </View>
      );
    }

    if (isNumbered) {
      const numPrefix = trimmed.match(/^(\d+\.)\s/)[1];
      return (
        <View key={index} style={styles.bulletRow}>
          <Text style={[styles.bulletPoint, { color: colors.primary, fontWeight: '700' }]}>{numPrefix}</Text>
          <Text style={[styles.bulletText, { color: colors.textSecondary, marginLeft: 8 }]}>
            {parts}
          </Text>
        </View>
      );
    }

    return (
      <Text key={index} style={[styles.paragraph, { color: colors.textSecondary }]}>
        {parts}
      </Text>
    );
  });
};

const FitnessDetailScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { accessToken, user } = useUser();

  // ─── Live Health Metrics ────────────────────────────────────────────────────
  const { metrics, weeklySteps, goals, loading: metricsLoading, permissionGranted, refresh, requestAccess, updateGoal } = useHealthMetrics();

  const [showFocusTimer, setShowFocusTimer] = React.useState(false);

  const activityData = [
    { label: 'Steps',    value: `${metrics.steps.toLocaleString()} (${(metrics.steps / 1300).toFixed(1)} km)`,  goal: goals.steps.toLocaleString(),  unit: '', color: '#EF4444', icon: 'run' },
    { label: 'Calories', value: String(metrics.calories),        goal: String(goals.calories),        unit: 'kcal',  color: '#10B981', icon: 'fire' },
    { label: 'Focus',    value: String(metrics.focusMinutes),    goal: String(goals.focus),           unit: 'min',   color: '#3B82F6', icon: 'brain' },
    { label: 'Sleep',    value: String(metrics.sleepHours),      goal: String(goals.sleep),           unit: 'hrs',   color: '#8B5CF6', icon: 'bed' },
  ];

  // Ring progress based on actual data
  const stepsProgress = goals.steps > 0 ? Math.min(metrics.steps / goals.steps, 1) : 0;
  const caloriesProgress = goals.calories > 0 ? Math.min(metrics.calories / goals.calories, 1) : 0;
  const focusProgress = goals.focus > 0 ? Math.min(metrics.focusMinutes / goals.focus, 1) : 0;

  // Calculate dynamic weekly consistency heights
  const weeklyDayLabels = React.useMemo(() => {
    const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(labels[d.getDay()]);
    }
    return days;
  }, []);

  const weeklyHeights = React.useMemo(() => {
    const sGoal = goals.steps || 10000;
    return weeklySteps.map(steps => Math.max(Math.min(Math.round((steps / sGoal) * 100), 100), 8)); // Ensure at least 8px visible bar height
  }, [weeklySteps, goals.steps]);

  const [weight, setWeight] = React.useState('70');
  const [height, setHeight] = React.useState('175');
  const [bmi, setBmi] = React.useState(22.9);

  // AI Plan states
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [planResult, setPlanResult] = React.useState(null);
  const [showPlanModal, setShowPlanModal] = React.useState(false);

  const [todayPlans, setTodayPlans] = React.useState({ diet: null, exercise: null });
  const [fetchingPlans, setFetchingPlans] = React.useState(false);

  const loadTodayPlans = React.useCallback(async () => {
    if (!accessToken) return;
    setFetchingPlans(true);
    try {
      const plans = await getTodayFitnessPlansAPI(accessToken);
      const dietPlan = plans.find(p => p.plan_type === 'diet') || null;
      const exercisePlan = plans.find(p => p.plan_type === 'exercise') || null;
      setTodayPlans({ diet: dietPlan, exercise: exercisePlan });
    } catch (err) {
      console.warn('[FitnessDetailScreen] Failed to load today plans:', err.message);
    } finally {
      setFetchingPlans(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    loadTodayPlans();
  }, [loadTodayPlans]);

  // Dynamically calculate BMI
  React.useEffect(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (w > 0 && h > 0) {
      const calculated = (w / (h * h)).toFixed(1);
      setBmi(parseFloat(calculated));
    }
  }, [weight, height]);

  const getBmiDetails = () => {
    if (bmi < 18.5) return { category: 'UNDERWEIGHT', color: '#3B82F6', title: 'Underweight', desc: 'Focus on nutrient-dense meals and strength training to gain healthy mass.' };
    if (bmi < 25.0) return { category: 'NORMAL', color: '#10B981', title: 'Healthy Weight', desc: 'Maintain your current diet and activity routine to stay fit and energetic.' };
    if (bmi < 30.0) return { category: 'OVERWEIGHT', color: '#F59E0B', title: 'Overweight', desc: 'Incorporate balanced cardio and a mild calorie deficit to move to the normal range.' };
    return { category: 'OBESE', color: '#EF4444', title: 'Obese', desc: 'Consult a healthcare professional. Focus on sustainable lifestyle and dietary adjustments.' };
  };
  const bmiDetails = getBmiDetails();

  const handleGeneratePlan = async (type) => {
    if (todayPlans[type]) {
      setPlanResult(todayPlans[type]);
      setShowPlanModal(true);
      return;
    }

    setIsGenerating(true);
    try {
      const plan = await generateFitnessPlanAPI(accessToken, type, weight, height, bmi, user?.name);
      if (plan) {
        setPlanResult(plan);
        setShowPlanModal(true);
        loadTodayPlans();
      } else {
        Alert.alert('Generation Failed', 'Could not retrieve your plan. Please check your connection and try again.');
      }
    } catch (err) {
      Alert.alert('Plan Generation Failed', err.message || 'An error occurred while generating the plan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!planResult) return;
    try {
      await Share.share({
        message: `*Campus Fitness — My AI ${planResult.plan_type.toUpperCase()} Plan*\n\n` +
                 `Weight: ${planResult.weight}kg | Height: ${planResult.height}cm | BMI: ${planResult.bmi}\n\n` +
                 planResult.content,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handlePrint = async () => {
    if (!planResult) return;
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1F2937; line-height: 1.6; }
              h1 { color: #EA580C; font-size: 26px; border-bottom: 2px solid #F97316; padding-bottom: 10px; margin-bottom: 20px; }
              h2 { color: #111827; font-size: 20px; margin-top: 25px; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; }
              h3 { color: #374151; font-size: 16px; margin-top: 20px; }
              p, li { font-size: 14px; color: #4B5563; }
              ul { padding-left: 20px; }
              strong { color: #111827; }
              .meta-box { background-color: #F9FAFB; padding: 15px; border-radius: 12px; border: 1px solid #E5E7EB; margin-bottom: 25px; }
            </style>
          </head>
          <body>
            <h1>UniCampus AI — ${planResult.plan_type.toUpperCase()} Plan</h1>
            <div class="meta-box">
              <p><strong>Calculated BMI:</strong> ${planResult.bmi} (${getBmiDetails().title})</p>
              <p><strong>Weight:</strong> ${planResult.weight} kg &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Height:</strong> ${planResult.height} cm</p>
              <p><strong>Generated on:</strong> ${new Date(planResult.created_at).toLocaleDateString()}</p>
            </div>
            <div>${planResult.content
              .replace(/^### (.*$)/gim, '<h3>$1</h3>')
              .replace(/^## (.*$)/gim, '<h2>$1</h2>')
              .replace(/^# (.*$)/gim, '<h1>$1</h1>')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/\n/g, '<br/>')}</div>
          </body>
        </html>
      `;
      await Print.printAsync({ html: htmlContent });
    } catch (error) {
      console.log('Print error:', error);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Campus Fitness</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Main Rings Section — dynamic based on live health data */}
        <View style={styles.ringsSection}>
          <View style={[styles.mainRings, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityRing radius={60} stroke={12} progress={stepsProgress} color="#EF4444" bgColor="#EF444420" />
            <ActivityRing radius={45} stroke={12} progress={caloriesProgress} color="#10B981" bgColor="#10B98120" />
            <ActivityRing radius={30} stroke={12} progress={focusProgress} color="#3B82F6" bgColor="#3B82F620" />
          </View>
          <View style={styles.ringsInfo}>
            <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>Daily Activity</Text>
            <Text style={[styles.activitySub, { color: colors.textSecondary }]}>
              {metricsLoading ? 'Loading health data...' : stepsProgress >= 1 ? '🎉 You hit your step goal!' : "You're almost at your goal!"}
            </Text>
          </View>
        </View>

        {/* Health Permission Banner */}
        {!permissionGranted && !metricsLoading && (
          <TouchableOpacity onPress={requestAccess} style={[styles.permissionBanner, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF', borderColor: isDark ? '#334155' : '#BFDBFE' }]}>
            <MaterialCommunityIcons name="heart-pulse" size={22} color="#3B82F6" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.permBannerTitle, { color: isDark ? '#F1F5F9' : '#1E40AF' }]}>Connect Health Data</Text>
              <Text style={[styles.permBannerSub, { color: isDark ? '#94A3B8' : '#3B82F6' }]}>Tap to allow access to your steps, calories, and sleep from Apple Health or Health Connect.</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#3B82F6" />
          </TouchableOpacity>
        )}

        {/* Detailed Stats Grid */}
        <View style={styles.statsGrid}>
          {activityData.map((item, index) => {
            const cleanVal = parseFloat(item.value.toString().replace(/,/g, ''));
            const cleanGoal = parseFloat(item.goal.toString().replace(/,/g, ''));
            const progressPercent = Math.min((cleanVal / cleanGoal) * 100, 100);

            return (
              <TouchableOpacity
                key={index}
                style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={item.label === 'Focus' ? 0.7 : 1}
                onPress={item.label === 'Focus' ? () => setShowFocusTimer(true) : undefined}
              >
                <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
                  <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
                </View>
                {metricsLoading ? (
                  <ActivityIndicator size="small" color={item.color} style={{ marginVertical: 8 }} />
                ) : (
                  <Text style={[styles.statVal, { color: colors.textPrimary }]}>{item.value}</Text>
                )}
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{item.label} ({item.unit})</Text>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBg, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
                    <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: item.color }]} />
                  </View>
                  <Text style={[styles.goalText, { color: colors.textMuted }]}>Goal: {item.goal}</Text>
                </View>
                {item.label === 'Focus' && (
                  <View style={[styles.focusBtnHint, { backgroundColor: item.color + '15' }]}>
                    <MaterialCommunityIcons name="timer-outline" size={12} color={item.color} />
                    <Text style={{ fontSize: 10, fontWeight: '800', color: item.color, marginLeft: 4 }}>TAP TO START</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Move Goal Setter */}
        <View style={[styles.focusStartCard, { backgroundColor: isDark ? '#3F1D1D' : '#FEF2F2', borderColor: isDark ? '#7F1D1D' : '#FECACA', flexDirection: 'column', alignItems: 'stretch' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={[styles.focusIconCircle, { backgroundColor: '#EF444420' }]}>
              <MaterialCommunityIcons name="fire" size={24} color="#EF4444" />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[styles.focusStartTitle, { color: isDark ? '#FEF2F2' : '#7F1D1D' }]}>Move Goal</Text>
              <Text style={[styles.focusStartSub, { color: isDark ? '#FECACA' : '#991B1B' }]}>Set your daily calorie burn target</Text>
              <Text style={[styles.focusStartSub, { color: isDark ? '#FECACA' : '#991B1B', marginTop: 4, fontWeight: '700' }]}>
                ~{goals.calories * 20} steps ({((goals.calories * 20) / 1300).toFixed(1)} km)
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <TouchableOpacity onPress={() => updateGoal('calories', Math.max(100, goals.calories - 50))} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' }}>
              <MaterialCommunityIcons name="minus" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={{ fontSize: 28, fontWeight: '900', color: isDark ? '#FFFFFF' : '#000000', width: 80, textAlign: 'center' }}>{goals.calories}</Text>
            <TouchableOpacity onPress={() => updateGoal('calories', goals.calories + 50)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' }}>
              <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
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
            <View style={[styles.bmiCircle, { backgroundColor: bmiDetails.color }]}>
              <Text style={styles.bmiValText}>{bmi}</Text>
              <Text style={styles.bmiLabelText}>{bmiDetails.category}</Text>
            </View>
            <View style={styles.bmiAdvice}>
              <Text style={[styles.adviceTitle, { color: colors.textPrimary }]}>{bmiDetails.title}</Text>
              <Text style={[styles.adviceDesc, { color: colors.textSecondary }]}>{bmiDetails.desc}</Text>
            </View>
          </View>

          <View style={styles.planButtons}>
            <TouchableOpacity style={styles.planBtn} onPress={() => handleGeneratePlan('diet')} disabled={isGenerating}>
              <LinearGradient colors={['#059669', '#064E3B']} style={styles.planBtnGradient}>
                <View style={styles.planBtnHeader}>
                  <MaterialCommunityIcons name="food-apple" size={20} color="#FFFFFF" />
                  <Text style={styles.planBtnTitle}>
                    {todayPlans.diet ? "View Today's Diet Plan" : "Get AI Diet Plan"}
                  </Text>
                </View>
                {!todayPlans.diet && (
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidBadgeText}>1 FREE DAILY</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.planBtn} onPress={() => handleGeneratePlan('exercise')} disabled={isGenerating}>
              <LinearGradient colors={['#4338CA', '#312E81']} style={styles.planBtnGradient}>
                <View style={styles.planBtnHeader}>
                  <MaterialCommunityIcons name="dumbbell" size={20} color="#FFFFFF" />
                  <Text style={styles.planBtnTitle}>
                    {todayPlans.exercise ? "View Today's Exercise Plan" : "AI Exercise Plan"}
                  </Text>
                </View>
                {!todayPlans.exercise && (
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidBadgeText}>1 FREE DAILY</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          {isGenerating && (
            <View style={{ marginTop: 16, alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>AI is designing your custom plan...</Text>
            </View>
          )}
        </View>

        {/* Weekly Progress Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Weekly Consistency</Text>
          <View style={styles.barChart}>
            {weeklyHeights.map((h, i) => (
              <View key={i} style={styles.barCol}>
                <View style={[styles.bar, { height: h, backgroundColor: i === 6 ? '#EF4444' : '#4338CA' }]} />
                <Text style={[styles.barDay, { color: colors.textMuted }]}>{weeklyDayLabels[i]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fitness Plan Result Modal */}
      <Modal
        visible={showPlanModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPlanModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                AI {planResult?.plan_type === 'diet' ? 'Nutrition' : 'Workout'} Guide
              </Text>
              <TouchableOpacity onPress={() => setShowPlanModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalMetaCard}>
                <Text style={styles.metaText}>
                  Calculated BMI: <Text style={{ fontWeight: '800' }}>{planResult?.bmi}</Text> ({bmiDetails.title})
                </Text>
                <Text style={styles.metaText}>
                  Weight: {planResult?.weight}kg &nbsp;•&nbsp; Height: {planResult?.height}cm
                </Text>
              </View>

              {renderFormattedContent(planResult?.content, colors)}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#25D366' }]} onPress={handleShare}>
                <MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" />
                <Text style={styles.actionBtnText}>Share on WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handlePrint}>
                <MaterialCommunityIcons name="file-pdf-box" size={20} color="#FFF" />
                <Text style={styles.actionBtnText}>Download PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Focus Timer Modal */}
      <FocusTimerModal
        visible={showFocusTimer}
        onClose={() => setShowFocusTimer(false)}
        onSessionComplete={(minutes) => {
          refresh();
          Alert.alert('Focus Complete! 🧠', `You focused for ${minutes} minute${minutes !== 1 ? 's' : ''}. Keep it up!`);
        }}
        colors={colors}
        isDark={isDark}
      />
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

  bmiCard: { padding: 24, borderRadius: 28, borderWidth: 1, marginBottom: 24 },
  bmiTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20 },
  bmiForm: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  bmiInputGroup: { flex: 1 },
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  bmiInput: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, fontWeight: '700' },
  bmiResultRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, width: '100%' },
  bmiCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  bmiValText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  bmiLabelText: { color: '#FFFFFF', fontSize: 8, fontWeight: '800', textAlign: 'center' },
  bmiAdvice: { flex: 1, flexShrink: 1 },
  adviceTitle: { fontSize: 17, fontWeight: '900', marginBottom: 4 },
  adviceDesc: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  planButtons: { gap: 12 },
  planBtn: { borderRadius: 20, overflow: 'hidden' },
  planBtnGradient: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planBtnHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planBtnTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  paidBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  paidBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  modalCloseBtn: { padding: 8 },
  modalScroll: { paddingBottom: 24 },
  modalMetaCard: { backgroundColor: '#F3F4F620', padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#EA580C', marginBottom: 20 },
  metaText: { fontSize: 14, color: '#6B7280', marginVertical: 2, fontWeight: '600' },
  modalPlanText: { fontSize: 15, lineHeight: 24 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 16 },
  actionBtn: { flex: 1, height: 50, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  actionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  h1: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginVertical: 8 },
  h2: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginVertical: 6 },
  h3: { fontSize: 15, fontWeight: '700', marginVertical: 6 },
  paragraph: { fontSize: 14, lineHeight: 22, marginVertical: 4, fontWeight: '500' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 4, paddingRight: 12 },
  bulletPoint: { fontSize: 16, marginRight: 8, lineHeight: 20 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '500' },

  // Health permission banner
  permissionBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 20 },
  permBannerTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  permBannerSub: { fontSize: 12, fontWeight: '600', lineHeight: 16 },

  // Focus timer hint on card
  focusBtnHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, alignSelf: 'flex-start' },

  // Focus session start card
  focusStartCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 24 },
  focusIconCircle: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  focusStartTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  focusStartSub: { fontSize: 13, fontWeight: '600' },
});

export default FitnessDetailScreen;
