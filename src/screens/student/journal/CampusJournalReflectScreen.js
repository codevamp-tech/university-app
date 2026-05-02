import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_CONFIG } from '../../../config/appConfig';

const { width } = Dimensions.get('window');

const CampusJournalReflectScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [mood, setMood] = React.useState('Focused');

  const moods = [
    { name: 'Inspired', icon: 'sentiment-very-satisfied', color: '#ff9832' },
    { name: 'Focused', icon: 'sentiment-satisfied', color: '#fe9832' },
    { name: 'Calm', icon: 'sentiment-neutral', color: '#3b82f6' },
    { name: 'Pensive', icon: 'psychology', color: '#14b8a6' },
  ];

  const memories = [
    { title: 'Coffee with Friends', date: 'Oct 20, 2023', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4x7NILjiBMRNJk0GcRS9TQWEx7KvkYPB-geF6gj7H0aNoIAZgv1IYfvEbMZfCYUG-BMLP65Ycrs7atD897WWjjeqxgMrc0lbPqiBQosBh8mexLmiNwmGR-tS719GdnOsYrAWmVvj6h-eoetfDq0kaKaDOYCBFNE-A0kHn9smVes11OqCj4--CshrfJq2VhTk0smoHDh94zthdmT3scvV2G1GWwwvsCQ7B5JOFgwASL2wCoq4TlVaxTbi_zuDG6rpZOkJywtD7LlVC' },
    { title: `${APP_CONFIG.UNIVERSITY_SHORT_NAME} Sunset`, date: 'Oct 18, 2023', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGtQeza_5VUf83oAR66HdgEOp9frFcVcEJv7xw76WwRtbAR0grNPVxU8NeT-KwAtR_99PE4DjRL-aHZFp8AvZVbtP8GvAxyTpZt4oZUGBLhnHO2J6_Kl6F2BllR4iMaWHz-blqeRlY4uleCcczJJWp_Fk8cUHt1FLqBkFlobzoIFUkMlmSjO94YxpKqfBR3tflsYcctw4bcB2lGIleeexBBtOKxuHaXlTNZ0cnmYhn7PMHuFvs11Yr3y9Rjkz1HSYx-X-hwfjlFnBJ' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.navigate('StudentMain')}>
          <Ionicons name="arrow-back" size={28} color="#EA580C" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1fHmWkFI6lJjud3umiA_rCFqmv96gxkgTu7KSmgxsqeNe72Qs7tLivWHoIWlK68aW9JdDMIGD4qY0hj2VIZl_gDL4I0yZRsFtiSZqwBVSqCojbZhDGVnv1IQPeA6fGi8vN7HVrEEEaoV2izWQVngPdZKI92zZC9X0YNyyjwF2MNLkxE4A55Mkggi0T0NMarWQxV1IPcesyH5JuzXQXMoYxlwp_sFK1A8-oKpxNS_Y6twcRLoXrvNRFy4_1T_kTSWP0sWHKlj9NvZD' }}
            style={styles.headerProfile}
          />
          <Text style={styles.headerTitle}>The Academic Agora</Text>
        </View>
        <TouchableOpacity>
          <MaterialIcons name="psychology" size={28} color="#EA580C" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Daily Spark */}
        <View style={styles.sparkSection}>
          <View style={styles.sparkLabelRow}>
            <MaterialIcons name="auto-awesome" size={18} color="#EA580C" />
            <Text style={styles.sparkLabel}>DAILY SPARK</Text>
          </View>
          <LinearGradient colors={['#EA580C', '#9A3412', '#431407']} style={styles.sparkCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.sparkInner}>
              <Text style={styles.sparkSub}>AI Prompt • {APP_CONFIG.CAMPUS_LOCATION} Campus</Text>
              <Text style={styles.sparkQuestion}>
                {APP_CONFIG.UNIVERSITY_SHORT_NAME} Tech Fest Day 1 is over! What's one moment you'll never forget from the hackathon?
              </Text>
              <TouchableOpacity style={styles.sparkBtn}>
                <Text style={styles.sparkBtnText}>Write Now</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Today's Entry */}
        <View style={styles.entrySection}>
          <View style={styles.entryHeader}>
            <View>
              <Text style={styles.entryTitle}>Today's Entry</Text>
              <Text style={styles.entrySub}>October 24, 2023 • {APP_CONFIG.UNIVERSITY_SHORT_NAME} Main Library</Text>
            </View>
            <View style={styles.pulseBadge}>
              <Text style={styles.pulseText}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} Pulse</Text>
            </View>
          </View>

          <View style={styles.entryCard}>
            <Text style={styles.moodLabel}>HOW ARE YOU FEELING?</Text>
            <View style={styles.moodRow}>
              {moods.map((m) => (
                <TouchableOpacity 
                  key={m.name} 
                  style={[styles.moodItem, mood === m.name && styles.moodItemActive]}
                  onPress={() => setMood(m.name)}
                >
                  <MaterialIcons name={m.icon} size={32} color={mood === m.name ? '#EA580C' : m.color} />
                  <Text style={[styles.moodText, mood === m.name && styles.moodTextActive]}>{m.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                multiline
                placeholder={`Start typing your thoughts about today's classes at ${APP_CONFIG.UNIVERSITY_SHORT_NAME}...`}
                placeholderTextColor="#9CA3AF"
              />
              <View style={styles.toolRow}>
                <TouchableOpacity style={styles.toolBtn}>
                  <Ionicons name="mic-outline" size={20} color="#4953ac" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn}>
                  <Ionicons name="image-outline" size={20} color="#4953ac" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* AI Reflection */}
        <View style={styles.aiReflectBox}>
          <View style={styles.aiReflectIcon}>
            <MaterialIcons name="auto-awesome" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.aiReflectContent}>
            <Text style={styles.aiReflectTitle}>{APP_CONFIG.AI_ASSISTANT_NAME} Reflection</Text>
            <Text style={styles.aiReflectText}>
              You've been feeling focused and inspired this week, especially during your lab sessions in {APP_CONFIG.CAMPUS_LOCATION}! Your engagement with the Tech Fest reflects a strong creative surge. Keep it up, Arjun!
            </Text>
          </View>
        </View>

        {/* Memory Lane */}
        <View style={styles.memorySection}>
          <View style={styles.memoryHeader}>
            <Text style={styles.memoryTitle}>Memory Lane</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllBtn}>View All Memories</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memoryScroll}>
            {memories.map((m, i) => (
              <TouchableOpacity key={i} style={styles.memoryCard}>
                <Image source={{ uri: m.img }} style={styles.memoryImg} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.memoryOverlay}>
                  <Text style={styles.memoryDate}>{m.date.toUpperCase()}</Text>
                  <Text style={styles.memoryName}>{m.title}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB (Save/Add) */}
      <TouchableOpacity style={[styles.fab, { bottom: 100 }]}>
        <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.fabGradient}>
          <MaterialIcons name="check" size={32} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(245,246,247,0.8)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerProfile: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fe9832',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fe9832',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sparkSection: {
    marginBottom: 32,
  },
  sparkLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  sparkLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4953ac',
    letterSpacing: 0.5,
  },
  sparkCard: {
    borderRadius: 24,
    padding: 2,
  },
  sparkInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
  },
  sparkSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8b4b00',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sparkQuestion: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2c2f30',
    lineHeight: 28,
    marginBottom: 20,
  },
  sparkBtn: {
    backgroundColor: '#8b4b00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  sparkBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  entrySection: {
    marginBottom: 32,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  entryTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#4953ac',
  },
  entrySub: {
    fontSize: 13,
    color: '#595c5d',
    fontWeight: '600',
    marginTop: 4,
  },
  pulseBadge: {
    backgroundColor: '#cbceff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pulseText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#343d96',
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 2,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#757778',
    letterSpacing: 1,
    marginBottom: 16,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  moodItem: {
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#eff1f2',
    width: width * 0.18,
  },
  moodItemActive: {
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#fe9832',
  },
  moodText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#595c5d',
  },
  moodTextActive: {
    color: '#EA580C',
  },
  textAreaContainer: {
    backgroundColor: '#eff1f2',
    borderRadius: 16,
    padding: 16,
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: 'top',
    fontSize: 16,
    fontWeight: '500',
    color: '#2c2f30',
  },
  toolRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  toolBtn: {
    backgroundColor: '#FFFFFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  aiReflectBox: {
    backgroundColor: 'rgba(141, 237, 236, 0.2)',
    padding: 20,
    borderRadius: 20,
    borderLeftWidth: 6,
    borderLeftColor: '#006666',
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  aiReflectIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#006666',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#006666',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  aiReflectContent: {
    flex: 1,
  },
  aiReflectTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#004343',
    marginBottom: 4,
  },
  aiReflectText: {
    fontSize: 14,
    color: '#005858',
    lineHeight: 20,
    fontWeight: '500',
  },
  memorySection: {
    marginBottom: 20,
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  memoryTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2c2f30',
  },
  viewAllBtn: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8b4b00',
  },
  memoryScroll: {
    gap: 16,
    paddingHorizontal: 8,
  },
  memoryCard: {
    width: 250,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
  },
  memoryImg: {
    width: '100%',
    height: '100%',
  },
  memoryOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 16,
  },
  memoryDate: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 4,
  },
  memoryName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 32,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CampusJournalReflectScreen;
