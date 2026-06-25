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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');

function generateMedicalQuestion(topic, index) {
  const t = topic.toLowerCase();

  // Anatomy
  if (t.includes('anatomy')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'Which cranial nerve is primarily responsible for the sensory innervation of the face?',
        options: ['CN VII (Facial)', 'CN V (Trigeminal)', 'CN III (Oculomotor)', 'CN XII (Hypoglossal)'],
        correct: 1,
      };
    } else {
      return {
        type: 'text',
        question: 'Describe the anatomical boundaries of the femoral triangle and list its main contents from lateral to medial.',
        placeholder: 'Describe the borders (sartorius, adductor longus, inguinal ligament) and contents (femoral nerve, artery, vein)...',
      };
    }
  }

  // Physiology
  if (t.includes('physiology')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'Which of the following hormones is secreted by the posterior pituitary gland?',
        options: ['Growth Hormone (GH)', 'Thyroid Stiumlating Hormone (TSH)', 'Antidiuretic Hormone (ADH)', 'Adrenocorticotropic Hormone (ACTH)'],
        correct: 2,
      };
    } else {
      return {
        type: 'text',
        question: 'Explain the physiological mechanisms of cardiac output regulation under sympathetic stimulation.',
        placeholder: 'Discuss stroke volume, heart rate, venous return, and beta-1 adrenergic receptors...',
      };
    }
  }

  // Biochemistry
  if (t.includes('biochem')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'What is the rate-limiting enzyme of glycolysis?',
        options: ['Hexokinase', 'Phosphofructokinase-1 (PFK-1)', 'Pyruvate Kinase', 'Aldolase'],
        correct: 1,
      };
    } else {
      return {
        type: 'text',
        question: 'Describe the biochemical steps of the urea cycle and its clinical correlation with hyperammonemia.',
        placeholder: 'Discuss ammonia detoxification, mitochondrial and cytosolic steps, and clinical symptoms...',
      };
    }
  }

  // Pathology
  if (t.includes('pathology')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'Which type of necrosis is most characteristic of tuberculosis lesions?',
        options: ['Coagulative necrosis', 'Liquefactive necrosis', 'Caseous necrosis', 'Fat necrosis'],
        correct: 2,
      };
    } else {
      return {
        type: 'text',
        question: 'Explain the difference between transudate and exudate fluid accumulation in pathological states.',
        placeholder: 'Discuss protein content, specific gravity, cellular composition, and etiologies like heart failure or inflammation...',
      };
    }
  }

  // Pharmacology
  if (t.includes('pharmacology') || t.includes('pharma')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'What is the mechanism of action of Loop Diuretics like Furosemide?',
        options: [
          'Inhibition of Na+/Cl- cotransporter in distal tubule',
          'Inhibition of Na+/K+/2Cl- cotransporter in ascending loop of Henle',
          'Aldosterone antagonism in collecting duct',
          'Carbonic anhydrase inhibition in proximal tubule'
        ],
        correct: 1,
      };
    } else {
      return {
        type: 'text',
        question: 'Describe the adverse effect profile and clinical monitoring requirements for Digoxin therapy.',
        placeholder: 'Discuss digoxin toxicity, visual disturbances (yellow halos), bradycardia, hypokalemia risk...',
      };
    }
  }

  // Microbiology
  if (t.includes('microbiology')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'Which of the following bacteria is acid-fast positive?',
        options: ['Staphylococcus aureus', 'Mycobacterium tuberculosis', 'Escherichia coli', 'Streptococcus pneumoniae'],
        correct: 1,
      };
    } else {
      return {
        type: 'text',
        question: 'Explain the laboratory diagnosis protocol for suspected bacterial meningitis.',
        placeholder: 'Discuss CSF collection, Gram stain, culture, latex agglutination, CSF biochemistry (protein, glucose)...',
      };
    }
  }

  // ENT
  if (t.includes('ent') || t.includes('ear') || t.includes('throat')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: "Which of the following is the most common site for epistaxis (nosebleed)?",
        options: ["Woodruff's plexus", "Kiesselbach's plexus (Little's area)", "Sphenopalatine artery", "Ethmoid arteries"],
        correct: 1,
      };
    } else {
      return {
        type: 'text',
        question: 'Describe the clinical features, diagnosis, and surgical management of Otitis Media with Effusion (OME).',
        placeholder: 'Discuss glue ear, hearing loss, tympanic membrane appearance (amber-colored), myringotomy...',
      };
    }
  }

  // Ophthalmology
  if (t.includes('ophthalmology') || t.includes('eye')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'Which drug class is considered first-line for reducing intraocular pressure in open-angle glaucoma?',
        options: ['Prostaglandin analogs (e.g. Latanoprost)', 'Alpha-2 agonists', 'Cholinergic agonists', 'Systemic carbonic anhydrase inhibitors'],
        correct: 0,
      };
    } else {
      return {
        type: 'text',
        question: 'Explain the diagnostic differentiation between proliferative and non-proliferative diabetic retinopathy.',
        placeholder: 'Discuss microaneurysms, hard exudates, neovascularization (VEGF driven), vitreous hemorrhage risk...',
      };
    }
  }

  // Forensic Medicine
  if (t.includes('forensic') || t.includes('fmt')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'What is the characteristic legal definition and manifestation of Rigor Mortis?',
        options: ['Post-mortem cooling of the body', 'Post-mortem staining/hypostasis', 'Post-mortem stiffening of muscles', 'Putrefaction'],
        correct: 2,
      };
    } else {
      return {
        type: 'text',
        question: 'Describe the differences between an antemortem wound and a postmortem wound in forensic autopsy.',
        placeholder: 'Discuss tissue reaction, signs of active bleeding, retraction of wound edges, histopathology signs...',
      };
    }
  }

  // Community Medicine
  if (t.includes('community') || t.includes('social') || t.includes('psm')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'Which of the following levels of prevention is concerned with early diagnosis and prompt treatment?',
        options: ['Primordial prevention', 'Primary prevention', 'Secondary prevention', 'Tertiary prevention'],
        correct: 2,
      };
    } else {
      return {
        type: 'text',
        question: 'Describe the vaccination schedule under the Universal Immunization Programme (UIP) in India for an infant up to 1 year of age.',
        placeholder: 'Detail BCG, OPV, Hepatitis B, Pentavalent, Rotavirus, Fractionated IPV, PCV, and MR vaccines...',
      };
    }
  }

  // General Medicine / Pediatrics / Surgery / OBGY
  if (t.includes('medicine') || t.includes('surgery') || t.includes('pediatric') || t.includes('obgy') || t.includes('obstetrics') || t.includes('gynecology') || t.includes('clinical') || t.includes('diagnosis')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'A 45-year-old male presents to the OPD with central chest pain radiating to his left arm. The ECG reveals ST-elevation in leads II, III, and aVF. What is the most likely diagnosis?',
        options: ['Anterior Wall MI', 'Inferior Wall MI', 'Acute Pericarditis', 'Unstable Angina'],
        correct: 1,
      };
    } else {
      return {
        type: 'text',
        question: 'Explain the stepwise emergency management protocol for a patient presenting to the casualty with diabetic ketoacidosis (DKA).',
        placeholder: 'Discuss fluid resuscitation (normal saline), IV insulin infusion, potassium monitoring, and correcting acidosis...',
      };
    }
  }

  // Dental / BDS default
  if (t.includes('dent') || t.includes('oral') || t.includes('periodontics') || t.includes('prosthodontics') || t.includes('orthodontics')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'Which classification system is most commonly used for dental occlusion relationships?',
        options: ["Angle's Classification", "Kennedy's Classification", "Black's Classification", "Miller's Classification"],
        correct: 0,
      };
    } else {
      return {
        type: 'text',
        question: 'Describe the indication, steps, and post-operative management for a simple dental extraction of a mandibular molar.',
        placeholder: 'Discuss local anesthesia (inferior alveolar nerve block), luxation, elevator use, forceps, socket pressure...',
      };
    }
  }

  // General Medical Skills default
  if (index % 2 === 0) {
    return {
      type: 'mcq',
      question: `Which of the following is a primary diagnostic method in clinical practice for evaluating ${topic}?`,
      options: ['Bedside history taking & physical examination', 'Symptomatic triage only', 'Direct invasive procedures without consent', 'Empirical therapy without diagnosis'],
      correct: 0,
    };
  } else {
    return {
      type: 'text',
      question: `Describe a clinical case study or standard diagnostic methodology for assessing patient competency in ${topic}.`,
      placeholder: `Discuss the clinical presentation, diagnosis protocols, and treatment guidelines for ${topic}...`,
    };
  }
}

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
  const isMed = user && (
    user.course?.replace(/\./g, '').toLowerCase().includes('mbbs') ||
    user.course?.replace(/\./g, '').toLowerCase().includes('bds') ||
    user.course?.toLowerCase().includes('medicine') ||
    user.category?.toLowerCase().includes('medical')
  );
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
    if (isMed) {
      const q = generateMedicalQuestion(topic, index);
      return {
        id: index + 1,
        topic: topic,
        ...q
      };
    }

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
        const mockResponses = isMed
          ? [
              "A typical presentation of acute appendicitis starts with periumbilical pain that later shifts to the right iliac fossa, accompanied by localized tenderness at McBurney's point and rebound tenderness.",
              "In standard clinical methodology, the diagnosis of chronic open-angle glaucoma involves assessing progressive visual field defects and optic disc cupping, along with intraocular pressure measurements."
            ]
          : [
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{isMed ? 'Clinical Competency Focus' : 'AI Assessment Focus'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.centerContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroIconBox}>
            <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.heroIconGradient}>
              <MaterialCommunityIcons name="brain" size={60} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary, fontSize: 22 }]}>{isMed ? 'Choose Competency Target' : 'Choose Assessment Target'}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: 24 }]}>
            {isMed ? 'Select the focus area to evaluate and brush up your clinical performance' : 'Select the focus area to evaluate and brush up your performance'}
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
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>{isMed ? 'Prof Theory Syllabus' : 'Academic Syllabus'}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>{isMed ? 'Brush up on professional MBBS/BDS subjects to improve exam grades.' : 'Brush up on course subjects (DSA, DBMS, etc.) to improve exam grades.'}</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#3B82F6', marginTop: 6 }}>{gapData.academicMissingSkills.length} {isMed ? 'subject gaps' : 'syllabus gaps'} remaining</Text>
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
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>{isMed ? 'Clinical Competency' : 'Industry & Placement'}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>{isMed ? 'Evaluate bedside clinical procedures, diagnosis methods, and practical skills.' : 'Evaluate job-ready tech, frameworks, and practical skills.'}</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#7C3AED', marginTop: 6 }}>{gapData.industryMissingSkills.length} {isMed ? 'clinical gaps' : 'career gaps'} remaining</Text>
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
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>{isMed ? 'A balanced mixture of professional theory and clinical skills.' : 'A balanced mixture of syllabus subjects and career skills.'}</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#EA580C', marginTop: 6 }}>{gapData.missingSkills.length} total gaps remaining</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (!testStarted) {
    const modeLabel = testMode === 'academic' ? (isMed ? 'Prof Theory' : 'Academic Syllabus') : testMode === 'industry' ? (isMed ? 'Clinical Competency' : 'Industry & Placement') : 'Comprehensive';
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

          <Text style={[styles.title, { color: colors.textPrimary }]}>{isMed ? `${modeLabel} Evaluation` : `${modeLabel} Assessment`}</Text>
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
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>{isMed ? 'Adaptive questions based on professional syllabus' : 'Adaptive questions based on course syllabus'}</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={18} color="#10B981" />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>{isMed ? 'Mixed MCQ and open-ended clinical case scenarios' : 'Mixed MCQ and open-ended design problems'}</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={18} color="#10B981" />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>Persists performance to dynamically update your profile</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.startBtn}
            onPress={() => {
              Alert.alert('Premium Feature', 'This feature is locked in the free trial.');
            }}
          >
            <LinearGradient colors={['#9CA3AF', '#4B5563']} style={styles.startBtnGradient}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="lock" size={18} color="#FFFFFF" />
                <Text style={styles.startBtnText}>{isMed ? 'Start Clinical Assessment (Locked)' : 'Start AI Assessment (Locked)'}</Text>
              </View>
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
        <Text style={[styles.evalTitle, { color: colors.textPrimary, marginTop: 20 }]}>{isMed ? 'Clinical engine is evaluating...' : 'AI is evaluating...'}</Text>
        <Text style={[styles.evalSub, { color: colors.textSecondary }]}>{isMed ? 'Analyzing clinical logic and verbal answers.' : 'Analyzing your logic and verbal responses.'}</Text>
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
              {isMed 
                ? "Excellent performance! Your clinical reasoning and case analysis explanation was particularly impressive. You demonstrated a strong understanding of clinical symptoms and diagnostic trade-offs."
                : "Excellent performance! Your verbal explanation of scaling was particularly impressive. You demonstrated a deep understanding of architectural trade-offs."}
            </Text>
            
            <View style={styles.gapItem}>
              <Text style={[styles.gapTitle, { color: colors.textPrimary }]}>Recommended Path:</Text>
              <Text style={[styles.gapAction, { color: colors.textSecondary }]}>
                {isMed 
                  ? `• Focus on clinical postings and bedside presentations on ${APP_CONFIG.UNIVERSITY_SHORT_NAME} Portal.`
                  : `• Deep dive into 'Advanced System Design' on ${APP_CONFIG.UNIVERSITY_SHORT_NAME} Portal.`}
              </Text>
              <Text style={[styles.gapAction, { color: colors.textSecondary }]}>
                {isMed 
                  ? "• Participate in standard OSCE/OSPE practical clinical drills."
                  : "• Participate in the upcoming 'Cloud Architecture' hackathon."}
              </Text>
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
