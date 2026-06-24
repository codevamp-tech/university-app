import { APP_CONFIG } from '../config/appConfig';

// ─── Category Detection ───────────────────────────────────────────────────────
export function detectCategory(course = '') {
  const c = course.toLowerCase();
  if (c.includes('mbbs') || c.includes('bds')) return 'medical';
  if (
    c.includes('nursing') ||
    c.includes('bpt') ||
    c.includes('bmlt') ||
    c.includes('pharma') ||
    c.includes('pharmacy') ||
    c.includes('bsc nursing') ||
    c.includes('bsc medical')
  )
    return 'alliedhealth';
  if (
    c.includes('mba') ||
    c.includes('bba') ||
    c.includes('b.com') ||
    c.includes('bcom') ||
    c.includes('ba economics') ||
    c.includes('economics') ||
    c.includes('m.com')
  )
    return 'management';
  return 'engineering';
}

export function resolveCategory(student) {
  return student.category && student.category !== ''
    ? student.category.toLowerCase()
    : detectCategory(student.course);
}

// ─── Dynamic Labels ───────────────────────────────────────────────────────────
export function getCategoryLabel(student) {
  const cat = resolveCategory(student);
  if (cat === 'medical') return 'Clinical Career Pathway';
  if (cat === 'alliedhealth') return 'Professional Growth Pathway';
  return 'Career Roadmap';
}

export function getReadinessLabels(student) {
  const cat = resolveCategory(student);
  if (cat === 'medical') return ['Clinical Readiness', 'Research Readiness', 'PG Prep Score'];
  if (cat === 'alliedhealth') return ['Clinical Readiness', 'Practical Readiness', 'Growth Score'];
  if (cat === 'management') return ['Industry Readiness', 'Leadership Score', 'Employability'];
  return ['Placement Readiness', 'Technical Readiness', 'Higher Studies'];
}

export function getCategoryColor(student) {
  const cat = resolveCategory(student);
  if (cat === 'medical') return '#EF4444';
  if (cat === 'alliedhealth') return '#10B981';
  if (cat === 'management') return '#7C3AED';
  return '#3B82F6';
}

export function getPersonaBadge(personaType = '') {
  const map = {
    topperformer: { label: 'Top Performer', color: '#22C55E', bg: '#DCFCE7' },
    highpotential: { label: 'High Potential', color: '#3B82F6', bg: '#DBEAFE' },
    average: { label: 'Average', color: '#F59E0B', bg: '#FEF3C7' },
    atrisk: { label: 'At-Risk', color: '#EF4444', bg: '#FEE2E2' },
    skilldeficient: { label: 'Skill Deficient', color: '#EA580C', bg: '#FFF7ED' },
  };
  const key = personaType.toLowerCase().replace(/[\s-]/g, '');
  return map[key] || { label: personaType || 'Student', color: '#6B7280', bg: '#F3F4F6' };
}

// ─── Expected Academic Subjects by Course ────────────────────────────────────
export function getAcademicSubjects(student) {
  const c = (student.course || '').toLowerCase();
  
  if (c.includes('cse') || c.includes('computer science')) {
    return ['DSA', 'DBMS', 'OS', 'Computer Networks', 'Software Engineering'];
  }
  if (c.includes(' it') || c.includes('information tech')) {
    return ['Computer Networks', 'DBMS', 'Cybersecurity', 'Linux OS'];
  }
  if (c.includes('electronics') || c.includes('ece') || c.includes('electrical')) {
    return ['Digital Electronics', 'Microcontrollers', 'Signals & Systems', 'Signal Processing'];
  }
  if (c.includes('mechanical') || c.includes('mech')) {
    return ['Thermodynamics', 'Fluid Mechanics', 'Strength of Materials', 'FEM'];
  }
  if (c.includes('civil')) {
    return ['Structural Analysis', 'Surveying', 'Fluid Mechanics', 'Geotechnical Engineering'];
  }
  if (c.includes('bca')) {
    return ['C++ Programming', 'Database Systems', 'Computer Networks', 'Operating Systems'];
  }
  if (c.includes('mca')) {
    return ['Design & Analysis of Algorithms', 'Database Systems (DBMS)', 'Software Engineering & PM'];
  }
  if (c.includes('mba') && c.includes('finance')) {
    return ['Corporate Finance', 'Financial Accounting', 'Valuation & Security Analysis', 'Risk Management'];
  }
  if (c.includes('mba') && c.includes('marketing')) {
    return ['Marketing Management', 'Market Research Methodology', 'Consumer Behavior', 'Brand Management'];
  }
  if (c.includes('mba') && c.includes('hr')) {
    return ['Human Resource Management', 'Performance Management Systems', 'Labour Laws & Compliance', 'Organization Development'];
  }
  if (c.includes('mba')) {
    return ['Strategic Management', 'Operations Research', 'Business Economics', 'Organizational Behavior'];
  }
  if (c.includes('bba')) {
    return ['Principles of Management', 'Financial Accounting', 'Business Economics', 'Marketing Basics', 'HR Fundamentals'];
  }
  if (c.includes('b.com') || c.includes('bcom')) {
    return ['Financial Accounting', 'Cost & Management Accounting', 'Auditing Principles', 'Corporate Laws'];
  }
  if (c.includes('mbbs')) {
    return ['Anatomy', 'Physiology', 'Pharmacology', 'Pathology', 'Microbiology', 'Forensic Medicine', 'Community Medicine'];
  }
  if (c.includes('bds')) {
    return ['Dental Anatomy', 'Dental Materials', 'General Pathology'];
  }
  if (c.includes('nursing')) {
    return ['Anatomy & Physiology', 'Nursing Foundations', 'Nutrition & Dietetics', 'Pharmacology'];
  }
  if (c.includes('bpt')) {
    return ['Anatomy', 'Physiology', 'Kinesiology & Biomechanics', 'Electrotherapy'];
  }
  if (c.includes('bmlt') || c.includes('lab tech')) {
    return ['General Microbiology', 'Human Anatomy & Physiology', 'Clinical Biochemistry'];
  }
  if (c.includes('pharma') || c.includes('pharmacy')) {
    return [
      'Pharmaceutical Chemistry',
      'Pharmacognosy & Phytochemistry',
      'Pharmacology & Toxicology',
      'Pharmaceutics (Drug Formulation)',
      'Pharmaceutical Analysis',
      'Hospital & Clinical Pharmacy',
    ];
  }
  return ['Core Subject Knowledge', 'Research Methodology', 'Professional Ethics'];
}

// ─── Expected Industry Skills by Course ──────────────────────────────────────
export function getIndustrySkills(student) {
  const c = (student.course || '').toLowerCase();
  
  if (c.includes('cse') || c.includes('computer science')) {
    return ['Python Programming', 'Java Programming', 'System Design', 'Git & Version Control', 'SQL & Database Design', 'Cloud Computing (AWS/GCP)'];
  }
  if (c.includes(' it') || c.includes('information tech')) {
    return ['Python Programming', 'Cloud Computing (AWS/Azure)', 'DevOps Engineering', 'Docker & Containerization'];
  }
  if (c.includes('electronics') || c.includes('ece') || c.includes('electrical')) {
    return ['VLSI Design', 'Embedded C Programming', 'PCB Design', 'MATLAB Simulation'];
  }
  if (c.includes('mechanical') || c.includes('mech')) {
    return ['AutoCAD Drafting', 'SolidWorks 3D Modeling', 'CATIA Design', 'Quality Control & Six Sigma'];
  }
  if (c.includes('civil')) {
    return ['AutoCAD Civil 3D', 'STAAD Pro Designing', 'Construction Project Management', 'GIS & Mapping'];
  }
  if (c.includes('bca')) {
    return ['Python Web Dev', 'Java Programming', 'Web Development (HTML/CSS/JS)'];
  }
  if (c.includes('mca')) {
    return ['Java Core & Advanced', 'Python Scripting', 'Full Stack Development', 'Cloud Computing Concepts'];
  }
  if (c.includes('mba') && c.includes('finance')) {
    return ['Financial Modeling', 'Advanced Excel', 'Power BI Dashboarding', 'Equity Research Analysis', 'Bloomberg Terminal'];
  }
  if (c.includes('mba') && c.includes('marketing')) {
    return ['Digital Marketing Campaigns', 'CRM Tools (Salesforce)', 'Marketing Analytics', 'SEO Optimization', 'Content Strategy & Writing'];
  }
  if (c.includes('mba') && c.includes('hr')) {
    return ['Talent Acquisition & Recruitment', 'HRIS Tools', 'Employee Relations & Engagement'];
  }
  if (c.includes('mba')) {
    return ['Advanced Excel Analytics', 'Professional Presentation Delivery', 'Market Share Analysis'];
  }
  if (c.includes('bba')) {
    return ['Business Communication', 'Practical Excel'];
  }
  if (c.includes('b.com') || c.includes('bcom')) {
    return ['Tally ERP 9', 'GST Return Filing', 'Financial Statements Analysis'];
  }
  if (c.includes('mbbs')) {
    return ['Clinical Bedside Skills', 'Differential Diagnosis', 'Medical Research Methodology', 'Medical Ethics & Law', 'Case Presentation Practice'];
  }
  if (c.includes('bds')) {
    return ['Oral & Maxillofacial Surgery', 'Endodontic Procedures', 'Prosthodontic Restoration', 'Orthodontic Alignment', 'Periodontics Therapy', 'Dental Radiology & Imaging'];
  }
  if (c.includes('nursing')) {
    return ['Patient Care & Hygiene', 'Medical-Surgical Nursing', 'Clinical Lab Skills', 'Emergency Care Response', 'ICU Care Management'];
  }
  if (c.includes('bpt')) {
    return ['Physiotherapy Techniques', 'Rehabilitation Protocols', 'Manual Therapy Practice', 'Sports Medicine Care'];
  }
  if (c.includes('bmlt') || c.includes('lab tech')) {
    return ['Hematology Testing', 'Histopathology Techniques', 'Laboratory Quality Control', 'Clinical Chemistry Analysis'];
  }
  if (c.includes('pharma') || c.includes('pharmacy')) {
    return [
      'Drug Regulatory Affairs (CDSCO/FDA)',
      'Quality Control & GMP Compliance',
      'Pharmacovigilance & Drug Safety',
      'Medical Sales & Pharma Marketing',
      'Clinical Research & Drug Trials',
    ];
  }
  return ['Effective Communication', 'Creative Problem Solving'];
}

