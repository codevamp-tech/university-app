import React, { useState, useRef } from 'react';
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
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const GuestOnboardingScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); // 1: Form, 2: OTP
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [course, setCourse] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);

  const insets = useSafeAreaInsets();
  const otpInputs = useRef([]);

  const handleSendOTP = () => {
    if (!name || !mobile) {
      Alert.alert('Missing Required Fields', 'Please enter your name and mobile number.');
      return;
    }
    if (mobile.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1000);
  };

  const handleVerifyOTP = () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit code sent to your mobile.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace('GuestMain');
    }, 1200);
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      otpInputs.current[index + 1].focus();
    }
  };

  const renderFormStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Join as Guest</Text>
        <Text style={styles.subtitle}>Tell us a bit about yourself to get personalized course recommendations.</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>GUARDIAN NAME *</Text>
          <View style={styles.inputWrapper}>
            <Feather name="user" size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>MOBILE NUMBER *</Text>
          <View style={styles.inputWrapper}>
            <Feather name="phone" size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="10-digit number"
              keyboardType="phone-pad"
              maxLength={10}
              value={mobile}
              onChangeText={setMobile}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>INTERESTED COURSE (OPTIONAL)</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="book-open-variant" size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. B.Tech Computer Science"
              value={course}
              onChangeText={setCourse}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSendOTP}
          disabled={loading}
        >
          <LinearGradient
            colors={['#EA580C', '#9A3412']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>{loading ? 'Processing...' : 'Send OTP'}</Text>
            {!loading && <Feather name="arrow-right" size={18} color="white" />}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOtpStep = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
        <Feather name="arrow-left" size={24} color="#1F2937" />
      </TouchableOpacity>

      <View style={styles.headerContainer}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>We've sent a 4-digit verification code to {'\n'}+91 {mobile}</Text>
      </View>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (otpInputs.current[index] = ref)}
            style={styles.otpInput}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
                otpInputs.current[index - 1].focus();
              }
            }}
          />
        ))}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        <LinearGradient
          colors={['#EA580C', '#9A3412']}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify & Continue'}</Text>
          {!loading && <Feather name="check" size={18} color="white" />}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't receive the code? </Text>
        <Text style={styles.resendAction}>Resend</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={['#FFF7ED', '#FFFFFF']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]}>
          {step === 1 ? renderFormStep() : renderOtpStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  headerContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  formContainer: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B5563',
    letterSpacing: 1,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  primaryButton: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  otpInput: {
    width: (width - 80) / 4,
    height: 64,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: '#EA580C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendAction: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EA580C',
  },
});

export default GuestOnboardingScreen;
