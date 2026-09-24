import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Image, Dimensions, TextInput, KeyboardAvoidingView, Platform, Modal, Linking, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { APP_CONFIG } from '../../config/appConfig';
import { useUser } from '../../context/UserContext';
import { computeSkillGap } from '../../data/aiEngine';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getResults, getCompetencyGaps } from '../../data/apiService';

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
}

function generateTechnicalQuestion(topic, index) {
  const t = topic.toLowerCase();

  // 1. Data Structures & Algorithms
  if (t.includes('data structure') || t.includes('dsa') || t.includes('algorithm')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'What is the average time complexity of searching in a Balanced Binary Search Tree (AVL / Red-Black Tree)?',
        options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
        correct: 1,
      };
    } else {
      return {
        type: 'text',
        question: 'Explain the difference between Dynamic Programming (Memoization vs Tabulation) and Greedy approach with a real-world example.',
        placeholder: 'Discuss overlapping subproblems, optimal substructure, top-down vs bottom-up approaches...',
      };
    }
  }

  // 2. Database & SQL
  if (t.includes('database') || t.includes('sql') || t.includes('dbms')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'Which SQL indexing structure is optimal for range queries (e.g. BETWEEN, >, <)?',
        options: ['Hash Index', 'B-Tree / B+ Tree Index', 'Bitmap Index', 'Inverted Index'],
        correct: 1,
      };
    } else {
      return {
        type: 'text',
        question: 'Explain the 4 ACID properties in database transactions and how Isolation Levels prevent dirty reads and phantom reads.',
        placeholder: 'Detail Atomicity, Consistency, Isolation, Durability and Read Committed vs Serializable...',
      };
    }
  }

  // 3. Object-Oriented Design & Java / Python
  if (t.includes('object-oriented') || t.includes('oop') || t.includes('java') || t.includes('python')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'Which design principle states that software entities should be open for extension but closed for modification?',
        options: ['Single Responsibility Principle (SRP)', 'Open/Closed Principle (OCP)', 'Liskov Substitution Principle (LSP)', 'Dependency Inversion Principle (DIP)'],
        correct: 1,
      };
    } else {
      return {
        type: 'text',
        question: 'Compare Abstract Classes vs Interfaces in modern OOP, explaining when to favor composition over inheritance.',
        placeholder: 'Discuss multiple inheritance, default methods, contract enforcement, and loose coupling...',
      };
    }
  }

  // 4. Cloud & DevOps / Docker
  if (t.includes('cloud') || t.includes('devops') || t.includes('docker') || t.includes('ci/cd')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'What is the primary difference between a Docker container and a traditional Virtual Machine (VM)?',
        options: [
          'Containers virtualize hardware with separate guest OS, while VMs share host kernel',
          'Containers share the host OS kernel and isolate at process level, whereas VMs run a full guest OS on hypervisor',
          'Containers are only for Linux, VMs are only for Windows',
          'Containers cannot have persistent storage volumes'
        ],
        correct: 1,
      };
    } else {
      return {
        type: 'text',
        question: 'Describe a production CI/CD pipeline workflow from GitHub push to automated zero-downtime deployment.',
        placeholder: 'Discuss linting, automated unit/integration tests, Docker build, artifact registry, and rolling deployment...',
      };
    }
  }

  // 5. Full Stack Web & REST / React
  if (t.includes('web') || t.includes('frontend') || t.includes('backend') || t.includes('api') || t.includes('react') || t.includes('full stack')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'In modern REST API architecture, which HTTP status code should be returned when a new resource is successfully created?',
        options: ['200 OK', '201 Created', '204 No Content', '202 Accepted'],
        correct: 1,
      };
    } else {
      return {
        type: 'text',
        question: 'Explain how JWT (JSON Web Token) authentication works and how to mitigate security vulnerabilities like XSS and CSRF.',
        placeholder: 'Discuss header/payload/signature, httpOnly cookies, short-lived access tokens, and refresh token rotation...',
      };
    }
  }

  // 6. Generative AI, RAG & LLM Application Engineering
  if (t.includes('generative ai') || t.includes('rag') || t.includes('llm') || t.includes('prompt engineering') || t.includes('gen ai')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'In a Retrieval-Augmented Generation (RAG) pipeline, which component is primarily responsible for converting user query and knowledge chunks into semantic vector representations?',
        options: [
          'Embedding Model (e.g. text-embedding-3-small / BGE)',
          'Vector Quantizer only',
          'Token Rate Limiter',
          'Prompt Template Interpolator'
        ],
        correct: 0,
      };
    } else {
      return {
        type: 'text',
        question: 'Explain the end-to-end architecture of a production RAG system, including document chunking, vector indexing (HNSW), re-ranking, and hallucination reduction.',
        placeholder: 'Discuss chunk overlap, vector databases (pgvector/Pinecone), cosine similarity vs dot product, cross-encoder re-ranking, and grounded prompt synthesis...',
      };
    }
  }

  // 7. Machine Learning & Deep Learning
  if (t.includes('machine learning') || t.includes('deep learning') || t.includes('ai / ml') || t.includes('data intelligence') || t.includes('pytorch')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'Which technique is specifically designed to mitigate overfitting in Deep Neural Networks by randomly zeroing out neuron activations during training?',
        options: ['Dropout', 'Gradient Clipping', 'Batch Normalization', 'Learning Rate Warmup'],
        correct: 0,
      };
    } else {
      return {
        type: 'text',
        question: 'Explain the trade-offs between Precision, Recall, and F1-score with an example of an imbalanced classification problem (e.g. Fraud Detection).',
        placeholder: 'Discuss False Positives vs False Negatives, ROC-AUC, threshold tuning, and why accuracy alone is deceptive for imbalanced datasets...',
      };
    }
  }

  // 8. Vector Databases & Search
  if (t.includes('vector') || t.includes('embeddings')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'Which approximate nearest neighbor (ANN) graph algorithm is widely used in high-performance Vector Databases like Pinecone and pgvector for fast vector search?',
        options: ['HNSW (Hierarchical Navigable Small World)', 'Dijkstra Shortest Path', 'Kruskal Algorithm', 'Floyd-Warshall'],
        correct: 0,
      };
    } else {
      return {
        type: 'text',
        question: 'Explain the difference between Exact kNN and Approximate Nearest Neighbors (ANN) in vector search and how index dimensionality affects query latency.',
        placeholder: 'Discuss distance metrics (Cosine vs Euclidean vs Dot Product), memory trade-offs, IVF-PQ indexing, and metadata filtering...',
      };
    }
  }

  // 9. System Design
  if (t.includes('system design') || t.includes('architecture') || t.includes('microservices')) {
    if (index % 2 === 0) {
      return {
        type: 'mcq',
        question: 'Which caching strategy loads data into cache on-demand only when a cache miss occurs in the application?',
        options: ['Write-Through', 'Write-Back', 'Cache-Aside (Lazy Loading)', 'Refresh-Ahead'],
        correct: 2,
      };
    } else {
      return {
        type: 'text',
        question: 'Design a high-level architecture for a URL shortening service (like Bitly) to handle 100M daily active requests.',
        placeholder: 'Discuss hashing/Base62 encoding, database schema, caching with Redis, load balancer, and rate limiting...',
      };
    }
  }

  // 10. General Technical Default
  if (index % 2 === 0) {
    return {
      type: 'mcq',
      question: `Which architectural pattern or best practice is fundamental to modern production engineering in ${topic}?`,
      options: [
        'Modular separation of concerns with clean APIs',
        'Monolithic tight coupling without version control',
        'Unbounded in-memory state without persistence',
        'Direct hardcoding of credentials in source code'
      ],
      correct: 0,
    };
  } else {
    return {
      type: 'text',
      question: `Explain how you would apply ${topic} in building a scalable production software application.`,
      placeholder: `Discuss real-world use cases, trade-offs, performance optimization, and industry tooling for ${topic}...`,
    };
  }
}

