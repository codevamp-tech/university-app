import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Dimensions, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const AdmissionFormScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    city: '',
    state: '',
    qualification: '',
    percentage: '',
    course: '',
    specialization: '',
    howKnow: '',
  });

  const totalSteps = 3;

  const courses = ['B.Tech', 'BCA', 'BBA', 'MBA', 'M.Tech', 'LL.B', 'B.Sc Agriculture', 'MCA'];
  const genders = ['Male', 'Female', 'Other'];
  const qualifications = ['10+2 (PCM)', '10+2 (PCB)', '10+2 (Commerce)', '10+2 (Arts)', 'Graduation', 'Post Graduation', 'Diploma'];
  const howKnowOptions = ['Social Media', 'Friend/Family', 'Google Search', 'Education Fair', 'Newspaper', 'Other'];

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const isStep1Valid = form.firstName && form.lastName && form.email && form.phone;
  const isStep2Valid = form.dob && form.gender && form.qualification && form.percentage;
  const isStep3Valid = form.course;

  const handleSubmit = () => {
    Alert.alert(
      '🎉 Application Submitted!',
      `Thank you ${form.firstName}! Your admission application has been received successfully.\n\nYou will receive a confirmation on ${form.email} within 24 hours.\n\nApplication ID: INV-${Math.floor(10000 + Math.random() * 90000)}`,
      [{ text: 'Go Back', onPress: () => navigation.goBack(), style: 'default' }]
    );
  };

  const renderStep1 = () => (
    <View>
      <Text style={styles.stepSectionTitle}>Personal Information</Text>

      <View style={styles.fieldRow}>
        <View style={[styles.fieldWrap, { flex: 1 }]}>
          <Text style={styles.fieldLabel}>First Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Aryan"
            placeholderTextColor="#9CA3AF"
            value={form.firstName}
            onChangeText={v => update('firstName', v)}
          />
        </View>
        <View style={[styles.fieldWrap, { flex: 1 }]}>
          <Text style={styles.fieldLabel}>Last Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Kumar"
            placeholderTextColor="#9CA3AF"
            value={form.lastName}
            onChangeText={v => update('lastName', v)}
          />
        </View>
      </View>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Email Address *</Text>
        <View style={styles.inputWithIcon}>
          <MaterialIcons name="email" size={18} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.inputInner}
            placeholder="your@email.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={v => update('email', v)}
          />
        </View>
      </View>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Mobile Number *</Text>
        <View style={styles.inputWithIcon}>
          <Text style={styles.countryCode}>+91</Text>
          <TextInput
            style={styles.inputInner}
            placeholder="10-digit mobile number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            maxLength={10}
            value={form.phone}
            onChangeText={v => update('phone', v)}
          />
        </View>
      </View>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>City</Text>
        <TextInput
          style={styles.input}
          placeholder="Your city"
          placeholderTextColor="#9CA3AF"
          value={form.city}
          onChangeText={v => update('city', v)}
        />
      </View>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>State</Text>
        <TextInput
          style={styles.input}
          placeholder="Your state"
          placeholderTextColor="#9CA3AF"
          value={form.state}
          onChangeText={v => update('state', v)}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepSectionTitle}>Academic Details</Text>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Date of Birth</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/YYYY"
          placeholderTextColor="#9CA3AF"
          value={form.dob}
          onChangeText={v => update('dob', v)}
        />
      </View>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Gender *</Text>
        <View style={styles.optionRow}>
          {genders.map(g => (
            <TouchableOpacity
              key={g}
              style={[styles.optionChip, form.gender === g && styles.optionChipActive]}
              onPress={() => update('gender', g)}
            >
              <Text style={[styles.optionChipText, form.gender === g && styles.optionChipTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Last Qualification *</Text>
        <View style={styles.optionWrap}>
          {qualifications.map(q => (
            <TouchableOpacity
              key={q}
              style={[styles.optionChipSm, form.qualification === q && styles.optionChipActive]}
              onPress={() => update('qualification', q)}
            >
              <Text style={[styles.optionChipText, form.qualification === q && styles.optionChipTextActive]}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Percentage / CGPA *</Text>
        <View style={styles.inputWithIcon}>
          <MaterialIcons name="grade" size={18} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.inputInner}
            placeholder="e.g. 85.5% or 8.5 CGPA"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={form.percentage}
            onChangeText={v => update('percentage', v)}
          />
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.stepSectionTitle}>Course Preference</Text>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Preferred Course *</Text>
        <View style={styles.optionWrap}>
          {courses.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.optionChipSm, form.course === c && styles.optionChipActive]}
              onPress={() => update('course', c)}
            >
              <Text style={[styles.optionChipText, form.course === c && styles.optionChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Specialization (if any)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. AI & ML, Finance, Marketing..."
          placeholderTextColor="#9CA3AF"
          value={form.specialization}
          onChangeText={v => update('specialization', v)}
        />
      </View>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>How did you hear about us?</Text>
        <View style={styles.optionWrap}>
          {howKnowOptions.map(h => (
            <TouchableOpacity
              key={h}
              style={[styles.optionChipSm, form.howKnow === h && styles.optionChipActive]}
              onPress={() => update('howKnow', h)}
            >
              <Text style={[styles.optionChipText, form.howKnow === h && styles.optionChipTextActive]}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Summary */}
      <LinearGradient colors={['#F5EEFC', '#EDE9FE']} style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Application Summary</Text>
        {[
          { label: 'Name', value: `${form.firstName} ${form.lastName}` },
          { label: 'Contact', value: form.email || form.phone },
          { label: 'Qualification', value: form.qualification },
          { label: 'Course', value: form.course },
        ].filter(s => s.value).map((s, i) => (
          <View key={i} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{s.label}</Text>
            <Text style={styles.summaryValue}>{s.value}</Text>
          </View>
        ))}
      </LinearGradient>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Apply Now</Text>
          <Text style={styles.headerSub}>Admissions 2025–26</Text>
        </View>
        <MaterialCommunityIcons name="school" size={22} color="rgba(255,255,255,0.7)" />
      </LinearGradient>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={['#EA580C', '#9A3412']}
            style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]}
          />
        </View>
        <View style={styles.stepsRow}>
          {['Personal Info', 'Academics', 'Course'].map((label, i) => (
            <View key={i} style={styles.stepIndicator}>
              <View style={[styles.stepDot, step > i ? styles.stepDotDone : step === i + 1 ? styles.stepDotActive : {}]}>
                {step > i
                  ? <MaterialIcons name="check" size={12} color="#FFFFFF" />
                  : <Text style={styles.stepDotNum}>{i + 1}</Text>
                }
              </View>
              <Text style={[styles.stepLabel, step === i + 1 && styles.stepLabelActive]}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Navigation Buttons */}
          <View style={styles.navButtons}>
            {step > 1 && (
              <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(s => s - 1)}>
                <Feather name="arrow-left" size={18} color="#4338CA" />
                <Text style={styles.prevBtnText}>Previous</Text>
              </TouchableOpacity>
            )}

            {step < totalSteps ? (
              <TouchableOpacity
                style={[styles.nextBtn, !isStep1Valid && step === 1 && styles.nextBtnDisabled]}
                disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
                onPress={() => setStep(s => s + 1)}
              >
                <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.nextBtnGradient}>
                  <Text style={styles.nextBtnText}>Continue</Text>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.nextBtn, !isStep3Valid && styles.nextBtnDisabled]}
                disabled={!isStep3Valid}
                onPress={handleSubmit}
              >
                <LinearGradient colors={['#16A34A', '#0A6C34']} style={styles.nextBtnGradient}>
                  <MaterialIcons name="check" size={18} color="#FFFFFF" />
                  <Text style={styles.nextBtnText}>Submit Application</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  progressSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  progressTrack: {
    height: 4, backgroundColor: '#F3F4F6', borderRadius: 2, marginBottom: 16, overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepIndicator: { alignItems: 'center', gap: 4 },
  stepDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive: { backgroundColor: '#EA580C' },
  stepDotDone: { backgroundColor: '#16A34A' },
  stepDotNum: { fontSize: 10, fontWeight: '900', color: '#9CA3AF' },
  stepLabel: { fontSize: 10, fontWeight: '600', color: '#9CA3AF' },
  stepLabelActive: { color: '#EA580C', fontWeight: '800' },
  scroll: { padding: 20 },
  stepSectionTitle: {
    fontSize: 20, fontWeight: '900', color: '#111827',
    marginBottom: 20, letterSpacing: -0.3,
  },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12, fontWeight: '800', color: '#374151',
    marginBottom: 8, letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 14, height: 48,
    paddingHorizontal: 16, fontSize: 14, color: '#111827',
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4, elevation: 1,
  },
  inputWithIcon: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, height: 48,
    paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4, elevation: 1,
  },
  inputIcon: { marginRight: 10 },
  countryCode: {
    fontSize: 14, fontWeight: '700', color: '#4338CA', marginRight: 8,
  },
  inputInner: { flex: 1, fontSize: 14, color: '#111827' },
  optionRow: { flexDirection: 'row', gap: 10 },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 14, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  optionChipSm: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  optionChipActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  optionChipText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  optionChipTextActive: { color: '#FFFFFF', fontWeight: '800' },
  summaryCard: {
    borderRadius: 18, padding: 18, marginTop: 8,
  },
  summaryTitle: { fontSize: 15, fontWeight: '900', color: '#4338CA', marginBottom: 12 },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: 'rgba(99,102,241,0.1)',
  },
  summaryLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  summaryValue: { fontSize: 13, fontWeight: '700', color: '#312E81' },
  navButtons: {
    flexDirection: 'row', gap: 12, marginTop: 24,
    justifyContent: 'flex-end',
  },
  prevBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: 16, backgroundColor: '#EEF2FF',
  },
  prevBtnText: { fontWeight: '700', color: '#4338CA', fontSize: 14 },
  nextBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, paddingHorizontal: 24,
  },
  nextBtnText: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
});

export default AdmissionFormScreen;
