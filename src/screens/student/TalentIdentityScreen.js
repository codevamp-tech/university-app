import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Modal, ActivityIndicator, Alert, Switch, TextInput, Linking, Share
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  uploadAvatarAPI, uploadDocumentAPI, updateMyProfile, connectionStatsAPI, getStartups,
  getErpGithubRepos, submitErpGithubRepo, getErpSeminars, getErpTutorials, getErpMiniProject,
  getErpStudentCertificates, getErpIncubationProjects, fetchGitHubRepos,
  getMyStudentCredentialsAPI, submitStudentCredentialAPI,
} from '../../data/apiService';
import { getAvatarUrl } from '../../utils/avatar';
import { SafeStudentAvatar } from '../../components/SafeStudentAvatar';
import { ProfileDropdownModal } from '../../components/ProfileDropdownModal';

import { useTheme } from '../../hooks/useTheme';
import { APP_CONFIG } from '../../config/appConfig';
import { useUser } from '../../context/UserContext';
import { getCategoryLabel } from '../../data/aiEngine';
import { getDisplayCourse, isMedicalStudent, resolveCourseAndBranch } from '../../utils/courseDisplay';
import { getStudentPlacementTrack } from '../../utils/placementReadiness';


const { width } = Dimensions.get('window');

const TalentIdentityScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, accessToken, updateAvatarUrl, githubUsername } = useUser();
  const [isUploading, setIsUploading] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  const isMed = user ? isMedicalStudent(user) : false;

  const resolvedProg = React.useMemo(() => {
    return resolveCourseAndBranch(user);
  }, [user]);

  const isTechStudent = React.useMemo(() => {
    if (!user || isMed) return false;
    const track = getStudentPlacementTrack(user);
    if (track === 'commerce_management' || track === 'medical' || track === 'pharma_healthcare') return false;
    if (track === 'tech') return true;

    const course = (resolvedProg.course || user.course || '').toUpperCase();
    const branch = (resolvedProg.branch || user.branch || user.department || user.department_name || '').toUpperCase();
    const full = `${course} ${branch}`.toUpperCase();

    if (
      full.includes('MBA') ||
      full.includes('BBA') ||
      full.includes('COMMERCE') ||
      full.includes('MANAG') ||
      full.includes('FINANCE') ||
      full.includes('MARKETING') ||
      full.includes('HR') ||
      full.includes('PHARM')
    ) {
      return false;
    }

    return (
      full.includes('BCA') ||
      full.includes('MCA') ||
      full.includes('CSE') ||
      full.includes('COMP') ||
      full.includes('IT') ||
      full.includes('SOFTWARE') ||
      full.includes('DATA') ||
      full.includes('AI') ||
      full.includes('CYBER') ||
      (course.includes('BTECH') && (branch.includes('CS') || branch.includes('IT') || branch.includes('TECH') || branch === 'ENGINEERING' || !branch))
    );
  }, [user, isMed, resolvedProg]);

  const getRichStudentBio = React.useCallback((u) => {
    if (!u) return '';
    const currentBio = (u.bio || '').trim();
    
    // If user has an articulate custom bio (>40 chars without raw template markers)
    if (currentBio && currentBio.length > 40 && !currentBio.startsWith('Leadership:') && !currentBio.includes('| Extracurricular:')) {
      return currentBio;
    }

    const { course: resCourse, branch: resBranch } = resolveCourseAndBranch(u);
    const course = resCourse || (u.course || (isMed ? 'MBBS' : 'BCA')).trim();
    const isMBA = course.toUpperCase().includes('MBA') || course.toUpperCase().includes('BBA') || course.toUpperCase().includes('COM') || (resBranch || u.branch || '').toUpperCase().includes('FINANCE') || (resBranch || u.branch || '').toUpperCase().includes('MANAG');
    const isPharma = course.toUpperCase().includes('PHARM');
    const isBCA = course.toUpperCase().includes('BCA');
    
    const branch = resBranch || u.branch || (isMBA ? 'Management' : (isPharma ? 'Pharmaceutical Sciences' : (course.includes('MCA') ? 'Software Applications' : (isBCA ? 'Computer Applications' : 'Computer Science'))));
    const yearNum = u.year || u.current_year || (u.semester ? Math.ceil(parseInt(u.semester) / 2) : 1);
    const semNum = u.semester || (yearNum * 2 - 1);
    const cgpa = u.cgpa ? `${u.cgpa} CGPA` : 'strong academic standing';

    const isMockActivity = (item) => {
      if (!item || typeof item !== 'string') return true;
      const s = item.toLowerCase().trim();
      return (
        s === 'technical event coordinator' ||
        s === 'debates' ||
        s === 'coding club' ||
        s === 'debates, coding club' ||
        s === 'event coordinator' ||
        s.includes('technical event coordinator') ||
        s === 'none recorded' ||
        s === 'not assigned' ||
        s === 'none' ||
        s === 'n/a'
      );
    };

    let leadership = '';
    let extracurricular = '';
    if (Array.isArray(u.leadership) && u.leadership.length > 0) {
      leadership = u.leadership.filter(item => !isMockActivity(item)).join(', ');
    }
    if (Array.isArray(u.extracurricular) && u.extracurricular.length > 0) {
      extracurricular = u.extracurricular.filter(item => !isMockActivity(item)).join(', ');
    }

    if (isMed) {
      const phaseLabel = yearNum === 1 ? '1st Prof' : yearNum === 2 ? '2nd Prof' : '3rd Prof Part I';
      return `Dedicated medical scholar in ${phaseLabel} MBBS at ${APP_CONFIG.UNIVERSITY_NAME}. Committed to clinical excellence, evidence-based patient diagnosis, and preventive healthcare. ${leadership ? `Serving as ${leadership}. ` : ''}Actively participating in hospital clinical ward postings, diagnostics, and community health initiatives.`;
    }

    const leadSentence = leadership 
      ? ` Active roles: ${leadership}.${extracurricular ? ` Participated in ${extracurricular}.` : ''}`
      : (extracurricular ? ` Active in ${extracurricular}.` : '');

    let passionSentence = 'Passionate about building robust software architectures, scalable full-stack applications, and exploring cloud systems.';
    if (isMBA) {
      passionSentence = 'Passionate about corporate finance, financial modeling, taxation, and business analytics.';
    } else if (isPharma) {
      passionSentence = 'Passionate about clinical pharmacology, drug development, and pharmaceutical quality assurance.';
    } else if (isBCA) {
      passionSentence = 'Passionate about core programming in Python & C, modern web development, and software applications.';
    }

    return `${course} scholar in Year ${yearNum} (Semester ${semNum}) specializing in ${branch} with a ${cgpa}.${leadSentence} ${passionSentence}`;
  }, [isMed]);

  const [userBio, setUserBio] = React.useState(getRichStudentBio(user));
  const [stats, setStats] = React.useState({ followers: 0, following: 0, connections: 0 });
  const [myStartups, setMyStartups] = React.useState([]);
  const [erpCertificates, setErpCertificates] = React.useState([]);
  const [erpVenture, setErpVenture] = React.useState(null);
  const [loadingData, setLoadingData] = React.useState(true);
  const [showAllCertsModal, setShowAllCertsModal] = React.useState(false);
  const [expandedCertId, setExpandedCertId] = React.useState(null);
  const [selectedCert, setSelectedCert] = React.useState(null);
  const [githubRepos, setGithubRepos] = React.useState([]);
  const [erpSeminars, setErpSeminars] = React.useState([]);
  const [erpTutorials, setErpTutorials] = React.useState([]);
  const [erpMiniProject, setErpMiniProject] = React.useState(null);
  const [showAddRepoModal, setShowAddRepoModal] = React.useState(false);
  const [repoForm, setRepoForm] = React.useState({ title: '', description: '', repo_link: '', tech_stack: '' });
  const [submittingRepo, setSubmittingRepo] = React.useState(false);

  // ── Student Credentials State (Certificates, Skills, Extracurriculars) ──
  const [studentCredentials, setStudentCredentials] = React.useState([]);
  const [showAddCredModal, setShowAddCredModal] = React.useState(false);
  const [credType, setCredType] = React.useState('certificate'); // 'certificate' | 'skill' | 'extracurricular'
  const [credForm, setCredForm] = React.useState({
    title: '',
    category: '',
    issuer: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    file_url: '',
  });
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [isUploadingFile, setIsUploadingFile] = React.useState(false);
  const [isSubmittingCred, setIsSubmittingCred] = React.useState(false);

  const fetchStudentCredentials = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await getMyStudentCredentialsAPI(accessToken);
      if (res && Array.isArray(res.data)) {
        setStudentCredentials(res.data);
      }
    } catch (err) {
      console.warn('[TalentIdentityScreen] credentials error:', err);
    }
  }, [accessToken]);

  const handlePickCredDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const picked = result.assets[0];
        setSelectedFile({
          uri: picked.uri,
          name: picked.name,
          size: picked.size,
          mimeType: picked.mimeType || 'application/pdf',
        });
      }
    } catch (err) {
      console.warn('Error picking document:', err);
      Alert.alert('Selection Error', 'Failed to pick document.');
    }
  };

  const handlePickCredImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please grant photo library access to upload certificate images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.fileName || 'certificate_proof.jpg',
          size: asset.fileSize || 0,
          mimeType: 'image/jpeg',
        });
      }
    } catch (err) {
      console.warn('Error picking image:', err);
    }
  };

  const handleCredentialSubmit = async () => {
    if (!credForm.title.trim()) {
      Alert.alert('Required Field', 'Please enter a title for your submission.');
      return;
    }
    if (!selectedFile && !credForm.file_url.trim()) {
      Alert.alert(
        'Verification Proof Required',
        'Verification proof is mandatory. Please attach a certificate/document file, photo, or provide an online verification URL for faculty to verify.'
      );
      return;
    }
    setIsSubmittingCred(true);
    try {
      let finalFileUrl = credForm.file_url;
      if (selectedFile && selectedFile.uri) {
        setIsUploadingFile(true);
        const res = await uploadDocumentAPI(accessToken, selectedFile.uri, selectedFile.name);
        setIsUploadingFile(false);
        if (res && res.ok && res.json) {
          finalFileUrl = res.json.url || res.json.file_url || res.json.data?.url || selectedFile.uri;
        }
      }

      let pts = 50;
      if (credType === 'certificate') pts = 100;
      else if (credType === 'skill') pts = 25;
      else if (credType === 'extracurricular') pts = 50;

      const payload = {
        type: credType,
        title: credForm.title.trim(),
        category: credForm.category.trim() || undefined,
        issuer: credForm.issuer.trim() || undefined,
        date: credForm.date.trim() || new Date().toISOString().slice(0, 10),
        description: credForm.description.trim() || undefined,
        file_url: finalFileUrl || undefined,
        points: pts,
        student_reg_no: user?.rollno || user?.registration_no || user?.username,
        student_name: user?.name || user?.full_name,
      };

      await submitStudentCredentialAPI(accessToken, payload);

      const typeLabel = credType === 'certificate' ? 'Certificate' : credType === 'skill' ? 'Skill' : 'Extracurricular Activity';
      Alert.alert(
        'Submitted for Faculty Review! ⏳',
        `Your ${typeLabel} "${credForm.title.trim()}" has been saved to the ERP.\n\nOnce reviewed and approved by faculty, it will be marked as Approved and will increase your Social Credits (+${pts} pts) and Hustle score!`,
        [{ text: 'OK' }]
      );

      setShowAddCredModal(false);
      setCredForm({
        title: '',
        category: '',
        issuer: '',
        date: new Date().toISOString().slice(0, 10),
        description: '',
        file_url: '',
      });
      setSelectedFile(null);
      fetchStudentCredentials();
    } catch (err) {
      console.warn('Error submitting credential:', err);
      Alert.alert('Submission Error', err.message || 'Could not save credential to ERP.');
    } finally {
      setIsSubmittingCred(false);
      setIsUploadingFile(false);
    }
  };

  const effectiveVenture = React.useMemo(() => {
    if (myStartups && myStartups.length > 0) return myStartups[0];
    if (user?.active_venture) return user.active_venture;
    if (erpVenture) {
      return {
        id: erpVenture.id || 2,
        name: erpVenture.title,
        tagline: erpVenture.synopsis || erpVenture.incubationNotes,
        description: erpVenture.synopsis || erpVenture.incubationNotes,
        status: erpVenture.incubationStatus || 'Selected',
        score: erpVenture.score,
        grade: erpVenture.grade,
        repoLink: erpVenture.repoLink,
        techStack: erpVenture.techStack,
        isErpVenture: true,
      };
    }
    return null;
  }, [myStartups, user?.active_venture, erpVenture]);

  const approvedSkills = React.useMemo(() => {
    return studentCredentials.filter(c => c.type === 'skill' && c.status === 'approved');
  }, [studentCredentials]);

  const pendingSkills = React.useMemo(() => {
    return studentCredentials.filter(c => c.type === 'skill' && c.status === 'pending');
  }, [studentCredentials]);

  const studentSkills = React.useMemo(() => {
    const raw = [
      ...(Array.isArray(user?.current_skills) ? user.current_skills : []),
      ...(Array.isArray(user?.currentSkills) ? user.currentSkills : []),
      ...(Array.isArray(user?.skills) ? user.skills : []),
      ...approvedSkills.map(s => s.title),
    ];
    
    const expanded = [];
    raw.forEach(item => {
      if (typeof item === 'string' && item.includes(',')) {
        item.split(',').forEach(s => {
          const t = s.trim();
          if (t) expanded.push(t);
        });
      } else if (typeof item === 'string' && item.trim()) {
        expanded.push(item.trim());
      }
    });

    const seen = new Set();
    const unique = expanded.filter(s => {
      const sL = s.toLowerCase();
      if (seen.has(sL)) return false;
      seen.add(sL);
      return true;
    });

    if (unique.length > 0) return unique;

    const c = (user?.course || '').toUpperCase();
    if (isMed || c.includes('MBBS') || c.includes('MEDIC')) {
      return ['Clinical Diagnostics', 'Patient Management', 'Emergency Care', 'Pharmacology', 'Pathology Review', 'Surgical Protocols', 'Community Medicine'];
    }
    if (c.includes('MCA') || c.includes('BCA') || c.includes('TECH') || c.includes('CS') || c.includes('SOFTWARE')) {
      return ['Software Architecture', 'Full-Stack Development', 'Data Structures & Algorithms', 'Database Systems (SQL)', 'Cloud & DevOps', 'API Design', 'Python / JavaScript', 'Problem Solving'];
    }
    if (c.includes('MBA') || c.includes('BBA') || c.includes('MANAGEMENT') || c.includes('COM') || (user?.branch || '').toUpperCase().includes('FINANCE')) {
      return ['Financial Accounting', 'Corporate Taxation', 'Tally & Busy ERP', 'Advanced Excel', 'Financial Modeling', 'Business Analytics'];
    }
    if (c.includes('PHARM')) {
      return ['Pharmaceutical Chemistry', 'Clinical Pharmacology', 'Drug Formulation', 'Biochemical Analysis', 'Regulatory Compliance'];
    }
    return ['Problem Solving', 'Team Leadership', 'Critical Thinking', 'Project Management', 'Research & Analysis'];
  }, [user, isMed, approvedSkills]);

  const academicDepartment = React.useMemo(() => {
    if (isMed) return 'Faculty of Medical Sciences';
    const course = (resolvedProg.course || user?.course || '').toUpperCase();
    const branch = (resolvedProg.branch || user?.branch || '').toUpperCase();

    if (course.includes('MBA') || course.includes('BBA') || course.includes('MCOM') || course.includes('BCOM') || branch.includes('FINANCE') || branch.includes('MANAGEMENT') || branch.includes('COMMERCE') || branch.includes('BUSINESS')) {
      return 'Department of Business & Management Studies';
    }
    if (course.includes('PHARM') || branch.includes('PHARM')) {
      return 'Faculty of Pharmacy';
    }
    if (course.includes('MCA') || course.includes('BCA')) {
      return 'Department of Computer Applications';
    }
    if (course.includes('TECH') || course.includes('ENGINEERING')) {
      if (branch.includes('ECE') || branch.includes('ELECTRONIC')) return 'Department of Electronics & Communication Engineering';
      if (branch.includes('ME') || branch.includes('MECHANIC')) return 'Department of Mechanical Engineering';
      if (branch.includes('EE') || branch.includes('ELECTRICAL')) return 'Department of Electrical Engineering';
      if (branch.includes('CIVIL')) return 'Department of Civil Engineering';
      return 'Department of Computer Science & Engineering';
    }
    if (user?.department_name && !user.department_name.includes('Computer Applications')) {
      return user.department_name;
    }
    return 'Department of Computer Applications';
  }, [user, isMed, resolvedProg]);

  const isMockTemplateActivity = (item) => {
    if (!item || typeof item !== 'string') return true;
    const s = item.toLowerCase().trim();
    return (
      s === 'technical event coordinator' ||
      s === 'debates' ||
      s === 'coding club' ||
      s === 'debates, coding club' ||
      s === 'event coordinator' ||
      s.includes('technical event coordinator') ||
      s === 'none recorded' ||
      s === 'not assigned' ||
      s === 'none' ||
      s === 'n/a'
    );
  };

  const parsedActivities = React.useMemo(() => {
    const leadArr = (Array.isArray(user?.leadership) ? user.leadership : [])
      .filter(item => !isMockTemplateActivity(item));
      
    const extraArr = (Array.isArray(user?.extracurricular) ? user.extracurricular : [])
      .filter(item => !isMockTemplateActivity(item));

    return {
      hasLeadership: leadArr.length > 0,
      leadershipText: leadArr.length > 0 ? leadArr.join(', ') : '',
      hasExtracurricular: extraArr.length > 0,
      extracurricularText: extraArr.length > 0 ? extraArr.join(', ') : '',
    };
  }, [user]);

  const approvedActivities = React.useMemo(() => {
    return studentCredentials.filter(c => c.type === 'extracurricular' && c.status === 'approved');
  }, [studentCredentials]);

  const pendingSocialActivities = React.useMemo(() => {
    return studentCredentials.filter(c => c.type === 'extracurricular' && c.status === 'pending');
  }, [studentCredentials]);

  const allSocialActivities = React.useMemo(() => {
    const leadershipItems = (Array.isArray(user?.leadership) ? user.leadership : [])
      .filter(item => !isMockTemplateActivity(item));

    const extracurricularItems = (Array.isArray(user?.extracurricular) ? user.extracurricular : [])
      .filter(item => !isMockTemplateActivity(item));

    const customApproved = approvedActivities.map(c => ({
      id: c.id,
      name: c.title,
      type: c.category || 'Extracurricular & Volunteering',
      icon: 'stars',
      points: Number(c.points) || 50,
      approved: true,
      issuer: c.issuer,
      date: c.date,
    }));

    return [
      ...leadershipItems.map(item => ({ name: item, type: 'Leadership Role', icon: 'grade', points: 50, approved: true })),
      ...extracurricularItems.map(item => ({ name: item, type: 'Extracurricular & Sports', icon: 'stars', points: 30, approved: true })),
      ...customApproved,
    ];
  }, [user, approvedActivities]);

  const totalSocialCredits = React.useMemo(() => {
    const val = Number(user?.social_credits);
    if (!isNaN(val) && val > 0) return val;
    if (allSocialActivities.length > 0) {
      return allSocialActivities.reduce((acc, a) => acc + (a.points || 40), 0);
    }
    return 0;
  }, [allSocialActivities, user?.social_credits]);

  const displayCerts = React.useMemo(() => {
    const rawCerts = [
      ...(Array.isArray(user?.certsDone) ? user.certsDone : []),
      ...(Array.isArray(user?.certificates_done) ? user.certificates_done : []),
      ...(Array.isArray(user?.certs_done) ? user.certs_done : []),
      ...(Array.isArray(user?.certsInProgress) ? user.certsInProgress : []),
      ...(Array.isArray(user?.certificates_in_progress) ? user.certificates_in_progress : []),
    ];

    const expanded = [];
    rawCerts.forEach(c => {
      if (!c) return;
      if (typeof c === 'string') {
        if (c.includes(',')) {
          c.split(',').forEach(sub => {
            const trimmed = sub.trim();
            if (trimmed) expanded.push(trimmed);
          });
        } else if (c.trim()) {
          expanded.push(c.trim());
        }
      } else if (typeof c === 'object') {
        const title = c.name || c.title || c.cert_name;
        if (title && String(title).trim()) expanded.push(String(title).trim());
      }
    });

    const seen = new Set();
    return expanded.filter(c => {
      const cl = c.toLowerCase();
      if (cl === 'yes' || cl === 'no' || cl === 'na' || cl === 'n/a' || cl === 'none' || cl === '') return false;
      if (seen.has(cl)) return false;
      seen.add(cl);
      return true;
    });
  }, [user]);

  const approvedCerts = React.useMemo(() => {
    return studentCredentials.filter(c => c.type === 'certificate' && c.status === 'approved');
  }, [studentCredentials]);

  const pendingCerts = React.useMemo(() => {
    return studentCredentials.filter(c => c.type === 'certificate' && c.status === 'pending');
  }, [studentCredentials]);

  const finalCerts = React.useMemo(() => {
    const list = [];
    if (erpCertificates.length > 0) {
      list.push(...erpCertificates.map((cert, idx) => ({
        id: cert.id || idx,
        name: cert.name || cert.title || 'Full-Stack Cloud & AI Engineering Internship',
        issuer: cert.issuer || 'SRMS CET In-House Cell',
        institution_name: cert.institution_name || 'SHRI RAM MURTI SMARAK COLLEGE OF ENGINEERING & TECHNOLOGY, BAREILLY',
        certificate_no: cert.certificate_no || 'SRMS-CERT-2026-004821',
        date: cert.issued_date ? cert.issued_date.slice(0, 10) : '2026-08-16',
        approved_by: cert.approved_by || 'Prof. (Dr.) Prabhakar Gupta',
        approver_title: cert.approver_title || 'Dean Academics & Training Cell',
        course: cert.course || user?.course || 'BCA',
        batch: cert.batch || 'Batch 2025',
        isErpCert: true,
      })));
    }
    if (approvedCerts.length > 0) {
      list.push(...approvedCerts.map((cert) => ({
        id: `approved-cred-${cert.id}`,
        name: cert.title,
        issuer: cert.issuer || 'Verified Industry / Academic Cell',
        institution_name: 'SHRI RAM MURTI SMARAK COLLEGE OF ENGINEERING & TECHNOLOGY, BAREILLY',
        certificate_no: `SRMS-CRED-2026-${String(cert.id).padStart(4, '0')}`,
        date: cert.date || (cert.created_at ? cert.created_at.slice(0, 10) : '2026-08-16'),
        approved_by: cert.reviewed_by || 'Faculty Reviewer',
        approver_title: 'Faculty / Department Cell',
        course: user?.course || 'BCA',
        batch: 'Batch 2025',
        isErpCert: true,
        file_url: cert.file_url,
      })));
    }
    if (list.length === 0 && displayCerts.length > 0) {
      list.push(...displayCerts.map((name, idx) => ({
        id: idx,
        name: name,
        issuer: `${APP_CONFIG.UNIVERSITY_SHORT_NAME} Venture Lab`,
        institution_name: 'SHRI RAM MURTI SMARAK COLLEGE OF ENGINEERING & TECHNOLOGY, BAREILLY',
        certificate_no: `SRMS-CERT-2026-00${4821 + idx}`,
        date: '2026-08-16',
        approved_by: 'Prof. (Dr.) Prabhakar Gupta',
        approver_title: 'Dean Academics & Training Cell',
        course: user?.course || 'BCA',
        batch: 'Batch 2025',
        isErpCert: true,
      })));
    }
    return list;
  }, [erpCertificates, approvedCerts, displayCerts, user?.course]);

  React.useEffect(() => {
    if (user) {
      setUserBio(getRichStudentBio(user));
    }
  }, [user, getRichStudentBio]);

  React.useEffect(() => {
    let isMounted = true;
    
    const loadData = () => {
      if (!accessToken) return;
      fetchStudentCredentials();
      connectionStatsAPI(accessToken)
        .then(res => {
          if (isMounted && res) {
            setStats(res);
          }
        })
        .catch(err => console.warn('[TalentIdentityScreen] stats error:', err));

      getStartups(accessToken, 0, 50, true)
        .then(res => {
          if (isMounted && res) {
            setMyStartups(res);
          }
        })
        .catch(err => console.warn('[TalentIdentityScreen] startups error:', err))
        .finally(() => {
          if (isMounted) setLoadingData(false);
        });

      const regNo = user?.rollno || user?.username || user?.id;
      const studentId = user?.user_id || user?.id || user?.rollno || user?.username;
      const studentCourse = (user?.course || (isMed ? 'MBBS' : 'B.Tech')).trim();

      getErpIncubationProjects(accessToken)
        .then(res => {
          if (isMounted && Array.isArray(res) && res.length > 0) {
            const myProj = res.find(p => String(p.studentRegNo) === String(regNo) || String(p.rollNo) === String(regNo));
            if (myProj) setErpVenture(myProj);
          }
        })
        .catch(() => {});

      getErpStudentCertificates(accessToken, regNo, studentCourse)
        .then(res => {
          if (isMounted && Array.isArray(res) && res.length > 0) {
            setErpCertificates(res);
          }
        })
        .catch(() => {});

      if (isTechStudent) {
        getErpGithubRepos(accessToken, regNo)
          .then(res => { if (isMounted && Array.isArray(res) && res.length > 0) setGithubRepos(res); })
          .catch(() => {});

        (async () => {
          let targetGh = githubUsername || user?.github_username;
          if (!targetGh) {
            try {
              targetGh = await AsyncStorage.getItem('@github_username');
            } catch (_) {}
          }
          if (!targetGh && (String(regNo).includes('2500141790001') || String(regNo).includes('2025107990') || /aafreen|afreen/i.test(user?.name || ''))) {
            targetGh = 'Afreen234';
          }
          if (targetGh) {
            try {
              const ghList = await fetchGitHubRepos(targetGh);
              if (isMounted && Array.isArray(ghList) && ghList.length > 0) {
                const mapped = ghList.map(r => ({
                  id: r.id,
                  title: r.name,
                  name: r.name,
                  description: r.description || 'Open Source Project',
                  repo_link: r.html_url,
                  tech_stack: [r.language, ...(r.topics || [])].filter(Boolean),
                  status: r.stargazers_count > 0 ? `${r.stargazers_count} ★` : 'VERIFIED',
                }));
                setGithubRepos(prev => {
                  const existing = new Set(prev.map(p => (p.repo_link || p.html_url || '').toLowerCase()));
                  const additions = mapped.filter(m => !existing.has((m.repo_link || '').toLowerCase()));
                  return [...prev, ...additions];
                });
              }
            } catch (_) {}
          }
        })();
      }

      getErpSeminars(accessToken, studentId)
        .then(res => { if (isMounted && Array.isArray(res)) setErpSeminars(res); })
        .catch(() => {});

      getErpTutorials(accessToken, studentId)
        .then(res => { if (isMounted && Array.isArray(res)) setErpTutorials(res); })
        .catch(() => {});

      getErpMiniProject(accessToken, studentId, studentCourse)
        .then(res => {
          if (isMounted && res) {
            const projectCourseIdentifiers = [
              ...(Array.isArray(res.courses) ? res.courses : []),
              res.course_id,
              res.course_name,
              res.discipline_type,
            ].filter(Boolean);

            if (projectCourseIdentifiers.length > 0) {
              const normStudent = studentCourse.toLowerCase().replace(/[^a-z0-9]/g, '');
              const isDirectStudent = res.student_id && String(res.student_id).toLowerCase() === String(studentId).toLowerCase();
              
              const matches = isDirectStudent || projectCourseIdentifiers.some(pc => {
                const tokens = String(pc).split(/[,;/|]+/).map(t => t.toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean);
                return tokens.some(tok => tok === normStudent || (tok.length >= 3 && normStudent.length >= 3 && (tok.includes(normStudent) || normStudent.includes(tok))));
              });

              if (matches) {
                setErpMiniProject(res);
              } else {
                setErpMiniProject(null);
              }
            } else {
              setErpMiniProject(res);
            }
          } else if (isMounted) {
            setErpMiniProject(null);
          }
        })
        .catch(() => { if (isMounted) setErpMiniProject(null); });
    };

    loadData();

    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [accessToken, navigation, user, githubUsername]);

  const handleSubmitRepo = async () => {
    if (!repoForm.title.trim() || !repoForm.repo_link.trim()) {
      Alert.alert('Required Fields', 'Please enter a project title and repository URL.');
      return;
    }
    if (!repoForm.repo_link.startsWith('http')) {
      Alert.alert('Invalid URL', 'Repository URL must start with http:// or https://');
      return;
    }
    setSubmittingRepo(true);
    try {
      const regNo = user?.rollno || user?.username || user?.id;
      const techStackArr = repoForm.tech_stack
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      await submitErpGithubRepo(accessToken, {
        title: repoForm.title.trim(),
        description: repoForm.description.trim() || 'Student Project Repository',
        repo_link: repoForm.repo_link.trim(),
        tech_stack: techStackArr.length > 0 ? techStackArr : ['React Native', 'JavaScript'],
        student_reg_no: String(regNo),
        student_name: user?.name || user?.full_name || 'Student',
      });
      Alert.alert('✅ Repository Linked!', 'Your GitHub repository is now linked to your ERP profile.');
      setShowAddRepoModal(false);
      setRepoForm({ title: '', description: '', repo_link: '', tech_stack: '' });
      const updated = await getErpGithubRepos(accessToken, regNo);
      if (Array.isArray(updated)) setGithubRepos(updated);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to submit repository');
    } finally {
      setSubmittingRepo(false);
    }
  };

  const handleGenerateBio = async () => {
    Alert.alert(
      'AI Bio Generator',
      'Would you like to refine your about section with an AI-crafted executive summary?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate with AI',
          onPress: async () => {
            const course = (user?.course || (isMed ? 'MBBS' : 'BCA')).trim();
            const branch = user?.branch || user?.department_name || (course.includes('MCA') ? 'Software Applications' : 'Computer Applications');
            const yearNum = user?.year || user?.current_year || (user?.semester ? Math.ceil(parseInt(user.semester) / 2) : 1);
            const semNum = user?.semester || (yearNum * 2 - 1);
            const cgpa = user?.cgpa ? `${user.cgpa} CGPA` : 'distinguished academic standing';
            const leadership = (user?.leadership || []).filter(Boolean).join(', ');
            const extracurricular = (user?.extracurricular || []).filter(Boolean).join(', ');

            const activityClause = leadership
              ? ` Serving as ${leadership}.${extracurricular ? ` Actively contributing to ${extracurricular}.` : ''}`
              : (extracurricular ? ` Actively contributing to ${extracurricular}.` : '');

            const generated = isMed
              ? `MBBS candidate in ${yearNum === 1 ? '1st Prof' : yearNum === 2 ? '2nd Prof' : '3rd Prof Part I'} with a ${cgpa} at ${APP_CONFIG.UNIVERSITY_NAME}. Deeply committed to clinical excellence, evidence-based diagnostic protocols, and patient-centric healthcare.${activityClause} Actively engaged in clinical rotations, hospital ward case reviews, and rural health outreach.`
              : `${course} candidate in Year ${yearNum} (Semester ${semNum}) specializing in ${branch} with a ${cgpa}.${activityClause} Passionate about developing scalable software systems, problem solving, and modern engineering practices.`;
            
            setUserBio(generated);
            if (accessToken) {
              try {
                await updateMyProfile(accessToken, { bio: generated });
              } catch (err) {
                console.warn("Failed to save bio on backend:", err);
              }
            }
            Alert.alert('Bio Updated', 'Your about section has been enhanced with an AI summary!');
          }
        }
      ]
    );
  };

  if (!user) return null;

    const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission required', 'Permission to access camera roll is required!');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
      });

      if (!pickerResult.canceled && pickerResult.assets?.length > 0) {
        setIsUploading(true);
        const res = await uploadAvatarAPI(accessToken, pickerResult.assets[0].uri);
        if (res.ok && res.json?.success) {
          updateAvatarUrl(res.json.data.avatar_url);
        } else {
          Alert.alert('Upload Failed', 'Could not upload profile picture.');
        }
      }
    } catch (e) {
      console.warn("Error picking image:", e);
      Alert.alert('Error', 'An error occurred while picking the image.');
    } finally {
      setIsUploading(false);
    }
  };

  const avatarUrl = getAvatarUrl(user?.avatar_url || user?.id || user?.email || 'me', user?.rollno);


  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={isDark ? ['#9A3412', '#7C2D12'] : ['#EA580C', '#9A3412']}
            style={styles.logoIconBg}
          >
            <MaterialIcons name="person" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.headerLogo, { color: colors.textPrimary }]}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} Profile</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('CampusJournal')}
          >
            <Image
              source={require('../../../assets/journal-logo.webp')}
              style={styles.journalIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowProfileMenu(true)} activeOpacity={0.85}>
            <SafeStudentAvatar
              uri={avatarUrl}
              rollno={user?.rollno || user?.username}
              name={user?.name || user?.full_name || 'S'}
              style={[styles.avatarSmall, { borderColor: colors.primary }]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Header Image */}
        <View style={styles.profileHeroSection}>
          <View style={[styles.profileHeroCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
            <SafeStudentAvatar
              uri={avatarUrl}
              rollno={user?.rollno || user?.username}
              name={user?.name || user?.full_name || 'S'}
              style={styles.heroImg}
            />
            <LinearGradient colors={['transparent', isDark ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.85)']} style={styles.heroOverlay}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <View>
                  <View style={[styles.eliteBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.eliteBadgeText}>PULSE ELITE</Text>
                  </View>
                  <Text style={styles.heroName}>{user?.name || 'Student'}</Text>
                </View>
                {/* Edit profile picture — clean image-edit icon */}
                <TouchableOpacity onPress={handlePickImage} style={[styles.editPicBtn, { backgroundColor: 'rgba(0,0,0,0.45)', borderColor: 'rgba(255,255,255,0.25)', borderWidth: 1 }]}>
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <MaterialIcons name="add-a-photo" size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>


        {/* Major & Batch Info */}
        <View style={styles.basicInfo}>
          <Text style={[styles.majorText, { color: colors.primary }]}>{getDisplayCourse(user)}</Text>
          <Text style={[styles.batchSubText, { color: colors.textSecondary }]}>{APP_CONFIG.CAMPUS_LOCATION}</Text>


          {/* LinkedIn-style Connections */}
          <View style={styles.networkStats}>
            <Text style={[styles.networkText, { color: isDark ? colors.primary : '#3474ec' }]}>
              <Text style={[styles.networkBold, { color: colors.textPrimary }]}>{stats.connections}</Text> Connections
            </Text>
          </View>




          <View style={styles.capsuleRow}>
            <View style={[styles.capsule, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={styles.capsuleLabel}>CURRENT YEAR</Text>
              <Text style={[styles.capsuleValue, { color: colors.textPrimary }]}>Year {user?.year || user?.current_year || (user?.semester ? Math.ceil(parseInt(user.semester) / 2) : '1')}</Text>
            </View>
            <View style={[styles.capsule, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={styles.capsuleLabel}>STUDENT ID</Text>
              <Text style={[styles.capsuleValue, { color: colors.textPrimary }]}>{user?.rollno || user?.username || (user?.id && !String(user.id).includes('-') ? user.id : 'N/A')}</Text>
            </View>
            <View style={[styles.capsule, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={styles.capsuleLabel}>VIBE CHECK</Text>
              <Text style={[styles.capsuleValue, { color: isMed ? (isDark ? '#F87171' : '#B91C1C') : (isDark ? '#2DD4BF' : '#006666') }]}>
                {isMed ? 'Clinician' : (user?.category?.toLowerCase().includes('management') || (user?.course || '').toLowerCase().includes('mba') ? 'Strategist' : (user?.category?.toLowerCase().includes('alliedhealth') ? 'Caregiver' : 'Innovator'))}
              </Text>
            </View>
          </View>

        </View>

        {/* Editable Content-Rich About / Bio Section */}
        <View style={[styles.aboutSection, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.aboutHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>About</Text>
              <View style={[styles.verifiedTag, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]}>
                <MaterialIcons name="verified" size={13} color="#3B82F6" />
                <Text style={styles.verifiedTagText}>Verified Profile</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.editBioBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]} onPress={handleGenerateBio}>
              <MaterialCommunityIcons name="auto-fix" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            {userBio}
          </Text>

          {/* Structured Highlights Grid */}
          <View style={styles.aboutHighlightsGrid}>
            <View style={[styles.aboutHighlightItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: colors.border }]}>
              <MaterialCommunityIcons name="school-outline" size={16} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.aboutHighlightLabel, { color: colors.textMuted }]}>PROGRAM & FOCUS</Text>
                <Text style={[styles.aboutHighlightValue, { color: colors.textPrimary }]}>
                  {resolvedProg.course} • {resolvedProg.branch}
                </Text>
              </View>
            </View>

            <View style={[styles.aboutHighlightItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: colors.border }]}>
              <MaterialCommunityIcons name="office-building" size={16} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.aboutHighlightLabel, { color: colors.textMuted }]}>ACADEMIC DEPARTMENT</Text>
                <Text style={[styles.aboutHighlightValue, { color: colors.textPrimary }]}>
                  {academicDepartment}
                </Text>
              </View>
            </View>

            {parsedActivities.hasLeadership && (
              <View style={[styles.aboutHighlightItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: colors.border }]}>
                <MaterialCommunityIcons name="shield-star-outline" size={16} color="#F59E0B" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.aboutHighlightLabel, { color: colors.textMuted }]}>CAMPUS LEADERSHIP</Text>
                  <Text style={[styles.aboutHighlightValue, { color: colors.textPrimary }]}>
                    {parsedActivities.leadershipText}
                  </Text>
                </View>
              </View>
            )}

            {parsedActivities.hasExtracurricular && (
              <View style={[styles.aboutHighlightItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: colors.border }]}>
                <MaterialCommunityIcons name="trophy-outline" size={16} color="#10B981" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.aboutHighlightLabel, { color: colors.textMuted }]}>EXTRACURRICULARS & CLUBS</Text>
                  <Text style={[styles.aboutHighlightValue, { color: colors.textPrimary }]}>
                    {parsedActivities.extracurricularText}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Core Competencies & Skills Section */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                {isMed ? 'Clinical Competencies' : 'Core Competencies & Skills'}
              </Text>
              <Text style={[styles.cardSubSub, { color: colors.textSecondary }]}>
                {isMed ? 'Verified medical proficiencies & practice' : 'Technical proficiencies & areas of expertise'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addCredBtn, { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(91,75,255,0.1)' : '#EEF2FF' }]}
              onPress={() => {
                setCredType('skill');
                setCredForm({ title: '', category: isMed ? 'Clinical Practice' : 'Technical Skills', issuer: '', date: new Date().toISOString().slice(0, 10), description: '', file_url: '' });
                setSelectedFile(null);
                setShowAddCredModal(true);
              }}
              activeOpacity={0.75}
            >
              <Ionicons name="add-circle" size={14} color={colors.primary} />
              <Text style={[styles.addCredBtnText, { color: colors.primary }]}>Add Skill</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.skillsContainer}>
            {studentSkills.map((skill, sIdx) => {
              const isCustomApproved = approvedSkills.some(as => as.title.toLowerCase() === skill.toLowerCase());
              return (
                <View 
                  key={sIdx} 
                  style={[
                    styles.skillBadge, 
                    { 
                      backgroundColor: isCustomApproved 
                        ? (isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5') 
                        : (isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'),
                      borderColor: isCustomApproved 
                        ? (isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0') 
                        : (isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'),
                    }
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                  <Text style={[styles.skillText, { color: colors.textPrimary }]}>{skill}</Text>
                  <View style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 6, marginLeft: 4 }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#059669' }}>✓ Approved</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {pendingSkills.length > 0 && (
            <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="time-outline" size={13} color="#D97706" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Under Review by Faculty ({pendingSkills.length})
                </Text>
              </View>
              <View style={styles.skillsContainer}>
                {pendingSkills.map((ps, pIdx) => (
                  <View 
                    key={`pending-${pIdx}`} 
                    style={[
                      styles.skillBadge, 
                      { 
                        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
                        borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
                      }
                    ]}
                  >
                    <Ionicons name="time" size={12} color="#D97706" />
                    <Text style={[styles.skillText, { color: isDark ? '#FDE68A' : '#92400E' }]}>{ps.title}</Text>
                    <View style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 6, marginLeft: 4 }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#B45309' }}>⏳ In Review</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Academic Profile & Journey removed — already shown in the hero card above */}

        {/* AI Pulse Card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Academic Performance</Text>
            <MaterialIcons name="trending-up" size={20} color={colors.primary} />
          </View>

          <View style={styles.acadGrid}>
            <View style={styles.acadItem}>
              <Text style={[styles.acadValue, { color: colors.primary }]}>{user?.cgpa || '0.0'} <Text style={[styles.acadMax, { color: colors.textMuted }]}>/ 10.0</Text></Text>
              <Text style={[styles.acadLabel, { color: colors.textMuted }]}>CUMULATIVE GPA</Text>
              <View style={[styles.pBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border }]}><View style={[styles.pFill, { width: `${(user?.cgpa || 0) * 10}%`, backgroundColor: colors.primary }]} /></View>
            </View>

            <View style={styles.acadItem}>
              <Text style={[styles.acadValue, { color: '#f59e0b' }]}>{user?.attendance || 0}%</Text>
              <Text style={[styles.acadLabel, { color: colors.textMuted }]}>ATTENDANCE</Text>
              <View style={[styles.pBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border }]}><View style={[styles.pFill, { width: `${user?.attendance || 0}%`, backgroundColor: '#f59e0b' }]} /></View>
            </View>

          </View>
        </View>


        {/* Pulse Check (Mood) — compact inline banner */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#E8F5E9', borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#A5D6A7', borderWidth: 1, paddingVertical: 12 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <MaterialIcons name="favorite" size={20} color={isDark ? '#6EE7B7' : '#2E7D32'} />
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#D1FAE5' : '#1B5E20' }}>Pulse Check</Text>
                <Text style={{ fontSize: 11, color: isDark ? '#A7F3D0' : '#388E3C' }}>Current State: Focused</Text>
              </View>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#C8E6C9' }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#D1FAE5' : '#2E7D32', letterSpacing: 0.5 }}>UPDATE</Text>
            </TouchableOpacity>
          </View>
        </View>



        {/* Social Impact Credits */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Social Impact Credits</Text>
              <Text style={[styles.cardSubSub, { color: colors.textSecondary }]}>Community Service & Volunteering</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                style={[styles.addCredBtn, { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(91,75,255,0.1)' : '#EEF2FF' }]}
                onPress={() => {
                  setCredType('extracurricular');
                  setCredForm({ title: '', category: 'Sports & Volunteering', issuer: '', date: new Date().toISOString().slice(0, 10), description: '', file_url: '' });
                  setSelectedFile(null);
                  setShowAddCredModal(true);
                }}
                activeOpacity={0.75}
              >
                <Ionicons name="add-circle" size={14} color={colors.primary} />
                <Text style={[styles.addCredBtnText, { color: colors.primary }]}>Add Activity</Text>
              </TouchableOpacity>
              <View style={[styles.scoreBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.scoreText, { color: colors.primary }]}>{totalSocialCredits} pts</Text>
              </View>
            </View>
          </View>

          {allSocialActivities.length > 0 ? (
            <View>
              <ScrollView
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                style={{ maxHeight: 310 }}
                contentContainerStyle={{ gap: 10, paddingRight: 4 }}
              >
                {allSocialActivities.map((activity, index) => (
                  <View key={index} style={[styles.proofItem, { backgroundColor: index % 2 === 0 ? colors.background : (isDark ? 'rgba(255,255,255,0.03)' : '#F3F4F6'), borderColor: colors.border, borderWidth: 1 }]}>
                    <View style={[styles.proofLeadIcon, { backgroundColor: colors.card }]}><MaterialIcons name={activity.icon} size={18} color={colors.primary} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.proofName, { color: colors.textPrimary }]}>{activity.name}</Text>
                      <Text style={[styles.proofMeta, { color: colors.textSecondary }]}>{activity.type}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#86EFAC' }}>
                        <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#15803D' }}>✓ Approved</Text>
                      </View>
                      <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>
                          +{activity.points || (totalSocialCredits > 0 ? Math.round(totalSocialCredits / allSocialActivities.length) : 40)} pts
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
              {allSocialActivities.length > 4 && (
                <Text style={{ fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 8 }}>
                  Scroll to view all {allSocialActivities.length} verified activities
                </Text>
              )}
            </View>
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <MaterialCommunityIcons name="medal-outline" size={36} color={colors.textSecondary} style={{ marginBottom: 6 }} />
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>0 Social Impact Credits</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 4, lineHeight: 16 }}>
                No campus club or volunteering activities recorded yet.
                Credits are earned through campus clubs, tech hackathons, blood donation drives, and cultural committees.
              </Text>
            </View>
          )}

          {pendingSocialActivities.length > 0 && (
            <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="time-outline" size={13} color="#D97706" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Awaiting Faculty Approval ({pendingSocialActivities.length})
                </Text>
              </View>
              <View style={{ gap: 8 }}>
                {pendingSocialActivities.map((pa, idx) => (
                  <View 
                    key={idx} 
                    style={[
                      styles.proofItem, 
                      { 
                        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#FEF3C7', 
                        borderColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FDE68A',
                        borderWidth: 1 
                      }
                    ]}
                  >
                    <View style={[styles.proofLeadIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF' }]}>
                      <Ionicons name="time" size={16} color="#D97706" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.proofName, { color: colors.textPrimary }]}>{pa.title}</Text>
                      <Text style={[styles.proofMeta, { color: colors.textSecondary }]}>{pa.category || 'Extracurricular'} • {pa.date || 'Pending Review'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#F59E0B' }}>
                        <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#92400E' }}>⏳ In Review</Text>
                      </View>
                      <View style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#B45309' }}>0 pts (Pending)</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>


        {/* Venture Lab (Black/Indigo Card) */}
        <View style={[styles.ventureLabCard, { borderColor: colors.border, borderWidth: 1 }]}>
          <LinearGradient 
            colors={isMed 
              ? (isDark ? ['#1E1B4B', '#311042'] : ['#F5F3FF', '#EDE9FE'])
              : (isDark ? ['#111827', '#0F172A'] : ['#000000', '#1A1A1A'])} 
            style={styles.ventureInner}
          >
            <View style={styles.ventureHeader}>
              <Text style={[styles.ventureTopTitle, { color: isMed ? (isDark ? '#C084FC' : '#6B21A8') : '#FFFFFF' }]}>
                {isMed ? 'Clinical Research' : 'Venture Lab'}
              </Text>
              <View style={[
                styles.activeProjectBadge, 
                effectiveVenture 
                  ? { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: '#10B981' }
                  : (isMed 
                    ? { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)', borderColor: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.2)' }
                    : { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.2)' : 'rgba(254, 152, 50, 0.15)', borderColor: isDark ? 'rgba(234, 88, 12, 0.3)' : 'rgba(254, 152, 50, 0.3)' })
              ]}>
                <Text style={[styles.activeProjectText, { color: effectiveVenture ? '#10B981' : (isMed ? (isDark ? '#C084FC' : '#6B21A8') : colors.primary) }]}>
                  {effectiveVenture ? `ACTIVE VENTURE • ${(effectiveVenture.status || 'SELECTED').toUpperCase()}` : 'INACTIVE'}
                </Text>
              </View>
            </View>

            <Text style={[styles.ventureTitle, { color: isMed ? colors.textPrimary : '#fe9832' }]}>
              {effectiveVenture 
                ? (effectiveVenture.name || effectiveVenture.title)
                : (isMed ? 'No Active Research' : 'No Active Venture')}
            </Text>
            <Text style={[styles.ventureDesc, { color: isMed ? colors.textSecondary : '#dadddf' }]}>
              {effectiveVenture 
                ? `${effectiveVenture.tagline || effectiveVenture.description || 'Full-stack Library Automation & Digital Cataloguing'}${effectiveVenture.score ? ` • Evaluated Score: ${effectiveVenture.score}/100 (Grade ${effectiveVenture.grade || 'B'})` : ''}`
                : (isMed 
                  ? 'Submit your clinical research proposal outline on the Research tab to showcase it on your profile.'
                  : 'Pitch your startup idea on the Venture tab to showcase it on your profile.')}
            </Text>
            <View style={styles.ventureActions}>
              <TouchableOpacity 
                style={[styles.vActionBtn, isMed && { backgroundColor: isDark ? '#6B21A8' : '#7C3AED' }]} 
                onPress={() => {
                  if (effectiveVenture?.repoLink) {
                    Linking.openURL(effectiveVenture.repoLink).catch(() => {});
                  } else {
                    navigation.navigate('Venture');
                  }
                }}
              >
                <Ionicons name={effectiveVenture?.repoLink ? "logo-github" : (isMed ? "journal-outline" : "link-outline")} size={14} color="#FFFFFF" />
                <Text style={styles.vActionText}>{effectiveVenture?.repoLink ? 'GitHub Repo' : (isMed ? 'Case Studies' : 'Project Proofs')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.vActionBtn, isMed && { backgroundColor: isDark ? '#6B21A8' : '#7C3AED' }]} onPress={() => navigation.navigate('Venture')}>
                <MaterialCommunityIcons name={isMed ? "clipboard-check-outline" : "rocket-launch"} size={14} color="#FFFFFF" />
                <Text style={styles.vActionText}>{effectiveVenture ? 'Startup ID: INC-002' : (isMed ? 'Logbook ID' : 'Startup ID')}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>


        {/* Certificates */}
        <View style={styles.certWrapper}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Earned Digital Certificates</Text>
              <Text style={[styles.cardSubSub, { color: colors.textSecondary }]}>Verified credentials & qualifications</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                style={[styles.addCredBtn, { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(91,75,255,0.1)' : '#EEF2FF' }]}
                onPress={() => {
                  setCredType('certificate');
                  setCredForm({ title: '', category: 'Technical Certification', issuer: '', date: new Date().toISOString().slice(0, 10), description: '', file_url: '' });
                  setSelectedFile(null);
                  setShowAddCredModal(true);
                }}
                activeOpacity={0.75}
              >
                <Ionicons name="cloud-upload-outline" size={14} color={colors.primary} />
                <Text style={[styles.addCredBtnText, { color: colors.primary }]}>Upload</Text>
              </TouchableOpacity>
              {finalCerts.length > 0 && (
                <TouchableOpacity
                  style={styles.viewAllRow}
                  onPress={() => setShowAllCertsModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.viewAllCertText, { color: colors.primary }]}>VIEW ALL</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {pendingCerts.length > 0 && (
            <View style={[styles.pendingCertContainer, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#FFFBEB', borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A', borderWidth: 1, borderRadius: 16, padding: 14, marginHorizontal: 16, marginBottom: 14 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="time-outline" size={16} color="#D97706" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#D97706', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Pending Faculty Verification ({pendingCerts.length})
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 10, lineHeight: 15 }}>
                Certificates earn +100 Social Credits & Hustle points immediately upon teacher verification.
              </Text>
              <View style={{ gap: 8 }}>
                {pendingCerts.map((pc, idx) => (
                  <View key={idx} style={[styles.proofItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6', borderWidth: 1 }]}>
                    <View style={[styles.proofLeadIcon, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' }]}>
                      <MaterialCommunityIcons name="certificate" size={18} color="#D97706" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.proofName, { color: colors.textPrimary }]}>{pc.title}</Text>
                      <Text style={[styles.proofMeta, { color: colors.textSecondary }]}>{pc.issuer || 'Issuing Authority'} • {pc.date || 'Submitted'}</Text>
                      {pc.file_url ? (
                        <TouchableOpacity onPress={() => Linking.openURL(pc.file_url)} style={{ marginTop: 2 }}>
                          <Text style={{ fontSize: 11, color: colors.primary, textDecorationLine: 'underline' }}>View Uploaded Document</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#B45309' }}>⏳ In Review</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {finalCerts.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.certScroll}>
              {finalCerts.map((cert) => (
                <TouchableOpacity 
                  key={cert.id} 
                  style={[styles.certCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setSelectedCert(cert)}
                  activeOpacity={0.85}
                >
                  <View style={styles.certParchmentCanvas}>
                    <View style={styles.certParchmentInner}>
                      <View style={styles.certCanvasHeader}>
                        <MaterialCommunityIcons name="shield-check" size={13} color="#D97706" />
                        <Text style={styles.certCanvasCollege} numberOfLines={1}>SRMS CET • BAREILLY</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 6, marginLeft: 'auto', gap: 2 }}>
                          <MaterialIcons name="verified" size={10} color="#15803D" />
                          <Text style={{ fontSize: 8.5, fontWeight: '800', color: '#15803D' }}>Approved</Text>
                        </View>
                      </View>
                      <Text style={styles.certCanvasBadge}>e-CERTIFICATE OF COMPLETION</Text>
                      <Text style={styles.certCanvasStudent} numberOfLines={1}>{user?.name || user?.full_name || 'AAFREEN KHAN'}</Text>
                      <Text style={styles.certCanvasProgram} numberOfLines={2}>{cert.name}</Text>
                      <View style={styles.certCanvasFooter}>
                        <Text style={styles.certCanvasNo}>{cert.certificate_no || 'SRMS-CERT-2026-004821'}</Text>
                        <Text style={styles.certCanvasDate}>{cert.date}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.certName, { color: colors.textPrimary }]} numberOfLines={2}>{cert.name}</Text>
                  <Text style={[styles.certIssuer, { color: colors.textSecondary }]}>{cert.issuer} • {cert.date}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={{ padding: 24, alignItems: 'center', backgroundColor: colors.card, borderRadius: 20, borderColor: colors.border, borderWidth: 1, marginHorizontal: 16 }}>
              <MaterialCommunityIcons name="certificate-outline" size={40} color={colors.textSecondary} style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>No Earned Certificates</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 4 }}>Complete courses or verify credentials to see them here.</Text>
            </View>
          )}

        </View>

        {/* GitHub Repositories & Code Portfolio (Only visible to Tech / Computer Students) */}
        {isTechStudent && (
          <View style={styles.certWrapper}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Code Repositories</Text>
                <Text style={[styles.cardSubSub, { color: colors.textSecondary }]}>GitHub & Project Portfolios</Text>
              </View>
              <TouchableOpacity
                style={[styles.linkRepoBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowAddRepoModal(true)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="github" size={16} color="#FFFFFF" />
                <Text style={styles.linkRepoBtnText}>+ Link Repo</Text>
              </TouchableOpacity>
            </View>

            {githubRepos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.certScroll}>
                {githubRepos.map((repo, idx) => (
                  <View
                    key={repo.id || idx}
                    style={[styles.repoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.repoHeader}>
                      <MaterialCommunityIcons name="source-repository" size={20} color={colors.primary} />
                      <View style={[styles.repoStatusBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#DCFCE7' }]}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: '#10B981' }}>{repo.status || 'VERIFIED'}</Text>
                      </View>
                    </View>
                    <Text style={[styles.repoTitle, { color: colors.textPrimary }]} numberOfLines={1}>{repo.title || 'Repository'}</Text>
                    <Text style={[styles.repoDesc, { color: colors.textSecondary }]} numberOfLines={2}>{repo.description || 'Student Open Source Project'}</Text>
                    
                    {Array.isArray(repo.tech_stack) && repo.tech_stack.length > 0 && (
                      <View style={styles.repoTagsRow}>
                        {repo.tech_stack.slice(0, 3).map((tag, tIdx) => (
                          <View key={tIdx} style={[styles.repoTagChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
                            <Text style={[styles.repoTagText, { color: colors.textSecondary }]}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {repo.repo_link && (
                      <TouchableOpacity
                        style={[styles.repoOpenBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF', borderColor: colors.primary }]}
                        onPress={() => Linking.openURL(repo.repo_link)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="logo-github" size={14} color={colors.primary} />
                        <Text style={[styles.repoOpenBtnText, { color: colors.primary }]}>View Code</Text>
                        <MaterialIcons name="open-in-new" size={12} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <TouchableOpacity
                style={[styles.repoEmptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowAddRepoModal(true)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="github" size={36} color={colors.primary} style={{ marginBottom: 6 }} />
                <Text style={[styles.repoEmptyTitle, { color: colors.textPrimary }]}>Link Your GitHub Projects</Text>
                <Text style={[styles.repoEmptySub, { color: colors.textSecondary }]}>Showcase code repositories and link them with your ERP academic profile.</Text>
                <View style={[styles.linkRepoInlineBtn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.linkRepoBtnText}>+ Add GitHub Project</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Evaluated Academic Logbook & Mini Projects */}
        {(erpMiniProject || erpSeminars.length > 0 || erpTutorials.length > 0) && (
          <View style={styles.certWrapper}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Academic Assessments</Text>
                <Text style={[styles.cardSubSub, { color: colors.textSecondary }]}>Mini Projects, Seminars & Tutorials</Text>
              </View>
            </View>

            {erpMiniProject && (
              <View style={[styles.academicCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 10 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="folder-special" size={18} color={colors.primary} />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>MINI PROJECT</Text>
                  </View>
                  <View style={[styles.repoStatusBadge, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }]}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: colors.primary }}>{erpMiniProject.status || 'IN PROGRESS'}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 6 }}>{erpMiniProject.title || erpMiniProject.project_title || 'Assigned Mini Project'}</Text>
                {erpMiniProject.description && (
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={2}>{erpMiniProject.description}</Text>
                )}
                {/* Course Association Chips */}
                {(Array.isArray(erpMiniProject.courses) ? erpMiniProject.courses.length > 0 : !!erpMiniProject.course_id) && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted }}>COURSES:</Text>
                    {(Array.isArray(erpMiniProject.courses) ? erpMiniProject.courses : String(erpMiniProject.course_id || '').split(/[,;/|]+/)).map((cItem, cIdx) => {
                      const trimmed = (cItem || '').trim();
                      if (!trimmed) return null;
                      return (
                        <View key={cIdx} style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textSecondary }}>{trimmed}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
                {erpMiniProject.marks !== undefined && erpMiniProject.marks !== null && (
                  <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="grade" size={14} color="#10B981" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#10B981' }}>Score: {erpMiniProject.marks}/100</Text>
                  </View>
                )}
              </View>
            )}

            {erpSeminars.slice(0, 2).map((sem, idx) => (
              <View key={idx} style={[styles.academicCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 8 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted }}>SEMINAR PRESENTATION</Text>
                  <View style={[styles.repoStatusBadge, { backgroundColor: sem.evaluated ? '#DCFCE7' : '#FEF3C7' }]}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: sem.evaluated ? '#10B981' : '#D97706' }}>
                      {sem.evaluated ? 'EVALUATED' : 'SUBMITTED'}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginTop: 4 }}>{sem.topic || sem.title || 'Seminar'}</Text>
                {sem.marks && <Text style={{ fontSize: 11, fontWeight: '600', color: '#10B981', marginTop: 2 }}>Marks: {sem.marks}</Text>}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* All Digital Certificates Modal */}
      <Modal
        visible={showAllCertsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAllCertsModal(false)}
      >
        <View style={styles.certModalOverlay}>
          <View style={[styles.certModalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.certModalHeader}>
              <View>
                <Text style={[styles.certModalTitle, { color: colors.textPrimary }]}>Digital Certificates</Text>
                <Text style={[styles.certModalSub, { color: colors.textSecondary }]}>
                  {finalCerts.length} Verified Credentials
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.certModalCloseBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]}
                onPress={() => {
                  setShowAllCertsModal(false);
                  setExpandedCertId(null);
                }}
              >
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, gap: 10 }}>
              {finalCerts.map((cert) => {
                const isExpanded = expandedCertId === cert.id;
                return (
                  <View
                    key={cert.id}
                    style={[
                      styles.certModalItem,
                      {
                        backgroundColor: isDark ? colors.background : '#F9FAFB',
                        borderColor: isExpanded ? colors.primary : colors.border,
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        padding: 12,
                      }
                    ]}
                  >
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => {
                        setExpandedCertId(prev => prev === cert.id ? null : cert.id);
                      }}
                      activeOpacity={0.85}
                    >
                      <View style={styles.certModalItemBadgeIcon}>
                        <MaterialCommunityIcons name="certificate" size={26} color="#5B4BFF" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          <MaterialIcons name="verified" size={14} color="#10B981" />
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#10B981' }}>VERIFIED CREDENTIAL</Text>
                        </View>
                        <Text style={[styles.certModalItemName, { color: colors.textPrimary }]}>{cert.name}</Text>
                        <Text style={[styles.certModalItemIssuer, { color: colors.textSecondary }]}>
                          {cert.issuer} • {cert.date}
                        </Text>
                      </View>
                      <MaterialIcons
                        name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                        size={24}
                        color={isExpanded ? colors.primary : colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {/* Accordion Expanded Official Certificate Parchment */}
                    {isExpanded && (
                      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                        <View style={styles.modalParchmentCanvas}>
                          <View style={styles.modalParchmentInner}>
                            <View style={styles.modalCertTopBadge}>
                              <MaterialCommunityIcons name="medal" size={28} color="#D97706" />
                              <Text style={styles.modalCertCollegeName}>
                                {cert.institution_name || 'SHRI RAM MURTI SMARAK COLLEGE OF ENGINEERING & TECHNOLOGY, BAREILLY'}
                              </Text>
                              <Text style={styles.modalCertRibbon}>OFFICIAL e-CERTIFICATE OF COMPLETION</Text>
                            </View>

                            <Text style={styles.modalCertAwardedText}>This digital certificate is proudly awarded to</Text>
                            <View style={styles.modalCertNameUnderline}>
                              <Text style={styles.modalCertStudentName}>{user?.name || user?.full_name || 'AAFREEN KHAN'}</Text>
                            </View>
                            <Text style={styles.modalCertSubDetail}>
                              Roll No: {user?.rollno || user?.username || '2500141790001'} • {cert.course || user?.course || 'BCA'}
                            </Text>

                            <Text style={styles.modalCertCompletionText}>for outstanding performance and successful capstone completion in</Text>
                            <Text style={styles.modalCertProgramTitle}>{cert.name}</Text>

                            <View style={styles.modalCertDivider} />

                            <View style={styles.modalCertMetaRow}>
                              <View style={{ alignItems: 'flex-start' }}>
                                <Text style={styles.modalCertMetaLabel}>Certificate No.</Text>
                                <Text style={styles.modalCertMetaValue}>{cert.certificate_no || 'SRMS-CERT-2026-004821'}</Text>
                                <Text style={[styles.modalCertMetaLabel, { marginTop: 4 }]}>Issued: {cert.date || '2026-08-16'}</Text>
                              </View>
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.modalCertSigner}>{cert.approved_by || 'Prof. (Dr.) Prabhakar Gupta'}</Text>
                                <Text style={styles.modalCertSignerTitle}>{cert.approver_title || 'Dean Academics & Training'}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                  <MaterialIcons name="verified" size={14} color="#10B981" />
                                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#10B981' }}>DIGITALLY VERIFIED</Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Single Certificate Detail Viewer */}
      <Modal
        visible={!!selectedCert}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedCert(null)}
      >
        <View style={styles.certDetailOverlay}>
          <View style={[styles.certDetailContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.certDetailCloseBtn}
              onPress={() => setSelectedCert(null)}
            >
              <Ionicons name="close-circle" size={30} color={colors.textPrimary} />
            </TouchableOpacity>
            {selectedCert && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 14 }}>
                <View style={styles.modalParchmentCanvas}>
                  <View style={styles.modalParchmentInner}>
                    <View style={styles.modalCertTopBadge}>
                      <MaterialCommunityIcons name="medal" size={28} color="#D97706" />
                      <Text style={styles.modalCertCollegeName}>
                        {selectedCert.institution_name || 'SHRI RAM MURTI SMARAK COLLEGE OF ENGINEERING & TECHNOLOGY, BAREILLY'}
                      </Text>
                      <Text style={styles.modalCertRibbon}>OFFICIAL e-CERTIFICATE OF COMPLETION</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', borderColor: '#86EFAC', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'center', marginTop: 6, gap: 4 }}>
                        <MaterialIcons name="verified" size={13} color="#15803D" />
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#15803D', letterSpacing: 0.5 }}>FACULTY VERIFIED & APPROVED</Text>
                      </View>
                    </View>

                    <Text style={styles.modalCertAwardedText}>This digital certificate is proudly awarded to</Text>
                    <View style={styles.modalCertNameUnderline}>
                      <Text style={styles.modalCertStudentName}>{user?.name || user?.full_name || 'AAFREEN KHAN'}</Text>
                    </View>
                    <Text style={styles.modalCertSubDetail}>
                      Roll No: {user?.rollno || user?.username || '2500141790001'} • {selectedCert.course || user?.course || 'BCA'}
                    </Text>

                    <Text style={styles.modalCertCompletionText}>for outstanding performance and successful capstone completion in</Text>
                    <Text style={styles.modalCertProgramTitle}>{selectedCert.name}</Text>

                    <View style={styles.modalCertDivider} />

                    <View style={styles.modalCertMetaRow}>
                      <View style={{ alignItems: 'flex-start' }}>
                        <Text style={styles.modalCertMetaLabel}>Certificate No.</Text>
                        <Text style={styles.modalCertMetaValue}>{selectedCert.certificate_no || 'SRMS-CERT-2026-004821'}</Text>
                        <Text style={[styles.modalCertMetaLabel, { marginTop: 4 }]}>Issued: {selectedCert.date || '2026-08-16'}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.modalCertSigner}>{selectedCert.approved_by || 'Prof. (Dr.) Prabhakar Gupta'}</Text>
                        <Text style={styles.modalCertSignerTitle}>{selectedCert.approver_title || 'Dean Academics & Training'}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <MaterialIcons name="verified" size={14} color="#10B981" />
                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#10B981' }}>DIGITALLY VERIFIED</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={{ paddingHorizontal: 6, marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>Verified Credential</Text>
                      <Text style={{ fontSize: 11, color: colors.textSecondary }}>Institutional In-House E-Certificate</Text>
                    </View>
                    <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#15803D' }}>AUTHENTIC ERP</Text>
                    </View>
                  </View>
                </View>

                {/* Share / Download Row */}
                <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 6, marginTop: 14 }}>
                  <TouchableOpacity
                    style={[
                      styles.certActionBtn,
                      { backgroundColor: isDark ? 'rgba(91,75,255,0.15)' : '#EEF0FF', flex: 1 },
                    ]}
                    onPress={async () => {
                      if (!selectedCert) return;
                      try {
                        await Share.share({
                          title: `${selectedCert.name} — ${APP_CONFIG.UNIVERSITY_SHORT_NAME || 'SRMS CET'}`,
                          message:
                            `🏆 OFFICIAL E-CERTIFICATE OF COMPLETION\n` +
                            `${selectedCert.institution_name || 'SRMS College of Engineering & Technology, Bareilly'}\n\n` +
                            `This certificate is proudly awarded to\n` +
                            `${(user?.name || user?.full_name || '').toUpperCase()}\n` +
                            `Roll No: ${user?.rollno || user?.username} • ${selectedCert.course || user?.course}\n\n` +
                            `for outstanding performance and successful completion of:\n` +
                            `"${selectedCert.name}"\n\n` +
                            `Certificate No: ${selectedCert.certificate_no || 'N/A'}\n` +
                            `Issued: ${selectedCert.date || 'N/A'}\n` +
                            `Approved by: ${selectedCert.approved_by || 'Dean Academics & Training Cell'}\n\n` +
                            `✅ Digitally Verified — Institutional In-House ERP Certificate`,
                        });
                      } catch (err) {
                        console.warn('Share error:', err.message);
                      }
                    }}
                  >
                    <MaterialIcons name="share" size={18} color={colors.primary} />
                    <Text style={[styles.certActionBtnText, { color: colors.primary }]}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.certActionBtn,
                      { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#DCFCE7', flex: 1 },
                    ]}
                    onPress={() => {
                      Alert.alert(
                        '📥 Download Certificate',
                        'Your certificate is an institutional digital credential. To save it:\n\n• Tap Share and use "Save to Files" (iOS) or send to email.\n• The certificate details above are your official record.',
                        [{ text: 'OK' }]
                      );
                    }}
                  >
                    <MaterialIcons name="download" size={18} color="#10B981" />
                    <Text style={[styles.certActionBtnText, { color: '#10B981' }]}>Download</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Link GitHub Repository Modal */}
      {isTechStudent && (
        <Modal
          visible={showAddRepoModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddRepoModal(false)}
        >
          <View style={styles.certModalOverlay}>
            <View style={[styles.certModalContent, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: '85%' }]}>
              <View style={styles.certModalHeader}>
                <View>
                  <Text style={[styles.certModalTitle, { color: colors.textPrimary }]}>Link GitHub Repo</Text>
                  <Text style={[styles.certModalSub, { color: colors.textSecondary }]}>Save to your ERP Academic Portfolio</Text>
                </View>
                <TouchableOpacity
                  style={[styles.certModalCloseBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]}
                  onPress={() => setShowAddRepoModal(false)}
                >
                  <Ionicons name="close" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14 }}>
                <View>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Project Title *</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', borderColor: colors.border, color: colors.textPrimary }]}
                    placeholder="e.g. AI Medical Diagnostic System"
                    placeholderTextColor={colors.textSecondary}
                    value={repoForm.title}
                    onChangeText={(t) => setRepoForm(prev => ({ ...prev, title: t }))}
                  />
                </View>

                <View>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Repository URL *</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', borderColor: colors.border, color: colors.textPrimary }]}
                    placeholder="https://github.com/username/repository"
                    placeholderTextColor={colors.textSecondary}
                    value={repoForm.repo_link}
                    onChangeText={(t) => setRepoForm(prev => ({ ...prev, repo_link: t }))}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>

                <View>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Tech Stack (Comma Separated)</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', borderColor: colors.border, color: colors.textPrimary }]}
                    placeholder="e.g. React, Node.js, PostgreSQL"
                    placeholderTextColor={colors.textSecondary}
                    value={repoForm.tech_stack}
                    onChangeText={(t) => setRepoForm(prev => ({ ...prev, tech_stack: t }))}
                  />
                </View>

                <View>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Description</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', borderColor: colors.border, color: colors.textPrimary, height: 80 }]}
                    placeholder="Brief summary of your project and implementation..."
                    placeholderTextColor={colors.textSecondary}
                    value={repoForm.description}
                    onChangeText={(t) => setRepoForm(prev => ({ ...prev, description: t }))}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitRepoBtn, { backgroundColor: colors.primary, opacity: submittingRepo ? 0.7 : 1 }]}
                  onPress={handleSubmitRepo}
                  disabled={submittingRepo}
                  activeOpacity={0.85}
                >
                  {submittingRepo ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="cloud-upload" size={18} color="#FFFFFF" />
                      <Text style={styles.submitRepoBtnText}>Submit & Link to ERP</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Add Credential Modal (Certificates, Skills, Extracurricular Activities) */}
      <Modal
        visible={showAddCredModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddCredModal(false)}
      >
        <View style={styles.certModalOverlay}>
          <View style={[styles.certModalContent, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: '90%' }]}>
            <View style={styles.certModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.certModalTitle, { color: colors.textPrimary }]}>
                  {credType === 'certificate' ? 'Upload Certificate' : credType === 'skill' ? 'Add Competency / Skill' : 'Add Extracurricular Activity'}
                </Text>
                <Text style={[styles.certModalSub, { color: colors.textSecondary }]}>
                  ERP Verification & Crediting Workflow
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.certModalCloseBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]}
                onPress={() => setShowAddCredModal(false)}
              >
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Credential Type Switcher Tabs */}
            <View style={styles.credTypeTabs}>
              <TouchableOpacity
                style={[
                  styles.credTypeTab,
                  credType === 'certificate' && { backgroundColor: colors.primary, borderColor: colors.primary },
                  credType !== 'certificate' && { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F3F4F6' }
                ]}
                onPress={() => {
                  setCredType('certificate');
                  setCredForm(prev => ({ ...prev, category: 'Technical Certification' }));
                }}
              >
                <MaterialCommunityIcons name="certificate" size={15} color={credType === 'certificate' ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.credTypeTabText, { color: credType === 'certificate' ? '#FFFFFF' : colors.textSecondary }]}>Certificate (+100)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.credTypeTab,
                  credType === 'skill' && { backgroundColor: colors.primary, borderColor: colors.primary },
                  credType !== 'skill' && { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F3F4F6' }
                ]}
                onPress={() => {
                  setCredType('skill');
                  setCredForm(prev => ({ ...prev, category: isMed ? 'Clinical Practice' : 'Technical Skills' }));
                }}
              >
                <Ionicons name="bulb-outline" size={15} color={credType === 'skill' ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.credTypeTabText, { color: credType === 'skill' ? '#FFFFFF' : colors.textSecondary }]}>Skill (+25)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.credTypeTab,
                  credType === 'extracurricular' && { backgroundColor: colors.primary, borderColor: colors.primary },
                  credType !== 'extracurricular' && { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F3F4F6' }
                ]}
                onPress={() => {
                  setCredType('extracurricular');
                  setCredForm(prev => ({ ...prev, category: 'Sports & Volunteering' }));
                }}
              >
                <Ionicons name="trophy-outline" size={15} color={credType === 'extracurricular' ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.credTypeTabText, { color: credType === 'extracurricular' ? '#FFFFFF' : colors.textSecondary }]}>Activity (+50)</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
              {/* Info Notice */}
              <View style={[styles.credNoticeBox, { backgroundColor: isDark ? 'rgba(91,75,255,0.08)' : '#EEF2FF', borderColor: isDark ? 'rgba(91,75,255,0.2)' : '#C7D2FE' }]}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} style={{ marginTop: 1 }} />
                <Text style={[styles.credNoticeText, { color: isDark ? '#C7D2FE' : '#3730A3' }]}>
                  {credType === 'certificate'
                    ? 'Submit your certificate or internship completion. Once approved by faculty, +100 Social Credits & Hustle points are added to your verified profile.'
                    : credType === 'skill'
                    ? 'Add a proficiency, clinical or technical skill. Upon teacher verification, +25 Social Credits & Hustle points will be awarded.'
                    : 'Submit your participation in campus clubs, cultural fests, sports, or volunteering. Upon teacher approval, +50 Social Credits are credited.'}
                </Text>
              </View>

              {/* Title Field */}
              <View>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                  {credType === 'certificate' ? 'Certificate / Course Title *' : credType === 'skill' ? 'Skill / Competency Name *' : 'Activity / Event Title *'}
                </Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder={credType === 'certificate' ? 'e.g. AWS Certified Cloud Practitioner' : credType === 'skill' ? 'e.g. Full-Stack Web Development (Next.js)' : 'e.g. Annual Inter-College Coding Hackathon'}
                  placeholderTextColor={colors.textSecondary}
                  value={credForm.title}
                  onChangeText={(t) => setCredForm(prev => ({ ...prev, title: t }))}
                />
              </View>

              {/* Category Field */}
              <View>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Domain / Category</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder={credType === 'certificate' ? 'e.g. Cloud Computing / AI / Healthcare' : credType === 'skill' ? 'e.g. Technical / Soft Skill / Diagnostic' : 'e.g. Cultural / Sports / Volunteering / Leadership'}
                  placeholderTextColor={colors.textSecondary}
                  value={credForm.category}
                  onChangeText={(t) => setCredForm(prev => ({ ...prev, category: t }))}
                />
              </View>

              {/* Issuer / Organization */}
              {credType !== 'skill' && (
                <View>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                    {credType === 'certificate' ? 'Issuing Organization / Authority' : 'Organizing Body / Club'}
                  </Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', borderColor: colors.border, color: colors.textPrimary }]}
                    placeholder={credType === 'certificate' ? 'e.g. Amazon Web Services / Coursera / Google' : 'e.g. SRMS Tech Club / Rotary Youth'}
                    placeholderTextColor={colors.textSecondary}
                    value={credForm.issuer}
                    onChangeText={(t) => setCredForm(prev => ({ ...prev, issuer: t }))}
                  />
                </View>
              )}

              {/* Date Field */}
              <View>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Date Achieved / Participated</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                  value={credForm.date}
                  onChangeText={(t) => setCredForm(prev => ({ ...prev, date: t }))}
                />
              </View>

              {/* Description */}
              <View>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Description & Highlights (Optional)</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', borderColor: colors.border, color: colors.textPrimary, height: 70 }]}
                  placeholder="Key learnings, achievements, or project scope..."
                  placeholderTextColor={colors.textSecondary}
                  value={credForm.description}
                  onChangeText={(t) => setCredForm(prev => ({ ...prev, description: t }))}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Document / Image Attachment (Proof is strictly mandatory) */}
              <View>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                  {credType === 'certificate' ? 'Certificate Proof (PDF or Photo) *' : 'Verification Proof (Document, Photo, or Link) *'}
                </Text>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <TouchableOpacity
                    style={[styles.attachBtn, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB' }]}
                    onPress={handlePickCredDocument}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                    <Text style={[styles.attachBtnText, { color: colors.textPrimary }]}>Choose PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.attachBtn, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB' }]}
                    onPress={handlePickCredImage}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="image-outline" size={18} color={colors.primary} />
                    <Text style={[styles.attachBtnText, { color: colors.textPrimary }]}>Choose Photo</Text>
                  </TouchableOpacity>
                </View>

                {selectedFile && (
                  <View style={[styles.selectedFilePill, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5', borderColor: '#10B981' }]}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={[styles.selectedFileName, { color: isDark ? '#A7F3D0' : '#065F46' }]} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedFile(null)}>
                      <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Alternative URL field */}
                <TextInput
                  style={[styles.inputField, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', borderColor: colors.border, color: colors.textPrimary, marginTop: 8 }]}
                  placeholder="Or paste online verification URL (https://...)"
                  placeholderTextColor={colors.textSecondary}
                  value={credForm.file_url}
                  onChangeText={(t) => setCredForm(prev => ({ ...prev, file_url: t }))}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitCredBtn, { backgroundColor: colors.primary, opacity: isSubmittingCred ? 0.7 : 1, marginTop: 10 }]}
                onPress={handleCredentialSubmit}
                disabled={isSubmittingCred}
                activeOpacity={0.85}
              >
                {isSubmittingCred ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
                    <Text style={styles.submitCredBtnText}>Submit to ERP for Faculty Approval</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Profile Dropdown Modal */}
      <ProfileDropdownModal
        visible={showProfileMenu}
        onClose={() => setShowProfileMenu(false)}
        navigation={navigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLogo: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    padding: 8,
  },
  journalIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
  },

  scroll: {
    paddingBottom: 20,
  },
  profileHeroSection: {
    padding: 16,
  },
  profileHeroCard: {
    height: 320,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },

  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'flex-end',
    padding: 24,
  },
  eliteBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'baseline',
    marginBottom: 8,
  },
  eliteBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  heroName: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  basicInfo: {
    paddingHorizontal: 16,
  },
  majorText: {
    fontSize: 18,
    fontWeight: '800',
  },

  batchSubText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  capsuleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  capsule: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
  },

  capsuleLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  capsuleValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },

  aiPulseWrap: {
    padding: 16,
    marginTop: 8,
  },
  aiPulseInner: {
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  orangeBorder: {
    position: 'absolute',
    inset: 0,
    borderWidth: 1.5,
    borderColor: '#fe9832',
    borderRadius: 24,
  },
  aiSparkleBox: {
    width: 64,
    height: 64,
    backgroundColor: '#fe983220',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiPulseTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
    marginBottom: 12,
  },
  aiPulseText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16, paddingLeft: 20,
    paddingRight: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',

  },
  cardSubSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  acadGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  acadItem: {
    flex: 1,
  },
  acadValue: {
    fontSize: 28,
    fontWeight: '900',
  },

  acadMax: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  acadLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },

  pBar: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  pFill: {
    height: '100%',
    borderRadius: 2,
  },

  tealDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pulseSubText: {
    fontSize: 13,
  },

  wellbeingContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  wellbeingState: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
  },
  updateMoodBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  updateMoodText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },


  scoreBadge: {
    backgroundColor: '#cbceff60',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 15,
    fontWeight: '900',
  },

  proofList: {
    gap: 12,
  },
  proofItem: {
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  proofLeadIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proofName: {
    fontSize: 14,
    fontWeight: '800',
  },

  proofMeta: {
    fontSize: 11,
    marginTop: 2,
  },

  viewProofText: {
    fontSize: 9,
    fontWeight: '800',
  },

  ventureLabCard: {
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  ventureInner: {
    padding: 24,
  },
  ventureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ventureTopTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeProjectBadge: {
    backgroundColor: 'rgba(254, 152, 50, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(254, 152, 50, 0.3)',
  },
  activeProjectText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  ventureTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fe9832',
    marginTop: 16,
  },
  ventureDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 20,
    marginTop: 10,
  },
  ventureActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  vActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
  },
  vActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  certWrapper: {
    marginTop: 20,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllCertText: {
    fontSize: 11,
    fontWeight: '800',
  },
  certScroll: {
    paddingLeft: 16,
    paddingRight: 16,
    gap: 16,
  },
  certCard: {
    width: 250,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    elevation: 4,
  },
  certParchmentCanvas: {
    width: '100%',
    height: 150,
    backgroundColor: '#FAF9F6',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#2D2575',
    padding: 6,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  certParchmentInner: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D97706',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 6,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
  },
  certCanvasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
  },
  certCanvasCollege: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#2D2575',
    letterSpacing: 0.5,
  },
  certCanvasBadge: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#F36C21',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  certCanvasStudent: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1B1E28',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  certCanvasProgram: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#4E5969',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  certCanvasFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    borderTopWidth: 0.5,
    borderTopColor: '#E2E8F0',
    paddingTop: 3,
  },
  certCanvasNo: {
    fontSize: 8,
    fontWeight: '700',
    color: '#5B4BFF',
  },
  certCanvasDate: {
    fontSize: 8,
    fontWeight: '600',
    color: '#64748B',
  },
  certImg: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  certName: {
    fontSize: 16,
    fontWeight: '800',
  },
  certIssuer: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },

  networkStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  networkText: {
    fontSize: 14,
  },

  networkBold: {
    fontWeight: '800',
  },
  networkDivider: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  aboutSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  aboutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: '800',
  },

  editBioBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
  },
  aboutHighlightsGrid: {
    marginTop: 16,
    gap: 10,
  },
  aboutHighlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  aboutHighlightLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  aboutHighlightValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  skillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  journeyGrid: {
    gap: 12,
  },
  journeyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  journeyLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  journeyVal: {
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 3,
  },
  // Certificate Modals
  certModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  certModalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '85%',
  },
  certModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.15)',
  },
  certModalTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  certModalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  certModalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  certModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  certModalItemImg: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  certModalItemBadgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(91, 75, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalParchmentCanvas: {
    backgroundColor: '#FAF9F6',
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#2D2575',
    padding: 10,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  modalParchmentInner: {
    borderWidth: 1.5,
    borderColor: '#D97706',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
  },
  modalCertTopBadge: {
    alignItems: 'center',
    marginBottom: 8,
  },
  modalCertCollegeName: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2D2575',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 4,
    paddingHorizontal: 8,
  },
  modalCertRibbon: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#F36C21',
    letterSpacing: 1,
    marginTop: 3,
    textTransform: 'uppercase',
  },
  modalCertAwardedText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#64748B',
    marginTop: 8,
  },
  modalCertNameUnderline: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#5B4BFF',
    paddingBottom: 2,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  modalCertStudentName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1B1E28',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalCertSubDetail: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    marginTop: 4,
  },
  modalCertCompletionText: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#64748B',
    marginTop: 10,
    textAlign: 'center',
  },
  modalCertProgramTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D2575',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
  },
  modalCertDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  modalCertMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  modalCertMetaLabel: {
    fontSize: 9,
    color: '#64748B',
  },
  modalCertMetaValue: {
    fontSize: 10,
    fontWeight: '800',
    color: '#5B4BFF',
  },
  modalCertSigner: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1B1E28',
  },
  modalCertSignerTitle: {
    fontSize: 8.5,
    color: '#64748B',
  },
  certModalItemName: {
    fontSize: 14,
    fontWeight: '800',
  },
  certModalItemIssuer: {
    fontSize: 12,
    marginTop: 2,
  },
  certActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  certActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  certDetailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  certDetailContent: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  certDetailCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 15,
  },
  certDetailImg: {
    width: '100%',
    height: 200,
  },
  certDetailTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  certDetailIssuer: {
    fontSize: 13,
    marginTop: 2,
  },
  linkRepoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  linkRepoBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  repoCard: {
    width: width * 0.72,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginRight: 12,
  },
  repoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  repoStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  repoTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  repoDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  repoTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  repoTagChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  repoTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  repoOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  repoOpenBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  repoEmptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  repoEmptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  repoEmptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  linkRepoInlineBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  academicCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputField: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  submitRepoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
  },
  submitRepoBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  addCredBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  addCredBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  credTypeTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  credTypeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  credTypeTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  credNoticeBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  credNoticeText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
  },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  attachBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  selectedFilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  selectedFileName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  submitCredBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  submitCredBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  pendingCertContainer: {
    marginTop: 6,
  },
});

export default TalentIdentityScreen;
