import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');


const CATEGORIES = [
  { id: 'academic', label: 'Academic', icon: 'school-outline', subs: ['Curriculum', 'Exams', 'Attendance', 'Faculty', 'Resource Access'] },
  { id: 'technical', label: 'Technical', icon: 'laptop', subs: ['LMS Login', 'Portal Issue', 'Wi-Fi/Network', 'App Bug', 'Lab Equipment'] },
  { id: 'fees', label: 'Fees', icon: 'cash-outline', subs: ['Payment Failure', 'Receipt Not Generated', 'Fine Discrepancy', 'Scholarship'] },
  { id: 'hostel', label: 'Hostel', icon: 'bed-outline', subs: ['Maintenance', 'Mess Food', 'Electrical', 'Water Supply', 'Security'] },
  { id: 'transport', label: 'Transport', icon: 'bus-outline', subs: ['Bus Delay', 'Route Change', 'Driver Behavior', 'Pass Issue'] },
  { id: 'admin', label: 'Administration', icon: 'office-building-outline', subs: ['ID Card', 'Certificates', 'Verification', 'General Inquiry'] },
  { id: 'safety', label: 'Safety', icon: 'shield-check-outline', subs: ['Harassment', 'Theft', 'Emergency', 'Physical Hazard'] },
];

const RaiseIssueScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();


  // Form State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [issueTitle, setIssueTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Dropdown States
  const [showCatMenu, setShowCatMenu] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);

  const handleSubmit = () => {
    if (!selectedCategory || !selectedSubCategory || !issueTitle || !description) {
      Alert.alert('Missing Info', 'Please fill all required fields before submitting.');
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
    }, 1500);
  };

  if (showSuccess) {
    return (
      <View style={[styles.successContainer, { backgroundColor: colors.background }]}>
        <View style={styles.successContent}>
          <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.successIconOuter}>
            <LinearGradient colors={['#F97316', '#EA580C']} style={styles.successIconInner}>
              <Ionicons name="checkmark-done" size={60} color="#FFFFFF" />
            </LinearGradient>
          </LinearGradient>
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Issue Raised Successfully!</Text>
          <Text style={[styles.successSub, { color: colors.textSecondary }]}>Your support ticket has been created. Our team will reach out to you shortly.</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.doneBtnGradient}>
              <Text style={styles.doneBtnText}>Back to Dashboard</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }


  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <LinearGradient 
            colors={isDark ? ['#2D1F17', '#1F140E'] : ['#FFF7ED', '#FFEDD5']} 
            style={[styles.backBtnBg, { borderColor: colors.border, borderWidth: 1 }]}
          >
            <Ionicons name="chevron-back" size={24} color={isDark ? '#FB923C' : '#EA580C'} />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Raise an Issue</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={isDark ? [colors.card, colors.background] : ['#FFFFFF', '#F9FAFB']}
            style={[styles.formCard, { borderColor: colors.border }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >

            {/* Category Dropdown */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Issue Category <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={[styles.dropdownTrigger, { backgroundColor: isDark ? colors.background : '#FFFFFF', borderColor: colors.border }, showCatMenu && styles.activeDropdown]}
              onPress={() => setShowCatMenu(!showCatMenu)}
            >
              <View style={styles.dropdownLeft}>
                <Ionicons
                  name={selectedCategory ? selectedCategory.icon : 'grid-outline'}
                  size={20}
                  color={selectedCategory ? colors.primary : colors.textMuted}
                />
                <Text style={[styles.dropdownText, { color: colors.textPrimary }, !selectedCategory && styles.placeholderText]}>
                  {selectedCategory ? selectedCategory.label : 'Select Category'}
                </Text>
              </View>
              <Ionicons name={showCatMenu ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
            </TouchableOpacity>


            {showCatMenu && (
              <View style={[styles.menuBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.menuItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setSelectedSubCategory('');
                      setShowCatMenu(false);
                    }}
                  >
                    <Ionicons name={cat.icon} size={18} color={colors.primary} style={{ marginRight: 12 }} />
                    <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}


            {/* Sub-category Dropdown */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Sub-category <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={[
                styles.dropdownTrigger, { backgroundColor: isDark ? colors.background : '#FFFFFF', borderColor: colors.border },
                showSubMenu && styles.activeDropdown,
                !selectedCategory && styles.disabledDropdown
              ]}
              disabled={!selectedCategory}
              onPress={() => setShowSubMenu(!showSubMenu)}
            >
              <View style={styles.dropdownLeft}>
                <Ionicons name="list-outline" size={20} color={selectedSubCategory ? colors.primary : colors.textMuted} />
                <Text style={[styles.dropdownText, { color: colors.textPrimary }, !selectedSubCategory && styles.placeholderText]}>
                  {selectedSubCategory || 'Select Sub-category'}
                </Text>
              </View>
              <Ionicons name={showSubMenu ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
            </TouchableOpacity>


            {showSubMenu && selectedCategory && (
              <View style={[styles.menuBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {selectedCategory.subs.map((sub) => (
                  <TouchableOpacity
                    key={sub}
                    style={[styles.menuItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setSelectedSubCategory(sub);
                      setShowSubMenu(false);
                    }}
                  >
                    <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>{sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}


            {/* Issue Title */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Issue Title <Text style={styles.required}>*</Text></Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.background : '#FFFFFF', borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Brief summary of the issue"
                placeholderTextColor={colors.textMuted}
                value={issueTitle}
                onChangeText={setIssueTitle}
              />
            </View>


            {/* Description */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Description <Text style={styles.required}>*</Text></Text>
            <View style={[styles.inputWrapper, styles.multiLineWrapper, { backgroundColor: isDark ? colors.background : '#FFFFFF', borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, styles.multiLineInput, { color: colors.textPrimary }]}
                placeholder="Explain the issue in detail..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>


            {/* Attachment */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Upload Attachment</Text>
            <TouchableOpacity style={[styles.uploadBox, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.05)' : '#FFF7ED', borderColor: isDark ? 'rgba(234, 88, 12, 0.2)' : '#FFEDD5' }]}>
              <LinearGradient colors={isDark ? ['#9A3412', '#7C2D12'] : ['#FFF7ED', '#FFEDD5']} style={styles.uploadIconBg}>
                <MaterialCommunityIcons name="cloud-upload-outline" size={28} color={isDark ? '#FFFFFF' : "#EA580C"} />
              </LinearGradient>
              <Text style={[styles.uploadTitle, { color: colors.textPrimary }]}>Choose file or PDF</Text>
              <Text style={[styles.uploadSub, { color: colors.textSecondary }]}>Maximum file size 5MB</Text>
            </TouchableOpacity>


            {/* Priority */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Priority Selection</Text>
            <View style={styles.priorityRow}>
              {['Low', 'Medium', 'High'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityPill,
                    { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border },
                    priority === p && { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.2)' : '#FFF7ED', borderColor: colors.primary, borderWidth: 2 }
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[styles.priorityText, { color: colors.textSecondary }, priority === p && { color: colors.primary }]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>


            {/* Location */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Location (Optional)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.background : '#FFFFFF', borderColor: colors.border }]}>
              <Ionicons name="location-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Block, Room No, or Area"
                placeholderTextColor={colors.textMuted}
                value={location}
                onChangeText={setLocation}
              />
            </View>


            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.8}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={isSubmitting ? ['#9CA3AF', '#6B7280'] : ['#EA580C', '#9A3412']}
                style={styles.submitBtnGradient}
              >
                {isSubmitting ? (
                  <Text style={styles.submitBtnText}>Submitting...</Text>
                ) : (
                  <Text style={styles.submitBtnText}>Submit Issue</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backBtnBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 8,
    marginTop: 16,
  },
  required: {
    color: '#EF4444',
  },
  dropdownTrigger: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  activeDropdown: {
    borderColor: '#EA580C',
    borderWidth: 2,
  },
  disabledDropdown: {
    opacity: 0.5,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  menuBox: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrapper: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  input: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
  },
  multiLineWrapper: {
    height: 120,
    paddingVertical: 12,
  },
  multiLineInput: {
    height: '100%',
    textAlignVertical: 'top',
  },
  uploadBox: {
    height: 120,
    backgroundColor: '#FFF7ED',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFEDD5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  uploadSub: {
    color: '#6B7280',
    fontSize: 11,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  priorityPill: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priorityPillActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#EA580C',
    borderWidth: 2,
  },
  priorityText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 14,
  },
  priorityTextActive: {
    color: '#EA580C',
  },
  submitBtn: {
    marginTop: 32,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  submitBtnGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successContent: {
    alignItems: 'center',
    width: '100%',
  },
  successIconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successIconInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  successSub: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  doneBtn: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  doneBtnGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  }
});

export default RaiseIssueScreen;