export function getExpectedSkills(student) {
  return [...getAcademicSubjects(student), ...getIndustrySkills(student)];
}

// ─── Skill Gap ────────────────────────────────────────────────────────────────
export function computeSkillGap(student) {
  const academicExpected = getAcademicSubjects(student);
  const industryExpected = getIndustrySkills(student);

  const matchSkill = (skill, list) =>
    list.some(cs => {
      const csL = cs.toLowerCase();
      const sL = skill.toLowerCase();
      return csL.includes(sL) || sL.includes(csL);
    });

  // Academic matching
  const academicMatched = academicExpected.filter(skill => matchSkill(skill, student.currentSkills));
  const academicMissing = academicExpected.filter(skill => !academicMatched.includes(skill));
  const academicMatchPct = Math.round((academicMatched.length / Math.max(academicExpected.length, 1)) * 100);

  // Industry matching
  const industryMatched = industryExpected.filter(skill => matchSkill(skill, student.currentSkills));
  const industryMissing = industryExpected.filter(skill => !industryMatched.includes(skill));
  const industryMatchPct = Math.round((industryMatched.length / Math.max(industryExpected.length, 1)) * 100);

  // Combined for backward compatibility
  const expectedCombined = [...academicExpected, ...industryExpected];
  const missingCombined = [...academicMissing, ...industryMissing];
  const combinedMatchPct = Math.round(((academicMatched.length + industryMatched.length) / Math.max(expectedCombined.length, 1)) * 100);

  return {
    matchPct: combinedMatchPct,
    expectedSkills: expectedCombined,
    missingSkills: missingCombined,
    currentSkills: student.currentSkills,
    
    academicExpectedSkills: academicExpected,
    academicMissingSkills: academicMissing,
    academicMatchPct,
    
    industryExpectedSkills: industryExpected,
    industryMissingSkills: industryMissing,
    industryMatchPct,
    
    recommendations: missingCombined.slice(0, 5).map(s => `Learn ${s}`),
  };
}

// ─── CGPA Trend ───────────────────────────────────────────────────────────────
export function getCGPATrend(sgpaHistory) {
  if (sgpaHistory.length < 2) return 'stable';
  const recent = sgpaHistory.slice(-Math.min(3, sgpaHistory.length));
  const diff = recent[recent.length - 1] - recent[0];
  if (diff > 0.3) return 'improving';
  if (diff < -0.3) return 'declining';
  return 'stable';
}

export function getAttendanceStatus(pct) {
  if (pct >= 90) return { label: 'Excellent', color: '#22C55E', bg: '#DCFCE7' };
  if (pct >= 75) return { label: 'Good', color: '#3B82F6', bg: '#DBEAFE' };
  if (pct >= 60) return { label: 'Needs Attention', color: '#F59E0B', bg: '#FEF3C7' };
  return { label: 'Critical', color: '#EF4444', bg: '#FEE2E2' };
}

export function getBestSemester(sgpaHistory) {
  if (!sgpaHistory.length) return null;
  const max = Math.max(...sgpaHistory);
  return { semester: sgpaHistory.indexOf(max) + 1, sgpa: max };
}

export function getLowestSemester(sgpaHistory) {
  if (!sgpaHistory.length) return null;
  const min = Math.min(...sgpaHistory);
  return { semester: sgpaHistory.indexOf(min) + 1, sgpa: min };
}

export function getAcademicGrowth(sgpaHistory) {
  if (sgpaHistory.length < 2) return 0;
  const first = sgpaHistory[0];
  const last = sgpaHistory[sgpaHistory.length - 1];
  return parseFloat((((last - first) / first) * 100).toFixed(1));
}

// ─── AI Insight Paragraph ────────────────────────────────────────────────────
export function generateAIInsight(student) {
  const trend = getCGPATrend(student.sgpaHistory);
  const attSt = getAttendanceStatus(student.attendance);
  const gap = computeSkillGap(student);
  const cat = resolveCategory(student);
  const cgpaStr = student.sgpaHistory.join(' → ');

  let text = '';

  // Academic trend
  if (trend === 'improving') {
    text += `${student.name} demonstrates a strong upward academic trajectory (SGPA: ${cgpaStr}). `;
    text += `This consistent growth (CGPA: ${student.cgpa}) signals high potential for `;
    text += cat === 'medical'
      ? 'NEET PG success and specialisation.'
      : cat === 'management'
      ? 'premium industry placements.'
      : 'top-tier campus recruitments.';
    text += ' ';
  } else if (trend === 'declining') {
    text += `Academic performance has shown a declining trend over recent semesters (SGPA: ${cgpaStr}). `;
    text += `The drop from ${student.sgpaHistory[0]?.toFixed(1)} to ${student.sgpaHistory[student.sgpaHistory.length - 1]?.toFixed(1)} warrants immediate faculty mentoring. `;
  } else {
    text += `${student.name} maintains a stable academic profile with CGPA of ${student.cgpa}. `;
  }

  // Attendance correlation
  if (attSt.label === 'Critical' || attSt.label === 'Needs Attention') {
    text += `Attendance at ${student.attendance}% is ${attSt.label === 'Critical' ? 'critically low' : 'below the recommended threshold'}`;
    if (trend === 'declining') text += ` and appears to correlate with the grade decline`;
    text += `. Weekly academic monitoring and structured support sessions are recommended. `;
  } else if (attSt.label === 'Excellent') {
    text += `Excellent attendance of ${student.attendance}% reflects strong academic commitment. `;
  }

  // Skill insight
  if (gap.matchPct >= 80) {
    text += `Skill profile is well-aligned with industry requirements (${gap.matchPct}% match). `;
  } else if (gap.matchPct >= 60) {
    text += `A skill gap of ${100 - gap.matchPct}% exists — prioritising ${gap.missingSkills.slice(0, 2).join(' and ')} would significantly boost readiness. `;
  } else {
    text += `A significant skill gap (${100 - gap.matchPct}%) requires targeted upskilling in ${gap.missingSkills.slice(0, 3).join(', ')}. `;
  }

  // Certification note
  if (student.certsDone.length === 0) {
    text += `No certifications on record — industry-recognised certifications are strongly recommended for better placement prospects.`;
  } else {
    text += `${student.certsDone.length} certification${student.certsDone.length > 1 ? 's' : ''} completed, demonstrating a proactive learning attitude.`;
  }

  return text.trim();
}

// ─── Readiness Scores ─────────────────────────────────────────────────────────
export function computeReadinessScores(student) {
  const gap = computeSkillGap(student);
  const cgpaPct = (student.cgpa / 10) * 100;
  const certBonus = Math.min(student.certsDone.length * 5, 20);
  const actBonus = Math.min(student.extracurricular.length * 4, 16);
  const att = student.attendance;
  const cat = resolveCategory(student);
  const labels = getReadinessLabels(student);

  const base = Math.round(cgpaPct * 0.35 + gap.matchPct * 0.35 + att * 0.2 + certBonus + actBonus);
  const clamp = (v) => Math.max(10, Math.min(99, v));

  if (cat === 'medical') {
    return [
      { label: labels[0], score: clamp(base + 3) },
      { label: labels[1], score: clamp(base - 15 + certBonus * 1.5) },
      { label: labels[2], score: clamp(base - 5) },
    ];
  }
  if (cat === 'alliedhealth') {
    return [
      { label: labels[0], score: clamp(base) },
      { label: labels[1], score: clamp(base + 8) },
      { label: labels[2], score: clamp(base - 8 + actBonus) },
    ];
  }
  if (cat === 'management') {
    return [
      { label: labels[0], score: clamp(base + 4) },
      { label: labels[1], score: clamp(base - 10 + actBonus * 1.5) },
      { label: labels[2], score: clamp(base + 8) },
    ];
  }
  return [
    { label: labels[0], score: clamp(base) },
    { label: labels[1], score: clamp(gap.matchPct + certBonus + 10) },
    { label: labels[2], score: clamp(Math.round(cgpaPct * 0.6 + att * 0.2 + certBonus)) },
  ];
}

