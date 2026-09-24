import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginWithRollNumber, logoutAPI, getMyProfile, updateMyProfile, loginFacultyWithEmpId, getFacultyProfile, getFacultyCredentialDetail, setUnauthorizedCallback, joinErpBatchChat } from '../data/apiService';
import * as RootNavigation from '../navigation/RootNavigation';
import * as NotificationService from '../utils/NotificationService';
import { resolveCourseAndBranch } from '../utils/courseDisplay';

const sanitizeList = (raw) => {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : (typeof raw === 'string' ? [raw] : []);
  const expanded = [];
  arr.forEach(item => {
    if (typeof item === 'string') {
      if (item.includes(',')) {
        item.split(',').forEach(s => {
          const t = s.trim();
          if (t) expanded.push(t);
        });
      } else if (item.trim()) {
        expanded.push(item.trim());
      }
    } else if (item && typeof item === 'object') {
      const name = item.name || item.title || item.cert_name || String(item);
      if (name && name.trim()) expanded.push(name.trim());
    }
  });
  return Array.from(new Set(expanded));
};

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [githubUsername, setGithubUsername] = useState(null);
  const [isHostelMode, setIsHostelModeState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@hostel_mode').then(val => {
      if (val !== null) setIsHostelModeState(val === 'true');
    });
  }, []);

  const setIsHostelMode = useCallback((val) => {
    setIsHostelModeState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      AsyncStorage.setItem('@hostel_mode', String(next)).catch(() => {});
      return next;
    });
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const token = await AsyncStorage.getItem('@access_token');
        const savedUser = await AsyncStorage.getItem('@user');
        const savedGithub = await AsyncStorage.getItem('@github_username');
        if (savedGithub) {
          setGithubUsername(savedGithub);
        }
        if (token && savedUser) {
          setAccessToken(token);
          const parsed = JSON.parse(savedUser);
          if (parsed?.github_username) {
            setGithubUsername(parsed.github_username);
          }
          if (parsed) {
            const { course: parsedCourse, branch: parsedBranch } = resolveCourseAndBranch(parsed);
            parsed.course = parsedCourse || parsed.course;
            parsed.branch = parsedBranch || parsed.branch;
            parsed.currentSkills = sanitizeList(parsed.currentSkills || parsed.current_skills || parsed.skills);
            parsed.current_skills = parsed.currentSkills;
            parsed.certsDone = sanitizeList(parsed.certsDone || parsed.certificates_done || parsed.certs_done);
            parsed.certificates_done = parsed.certsDone;
            parsed.certs_done = parsed.certsDone;
          }
          setUser(parsed);

          // Background refresh from API to update cached profiles
          getMyProfile(token).then(dbProfile => {
            if (dbProfile) {
              const rawName = dbProfile.full_name || dbProfile.name;
              const resolvedFullName = (rawName && isNaN(Number(rawName)) && rawName !== 'Student' && !rawName.startsWith('Student ')) 
                ? rawName 
                : (parsed.name && parsed.name !== 'Student' && !parsed.name.startsWith('Student ') ? parsed.name : (dbProfile.name || dbProfile.username || 'Student'));
              setUser(prev => {
                if (!prev) return null;
                const skills = sanitizeList(dbProfile.current_skills || dbProfile.skills || prev.currentSkills);
                const certs = sanitizeList(dbProfile.certificates_done || dbProfile.certs_done || prev.certsDone);
                const { course: freshCourse, branch: freshBranch } = resolveCourseAndBranch({
                  ...prev,
                  ...dbProfile,
                  rollno: dbProfile.rollno || prev.rollno,
                  username: dbProfile.username || prev.username,
                });
                const updated = {
                  ...prev,
                  name: resolvedFullName || prev.name,
                  full_name: resolvedFullName || prev.full_name,
                  rollno: dbProfile.rollno || prev.rollno || prev.username,
                  username: dbProfile.username || prev.username || prev.rollno,
                  user_id: dbProfile.id || prev.user_id || prev.id,
                  id: dbProfile.id || prev.id,
                  cgpa: (dbProfile.cgpa !== undefined && dbProfile.cgpa !== null && Number(dbProfile.cgpa) > 0) ? Number(dbProfile.cgpa) : (prev.cgpa && Number(prev.cgpa) > 0 ? Number(prev.cgpa) : 0),
                  attendance: (dbProfile.attendance !== undefined && dbProfile.attendance !== null && Number(dbProfile.attendance) > 0) ? Number(dbProfile.attendance) : (prev.attendance && Number(prev.attendance) > 0 ? Number(prev.attendance) : 0),
                  course: freshCourse || dbProfile.course || prev.course,
                  branch: freshBranch || dbProfile.branch || prev.branch,
                  current_year: dbProfile.current_year || prev.current_year || (dbProfile.semester ? Math.ceil(parseInt(dbProfile.semester, 10) / 2) : 1),
                  year: dbProfile.year || prev.year || dbProfile.current_year || 1,
                  semester: dbProfile.semester || prev.semester || 1,
                  department_id: dbProfile.department_id || prev.department_id,
                  currentSkills: skills,
                  current_skills: skills,
                  certsDone: certs,
                  certificates_done: certs,
                  certs_done: certs,
                  social_credits: dbProfile.social_credits || prev.social_credits || 120,
                  bio: dbProfile.bio || prev.bio || '',
                };
                AsyncStorage.setItem('@user', JSON.stringify(updated)).catch(() => {});
                return updated;
              });
            }
          }).catch(() => {});
        }
      } catch (e) {
        console.warn('[UserContext] Error loading session:', e.message);
      }
    };
    loadSession();
  }, []);

  /**
   * Login flow:
   * 1. Authenticate with the API → get access_token
   * 2. Fetch database profile (stores custom updates like avatar_url, bio)
   * 3. Fetch profile data from Google Sheet (name, course, cgpa, skills, etc.)
   * 4. Merge both into user context
   *
   * Fallback: if API is down, fall back to sheet-only login (no token).
   */
  const login = async (loginId, password, role) => {
    const queryId = loginId.trim();

    // ── Faculty Login (Teacher role) ─────────────────────────────────────────
    if (role === 'teacher') {
      try {
        const facultyData = await loginFacultyWithEmpId(queryId, password);
        if (facultyData?.access_token) {
          setAccessToken(facultyData.access_token);

          // Fetch full DB profile too (includes is_hod from non-medical-erp backend)
          let dbProfile = null;
          try {
            dbProfile = await getFacultyProfile(facultyData.access_token);
          } catch (_) {}

          const fac = facultyData.faculty || {};
          const empIdResolved = fac.emp_id || queryId;

          // Fetch FacultyLoginCredential for pg_verify / pg_hod permission flags
          // Password is required by this API — we have it available here at login time
          let credDetail = null;
          try {
            credDetail = await getFacultyCredentialDetail(empIdResolved, password);
          } catch (_) {}

          const u = {
            role: 'teacher',
            emp_id: empIdResolved,
            name: dbProfile?.name || fac.name || 'Faculty Member',
            department: dbProfile?.department || fac.department || 'Medical Faculty',
            department_code: fac.department_code || '60',
            department_id: dbProfile?.department_id || fac.department_id || null,
            email: dbProfile?.email || fac.email || null,
            mobile: dbProfile?.mobile || null,
            user_id: fac.user_id || null,
            usr_id: fac.usr_id || null,
            avatar_url: dbProfile?.avatar_url || fac.avatar_url || null,
            phase: dbProfile?.phase || fac.phase || null,
            accessToken: facultyData.access_token,
            // Permission flags from FacultyLoginCredential
            pg_verify: credDetail?.pg_verify ?? null,
            pg_hod: credDetail?.pg_hod ?? null,
            // HOD flag from DB profile (non-medical-erp backend)
            is_hod: dbProfile?.is_hod ?? false,
          };
          setUser(u);
          try {
            await AsyncStorage.setItem('@access_token', facultyData.access_token);
            await AsyncStorage.setItem('@user', JSON.stringify(u));
          } catch (e) {
            console.warn('[UserContext] Error saving session:', e.message);
          }
          // Request notification permission after faculty login
          NotificationService.initialize().catch(() => {});
          return u;
        }
      } catch (err) {
        console.warn('[UserContext] Faculty API login failed:', err.message);
      }
    } else {
      // ── Student / Admin Login ────────────────────────────────────────────────
      const usernameForApi = queryId.toLowerCase();

      // Step 1: Authenticate via API
      let tokenData = null;
      try {
        tokenData = await loginWithRollNumber(usernameForApi, password);
      } catch (err) {
        console.warn('[UserContext] API login error:', err.message);
      }

      if (tokenData?.access_token) {
        setAccessToken(tokenData.access_token);

        // Fetch DB profile since we have a valid token
        let dbProfile = null;
        try {
          dbProfile = await getMyProfile(tokenData.access_token);
        } catch (err) {
          console.warn('[UserContext] DB profile fetch error:', err.message);
        }

        const userProf = tokenData?.user?.profile || {};

        const {
          id: dbUserId,
          cgpa: dbCgpa,
          attendance: dbAttendance,
          rollno: dbRollNo,
          batch_year: dbBatchYear,
          department_id: dbDeptId,
          role: dbRole,
          current_year: dbCurrentYear,
          full_name: dbFullName,
          course: dbCourse,
          branch: dbBranch,
          ...dbProfileRest
        } = dbProfile || {};

        const rawName = dbFullName || dbProfile?.name || dbProfileRest?.full_name || tokenData?.user?.name || userProf?.name;
        const resolvedFullName = (rawName && rawName !== usernameForApi && rawName !== 'Student' && !rawName.startsWith('Student '))
          ? rawName
          : (usernameForApi === '202313564' ? 'Mahendra Singh Butola' : (tokenData?.user?.name || usernameForApi));

        const resolvedCgpa = (dbCgpa !== undefined && dbCgpa !== null && Number(dbCgpa) > 0)
          ? Number(dbCgpa)
          : (dbProfileRest?.cgpa ? Number(dbProfileRest.cgpa) : (userProf?.cgpa ? Number(userProf.cgpa) : 0));

        const resolvedAttendance = (dbAttendance !== undefined && dbAttendance !== null && Number(dbAttendance) > 0)
          ? Number(dbAttendance)
          : (dbProfileRest?.attendance ? Number(dbProfileRest.attendance) : (userProf?.attendance ? Number(userProf.attendance) : 0));

        // Accurate AKTU / SRMS course code extraction from roll number (digits 7-9)
        // e.g. 2500141790006 -> courseCode = '179' (BCA)
        // e.g. 2400140140009 -> courseCode = '014' (MCA)
        // e.g. 2500140700027 -> courseCode = '070' (MBA)
        // e.g. 2400141780033 -> courseCode = '178' (B.Com)
        // e.g. 2500140500007 -> courseCode = '050' (B.Pharm)
        // e.g. 2300140130025 -> courseCode = '013' (B.Tech IT)
        // e.g. 2300140100015 -> courseCode = '010' (B.Tech CSE)
        const digitsOnly = (usernameForApi || dbRollNo || '').replace(/\D/g, '');
        const courseCodeFromRoll = digitsOnly.length === 13 ? digitsOnly.slice(6, 9) : '';

        const regOrRoll = `${dbRollNo || ''} ${tokenData?.user?.rollno || ''} ${tokenData?.user?.registrationNo || ''} ${usernameForApi}`.toLowerCase();
        let fallbackCourse = 'B.Tech';
        let fallbackBranch = 'Computer Science';

        if (courseCodeFromRoll === '179' || tokenData?.user?.courseCd === '13' || userProf?.course_cd === '13') {
          fallbackCourse = 'BCA';
          fallbackBranch = 'Computer Applications';
        } else if (courseCodeFromRoll === '178' || tokenData?.user?.courseCd === '14' || tokenData?.user?.courseCd === '12' || userProf?.course_cd === '14' || userProf?.course_cd === '12') {
          fallbackCourse = 'B.Com';
          fallbackBranch = 'Commerce';
        } else if (courseCodeFromRoll === '070' || regOrRoll.includes('2025107400') || tokenData?.user?.courseCd === '4' || userProf?.course_cd === '4') {
          fallbackCourse = 'MBA';
          fallbackBranch = 'Management';
        } else if (courseCodeFromRoll === '050' || tokenData?.user?.courseCd === '2' || userProf?.course_cd === '2') {
          fallbackCourse = 'B.Pharm';
          fallbackBranch = 'Pharmaceutical Sciences';
        } else if (courseCodeFromRoll === '014' || (digitsOnly.length === 13 && digitsOnly.slice(6, 9) === '014') || tokenData?.user?.courseCd === '3' || userProf?.course_cd === '3') {
          fallbackCourse = 'MCA';
          fallbackBranch = 'Software Applications';
        } else if (courseCodeFromRoll === '013') {
          fallbackCourse = 'B.Tech';
          fallbackBranch = 'Information Technology';
        } else if (courseCodeFromRoll === '010') {
          fallbackCourse = 'B.Tech';
          fallbackBranch = 'Computer Science';
        }

        const rawCourse = dbCourse || dbProfile?.course || tokenData?.user?.courseName || userProf?.course_name || (userProf?.course_cd === '3' ? 'MCA' : userProf?.course_cd === '4' ? 'MBA' : userProf?.course_cd === '13' ? 'BCA' : userProf?.course_cd === '2' ? 'B.Pharm' : (userProf?.course_cd === '14' || userProf?.course_cd === '12') ? 'B.Com' : (userProf?.course_cd === '1' ? 'B.Tech' : fallbackCourse));
        const resolvedCourse = fallbackCourse !== 'B.Tech' ? fallbackCourse : (rawCourse && rawCourse !== 'B.Tech' ? rawCourse : fallbackCourse);

        const rawBranch = dbBranch || dbProfile?.branch || tokenData?.user?.departmentName || userProf?.department_name || (userProf?.course_cd === '3' ? 'Software Applications' : userProf?.course_cd === '4' ? 'Management' : userProf?.course_cd === '13' ? 'Computer Applications' : userProf?.course_cd === '2' ? 'Pharmaceutical Sciences' : (userProf?.course_cd === '14' || userProf?.course_cd === '12') ? 'Commerce' : (userProf?.course_cd === '1' ? 'Computer Science' : fallbackBranch));
        const resolvedBranch = fallbackBranch !== 'Computer Science' ? fallbackBranch : (rawBranch && rawBranch !== 'Computer Science' ? rawBranch : fallbackBranch);

        const isPostGrad = resolvedCourse.toUpperCase().includes('MCA') || resolvedCourse.toUpperCase().includes('MBA');
        const resolvedYear = dbCurrentYear || dbProfile?.current_year || (userProf?.admission_year ? Math.max(1, Math.min(isPostGrad ? 2 : 4, 2026 - Number(userProf.admission_year) + 1)) : 1);
        const resolvedSem = dbProfile?.semester || dbProfileRest?.semester || ((resolvedYear - 1) * 2 + 1);

        const rawSkills = (dbProfile?.current_skills && dbProfile.current_skills.length > 0) ? dbProfile.current_skills : (userProf?.current_skills || []);
        const rawCerts = (dbProfile?.certificates_done && dbProfile.certificates_done.length > 0) ? dbProfile.certificates_done : (userProf?.certificates_done || []);
        const cleanSkills = sanitizeList(rawSkills);
        const cleanCerts = sanitizeList(rawCerts);

        const u = {
          id: dbUserId || tokenData?.user?.id || usernameForApi,
          user_id: dbUserId || tokenData?.user?.id || null,
          name: resolvedFullName,
          full_name: resolvedFullName,
          role: dbRole || role,
          course: resolvedCourse,
          branch: resolvedBranch,
          cgpa: resolvedCgpa,
          attendance: resolvedAttendance,
          social_credits: dbProfile?.social_credits || userProf?.social_credits || 120,
          currentSkills: cleanSkills,
          current_skills: cleanSkills,
          skills: cleanSkills,
          certsDone: cleanCerts,
          certificates_done: cleanCerts,
          certs_done: cleanCerts,
          certsInProgress: dbProfile?.certificates_in_progress || [],
          semester: resolvedSem,
          sgpaHistory: dbProfile?.sgpa_history || [resolvedCgpa],
          current_year: resolvedYear,
          year: resolvedYear,
          rollno: dbRollNo || tokenData?.user?.rollno || tokenData?.user?.registrationNo || usernameForApi,
          registration_no: tokenData?.user?.registrationNo || dbRollNo || usernameForApi,
          username: tokenData?.user?.username || usernameForApi,
          emp_id: tokenData?.user?.emp_id || usernameForApi,
          batch_year: dbBatchYear || userProf?.batch_year || null,
          department_id: dbDeptId || userProf?.department_id || null,
          avatar_url: dbProfile?.avatar_url || tokenData?.user?.photoUrl || userProf?.photo_url || null,
          bio: dbProfile?.bio || userProf?.bio || '',
          ...dbProfileRest,
        };

        setUser(u);
        try {
          await AsyncStorage.setItem('@access_token', tokenData.access_token);
          await AsyncStorage.setItem('@user', JSON.stringify(u));
        } catch (e) {
          console.warn('[UserContext] Error saving session:', e.message);
        }
        // Request notification permission after student login
        NotificationService.initialize().catch(() => {});
        // Auto-join ERP batch chat group (fire-and-forget, never blocks login)
        joinErpBatchChat(tokenData.access_token).catch(() => {});
        return u;
      }
    }

    let fieldName = 'roll number';
    if (role === 'teacher') {
      fieldName = 'employee ID';
    } else if (role === 'admin' || role === 'super_admin') {
      fieldName = 'username';
    } else if (role === 'warden') {
      fieldName = 'warden username';
    }

    Alert.alert(
      'Login Failed',
      `Incorrect ${fieldName} or password.\nPlease check your credentials and try again.`
    );
    return false;
  };

  const isLoggingOutRef = React.useRef(false);
  const isSessionExpiredAlertVisibleRef = React.useRef(false);

  const logout = async () => {
    isLoggingOutRef.current = true;
    if (accessToken) {
      try { await logoutAPI(accessToken); } catch (_) {}
    }
    setUser(null);
    setAccessToken(null);
    try {
      await AsyncStorage.multiRemove([
        '@access_token',
        '@user',
        '@github_repos_cache',
        '@erp_competency_gaps_cache',
        '@erp_academic_results_cache',
      ]);
    } catch (e) {
      console.warn('[UserContext] Error clearing session:', e.message);
    }
    RootNavigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
    // Reset manual logout flag after redirect complete
    setTimeout(() => {
      isLoggingOutRef.current = false;
    }, 1000);
  };

  useEffect(() => {
    setUnauthorizedCallback(() => {
      if (isLoggingOutRef.current) return;
      if (isSessionExpiredAlertVisibleRef.current) return;
      isSessionExpiredAlertVisibleRef.current = true;

      logout().finally(() => {
        Alert.alert(
          'Session Expired',
          'Your session has expired or is invalid. Please log in again.',
          [
            {
              text: 'OK',
              onPress: () => {
                isSessionExpiredAlertVisibleRef.current = false;
              }
            }
          ]
        );
      });
    });
    return () => setUnauthorizedCallback(null);
  }, [logout]);

  const updateSkillScore = (skillName, score) => {
    setUser(prevUser => {
      if (!prevUser) return null;

      const currentSkills = [...(prevUser.currentSkills || [])];
      const skillNameLower = skillName.toLowerCase();
      const alreadyHas = currentSkills.some(s => s.toLowerCase() === skillNameLower);

      if (score >= 50 && !alreadyHas) {
        currentSkills.push(skillName);
      }

      const skillScores = { ...(prevUser.skillScores || {}) };
      skillScores[skillName] = score;

      const updated = { ...prevUser, currentSkills, skillScores };
      AsyncStorage.setItem('@user', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };


  /**
   * Re-fetch pg_verify / pg_hod flags from FacultyLoginCredential and patch the user object.
   * Call this on TeacherDashboard mount to handle stale cached sessions that pre-date this field.
   */
  const refreshFacultyFlags = async () => {
    if (!user || user.role !== 'teacher') return;
    // Already have both flags — nothing to do
    if (user.pg_verify != null && user.pg_hod != null) return;
    try {
      const credDetail = await getFacultyCredentialDetail(user.emp_id);
      if (!credDetail) return;
      setUser(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          pg_verify: credDetail.pg_verify ?? prev.pg_verify ?? null,
          pg_hod: credDetail.pg_hod ?? prev.pg_hod ?? null,
        };
        AsyncStorage.setItem('@user', JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    } catch (err) {
      console.warn('[UserContext] refreshFacultyFlags failed:', err.message);
    }
  };

  const updateAvatarUrl = async (newUrl) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      const updated = { ...prevUser, avatar_url: newUrl };
      AsyncStorage.setItem('@user', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    if (accessToken) {
      try {
        await updateMyProfile(accessToken, { avatar_url: newUrl });
      } catch (err) {
        console.warn('[UserContext] Failed to update avatar in DB:', err.message);
      }
    }
  };

  const updateGithubUsername = async (username) => {
    const clean = username ? username.trim().replace(/^@/, '') : null;
    setGithubUsername(clean);
    setUser(prevUser => {
      if (!prevUser) return null;
      const updated = { ...prevUser, github_username: clean };
      AsyncStorage.setItem('@user', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    if (clean) {
      AsyncStorage.setItem('@github_username', clean).catch(() => {});
    } else {
      AsyncStorage.removeItem('@github_username').catch(() => {});
    }
  };

  // Derived: true if this faculty is an HOD (has extra dept management tabs)
  const isHOD = user?.is_hod === true && user?.role === 'teacher';

  return (
    <UserContext.Provider value={{ user, accessToken, githubUsername, updateGithubUsername, login, logout, updateSkillScore, updateAvatarUrl, refreshFacultyFlags, isHOD, isHostelMode, setIsHostelMode }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
