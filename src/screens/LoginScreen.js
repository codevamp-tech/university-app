import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { APP_CONFIG } from '../config/appConfig';
import { useUser } from '../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOADING_MESSAGES = [
  "Connecting to ERP...",
  "Preparing the workspace for you...",
  "Synchronising grades & attendance...",
  "Personalising the experience for you...",
  "Get ready for the magic...",
];

const LoginScreen = ({ navigation }) => {
  const [loginId, setLoginId] = useState('');
  const [securityKey, setSecurityKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [currentMessageIdx, setCurrentMessageIdx] = useState(0);
  const insets = useSafeAreaInsets();
  const { login } = useUser();

  React.useEffect(() => {
    let interval;
    if (loading) {
      setCurrentMessageIdx(0);
      interval = setInterval(() => {
        setCurrentMessageIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [loading]);

  React.useEffect(() => {
    const loadSavedRole = async () => {
      try {
        const savedRole = await AsyncStorage.getItem('@last_login_role');
        if (savedRole) {
          setRole(savedRole);
        }
      } catch (e) {
        console.warn('Error loading saved role:', e);
      }
    };
    loadSavedRole();
  }, []);

  const handleLoginIdChange = (text) => {
    setLoginId(text);
  };

  console.log("role>>>>globle", role);

  const handleLogin = async () => {
    if (!loginId || !securityKey) {
      Alert.alert('Missing Info', 'Please enter your credentials.');
      return;
    }
    setLoading(true);

    try {
      // Password check continues normally below
    } catch (e) {
      console.warn('Login preparation error:', e);
    }
    
    // Auto-detect role as a fallback only for clear non-student patterns when on the student tab
    let finalRole = role;
    const cleanId = loginId.trim();
    if (role === 'student' && (/[a-zA-Z]/.test(cleanId) || cleanId.includes('/'))) {
      if (cleanId.toLowerCase() === 'warden') {
        finalRole = 'warden';
      } else if (cleanId.toLowerCase() === 'admin') {
        finalRole = 'admin';
      } else {
        finalRole = 'teacher';
      }
    } else if (role === 'admin' && cleanId.toLowerCase() === 'warden') {
      finalRole = 'warden';
    }

    console.log("loginId>>>>", loginId);
    console.log("securityKey>>>>", securityKey);
    console.log("finalrole>>>>", finalRole);
    
    // Save correct final role for next app restart
    try {
      await AsyncStorage.setItem('@last_login_role', finalRole === 'warden' ? 'admin' : finalRole);
    } catch (_) {}

    const success = await login(loginId, securityKey, finalRole);

    if (success) {
      console.log("resrole>>>>", success.role);
      const userRole = success.role;
      if (userRole === 'teacher') {
        console.log("role>>/>>teacher");
        navigation.replace('TeacherMain');
      } else if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'warden') {
        console.log("role>>/>>admin");
        navigation.replace('AdminMain');
      } else {
        console.log("role>>/>>student");
        navigation.replace('StudentMain');
      }
    }

    setLoading(false);
  };

  const handleGuest = () => {
    Alert.alert('🔒 Guest Mode Locked', 'Guest mode is locked in the demo version. Please log in using your student or faculty credentials.');
  };

  return (
    <LinearGradient
      colors={['#ffedd5', '#fff7ed', '#ffffff', '#ffffff', '#ffffff']}
      locations={[0, 0.3, 0.55, 0.8, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Full-Screen Premium Immersive Loader Modal */}
      <Modal
        visible={loading}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.loaderOverlay}>
          <LinearGradient
            colors={['#FB923C', '#EA580C']}
            style={styles.loaderContent}
          >
            <ActivityIndicator size="large" color="#FFFFFF" style={{ marginBottom: 24 }} />

            {/* Carousel message */}
            <View style={styles.messageContainer}>
              <Text style={styles.loaderMessage}>
                {LOADING_MESSAGES[currentMessageIdx]}
              </Text>
            </View>

            <Text style={styles.loaderSub}>Please wait, configuring your dashboard</Text>
          </LinearGradient>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Back Section */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Welcome back</Text>
            <Text style={styles.welcomeSubtitle}>
              Enter your credentials to access your academic portal.
            </Text>
          </View>


          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* Role Selector */}
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'student' && styles.roleBtnActive]}
                onPress={() => {
                  setRole('student');
                  AsyncStorage.setItem('@last_login_role', 'student').catch(() => {});
                }}
              >
                <Text style={[styles.roleText, role === 'student' && styles.roleTextActive]}>Student</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'teacher' && styles.roleBtnActive]}
                onPress={() => {
                  setRole('teacher');
                  AsyncStorage.setItem('@last_login_role', 'teacher').catch(() => {});
                }}
              >
                <Text style={[styles.roleText, role === 'teacher' && styles.roleTextActive]}>Faculty</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'admin' && styles.roleBtnActive]}
                onPress={() => {
                  setRole('admin');
                  AsyncStorage.setItem('@last_login_role', 'admin').catch(() => {});
                }}
              >
                <Text style={[styles.roleText, role === 'admin' && styles.roleTextActive]}>Admin</Text>
              </TouchableOpacity>
            </View>

            {/* Roll Number or Academic Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {role === 'student'
                  ? 'STUDENT ROLL NUMBER'
                  : role === 'admin'
                    ? 'ADMIN/WARDEN USERNAME'
                    : 'EMPLOYEE ID'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={
                  role === 'student'
                    ? 'e.g., 2400140140005'
                    : role === 'admin'
                      ? 'e.g., admin or warden'
                      : 'e.g., D/11/048'
                }
                placeholderTextColor="#9CA3AF"
                value={loginId}
                onChangeText={handleLoginIdChange}
                autoCapitalize="none"
                keyboardType={role === 'student' ? 'numeric' : 'default'}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>SECURITY KEY</Text>
              </View>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { borderBottomWidth: 0, flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={securityKey}
                  onChangeText={setSecurityKey}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.signInButtonText}>
                {loading ? 'Signing in...' : 'Sign In to Portal →'}
              </Text>

            </TouchableOpacity>

            {/* OR Divider */}
            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            {/* Guest Button */}
            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuest}
              activeOpacity={0.8}
            >
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Section */}
          <View style={styles.footerContainer}>
            <View style={styles.footerLinks}>
              <TouchableOpacity>
                <Text style={styles.footerLinkText}>LEGAL POLICY</Text>
              </TouchableOpacity>
              <Text style={styles.footerSeparator}>•</Text>
              <TouchableOpacity>
                <Text style={styles.footerLinkText}>HELP DESK</Text>
              </TouchableOpacity>
              <Text style={styles.footerSeparator}>•</Text>
              <TouchableOpacity>
                <Text style={styles.footerLinkText}>SYSTEM STATUS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  welcomeContainer: {
    marginTop: 60,
    marginBottom: 48,
  },
  welcomeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  formContainer: {
    marginBottom: 32,
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  roleTextActive: {
    color: '#111827',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338CA',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 16,
    color: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  signInButton: {
    backgroundColor: '#EA580C',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  orText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginHorizontal: 12,
    letterSpacing: 0.5,
  },
  guestButton: {
    borderWidth: 1,
    borderColor: '#EA580C',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#EA580C',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 40,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLinkText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  footerSeparator: {
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalBtnTextCancel: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 14,
  },
  modalBtnSubmit: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#EA580C',
  },
  modalBtnTextSubmit: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContent: {
    width: '85%',
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  messageContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  loaderMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  loaderSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  eyeButton: {
    paddingLeft: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoginScreen;