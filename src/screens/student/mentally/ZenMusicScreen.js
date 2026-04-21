import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../hooks/useTheme';


const { width } = Dimensions.get('window');

const ZenMusicScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();


  const binauralBeats = [
    { title: 'Alpha State', desc: 'Focus & Flow (8-14 Hz)', icon: 'psychology', color: '#006666' },
    { title: 'Theta Dreams', desc: 'Deep Meditation (4-8 Hz)', icon: 'bedtime', color: '#4953AC' },
    { title: 'Beta Boost', desc: 'Alertness (14-30 Hz)', icon: 'lightning-bolt', color: '#8B4B00', active: true },
    { title: 'Gamma Insight', desc: 'High Processing (30+ Hz)', icon: 'lightbulb-outline', color: '#B02500' },
  ];

  const soundscapes = [
    { 
      title: 'Garden Winds', 
      sub: 'University Central Plaza', 
      icon: 'air', 
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYgd-7Fe36Z9Fu-8h3Cq4_ioXEvOD7m_5hspok35j1s5c_9g3TvAdNueOKxPngYTaYsyvrQWb7mT8zdMiGJRcN5KytpBuYqDjhnkpDfDYpXq_W8nwKbAkeonOIzWzryvXGmgQo3D1IsetnAAGsLQj3EOnXX0LIP0EjffXCEYww-r5MJ_5ui9ilKTW-wPa9o7yUB-lCaVh4MKG7pW9YevyVAJzcqqL015usPavKAcBAx08_c0MgnShqmoRe75xL-lIeppsXDkSkhGAK'
    },
    { 
      title: 'Study Hub Buzz', 
      sub: 'Morning Cafe Murmurs', 
      icon: 'groups', 
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXou1g59el6K4Rb45O3yFEbQ-SpTNpVtGkgKNOLUIfJeJaLgd_rSCv2gW2G3qYzhUjdItYt4remKvDsDejDvHQG1ud0yB9mH_A4Yk67czpdhdU2ngxiIjrQK3w4aemg9Sm1WX7uqVrMnncv2pa3sBpj_iv_yWK_DQ_UXdnf9cfWXnILnRjTDI5h6lEjAyGXtfPwiGYGD2Nh_ZTRRh8opzjuQw4H1VYIJJUc1D3kqTdxHZq94HIbhjDnBnQ8KAfHWNCqhW8I8PR7jGe'
    },
  ];

  const curatedMixes = [
    { 
      title: 'Exam Prep Power', 
      sub: 'Alpha waves + Lo-fi Beats', 
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkYPkZm4wg1dieX55BEyZhLJOxFHegph7YjKBi7kwcxmAJwYMVbTGgQfDGJbUubPrWiKybRSS3jwTgE95s8sT9AZofqIqsY328E9uKh1oCb0mShm_cZIXwpWLRXIX2yiFfuGlIGj6R-FGA99WFm-kxvqqcAEsic8Xo5DVmmVVF7WnsuIxedvpMUnoYnz1wTkD_zrUlhHVY24RwS-OwiyfMkDXY_NHxRVJ9YlkjoDJIRbyeKSzETIbWrW8ZGpkEShTG4FirU1gCHlIY' 
    },
    { 
      title: 'Campus Sleep Oasis', 
      sub: 'Delta waves + Library Silence', 
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAH72_fq5fFp6lvcq_u2QP-hWfUYd0awu4nznMOvl0qPniQjnlaAShsQ9bDTiGOkkI12UvrA5urGBlzr1OVYUiB41L-O6v0vN4-9L-8oYzX84fsbH0ca0Ez7p_qZSqijstgqLFSUzZSjqoP6ZRJFigqlFQJbwveedgTfLMVH8lGy-s_PDpOB3afrXejzWVtWPJdyh3UVfaLmXZfYC1XEdeq6sB_FWRdzsixsM0hcCi5qIJsRvSWp-HoIUQ2gkXMg_FNJvPmFPdjViPY' 
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>

      {/* Top Navigation */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Wellness Hub</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="menu" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>


      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Now Playing Hero */}
        <View style={styles.heroSection}>
          <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>

            <View style={styles.artContainer}>
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWtTpRxdTjwzQJOyeHOrPOtccbf921xutvioy0PShNHvDAddxFrI-xMgUnztGMG_CQ9KEA7WVJFEf79QR1edhzEelzWualXrHUuqU-1BhWfk-u_RVlXo0AfySJmVRgBETtgqVt3t9WDJHgQ23-kPF2VqBBRZAOH32NP6JFTxDVFN9YJqiqQk59TkAN4OJdXY6ZVhNHZBoYU1cLn12LiG4H4_-Ahzej8fk-hc9w7n2GwzMjYvq4JQ93PbfRYJUp_XloZhaICkFyTDnY' }} 
                style={styles.heroImage} 
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.heroGradient}
              />
              <View style={styles.heroInfo}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>AMBIENT FOCUS</Text>
                </View>
                <Text style={styles.heroTitle}>Library Rain</Text>
                <Text style={styles.heroSub}>Invertis Campus Soundscapes</Text>
              </View>
            </View>

            <View style={styles.controlsInterface}>
              <View style={styles.playbackInfo}>
                <View>
                  <Text style={[styles.trackTitle, { color: isDark ? '#818CF8' : '#4953AC' }]}>Deep Concentration</Text>
                  <Text style={[styles.trackSub, { color: colors.textSecondary }]}>Session Duration: 45:00</Text>
                </View>
                <TouchableOpacity>
                  <MaterialIcons name="favorite" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>


              <View style={styles.progressContainer}>
                <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    style={[styles.progressBarFill, { width: '33%' }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>

                <View style={styles.timeRow}>
                  <Text style={[styles.timeText, { color: colors.textMuted }]}>15:20</Text>
                  <Text style={[styles.timeText, { color: colors.textMuted }]}>45:00</Text>
                </View>
              </View>


              <View style={styles.mainControls}>
                <TouchableOpacity><MaterialIcons name="shuffle" size={24} color={colors.textSecondary} /></TouchableOpacity>
                <TouchableOpacity><MaterialIcons name="skip-previous" size={32} color={isDark ? '#818CF8' : '#4953AC'} /></TouchableOpacity>
                <TouchableOpacity style={[styles.playBtnLarge, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
                  <MaterialIcons name="pause" size={40} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity><MaterialIcons name="skip-next" size={32} color={isDark ? '#818CF8' : '#4953AC'} /></TouchableOpacity>
                <TouchableOpacity><MaterialIcons name="repeat" size={24} color={colors.textSecondary} /></TouchableOpacity>
              </View>


              <View style={styles.volumeContainer}>
                <MaterialIcons name="volume-down" size={20} color={colors.textSecondary} />
                <View style={[styles.volumeSliderBg, { backgroundColor: colors.border }]}>
                  <View style={[styles.volumeSliderFill, { backgroundColor: isDark ? '#818CF8' : '#4953AC' }, { width: '75%' }]} />
                  <View style={[styles.volumeThumb, { borderColor: isDark ? '#818CF8' : '#4953AC', backgroundColor: colors.card }, { left: '75%' }]} />
                </View>
                <MaterialIcons name="volume-up" size={20} color={colors.textSecondary} />
              </View>

            </View>
          </View>
        </View>

        {/* Binaural Beats Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Binaural Beats</Text>
            <TouchableOpacity><Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text></TouchableOpacity>
          </View>

          <View style={styles.beatsGrid}>
            {binauralBeats.map((beat) => (
              <TouchableOpacity 
                key={beat.title} 
                style={[
                  styles.beatCard, 
                  { backgroundColor: isDark ? colors.card : '#EFF1F2' },
                  beat.active && [styles.beatCardActive, { backgroundColor: colors.card, borderColor: colors.primary + '4D' }]
                ]}
              >

                <View style={[styles.beatIconBg, { backgroundColor: `${beat.color}1A` }]}>
                  <MaterialIcons name={beat.icon} size={28} color={beat.color} />
                </View>
                <View style={styles.beatInfo}>
                  <Text style={[styles.beatTitle, { color: colors.textPrimary }]}>{beat.title}</Text>
                  <Text style={[styles.beatSub, { color: colors.textSecondary }]}>{beat.desc}</Text>
                </View>
                {beat.active ? (
                  <MaterialIcons name="equalizer" size={20} color={colors.primary} />
                ) : (
                  <MaterialIcons name="play-circle-outline" size={20} color={colors.textSecondary} style={styles.playIcon} />
                )}
              </TouchableOpacity>

            ))}
          </View>
        </View>

        {/* Campus Ambience */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Campus Ambience</Text>

          <View style={styles.ambienceGrid}>
            {soundscapes.map((scene) => (
              <TouchableOpacity key={scene.title} style={styles.ambienceCard}>
                <Image source={{ uri: scene.image }} style={styles.ambienceImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.heroGradient}
                />
                <View style={styles.ambienceContent}>
                  <Text style={styles.ambienceTitle}>{scene.title}</Text>
                  <Text style={styles.ambienceSub}>{scene.sub}</Text>
                </View>
                <View style={styles.ambienceIconWrapper}>
                  <MaterialIcons name={scene.icon} size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Curated horizontal */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Curated for You</Text>
            <View style={styles.scrollArrows}>
              <TouchableOpacity style={[styles.arrowBtn, { backgroundColor: isDark ? colors.card : '#EFF1F2' }]}><MaterialIcons name="chevron-left" size={24} color={colors.textSecondary} /></TouchableOpacity>
              <TouchableOpacity style={[styles.arrowBtn, { backgroundColor: isDark ? colors.card : '#EFF1F2' }]}><MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} /></TouchableOpacity>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.curatedScroll}>
            {curatedMixes.map((mix) => (
              <TouchableOpacity key={mix.title} style={styles.mixCard}>
                <Image source={{ uri: mix.image }} style={styles.mixImage} />
                <View style={styles.mixPlayOverlay}>
                   <View style={[styles.smallPlayBtn, { backgroundColor: colors.primary }]}>
                     <MaterialIcons name="play-arrow" size={32} color="#FFFFFF" />
                   </View>
                </View>

                <Text style={[styles.mixTitle, { color: colors.textPrimary }]}>{mix.title}</Text>
                <Text style={[styles.mixSub, { color: colors.textSecondary }]}>{mix.sub}</Text>
              </TouchableOpacity>

            ))}
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  iconBtn: {
    padding: 4,
  },
  scroll: {
    paddingBottom: 20,
  },
  heroSection: {
    padding: 20,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },

  artContainer: {
    aspectRatio: 1,
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroInfo: {
    position: 'absolute',
    bottom: 24,
    left: 24,
  },
  heroBadge: {
    backgroundColor: 'rgba(0,102,102,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  controlsInterface: {
    padding: 24,
  },
  playbackInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '800',
  },

  trackSub: {
    fontSize: 12,
    fontWeight: '600',
  },

  progressContainer: {
    marginBottom: 24,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },

  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  mainControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginBottom: 32,
  },
  playBtnLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },

  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  volumeSliderBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    position: 'relative',
  },

  volumeSliderFill: {
    height: '100%',
    backgroundColor: '#4953AC',
    borderRadius: 2,
  },
  volumeThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2C2F30',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8B4B00',
  },
  beatsGrid: {
    gap: 12,
  },
  beatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },

  beatCardActive: {
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  beatIconBg: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  beatInfo: {
    flex: 1,
  },
  beatTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },

  beatSub: {
    fontSize: 12,
    color: '#595C5D',
    fontWeight: '600',
  },
  ambienceGrid: {
    gap: 16,
  },
  ambienceCard: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  ambienceImage: {
    ...StyleSheet.absoluteFillObject,
  },
  ambienceContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  ambienceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ambienceSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  ambienceIconWrapper: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArrows: {
    flexDirection: 'row',
    gap: 8,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  curatedScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  mixCard: {
    width: 240,
    marginRight: 20,
  },
  mixImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 12,
  },
  mixPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallPlayBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B4B00',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0, // In group hover it would be 1
  },
  mixTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },

  mixSub: {
    fontSize: 12,
    color: '#595C5D',
    fontWeight: '600',
  },
});

export default ZenMusicScreen;