// ─── Risk Detection ───────────────────────────────────────────────────────────
export function detectRisks(student) {
  const risks = [];
  const gap = computeSkillGap(student);
  const trend = getCGPATrend(student.sgpaHistory);
  const cat = resolveCategory(student);

  if (student.attendance < 60) {
    risks.push({ key: 'att_critical', label: 'Critical Attendance', severity: 'high', icon: 'alert-circle', desc: `Attendance ${student.attendance}% — immediate action needed` });
  } else if (student.attendance < 75) {
    risks.push({ key: 'att_low', label: 'Low Attendance', severity: 'medium', icon: 'alert', desc: `Attendance ${student.attendance}% is below the 75% threshold` });
  }

  if (trend === 'declining') {
    risks.push({ key: 'acad_decline', label: 'Academic Decline', severity: 'high', icon: 'trending-down', desc: 'CGPA has been falling over recent semesters' });
  }

  if (student.certsDone.length === 0) {
    risks.push({ key: 'no_certs', label: 'No Certifications', severity: 'low', icon: 'certificate', desc: 'No industry certifications on record' });
  }

  if (student.extracurricular.length === 0) {
    risks.push({ key: 'no_activity', label: 'No Activities', severity: 'low', icon: 'account-group-outline', desc: 'No extracurricular activities recorded' });
  }

  if (gap.matchPct < 60) {
    risks.push({ key: 'skill_gap', label: 'Low Skill Match', severity: 'high', icon: 'chart-line', desc: `Only ${gap.matchPct}% skill alignment with target role` });
  }

  if (cat === 'engineering' && student.cgpa < 6.0) {
    risks.push({ key: 'placement_risk', label: 'Placement Risk', severity: 'high', icon: 'briefcase-alert', desc: 'CGPA below minimum placement eligibility threshold' });
  }

  if (cat === 'medical' && student.cgpa < 6.5) {
    risks.push({ key: 'pg_risk', label: 'PG Preparation Risk', severity: 'high', icon: 'school', desc: 'Academic performance may impact PG entrance preparation' });
  }

  return risks;
}

// ─── Roadmap Phase Status ─────────────────────────────────────────────────────
// Assigns done/current/upcoming to steps dynamically based on
// how far through their programme the student is.
function assignPhaseStatuses(steps, student) {
  const c = ((student.course || '') + ' ' + (student.branch || '')).toLowerCase();
  const currentYear  = parseInt(student.year, 10)  || 1;
  const currentSem   = parseInt(student.semester, 10) || 1;

  // Determine total programme duration in years
  let totalYears = 4; // default B.Tech
  if (c.includes('mbbs'))                                    totalYears = 5.5;
  else if (c.includes('bds'))                                totalYears = 5;
  else if (c.includes('mba') || c.includes('mca'))           totalYears = 2;
  else if (c.includes('bca') || c.includes('bba') ||
           c.includes('bsc') || c.includes('ba')  ||
           c.includes('bcom') || c.includes('b.com') ||
           c.includes('bpt') || c.includes('bmlt') ||
           c.includes('nursing'))                            totalYears = 3;

  // Progress 0-1 weighted slightly toward semester for intra-year granularity
  const semProgress = ((currentYear - 1) * 2 + (currentSem % 2 === 0 ? 2 : 1)) /
                      (totalYears * 2);
  const progress = Math.min(semProgress, 1);

  const total = steps.length;
  // Index of the "current" step (0-based)
  const currentIdx = Math.min(Math.floor(progress * total), total - 1);

  return steps.map((step, i) => ({
    ...step,
    status: i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'upcoming',
  }));
}

