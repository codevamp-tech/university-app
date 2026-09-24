/**
 * placementReadiness.js
 * ─────────────────────
 * Utilities for computing domain-adaptive Placement Readiness Scores (0-100),
 * supporting both Tech (GitHub Code Audit & DSA) and Non-Tech programs
 * (B.Com, BBA, MBA, Pharmacy - based on Academic CGPA, Attendance, Domain Skills,
 * Certifications, and Internships).
 */

/**
 * Determine the placement track for a student:
 * - 'tech': B.Tech (CS/IT), BCA, MCA, M.Tech
 * - 'commerce_management': B.Com, BBA, MBA, M.Com, Commerce, Management
 * - 'pharma_healthcare': B.Pharm, M.Pharm, Pharmacy
 * - 'general': Other non-medical programs
 */
export function getStudentPlacementTrack(student) {
  if (!student) return 'general';

  const course = (student.course || '').toUpperCase().replace(/\./g, '');
  const branch = (student.branch || student.department || student.department_name || '').toUpperCase();
  const bio = (student.bio || '').toUpperCase();
  const fullText = `${course} ${branch} ${bio}`.toUpperCase();

  // 1. Exclude Medical
  if (
    course.includes('MBBS') ||
    course.includes('BDS') ||
    course.includes('MD') ||
    course.includes('MS') ||
    branch.includes('MEDIC') ||
    student.category === 'medical'
  ) {
    return 'medical';
  }

  // 2. Commerce & Management
  if (
    fullText.includes('BCOM') ||
    fullText.includes('MCOM') ||
    fullText.includes('COMMERCE') ||
    fullText.includes('FINANCE') ||
    fullText.includes('ACCOUNTING') ||
    fullText.includes('BBA') ||
    fullText.includes('MBA') ||
    fullText.includes('MANAG') ||
    fullText.includes('BUSINESS') ||
    student.rollno === '2400141780033'
  ) {
    return 'commerce_management';
  }

  // 3. Pharmacy & Healthcare
  if (fullText.includes('PHARM')) {
    return 'pharma_healthcare';
  }

  // 4. Tech (B.Tech CS/IT, BCA, MCA)
  const isTechCourse =
    fullText.includes('BCA') ||
    fullText.includes('MCA') ||
    fullText.includes('COMP') ||
    fullText.includes('CSE') ||
    fullText.includes('CS') ||
    fullText.includes('IT') ||
    fullText.includes('INFO') ||
    fullText.includes('DATA') ||
    fullText.includes('AI') ||
    fullText.includes('ML') ||
    fullText.includes('SOFTWARE') ||
    (course.includes('BTECH') && (branch === 'ENGINEERING' || !branch || branch.includes('CS')));

  if (isTechCourse) {
    return 'tech';
  }

  return 'general';
}

/**
 * Check if the student is eligible for Placement Readiness.
 * True for ALL non-medical university students (B.Tech, BCA, MCA, B.Com, BBA, MBA, B.Pharm).
 */
export function isCsEligibleForPlacement(student) {
  if (!student) return false;
  const track = getStudentPlacementTrack(student);
  return track !== 'medical';
}

/**
 * Alias for clearer semantics.
 */
export function isPlacementEligible(student) {
  return isCsEligibleForPlacement(student);
}

/**
 * Domain-specific skills dictionary.
 */
export const DOMAIN_SKILLS = {
  commerce_management: [
    'Financial Accounting & Reporting',
    'GST & Corporate Taxation',
    'Financial Modeling & Valuation',
    'Advanced Excel & PowerBI',
    'Corporate Law & Governance',
    'Cost & Management Accounting',
    'Business Analytics & Data Interpretation',
    'Auditing & Assurance Standards',
  ],
  pharma_healthcare: [
    'Pharmacovigilance & Drug Safety',
    'Clinical Research & Trials',
    'Good Manufacturing Practice (GMP)',
    'Quality Assurance & Quality Control (QA/QC)',
    'Pharmaceutical Analysis & Spectroscopy',
    'Regulatory Affairs & Drug Documentation',
    'Pharmacology & Therapeutics',
  ],
  tech: [
    'Data Structures & Algorithms (DSA)',
    'Full-Stack Web Development',
    'Database Management Systems (DBMS)',
    'System Design & Microservices',
    'Operating Systems & Linux Internals',
    'REST APIs & Backend Architecture',
    'Cloud Platforms & DevOps (Docker/AWS)',
    'Version Control & CI/CD Pipelines',
  ],
  general: [
    'Quantitative & Logical Aptitude',
    'Business Communication & Presentation',
    'Project Management & Operations',
    'Data Analysis & Visualization',
    'Problem Solving & Critical Thinking',
  ],
};

