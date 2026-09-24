import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  Image,
  Animated,
  Easing,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, Feather, MaterialIcons } from '@expo/vector-icons';
import { getAvatarUrl } from '../../utils/avatar';
import { SafeStudentAvatar } from '../../components/SafeStudentAvatar';

const { width, height } = Dimensions.get('window');

// ─── Course Detection Helper ──────────────────────────────────────────────────
function resolveStudentDomain(courseStr = '') {
  const c = courseStr.toLowerCase();
  if (c.includes('mba') || c.includes('bba') || c.includes('pgdm') || c.includes('management') || c.includes('marketing')) {
    return 'business';
  }
  if (c.includes('b.com') || c.includes('bcom') || c.includes('m.com') || c.includes('mcom') || c.includes('commerce') || c.includes('finance') || c.includes('accounting')) {
    return 'commerce';
  }
  if (c.includes('pharm') || c.includes('b.pharma') || c.includes('bpharma') || c.includes('mpharm') || c.includes('m.pharma')) {
    return 'pharma';
  }
  if (c.includes('nurs') || c.includes('physio') || c.includes('paramedic')) {
    return 'allied_health';
  }
  // Default to Technical / Computing (MCA, BCA, B.Tech, etc.)
  return 'technical';
}

export default function MockInterviewScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useUser();

  // Auto-detect course domain, allow student to explore other domains if desired
  const detectedDomain = resolveStudentDomain(user?.course || '');
  const [activeDomain, setActiveDomain] = useState(detectedDomain);

  // Setup State
  const [inCall, setInCall] = useState(false);
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState('Campus Placement / Tier-1');

  // In-Call Live State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [callDuration, setCallDuration] = useState(142); // in seconds
  const [interviewerStatus, setInterviewerStatus] = useState('speaking'); // 'speaking' | 'listening' | 'evaluating'
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isCandidateRecording, setIsCandidateRecording] = useState(false);
  const [candidateNotes, setCandidateNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [showPilotLockModal, setShowPilotLockModal] = useState(false);

  // Multi-Axis AI Avatar Motion & Lip-Sync Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const headPitchAnim = useRef(new Animated.Value(0)).current; // Up/down nod
  const headRollAnim = useRef(new Animated.Value(0)).current;  // Tilt angle
  const headYawAnim = useRef(new Animated.Value(0)).current;   // Left/right drift
  const bodyScaleAnim = useRef(new Animated.Value(1)).current; // Natural breathing/zoom
  
  // Lip-Sync Viseme Acoustic Waveform Animations
  const lipSyncOpen = useRef(new Animated.Value(0.2)).current;
  const lipSyncWidth = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0.3)).current;
  const waveAnim2 = useRef(new Animated.Value(0.6)).current;
  const waveAnim3 = useRef(new Animated.Value(0.2)).current;
  const waveAnim4 = useRef(new Animated.Value(0.5)).current;
  const waveAnim5 = useRef(new Animated.Value(0.8)).current;

  // 1. Natural Head Movement, Conversational Nods & Body Gestures Loop
  useEffect(() => {
    let headLoop;
    if (inCall) {
      if (interviewerStatus === 'speaking') {
        // Active speaking: expressive gestures, rhythmic nods, and slight head tilts
        headLoop = Animated.loop(
          Animated.parallel([
            Animated.sequence([
              Animated.timing(headPitchAnim, { toValue: 5, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
              Animated.timing(headPitchAnim, { toValue: -3, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
              Animated.timing(headPitchAnim, { toValue: 3, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
              Animated.timing(headPitchAnim, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ]),
            Animated.sequence([
              Animated.timing(headRollAnim, { toValue: 1.8, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(headRollAnim, { toValue: -1.6, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(headRollAnim, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ]),
            Animated.sequence([
              Animated.timing(headYawAnim, { toValue: 3, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
              Animated.timing(headYawAnim, { toValue: -2.5, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
              Animated.timing(headYawAnim, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ]),
            Animated.sequence([
              Animated.timing(bodyScaleAnim, { toValue: 1.025, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(bodyScaleAnim, { toValue: 1.0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ]),
          ])
        );
      } else if (interviewerStatus === 'listening') {
        // Attentive listening: thoughtful head tilt with periodic understanding nods
        headLoop = Animated.loop(
          Animated.parallel([
            Animated.sequence([
              Animated.timing(headPitchAnim, { toValue: 4, duration: 400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
              Animated.timing(headPitchAnim, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
              Animated.timing(headPitchAnim, { toValue: 3, duration: 350, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
              Animated.timing(headPitchAnim, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
              Animated.delay(1800), // Pause between listening nods
            ]),
            Animated.sequence([
              Animated.timing(headRollAnim, { toValue: -2.2, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(headRollAnim, { toValue: -1.2, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ]),
            Animated.sequence([
              Animated.timing(bodyScaleAnim, { toValue: 1.015, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(bodyScaleAnim, { toValue: 1.0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ]),
          ])
        );
      } else {
        // Evaluating/Thinking: subtle thoughtful tilt
        headLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(headRollAnim, { toValue: 2.0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(headRollAnim, { toValue: 0.5, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ])
        );
      }
      headLoop.start();
    }
    return () => headLoop && headLoop.stop();
  }, [inCall, interviewerStatus]);

  // 2. Real-Time Neural Lip-Sync Viseme & Acoustic Frequency Waves Loop
  useEffect(() => {
    let lipLoop;
    if (inCall && interviewerStatus === 'speaking') {
      lipLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(lipSyncOpen, { toValue: 1.0, duration: 140, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(lipSyncOpen, { toValue: 0.3, duration: 120, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(lipSyncOpen, { toValue: 0.85, duration: 160, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(lipSyncOpen, { toValue: 0.15, duration: 110, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(lipSyncOpen, { toValue: 0.95, duration: 170, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(lipSyncOpen, { toValue: 0.25, duration: 130, easing: Easing.linear, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(lipSyncWidth, { toValue: 1.25, duration: 220, useNativeDriver: true }),
            Animated.timing(lipSyncWidth, { toValue: 0.85, duration: 200, useNativeDriver: true }),
            Animated.timing(lipSyncWidth, { toValue: 1.15, duration: 240, useNativeDriver: true }),
            Animated.timing(lipSyncWidth, { toValue: 1.0, duration: 180, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(waveAnim1, { toValue: 1, duration: 160, useNativeDriver: false }),
            Animated.timing(waveAnim1, { toValue: 0.2, duration: 160, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(waveAnim2, { toValue: 0.9, duration: 210, useNativeDriver: false }),
            Animated.timing(waveAnim2, { toValue: 0.3, duration: 190, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(waveAnim3, { toValue: 1, duration: 175, useNativeDriver: false }),
            Animated.timing(waveAnim3, { toValue: 0.15, duration: 185, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(waveAnim4, { toValue: 0.95, duration: 230, useNativeDriver: false }),
            Animated.timing(waveAnim4, { toValue: 0.25, duration: 200, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(waveAnim5, { toValue: 0.85, duration: 190, useNativeDriver: false }),
            Animated.timing(waveAnim5, { toValue: 0.2, duration: 180, useNativeDriver: false }),
          ]),
        ])
      );
      lipLoop.start();
    } else {
      lipSyncOpen.setValue(0.1);
      lipSyncWidth.setValue(1);
    }
    return () => lipLoop && lipLoop.stop();
  }, [inCall, interviewerStatus]);

  // Pulse effect for speech aura
  useEffect(() => {
    let anim;
    if (inCall && interviewerStatus === 'speaking') {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.14, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      anim.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => anim && anim.stop();
  }, [inCall, interviewerStatus]);

  // Call timer
  useEffect(() => {
    let interval;
    if (inCall) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [inCall]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Domain-Aware Profiles Configuration ─────────────────────────────────────
  const domainData = {
    technical: {
      name: 'Tech & Computer Applications (MCA / B.Tech / BCA)',
      heroTitle: 'Technical & System Architecture Interview',
      heroDesc: 'Sit across from an executive AI Interviewer who evaluates your distributed systems, algorithmic problem solving, modern full-stack, and generative AI architecture.',
      avatars: [
        {
          name: 'Elena Vance',
          title: 'Senior Staff Architect AI',
          org: 'Google Cloud / FAANG Ex-Lead',
          avatarSource: require('../../assets/interviewers/elena.jpg'),
          tone: 'In-depth distributed systems, microservices & high-scale tradeoffs',
          style: 'System Design & Architecture',
        },
        {
          name: 'David Chen',
          title: 'VP of Engineering AI',
          org: 'OpenAI / Meta AI Partner',
          avatarSource: require('../../assets/interviewers/david.jpg'),
          tone: 'Fast-paced algorithmic deep dive, concurrency & API scalability',
          style: 'Live DSA & Full Stack Round',
        },
        {
          name: 'Dr. Maya Patel',
          title: 'Principal AI & RAG Research Scientist',
          org: 'DeepMind Fellow',
          avatarSource: require('../../assets/interviewers/maya.jpg'),
          tone: 'Vector search, embedding chunking, LLM agent loops & fine-tuning',
          style: 'Generative AI & MLOps',
        },
        {
          name: 'Marcus Sterling',
          title: 'Head of Global Tech Talent & HR Lead',
          org: 'Microsoft / Enterprise Talent Director',
          avatarSource: require('../../assets/interviewers/marcus.jpg'),
          tone: 'Cross-functional engineering leadership, STAR behavioral scenarios',
          style: 'Behavioral & Culture Fit',
        },
      ],
      roles: [
        { id: 0, title: 'Cloud & Distributed Systems Architect', icon: 'cloud-tags', badge: 'Tier-1 FAANG' },
        { id: 1, title: 'Generative AI, RAG & LLM Engineer', icon: 'robot', badge: 'High Demand' },
        { id: 2, title: 'Full Stack & High-Concurrency Backend', icon: 'laptop', badge: 'Product Roles' },
        { id: 3, title: 'Advanced DSA & Algorithmic Problem Solving', icon: 'code-braces', badge: 'Coding Round' },
      ],
      questions: [
        {
          q: 'Welcome Sumit. Let’s start with system architecture. How would you design a distributed rate-limiting service capable of handling 500,000 requests per second with sub-millisecond latency across multi-region clusters?',
          focus: 'Token Bucket vs Leaky Bucket, Redis cluster replication, sliding window counters, CAP theorem',
        },
        {
          q: 'Great points on Redis caching. Now, suppose our Retrieval-Augmented Generation (RAG) system is hallucinating outdated policy documents. How would you architect semantic vector re-ranking and chunk metadata filtering to guarantee factual grounding?',
          focus: 'HNSW indexing, Cross-encoders for re-ranking, cosine distance thresholds, context window compression',
        },
        {
          q: 'Walk me through how PostgreSQL handles ACID transactions under high concurrent write loads. How do isolation levels like Read Committed differ from Serializable to prevent phantom reads and write skew?',
          focus: 'MVCC (Multi-Version Concurrency Control), Write-Ahead Logging (WAL), row-level locks, 2-phase locking',
        },
      ],
      rubricMetrics: [
        { label: 'Technical Accuracy & Architecture', score: '88%', fill: '88%', color: '#10B981' },
        { label: 'Problem Solving & Edge Cases', score: '92%', fill: '92%', color: '#F59E0B' },
        { label: 'Communication & Technical Articulation', score: '85%', fill: '85%', color: '#6366F1' },
      ],
      feedbackTip: '"Strong comprehension of distributed token-bucket rate limiting and database MVCC isolation. Recommend elaborating more on fallback caching failure modes."',
    },

    business: {
      name: 'Business & Management (MBA / BBA / PGDM)',
      heroTitle: 'Corporate Strategy & Product Case Interview',
      heroDesc: 'Sit across from an executive Managing Director and Strategy Lead who evaluates your business case structuring, financial feasibility, product roadmap, and leadership presence.',
      avatars: [
        {
          name: 'Marcus Sterling',
          title: 'Senior Managing Director & Partner AI',
          org: 'McKinsey & Co. / BCG Alum',
          avatarSource: require('../../assets/interviewers/marcus.jpg'),
          tone: 'Structured MECE frameworks, market sizing, profitability teardowns',
          style: 'Consulting & Case Interview',
        },
        {
          name: 'Elena Vance',
          title: 'Group Product & Growth Director AI',
          org: 'Amazon / Stripe Ex-Lead',
          avatarSource: require('../../assets/interviewers/elena.jpg'),
          tone: 'Product teardowns, unit economics, GTM strategy & North Star metrics',
          style: 'Product Management & Growth',
        },
        {
          name: 'David Chen',
          title: 'Head of Corporate Finance & Valuation AI',
          org: 'Goldman Sachs Investment Banking',
          avatarSource: require('../../assets/interviewers/david.jpg'),
          tone: 'DCF financial modeling, M&A due diligence, and capital allocation',
          style: 'Investment Banking & Corporate Finance',
        },
        {
          name: 'Dr. Maya Patel',
          title: 'VP of Consumer Insights & Marketing AI',
          org: 'Unilever / Global Brand Director',
          avatarSource: require('../../assets/interviewers/maya.jpg'),
          tone: 'Customer acquisition cost (CAC), LTV modeling, brand positioning',
          style: 'Brand Strategy & Marketing',
        },
      ],
      roles: [
        { id: 0, title: 'Management Consultant (Case & Strategy)', icon: 'chart-line', badge: 'Tier-1 Consulting' },
        { id: 1, title: 'Product Manager & Growth Strategy', icon: 'rocket-launch', badge: 'High Demand' },
        { id: 2, title: 'Investment Banking & Financial Valuation', icon: 'finance', badge: 'Finance Tier-1' },
        { id: 3, title: 'Brand Marketing & Business Development', icon: 'bullhorn', badge: 'FMCG / Tech' },
      ],
      questions: [
        {
          q: 'Suppose a leading pan-India retail chain is experiencing a 15% year-over-year decline in operating margin despite a 20% growth in top-line revenue. Walk me through your diagnostic MECE framework to isolate the root cause and propose an operational turnaround plan.',
          focus: 'Revenue vs Cost breakdown, Gross margin by product category, Supply chain overheads, Working capital cycle',
        },
        {
          q: 'How would you evaluate the Go-To-Market (GTM) strategy for an enterprise B2B SaaS product entering a crowded marketplace? What pricing model (seat-based, usage-based, tiered) would you recommend and why?',
          focus: 'Customer Acquisition Cost (CAC), Payback Period, Net Revenue Retention (NRR), Pilot POC conversion',
        },
        {
          q: 'Tell me about a time you led a cross-functional team with conflicting priorities and tight deadlines. How did you align the stakeholders and resolve interpersonal gridlock?',
          focus: 'STAR Method (Situation, Task, Action, Result), Stakeholder alignment, Conflict resolution, Data-driven consensus',
        },
      ],
      rubricMetrics: [
        { label: 'Strategic Case Structuring (MECE)', score: '90%', fill: '90%', color: '#10B981' },
        { label: 'Commercial Acumen & Unit Economics', score: '87%', fill: '87%', color: '#F59E0B' },
        { label: 'Executive Presence & Articulation', score: '93%', fill: '93%', color: '#6366F1' },
      ],
      feedbackTip: '"Exceptional breakdown of cost drivers and supply chain leakages. Enhance your presentation by quantifying the expected ROI on your proposed inventory consolidation plan."',
    },

    commerce: {
      name: 'Commerce & Accounting (B.Com / M.Com / Finance)',
      heroTitle: 'Corporate Finance & Statutory Audit Interview',
      heroDesc: 'Test your mastery of financial statement integration, statutory taxation, working capital optimization, and credit risk analysis with senior corporate finance partners.',
      avatars: [
        {
          name: 'David Chen',
          title: 'Senior Audit & Assurance Partner AI',
          org: 'Deloitte / Big-4 Assurance Lead',
          avatarSource: require('../../assets/interviewers/david.jpg'),
          tone: 'Ind AS / IFRS compliance, statutory audit evidence, internal financial controls',
          style: 'Audit & Taxation Round',
        },
        {
          name: 'Marcus Sterling',
          title: 'Chief Financial Officer AI',
          org: 'Global Treasury & FinTech Group',
          avatarSource: require('../../assets/interviewers/marcus.jpg'),
          tone: 'Corporate treasury, liquidity management, debt syndication & credit analysis',
          style: 'Corporate Banking & Treasury',
        },
        {
          name: 'Elena Vance',
          title: 'Head of Financial Risk & Advisory AI',
          org: 'JP Morgan Asset Management',
          avatarSource: require('../../assets/interviewers/elena.jpg'),
          tone: 'Ratio analysis, DCF valuation, variance analysis & regulatory reporting',
          style: 'Financial Planning & Analysis (FP&A)',
        },
      ],
      roles: [
        { id: 0, title: 'Financial Analyst & Valuation Associate', icon: 'cash-multiple', badge: 'Corporate Finance' },
        { id: 1, title: 'Statutory Audit & Tax Compliance Lead', icon: 'file-check', badge: 'Big-4 / CA Firm' },
        { id: 2, title: 'Commercial Credit & Risk Assessment Officer', icon: 'shield-check', badge: 'Banking' },
        { id: 3, title: 'Management Accounting & FP&A Analyst', icon: 'calculator', badge: 'Enterprise' },
      ],
      questions: [
        {
          q: 'Walk me through how a ₹50 Lakh capital expenditure (purchase of machinery with a 5-year useful life) flows through all three financial statements at the time of purchase and at the end of Year 1.',
          focus: 'Cash Flow from Investing, Balance Sheet PPE & Cash, Income Statement Depreciation, Tax Shield effect',
        },
        {
          q: 'What are the key differences between Ind AS 115 (Revenue from Contracts with Customers) and older revenue recognition principles? Explain the 5-step model for revenue recognition.',
          focus: 'Identifying contracts, Performance obligations, Transaction price, Allocation, Recognition over time vs point in time',
        },
        {
          q: 'When assessing a corporate borrower for a ₹20 Crore term loan, which financial ratios do you scrutinize first to evaluate debt servicing capacity and liquidity risk?',
          focus: 'DSCR (Debt Service Coverage Ratio), Current Ratio, Quick Ratio, Debt-to-Equity, Interest Coverage Ratio',
        },
      ],
      rubricMetrics: [
        { label: 'Financial Statement Interlinking', score: '91%', fill: '91%', color: '#10B981' },
        { label: 'Accounting Standards & Tax Compliance', score: '86%', fill: '86%', color: '#F59E0B' },
        { label: 'Credit Risk & Ratio Interpretation', score: '89%', fill: '89%', color: '#6366F1' },
      ],
      feedbackTip: '"Flawless explanation of three-statement cash flow mechanics and depreciation tax shields. Be prepared to discuss deferred tax assets/liabilities under Ind AS 12."',
    },

    pharma: {
      name: 'Pharmacy & Pharmaceutical Sciences (B.Pharm / M.Pharm)',
      heroTitle: 'Pharma Regulatory, QA & Clinical Research Interview',
      heroDesc: 'Sit across from an executive Global Regulatory Affairs and Quality Assurance Director who tests your GMP compliance, formulation science, and pharmacovigilance.',
      avatars: [
        {
          name: 'Dr. Maya Patel',
          title: 'Global Head of Regulatory Affairs & QA AI',
          org: 'Novartis / Pfizer Alum',
          avatarSource: require('../../assets/interviewers/maya.jpg'),
          tone: 'ICH guidelines, CDSCO/USFDA filings, GMP audit compliance, validation',
          style: 'Regulatory & QA/QC Round',
        },
        {
          name: 'David Chen',
          title: 'VP of Formulation & Analytical R&D AI',
          org: 'Sun Pharma / Dr. Reddy’s Laboratories',
          avatarSource: require('../../assets/interviewers/david.jpg'),
          tone: 'HPLC/GC method validation, dissolution profiling, BCS classification',
          style: 'Formulation & Analytical Research',
        },
        {
          name: 'Marcus Sterling',
          title: 'Director of Clinical Trials & Pharmacovigilance AI',
          org: 'IQVIA Global Medical Affairs',
          avatarSource: require('../../assets/interviewers/marcus.jpg'),
          tone: 'ADR causality assessment, GCP guidelines, clinical trial phases & safety',
          style: 'Clinical Research & PV',
        },
      ],
      roles: [
        { id: 0, title: 'Regulatory Affairs & CDSCO / USFDA Compliance', icon: 'file-certificate', badge: 'Regulatory' },
        { id: 1, title: 'Formulation R&D & Quality Assurance (QA/QC)', icon: 'flask', badge: 'Manufacturing / R&D' },
        { id: 2, title: 'Pharmacovigilance & Clinical Trial Associate', icon: 'clipboard-pulse', badge: 'Clinical Research' },
        { id: 3, title: 'Medical Science Liaison & Product Specialist', icon: 'account-tie', badge: 'Medical Affairs' },
      ],
      questions: [
        {
          q: 'Walk me through the ICH Q1A(R2) stability testing protocols for a new oral solid dosage form intended for Zone IVb climatic conditions (Hot and higher humidity). What testing intervals and parameters are mandatory?',
          focus: '25°C/60% RH (Long-term), 30°C/65% RH (Intermediate), 40°C/75% RH (Accelerated), Assay, Dissolution, Degradation products',
        },
        {
          q: 'Explain the Biopharmaceutics Classification System (BCS) and the specific criteria required to grant a biowaiver for a BCS Class 1 vs BCS Class 3 generic formulation.',
          focus: 'Solubility vs Permeability, Dissolution >85% in 15 mins, Gastric transit time, In vitro / In vivo correlation',
        },
        {
          q: 'How do you detect, log, and report a Serious Adverse Event (SAE) during Phase III clinical trials in accordance with Schedule Y / CDSCO guidelines and WHO causality scales?',
          focus: '24-hour initial reporting to DCGI & Ethics Committee, 14-day detailed report, Naranjo / WHO-UMC causality algorithm',
        },
      ],
      rubricMetrics: [
        { label: 'Regulatory & ICH Guideline Mastery', score: '94%', fill: '94%', color: '#10B981' },
        { label: 'Analytical & Quality Assurance Logic', score: '88%', fill: '88%', color: '#F59E0B' },
        { label: 'Pharmacovigilance & Clinical Protocols', score: '90%', fill: '90%', color: '#6366F1' },
      ],
      feedbackTip: '"Outstanding grasp of ICH stability storage parameters and BCS biowaiver requirements. Solid presentation on Pharmacovigilance 24-hour notification timelines."',
    },

    allied_health: {
      name: 'Nursing & Allied Health Sciences',
      heroTitle: 'Clinical Nursing & Patient Care Interview',
      heroDesc: 'Practice with specialized hospital administrators and clinical coordinators for NABH/JCI accredited multi-specialty healthcare and research roles.',
      avatars: [
        {
          name: 'Elena Vance',
          title: 'Chief Clinical Nursing Officer AI',
          org: 'Apollo / Max Healthcare Fellow',
          avatarSource: require('../../assets/interviewers/elena.jpg'),
          tone: 'Patient safety protocols, NABH standards, critical care nursing',
          style: 'Clinical Ward & Critical Care',
        },
        {
          name: 'Marcus Sterling',
          title: 'Hospital Operations & Accreditation Director AI',
          org: 'Fortis / Medanta Healthcare',
          avatarSource: require('../../assets/interviewers/marcus.jpg'),
          tone: 'Infection control, medication safety, clinical audits & emergency triage',
          style: 'Patient Safety & Governance',
        },
      ],
      roles: [
        { id: 0, title: 'Critical Care & ICU Nursing Specialist', icon: 'heart-pulse', badge: 'ICU / Emergency' },
        { id: 1, title: 'Infection Control & NABH Quality Nurse', icon: 'shield-plus', badge: 'Quality Assurance' },
        { id: 2, title: 'Clinical Care Coordinator & Ward In-Charge', icon: 'clipboard-account', badge: 'Hospital Ops' },
      ],
      questions: [
        {
          q: 'Walk me through the 6 International Patient Safety Goals (IPSG) and how you implement two-identifier verification and high-alert medication administration in an intensive care setting.',
          focus: 'Patient Identification, Effective Communication, High-Alert Medications, Safe Surgery, Infection Risk, Fall Prevention',
        },
        {
          q: 'A postoperative patient on IV opioids develops sudden respiratory depression (RR 6/min) and pinpoint pupils. What is your immediate nursing intervention protocol and reversal agent dosage?',
          focus: 'Airway maintenance, Oxygenation, Naloxone titration (0.4mg IV), Vital signs monitoring, Incident documentation',
        },
      ],
      rubricMetrics: [
        { label: 'Patient Safety & Triage Protocols', score: '93%', fill: '93%', color: '#10B981' },
        { label: 'Emergency Nursing & Pharmacology', score: '89%', fill: '89%', color: '#F59E0B' },
        { label: 'NABH / Hospital Quality Compliance', score: '91%', fill: '91%', color: '#6366F1' },
      ],
      feedbackTip: '"Crisp articulation of high-alert medication dual-check protocols and naloxone resuscitation algorithms."',
    },
  };

  const currentProfile = domainData[activeDomain] || domainData.technical;
  const avatars = currentProfile.avatars;
  const roles = currentProfile.roles;
  const questionsList = currentProfile.questions;
  const rubricMetrics = currentProfile.rubricMetrics;
  const feedbackTip = currentProfile.feedbackTip;

  const currentAvatar = avatars[selectedAvatarIndex % avatars.length] || avatars[0];
  const currentRole = roles[selectedRoleIndex % roles.length] || roles[0];
  const currentQ = questionsList[currentQIndex % questionsList.length];

  const handleNextQuestion = () => {
    setInterviewerStatus('speaking');
    setCurrentQIndex(prev => (prev + 1) % questionsList.length);
  };

  const handleToggleSpeak = () => {
    if (interviewerStatus === 'speaking') {
      setInterviewerStatus('listening');
      setIsCandidateRecording(true);
    } else if (interviewerStatus === 'listening') {
      setInterviewerStatus('evaluating');
      setIsCandidateRecording(false);
      setTimeout(() => {
        setInterviewerStatus('speaking');
      }, 1500);
    }
  };

  // Switch domain tabs
  const handleSelectDomain = (domainKey) => {
    setActiveDomain(domainKey);
    setSelectedRoleIndex(0);
    setSelectedAvatarIndex(0);
    setCurrentQIndex(0);
  };

  // =========================================================================
  // VIEW: 1-ON-1 LIVE VIDEO INTERVIEW ROOM (IN-CALL)
  // =========================================================================
  if (inCall) {
    return (
      <View style={[styles.callContainer, { backgroundColor: '#0B0F19' }]}>
        {/* Top Floating Call HUD */}
        <View style={[styles.callHeader, { paddingTop: Math.max(insets.top, 16) }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE 1:1 INTERVIEW</Text>
            </View>
            <View style={styles.timerPill}>
              <Feather name="clock" size={12} color="#94A3B8" />
              <Text style={styles.timerText}>{formatTimer(callDuration)}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setShowScorecard(true)}
              style={styles.scorecardBtn}
            >
              <MaterialCommunityIcons name="chart-box-outline" size={16} color="#A78BFA" />
              <Text style={styles.scorecardBtnText}>Rubric</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setInCall(false)}
              style={styles.exitCallBtn}
            >
              <Feather name="phone-off" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* In-Call Pilot Banner */}
        <View style={styles.inCallPilotBanner}>
          <MaterialIcons name="lock" size={11} color="#FBBF24" />
          <Text style={styles.inCallPilotBannerText}>PILOT DEMO PREVIEW · Interactive live speech evaluation enables post-pilot</Text>
        </View>

        {/* Main Stage: AI Avatar Interviewer Video Stream */}
        <View style={styles.avatarMainStage}>
          {/* Avatar Video Frame */}
          <View style={styles.avatarVideoFrame}>
            <Image
              source={currentAvatar.avatarSource}
              style={styles.avatarVideoImage}
              resizeMode="cover"
            />

            <LinearGradient
              colors={['transparent', 'rgba(11,15,25,0.88)']}
              style={styles.avatarOverlayGradient}
            />

            {/* AI Avatar Tag */}
            <View style={styles.interviewerTag}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="shield-account" size={14} color="#60A5FA" />
                <Text style={styles.interviewerName}>{currentAvatar.name}</Text>
                <View style={styles.verifiedRoleBadge}>
                  <Text style={styles.verifiedRoleText}>AI Interviewer</Text>
                </View>
              </View>
              <Text style={styles.interviewerRole}>{currentAvatar.title} · {currentAvatar.org}</Text>
            </View>

            {/* Live Speaking Status Pill */}
            <View style={styles.statusPillContainer}>
              {interviewerStatus === 'speaking' ? (
                <View style={[styles.statusPill, { backgroundColor: 'rgba(16,185,129,0.9)' }]}>
                  <View style={styles.equalizerRow}>
                    <Animated.View style={[styles.eqBar, { height: Animated.multiply(waveAnim1, 14) }]} />
                    <Animated.View style={[styles.eqBar, { height: Animated.multiply(waveAnim2, 14) }]} />
                    <Animated.View style={[styles.eqBar, { height: Animated.multiply(waveAnim3, 14) }]} />
                  </View>
                  <Text style={styles.statusPillText}>Interviewer Speaking...</Text>
                </View>
              ) : interviewerStatus === 'listening' ? (
                <View style={[styles.statusPill, { backgroundColor: 'rgba(245,158,11,0.9)' }]}>
                  <Feather name="mic" size={12} color="#FFFFFF" />
                  <Text style={styles.statusPillText}>Listening to Candidate...</Text>
                </View>
              ) : (
                <View style={[styles.statusPill, { backgroundColor: 'rgba(99,102,241,0.9)' }]}>
                  <MaterialIcons name="auto-awesome" size={12} color="#FFFFFF" />
                  <Text style={styles.statusPillText}>Evaluating Response...</Text>
                </View>
              )}
            </View>

            {/* Live Stream Status Indicator */}
            <View style={styles.streamEngineBadge}>
              <View style={[styles.streamDot, { backgroundColor: interviewerStatus === 'speaking' ? '#10B981' : '#F59E0B' }]} />
              <Text style={styles.streamEngineText}>
                {interviewerStatus === 'speaking' ? 'LIVE AUDIO ACTIVE' : interviewerStatus === 'listening' ? 'CANDIDATE SPEAKING' : 'ANALYZING RESPONSE'}
              </Text>
            </View>
          </View>

          {/* Picture-in-Picture: Candidate Student Video Feed */}
          <View style={styles.pipContainer}>
            <View style={styles.pipFrame}>
              <SafeStudentAvatar
                uri={getAvatarUrl(user?.avatar_url || user?.name || 'me', user?.rollno || user?.username)}
                rollno={user?.rollno || user?.username}
                name={user?.name || user?.full_name || 'S'}
                style={styles.pipAvatar}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.pipTag}>
                <Text style={styles.pipName} numberOfLines={1}>{user?.name?.split(' ')[0] || 'You'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Ionicons name={isMicMuted ? "mic-off" : "mic"} size={10} color={isMicMuted ? "#EF4444" : "#10B981"} />
                  <Ionicons name={isCamOff ? "videocam-off" : "videocam"} size={10} color={isCamOff ? "#EF4444" : "#10B981"} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Live Question & Subtitle HUD */}
        <View style={styles.questionHUDContainer}>
          <View style={styles.questionHUDCard}>
            <View style={styles.qHeaderRow}>
              <View style={styles.qIndexPill}>
                <Text style={styles.qIndexText}>QUESTION {currentQIndex + 1} OF {questionsList.length}</Text>
              </View>
              <Text style={styles.qRoleCategory}>{currentRole.title}</Text>
            </View>

            <Text style={styles.qLiveText}>"{currentQ.q}"</Text>

            <View style={styles.qKeyPoints}>
              <MaterialCommunityIcons name="target" size={13} color="#FBBF24" />
              <Text style={styles.qKeyPointsText}>Evaluation Rubric: {currentQ.focus}</Text>
            </View>
          </View>
        </View>

        {/* Candidate Typing / Notes Drawer (Collapsible) */}
        {showNotesInput && (
          <View style={styles.notesDrawer}>
            <TextInput
              style={styles.notesInputField}
              placeholder="Type case notes, numbers, or solution framework here..."
              placeholderTextColor="#64748B"
              value={candidateNotes}
              onChangeText={setCandidateNotes}
              multiline
            />
          </View>
        )}

        {/* Bottom Interactive Call Controls */}
        <View style={[styles.callControlsContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Mute Mic Button */}
          <TouchableOpacity
            onPress={() => setIsMicMuted(!isMicMuted)}
            style={[styles.controlBtn, isMicMuted && styles.controlBtnActiveRed]}
          >
            <Ionicons name={isMicMuted ? "mic-off" : "mic"} size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Toggle Camera */}
          <TouchableOpacity
            onPress={() => setIsCamOff(!isCamOff)}
            style={[styles.controlBtn, isCamOff && styles.controlBtnActiveRed]}
          >
            <Ionicons name={isCamOff ? "videocam-off" : "videocam"} size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Primary Action: Speak / Submit Answer */}
          <TouchableOpacity
            onPress={handleToggleSpeak}
            style={[
              styles.mainActionBtn,
              interviewerStatus === 'listening' ? styles.mainActionBtnListening : styles.mainActionBtnDefault
            ]}
          >
            <LinearGradient
              colors={interviewerStatus === 'listening' ? ['#EF4444', '#DC2626'] : ['#5B4BFF', '#4338CA']}
              style={styles.mainActionBtnGradient}
            >
              <MaterialCommunityIcons
                name={interviewerStatus === 'listening' ? "microphone-message" : "microphone"}
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.mainActionBtnText}>
                {interviewerStatus === 'listening' ? 'Finish Speaking' : 'Hold to Answer'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Scratchpad / Notes */}
          <TouchableOpacity
            onPress={() => setShowNotesInput(!showNotesInput)}
            style={[styles.controlBtn, showNotesInput && styles.controlBtnActivePurple]}
          >
            <MaterialCommunityIcons name="note-edit-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Next Question */}
          <TouchableOpacity
            onPress={handleNextQuestion}
            style={styles.controlBtn}
          >
            <Feather name="skip-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Live Scorecard Modal */}
        <Modal
          visible={showScorecard}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowScorecard(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.scorecardModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.scorecardHeader}>
                <View>
                  <Text style={[styles.scorecardTitle, { color: colors.textPrimary }]}>Live AI Interview Rubric</Text>
                  <Text style={[styles.scorecardSub, { color: colors.textSecondary }]}>
                    Candidate: {user?.name || 'Student'} · {user?.course || currentProfile.name}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowScorecard(false)}>
                  <Feather name="x" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.rubricGrid}>
                {rubricMetrics.map((m, idx) => (
                  <View key={idx} style={{ marginBottom: 12 }}>
                    <View style={styles.rubricRow}>
                      <Text style={[styles.rubricLabel, { color: colors.textPrimary }]}>{m.label}</Text>
                      <Text style={[styles.rubricScore, { color: m.color }]}>{m.score}</Text>
                    </View>
                    <View style={styles.rubricProgressBg}>
                      <View style={[styles.rubricProgressFill, { width: m.fill, backgroundColor: m.color }]} />
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => setShowScorecard(false)}
                style={[styles.closeRubricBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.closeRubricBtnText}>Close Rubric</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Full-Screen Transparent Lock Overlay - Blocks interaction with back screen */}
        <View style={styles.transparentLockOverlay}>
          <View style={styles.centerLockCircle}>
            <LinearGradient
              colors={['rgba(91, 75, 255, 0.65)', 'rgba(243, 108, 33, 0.5)']}
              style={styles.centerLockHalo}
            >
              <MaterialIcons name="lock" size={44} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <TouchableOpacity
            style={styles.smallExitBtn}
            onPress={() => setInCall(false)}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={14} color="#FFFFFF" />
            <Text style={styles.smallExitBtnText}>Exit Demo Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // =========================================================================
  // VIEW: PRE-INTERVIEW SETUP & PERSONA SELECTOR
  // =========================================================================
  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          1:1 AI Mock Interview
        </Text>
        <View style={styles.demoHeaderBadge}>
          <MaterialIcons name="lock" size={12} color="#FFFFFF" />
          <Text style={styles.demoHeaderBadgeText}>DEMO PREVIEW</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Domain Selector Pills (Defaults to enrolled course, allows switching) */}
        <View style={styles.domainTabsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.domainTabsScroll}>
            {[
              { key: 'technical', label: 'Tech & MCA/B.Tech', icon: 'laptop' },
              { key: 'business', label: 'MBA / BBA Management', icon: 'chart-line' },
              { key: 'commerce', label: 'B.Com / Accounting', icon: 'cash' },
              { key: 'pharma', label: 'B.Pharm / Pharma', icon: 'flask' },
              { key: 'allied_health', label: 'Nursing & Allied', icon: 'heart-pulse' },
            ].map(tab => {
              const isSelected = activeDomain === tab.key;
              const isEnrolledMatch = detectedDomain === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => handleSelectDomain(tab.key)}
                  style={[
                    styles.domainTabPill,
                    {
                      backgroundColor: isSelected ? colors.primary : (isDark ? colors.card : '#F1F5F9'),
                      borderColor: isSelected ? colors.primary : colors.border,
                    }
                  ]}
                >
                  <MaterialCommunityIcons
                    name={tab.icon}
                    size={14}
                    color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.domainTabText,
                      { color: isSelected ? '#FFFFFF' : colors.textSecondary, fontWeight: isSelected ? '800' : '600' }
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {isEnrolledMatch && (
                    <View style={styles.myCourseDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Hero Banner */}
        <LinearGradient
          colors={isDark ? ['#312E81', '#1E1B4B'] : ['#4338CA', '#312E81']}
          style={styles.heroBanner}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroBadge}>
              <Ionicons name="videocam" size={14} color="#FBBF24" />
              <Text style={styles.heroBadgeText}>1-ON-1 INTERACTIVE SESSION</Text>
            </View>
            <View style={styles.coursePill}>
              <Text style={styles.coursePillText}>
                {user?.course || 'Campus Placement'}
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            {currentProfile.heroTitle}
          </Text>
          <Text style={styles.heroDesc}>
            {currentProfile.heroDesc}
          </Text>
        </LinearGradient>

        {/* 1. Target Role Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            1. Select Target Interview Role
          </Text>
          <View style={styles.rolesGrid}>
            {roles.map((r, idx) => {
              const isSelected = selectedRoleIndex === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedRoleIndex(idx)}
                  style={[
                    styles.roleCard,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    }
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.roleIconBg, { backgroundColor: isSelected ? (isDark ? '#312E81' : '#EEF2FF') : (isDark ? '#1E293B' : '#F1F5F9') }]}>
                      <MaterialCommunityIcons name={r.icon} size={22} color={isSelected ? colors.primary : colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.roleTitle, { color: colors.textPrimary }]}>{r.title}</Text>
                      <Text style={[styles.roleDesc, { color: colors.textSecondary }]}>{r.badge}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. Choose AI Avatar Interviewer */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            2. Choose Executive AI Interviewer
          </Text>
          <View style={{ gap: 12 }}>
            {avatars.map((av, idx) => {
              const isSelected = selectedAvatarIndex === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedAvatarIndex(idx)}
                  style={[
                    styles.avatarSelectCard,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    }
                  ]}
                >
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Image source={av.avatarSource} style={styles.avatarThumb} resizeMode="cover" />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.avatarNameText, { color: colors.textPrimary }]}>{av.name}</Text>
                        <View style={[styles.avatarStyleBadge, { backgroundColor: isSelected ? '#5B4BFF15' : (isDark ? '#1E293B' : '#F1F5F9') }]}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: isSelected ? colors.primary : colors.textSecondary }}>{av.style}</Text>
                        </View>
                      </View>
                      <Text style={[styles.avatarOrgText, { color: colors.primary }]}>{av.title} · {av.org}</Text>
                      <Text style={[styles.avatarToneText, { color: colors.textSecondary }]} numberOfLines={2}>
                        Rubric Focus: {av.tone}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Difficulty Level */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            3. Interview Rigor & Cutoff Level
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {['Standard Campus', 'Day-1 Dream', 'Super Dream Tier-1'].map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setSelectedDifficulty(d)}
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor: selectedDifficulty === d ? colors.primary : (isDark ? colors.card : '#F1F5F9'),
                    borderColor: selectedDifficulty === d ? colors.primary : colors.border,
                  }
                ]}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: selectedDifficulty === d ? '#FFFFFF' : colors.textSecondary }}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pilot Lock Blur Fade Section */}
        <View style={styles.pilotLockWrapper}>
          <LinearGradient
            colors={isDark ? ['rgba(15,23,42,0)', 'rgba(15,23,42,0.85)', 'rgba(15,23,42,0.98)'] : ['rgba(246,248,252,0)', 'rgba(246,248,252,0.85)', 'rgba(246,248,252,0.98)']}
            style={styles.pilotBlurFadeGradient}
          >
            <View style={[styles.pilotLockCard, { backgroundColor: isDark ? 'rgba(30,41,59,0.9)' : '#FFFFFF', borderColor: isDark ? 'rgba(99,102,241,0.3)' : '#E2E8F0' }]}>
              <View style={styles.pilotLockIconRing}>
                <MaterialIcons name="lock" size={24} color="#5B4BFF" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.pilotLockTitle, { color: colors.textPrimary }]}>Feature Locked in Pilot</Text>
                  <View style={styles.pilotBadge}>
                    <Text style={styles.pilotBadgeText}>DEMO UX</Text>
                  </View>
                </View>
                <Text style={[styles.pilotLockSub, { color: colors.textSecondary }]}>
                  AI 1:1 Live Video Evaluation is currently in exclusive preview for demonstration. Full interactive video scoring unlocks post-pilot.
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={[styles.pilotActionBtn, { flex: 1, backgroundColor: colors.primary }]}
                onPress={() => setInCall(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="videocam-outline" size={18} color="#FFFFFF" />
                <Text style={styles.pilotActionBtnText}>Preview Demo Room</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pilotActionBtnOutline, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1' }]}
                onPress={() => setShowPilotLockModal(true)}
                activeOpacity={0.85}
              >
                <Feather name="info" size={16} color={colors.textPrimary} />
                <Text style={[styles.pilotActionBtnTextOutline, { color: colors.textPrimary }]}>Pilot Info</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Pilot Lock Information Modal */}
      <Modal
        visible={showPilotLockModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPilotLockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pilotInfoModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.pilotModalHeaderIcon}>
              <LinearGradient colors={['#5B4BFF', '#312E81']} style={styles.pilotModalHeaderGradient}>
                <MaterialIcons name="lock-clock" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <Text style={[styles.pilotModalHeading, { color: colors.textPrimary }]}>
              🚀 Activates Post-Pilot
            </Text>
            <Text style={[styles.pilotModalSub, { color: colors.textSecondary }]}>
              This 1-on-1 AI Interview room is part of our upcoming Phase-2 university placement rollout. During the current pilot, the complete architecture, personas, and rubric are fully demonstrated.
            </Text>

            <View style={[styles.pilotFeatureList, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }]}>
              <View style={styles.pilotFeatureRow}>
                <MaterialIcons name="check-circle" size={18} color="#10B981" />
                <Text style={[styles.pilotFeatureText, { color: colors.textPrimary }]}>Adaptive Domain Questioning (MBA, B.Tech, B.Com, Pharma)</Text>
              </View>
              <View style={styles.pilotFeatureRow}>
                <MaterialIcons name="check-circle" size={18} color="#10B981" />
                <Text style={[styles.pilotFeatureText, { color: colors.textPrimary }]}>Live Speech & Acoustic Articulation Analysis</Text>
              </View>
              <View style={styles.pilotFeatureRow}>
                <MaterialIcons name="check-circle" size={18} color="#10B981" />
                <Text style={[styles.pilotFeatureText, { color: colors.textPrimary }]}>Direct SWOT Matrix & Rubric Scorecard Synchronization</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.pilotModalCloseBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowPilotLockModal(false)}
            >
              <Text style={styles.pilotModalCloseBtnText}>Understood · Continue Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 16, fontWeight: '800', flex: 1, marginHorizontal: 8 },
  demoHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EA580C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  demoHeaderBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.4 },
  scroll: { padding: 16 },
  domainTabsWrapper: {
    marginBottom: 14,
  },
  domainTabsScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  domainTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  domainTabText: { fontSize: 12 },
  myCourseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  heroBanner: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  coursePill: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  coursePillText: { fontSize: 11, fontWeight: '800', color: '#CBD5E1' },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', marginBottom: 6 },
  heroDesc: { fontSize: 12, color: '#C7D2FE', lineHeight: 18 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12 },
  rolesGrid: { gap: 10 },
  roleCard: {
    borderRadius: 14,
    padding: 14,
  },
  roleIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  roleDesc: { fontSize: 12 },
  avatarSelectCard: {
    borderRadius: 16,
    padding: 14,
  },
  avatarThumb: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#1E293B',
  },
  avatarNameText: { fontSize: 15, fontWeight: '800' },
  avatarOrgText: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  avatarToneText: { fontSize: 11, marginTop: 4, lineHeight: 16 },
  avatarStyleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chipBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  joinCallBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#5B4BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  joinCallBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  joinCallBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },

  // =========================================================================
  // LIVE CALL STYLES
  // =========================================================================
  callContainer: { flex: 1 },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 20,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveText: { fontSize: 10, fontWeight: '900', color: '#EF4444', letterSpacing: 0.5 },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerText: { fontSize: 11, fontWeight: '700', color: '#CBD5E1' },
  scorecardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  scorecardBtnText: { fontSize: 11, fontWeight: '800', color: '#A78BFA' },
  exitCallBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMainStage: {
    flex: 1,
    position: 'relative',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarVideoFrame: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  avatarVideoImage: {
    width: '100%',
    height: '100%',
  },
  avatarOverlayGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  voiceAuraRing: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    width: '70%',
    height: '70%',
    borderRadius: 200,
    borderWidth: 3,
    zIndex: 10,
  },
  interviewerTag: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
  },
  interviewerName: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  interviewerRole: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  verifiedRoleBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedRoleText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  statusPillContainer: {
    position: 'absolute',
    top: 14,
    left: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusPillText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 14,
  },
  eqBar: {
    width: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  pipContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 105,
    height: 145,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  pipFrame: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  pipAvatar: {
    width: '100%',
    height: '100%',
  },
  pipTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pipName: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', flex: 1, marginRight: 2 },

  // Live Question HUD
  questionHUDContainer: {
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  questionHUDCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  qHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  qIndexPill: {
    backgroundColor: '#5B4BFF30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  qIndexText: { fontSize: 10, fontWeight: '900', color: '#A5B4FC', letterSpacing: 0.5 },
  qRoleCategory: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  qLiveText: { fontSize: 13, fontWeight: '700', color: '#F8FAFC', lineHeight: 19 },
  qKeyPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  qKeyPointsText: { fontSize: 11, color: '#FCD34D', flex: 1 },

  notesDrawer: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  notesInputField: {
    color: '#F8FAFC',
    fontSize: 12,
    minHeight: 60,
  },

  // Bottom Controls
  callControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  controlBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  controlBtnActiveRed: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  controlBtnActivePurple: {
    backgroundColor: '#5B4BFF',
    borderColor: '#5B4BFF',
  },
  mainActionBtn: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#5B4BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  mainActionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
  },
  mainActionBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

  // Scorecard Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  scorecardModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    maxHeight: height * 0.75,
  },
  scorecardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  scorecardTitle: { fontSize: 18, fontWeight: '900' },
  scorecardSub: { fontSize: 12, marginTop: 2 },
  rubricGrid: { marginBottom: 16 },
  rubricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rubricLabel: { fontSize: 13, fontWeight: '700' },
  rubricScore: { fontSize: 14, fontWeight: '900' },
  rubricProgressBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  rubricProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  aiFeedbackBox: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  aiFeedbackHeading: { fontSize: 12, fontWeight: '800', marginBottom: 4 },
  aiFeedbackBody: { fontSize: 12, lineHeight: 18 },
  closeRubricBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  closeRubricBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  // Neural Lip-Sync & Motion Stream Engine Styles
  lipSyncOverlay: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  lipSyncVisemeBox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lipVisemeGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.6)',
  },
  lipWaveGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 30,
    paddingHorizontal: 6,
  },
  lipWaveBar: {
    width: 3.5,
    backgroundColor: '#60A5FA',
    borderRadius: 2,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 3,
  },
  streamEngineBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  streamDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  streamEngineText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#E2E8F0',
    letterSpacing: 0.4,
  },

  // Pilot Lock & Blur Fade Styles
  inCallPilotBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  inCallPilotBannerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 0.3,
  },
  pilotLockWrapper: {
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  pilotBlurFadeGradient: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  pilotLockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  pilotLockIconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(91, 75, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pilotLockTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  pilotBadge: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pilotBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  pilotLockSub: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  pilotActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  pilotActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pilotActionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  pilotActionBtnTextOutline: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Pilot Modal
  pilotInfoModalCard: {
    marginHorizontal: 20,
    marginBottom: 'auto',
    marginTop: 'auto',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    alignItems: 'center',
  },
  pilotModalHeaderIcon: {
    marginBottom: 14,
  },
  pilotModalHeaderGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pilotModalHeading: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  pilotModalSub: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  pilotFeatureList: {
    width: '100%',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 18,
  },
  pilotFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pilotFeatureText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  pilotModalCloseBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  pilotModalCloseBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // In-Call Transparent Lock Styles
  transparentLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 15, 25, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    elevation: 999,
  },
  centerLockCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#5B4BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  centerLockHalo: {
    width: 86,
    height: 86,
    borderRadius: 43,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallExitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  smallExitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