// ─── Roadmap Generator ────────────────────────────────────────────────────────
export function generateRoadmap(student, interests = '') {
  const c = ((student.course || '') + ' ' + (student.branch || '')).toLowerCase();
  const label = getCategoryLabel(student);
  let target = student.targetCareer || '';

  let steps = [];
  let outcome = 'Ready for Professional Career';

  if (c.includes('cse') || c.includes('computer science')) {
    target = target || 'Software Engineer';
    outcome = 'Ready for Top-Tier Software Engineering Placements';
    steps = [
      { n: 1, title: 'DSA Fundamentals', desc: 'Arrays, Trees, Graphs, DP', status: 'done' },
      { n: 2, title: 'Git & Version Control', desc: 'GitHub, open-source contribution', status: 'done' },
      { n: 3, title: 'SQL & DBMS', desc: 'Relational databases, query optimisation', status: 'current' },
      { n: 4, title: 'Full Stack Development', desc: 'React / Node.js / REST APIs', status: 'upcoming' },
      { n: 5, title: 'Projects & Portfolio', desc: '2–3 production-grade projects', status: 'upcoming' },
      { n: 6, title: 'Mock Interviews', desc: 'LeetCode grind + system design rounds', status: 'upcoming' },
    ];
  } else if (c.includes(' it') || c.includes('information tech')) {
    target = target || 'Cloud / DevOps Engineer';
    outcome = 'Prepared for Cloud, DevOps, & IT Infrastructure Roles';
    steps = [
      { n: 1, title: 'Networking Fundamentals', desc: 'TCP/IP, OSI, DNS, DHCP', status: 'done' },
      { n: 2, title: 'Linux Administration', desc: 'Shell scripting, server management', status: 'current' },
      { n: 3, title: 'Cloud Basics', desc: 'AWS / Azure foundational course', status: 'upcoming' },
      { n: 4, title: 'Cybersecurity', desc: 'Security protocols, ethical hacking basics', status: 'upcoming' },
      { n: 5, title: 'DevOps Tools', desc: 'Docker, CI/CD pipelines, Kubernetes', status: 'upcoming' },
    ];
  } else if (c.includes('electronics') || c.includes('ece') || c.includes('electrical')) {
    target = target || 'Embedded Systems Engineer';
    outcome = 'Ready for Core VLSI & Embedded Systems Placements';
    steps = [
      { n: 1, title: 'Circuit Design', desc: 'Analog & digital circuit fundamentals', status: 'done' },
      { n: 2, title: 'Microcontrollers', desc: 'Arduino, ARM Cortex, 8051', status: 'done' },
      { n: 3, title: 'VLSI Design', desc: 'VHDL, Verilog, FPGA programming', status: 'current' },
      { n: 4, title: 'Embedded Systems', desc: 'RTOS, IoT frameworks, protocols', status: 'upcoming' },
      { n: 5, title: 'Industry Projects', desc: 'PCB design & prototyping', status: 'upcoming' },
    ];
  } else if (c.includes('mechanical') || c.includes('mech')) {
    target = target || 'Mechanical Design Engineer';
    outcome = 'Prepared for Core Manufacturing & Automobile Placements';
    steps = [
      { n: 1, title: 'CAD Tools Mastery', desc: 'AutoCAD, SolidWorks, CATIA', status: 'done' },
      { n: 2, title: 'FEM & Simulation', desc: 'ANSYS structural and thermal analysis', status: 'current' },
      { n: 3, title: 'Manufacturing', desc: 'CNC, additive manufacturing, GD&T', status: 'upcoming' },
      { n: 4, title: 'Industry Internship', desc: 'Live exposure — auto / aerospace / energy', status: 'upcoming' },
      { n: 5, title: 'GATE Preparation', desc: 'If higher studies targeted', status: 'upcoming' },
    ];
  } else if (c.includes('civil')) {
    target = target || 'Structural Engineer';
    outcome = 'Ready for Site Engineering & Construction Management';
    steps = [
      { n: 1, title: 'Structural Design', desc: 'RCC and steel structure fundamentals', status: 'done' },
      { n: 2, title: 'Software Skills', desc: 'STAAD Pro, AutoCAD, Revit', status: 'current' },
      { n: 3, title: 'Site Management', desc: 'Construction planning and project mgmt', status: 'upcoming' },
      { n: 4, title: 'Government Exams / GATE', desc: 'SSC JE, GATE Civil, PSU prep', status: 'upcoming' },
    ];
  } else if (c.includes('mba') && c.includes('finance')) {
    target = target || 'Financial Analyst';
    outcome = 'Prepared for Investment Banking & Financial Analyst Roles';
    steps = [
      { n: 1, title: 'Advanced Excel', desc: 'Financial functions, pivot tables', status: 'done' },
      { n: 2, title: 'Financial Modeling', desc: 'DCF, LBO, M&A, 3-statement models', status: 'current' },
      { n: 3, title: 'Power BI / Tableau', desc: 'Data visualisation for finance', status: 'upcoming' },
      { n: 4, title: 'Equity Research', desc: 'Sector deep-dives, research reports', status: 'upcoming' },
      { n: 5, title: 'Summer Internship', desc: 'IB / AMC / Big 4 target', status: 'upcoming' },
    ];
  } else if (c.includes('mba') && c.includes('marketing')) {
    target = target || 'Brand Manager';
    outcome = 'Ready for Brand Management & Digital Marketing Placements';
    steps = [
      { n: 1, title: 'Digital Marketing', desc: 'SEO, SEM, Social Media Marketing', status: 'done' },
      { n: 2, title: 'Analytics & CRM', desc: 'Google Analytics, HubSpot, Salesforce', status: 'current' },
      { n: 3, title: 'Brand Strategy', desc: 'Campaign planning and brand architecture', status: 'upcoming' },
      { n: 4, title: 'Market Research', desc: 'Primary & secondary research skills', status: 'upcoming' },
      { n: 5, title: 'Internship', desc: 'FMCG / startup / advertising agency', status: 'upcoming' },
    ];
  } else if (c.includes('bba') || c.includes('b.com') || c.includes('bcom')) {
    target = target || 'Business Analyst';
    outcome = 'Prepared for Corporate Finance & Business Operations';
    steps = [
      { n: 1, title: 'Core Business Knowledge', desc: 'Accounting, finance, marketing basics', status: 'done' },
      { n: 2, title: 'Excel & Tally', desc: 'Advanced spreadsheets, accounting software', status: 'current' },
      { n: 3, title: 'Professional Communication', desc: 'Presentations, business writing', status: 'upcoming' },
      { n: 4, title: 'Internship / CA Articles', desc: 'Practical industry exposure', status: 'upcoming' },
    ];
  } else if (c.includes('economics')) {
    target = target || 'Economic Researcher';
    outcome = 'Ready for Policy Analysis & Economic Research Roles';
    steps = [
      { n: 1, title: 'Quantitative Methods', desc: 'Statistics, econometrics, SPSS', status: 'done' },
      { n: 2, title: 'Policy Analysis', desc: 'Macro/micro policy evaluation', status: 'current' },
      { n: 3, title: 'Research Skills', desc: 'Data sourcing, academic writing', status: 'upcoming' },
      { n: 4, title: 'Competitive Exams', desc: 'UPSC, RBI Grade B, IES preparation', status: 'upcoming' },
    ];
  } else if (c.includes('mbbs')) {
    target = target || 'Medical Practitioner / Resident';
    outcome = 'Prepared for NEET-PG and Junior Residency';
    steps = [
      { n: 1, title: 'Core Subject Mastery', desc: 'Anatomy, Physiology, Biochemistry', status: 'done' },
      { n: 2, title: 'Clinical Rotations', desc: 'OPD, ward postings, clinical skills', status: 'current' },
      { n: 3, title: 'Case Presentations', desc: 'Bedside manner, diagnostic reasoning', status: 'upcoming' },
      { n: 4, title: 'Research Publication', desc: 'Case reports, PubMed-indexed papers', status: 'upcoming' },
      { n: 5, title: 'NEET PG Preparation', desc: 'Grand tests, subject-wise revision', status: 'upcoming' },
    ];
  } else if (c.includes('bds')) {
    target = target || 'Dental Surgeon';
    outcome = 'Ready for Clinical Dental Practice & NEET MDS';
    steps = [
      { n: 1, title: 'Preclinical Skills', desc: 'Phantom labs, dental anatomy', status: 'done' },
      { n: 2, title: 'Clinical Dentistry', desc: 'Patient handling, core procedures', status: 'current' },
      { n: 3, title: 'Specialisation Planning', desc: 'Orthodontics / Oral Surgery pathway', status: 'upcoming' },
      { n: 4, title: 'NEET MDS Preparation', desc: 'PG entrance — subject revision', status: 'upcoming' },
    ];
  } else if (c.includes('nursing')) {
    target = target || 'Registered Nurse';
    outcome = 'Ready for Clinical Nursing & Healthcare Placements';
    steps = [
      { n: 1, title: 'Fundamental Nursing Care', desc: 'Basic nursing, infection control', status: 'done' },
      { n: 2, title: 'Clinical Specialisation', desc: 'Medical-surgical, ICU, Emergency', status: 'current' },
      { n: 3, title: 'Advanced Certifications', desc: 'BLS, ACLS, critical care certifications', status: 'upcoming' },
      { n: 4, title: 'Nursing Leadership', desc: 'Nurse educator / ward manager path', status: 'upcoming' },
    ];
  } else if (c.includes('bpt')) {
    target = target || 'Physiotherapist';
    outcome = 'Prepared for Clinical Physiotherapy & Sports Rehab';
    steps = [
      { n: 1, title: 'Physiotherapy Basics', desc: 'Kinesiology, exercise therapy', status: 'done' },
      { n: 2, title: 'Manual Therapy', desc: 'Joint mobilisation, Maitland technique', status: 'current' },
      { n: 3, title: 'Sports Physiotherapy', desc: 'Sports injury assessment & management', status: 'upcoming' },
      { n: 4, title: 'Clinical Internship', desc: 'Hospital / sports academy posting', status: 'upcoming' },
    ];
  } else if (c.includes('bmlt')) {
    target = target || 'Lab Technician';
    outcome = 'Ready for Diagnostic Lab Management & Quality Control';
    steps = [
      { n: 1, title: 'Lab Fundamentals', desc: 'Sample collection, safety protocols', status: 'done' },
      { n: 2, title: 'Diagnostic Techniques', desc: 'Hematology, microbiology, biochemistry', status: 'current' },
      { n: 3, title: 'Quality Control', desc: 'ISO standards, SOP compliance', status: 'upcoming' },
      { n: 4, title: 'Advanced Certification', desc: 'NABL accreditation training', status: 'upcoming' },
    ];
  } else if (c.includes('pharma') || c.includes('pharmacy')) {
    target = target || 'Pharmacist / Drug Regulatory Affairs';
    outcome = 'Ready for Hospital Pharmacy, Regulatory Affairs & Clinical Research';
    steps = [
      { n: 1, title: 'Pharmaceutical Sciences', desc: 'Pharmaceutics, Chemistry, Pharmacognosy', status: 'done' },
      { n: 2, title: 'Pharmacology & Clinical Skills', desc: 'Drug mechanisms, toxicology, hospital pharmacy', status: 'current' },
      { n: 3, title: 'Regulatory Affairs', desc: 'CDSCO/FDA guidelines, GMP, drug submissions', status: 'upcoming' },
      { n: 4, title: 'Pharmacovigilance / Clinical Research', desc: 'Drug safety monitoring, CRO internship', status: 'upcoming' },
      { n: 5, title: 'Licensing & Career Path', desc: 'D.Pharm / B.Pharm license, GPAT, career placement', status: 'upcoming' },
    ];
  } else {
    target = target || 'Professional Career';
    outcome = 'Ready for Professional Career Placements';
    steps = [
      { n: 1, title: 'Core Foundation', desc: 'Strengthen subject knowledge', status: 'done' },
      { n: 2, title: 'Practical Skills', desc: 'Labs, field projects, case studies', status: 'current' },
      { n: 3, title: 'Certifications', desc: 'Industry-relevant certifications', status: 'upcoming' },
      { n: 4, title: 'Internship', desc: 'Real-world industry exposure', status: 'upcoming' },
    ];
  }

  // Assign done/current/upcoming dynamically based on student year/semester
  steps = assignPhaseStatuses(steps, student);

  // ── Interest-Based Full Pathway Override ────────────────────────────────────
  // Token-scoring matcher: splits user input into words, scores each pathway
  // by how many of its keywords appear in the input. Best score wins.
  if (interests && interests.trim() !== '') {
    const interest = interests.trim().toLowerCase();

    // Strip punctuation & split into individual tokens for flexible matching
    const tokens = interest.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    // Use word boundary to avoid substring matches (e.g. 'bi' matching inside 'rehabilitation')
    const hasToken = (kw) => {
      if (tokens.includes(kw)) return true;
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      return regex.test(interest);
    };

    // ── Pathway definitions ─────────────────────────────────────────────────
    const INTEREST_PATHWAYS = [
      // ── Tech / Engineering ───────────────────────────────────────────────
      {
        keys: ['product','manager','management','pm','prd','roadmap'],
        target: 'Product Manager',
        outcome: 'Ready for Product Management roles at Top Tech Companies',
        steps: [
          { title: 'Product Thinking',          desc: 'User research, problem framing, PRDs' },
          { title: 'Metrics & Analytics',        desc: 'OKRs, KPIs, A/B testing, funnel analysis' },
          { title: 'Roadmap & Prioritisation',   desc: 'RICE, MoSCoW, stakeholder alignment' },
          { title: 'Agile & Scrum',              desc: 'Sprint planning, backlog grooming, standups' },
          { title: 'PM Interviews & Internship', desc: 'Case prep, product teardowns, PM role' },
        ],
      },
      {
        keys: ['data','scientist','science','machine','learning','ml','deep','sklearn','tensorflow','pytorch'],
        target: 'Data Scientist / ML Engineer',
        outcome: 'Ready for Data Science & Machine Learning roles',
        steps: [
          { title: 'Python & Statistics',      desc: 'NumPy, Pandas, probability, distributions' },
          { title: 'Machine Learning',         desc: 'Regression, classification, clustering, sklearn' },
          { title: 'Deep Learning',            desc: 'Neural networks, CNNs, RNNs, PyTorch / TensorFlow' },
          { title: 'MLOps & Deployment',       desc: 'Model serving, Docker, ML pipelines' },
          { title: 'Kaggle & Research Projects', desc: 'Competitions, published models, internship' },
        ],
      },
      {
        keys: ['data','analyst','analysis','analytics','bi','tableau','powerbi','intelligence'],
        target: 'Data Analyst',
        outcome: 'Ready for Data Analytics & Business Intelligence roles',
        steps: [
          { title: 'SQL & Excel',          desc: 'Queries, pivot tables, VLOOKUP mastery' },
          { title: 'Python / R for Data',  desc: 'Pandas, data wrangling, visualisation' },
          { title: 'BI Tools',             desc: 'Power BI, Tableau, Looker dashboards' },
          { title: 'Statistical Analysis', desc: 'Hypothesis testing, regression, cohort analysis' },
          { title: 'Portfolio & Internship', desc: 'End-to-end projects, DA role applications' },
        ],
      },
      {
        keys: ['cyber','cybersecurity','security','hacking','ethical','penetration','pen','soc','infosec'],
        target: 'Cybersecurity Analyst',
        outcome: 'Ready for Cybersecurity & Ethical Hacking roles',
        steps: [
          { title: 'Networking & OS',       desc: 'TCP/IP, Linux, firewalls, protocols' },
          { title: 'Security Fundamentals', desc: 'CIA triad, cryptography, OWASP Top 10' },
          { title: 'Ethical Hacking',       desc: 'Pen testing, Kali Linux, Metasploit, Burp Suite' },
          { title: 'Certifications',        desc: 'CEH, CompTIA Security+, OSCP prep' },
          { title: 'Bug Bounty & CTF',      desc: 'HackerOne, CTF competitions, SOC internship' },
        ],
      },
      {
        keys: ['cloud','devops','sre','aws','gcp','azure','kubernetes','docker','terraform','cicd','infrastructure'],
        target: 'Cloud / DevOps Engineer',
        outcome: 'Ready for Cloud & DevOps Engineering roles',
        steps: [
          { title: 'Linux & Networking',      desc: 'Shell scripting, DNS, HTTP, firewalls' },
          { title: 'Cloud Platforms',         desc: 'AWS / GCP / Azure core services' },
          { title: 'Infrastructure as Code',  desc: 'Terraform, Ansible, CloudFormation' },
          { title: 'CI/CD & Containers',      desc: 'Docker, Kubernetes, Jenkins, GitHub Actions' },
          { title: 'Cloud Certifications',    desc: 'AWS SAA, GCP ACE, Kubernetes CKAD' },
        ],
      },
      {
        keys: ['ai','artificial','intelligence','nlp','genai','generative','llm','gpt','langchain','rag'],
        target: 'AI / GenAI Engineer',
        outcome: 'Ready for AI & Generative AI Engineering roles',
        steps: [
          { title: 'ML Foundations',        desc: 'Linear algebra, calculus, statistics, Python' },
          { title: 'Deep Learning',         desc: 'Transformers, attention, LLM architecture' },
          { title: 'NLP & LLMs',            desc: 'Hugging Face, fine-tuning, RAG, prompt engineering' },
          { title: 'GenAI Applications',    desc: 'LangChain, agents, vector databases' },
          { title: 'Research / Deployment', desc: 'Published models, AI internship / startup' },
        ],
      },
      {
        keys: ['ux','ui','design','designer','figma','prototype','user','experience','interface','product design'],
        target: 'UX / Product Designer',
        outcome: 'Ready for UX & Product Design roles at Top Tech Firms',
        steps: [
          { title: 'Design Principles',    desc: 'Typography, colour, layout, Gestalt laws' },
          { title: 'Figma & Prototyping',  desc: 'Wireframes, hi-fi prototypes, design systems' },
          { title: 'User Research',        desc: 'Interviews, usability testing, personas, journey maps' },
          { title: 'Interaction Design',   desc: 'Micro-animations, accessibility, responsive design' },
          { title: 'Portfolio & Internship', desc: 'Case studies, Dribbble, design internship' },
        ],
      },
      {
        keys: ['blockchain','web3','crypto','solidity','ethereum','defi','nft','decentralized'],
        target: 'Blockchain Developer',
        outcome: 'Ready for Web3 & Blockchain Development roles',
        steps: [
          { title: 'Blockchain Fundamentals', desc: 'Consensus, cryptography, distributed ledgers' },
          { title: 'Ethereum & Solidity',     desc: 'Smart contracts, ERC standards, Remix IDE' },
          { title: 'DeFi & NFTs',            desc: 'DeFi protocols, NFT marketplaces, tokenomics' },
          { title: 'Web3 Stack',             desc: 'Ethers.js, wagmi, IPFS, Hardhat' },
          { title: 'Hackathons & Launch',    desc: 'ETHGlobal, Web3 internship, dApp launch' },
        ],
      },
      {
        keys: ['embedded','iot','robotics','microcontroller','arduino','rtos','pcb','firmware'],
        target: 'Embedded / IoT Engineer',
        outcome: 'Ready for Embedded Systems & IoT Engineering roles',
        steps: [
          { title: 'Embedded C & Microcontrollers', desc: 'Arduino, STM32, timers, interrupts' },
          { title: 'RTOS',                           desc: 'FreeRTOS, task scheduling, semaphores' },
          { title: 'IoT Protocols',                  desc: 'MQTT, BLE, WiFi, LoRa, AWS IoT' },
          { title: 'PCB Design',                     desc: 'KiCAD, Eagle, circuit prototyping' },
          { title: 'Hardware Project & Internship',  desc: 'Product prototype, embedded internship' },
        ],
      },
      // ── Management / Business ──────────────────────────────────────────────
      {
        keys: ['sales','corporate','business','development','bd','b2b','crm','pipeline','sdr','bdm','account','revenue'],
        target: 'Corporate Sales & Business Development Manager',
        outcome: 'Ready for Corporate Sales & Business Development roles',
        steps: [
          { title: 'Sales Fundamentals',        desc: 'Prospecting, SPIN selling, objection handling' },
          { title: 'CRM & Pipeline Management', desc: 'Salesforce, HubSpot, lead nurturing, forecasting' },
          { title: 'B2B Sales Strategy',        desc: 'Account-based selling, enterprise deals, negotiation' },
          { title: 'Business Development',      desc: 'Partnerships, market expansion, proposal writing' },
          { title: 'Placement & Certification', desc: 'Sales internship, SDR / BDM role, target achievement' },
        ],
      },
      {
        keys: ['consultant','consulting','mbb','mckinsey','bain','bcg','strategy','mece','case'],
        target: 'Management Consultant',
        outcome: 'Ready for Top Management Consulting Firms (MBB, Big 4)',
        steps: [
          { title: 'Structured Problem Solving', desc: 'MECE, hypothesis trees, issue trees' },
          { title: 'Case Interview Prep',        desc: 'Market sizing, profitability cases, M&A' },
          { title: 'PowerPoint & Excel',         desc: 'McKinsey deck style, financial modelling' },
          { title: 'Industry Knowledge',         desc: 'Sector deep dives: BFSI, healthcare, tech' },
          { title: 'Summer Internship',          desc: 'MBB / Big 4 / boutique consulting role' },
        ],
      },
      {
        keys: ['entrepreneur','startup','founder','venture','mvp','fundraise','pitch'],
        target: 'Entrepreneur / Startup Founder',
        outcome: 'Ready to Launch & Scale Your Own Startup',
        steps: [
          { title: 'Ideation & Validation', desc: 'Problem-solution fit, customer discovery, MVPs' },
          { title: 'Business Model',        desc: 'Revenue streams, unit economics, lean canvas' },
          { title: 'Fundraising Basics',    desc: 'Angel, seed, pitch decks, term sheets' },
          { title: 'Growth & Marketing',    desc: 'Growth hacking, SEO, viral loops, retention' },
          { title: 'Launch & Scale',        desc: 'Go-to-market, hiring, Series A preparation' },
        ],
      },
      {
        keys: ['investment','banking','ib','bulge','lbo','dcf','valuation','mergers','acquisitions','equity'],
        target: 'Investment Banker',
        outcome: 'Ready for Bulge Bracket & EB Investment Banking Roles',
        steps: [
          { title: 'Financial Accounting',    desc: 'P&L, balance sheet, cash flow, ratios' },
          { title: 'Valuation',              desc: 'DCF, comps, precedent transactions, LBO basics' },
          { title: 'Financial Modeling',     desc: '3-statement models, M&A, leveraged buyout' },
          { title: 'Pitch Decks & CIMs',     desc: 'IB presentation style, deal teardowns' },
          { title: 'Summer Analyst Internship', desc: 'IB division / Big 4 M&A internship' },
        ],
      },
      {
        keys: ['digital','marketing','seo','sem','social','media','content','brand','growth','ads','campaign'],
        target: 'Digital Marketing Manager',
        outcome: 'Ready for Growth Marketing & Digital Marketing roles',
        steps: [
          { title: 'SEO & Content Marketing',    desc: 'On-page, off-page, keyword research, blogging' },
          { title: 'Paid Ads',                   desc: 'Google Ads, Meta Ads, performance marketing' },
          { title: 'Email & CRM',                desc: 'HubSpot, Mailchimp, drip campaigns, segmentation' },
          { title: 'Analytics',                  desc: 'GA4, attribution, funnel analysis, conversion rate' },
          { title: 'Portfolio & Certifications', desc: 'Google, Meta, HubSpot certs, agency internship' },
        ],
      },
      {
        keys: ['hr','human','resource','resources','people','recruitment','talent','payroll','shrm'],
        target: 'HR Manager / People Operations',
        outcome: 'Ready for HR & People Operations roles',
        steps: [
          { title: 'HR Fundamentals',       desc: 'Recruitment, onboarding, compensation & benefits' },
          { title: 'Labour Laws',           desc: 'PF, ESI, Factories Act, compliance basics' },
          { title: 'HRIS & Payroll',        desc: 'SAP SuccessFactors, Darwinbox, payroll tools' },
          { title: 'Talent Development',    desc: 'L&D, performance management, OKRs' },
          { title: 'Internship & Certification', desc: 'SHRM, HRCI, HR generalist internship' },
        ],
      },
      {
        keys: ['finance','financial','planning','analyst','cfa','cma','treasury','fpa','wealth','portfolio'],
        target: 'Financial Analyst / Financial Planner',
        outcome: 'Ready for Corporate Finance & Financial Planning roles',
        steps: [
          { title: 'Financial Accounting',   desc: 'P&L, balance sheet, ratio analysis' },
          { title: 'Financial Modeling',     desc: 'DCF, scenario analysis, Excel modeling' },
          { title: 'Portfolio & Investments', desc: 'Equity, debt, mutual funds, risk management' },
          { title: 'CFA / CMA Preparation', desc: 'Level 1 prep, mock exams, study plan' },
          { title: 'Internship & Placement', desc: 'Treasury / FP&A / Asset management role' },
        ],
      },
      {
        keys: ['operations','supply','chain','logistics','scm','procurement','inventory','warehouse','erp'],
        target: 'Operations / Supply Chain Manager',
        outcome: 'Ready for Operations & Supply Chain Management roles',
        steps: [
          { title: 'Operations Fundamentals',   desc: 'Process mapping, lean, Six Sigma basics' },
          { title: 'Supply Chain Management',   desc: 'Procurement, inventory, demand forecasting' },
          { title: 'ERP Systems',              desc: 'SAP, Oracle, warehouse management systems' },
          { title: 'Logistics & Distribution', desc: 'Last mile, 3PL, import/export compliance' },
          { title: 'Internship & Certification', desc: 'APICS CSCP, SCM internship, ops manager role' },
        ],
      },
      {
        keys: ['banking','bank','retail','relationship','manager','rm','credit','ibps','sbi'],
        target: 'Banking Professional / Relationship Manager',
        outcome: 'Ready for Banking & Financial Services roles',
        steps: [
          { title: 'Banking Products & Services',      desc: 'CASA, loans, insurance, wealth products' },
          { title: 'Credit Analysis',                  desc: 'Credit appraisal, financial statements, CIBIL' },
          { title: 'Regulatory & Compliance',          desc: 'RBI guidelines, KYC, AML, Basel norms' },
          { title: 'Client Relationship Management',   desc: 'HNI servicing, cross-selling, retention' },
          { title: 'Bank Exams / Placement',           desc: 'IBPS, SBI PO, private bank lateral entry' },
        ],
      },
      {
        keys: ['tax','taxation','ca','chartered','accountant','audit','gst','tds','icai','articleship'],
        target: 'Chartered Accountant / Tax Consultant',
        outcome: 'Ready for CA Practice & Corporate Taxation roles',
        steps: [
          { title: 'Accounting Fundamentals',    desc: 'Bookkeeping, Tally, financial statements' },
          { title: 'Taxation',                   desc: 'Income Tax, GST, TDS, indirect taxes' },
          { title: 'CA Foundation / Intermediate', desc: 'ICAI syllabus, mock tests, law subjects' },
          { title: 'Articleship',                desc: '3-year training — audit, taxation, MIS' },
          { title: 'CA Final & Practice',        desc: 'CA Final exams, firm setup or corporate placement' },
        ],
      },
      // ── Medical / Healthcare ────────────────────────────────────────────────
      {
        keys: ['surgeon','surgery','surgical','ms','operative','ot'],
        target: 'Surgeon',
        outcome: 'Prepared for Surgical Residency & Super-Specialisation',
        steps: [
          { title: 'Surgical Anatomy',       desc: 'Applied anatomy, operative exposures' },
          { title: 'General Surgery Basics', desc: 'Suturing, aseptic technique, OT protocols' },
          { title: 'Clinical Rotations',     desc: 'Surgery posting, ward rounds, case presentations' },
          { title: 'NEET PG / Surgery MCQs', desc: 'Bailey & Love, SRBs Surgery revision' },
          { title: 'MS Surgery Residency',   desc: 'PG entrance, junior residency applications' },
        ],
      },
      {
        keys: ['research','researcher','academia','phd','fellowship','publication','icmr','pubmed'],
        target: 'Clinical Researcher / Academic',
        outcome: 'Ready for Research Fellowship & Academic Medicine',
        steps: [
          { title: 'Research Methodology', desc: 'Study designs, biostatistics, SPSS / R' },
          { title: 'Literature Review',    desc: 'PubMed, systematic reviews, meta-analysis' },
          { title: 'Research Project',     desc: 'Institutional proposal, IRB approval, data collection' },
          { title: 'Publication',          desc: 'Manuscript writing, peer-reviewed journal submission' },
          { title: 'Fellowship / PhD',     desc: 'ICMR fellowship, PhD admission, post-doctoral path' },
        ],
      },
      {
        keys: ['psychiatr','psychiatry','psychiatrist','mental','health','psychology','cbt','dbt','counselling'],
        target: 'Psychiatrist',
        outcome: 'Prepared for Psychiatry Residency & Mental Health Practice',
        steps: [
          { title: 'Psychiatry Foundations',    desc: 'ICD-11, DSM-5, psychopathology basics' },
          { title: 'Clinical Skills',           desc: 'Mental Status Exam, risk assessment' },
          { title: 'Psychotherapy Basics',      desc: 'CBT, DBT, motivational interviewing' },
          { title: 'NEET PG Psychiatry MCQs',   desc: 'Ahuja, Kaplan & Sadock revision' },
          { title: 'MD Psychiatry Residency',   desc: 'PG entrance prep, residency applications' },
        ],
      },
      {
        keys: ['sports','medicine','athlete','rehabilitation','physio','conditioning','fifa','strength'],
        target: 'Sports Medicine / Physiotherapy Specialist',
        outcome: 'Ready for Elite Sports Medicine & Performance roles',
        steps: [
          { title: 'Exercise Physiology',       desc: 'Biomechanics, conditioning, VO2 max' },
          { title: 'Sports Injury Management',  desc: 'PRICE, taping, rehabilitation protocols' },
          { title: 'Strength & Conditioning',   desc: 'Periodisation, NSCA CSCS prep' },
          { title: 'Clinical Placements',       desc: 'Sports academy / hospital sports unit' },
          { title: 'Certification & Placement', desc: 'FIFA Diploma, BSEM, IPL / national team role' },
        ],
      },
    ];

    // ── Token-scoring engine ─────────────────────────────────────────────────
    // Score each pathway: count how many of its keys appear in the user tokens
    let bestMatch = null;
    let bestScore = 0;
    INTEREST_PATHWAYS.forEach(pathway => {
      const score = pathway.keys.reduce((acc, kw) => acc + (hasToken(kw) ? 1 : 0), 0);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = pathway;
      }
    });

    if (bestMatch && bestScore >= 1) {
      // Full pathway swap
      steps = bestMatch.steps.map((s, i) => ({ ...s, n: i + 1 }));
      steps = assignPhaseStatuses(steps, student);
      outcome = bestMatch.outcome;
      target  = bestMatch.target;
    } else {
      // Generic fallback — preserve existing pathway, add a personalised step
      steps.push({
        n: steps.length + 1,
        title: `Specialization: ${interests}`,
        desc: `Build expertise and portfolio focused on ${interests}`,
        status: 'upcoming',
      });
      outcome = `Ready for ${interests} focused career`;
      target  = interests;
    }
  }

  return { label, target, steps, outcome };
}