function generateDomainQuestion(topic, index, course = '') {
  const t = topic.toLowerCase();
  const c = course.toLowerCase();

  // MBA / Management / Strategy / Marketing
  if (c.includes('mba') || c.includes('bba') || c.includes('management') || t.includes('strategy') || t.includes('marketing') || t.includes('consulting') || t.includes('product')) {
    if (t.includes('valuation') || t.includes('finance') || t.includes('dcf') || t.includes('investment')) {
      return index % 2 === 0 ? {
        type: 'mcq',
        question: 'Which discount rate is most appropriate when conducting a Discounted Cash Flow (DCF) valuation to estimate Firm Enterprise Value using Free Cash Flow to Firm (FCFF)?',
        options: ['Cost of Equity (Ke)', 'Weighted Average Cost of Capital (WACC)', 'Risk-Free Treasury Rate only', 'Post-tax Cost of Debt (Kd)'],
        correct: 1,
      } : {
        type: 'text',
        question: 'Explain how you would value a fast-growing SaaS startup with negative EBITDA but high Net Revenue Retention (NRR) of 125%.',
        placeholder: 'Discuss EV/ARR multiples, cohort retention analysis, unit economics (CAC Payback), and path to profitability...',
      };
    }
    if (t.includes('marketing') || t.includes('brand') || t.includes('growth') || t.includes('cac')) {
      return index % 2 === 0 ? {
        type: 'mcq',
        question: 'Which metric best represents the ratio of long-term customer value to the cost incurred in acquiring that customer in unit economics?',
        options: ['LTV : CAC Ratio', 'Return on Ad Spend (ROAS)', 'Burn Multiple', 'Gross Merchandise Value (GMV)'],
        correct: 0,
      } : {
        type: 'text',
        question: 'Describe a structured Go-To-Market (GTM) strategy for launching a new enterprise B2B product in an existing competitive market.',
        placeholder: 'Discuss ideal customer profile (ICP), value proposition, pricing tiers, sales motion, and channel distribution...',
      };
    }
    // Default Strategy / Case
    return index % 2 === 0 ? {
      type: 'mcq',
      question: 'Which problem-solving framework emphasizes that problem breakdowns must be Mutually Exclusive and Collectively Exhaustive?',
      options: ['SWOT Framework', 'MECE Framework', 'Ansoff Matrix', 'Porter’s Five Forces'],
      correct: 1,
    } : {
      type: 'text',
      question: `Walk through a structured framework to solve a profitability decline in ${topic}.`,
      placeholder: 'Break down revenue streams, fixed vs variable costs, market dynamics, and actionable turnaround recommendations...',
    };
  }

  // Commerce / B.Com / Accounting / Tax / Audit
  if (c.includes('com') || c.includes('accounting') || c.includes('tax') || t.includes('audit') || t.includes('financial') || t.includes('tax')) {
    if (t.includes('audit') || t.includes('statutory') || t.includes('compliance')) {
      return index % 2 === 0 ? {
        type: 'mcq',
        question: 'Which of the following is considered the primary responsibility of a Statutory Auditor under the Companies Act?',
        options: [
          'To detect each and every minor employee fraud',
          'To express an independent true and fair opinion on financial statements',
          'To maximize company stock price and dividend payouts',
          'To prepare daily journal entries for the management'
        ],
        correct: 1,
      } : {
        type: 'text',
        question: 'Explain the 5-step model of Revenue Recognition under Ind AS 115 / IFRS 15.',
        placeholder: 'Detail contract identification, performance obligations, transaction price, allocation, and recognition timing...',
      };
    }
    // Financial Statements & Ratios
    return index % 2 === 0 ? {
      type: 'mcq',
      question: 'When a company purchases machinery for cash, how is this transaction classified in the Statement of Cash Flows?',
      options: ['Operating Activity', 'Investing Activity (Cash Outflow)', 'Financing Activity', 'Non-cash Investing Activity'],
      correct: 1,
    } : {
      type: 'text',
      question: `Explain how changes in working capital and depreciation affect ${topic} across financial statements.`,
      placeholder: 'Discuss Income Statement impacts, Balance Sheet working capital movements, and Cash Flow reconciliation...',
    };
  }

  // Pharmacy / B.Pharm / Clinical Research
  if (c.includes('pharm') || t.includes('pharma') || t.includes('regulatory') || t.includes('formulation')) {
    if (t.includes('regulatory') || t.includes('ich') || t.includes('cdsco') || t.includes('gmp')) {
      return index % 2 === 0 ? {
        type: 'mcq',
        question: 'Under ICH Q1A guidelines, what are the standard accelerated stability testing conditions for pharmaceutical dosage forms?',
        options: ['25°C ± 2°C / 60% RH', '30°C ± 2°C / 65% RH', '40°C ± 2°C / 75% RH', '50°C ± 2°C / 80% RH'],
        correct: 2,
      } : {
        type: 'text',
        question: 'Explain the Biopharmaceutics Classification System (BCS) and the criteria required to obtain a Biowaiver.',
        placeholder: 'Discuss high/low solubility and permeability thresholds, dissolution testing in pH 1.2, 4.5, 6.8, and bioequivalence...',
      };
    }
    return index % 2 === 0 ? {
      type: 'mcq',
      question: 'In Pharmacovigilance, what is the mandatory timeline for notifying regulatory authorities (CDSCO/DCGI) of an unexpected Serious Adverse Reaction (ADR)?',
      options: ['Within 24 hours / 15 calendar days', 'Within 60 calendar days', 'At annual review only', 'Within 6 months'],
      correct: 0,
    } : {
      type: 'text',
      question: `Describe the quality assurance protocols and testing parameters for ${topic}.`,
      placeholder: 'Discuss assay determination, dissolution profile, impurity profiling, and GMP validation steps...',
    };
  }

  // Default Domain Question
  return index % 2 === 0 ? {
    type: 'mcq',
    question: `Which fundamental principle is central to professional execution in ${topic}?`,
    options: ['Standardized Process & Quality Control', 'Ad-hoc Execution without metrics', 'Unmonitored Risk Allocation', 'Ignoring Regulatory Standards'],
    correct: 0,
  } : {
    type: 'text',
    question: `Explain the practical application and key performance metrics associated with ${topic} in modern industry.`,
    placeholder: `Discuss real-world scenarios, analytical frameworks, and decision-making best practices for ${topic}...`,
  };
}

