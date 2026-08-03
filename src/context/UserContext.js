import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginWithRollNumber, logoutAPI, getMyProfile, updateMyProfile, loginFacultyWithEmpId, getFacultyProfile, getFacultyCredentialDetail, setUnauthorizedCallback } from '../data/apiService';
import * as RootNavigation from '../navigation/RootNavigation';
import * as NotificationService from '../utils/NotificationService';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const token = await AsyncStorage.getItem('@access_token');
        const savedUser = await AsyncStorage.getItem('@user');
        if (token && savedUser) {
          setAccessToken(token);
          setUser(JSON.parse(savedUser));
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

          // Fetch full DB profile too
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

        const {
          id: dbUserId,
          cgpa: dbCgpa,
          rollno: dbRollNo,
          batch_year: dbBatchYear,
          department_id: dbDeptId,
          role: dbRole,
          current_year: dbCurrentYear,
          ...dbProfileRest
        } = dbProfile || {};

        const resolvedFullName = dbProfileRest.full_name || (usernameForApi === '202313564' ? 'Mahendra Singh Butola' : usernameForApi);
        const u = {
          id: usernameForApi,
          name: resolvedFullName,
          full_name: resolvedFullName,
          role: dbRole || role,
          user_id: dbUserId || null,
          cgpa: dbCgpa || 0,
          attendance: dbProfileRest.attendance || 0,
          currentSkills: dbProfileRest.current_skills || [],
          certsDone: dbProfileRest.certificates_done || [],
          certsInProgress: dbProfileRest.certificates_in_progress || [],
          semester: dbProfileRest.semester || null,
          sgpaHistory: dbProfileRest.sgpa_history || [],
          current_year: dbCurrentYear || (dbProfileRest.semester ? Math.ceil(parseInt(dbProfileRest.semester, 10) / 2) : 1),
          year: dbCurrentYear || (dbProfileRest.semester ? Math.ceil(parseInt(dbProfileRest.semester, 10) / 2) : 1),
          rollno: dbRollNo || null,
          batch_year: dbBatchYear || null,
          department_id: dbDeptId || null,
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
      await AsyncStorage.multiRemove(['@access_token', '@user']);
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

  return (
    <UserContext.Provider value={{ user, accessToken, login, logout, updateSkillScore, updateAvatarUrl, refreshFacultyFlags }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