// ─── Groq LLM Dynamic Roadmap Generation ──────────────────────────────────────
export async function generateDynamicRoadmap(student, interests) {
  if (!APP_CONFIG.GROQ_API_KEY) {
    console.warn("No GROQ_API_KEY provided. Falling back to static roadmap.");
    return generateRoadmap(student, interests);
  }

  const prompt = `
You are a career advisor AI for a university student.
The student is studying: ${student.course} in ${student.branch} (Year ${student.year}, Semester ${student.semester}).
Their specific interest is: ${interests}.

Generate a personalized 5-step career roadmap for them.
Return ONLY a raw JSON object (no markdown, no backticks, no markdown code blocks).

Use this exact JSON structure:
{
  "target": "Specific Job Title (e.g., AI Product Manager)",
  "outcome": "One line summary of the goal (e.g., Ready to lead AI initiatives at top tech firms)",
  "steps": [
    {
      "n": 1,
      "title": "Short title (e.g., Fundamentals)",
      "desc": "Short description (e.g., Learn X, Y, Z)",
      "status": "done"
    },
    { "n": 2, "title": "...", "desc": "...", "status": "current" },
    { "n": 3, "title": "...", "desc": "...", "status": "upcoming" },
    { "n": 4, "title": "...", "desc": "...", "status": "upcoming" },
    { "n": 5, "title": "...", "desc": "...", "status": "upcoming" }
  ]
}

Note on status: 
Make earlier steps "done" or "current" based roughly on the fact they are in Year ${student.year}. A final year student should have more "done" steps.
`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APP_CONFIG.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    if (data.error) {
      console.error("Groq API Error:", data.error);
      return generateRoadmap(student, interests);
    }

    let textResponse = data.choices[0].message.content;
    
    // Clean up markdown code blocks if the LLM accidentally includes them
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedRoadmap = JSON.parse(textResponse);
    return {
      label: 'Career Roadmap',
      target: parsedRoadmap.target,
      outcome: parsedRoadmap.outcome,
      steps: parsedRoadmap.steps
    };
  } catch (error) {
    console.error("Failed to generate dynamic roadmap:", error);
    return generateRoadmap(student, interests); // fallback
  }
}