function generateGitHubCodeQuestion(topic, index) {
  const t = topic.toLowerCase();
  if (t.includes('gen ai') || t.includes('rag') || t.includes('llm') || t.includes('vector')) {
    return index % 2 === 0 ? {
      type: 'mcq',
      question: 'In Python RAG pipelines (LangChain / LlamaIndex), which method is used to mitigate context loss when splitting large text documents?',
      options: ['RecursiveCharacterTextSplitter with chunk_overlap', 'Arbitrary whitespace splitting', 'Stripping all punctuation', 'Hashing document IDs only'],
      correct: 0,
    } : {
      type: 'text',
      question: 'Provide a code architecture or pseudo-code outline for setting up an async vector search query with pgvector / Pinecone with metadata filtering.',
      placeholder: 'Include embedding generation, vector similarity search query, threshold filtering, and returning top-k grounded chunks...',
    };
  }

  if (t.includes('data structure') || t.includes('algorithm') || t.includes('dsa')) {
    return index % 2 === 0 ? {
      type: 'mcq',
      question: 'Which data structure is optimal to implement an LRU (Least Recently Used) Cache with O(1) get and put time complexity?',
      options: ['Array + Binary Search', 'Doubly Linked List + Hash Map', 'Min-Heap', 'Red-Black Tree'],
      correct: 1,
    } : {
      type: 'text',
      question: 'Write or outline a clean algorithm to detect a cycle in a Directed Graph using Depth First Search (DFS) or Kahn’s Algorithm (Topological Sort).',
      placeholder: 'Explain state tracking (visited, in-recursion-stack) or in-degree array logic with time/space complexity...',
    };
  }

  return index % 2 === 0 ? {
    type: 'mcq',
    question: `When committing production code for ${topic} to a GitHub repository, what is the best practice for managing environment variables and secrets?`,
    options: [
      'Store in .env and add to .gitignore, injecting via GitHub Secrets / Cloud Secret Manager',
      'Hardcode API keys directly into public git commits',
      'Commit secrets in plaintext inside README.md',
      'Disable version control for all source files'
    ],
    correct: 0,
  } : {
    type: 'text',
    question: `Describe the repository structure, unit testing strategy, and clean code practices you employ when building a production project in ${topic}.`,
    placeholder: 'Discuss folder structure, dependency management, automated GitHub Actions CI tests, and documentation standards...',
  };
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
  const [testMode, setTestMode] = useState(null); // 'skills', 'github' / 'case_study', or 'comprehensive'
  const [showPilotLockModal, setShowPilotLockModal] = useState(false);
  const micAnim = useRef(new Animated.Value(1)).current;

  const { user, updateSkillScore, accessToken } = useUser();
  const isMed = user && (
    user.course?.replace(/\./g, '').toLowerCase().includes('mbbs') ||
    user.course?.replace(/\./g, '').toLowerCase().includes('bds') ||
    user.course?.toLowerCase().includes('medicine') ||
    user.category?.toLowerCase().includes('medical')
  );

  const [academicResults, setAcademicResults] = useState([]);
  const [erpCompetencies, setErpCompetencies] = useState(null);

  useEffect(() => {
    if (!accessToken) return;
    getResults(accessToken)
      .then(data => { if (data && data.length > 0) setAcademicResults(data); })
      .catch(() => {});
    getCompetencyGaps(accessToken)
      .then(data => { if (data) setErpCompetencies(data); })
      .catch(() => {});
  }, [accessToken]);

  const gapData = React.useMemo(() => {
    if (!user) return { expectedSkills: ['DSA', 'System Design'], missingSkills: ['DSA', 'System Design'], isTechnical: true };
    return computeSkillGap(user, academicResults, erpCompetencies);
  }, [user, academicResults, erpCompetencies]);

  const isTech = Boolean(gapData?.isTechnical);
  
  // Topic selection based on pure skills & github repos
  let topicsSource = gapData.missingSkills || [];
  let fallbackSource = gapData.expectedSkills || [];

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

    if (testMode === 'github') {
      const q = generateGitHubCodeQuestion(topic, index);
      return {
        id: index + 1,
        topic: topic,
        ...q
      };
    }

    if (isTech) {
      const q = generateTechnicalQuestion(topic, index);
      return {
        id: index + 1,
        topic: topic,
        ...q
      };
    }

    // Non-Technical (MBA, BBA, B.Com, B.Pharm)
    const q = generateDomainQuestion(topic, index, user?.course || '');
    return {
      id: index + 1,
      topic: topic,
      ...q
    };
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

        <View style={styles.nonScrollContent}>
          <View style={{ alignItems: 'center' }}>
            <View style={styles.compactHeroIconBox}>
              <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.compactHeroIconGradient}>
                <MaterialCommunityIcons name="brain" size={24} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <Text style={[styles.compactTitle, { color: colors.textPrimary }]}>{isMed ? 'Choose Competency Target' : 'Choose Assessment Target'}</Text>
            <Text style={[styles.compactSubtitle, { color: colors.textSecondary }]}>
              {isMed ? 'Select the clinical focus area to evaluate' : 'Select the focus area to evaluate your performance'}
            </Text>
          </View>

          <View style={{ gap: 8, flex: 1, justifyContent: 'center' }}>
            {/* Card 1: Missing Tech/Domain Skills Diagnostic */}
            <TouchableOpacity
              style={[styles.compactTargetCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setTestMode('skills')}
              activeOpacity={0.7}
            >
              <View style={[styles.targetCardIconBox, { backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : '#EFF6FF' }]}>
                <MaterialCommunityIcons name={isMed ? "stethoscope" : isTech ? "robot" : "briefcase-outline"} size={22} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.targetCardTitle, { color: colors.textPrimary }]}>
                  {isMed ? 'Prof Theory Syllabus' : isTech ? 'Must-Have Tech Skills' : 'Essential Course Skills'}
                </Text>
                <Text style={[styles.targetCardSub, { color: colors.textSecondary }]} numberOfLines={2}>
                  {isMed 
                    ? 'Brush up on professional MBBS/BDS subjects to improve exam grades.' 
                    : isTech 
                      ? 'Evaluate missing modern engineering skills (Gen AI, RAG, ML, Vector DBs, Cloud & Full Stack).' 
                      : `Evaluate essential domain skills for ${user?.course || 'your course'} to bridge skill gaps.`
                  }
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Card 2: GitHub Code / Case Study / Clinical Competency */}
            <TouchableOpacity
              style={[styles.compactTargetCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setTestMode(isTech ? 'github' : 'case_study')}
              activeOpacity={0.7}
            >
              <View style={[styles.targetCardIconBox, { backgroundColor: isDark ? 'rgba(124,58,237,0.12)' : '#F5F3FF' }]}>
                <MaterialCommunityIcons name={isMed ? "hospital-box" : isTech ? "github" : "file-document-edit-outline"} size={22} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.targetCardTitle, { color: colors.textPrimary }]}>
                  {isMed ? 'Clinical Competency' : isTech ? 'GitHub Code & Repo Review' : 'Applied Case & Scenarios'}
                </Text>
                <Text style={[styles.targetCardSub, { color: colors.textSecondary }]} numberOfLines={2}>
                  {isMed 
                    ? 'Evaluate bedside clinical procedures, diagnosis methods, and practical skills.' 
                    : isTech 
                      ? 'Review practical code architecture, algorithms, and real implementation from your GitHub repos.' 
                      : 'Test situational problem solving, domain calculations, and real-world case teardowns.'
                  }
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Card 3: Full Placement Readiness Diagnostic */}
            <TouchableOpacity
              style={[styles.compactTargetCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setTestMode('comprehensive')}
              activeOpacity={0.7}
            >
              <View style={[styles.targetCardIconBox, { backgroundColor: isDark ? 'rgba(234,88,12,0.12)' : '#FFF7ED' }]}>
                <Feather name="compass" size={22} color="#EA580C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.targetCardTitle, { color: colors.textPrimary }]}>
                  {isMed ? 'Comprehensive Clinical Test' : isTech ? 'Full Tech Placement Diagnostic' : 'Comprehensive Career Assessment'}
                </Text>
                <Text style={[styles.targetCardSub, { color: colors.textSecondary }]} numberOfLines={2}>
                  {isMed 
                    ? 'A balanced mixture of professional theory and clinical skills.' 
                    : isTech 
                      ? 'Complete technical diagnostic combining core algorithms, system design, and verified code practices.' 
                      : 'Complete evaluation combining core domain theory and real-world professional case studies.'
                  }
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!testStarted) {
    const modeLabel = isMed
      ? (testMode === 'skills' ? 'Prof Theory' : testMode === 'case_study' ? 'Clinical Competency' : 'Comprehensive')
      : isTech
        ? (testMode === 'skills' ? 'Must-Have Tech Skills' : testMode === 'github' ? 'GitHub Code Review' : 'Full Tech Placement')
        : (testMode === 'skills' ? 'Essential Course Skills' : testMode === 'case_study' ? 'Applied Case Study' : 'Comprehensive Career');
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setTestMode(null)} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{modeLabel} Evaluation</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.preTestViewport}>
          <View style={{ alignItems: 'center' }}>
            <View style={styles.heroIconBox}>
              <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.heroIconGradient}>
                <MaterialCommunityIcons 
                  name={
                    testMode === 'skills' 
                      ? (isMed ? "stethoscope" : isTech ? "robot" : "briefcase-outline") 
                      : testMode === 'github' 
                        ? "github" 
                        : testMode === 'case_study' 
                          ? "file-document-edit-outline" 
                          : "compass"
                  } 
                  size={32} 
                  color="#FFFFFF" 
                />
              </LinearGradient>
            </View>

            <Text style={[styles.preTestTitle, { color: colors.textPrimary }]}>{isMed ? `${modeLabel} Evaluation` : `${modeLabel} Assessment`}</Text>
            <Text style={[styles.preTestSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
              {topicsSource.length > 0 
                ? `Evaluates proficiency in: ${topicsSource.slice(0, 3).join(', ')} to bridge identified gaps.`
                : `Evaluates proficiency in standard topics: ${fallbackSource.slice(0, 3).join(', ')}.`
              }
            </Text>
          </View>

          <View style={styles.compactInfoGrid}>
            <View style={[styles.compactInfoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="timer-outline" size={20} color="#EA580C" />
              <Text style={[styles.compactInfoVal, { color: colors.textPrimary }]}>{questions.length * 10} Mins</Text>
              <Text style={[styles.compactInfoLabel, { color: colors.textSecondary }]}>Duration</Text>
            </View>
            <View style={[styles.compactInfoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="microphone-outline" size={20} color="#4338CA" />
              <Text style={[styles.compactInfoVal, { color: colors.textPrimary }]}>Voice</Text>
              <Text style={[styles.compactInfoLabel, { color: colors.textSecondary }]}>Supported</Text>
            </View>
          </View>

          <View style={styles.compactFeatures}>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={15} color="#10B981" />
              <Text style={[styles.compactFeatureText, { color: colors.textSecondary }]}>{isMed ? 'Adaptive questions based on syllabus' : 'Adaptive syllabus questions'}</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={15} color="#10B981" />
              <Text style={[styles.compactFeatureText, { color: colors.textSecondary }]}>{isMed ? 'Mixed MCQ & clinical case scenarios' : 'Mixed MCQ and design problems'}</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={15} color="#10B981" />
              <Text style={[styles.compactFeatureText, { color: colors.textSecondary }]}>Updates your placement SWOT matrix</Text>
            </View>
          </View>

          {/* Pilot Lock Blur Fade Card */}
          <View style={styles.pilotLockWrapper}>
            <LinearGradient
              colors={isDark ? ['rgba(15,23,42,0.92)', 'rgba(15,23,42,0.98)'] : ['rgba(246,248,252,0.92)', 'rgba(246,248,252,0.98)']}
              style={styles.pilotBlurFadeGradient}
            >
              <View style={[styles.pilotLockCard, { backgroundColor: isDark ? 'rgba(30,41,59,0.9)' : '#FFFFFF', borderColor: isDark ? 'rgba(234,88,12,0.3)' : '#E2E8F0' }]}>
                <View style={styles.pilotLockIconRing}>
                  <MaterialIcons name="lock" size={20} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.pilotLockTitle, { color: colors.textPrimary }]}>Feature Locked in Pilot</Text>
                    <View style={styles.pilotBadge}>
                      <Text style={styles.pilotBadgeText}>DEMO PREVIEW</Text>
                    </View>
                  </View>
                  <Text style={[styles.pilotLockSub, { color: colors.textSecondary }]} numberOfLines={2}>
                    AI Adaptive Skill Testing and SWOT sync are locked during pilot. Unlocks post-pilot.
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity
                  style={[styles.pilotActionBtn, { flex: 1, backgroundColor: '#EA580C' }]}
                  onPress={() => setTestStarted(true)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="play-circle-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.pilotActionBtnText}>Preview Demo Test</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pilotActionBtnOutline, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1' }]}
                  onPress={() => setShowPilotLockModal(true)}
                  activeOpacity={0.85}
                >
                  <Feather name="info" size={14} color={colors.textPrimary} />
                  <Text style={[styles.pilotActionBtnTextOutline, { color: colors.textPrimary }]}>Pilot Info</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>

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
                <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.pilotModalHeaderGradient}>
                  <MaterialIcons name="lock-clock" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>

              <Text style={[styles.pilotModalHeading, { color: colors.textPrimary }]}>
                🚀 Activates Post-Pilot
              </Text>
              <Text style={[styles.pilotModalSub, { color: colors.textSecondary }]}>
                AI Adaptive Skill Testing and Automated SWOT Score Synchronization are part of our upcoming Phase-2 university rollout. You are previewing the full adaptive question bank and multi-domain evaluation curriculum.
              </Text>

              <View style={[styles.pilotFeatureList, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }]}>
                <View style={styles.pilotFeatureRow}>
                  <MaterialIcons name="check-circle" size={18} color="#10B981" />
                  <Text style={[styles.pilotFeatureText, { color: colors.textPrimary }]}>Multi-Domain Adaptive Assessment (Tech, Management, Commerce, Pharma)</Text>
                </View>
                <View style={styles.pilotFeatureRow}>
                  <MaterialIcons name="check-circle" size={18} color="#10B981" />
                  <Text style={[styles.pilotFeatureText, { color: colors.textPrimary }]}>Integrated Speech-to-Text & Open-Ended Logic Grading</Text>
                </View>
                <View style={styles.pilotFeatureRow}>
                  <MaterialIcons name="check-circle" size={18} color="#10B981" />
                  <Text style={[styles.pilotFeatureText, { color: colors.textPrimary }]}>Automatic SWOT Matrix & Placement Shortlist Recommendation Updates</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.pilotModalCloseBtn, { backgroundColor: '#EA580C' }]}
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
                : isTech
                  ? "Great job! Your answers demonstrate solid grasp of core technical architecture, algorithms, and practical repository implementation. Your verified scores have been updated in your Placement Readiness SWOT."
                  : "Great job! Your applied domain reasoning and situational case breakdown was impressive. Your verified scores have been updated in your Placement Readiness profile."}
            </Text>
            
            <View style={styles.gapItem}>
              <Text style={[styles.gapTitle, { color: colors.textPrimary }]}>Recommended Next Steps:</Text>
              <Text style={[styles.gapAction, { color: colors.textSecondary }]}>
                {isMed 
                  ? `• Focus on clinical postings and bedside presentations on ${APP_CONFIG.UNIVERSITY_SHORT_NAME} Portal.`
                  : isTech
                    ? `• Practice 2 LeetCode problems daily and build practical full-stack/AI repositories.`
                    : `• Practice more structured MECE case studies and financial modeling scenarios.`}
              </Text>
              <Text style={[styles.gapAction, { color: colors.textSecondary }]}>
                {isMed 
                  ? "• Participate in standard OSCE/OSPE practical clinical drills."
                  : isTech
                    ? "• Take a 1-on-1 AI Mock Interview to practice technical system design under live pressure."
                    : "• Take a 1-on-1 AI Mock Interview to practice executive presence and case interviews."}
              </Text>

              {/* Direct Practice & Curated Links */}
              <View style={{ marginTop: 14, gap: 8 }}>
                {isTech ? (
                  <>
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        backgroundColor: isDark ? 'rgba(234,88,12,0.15)' : '#FFF7ED',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(234,88,12,0.35)' : '#FED7AA',
                      }}
                      onPress={() => Linking.openURL('https://leetcode.com/studyplan/top-interview-150/').catch(() => {})}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="code-tags" size={18} color="#EA580C" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>Practice LeetCode Top 150 (DSA)</Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>Curated must-solve problems for tech interviews</Text>
                      </View>
                      <MaterialCommunityIcons name="open-in-new" size={16} color="#EA580C" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : '#EFF6FF',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(59,130,246,0.25)' : '#DBEAFE',
                      }}
                      onPress={() => Linking.openURL('https://leetcode.com/studyplan/top-sql-50/').catch(() => {})}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="database-outline" size={18} color="#3B82F6" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>LeetCode SQL 50 Study Plan</Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>Essential query optimization for DBMS rounds</Text>
                      </View>
                      <MaterialCommunityIcons name="open-in-new" size={16} color="#3B82F6" />
                    </TouchableOpacity>
                  </>
                ) : !isMed ? (
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#ECFDF5',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(16,185,129,0.25)' : '#D1FAE5',
                    }}
                    onPress={() => Linking.openURL('https://www.nism.ac.in/certifications/').catch(() => {})}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="certificate-outline" size={18} color="#10B981" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>NISM Industry Certifications</Text>
                      <Text style={{ fontSize: 11, color: colors.textSecondary }}>Financial Markets & Equity Analysis credentials</Text>
                    </View>
                    <MaterialCommunityIcons name="open-in-new" size={16} color="#10B981" />
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: isDark ? 'rgba(91,75,255,0.12)' : '#EEF2FF',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(91,75,255,0.25)' : '#E0E7FF',
                  }}
                  onPress={() => navigation.navigate('MockInterview')}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="microphone" size={18} color="#5B4BFF" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>Start 1-on-1 AI Mock Interview</Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>Practice live verbal & technical answers under pressure</Text>
                  </View>
                  <Feather name="arrow-right" size={16} color="#5B4BFF" />
                </TouchableOpacity>
              </View>
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

        <View style={styles.qViewportContainer}>
          <View>
            <Text style={[styles.topicText, { color: '#EA580C' }]}>{q.topic}</Text>
            <Text style={[styles.questionText, { color: colors.textPrimary }]}>{q.question}</Text>
          </View>
          
          {q.type === 'mcq' ? (
            <View style={styles.optionsContainer}>
              {q.options.map((opt, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.optionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleAnswer(i)}
                  activeOpacity={0.7}
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
                      size={24} 
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
        </View>

        {/* Full-Screen Transparent Lock Overlay - Blocks interaction with back screen */}
        <View style={styles.transparentLockOverlay}>
          <View style={styles.centerLockCircle}>
            <LinearGradient
              colors={['rgba(234, 88, 12, 0.65)', 'rgba(154, 52, 18, 0.5)']}
              style={styles.centerLockHalo}
            >
              <MaterialIcons name="lock" size={44} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <TouchableOpacity
            style={styles.smallExitBtn}
            onPress={() => setTestStarted(false)}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={14} color="#FFFFFF" />
            <Text style={styles.smallExitBtnText}>Exit Test</Text>
          </TouchableOpacity>
        </View>
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

  // Non-scrolling Viewport Styles
  nonScrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  compactHeroIconBox: {
    marginBottom: 8,
  },
  compactHeroIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  compactSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 8,
  },
  compactTargetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  targetCardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  targetCardSub: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },

  // Pre-test Viewport
  preTestViewport: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  preTestTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 2,
  },
  preTestSubtitle: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 10,
  },
  compactInfoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  compactInfoCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  compactInfoVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  compactInfoLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  compactFeatures: {
    gap: 6,
    marginBottom: 8,
  },
  compactFeatureText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Live Questions Viewport
  qViewportContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },

  // Pilot Lock & Blur Fade Styles
  pilotLockWrapper: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  pilotBlurFadeGradient: {
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.25)',
  },
  pilotLockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  pilotLockIconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
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
    paddingVertical: 13,
    borderRadius: 14,
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
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  pilotActionBtnTextOutline: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pilotInfoModalCard: {
    width: '100%',
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
    shadowColor: '#EA580C',
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

export default SkillGapTestScreen;
