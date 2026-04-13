import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, TextInput,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const VentureScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="school" size={26} color="#F97316" />
          <Text style={styles.headerLogo}>Invertis University</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <MaterialIcons name="smart-toy" size={22} color="#F97316" />
          </TouchableOpacity>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHE5L8YlJMTs-XVOTgRgdskFym9IbSOOWmaoPDoXAVn44_p1piZ4DF1hbybIHboYED4wlgw5EjEf8xQVbYyd2ujbhVoBIHI34rqe-9joMu1KjOHC4gExjJ1EoR4Nq0FRsbmAyQmoMhL5z4fLdnRjvxDipaIV-TNoOKkRzF8AAjcBgx1CklNEikKZHQTYdba1-Xp0GoP-MEG3_P8uUSz546Q23VbY9WaghYVTNTFEOr6ShXvHSsOrKH7pS6YchureUbV49CKICrW-pl' }}
            style={styles.avatarSmall}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Venture Launchpad Hero */}
        <View style={styles.heroSection}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJYwvpBtdoJt5aKLdQ72OYOygma4LnW_oNAVjJu2C_VvQZx-o-1JqrQht7GAy50UqE6UC4mGjQhFbFfZaJEmjgSWF6AaAdNbDn_9DSGxhASKaEhR5J6E_ce19eohauoRtH8UzVZmwqwd9U-ynvnfSDT6rKBAcQ1PLQrR4J4ApuUj0-Gvh4oOWUD58xaxKVznX_fIhfS5GwjQbAUVch42xxoKuwk405fU04rM_q4zuMMPVrYoXve-cBe7dniDZGiUjjuqvTapsWklN3' }} 
            style={styles.heroImg} 
          />
          <LinearGradient 
            colors={['rgba(139, 75, 0, 0.95)', 'rgba(122, 65, 0, 0.4)']} 
            style={styles.heroOverlay}
          >
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>INVERTIS PULSE LAB</Text>
            </View>
            <Text style={styles.heroTitle}>Where Ideas {"\n"}<Text style={styles.heroTitleItalic}>Go Infinite.</Text></Text>
            <View style={styles.heroBtns}>
              <TouchableOpacity style={styles.pitchBtn}>
                <Text style={styles.pitchBtnText}>Pitch Your Idea</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exploreBtn}>
                <Text style={styles.exploreBtnText}>Explore Startups</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Co-founder Match Card */}
        <View style={styles.matchCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <MaterialIcons name="psychology-alt" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.cardHeaderTitle}>Find a Co-founder</Text>
          </View>
          <Text style={styles.cardDesc}>Our AI matches your vision with students across Engineering, Design, and MBA departments.</Text>
          <View style={styles.matchingFooter}>
            <View style={styles.miniAvatars}>
              <View style={styles.mAvatar} />
              <View style={[styles.mAvatar, { marginLeft: -8 }]} />
              <View style={[styles.mAvatar, { marginLeft: -8, backgroundColor: '#FFFFFF30', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 9, color: '#FFFFFF', fontWeight: '800' }}>+42</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.startMatchBtn}>
              <Text style={styles.startMatchBtnText}>Start Matching</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Startups */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Top Startups</Text>
            <MaterialIcons name="star" size={20} color="#F97316" />
          </View>
          <TouchableOpacity><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.startupScroll} contentContainerStyle={styles.startupContainer}>
          {/* Startup Card 1 */}
          <View style={styles.startupCard}>
            <View style={[styles.startupIcon, { backgroundColor: '#F0FDF4' }]}>
              <MaterialIcons name="agriculture" size={28} color="#16A34A" />
            </View>
            <View style={styles.startupLabel}><Text style={styles.startupLabelText}>SERIES A SEED</Text></View>
            <Text style={styles.startupName}>AgriTech Bareilly</Text>
            <Text style={styles.startupDesc}>Smart IoT solutions for local sugarcane farmers to optimize irrigation.</Text>
            <View style={styles.progressRow}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>Milestone</Text>
                <Text style={styles.progressPct}>85%</Text>
              </View>
              <View style={styles.progressBar}><View style={[styles.progressFill, { width: '85%' }]} /></View>
            </View>
          </View>

          {/* Startup Card 2 */}
          <View style={styles.startupCard}>
            <View style={[styles.startupIcon, { backgroundColor: '#EFF6FF' }]}>
              <MaterialIcons name="auto-stories" size={28} color="#2563EB" />
            </View>
            <View style={[styles.startupLabel, { backgroundColor: '#DBEAFE' }]}><Text style={[styles.startupLabelText, { color: '#1D4ED8' }]}>PRE-REVENUE</Text></View>
            <Text style={styles.startupName}>EduSolve</Text>
            <Text style={styles.startupDesc}>AI-driven vernacular language learning specifically for Rural UP students.</Text>
            <View style={styles.progressRow}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>Beta Testing</Text>
                <Text style={styles.progressPct}>40%</Text>
              </View>
              <View style={styles.progressBar}><View style={[styles.progressFill, { width: '40%' }]} /></View>
            </View>
          </View>
        </ScrollView>

        {/* Pitch Form Card */}
        <View style={styles.pitchCard}>
          <Text style={styles.pitchTitle}>Pitch Your Idea</Text>
          <Text style={styles.pitchSub}>Ready to disrupt the market? Submit your pitch deck.</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>VENTURE NAME</Text>
            <TextInput style={styles.input} placeholder="e.g. Invertis AI" />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ONE-SENTENCE PITCH</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="What problem are you solving?" multiline />
          </View>

          <TouchableOpacity style={styles.uploadArea}>
            <MaterialIcons name="upload-file" size={24} color="#94A3B8" />
            <Text style={styles.uploadText}>UPLOAD PITCH DECK (PDF)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitBtn}>
            <Text style={styles.submitBtnText}>Submit Pitch</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
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
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#EA580C',
    fontStyle: 'italic',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fe9832',
  },
  scroll: {
    paddingBottom: 20,
  },
  heroSection: {
    height: 380,
    position: 'relative',
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'center',
    padding: 24,
  },
  heroBadge: {
    alignSelf: 'baseline',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 20,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 52,
  },
  heroTitleItalic: {
    opacity: 0.7,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  heroBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  pitchBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pitchBtnText: {
    color: '#8b4b00',
    fontWeight: '800',
    fontSize: 14,
  },
  exploreBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  matchCard: {
    backgroundColor: '#4953ac',
    margin: 16,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#4953ac',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardDesc: {
    fontSize: 14,
    color: '#cbceff',
    lineHeight: 20,
    opacity: 0.9,
  },
  matchingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  miniAvatars: {
    flexDirection: 'row',
  },
  mAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#cbceff',
    borderWidth: 2,
    borderColor: '#4953ac',
  },
  startMatchBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startMatchBtnText: {
    color: '#4953ac',
    fontWeight: '800',
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8b4b00',
    textTransform: 'uppercase',
  },
  startupScroll: {
    paddingLeft: 16,
  },
  startupContainer: {
    paddingRight: 24,
    gap: 16,
  },
  startupCard: {
    width: width * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  startupIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  startupLabel: {
    alignSelf: 'baseline',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  startupLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534',
  },
  startupName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  startupDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    lineHeight: 18,
  },
  progressRow: {
    marginTop: 20,
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  progressPct: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8b4b00',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b4b00',
    borderRadius: 3,
  },
  pitchCard: {
    backgroundColor: '#e6e8ea',
    margin: 16,
    borderRadius: 24,
    padding: 24,
  },
  pitchTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1F2937',
  },
  pitchSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginVertical: 12,
  },
  uploadText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 8,
  },
  submitBtn: {
    backgroundColor: '#8b4b00',
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#8b4b00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#8b4b00',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b4b00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 12,
  },
});

export default VentureScreen;