export function getEngagementScore(student) {
  return Math.min((student.extracurricular.length * 12) + (student.leadership.length * 18), 100);
}

// ─── Department-Level Insights (Admin Mode) ───────────────────────────────────
export function generateDepartmentInsights(students) {
  const byCategory = {};
  students.forEach(s => {
    const cat = resolveCategory(s);
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(s);
  });

  return Object.entries(byCategory).map(([cat, group]) => {
    const avgCGPA = parseFloat(
      (group.reduce((a, b) => a + b.cgpa, 0) / group.length).toFixed(2),
    );
    const avgAtt = Math.round(group.reduce((a, b) => a + b.attendance, 0) / group.length);
    const avgCerts = parseFloat(
      (group.reduce((a, b) => a + b.certsDone.length, 0) / group.length).toFixed(1),
    );
    const avgSkill = Math.round(
      group.reduce((a, b) => a + computeSkillGap(b).matchPct, 0) / group.length,
    );
    const atRisk = group.filter(s => detectRisks(s).some(r => r.severity === 'high')).length;

    const catLabel = { engineering: 'Engineering', management: 'Management', medical: 'Medical', alliedhealth: 'Allied Health' }[cat] || cat;
    let insight = `${catLabel} cohort (${group.length} students): Avg CGPA ${avgCGPA}, Attendance ${avgAtt}%. `;
    if (avgAtt < 75) insight += `Attendance is below threshold — department-level intervention needed. `;
    if (avgCerts < 1) insight += `Certification adoption is low (avg ${avgCerts}/student). `;
    if (avgSkill < 65) insight += `Skill-industry alignment at ${avgSkill}% — curriculum gap bridging recommended. `;
    if (atRisk > 0) insight += `${atRisk} student${atRisk > 1 ? 's' : ''} flagged as high-risk.`;

    return { category: cat, catLabel, count: group.length, avgCGPA, avgAtt, avgCerts, avgSkill, atRisk, insight };
  });
}

