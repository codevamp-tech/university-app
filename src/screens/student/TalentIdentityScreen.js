import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Modal, ActivityIndicator, Alert, Switch, TextInput, Linking
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  uploadAvatarAPI, updateMyProfile, connectionStatsAPI, getStartups,
  getErpGithubRepos, submitErpGithubRepo, getErpSeminars, getErpTutorials, getErpMiniProject,
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
  const { user, accessToken, updateAvatarUrl } = useUser();
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

    let leadership = '';
    let extracurricular = '';
    if (currentBio.includes('Leadership:') || currentBio.includes('Extracurricular:')) {
      const lMatch = currentBio.match(/Leadership:\s*([^|]+)/i);
      const eMatch = currentBio.match(/Extracurricular:\s*(.+)/i);
      if (lMatch && lMatch[1].trim()) leadership = lMatch[1].trim();
      if (eMatch && eMatch[1].trim()) extracurricular = eMatch[1].trim();
    }
    if (!leadership && u.leadership && u.leadership.length > 0) {
      leadership = u.leadership.filter(Boolean).join(', ');
    }
    if (!extracurricular && u.extracurricular && u.extracurricular.length > 0) {
      extracurricular = u.extracurricular.filter(Boolean).join(', ');
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
  const [loadingData, setLoadingData] = React.useState(true);
  const [showAllCertsModal, setShowAllCertsModal] = React.useState(false);
  const [selectedCert, setSelectedCert] = React.useState(null);
  const [githubRepos, setGithubRepos] = React.useState([]);
  const [erpSeminars, setErpSeminars] = React.useState([]);
  const [erpTutorials, setErpTutorials] = React.useState([]);
  const [erpMiniProject, setErpMiniProject] = React.useState(null);
  const [showAddRepoModal, setShowAddRepoModal] = React.useState(false);
  const [repoForm, setRepoForm] = React.useState({ title: '', description: '', repo_link: '', tech_stack: '' });
  const [submittingRepo, setSubmittingRepo] = React.useState(false);

  const studentSkills = React.useMemo(() => {
    const raw = [
      ...(Array.isArray(user?.current_skills) ? user.current_skills : []),
      ...(Array.isArray(user?.currentSkills) ? user.currentSkills : []),
      ...(Array.isArray(user?.skills) ? user.skills : []),
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
  }, [user, isMed]);

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

  const parsedActivities = React.useMemo(() => {
    let leadership = '';
    let extracurricular = '';
    const bioText = user?.bio || '';
    if (bioText.includes('Leadership:') || bioText.includes('Extracurricular:')) {
      const lMatch = bioText.match(/Leadership:\s*([^|]+)/i);
      const eMatch = bioText.match(/Extracurricular:\s*(.+)/i);
      if (lMatch && lMatch[1].trim()) leadership = lMatch[1].trim();
      if (eMatch && eMatch[1].trim()) extracurricular = eMatch[1].trim();
    }

    const leadArr = (Array.isArray(user?.leadership) && user.leadership.length > 0)
      ? user.leadership
      : (leadership ? leadership.split(',').map(s => s.trim()).filter(Boolean) : []);
      
    const extraArr = (Array.isArray(user?.extracurricular) && user.extracurricular.length > 0)
      ? user.extracurricular
      : (extracurricular ? extracurricular.split(',').map(s => s.trim()).filter(Boolean) : []);

    return {
      leadershipText: leadArr.length > 0 ? leadArr.join(', ') : 'Not Assigned',
      extracurricularText: extraArr.length > 0 ? extraArr.join(', ') : 'None Recorded',
    };
  }, [user, isMed]);

  const allSocialActivities = React.useMemo(() => {
    let leadership = '';
    let extracurricular = '';
    const bioText = user?.bio || '';
    if (bioText.includes('Leadership:') || bioText.includes('Extracurricular:')) {
      const lMatch = bioText.match(/Leadership:\s*([^|]+)/i);
      const eMatch = bioText.match(/Extracurricular:\s*(.+)/i);
      if (lMatch && lMatch[1].trim()) leadership = lMatch[1].trim();
      if (eMatch && eMatch[1].trim()) extracurricular = eMatch[1].trim();
    }

    const leadershipItems = (Array.isArray(user?.leadership) && user.leadership.length > 0)
      ? user.leadership
      : (leadership ? leadership.split(',').map(s => s.trim()).filter(Boolean) : []);

    const extracurricularItems = (Array.isArray(user?.extracurricular) && user.extracurricular.length > 0)
      ? user.extracurricular
      : (extracurricular ? extracurricular.split(',').map(s => s.trim()).filter(Boolean) : []);

    return [
      ...leadershipItems.map(item => ({ name: item, type: 'Leadership Role', icon: 'grade' })),
      ...extracurricularItems.map(item => ({ name: item, type: 'Extracurricular & Sports', icon: 'stars' })),
    ];
  }, [user]);

  const totalSocialCredits = React.useMemo(() => {
    if (allSocialActivities.length > 0) {
      return allSocialActivities.length * 100;
    }
    const val = Number(user?.social_credits);
    return !isNaN(val) && val > 0 ? val : 0;
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

  const finalCerts = displayCerts.map((name, idx) => {
    const nL = name.toLowerCase();
    let issuer = `${APP_CONFIG.UNIVERSITY_SHORT_NAME} Venture Lab`;
    if (nL.includes('aws') || nL.includes('amazon')) issuer = 'AWS Academy';
    else if (nL.includes('google')) issuer = 'Google Cloud';
    else if (nL.includes('tata')) issuer = 'Tata / Forage Virtual Internship';
    else if (nL.includes('nptel') || nL.includes('swayam')) issuer = 'NPTEL / Swayam';
    else if (nL.includes('controller') || nL.includes('gc')) issuer = 'Job Controller Simulation';
    else if (nL.includes('spreadsheet') || nL.includes('excel')) issuer = 'Corporate Finance Institute';
    else if (nL.includes('diploma') || nL.includes('accounting')) issuer = 'National Accounting Council';
    else if (nL.includes('meta')) issuer = 'Meta';
    else if (nL.includes('ibm')) issuer = 'IBM SkillsBuild';
    else if (nL.includes('cisco')) issuer = 'Cisco Networking Academy';

    return {
      id: idx,
      name: name,
      issuer,
      date: 'Issued recently',
      img: idx % 2 === 0 
        ? 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop'
    };
  });

  React.useEffect(() => {
    if (user) {
      setUserBio(getRichStudentBio(user));
    }
  }, [user, getRichStudentBio]);

  React.useEffect(() => {
    let isMounted = true;
    
    const loadData = () => {
      if (!accessToken) return;
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

      if (isTechStudent) {
        getErpGithubRepos(accessToken, regNo)
          .then(res => { if (isMounted && Array.isArray(res)) setGithubRepos(res); })
          .catch(() => {});
      }

      getErpSeminars(accessToken, studentId)
        .then(res => { if (isMounted && Array.isArray(res)) setErpSeminars(res); })
        .catch(() => {});

      getErpTutorials(accessToken, studentId)
        .then(res => { if (isMounted && Array.isArray(res)) setErpTutorials(res); })
        .catch(() => {});

      const studentCourse = (user?.course || (isMed ? 'MBBS' : 'B.Tech')).trim();

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
  }, [accessToken, navigation, user]);

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

            <View style={[styles.aboutHighlightItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: colors.border }]}>
              <MaterialCommunityIcons name="shield-star-outline" size={16} color="#F59E0B" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.aboutHighlightLabel, { color: colors.textMuted }]}>CAMPUS LEADERSHIP</Text>
                <Text style={[styles.aboutHighlightValue, { color: colors.textPrimary }]}>
                  {parsedActivities.leadershipText}
                </Text>
              </View>
            </View>

            <View style={[styles.aboutHighlightItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: colors.border }]}>
              <MaterialCommunityIcons name="trophy-outline" size={16} color="#10B981" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.aboutHighlightLabel, { color: colors.textMuted }]}>EXTRACURRICULARS & CLUBS</Text>
                <Text style={[styles.aboutHighlightValue, { color: colors.textPrimary }]}>
                  {parsedActivities.extracurricularText}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Core Competencies & Skills Section */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                {isMed ? 'Clinical Competencies' : 'Core Competencies & Skills'}
              </Text>
              <Text style={[styles.cardSubSub, { color: colors.textSecondary }]}>
                {isMed ? 'Verified medical proficiencies & practice' : 'Technical proficiencies & areas of expertise'}
              </Text>
            </View>
            <MaterialCommunityIcons name="certificate" size={20} color={colors.primary} />
          </View>

          <View style={styles.skillsContainer}>
            {studentSkills.map((skill, sIdx) => (
              <View 
                key={sIdx} 
                style={[
                  styles.skillBadge, 
                  { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                  }
                ]}
              >
                <View style={[styles.skillDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.skillText, { color: colors.textPrimary }]}>{skill}</Text>
              </View>
            ))}
          </View>
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
            <View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Social Impact Credits</Text>
              <Text style={[styles.cardSubSub, { color: colors.textSecondary }]}>Community Service & Volunteering</Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: colors.primaryLight }]}><Text style={[styles.scoreText, { color: colors.primary }]}>{totalSocialCredits} pts</Text></View>
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
                    <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>100 pts</Text>
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
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
                No campus activities or volunteering records found.
              </Text>
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
                isMed 
                  ? { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)', borderColor: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.2)' }
                  : { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.2)' : 'rgba(254, 152, 50, 0.15)', borderColor: isDark ? 'rgba(234, 88, 12, 0.3)' : 'rgba(254, 152, 50, 0.3)' }
              ]}>
                <Text style={[styles.activeProjectText, { color: isMed ? (isDark ? '#C084FC' : '#6B21A8') : colors.primary }]}>
                  {myStartups.length > 0 ? (isMed ? 'ACTIVE PROPOSAL' : 'ACTIVE VENTURE') : 'INACTIVE'}
                </Text>
              </View>
            </View>

            <Text style={[styles.ventureTitle, { color: isMed ? colors.textPrimary : '#fe9832' }]}>
              {myStartups.length > 0 
                ? myStartups[0].name 
                : (isMed ? 'No Active Research' : 'No Active Venture')}
            </Text>
            <Text style={[styles.ventureDesc, { color: isMed ? colors.textSecondary : '#dadddf' }]}>
              {myStartups.length > 0 
                ? (myStartups[0].tagline || myStartups[0].description)
                : (isMed 
                  ? 'Submit your clinical research proposal outline on the Research tab to showcase it on your profile.'
                  : 'Pitch your startup idea on the Venture tab to showcase it on your profile.')}
            </Text>
            <View style={styles.ventureActions}>
              <TouchableOpacity style={[styles.vActionBtn, isMed && { backgroundColor: isDark ? '#6B21A8' : '#7C3AED' }]} onPress={() => navigation.navigate('Venture')}>
                <Ionicons name={isMed ? "journal-outline" : "link-outline"} size={14} color="#FFFFFF" />
                <Text style={styles.vActionText}>{isMed ? 'Case Studies' : 'Project Proofs'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.vActionBtn, isMed && { backgroundColor: isDark ? '#6B21A8' : '#7C3AED' }]} onPress={() => navigation.navigate('Venture')}>
                <MaterialCommunityIcons name={isMed ? "clipboard-check-outline" : "rocket-launch"} size={14} color="#FFFFFF" />
                <Text style={styles.vActionText}>{isMed ? 'Logbook ID' : 'Startup ID'}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>


        {/* Certificates */}
        <View style={styles.certWrapper}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Earned Digital Certificates</Text>
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

          {finalCerts.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.certScroll}>
              {finalCerts.map((cert) => (
                <TouchableOpacity 
                  key={cert.id} 
                  style={[styles.certCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setSelectedCert(cert)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: cert.img }}
                    style={styles.certImg}
                  />
                  <Text style={[styles.certName, { color: colors.textPrimary }]}>{cert.name}</Text>
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
                onPress={() => setShowAllCertsModal(false)}
              >
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {finalCerts.map((cert) => (
                <TouchableOpacity
                  key={cert.id}
                  style={[styles.certModalItem, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border }]}
                  onPress={() => {
                    setSelectedCert(cert);
                  }}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: cert.img }} style={styles.certModalItemImg} />
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
                  <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
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
              <>
                <Image source={{ uri: selectedCert.img }} style={styles.certDetailImg} resizeMode="cover" />
                <View style={{ padding: 18 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <MaterialIcons name="verified" size={18} color="#10B981" />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#10B981' }}>OFFICIALLY VERIFIED CREDENTIAL</Text>
                  </View>
                  <Text style={[styles.certDetailTitle, { color: colors.textPrimary }]}>{selectedCert.name}</Text>
                  <Text style={[styles.certDetailIssuer, { color: colors.textSecondary }]}>
                    Issued by {selectedCert.issuer}
                  </Text>
                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    Issue Date: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{selectedCert.date}</Text>
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                    Issued To: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{user?.name || user?.full_name || 'Student'}</Text>
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                    Verification Status: <Text style={{ fontWeight: '700', color: '#10B981' }}>Active & Validated</Text>
                  </Text>
                </View>
              </>
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
  certModalItemName: {
    fontSize: 14,
    fontWeight: '800',
  },
  certModalItemIssuer: {
    fontSize: 12,
    marginTop: 2,
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
});

export default TalentIdentityScreen;
