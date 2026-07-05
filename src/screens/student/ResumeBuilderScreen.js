import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions, TextInput } from 'react-native';
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
  const { user, accessToken } = useUser();
  const isMed = user && (
    user.course?.replace(/\./g, '').toLowerCase().includes('mbbs') ||
    user.course?.toLowerCase().includes('medicine') ||
    user.category?.toLowerCase().includes('medical')
  );

  const [resumeData, setResumeData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);

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
      const freshResume = await generateATSResume(user, accessToken);
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
            
            <div class="section-title">${isMed ? 'CLINICAL SUMMARY' : 'OBJECTIVE'}</div>
            <p>${resumeData.objective}</p>

            <div class="section-title">EDUCATION</div>
            ${resumeData.education?.map(edu => `
              <div style="margin-bottom: 12px;">
                <div class="item-title" style="margin-bottom: 2px;">${edu.degree}</div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: #555; margin-bottom: 4px;">
                  <span style="font-style: italic;">${edu.institution}</span>
                  <span>${edu.duration}</span>
                </div>
                <p style="margin: 0; font-size: 13px;">${edu.details}</p>
              </div>
            `).join('')}

            ${resumeData.experience?.length ? `
              <div class="section-title">${isMed ? 'CLINICAL POSTINGS & RESIDENCY' : 'EXPERIENCE'}</div>
              ${resumeData.experience.map(exp => `
                <div style="margin-bottom: 15px;">
                  <div class="item-title" style="margin-bottom: 2px;">${exp.role}</div>
                  <div style="display: flex; justify-content: space-between; font-size: 13px; color: #555; margin-bottom: 4px;">
                    <span style="font-style: italic;">${exp.company}</span>
                    <span>${exp.duration}</span>
                  </div>
                  <ul style="margin: 4px 0 0 0; padding-left: 20px;">
                    ${exp.bullets?.map(b => `<li style="font-size: 13px; margin-bottom: 3px;">${b}</li>`).join('')}
                  </ul>
                </div>
              `).join('')}
            ` : ''}

            ${resumeData.projects?.length ? `
              <div class="section-title">${isMed ? 'CLINICAL CASE STUDIES' : 'PROJECTS'}</div>
              ${resumeData.projects.map(proj => `
                <div style="margin-bottom: 15px;">
                  <div class="item-title">${proj.title}</div>
                  <div class="item-sub">${proj.technologies}</div>
                  <p>${proj.description}</p>
                </div>
              `).join('')}
            ` : ''}

            ${resumeData.skills?.length ? `
              <div class="section-title">${isMed ? 'CLINICAL SKILLS & COMPETENCIES' : 'SKILLS'}</div>
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
          {isMed ? 'AI is compiling your clinical profile...' : 'AI is analyzing your profile...'}
        </Text>
        <Text style={[styles.loadingSub, { color: colors.textSecondary }]}>
          {isMed
            ? 'Structuring a medical CV based on your clinical rotations, ward postings, and exam scores.'
            : `Structuring an ATS-compatible resume based on your ${user?.course} background and ${user?.cgpa} CGPA.`}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => {
          if (isEditing) {
            setIsEditing(false);
          } else {
            navigation.goBack();
          }
        }}>
          <MaterialIcons name={isEditing ? "close" : "arrow-back"} size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{isMed ? 'Clinical CV' : 'AI Resume'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {!isEditing ? (
            <>
              <TouchableOpacity style={{ padding: 8, marginRight: 4 }} onPress={generateNewResume}>
                <MaterialCommunityIcons name="refresh" size={24} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 8 }} onPress={() => {
                if (resumeData) {
                  setEditedData(JSON.parse(JSON.stringify(resumeData)));
                  setIsEditing(true);
                }
              }}>
                <MaterialCommunityIcons name="pencil-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={{ padding: 8 }} onPress={async () => {
              setResumeData(editedData);
              await AsyncStorage.setItem(`@ats_resume_${user.id}`, JSON.stringify(editedData));
              setIsEditing(false);
            }}>
              <MaterialIcons name="check" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {resumeData ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>

          <View style={[styles.resumePaper, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.paperHeader}>
              {isEditing ? (
                <TextInput
                  style={[styles.resumeName, { color: colors.textPrimary, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: colors.primary, width: '100%', paddingVertical: 4 }]}
                  value={editedData.name}
                  onChangeText={t => setEditedData({...editedData, name: t})}
                  placeholder="Name"
                />
              ) : (
                <Text style={[styles.resumeName, { color: colors.textPrimary }]}>{resumeData.name}</Text>
              )}
              
              {isEditing ? (
                <TextInput
                  style={[styles.resumeContact, { color: colors.textSecondary, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, marginTop: 8, width: '100%', paddingVertical: 4 }]}
                  value={editedData.contact}
                  onChangeText={t => setEditedData({...editedData, contact: t})}
                  placeholder="Contact Details"
                />
              ) : (
                <Text style={[styles.resumeContact, { color: colors.textSecondary }]}>{resumeData.contact}</Text>
              )}
            </View>

            {/* Objective */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>{isMed ? 'CLINICAL SUMMARY' : 'OBJECTIVE'}</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.sectionContent, { color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, width: '100%', paddingVertical: 4 }]}
                  multiline
                  value={editedData.objective}
                  onChangeText={t => setEditedData({...editedData, objective: t})}
                  placeholder="Objective"
                />
              ) : (
                <Text style={[styles.sectionContent, { color: colors.textPrimary }]}>{resumeData.objective}</Text>
              )}
            </View>

            {/* Education */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>EDUCATION</Text>
              {(isEditing ? editedData.education : resumeData.education)?.map((edu, idx) => (
                <View key={idx} style={styles.itemContainer}>
                  {isEditing ? (
                    <>
                      <TextInput
                        style={[styles.itemTitle, { color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 4, marginBottom: 4 }]}
                        value={edu.degree}
                        onChangeText={t => {
                          const newEdu = [...editedData.education];
                          newEdu[idx].degree = t;
                          setEditedData({...editedData, education: newEdu});
                        }}
                        placeholder="Degree/Qualification"
                      />
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <TextInput
                          style={[styles.itemSub, { color: colors.textSecondary, flex: 1, marginRight: 8, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 4 }]}
                          value={edu.institution}
                          onChangeText={t => {
                            const newEdu = [...editedData.education];
                            newEdu[idx].institution = t;
                            setEditedData({...editedData, education: newEdu});
                          }}
                          placeholder="Institution"
                        />
                        <TextInput
                          style={[styles.itemDate, { color: colors.textSecondary, width: 100, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 4, textAlign: 'right' }]}
                          value={edu.duration}
                          onChangeText={t => {
                            const newEdu = [...editedData.education];
                            newEdu[idx].duration = t;
                            setEditedData({...editedData, education: newEdu});
                          }}
                          placeholder="Duration"
                        />
                      </View>
                      <TextInput
                        style={[styles.itemDesc, { color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 4, marginTop: 4 }]}
                        value={edu.details}
                        onChangeText={t => {
                          const newEdu = [...editedData.education];
                          newEdu[idx].details = t;
                          setEditedData({...editedData, education: newEdu});
                        }}
                        placeholder="Details"
                        multiline
                      />
                    </>
                  ) : (
                    <>
                      <Text style={[styles.itemTitle, { color: colors.textPrimary, marginBottom: 2 }]}>{edu.degree}</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 4 }}>
                        <Text style={[styles.itemSub, { color: colors.textSecondary, marginBottom: 0, flex: 1, marginRight: 8 }]}>{edu.institution}</Text>
                        <Text style={[styles.itemDate, { color: colors.textSecondary }]}>{edu.duration}</Text>
                      </View>
                      <Text style={[styles.itemDesc, { color: colors.textPrimary, marginTop: 4 }]}>{edu.details}</Text>
                    </>
                  )}
                </View>
              ))}
            </View>

            {/* Experience */}
            {(isEditing ? editedData.experience : resumeData.experience) && (isEditing ? editedData.experience : resumeData.experience).length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>{isMed ? 'CLINICAL POSTINGS & RESIDENCY' : 'EXPERIENCE'}</Text>
                {(isEditing ? editedData.experience : resumeData.experience).map((exp, idx) => (
                  <View key={idx} style={styles.itemContainer}>
                    {isEditing ? (
                      <>
                        <TextInput
                          style={[styles.itemTitle, { color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 4, marginBottom: 4 }]}
                          value={exp.role}
                          onChangeText={t => {
                            const newExp = [...editedData.experience];
                            newExp[idx].role = t;
                            setEditedData({...editedData, experience: newExp});
                          }}
                          placeholder="Role/Position"
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <TextInput
                            style={[styles.itemSub, { color: colors.textSecondary, flex: 1, marginRight: 8, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 4 }]}
                            value={exp.company}
                            onChangeText={t => {
                              const newExp = [...editedData.experience];
                              newExp[idx].company = t;
                              setEditedData({...editedData, experience: newExp});
                            }}
                            placeholder="Company/Hospital"
                          />
                          <TextInput
                            style={[styles.itemDate, { color: colors.textSecondary, width: 100, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 4, textAlign: 'right' }]}
                            value={exp.duration}
                            onChangeText={t => {
                              const newExp = [...editedData.experience];
                              newExp[idx].duration = t;
                              setEditedData({...editedData, experience: newExp});
                            }}
                            placeholder="Duration"
                          />
                        </View>
                        {exp.bullets?.map((bullet, bIdx) => (
                          <View key={bIdx} style={styles.bulletRow}>
                            <Text style={[styles.bulletPoint, { color: colors.textPrimary }]}>•</Text>
                            <TextInput
                              style={[styles.bulletText, { color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 2, flex: 1 }]}
                              value={bullet}
                              onChangeText={t => {
                                const newExp = [...editedData.experience];
                                const newBullets = [...newExp[idx].bullets];
                                newBullets[bIdx] = t;
                                newExp[idx].bullets = newBullets;
                                setEditedData({...editedData, experience: newExp});
                              }}
                              placeholder="Description bullet"
                              multiline
                            />
                          </View>
                        ))}
                      </>
                    ) : (
                      <>
                        <Text style={[styles.itemTitle, { color: colors.textPrimary, marginBottom: 2 }]}>{exp.role}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 4 }}>
                          <Text style={[styles.itemSub, { color: colors.textSecondary, marginBottom: 0, flex: 1, marginRight: 8 }]}>{exp.company}</Text>
                          <Text style={[styles.itemDate, { color: colors.textSecondary }]}>{exp.duration}</Text>
                        </View>
                        {exp.bullets?.map((bullet, bIdx) => (
                          <View key={bIdx} style={styles.bulletRow}>
                            <Text style={[styles.bulletPoint, { color: colors.textPrimary }]}>•</Text>
                            <Text style={[styles.bulletText, { color: colors.textPrimary }]}>{bullet}</Text>
                          </View>
                        ))}
                      </>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Projects */}
            {(isEditing ? editedData.projects : resumeData.projects) && (isEditing ? editedData.projects : resumeData.projects).length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>{isMed ? 'CLINICAL CASE STUDIES' : 'PROJECTS'}</Text>
                {(isEditing ? editedData.projects : resumeData.projects).map((proj, idx) => (
                  <View key={idx} style={styles.itemContainer}>
                    {isEditing ? (
                      <>
                        <TextInput
                          style={[styles.itemTitle, { color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 4, marginBottom: 4 }]}
                          value={proj.title}
                          onChangeText={t => {
                            const newProj = [...editedData.projects];
                            newProj[idx].title = t;
                            setEditedData({...editedData, projects: newProj});
                          }}
                          placeholder="Project Title"
                        />
                        <TextInput
                          style={[styles.itemSub, { color: colors.textSecondary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 4, marginBottom: 4 }]}
                          value={proj.technologies}
                          onChangeText={t => {
                            const newProj = [...editedData.projects];
                            newProj[idx].technologies = t;
                            setEditedData({...editedData, projects: newProj});
                          }}
                          placeholder="Technologies Used"
                        />
                        <TextInput
                          style={[styles.itemDesc, { color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 4 }]}
                          value={proj.description}
                          onChangeText={t => {
                            const newProj = [...editedData.projects];
                            newProj[idx].description = t;
                            setEditedData({...editedData, projects: newProj});
                          }}
                          placeholder="Description"
                          multiline
                        />
                      </>
                    ) : (
                      <>
                        <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{proj.title}</Text>
                        <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{proj.technologies}</Text>
                        <Text style={[styles.itemDesc, { color: colors.textPrimary }]}>{proj.description}</Text>
                      </>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Skills */}
            {(isEditing ? editedData.skills : resumeData.skills) && (isEditing ? editedData.skills : resumeData.skills).length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>{isMed ? 'CLINICAL SKILLS & COMPETENCIES' : 'SKILLS'}</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.itemDesc, { color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 4 }]}
                    value={editedData.skills.join(', ')}
                    onChangeText={t => {
                      const newSkills = t.split(',').map(s => s.trim());
                      setEditedData({...editedData, skills: newSkills});
                    }}
                    placeholder="Skills (comma separated)"
                    multiline
                  />
                ) : (
                  <View style={styles.skillsGrid}>
                    {resumeData.skills.map((skill, idx) => (
                      <View key={idx} style={[styles.skillBadge, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : '#EEF2FF' }]}>
                        <Text style={[styles.skillText, { color: colors.primary }]}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                )}
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
  },
});