// ─── Groq LLM Dynamic Learning Path Generation ────────────────────────────────────
export async function generateLearningPath(student, skillName) {
  if (!APP_CONFIG.GROQ_API_KEY) {
    console.warn("No GROQ_API_KEY provided. Falling back to static learning path.");
    return generateStaticLearningPath(skillName);
  }

  const prompt = `
You are an expert career and learning advisor AI. A student studying ${student.course || 'University Course'} is missing the skill: "${skillName}" and wants to learn it.
Create a highly structured 3-step learning path for them to master this skill.
Provide resources, key topics, and an estimated timeframe for each step.
Return ONLY a raw JSON object (no markdown, no backticks, no markdown code blocks).

Use this exact JSON structure:
{
  "skill": "${skillName}",
  "summary": "One line advice on how to master this skill.",
  "steps": [
    {
      "step": 1,
      "title": "e.g., Syntax & Setup",
      "timeframe": "e.g., Week 1-2",
      "topics": ["Topic A", "Topic B", "Topic C"],
      "resources": ["Resource Name 1", "Resource Name 2"]
    },
    {
      "step": 2,
      "title": "e.g., Building Core Projects",
      "timeframe": "e.g., Week 3-4",
      "topics": ["Topic D", "Topic E"],
      "resources": ["Resource Name 3"]
    },
    {
      "step": 3,
      "title": "e.g., Advanced Concepts & Deployment",
      "timeframe": "e.g., Week 5-6",
      "topics": ["Topic F", "Topic G"],
      "resources": ["Resource Name 4"]
    }
  ]
}
`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APP_CONFIG.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    if (data.error) {
      console.error("Groq API Error in generateLearningPath:", data.error);
      return generateStaticLearningPath(skillName);
    }

    let textResponse = data.choices[0].message.content;
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(textResponse);
  } catch (error) {
    console.error("Failed to generate dynamic learning path:", error);
    return generateStaticLearningPath(skillName);
  }
}

export function generateStaticLearningPath(skillName) {
  const name = skillName.toLowerCase();

  if (
    name.includes('anatomy') ||
    name.includes('physiology') ||
    name.includes('pharmacology') ||
    name.includes('clinical') ||
    name.includes('diagnosis') ||
    name.includes('surgery') ||
    name.includes('medical') ||
    name.includes('resident')
  ) {
    return {
      skill: skillName,
      summary: "Master clinical foundations through textbooks, anatomical modeling, and hospital bedside learning.",
      steps: [
        {
          step: 1,
          title: "Theoretical Foundations & Terminology",
          timeframe: "Week 1-2",
          topics: ["Anatomical landmarks & structures", "Systemic cellular physiology", "Drug classifications & mechanisms"],
          resources: ["Gray's Anatomy Student Edition", "Guyton and Hall Textbook of Medical Physiology"]
        },
        {
          step: 2,
          title: "Clinical Methods & Observational Diagnostics",
          timeframe: "Week 3-4",
          topics: ["Patient history taking", "Vital signs monitoring", "Physical examination protocols", "Symptom charting"],
          resources: ["Hutchison's Clinical Methods", "Bates' Guide to Physical Examination"]
        },
        {
          step: 3,
          title: "Case Studies & Differential Diagnosis",
          timeframe: "Week 5-6",
          topics: ["Diagnostic reasoning", "Differential diagnosis matrices", "Medical ethics & patient communication"],
          resources: ["Harrison's Principles of Internal Medicine", "New England Journal of Medicine Case Records"]
        }
      ]
    };
  }

  if (
    name.includes('physiotherapy') ||
    name.includes('kinesiology') ||
    name.includes('rehabilitation') ||
    name.includes('patient care') ||
    name.includes('nursing') ||
    name.includes('hematology') ||
    name.includes('microbiology') ||
    name.includes('dent') ||
    name.includes('oral') ||
    name.includes('lab')
  ) {
    return {
      skill: skillName,
      summary: "Establish clinical procedure protocols, observe hands-on therapies, and review diagnostic lab safety.",
      steps: [
        {
          step: 1,
          title: "Standard Operating Procedures & Lab Safety",
          timeframe: "Week 1-2",
          topics: ["Infection control & sterilization", "Patient positioning & hygiene", "Basic diagnostic instrumentation"],
          resources: ["WHO Guidelines on Hand Hygiene", "Standard Textbook of Nursing Foundations"]
        },
        {
          step: 2,
          title: "Hands-on Procedural Practice",
          timeframe: "Week 3-4",
          topics: ["Specimen processing", "Therapy technique execution", "Patient interaction & chart logging"],
          resources: ["Clinical Laboratory Manuals", "Senior Resident Practical Demonstration Notes"]
        },
        {
          step: 3,
          title: "Practical Placement & Evaluation",
          timeframe: "Week 5-6",
          topics: ["Emergency procedures response", "Independent case monitoring", "NABL accreditation standards compliance"],
          resources: ["Hospital Ward Internship Program", "Clinical Placement Logbooks"]
        }
      ]
    };
  }

  if (
    name.includes('excel') ||
    name.includes('finance') ||
    name.includes('marketing') ||
    name.includes('hr') ||
    name.includes('business') ||
    name.includes('strategy') ||
    name.includes('valuation') ||
    name.includes('recruitment') ||
    name.includes('management')
  ) {
    return {
      skill: skillName,
      summary: "Acquire core managerial frameworks, spreadsheet metrics modeling, and strategic execution tools.",
      steps: [
        {
          step: 1,
          title: "Business Frameworks & Quantitative Basics",
          timeframe: "Week 1-2",
          topics: ["Managerial accounting & budgeting", "Core business frameworks (SWOT, Porter's 5 Forces)", "Quantitative modeling in Excel"],
          resources: ["Harvard Business Review Case Studies", "Wall Street Prep Excel Crash Course"]
        },
        {
          step: 2,
          title: "Strategic Execution & Analytics",
          timeframe: "Week 3-4",
          topics: ["Funnel optimization", "Market research & survey design", "Performance metrics (KPIs & OKRs)", "CRM pipeline tracking"],
          resources: ["Kotler on Marketing Management", "Tableau or Power BI training courses"]
        },
        {
          step: 3,
          title: "Case Analysis & Senior Presentation",
          timeframe: "Week 5-6",
          topics: ["Stakeholder communication", "Strategic expansion recommendation", "Pitch deck design & delivery"],
          resources: ["McKinsey Case Interview Book", "TED Talks on Corporate Strategy"]
        }
      ]
    };
  }

  if (name.includes('web') || name.includes('html') || name.includes('react')) {
    return {
      skill: skillName,
      summary: "Start with basic HTML/CSS, then master React or Vue for front-end rendering.",
      steps: [
        {
          step: 1,
          title: "HTML5, CSS3 & Responsive Design",
          timeframe: "Week 1-2",
          topics: ["Semantic tags", "Flexbox & Grid layout", "Media queries", "CSS transitions"],
          resources: ["MDN Web Docs", "freeCodeCamp Responsive Web Design"]
        },
        {
          step: 2,
          title: "Modern JavaScript & DOM Manipulation",
          timeframe: "Week 3-4",
          topics: ["ES6 features (Arrow functions, Destructuring)", "Async/Await & Promises", "Fetch API", "Event listeners"],
          resources: ["JavaScript.info", "Eloquent JavaScript Book"]
        },
        {
          step: 3,
          title: "React Framework Foundations",
          timeframe: "Week 5-6",
          topics: ["Components & Props", "useState & useEffect Hooks", "State management", "Routing with React Router"],
          resources: ["Official React Docs (react.dev)", "Scrimba Learn React Course"]
        }
      ]
    };
  }

  if (name.includes('dsa') || name.includes('data structure') || name.includes('algorithm')) {
    return {
      skill: skillName,
      summary: "Master data structure fundamentals first, then learn algorithmic paradigms and solve problems on LeetCode.",
      steps: [
        {
          step: 1,
          title: "Linear Data Structures & Complexity",
          timeframe: "Week 1-2",
          topics: ["Arrays & Arraylists", "Linked Lists (Single, Double)", "Stacks & Queues", "Big O Time and Space Analysis"],
          resources: ["GeeksforGeeks DSA Guide", "Abdul Bari Algorithms playlist on YouTube"]
        },
        {
          step: 2,
          title: "Non-Linear Data Structures",
          timeframe: "Week 3-4",
          topics: ["Binary Trees & BSTs", "Hash Maps & Collisions", "Heaps & Priority Queues", "Graphs (BFS, DFS)"],
          resources: ["LeetCode Explore Cards", "NeetCode.io Roadmap"]
        },
        {
          step: 3,
          title: "Algorithmic Paradigms",
          timeframe: "Week 5-6",
          topics: ["Recursion & Backtracking", "Dynamic Programming basics", "Sorting & Searching", "Sliding Window"],
          resources: ["Cracking the Coding Interview Book", "LeetCode Top 75 Questions"]
        }
      ]
    };
  }

  if (name.includes('system design') || name.includes('architecture')) {
    return {
      skill: skillName,
      summary: "Learn horizontal scaling, caching, and databases, then review real-world system designs like Twitter or Uber.",
      steps: [
        {
          step: 1,
          title: "Scaling & Core Components",
          timeframe: "Week 1-2",
          topics: ["Vertical vs Horizontal scaling", "Load Balancers (Nginx)", "IP/DNS/HTTP protocols", "Caching (Redis)"],
          resources: ["ByteByteGo channel", "System Design Primer on GitHub"]
        },
        {
          step: 2,
          title: "Databases & Storage",
          timeframe: "Week 3-4",
          topics: ["SQL vs NoSQL trade-offs", "Database sharding & replication", "Consistency models (CAP theorem)", "CDN caches"],
          resources: ["Designing Data-Intensive Applications Book", "Alex Xu System Design Volume 1"]
        },
        {
          step: 3,
          title: "Design Patterns & System Architectural Case Studies",
          timeframe: "Week 5-6",
          topics: ["Microservices vs Monoliths", "Message Queues (Kafka/RabbitMQ)", "Designing URL Shortener", "Designing Chat App"],
          resources: ["Grokking the System Design Interview", "System Design Interview Books"]
        }
      ]
    };
  }

  // General default fallback
  return {
    skill: skillName,
    summary: "Establish strong foundations, write small scripts, and build a project to solidify this skill.",
    steps: [
      {
        step: 1,
        title: "Introduction & Core Foundations",
        timeframe: "Week 1-2",
        topics: ["Basic terminology", "Syntax or environment setup", "Running first examples", "Fundamental components"],
        resources: ["YouTube Crash Courses", "Official Documentation"]
      },
      {
        step: 2,
        title: "Intermediate Concepts & Practical Practice",
        timeframe: "Week 3-4",
        topics: ["Common design patterns", "Connecting components", "Debugging common errors", "Working with datasets or templates"],
        resources: ["Medium tutorials", "GitHub starter templates"]
      },
      {
        step: 3,
        title: "Project Prototyping & Portfolio Addition",
        timeframe: "Week 5-6",
        topics: ["Building a portfolio project", "Adding test coverage", "Publishing/Deploying to GitHub", "Self-evaluation review"],
        resources: ["Portfolio project ideas list", "Community forums (Reddit/StackOverflow)"]
      }
    ]
  };
}

