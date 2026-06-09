import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Image, Dimensions, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { APP_CONFIG } from '../../config/appConfig';
import { useUser } from '../../context/UserContext';
import { computeSkillGap } from '../../data/aiEngine';

const { width } = Dimensions.get('window');

const SkillGapTestScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [score, setScore] = useState(0);
  const [textAnswer, setTextAnswer] = useState('');
  const [answers, setAnswers] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [testMode, setTestMode] = useState(null); // 'academic', 'industry', or 'mixed'
  const micAnim = useRef(new Animated.Value(1)).current;

  const { user, updateSkillScore } = useUser();
  const gapData = user ? computeSkillGap(user) : { expectedSkills: ['DSA', 'System Design'], missingSkills: ['DSA', 'System Design'], academicMissingSkills: [], academicExpectedSkills: [], industryMissingSkills: [], industryExpectedSkills: [] };
  
  // Choose missing or expected based on mode
  let topicsSource = [];
  let fallbackSource = [];
  
  if (testMode === 'academic') {
    topicsSource = gapData.academicMissingSkills || [];
    fallbackSource = gapData.academicExpectedSkills || [];
  } else if (testMode === 'industry') {
    topicsSource = gapData.industryMissingSkills || [];
    fallbackSource = gapData.industryExpectedSkills || [];
  } else {
    topicsSource = gapData.missingSkills || [];
    fallbackSource = gapData.expectedSkills || [];
  }

  const dynamicTopics = topicsSource.length > 0 
    ? topicsSource.slice(0, 5) 
    : fallbackSource.slice(0, 5);
  
  const questions = dynamicTopics.map((topic, index) => {
    if (index % 2 === 0) {
      return {
        id: index + 1,
        topic: topic,
        type: 'mcq',
        question: `Which of the following is a key concept in ${topic}?`,
        options: ['Fundamentals', 'Applied principles', 'Integration standards', 'All of the above'],
        correct: 3,
      };
    } else {
      return {
        id: index + 1,
        topic: topic,
        type: 'text',
        question: `Explain the importance of ${topic} and its core concepts.`,
        placeholder: `Describe a scenario or use case for ${topic}...`,
      };
    }
  });

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micAnim, { toValue: 1.5, duration: 500, useNativeDriver: true }),
          Animated.timing(micAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();

      // Simulate Speech to Text
      const timer = setTimeout(() => {
        stopListening();
        const mockResponses = [
          "Horizontal scaling adds more machines to your resource pool, while vertical scaling adds more power (CPU, RAM) to an existing machine.",
          "I would choose NoSQL for its flexible schema and ability to handle large volumes of unstructured data or when high write throughput is needed."
        ];
        setTextAnswer(mockResponses[currentQuestion % 2 === 0 ? 0 : 1]);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      micAnim.setValue(1);
    }
  }, [isListening]);

  const startListening = () => {
    setIsListening(true);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const handleAnswer = (index) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: index }));
    if (index === questions[currentQuestion].correct) {
      setScore(prev => prev + 1);
    }
    nextQuestion({ ...answers, [currentQuestion]: index });
  };

  const nextQuestion = (currentAnswers = answers) => {
    let finalAnswers = { ...currentAnswers };
    if (questions[currentQuestion].type === 'text') {
      finalAnswers[currentQuestion] = textAnswer;
      if (textAnswer.trim().length > 10) {
        setScore(prev => prev + 1);
      }
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setTextAnswer('');
      setAnswers(finalAnswers);
    } else {
      finishTest(finalAnswers);
    }
  };

  const finishTest = (finalAnswers) => {
    setEvaluating(true);
    setTimeout(() => {
      setEvaluating(false);
      setCompleted(true);

      // Persist tested skill scores to UserContext
      questions.forEach((q, idx) => {
        let topicScore = 0;
        const answer = finalAnswers[idx];
        if (q.type === 'mcq') {
          topicScore = answer === q.correct ? 90 : 30;
        } else {
          topicScore = (answer && answer.trim().length > 10) ? 85 : 0;
        }

        if (updateSkillScore) {
          updateSkillScore(q.topic, topicScore);
        }
      });
    }, 2000);
  };

  if (!testMode) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>AI Assessment Focus</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.centerContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroIconBox}>
            <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.heroIconGradient}>
              <MaterialCommunityIcons name="brain" size={60} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary, fontSize: 22 }]}>Choose Assessment Target</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: 24 }]}>
            Select the focus area to evaluate and brush up your performance
          </Text>

          {/* Academic Syllabus Mode Card */}
          <TouchableOpacity
            style={[styles.infoCard, { width: '100%', marginBottom: 16, backgroundColor: colors.card, borderColor: colors.border, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16 }]}
            onPress={() => setTestMode('academic')}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
              <Feather name="book-open" size={24} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>Academic Syllabus</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>Brush up on course subjects (DSA, DBMS, etc.) to improve exam grades.</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#3B82F6', marginTop: 6 }}>{gapData.academicMissingSkills.length} syllabus gaps remaining</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Industry Placement Mode Card */}
          <TouchableOpacity
            style={[styles.infoCard, { width: '100%', marginBottom: 16, backgroundColor: colors.card, borderColor: colors.border, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16 }]}
            onPress={() => setTestMode('industry')}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? 'rgba(124,58,237,0.1)' : '#F5F3FF', justifyContent: 'center', alignItems: 'center' }}>
              <Feather name="briefcase" size={24} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>Industry & Placement</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>Evaluate job-ready tech, frameworks, and practical skills.</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#7C3AED', marginTop: 6 }}>{gapData.industryMissingSkills.length} career gaps remaining</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Mixed Mode Card */}
          <TouchableOpacity
            style={[styles.infoCard, { width: '100%', marginBottom: 24, backgroundColor: colors.card, borderColor: colors.border, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16 }]}
            onPress={() => setTestMode('mixed')}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? 'rgba(234,88,12,0.1)' : '#FFF7ED', justifyContent: 'center', alignItems: 'center' }}>
              <Feather name="compass" size={24} color="#EA580C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>Comprehensive Test</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>A balanced mixture of syllabus subjects and career skills.</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#EA580C', marginTop: 6 }}>{gapData.missingSkills.length} total gaps remaining</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (!testStarted) {
    const modeLabel = testMode === 'academic' ? 'Academic Syllabus' : testMode === 'industry' ? 'Industry & Placement' : 'Comprehensive';
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setTestMode(null)} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{modeLabel} Evaluation</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.centerContent}>
          <View style={styles.heroIconBox}>
            <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.heroIconGradient}>
              <MaterialCommunityIcons name={testMode === 'academic' ? "book-open-page-variant" : testMode === 'industry' ? "briefcase" : "brain"} size={60} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>{modeLabel} Assessment</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {topicsSource.length > 0 
              ? `This test evaluates your proficiency in your missing topics: ${topicsSource.slice(0, 3).join(', ')} to bridge identified gaps.`
              : `This test evaluates your proficiency in standard topics: ${fallbackSource.slice(0, 3).join(', ')}.`
            }
          </Text>

          <View style={styles.infoGrid}>
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="timer-outline" size={24} color="#EA580C" />
              <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{questions.length * 10} Mins</Text>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Duration</Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="microphone-outline" size={24} color="#4338CA" />
              <Text style={[styles.infoVal, { color: colors.textPrimary }]}>Voice</Text>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Supported</Text>
            </View>
          </View>

          <View style={styles.testFeatures}>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={18} color="#10B981" />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>Adaptive questions based on course syllabus</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={18} color="#10B981" />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>Mixed MCQ and open-ended design problems</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={18} color="#10B981" />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>Persists performance to dynamically update your profile</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.startBtn}
            onPress={() => setTestStarted(true)}
          >
            <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.startBtnGradient}>
              <Text style={styles.startBtnText}>Start AI Assessment</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (evaluating) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="robot" size={80} color="#EA580C" />
        <Text style={[styles.evalTitle, { color: colors.textPrimary, marginTop: 20 }]}>AI is evaluating...</Text>
        <Text style={[styles.evalSub, { color: colors.textSecondary }]}>Analyzing your logic and verbal responses.</Text>
      </View>
    );
  }

  if (completed) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.resultHeader}>
            <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>Test Completed!</Text>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreText}>{Math.round(((score + 2) / (questions.length + 1)) * 100)}%</Text>
              <Text style={styles.scoreSub}>Proficiency</Text>
            </View>
          </View>

          <View style={[styles.feedbackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.feedbackHeader}>
              <MaterialCommunityIcons name="robot" size={24} color="#EA580C" />
              <Text style={[styles.feedbackHeaderTitle, { color: colors.textPrimary }]}>AI Feedback</Text>
            </View>
            <Text style={[styles.feedbackText, { color: colors.textSecondary }]}>
              Excellent performance! Your verbal explanation of scaling was particularly impressive. You demonstrated a deep understanding of architectural trade-offs.
            </Text>
            
            <View style={styles.gapItem}>
              <Text style={[styles.gapTitle, { color: colors.textPrimary }]}>Recommended Path:</Text>
              <Text style={[styles.gapAction, { color: colors.textSecondary }]}>• Deep dive into 'Advanced System Design' on {APP_CONFIG.UNIVERSITY_SHORT_NAME} Portal.</Text>
              <Text style={[styles.gapAction, { color: colors.textSecondary }]}>• Participate in the upcoming 'Cloud Architecture' hackathon.</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.doneBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const q = questions[currentQuestion];

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.testHeader}>
          <View style={styles.testHeaderTop}>
            <Text style={[styles.qCount, { color: colors.textSecondary }]}>Question {currentQuestion + 1} of {questions.length}</Text>
            <View style={styles.timerBadge}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#EA580C" />
              <Text style={styles.timerText}>58:42</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / questions.length) * 100}%` }]} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.qContainer}>
          <Text style={[styles.topicText, { color: '#EA580C' }]}>{q.topic}</Text>
          <Text style={[styles.questionText, { color: colors.textPrimary }]}>{q.question}</Text>
          
          {q.type === 'mcq' ? (
            <View style={styles.optionsContainer}>
              {q.options.map((opt, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.optionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleAnswer(i)}
                >
                  <Text style={[styles.optionText, { color: colors.textPrimary }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.textInputArea}>
              <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  multiline
                  placeholder={q.placeholder}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={textAnswer}
                  onChangeText={setTextAnswer}
                />
              </View>

              <View style={styles.sttContainer}>
                <TouchableOpacity 
                  onPress={isListening ? stopListening : startListening}
                  style={styles.micBtnWrapper}
                >
                  <Animated.View style={[
                    styles.micCircle, 
                    { transform: [{ scale: micAnim }] },
                    isListening && { backgroundColor: '#FEE2E2' }
                  ]}>
                    <MaterialCommunityIcons 
                      name={isListening ? "microphone" : "microphone-outline"} 
                      size={28} 
                      color={isListening ? "#EF4444" : "#EA580C"} 
                    />
                  </Animated.View>
                </TouchableOpacity>
                <Text style={[styles.sttLabel, { color: isListening ? "#EF4444" : colors.textSecondary }]}>
                  {isListening ? "Listening..." : "Tap to Speak"}
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.nextBtn, !textAnswer && styles.nextBtnDisabled]}
                onPress={nextQuestion}
                disabled={!textAnswer}
              >
                <Text style={styles.nextBtnText}>Submit & Next</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  centerContent: { padding: 24, alignItems: 'center' },
  heroIconBox: { marginBottom: 30 },
  heroIconGradient: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  infoGrid: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  infoCard: { flex: 1, padding: 20, borderRadius: 24, alignItems: 'center', borderWidth: 1 },
  infoVal: { fontSize: 18, fontWeight: '900', marginTop: 8 },
  infoLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  startBtn: { width: '100%', borderRadius: 20, overflow: 'hidden' },
  startBtnGradient: { paddingVertical: 18, alignItems: 'center' },
  startBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  
  testFeatures: { width: '100%', marginBottom: 40, gap: 12 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 13, fontWeight: '500' },
  
  testHeader: { padding: 20 },
  testHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF7ED', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  timerText: { fontSize: 12, fontWeight: '800', color: '#EA580C' },
  qCount: { fontSize: 14, fontWeight: '700' },
  progressBar: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#EA580C' },
  qContainer: { padding: 24 },
  topicText: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 12 },
  questionText: { fontSize: 20, fontWeight: '800', lineHeight: 28, marginBottom: 32 },
  optionsContainer: { gap: 16 },
  optionBtn: { padding: 20, borderRadius: 16, borderWidth: 1 },
  optionText: { fontSize: 16, fontWeight: '600' },
  
  textInputArea: { gap: 24 },
  inputBox: { borderRadius: 20, borderWidth: 1, padding: 16, minHeight: 150 },
  input: { fontSize: 16, fontWeight: '500', lineHeight: 24, textAlignVertical: 'top' },
  sttContainer: { alignItems: 'center', gap: 10 },
  micBtnWrapper: { width: 64, height: 64, justifyContent: 'center', alignItems: 'center' },
  micCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  sttLabel: { fontSize: 12, fontWeight: '700' },
  nextBtn: { backgroundColor: '#111827', paddingVertical: 18, borderRadius: 20, alignItems: 'center' },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  
  evalTitle: { fontSize: 22, fontWeight: '900' },
  evalSub: { fontSize: 14, marginTop: 8 },
  
  scroll: { padding: 24 },
  resultHeader: { alignItems: 'center', marginBottom: 32 },
  resultTitle: { fontSize: 28, fontWeight: '900', marginBottom: 24 },
  scoreCircle: { 
    width: 150, height: 150, borderRadius: 75, 
    backgroundColor: '#EA580C', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#EA580C', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20
  },
  scoreText: { color: '#FFFFFF', fontSize: 36, fontWeight: '900' },
  scoreSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', marginTop: 4 },
  
  feedbackCard: { padding: 24, borderRadius: 28, borderWidth: 1, marginBottom: 32 },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  feedbackHeaderTitle: { fontSize: 18, fontWeight: '900' },
  feedbackText: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  gapItem: { backgroundColor: 'rgba(0,0,0,0.03)', padding: 16, borderRadius: 16 },
  gapTitle: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  gapAction: { fontSize: 13, marginTop: 4 },
  doneBtn: { backgroundColor: '#111827', paddingVertical: 18, borderRadius: 20, alignItems: 'center' },
  doneBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
});

export default SkillGapTestScreen;
