import React, { createContext, useState, useContext } from 'react';
import { fetchStudentsFromSheet } from '../data/googleSheetsService';
import { Alert } from 'react-native';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Will hold the student object if student logs in, or generic user object

  const login = async (loginId, role) => {
    if (role === 'teacher') {
      // Mock teacher login
      setUser({ role: 'teacher', email: loginId });
      return true;
    }

    try {
      const students = await fetchStudentsFromSheet();
      // Alert.alert('Students Roll No/Email', JSON.stringify(students));

      const queryId = loginId.trim().toLowerCase();

      const found = students.find(s =>
        (s.id && s.id.toLowerCase() === queryId) ||
        (s.email && s.email.toLowerCase() === queryId) ||
        (s.id && s.id.toLowerCase() === queryId.split('@')[0])
      );

      if (found) {
        setUser({ ...found, role: 'student' });
        return true;
      } else {
        Alert.alert('Login Failed', `Could not find student with Roll No/Email: ${loginId}\nCheck the spreadsheet.`);
        return false;
      }
    } catch (error) {
      Alert.alert('Spreadsheet Error', error.message);
      return false;
    }
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

      return {
        ...prevUser,
        currentSkills,
        skillScores,
      };
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout, updateSkillScore }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