// ─── Groq LLM Dynamic AI Insight ──────────────────────────────────────────────
export async function fetchDynamicLLMInsight(student) {
  // Use the static insight as a base context for the LLM
  const baseInsight = generateAIInsight(student);
  
  if (!APP_CONFIG.GROQ_API_KEY) {
    return baseInsight;
  }

  const prompt = `
You are an AI mentor for a university app.
Student Info:
Name: ${student.name}
Course: ${student.course} in ${student.branch} (Year ${student.year}, Sem ${student.semester})
CGPA: ${student.cgpa}
Attendance: ${student.attendance}%
Base Analysis: ${baseInsight}

Generate a short, extremely personalized and motivating 1-2 sentence AI insight to show on their dashboard.
Do not use markdown. Just return the text. Be inspiring but professional.
`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APP_CONFIG.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (data.error) return baseInsight;
    
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Failed to fetch dynamic AI insight:", error);
    return baseInsight;
  }
}

// ─── Groq LLM ATS Resume Builder ──────────────────────────────────────────────
export async function generateATSResume(student) {
  if (!APP_CONFIG.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing. Cannot generate resume.");
  }

  const cat = resolveCategory(student);
  const collegeName = "SRMS - Shri Ram Murti Smarak";
  const courseText = (student.course?.toLowerCase().includes('mbbs') || student.course?.toLowerCase().includes('bds'))
    ? `${student.course} (Medicine)`
    : `${student.course} in ${student.branch}`;

  const extraGuideline = cat === 'medical'
    ? 'Extracurricular/Clubs/Certs: (assume they are active in 2 medical/health study circles or student associations and have 1 clinical workshop certification like BLS or ACLS if not provided)'
    : cat === 'alliedhealth'
    ? 'Extracurricular/Clubs/Certs: (assume they are active in 2 allied health/nursing student associations and have 1 clinical workshop/practical certification if not provided)'
    : 'Extracurricular/Clubs/Certs: (assume they are active in 2 tech/business clubs and have 1 professional certification if not provided)';

  const prompt = `
You are an expert career counselor and resume writer. 
Generate a professional, ATS-compatible resume in JSON format for the following student.
Do not use markdown blocks, return ONLY raw JSON.

Student Info:
Name: ${student.name}
Course: ${courseText} (Year ${student.year})
CGPA: ${student.cgpa}
Skills: ${student.skills ? student.skills.join(', ') : 'Various technical and soft skills'}
Attendance: ${student.attendance}%
${extraGuideline}
Base Analysis: ${generateAIInsight(student)}

The JSON must exactly match this structure:
{
  "name": "Student Name",
  "contact": "Email, Phone, LinkedIn/GitHub placeholders",
  "objective": "A strong 2-sentence professional summary.",
  "education": [
    {
      "institution": "${collegeName}",
      "degree": "Degree and Branch",
      "duration": "Start Year - Expected Graduation Year",
      "details": "GPA, relevant coursework"
    }
  ],
  "experience": [
    {
      "role": "Role (e.g. Project Intern or Club Lead)",
      "company": "Organization",
      "duration": "Month Year - Month Year",
      "bullets": ["Action-oriented bullet 1", "Action-oriented bullet 2"]
    }
  ],
  "projects": [
    {
      "title": "Project Name",
      "technologies": "Tech Stack used",
      "description": "Short description of the project"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"]
}

Guidelines for Education:
1. For institution name, use exactly "${collegeName}".
2. For medical students, ensure degree is formatted as "Bachelor of Medicine, Bachelor of Surgery (MBBS)" rather than "MBBS in MBBS" or "M.B.B.S in MBBS".
`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APP_CONFIG.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "Groq API Error");

    let textResponse = data.choices[0].message.content;
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const resume = JSON.parse(textResponse);

    // Post-process to guarantee MBBS formatting and college name in education entries
    if (resume.education && Array.isArray(resume.education)) {
      resume.education = resume.education.map(edu => {
        let degree = edu.degree || '';
        let institution = edu.institution || '';
        
        // Clean degree name
        if (degree.toLowerCase().includes('m.b.b.s') || degree.toLowerCase().includes('mbbs')) {
          if (degree.toLowerCase().includes('in mbbs') || degree.toLowerCase().includes('in m.b.b.s') || degree.toLowerCase().includes('in medicine') || degree === 'MBBS' || degree === 'M.B.B.S.') {
            degree = 'Bachelor of Medicine, Bachelor of Surgery (MBBS)';
          }
        }
        
        // Ensure institution is correct
        if (!institution || institution.toLowerCase() === 'university name' || institution.toLowerCase() === 'null') {
          institution = collegeName;
        }
        
        return {
          ...edu,
          degree,
          institution
        };
      });
    }

    return resume;
  } catch (error) {
    console.error("Failed to generate ATS resume:", error);
    throw error;
  }
}