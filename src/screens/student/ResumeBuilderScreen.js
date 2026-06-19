import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { generateATSResume } from '../../data/aiEngine';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

const ResumeBuilderScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useUser();

  const [resumeData, setResumeData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    loadResume();
  }, []);

  const loadResume = async () => {
    if (!user) return;
    try {
      setIsGenerating(true);
      const cacheKey = `@ats_resume_${user.id}`;
      const tsKey = `@ats_resume_timestamp_${user.id}`;
      
      const cached = await AsyncStorage.getItem(cacheKey);
      const lastGenStr = await AsyncStorage.getItem(tsKey);
      
      if (cached) {
        setResumeData(JSON.parse(cached));
      }

      let shouldGenerate = false;
      if (!cached) {
        shouldGenerate = true;
      } else if (lastGenStr) {
        const lastGen = parseInt(lastGenStr, 10);
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - lastGen >= oneWeek) {
          shouldGenerate = true;
        }
      }

      if (shouldGenerate) {
        await generateNewResume();
      } else {
        setIsGenerating(false);
      }
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
      Alert.alert("Error", "Could not load resume.");
    }
  };

  const generateNewResume = async () => {
    if (!user) return;
    try {
      const tsKey = `@ats_resume_timestamp_${user.id}`;
      const lastGenStr = await AsyncStorage.getItem(tsKey);
      if (lastGenStr) {
        const lastGen = parseInt(lastGenStr, 10);
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - lastGen < oneWeek) {
          Alert.alert("Rate Limit", "You can only generate a fresh AI resume once a week. You can export or view your current resume anytime.");
          return;
        }
      }

      setIsGenerating(true);
      const freshResume = await generateATSResume(user);
      if (freshResume) {
        setResumeData(freshResume);
        await AsyncStorage.setItem(`@ats_resume_${user.id}`, JSON.stringify(freshResume));
        await AsyncStorage.setItem(tsKey, Date.now().toString());
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Generation Failed", "Could not generate AI resume at this time. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPDF = async () => {
    if (!resumeData) return;
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
              h1 { font-size: 24px; color: #111; margin-bottom: 5px; }
              p { font-size: 14px; margin: 2px 0; }
              .section-title { font-size: 16px; font-weight: bold; color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; }
              .item-title { font-weight: bold; font-size: 14px; }
              .item-sub { font-style: italic; font-size: 13px; color: #555; }
              .item-date { float: right; font-size: 12px; color: #666; }
              ul { margin-top: 5px; padding-left: 20px; }
              li { font-size: 13px; margin-bottom: 4px; }
              .skills { margin-top: 10px; font-size: 13px; }
            </style>
          </head>
          <body>
            <div style="text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; margin-bottom: 20px;">
              <h1>${resumeData.name}</h1>
              <p>${resumeData.contact}</p>
            </div>
            
            <div class="section-title">OBJECTIVE</div>
            <p>${resumeData.objective}</p>

            <div class="section-title">EDUCATION</div>
            ${resumeData.education?.map(edu => `
              <div style="margin-bottom: 10px;">
                <div><span class="item-title">${edu.degree}</span><span class="item-date">${edu.duration}</span></div>
                <div class="item-sub">${edu.institution}</div>
                <p>${edu.details}</p>
              </div>
            `).join('')}

            ${resumeData.experience?.length ? `
              <div class="section-title">EXPERIENCE</div>
              ${resumeData.experience.map(exp => `
                <div style="margin-bottom: 15px;">
                  <div><span class="item-title">${exp.role}</span><span class="item-date">${exp.duration}</span></div>
                  <div class="item-sub">${exp.company}</div>
                  <ul>
                    ${exp.bullets?.map(b => `<li>${b}</li>`).join('')}
                  </ul>
                </div>
              `).join('')}
            ` : ''}

            ${resumeData.projects?.length ? `
              <div class="section-title">PROJECTS</div>
              ${resumeData.projects.map(proj => `
                <div style="margin-bottom: 15px;">
                  <div class="item-title">${proj.title}</div>
                  <div class="item-sub">${proj.technologies}</div>
                  <p>${proj.description}</p>
                </div>
              `).join('')}
            ` : ''}

            ${resumeData.skills?.length ? `
              <div class="section-title">SKILLS</div>
              <div class="skills">${resumeData.skills.join(', ')}</div>
            ` : ''}
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("PDF Generated", `File saved at ${uri}`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Export Failed', 'Failed to generate PDF.');
    }
  };

  if (isGenerating) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
          AI is analyzing your profile...
        </Text>
        <Text style={[styles.loadingSub, { color: colors.textSecondary }]}>
          Structuring an ATS-compatible resume based on your {user?.course} background and {user?.cgpa} CGPA.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>AI Resume</Text>
      </View>

      {resumeData ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          
          <View style={[styles.resumePaper, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.paperHeader}>
              <Text style={[styles.resumeName, { color: colors.textPrimary }]}>{resumeData.name}</Text>
              <Text style={[styles.resumeContact, { color: colors.textSecondary }]}>{resumeData.contact}</Text>
            </View>

            {/* Objective */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>OBJECTIVE</Text>
              <Text style={[styles.sectionContent, { color: colors.textPrimary }]}>{resumeData.objective}</Text>
            </View>

            {/* Education */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>EDUCATION</Text>
              {resumeData.education?.map((edu, idx) => (
                <View key={idx} style={styles.itemContainer}>
                  <View style={styles.itemHeader}>
                    <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{edu.degree}</Text>
                    <Text style={[styles.itemDate, { color: colors.textSecondary }]}>{edu.duration}</Text>
                  </View>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{edu.institution}</Text>
                  <Text style={[styles.itemDesc, { color: colors.textPrimary }]}>{edu.details}</Text>
                </View>
              ))}
            </View>

            {/* Experience */}
            {resumeData.experience && resumeData.experience.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>EXPERIENCE</Text>
                {resumeData.experience.map((exp, idx) => (
                  <View key={idx} style={styles.itemContainer}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{exp.role}</Text>
                      <Text style={[styles.itemDate, { color: colors.textSecondary }]}>{exp.duration}</Text>
                    </View>
                    <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{exp.company}</Text>
                    {exp.bullets?.map((bullet, bIdx) => (
                      <View key={bIdx} style={styles.bulletRow}>
                        <Text style={[styles.bulletPoint, { color: colors.textPrimary }]}>•</Text>
                        <Text style={[styles.bulletText, { color: colors.textPrimary }]}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {/* Projects */}
            {resumeData.projects && resumeData.projects.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>PROJECTS</Text>
                {resumeData.projects.map((proj, idx) => (
                  <View key={idx} style={styles.itemContainer}>
                    <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{proj.title}</Text>
                    <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{proj.technologies}</Text>
                    <Text style={[styles.itemDesc, { color: colors.textPrimary }]}>{proj.description}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Skills */}
            {resumeData.skills && resumeData.skills.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>SKILLS</Text>
                <View style={styles.skillsGrid}>
                  {resumeData.skills.map((skill, idx) => (
                    <View key={idx} style={[styles.skillBadge, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : '#EEF2FF' }]}>
                      <Text style={[styles.skillText, { color: colors.primary }]}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

          </View>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>No resume data found.</Text>
        </View>
      )}

      {/* Floating Action Button for Export */}
      {!isGenerating && resumeData && (
        <TouchableOpacity style={styles.fab} onPress={exportPDF}>
          <LinearGradient colors={['#4F46E5', '#3730A3']} style={styles.fabGradient}>
            <MaterialCommunityIcons name="export-variant" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}

    </View>
  );
};

export default ResumeBuilderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingSub: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  regenerateBtn: {
    padding: 8,
    marginRight: -8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  resumePaper: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  paperHeader: {
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
    paddingBottom: 16,
  },
  resumeName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  resumeContact: {
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.2)',
    paddingBottom: 4,
  },
  sectionContent: {
    fontSize: 13,
    lineHeight: 20,
  },
  itemContainer: {
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  itemDate: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 12,
  },
  itemSub: {
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  bulletPoint: {
    fontSize: 13,
    marginRight: 6,
    lineHeight: 18,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 28,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
