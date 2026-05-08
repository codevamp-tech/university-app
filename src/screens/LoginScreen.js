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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { APP_CONFIG } from '../config/appConfig';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [securityKey, setSecurityKey] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const handleLogin = () => {
    if (!email || !securityKey) {
      Alert.alert('Missing Info', 'Please enter your credentials.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (role === 'teacher') {
        navigation.replace('TeacherMain');
      } else {
        navigation.replace('StudentMain');
      }
    }, 1200);
  };

  const handleGuest = () => {
    navigation.replace('GuestOnboarding');
  };

  return (
    <LinearGradient
      colors={['#ffedd5', '#fff7ed', '#ffffff', '#ffffff', '#ffffff']}
      locations={[0, 0.3, 0.55, 0.8, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
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
                onPress={() => setRole('student')}
              >
                <Text style={[styles.roleText, role === 'student' && styles.roleTextActive]}>Student</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleBtn, role === 'teacher' && styles.roleBtnActive]}
                onPress={() => setRole('teacher')}
              >
                <Text style={[styles.roleText, role === 'teacher' && styles.roleTextActive]}>Faculty</Text>
              </TouchableOpacity>
            </View>

            {/* Academic Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ACADEMIC EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder={`name@${APP_CONFIG.STUDENT_EMAIL_DOMAIN}`}

                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Security Key Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>SECURITY KEY</Text>
                <TouchableOpacity>
                  <Text style={styles.forgotLink}>FORGOT ACCESS?</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={securityKey}
                onChangeText={setSecurityKey}
                secureTextEntry
              />
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
});

export default LoginScreen;