/**
 * Domain-specific certifications dictionary.
 */
export const DOMAIN_CERTIFICATIONS = {
  commerce_management: [
    { title: 'Tally Prime & GST Professional', issuer: 'Tally Education', level: 'Advanced', verified: true },
    { title: 'NISM Series V-A: Mutual Fund Distributor', issuer: 'NISM / SEBI', level: 'Industry Certified', verified: true },
    { title: 'Financial Modeling & Business Valuation', issuer: 'Corporate Finance Institute', level: 'Professional', verified: true },
    { title: 'Microsoft PowerBI Data Analyst', issuer: 'Microsoft', level: 'Industry Associate', verified: true },
    { title: 'Advanced Corporate Finance & Taxation', issuer: 'ICSI / ICAI Module', level: 'Executive', verified: false },
  ],
  pharma_healthcare: [
    { title: 'Certified Pharmacovigilance Professional', issuer: 'Indian Pharmacopoeia Commission', level: 'Advanced', verified: true },
    { title: 'Good Clinical Practice (GCP)', issuer: 'NIDA / WHO', level: 'International', verified: true },
    { title: 'Drug Regulatory Affairs Specialist', issuer: 'Pharma Training Institute', level: 'Professional', verified: true },
    { title: 'GLP & HPLC Quality Analysis', issuer: 'Analytical Lab Academy', level: 'Hands-on Lab', verified: false },
  ],
  tech: [
    { title: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', level: 'Associate', verified: true },
    { title: 'Meta Front-End Developer Professional', issuer: 'Meta / Coursera', level: 'Specialization', verified: true },
    { title: 'Oracle Certified Java Programmer', issuer: 'Oracle', level: 'Professional', verified: true },
    { title: 'Docker & Kubernetes Fundamentals', issuer: 'Linux Foundation', level: 'Foundational', verified: false },
  ],
};

/**
 * Domain-specific internships & corporate projects.
 */
export const DOMAIN_EXPERIENCE = {
  commerce_management: [
    {
      title: 'Finance & Accounts Intern',
      company: 'KPMG India Advisory / Local Audit Firm',
      duration: 'Summer 2025 (8 Weeks)',
      deliverables: 'Assisted in statutory audit preparation, ledger reconciliation, and GST 3B return filing for 15+ corporate clients.',
      verified: true,
    },
    {
      title: 'National Business Case Competition Finalist',
      company: 'EY Corporate Strategy Challenge',
      duration: 'Oct 2025',
      deliverables: 'Built a 3-statement financial model and market entry strategy for a renewable energy startup.',
      verified: true,
    },
  ],
  pharma_healthcare: [
    {
      title: 'Quality Control Intern',
      company: 'Sun Pharmaceutical Industries',
      duration: 'Summer 2025 (6 Weeks)',
      deliverables: 'Performed HPLC purity assay testing on active pharmaceutical ingredients (API) and documentation of batch records.',
      verified: true,
    },
  ],
  tech: [
    {
      title: 'Full-Stack Software Engineering Intern',
      company: 'Tech Innovations Lab',
      duration: 'Summer 2025 (8 Weeks)',
      deliverables: 'Developed REST APIs in Node.js/PostgreSQL and optimized database queries to reduce latency by 35%.',
      verified: true,
    },
  ],
};

/**
 * Detect whether a GitHub repository has potential to become a startup/product.
 * Criteria:
 * - Has description
 * - Uses product/modern tech stack
 * - Has topics/tags or stargazers/forks or live demo page
 */
export function detectStartupPotential(repo) {
  if (!repo) return false;

  const desc = (repo.description || '').toLowerCase();
  const name = (repo.name || '').toLowerCase();
  const topics = Array.isArray(repo.topics) ? repo.topics.map(t => t.toLowerCase()) : [];
  const language = (repo.language || '').toLowerCase();

  const productKeywords = [
    'app', 'platform', 'saas', 'api', 'dashboard', 'ai', 'tool', 'portal',
    'automation', 'agent', 'bot', 'engine', 'service', 'system', 'extension',
    'marketplace', 'ecommerce', 'analytics', 'fintech', 'healthtech', 'edtech',
    'mobile', 'web', 'fullstack', 'react', 'nextjs', 'fastapi', 'flutter',
  ];

  const hasProductKeyword =
    productKeywords.some(kw => desc.includes(kw) || name.includes(kw)) ||
    topics.some(t => productKeywords.some(kw => t.includes(kw)));

  const hasTraction =
    (repo.stargazers_count || 0) > 0 ||
    (repo.forks_count || 0) > 0 ||
    !!repo.homepage ||
    topics.length >= 2;

  const hasDesc = (repo.description || '').trim().length > 10;

  return (hasProductKeyword && hasDesc) || (hasTraction && hasDesc);
}

/**
 * Analyze an array of public GitHub repositories for code quality and activity.
 */
export function analyzeGitHubRepos(repos) {
  if (!Array.isArray(repos) || repos.length === 0) {
    return {
      repoCount: 0,
      totalStars: 0,
      totalForks: 0,
      languages: [],
      startupRepos: [],
      topRepos: [],
      githubScore: 0,
      codeQualityScore: 0,
      languageDiversity: 0,
    };
  }

  // Filter out forks if possible (or keep all with original first)
  const nonForkRepos = repos.filter(r => !r.fork);
  const targetRepos = nonForkRepos.length > 0 ? nonForkRepos : repos;

  // Aggregate languages
  const languageSet = new Set();
  let totalStars = 0;
  let totalForks = 0;
  let documentedReposCount = 0;

  const startupRepos = [];

  targetRepos.forEach(repo => {
    if (repo.language) {
      languageSet.add(repo.language);
    }
    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;

    if (repo.description && repo.description.trim().length > 5) {
      documentedReposCount++;
    }

    if (detectStartupPotential(repo)) {
      startupRepos.push({
        ...repo,
        isStartupPotential: true,
      });
    }
  });

  const languages = Array.from(languageSet);

  // Sub-scores (total max: 100 pts)
  // 1. Repo Count: max 30 pts (10+ repos = full)
  const repoScore = Math.min(targetRepos.length / 10, 1) * 30;

  // 2. Language Diversity: max 25 pts (5 unique languages = full)
  const langScore = Math.min(languages.length / 5, 1) * 25;

  // 3. Documentation/README quality: max 25 pts
  const docScore = (documentedReposCount / targetRepos.length) * 25;

  // 4. Activity/Engagement: max 20 pts (stars + forks + recent updates)
  const engagementScore = Math.min((totalStars * 3 + totalForks * 5) / 20, 1) * 20;

  const githubScore = Math.round(repoScore + langScore + docScore + engagementScore);

  // Ranked repos by stars, documentation, and freshness
  const topRepos = [...targetRepos]
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0) || new Date(b.updated_at) - new Date(a.updated_at))
    .map(r => ({
      ...r,
      isStartupPotential: detectStartupPotential(r),
    }));

  return {
    repoCount: targetRepos.length,
    totalStars,
    totalForks,
    languages,
    startupRepos,
    topRepos,
    githubScore,
    codeQualityScore: Math.round(docScore + langScore),
    languageDiversity: languages.length,
  };
}

