import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Image, Dimensions, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { APP_CONFIG } from '../../config/appConfig';

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
  const [isListening, setIsListening] = useState(false);
  const micAnim = useRef(new Animated.Value(1)).current;

  const questions = [
    {
      id: 1,
      topic: 'DSA - Arrays & Hashing',
      type: 'mcq',
      question: 'What is the time complexity of searching an element in a Hash Map in the average case?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correct: 0,
    },
    {
      id: 2,
      topic: 'System Design',
      type: 'mcq',
      question: 'Which component is used to distribute traffic across multiple servers?',
      options: ['Database', 'Load Balancer', 'Cache', 'API Gateway'],
      correct: 1,
    },
    {
      id: 3,
      topic: 'Software Engineering',
      type: 'text',
      question: 'Explain the difference between vertical and horizontal scaling in the context of distributed systems.',
      placeholder: 'Explain in your own words...',
    },
    {
      id: 4,
      topic: 'Cloud Computing',
      type: 'mcq',
      question: 'Which AWS service is primarily used for serverless functions?',
      options: ['EC2', 'S3', 'Lambda', 'RDS'],
      correct: 2,
    },
    {
      id: 5,
      topic: 'Data Modeling',
      type: 'text',
      question: 'Why would you choose a NoSQL database like MongoDB over a traditional SQL database?',
      placeholder: 'Describe a use case...',
    },
  ];

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
    if (index === questions[currentQuestion].correct) {
      setScore(prev => prev + 1);
    }
    nextQuestion();
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setTextAnswer('');
    } else {
      finishTest();
    }
  };

  const finishTest = () => {
    setEvaluating(true);
    setTimeout(() => {
      setEvaluating(false);
      setCompleted(true);
    }, 2000);
  };

  if (!testStarted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Skill Gap Test</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.centerContent}>
          <View style={styles.heroIconBox}>
            <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.heroIconGradient}>
              <MaterialCommunityIcons name="brain" size={60} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>AI Skill Evaluation</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            This test will evaluate your current proficiency in DSA, System Design, and Cloud Computing to provide personalized feedback.
          </Text>

          <View style={styles.infoGrid}>
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="timer-outline" size={24} color="#EA580C" />
              <Text style={[styles.infoVal, { color: colors.textPrimary }]}>1 Hour</Text>
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
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>Adaptive difficulty based on performance</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={18} color="#10B981" />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>Mixed MCQ and Open-ended questions</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={18} color="#10B981" />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>Speech-to-Text for quick verbal answers</Text>
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
