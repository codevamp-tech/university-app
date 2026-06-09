import React, { createContext, useState, useContext } from 'react';
import { Alert } from 'react-native';
import { fetchStudentsFromSheet } from '../data/googleSheetsService';
import { loginWithRollNumber, logoutAPI } from '../data/apiService';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  /**
   * Login flow:
   * 1. Authenticate with the API → get access_token
   * 2. Fetch profile data from Google Sheet (name, course, cgpa, skills, etc.)
   * 3. Merge both into user context
   *
   * Fallback: if API is down, fall back to sheet-only login (no token).
   */
  const login = async (loginId, role) => {
    if (role === 'teacher') {
      setUser({ role: 'teacher', email: loginId });
      return true;
    }

    const queryId = loginId.trim().toLowerCase();

    // ── Step 1: Authenticate via API ────────────────────────────────────────
    let tokenData = null;
    try {
      tokenData = await loginWithRollNumber(queryId);
    } catch (err) {
      console.warn('[UserContext] API login error, falling back to sheet:', err.message);
    }

    if (tokenData?.access_token) {
      setAccessToken(tokenData.access_token);
    }

    // ── Step 2: Get rich profile from Google Sheet ───────────────────────────
    try {
      const students = await fetchStudentsFromSheet();

      const found = students.find(s =>
        (s.id    && s.id.toLowerCase()    === queryId) ||
        (s.email && s.email.toLowerCase() === queryId) ||
        (s.id    && s.id.toLowerCase()    === queryId.split('@')[0])
      );

      if (found) {
        setUser({
          ...found,
          role: 'student',
          // API token stored at context level — screens access it via useUser()
        });
        return true;
      }

      // Student not in sheet but authenticated via API
      if (tokenData?.access_token) {
        setUser({ id: queryId, name: queryId, role: 'student' });
        return true;
      }

      Alert.alert(
        'Login Failed',
        `Roll number not found: ${loginId}\nCheck the spreadsheet or ask your administrator.`
      );
      return false;

    } catch (sheetError) {
      // Sheet unreachable — if API token exists, allow login with minimal profile
      if (tokenData?.access_token) {
        setUser({ id: queryId, name: queryId, role: 'student' });
        return true;
      }
      Alert.alert('Connection Error', sheetError.message);
      return false;
    }
  };

  const logout = async () => {
    if (accessToken) {
      try { await logoutAPI(accessToken); } catch (_) {}
    }
    setUser(null);
    setAccessToken(null);
  };

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

      return { ...prevUser, currentSkills, skillScores };
    });
  };

  return (
    <UserContext.Provider value={{ user, accessToken, login, logout, updateSkillScore }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