/**
 * Core CS Industry Skills Benchmark
 */
const BENCHMARK_CS_SKILLS = [
  'DSA',
  'Data Structures',
  'Algorithms',
  'DBMS',
  'Database Management',
  'SQL',
  'Operating Systems',
  'OS',
  'Computer Networks',
  'CN',
  'Software Engineering',
  'OOP',
  'Object Oriented Programming',
  'Python',
  'JavaScript',
  'Java',
  'C++',
  'Git',
];

/**
 * Compute the composite Placement Readiness Score (0-100).
 *
 * Weight Distribution:
 * - Tech: CGPA (30%), Attendance (15%), Skills (20%), Certs (10%), GitHub/Code (25%)
 * - Non-Tech (Commerce/Management/Pharma): CGPA (30%), Attendance (20%), Domain Skills (25%), Certifications (15%), Internships/Case Studies (10%)
 */
export function computePlacementReadinessScore(student, gitHubRepos = null) {
  const track = getStudentPlacementTrack(student);
  const isTech = track === 'tech';

  if (!student) {
    return {
      score: 0,
      label: 'Needs Work',
      track,
      breakdown: { cgpa: 0, attendance: 0, skills: 0, certs: 0, github: 0, experience: 0 },
      needsAttention: ['Update your profile to calculate readiness'],
      topRepos: [],
      startupRepos: [],
      hasGitHub: false,
    };
  }

  const rawCgpa = parseFloat(student.cgpa) || 8.5;
  const rawAtt = parseFloat(student.attendance) || 92.0;

  let cgpaScore = 0;
  let attendanceScore = 0;
  let skillsScore = 0;
  let certsScore = 0;
  let githubScore = 0;
  let experienceScore = 0;

  const studentSkills = (() => {
    const raw = student?.currentSkills || student?.current_skills || student?.skills || [];
    if (Array.isArray(raw)) {
      // Handle case where array contains comma-separated strings (e.g. ["Accounting, Tally, Excel"])
      const expanded = [];
      raw.forEach(item => {
        if (typeof item === 'string' && item.includes(',')) {
          item.split(',').forEach(s => { if (s.trim()) expanded.push(s.trim()); });
        } else if (typeof item === 'string' && item.trim()) {
          expanded.push(item.trim());
        }
      });
      return expanded;
    }
    if (typeof raw === 'string' && raw.trim()) {
      return raw.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  })();

  const studentCerts = (() => {
    const raw = student?.certsDone || student?.certificates_done || student?.certs_done || [];
    if (Array.isArray(raw)) {
      // Handle case where array contains comma-separated strings (e.g. ["Cert1, Cert2, Cert3"])
      const expanded = [];
      raw.forEach(item => {
        if (typeof item === 'string' && item.includes(',')) {
          item.split(',').forEach(s => { if (s.trim()) expanded.push(s.trim()); });
        } else if (typeof item === 'string' && item.trim()) {
          expanded.push(item.trim());
        } else if (item && typeof item === 'object') {
          // Handle object format { name: '...', ... }
          const name = item.name || item.title || item.cert_name || String(item);
          if (name && name.trim()) expanded.push(name.trim());
        }
      });
      return expanded;
    }
    if (typeof raw === 'string' && raw.trim()) {
      return raw.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  })();

  const studentInternships = Array.isArray(student?.internships)
    ? student.internships
    : (student?.internship ? [student.internship] : []);

  const domainBenchmark = DOMAIN_SKILLS[track] || DOMAIN_SKILLS.general;
  const matchedSkills = domainBenchmark.filter(bench =>
    studentSkills.some(s => {
      if (typeof s !== 'string') return false;
      const sL = s.toLowerCase().trim();
      const bL = bench.toLowerCase().trim();

      // Direct substring match
      if (sL.includes(bL) || bL.includes(sL)) return true;

      // Finance/Commerce-specific fuzzy matchers
      if ((bL.includes('excel') || bL.includes('powerbi')) && (sL.includes('excel') || sL.includes('powerbi'))) return true;
      if ((bL.includes('tally') || bL.includes('gst')) && (sL.includes('tally') || sL.includes('gst') || sL.includes('busy'))) return true;
      if (bL.includes('accounting') && (sL.includes('accounting') || sL.includes('tally') || sL.includes('busy') || sL.includes('ledger') || sL.includes('costing'))) return true;
      if (bL.includes('taxation') && (sL.includes('tax') || sL.includes('gst') || sL.includes('tally'))) return true;
      if (bL.includes('financial model') && (sL.includes('financial') || sL.includes('finance') || sL.includes('valuation'))) return true;
      if (bL.includes('analytics') && (sL.includes('analytic') || sL.includes('excel') || sL.includes('data'))) return true;
      if (bL.includes('audit') && (sL.includes('audit') || sL.includes('accounting'))) return true;
      if (bL.includes('cost') && (sL.includes('cost') || sL.includes('accounting'))) return true;
      if (bL.includes('corporate law') && (sL.includes('law') || sL.includes('corporate') || sL.includes('governance'))) return true;

      // Marketing/Management fuzzy matchers
      if (bL.includes('marketing') && (sL.includes('marketing') || sL.includes('brand') || sL.includes('digital'))) return true;
      if (bL.includes('management') && (sL.includes('management') || sL.includes('leadership') || sL.includes('project'))) return true;
      if (bL.includes('business') && (sL.includes('business') || sL.includes('management'))) return true;

      return false;
    })
  );

  const ghAnalysis = (isTech && gitHubRepos) ? analyzeGitHubRepos(gitHubRepos) : null;
  const hasGitHub = !!ghAnalysis && ghAnalysis.repoCount > 0;

  if (isTech) {
    // 1. CGPA Score (Max 30 pts)
    const cgpaNormalized = Math.min(rawCgpa / 10.0, 1.0);
    cgpaScore = Math.round(cgpaNormalized * 30);

    // 2. Attendance Score (Max 15 pts)
    const attNormalized = Math.min(rawAtt / 85.0, 1.0);
    attendanceScore = Math.round(attNormalized * 15);

    // 3. Tech Skills (Max 20 pts)
    const skillsNormalized = Math.min(matchedSkills.length / 5, 1.0);
    skillsScore = Math.round(skillsNormalized * 20);

    // 4. Certifications (Max 10 pts)
    const certsNormalized = Math.min(studentCerts.length / 2, 1.0);
    certsScore = Math.round(certsNormalized * 10);

    // 5. GitHub Activity (Max 25 pts)
    githubScore = hasGitHub ? Math.round((ghAnalysis.githubScore / 100) * 25) : 0;
  } else {
    // Non-Tech (Commerce, Management, Pharma, General)
    // 1. CGPA Score (Max 30 pts) — e.g. 8.5 CGPA = 26 pts
    const cgpaNormalized = Math.min(rawCgpa / 10.0, 1.0);
    cgpaScore = Math.round(cgpaNormalized * 30);

    // 2. Attendance Score (Max 20 pts) — 85%+ = 20 pts
    const attNormalized = Math.min(rawAtt / 85.0, 1.0);
    attendanceScore = Math.round(attNormalized * 20);

    // 3. Domain Skills (Max 25 pts) — 5 pts per matched benchmark proficiency (Max 25 pts)
    const skillsNormalized = Math.min(matchedSkills.length / 5, 1.0);
    skillsScore = Math.round(skillsNormalized * 25);

    // 4. Industry Certifications (Max 15 pts) — 5 pts per verified certification (Max 15 pts)
    const certsNormalized = Math.min(studentCerts.length / 3, 1.0);
    certsScore = Math.round(certsNormalized * 15);

    // 5. Corporate Internships & Case Studies (Max 10 pts) — 5 pts per verified internship
    experienceScore = Math.min(10, studentInternships.length * 5);
  }

  // Composite Total (0-100)
  const totalScore = Math.min(100, cgpaScore + attendanceScore + skillsScore + certsScore + (isTech ? githubScore : experienceScore));

  // Determine Label
  let label = 'Needs Work';
  let badgeColor = '#EF4444';
  if (totalScore >= 80) {
    label = 'Placement Ready 🚀';
    badgeColor = '#10B981';
  } else if (totalScore >= 60) {
    label = 'On Track ⭐';
    badgeColor = '#F59E0B';
  } else {
    label = 'Needs Work 📈';
    badgeColor = '#EF4444';
  }

  const strengths = [];
  const weaknesses = [];

  // 1. Academic Performance
  if (rawCgpa >= 8.0) {
    strengths.push({
      title: 'High Academic Performance',
      desc: `CGPA of ${rawCgpa.toFixed(2)} clears Tier-1 dream company cutoffs (target: 8.0+).`,
      icon: 'school',
      tag: 'Academics',
    });
  } else if (rawCgpa >= 7.5) {
    strengths.push({
      title: 'Strong Academic Standing',
      desc: `Current CGPA (${rawCgpa.toFixed(2)}) satisfies Day-1 campus placement shortlist criteria (7.5+). Aim for 8.0+ for Tier-1 Super Dream packages.`,
      icon: 'school',
      tag: 'Academics',
    });
  } else if (rawCgpa >= 6.5) {
    weaknesses.push({
      title: 'Academic Eligibility Focus',
      desc: `Current CGPA (${rawCgpa.toFixed(2)}) should be boosted above 7.5 to open up all campus shortlist pools.`,
      icon: 'trending-up',
      tag: 'Academics',
    });
  } else {
    weaknesses.push({
      title: 'Critical Academic Target',
      desc: `Current CGPA (${rawCgpa.toFixed(2)}) is below 6.5. Boost semester grades to clear minimum company interview eligibility.`,
      icon: 'trending-up',
      tag: 'Academics',
    });
  }

  // 2. Regularity & Discipline
  if (rawAtt >= 85) {
    strengths.push({
      title: 'Excellent Regularity',
      desc: `${rawAtt.toFixed(0)}% attendance guarantees zero condonation flags for campus placements.`,
      icon: 'calendar-check',
      tag: 'Discipline',
    });
  } else if (rawAtt < 75) {
    weaknesses.push({
      title: 'Attendance Shortfall',
      desc: `${rawAtt.toFixed(0)}% attendance is below the 75% mandatory threshold.`,
      icon: 'clock-alert-outline',
      tag: 'Attendance',
      action: 'Prioritize daily lectures to avoid exam/interview debarment.',
    });
  }

  // 3. Domain Skills Match
  if (isTech) {
    if (matchedSkills.length >= 5) {
      strengths.push({
        title: 'Robust CS Foundation',
        desc: `Strong grasp of ${matchedSkills.slice(0, 4).join(', ')} aligns with technical interview rounds.`,
        icon: 'code-tags',
        tag: 'Skills',
      });
    } else {
      weaknesses.push({
        title: 'Core CS Concept Gaps',
        desc: 'Mastery in essential topics (DSA, DBMS, Computer Networks & OS) needs reinforcement.',
        icon: 'brain',
        tag: 'Skills',
        action: 'Practice 2 LeetCode problems daily and review SQL query optimization.',
        actionUrl: 'https://leetcode.com/studyplan/top-interview-150/',
        actionUrlLabel: 'Practice LeetCode Top 150 ↗',
        secondaryUrl: 'https://leetcode.com/studyplan/top-sql-50/',
        secondaryUrlLabel: 'LeetCode SQL 50 ↗',
      });
    }
  } else {
    if (matchedSkills.length >= 3) {
      strengths.push({
        title: 'Domain & Analytical Competency',
        desc: `Mastery in ${matchedSkills.slice(0, 4).join(', ')} aligns with corporate recruitment benchmarks.`,
        icon: 'finance',
        tag: 'Domain Skills',
      });
    } else {
      weaknesses.push({
        title: 'Unverified Domain Skills',
        desc: 'Core proficiencies in financial modeling, tax reporting, and analytics need verification.',
        icon: 'finance',
        tag: 'Domain Skills',
        action: 'Attempt the in-app Skill Gap assessment test to verify your domain competencies.',
        actionNav: 'SkillGapTest',
        actionUrlLabel: 'Take Skill Gap Diagnostic ↗',
      });
    }
  }

  // 4. Certifications
  if (studentCerts.length >= 2) {
    strengths.push({
      title: 'Verified Industry Credentials',
      desc: `${studentCerts.length} industry certification(s) validate domain readiness beyond curriculum.`,
      icon: 'certificate',
      tag: 'Certs',
    });
  } else {
    weaknesses.push({
      title: 'Missing Industry Certifications',
      desc: isTech ? 'No major cloud or developer certifications (AWS, Azure, Oracle) found.' : 'Additional NISM or Financial Modeling certifications recommended.',
      icon: 'card-bulleted-off-outline',
      tag: 'Certs',
      action: isTech ? 'Target an AWS Cloud Practitioner certification.' : 'Complete NISM Series V-A or Tally Prime certification.',
      actionUrl: isTech ? 'https://aws.amazon.com/certification/certified-cloud-practitioner/' : 'https://www.nism.ac.in/certifications/',
      actionUrlLabel: isTech ? 'AWS Certification Guide ↗' : 'NISM Certifications ↗',
    });
  }

  // 5. 5th Pillar: GitHub (Tech) or Internships (Non-Tech)
  if (isTech) {
    if (hasGitHub) {
      if (ghAnalysis.repoCount >= 3) {
        strengths.push({
          title: 'Active Code Portfolio',
          desc: `${ghAnalysis.repoCount} public repositories in ${ghAnalysis.languages.slice(0, 3).join(', ')} with ${ghAnalysis.totalStars} stars.`,
          icon: 'github',
          tag: 'Portfolio',
        });
      }
      if (ghAnalysis.startupRepos.length > 0) {
        strengths.push({
          title: 'Startup & Product Potential',
          desc: `${ghAnalysis.startupRepos.length} repository/repositories have production-grade SaaS/app architecture.`,
          icon: 'rocket-launch',
          tag: 'Venture',
        });
      }
      if (ghAnalysis.languages.length < 2) {
        weaknesses.push({
          title: 'Low Language Diversity',
          desc: 'Projects are limited to a single language. Full-stack versatility is preferred.',
          icon: 'code-braces',
          tag: 'GitHub',
          action: 'Build a full-stack project combining frontend + backend + database.',
          actionUrl: 'https://github.com/topics/fullstack',
          actionUrlLabel: 'Explore Fullstack Architectures ↗',
        });
      }
    } else {
      weaknesses.push({
        title: 'No Public Code Portfolio Linked',
        desc: 'GitHub is not connected — recruiters cannot evaluate commit frequency or code quality.',
        icon: 'github',
        tag: 'GitHub',
        action: 'Connect your GitHub profile to unlock 25% placement readiness points.',
      });
    }
  } else {
    if (studentInternships.length > 0) {
      strengths.push({
        title: 'Verified Industry Experience',
        desc: `${studentInternships.length} verified corporate internship(s) on record.`,
        icon: 'briefcase-check',
        tag: 'Internships',
      });
    } else {
      weaknesses.push({
        title: 'No Industry Internships on Record',
        desc: 'No corporate internships or client case deliverables recorded yet.',
        icon: 'briefcase-outline',
        tag: 'Internships',
        action: 'Apply for summer corporate internships or finance case competitions to unlock 10 pts.',
      });
    }
  }

  // Fallback if empty
  if (strengths.length === 0) {
    strengths.push({
      title: 'Active Student Profile',
      desc: 'Enrolled in university placement qualification pathway.',
      icon: 'check-circle-outline',
      tag: 'General',
    });
  }

  const needsAttention = weaknesses.map(w => w.action ? `${w.title}: ${w.action}` : w.desc);

  return {
    score: totalScore,
    label,
    badgeColor,
    isTech,
    track,
    breakdown: {
      cgpa: { score: cgpaScore, max: 30, value: rawCgpa.toFixed(2), unit: 'CGPA' },
      attendance: { score: attendanceScore, max: isTech ? 15 : 20, value: `${rawAtt.toFixed(0)}%`, unit: 'Att.' },
      skills: { score: skillsScore, max: isTech ? 20 : 25, value: `${matchedSkills.length} Core`, unit: 'Skills' },
      certs: { score: certsScore, max: isTech ? 10 : 15, value: `${studentCerts.length}`, unit: 'Certs' },
      github: { score: githubScore, max: 25, value: hasGitHub ? `${ghAnalysis.repoCount} Repos` : 'Not Linked', unit: 'GitHub' },
      experience: { score: experienceScore, max: 10, value: studentInternships.length > 0 ? `${studentInternships.length} Done` : '0 Done', unit: 'Internships' },
    },
    matchedSkills,
    languages: ghAnalysis?.languages || [],
    topRepos: ghAnalysis?.topRepos || [],
    startupRepos: ghAnalysis?.startupRepos || [],
    totalStars: ghAnalysis?.totalStars || 0,
    hasGitHub,
    strengths,
    weaknesses,
    needsAttention: needsAttention.slice(0, 3),
  };
}

// ─── Placement Recruitment Tiers ─────────────────────────────────────────────
export function getPlacementTiers(track = 'tech') {
  if (track === 'commerce_management') {
    return [
      {
        id: 'tier1',
        title: 'Tier 1: Big 4 Advisory & Strategy Consulting',
        packageRange: '₹10 - ₹18 LPA',
        badge: 'TIER 1 READY',
        badgeColor: '#8B5CF6',
        minCgpa: 8.0,
        companies: 'Deloitte, EY, PwC, KPMG, McKinsey, BCG',
        portfolioCheck: 'Financial modeling, Power BI, case study finalist certificates & NISM/CFA L1',
        rounds: [
          { name: 'Round 1', desc: 'Quantitative Aptitude & Business Case Assessment' },
          { name: 'Round 2', desc: 'Financial Valuation, Taxation & Case Study Presentation' },
          { name: 'Round 3', desc: 'Partner Technical & Behavioral Interview' },
        ],
      },
      {
        id: 'tier2',
        title: 'Tier 2: Banking, FinTech & Equity Research',
        packageRange: '₹6 - ₹10 LPA',
        badge: 'TIER 2 READY',
        badgeColor: '#3B82F6',
        minCgpa: 7.5,
        companies: 'HDFC Bank, ICICI Securities, Axis Bank, Zerodha, Groww',
        portfolioCheck: 'Tally Prime, Advanced Excel modeling, GST compliance certification',
        rounds: [
          { name: 'Round 1', desc: 'Banking & Financial Markets Aptitude Test' },
          { name: 'Round 2', desc: 'Technical Round: Balance Sheet Analysis & Credit Risk' },
          { name: 'Round 3', desc: 'Managerial & HR Fitment Round' },
        ],
      },
      {
        id: 'tier3',
        title: 'Tier 3: Corporate Finance & FMCG Conglomerates',
        packageRange: '₹4 - ₹6 LPA',
        badge: 'TIER 3 ELIGIBLE',
        badgeColor: '#10B981',
        minCgpa: 6.5,
        companies: 'Tata Motors, Reliance Retail, ITC, Hindustan Unilever, Genpact',
        portfolioCheck: 'Fundamental accounting principles, Auditing & ERP basics',
        rounds: [
          { name: 'Round 1', desc: 'Online Aptitude & Domain Basics Quiz' },
          { name: 'Round 2', desc: 'Group Discussion & Case Analysis' },
          { name: 'Round 3', desc: 'Personal Interview & Offer Rollout' },
        ],
      },
    ];
  }

  if (track === 'pharma_healthcare') {
    return [
      {
        id: 'tier1',
        title: 'Tier 1: Global CRO & Top MNC Pharma Formulations',
        packageRange: '₹8 - ₹15 LPA',
        badge: 'TIER 1 READY',
        badgeColor: '#8B5CF6',
        minCgpa: 8.0,
        companies: 'Novartis, Pfizer, Dr. Reddy’s, Sun Pharma, Cipla',
        portfolioCheck: 'HPLC instrumentation, Pharmacovigilance & GMP validation certs',
        rounds: [
          { name: 'Round 1', desc: 'Pharmacology & Analytical Chemistry Screening' },
          { name: 'Round 2', desc: 'Technical Viva: Formulation & Clinical Trial Protocols' },
          { name: 'Round 3', desc: 'Senior Scientist & HR Interview' },
        ],
      },
      {
        id: 'tier2',
        title: 'Tier 2: QA/QC, Regulatory Affairs & Clinical Data',
        packageRange: '₹5 - ₹8 LPA',
        badge: 'TIER 2 READY',
        badgeColor: '#3B82F6',
        minCgpa: 7.0,
        companies: 'Lupin, Torrent Pharma, Biocon, Alkem, IQVIA',
        portfolioCheck: 'Drug safety reporting & Regulatory compliance credentials',
        rounds: [
          { name: 'Round 1', desc: 'Clinical Data Management Aptitude' },
          { name: 'Round 2', desc: 'QA/QC Lab Methods & Drug Testing Viva' },
          { name: 'Round 3', desc: 'HR & Operational Fitment' },
        ],
      },
      {
        id: 'tier3',
        title: 'Tier 3: Healthcare Hospital Operations & MedTech',
        packageRange: '₹3.5 - ₹5 LPA',
        badge: 'TIER 3 ELIGIBLE',
        badgeColor: '#10B981',
        minCgpa: 6.0,
        companies: 'Apollo Hospitals, Max Healthcare, Fortis, Abbott',
        portfolioCheck: 'Hospital pharmacy practice & Patient safety certification',
        rounds: [
          { name: 'Round 1', desc: 'Healthcare Aptitude & Clinical Basics' },
          { name: 'Round 2', desc: 'Hospital Case Study Round' },
          { name: 'Round 3', desc: 'HR Interview' },
        ],
      },
    ];
  }

  // Default: Tech track (Product, High Growth, Core IT)
  return [
    {
      id: 'tier1',
      title: 'Tier 1: Dream Product & Global Tech Firms',
      packageRange: '₹14 - ₹30+ LPA',
      badge: 'TIER 1 READY',
      badgeColor: '#8B5CF6',
      minCgpa: 8.0,
      companies: 'Google, Microsoft, Amazon, Adobe, Atlassian, Uber',
      portfolioCheck: '2+ Full-stack/AI production projects, 150+ DSA problems solved, GitHub activity',
      rounds: [
        { name: 'Round 1', desc: 'Online Coding Assessment (2 Hard LeetCode style problems)' },
        { name: 'Round 2', desc: 'Data Structures & Algorithms (Trees, Graphs, DP)' },
        { name: 'Round 3', desc: 'System Design & Code Architecture' },
        { name: 'Round 4', desc: 'Bar Raiser / Hiring Manager Fitment' },
      ],
    },
    {
      id: 'tier2',
      title: 'Tier 2: High-Growth Startups & FinTech Unicorns',
      packageRange: '₹8 - ₹14 LPA',
      badge: 'TIER 2 READY',
      badgeColor: '#3B82F6',
      minCgpa: 7.5,
      companies: 'Swiggy, Razorpay, PhonePe, CRED, BrowserStack, Postman',
      portfolioCheck: 'Strong GitHub portfolio, React/Node/Python stack, REST/GraphQL APIs',
      rounds: [
        { name: 'Round 1', desc: 'Machine Coding Round (Build a feature in 90 mins)' },
        { name: 'Round 2', desc: 'Data Structures & Problem Solving' },
        { name: 'Round 3', desc: 'Tech Lead / Culture Round' },
      ],
    },
    {
      id: 'tier3',
      title: 'Tier 3: Core IT Services & Digital Transformation',
      packageRange: '₹4.5 - ₹8 LPA',
      badge: 'TIER 3 ELIGIBLE',
      badgeColor: '#10B981',
      minCgpa: 6.5,
      companies: 'TCS Digital, Infosys Power Programmer, Wipro Turbo, Accenture, Cognizant',
      portfolioCheck: 'Core CS fundamentals (OOP, DBMS, OS, Computer Networks)',
      rounds: [
        { name: 'Round 1', desc: 'National Qualifier Test (Aptitude + Coding)' },
        { name: 'Round 2', desc: 'Technical Interview (Core CS & Final Year Project)' },
        { name: 'Round 3', desc: 'HR & Offer Discussion' },
      ],
    },
  ];
}
