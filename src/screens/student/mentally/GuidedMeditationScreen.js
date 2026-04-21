import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../hooks/useTheme';


const { width } = Dimensions.get('window');

const GuidedMeditationScreen = ({ navigation, route }) => {
  const { mode } = route.params || {};
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [duration, setDuration] = React.useState(10);

  const [isPlaying, setIsPlaying] = React.useState(false);
  
  // Animation for the breathing circle
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    let animation;
    if (isPlaying) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(breatheAnim, {
              toValue: 1.3,
              duration: 4000,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.6,
              duration: 4000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(breatheAnim, {
              toValue: 1,
              duration: 4000,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.3,
              duration: 4000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      animation.start();
    } else {
      breatheAnim.setValue(1);
      opacityAnim.setValue(0.3);
    }
    return () => animation?.stop();
  }, [isPlaying]);

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
        <View style={[styles.profileBox, { borderColor: isDark ? 'rgba(254, 152, 50, 0.4)' : 'rgba(139, 75, 0, 0.2)' }]}>
          <MaterialCommunityIcons name="spa-outline" size={24} color={colors.primary} />
        </View>
      </View>


      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Editorial Header */}
        <View style={styles.heroHeader}>
          <Text style={[styles.heroTag, { color: colors.primary }]}>{mode ? mode.toUpperCase() : 'GUIDED EXPERIENCE'}</Text>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
            {mode === 'Anxious' ? 'Quiet the Mind.' : 
             mode === 'Focus' ? 'Sharpen the Eye.' :
             mode === 'Burned Out' ? 'Recharge Yourself.' :
             'Inhale Calm, \nExhale Stress.'}
          </Text>
        </View>


        {/* Pulsating Breathing Pacer */}
        <View style={styles.breathingContainer}>
          <Animated.View 
            style={[
              styles.haloRing, 
              { 
                transform: [{ scale: breatheAnim }], 
                opacity: opacityAnim 
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.breathingCircle, 
              { 
                transform: [{ scale: breatheAnim }] 
              }
            ]}
          >
            <LinearGradient
              colors={isDark ? ['rgba(254, 152, 50, 0.2)', 'rgba(254, 152, 50, 0.4)'] : ['rgba(139, 75, 0, 0.1)', 'rgba(254, 152, 50, 0.2)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={[styles.innerCircle, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              <Text style={[styles.breatheStatus, { color: colors.primary }]}>{isPlaying ? 'Inhale' : 'Ready?'}</Text>
              <Text style={[styles.breatheTime, { color: colors.textSecondary }]}>4 Seconds</Text>
            </View>
          </Animated.View>


          {/* Progress Indicator */}
          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Session Progress</Text>
              <Text style={[styles.progressTime, { color: colors.textPrimary }]}>04:12 / 10:00</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={[styles.progressBarFill, { width: '42%' }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>

        </View>

        {/* Controls Grid */}
        <View style={styles.controlsGrid}>
          {/* Duration Selector */}
          <View style={[styles.controlCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.controlHeader}>
              <MaterialIcons name="schedule" size={14} color={isDark ? '#818CF8' : '#4953AC'} />
              <Text style={[styles.controlLabel, { color: isDark ? '#818CF8' : '#4953AC' }]}>SESSION DURATION</Text>
            </View>

            <View style={styles.durationButtons}>
              {[5, 10, 15].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.durationBtn, { backgroundColor: colors.border }, duration === t && (styles.durationBtnActive, { backgroundColor: colors.primary })]}
                  onPress={() => setDuration(t)}
                >
                  <Text style={[styles.durationText, { color: colors.textSecondary }, duration === t && (styles.durationTextActive, { color: '#FFFFFF' })]}>
                    {t} MIN
                  </Text>
                </TouchableOpacity>

              ))}
            </View>
          </View>

          {/* Ambient Selection */}
          <View style={[styles.controlCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.controlHeader}>
              <MaterialIcons name="filter-drama" size={14} color={isDark ? '#818CF8' : '#4953AC'} />
              <Text style={[styles.controlLabel, { color: isDark ? '#818CF8' : '#4953AC' }]}>AMBIENCE</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ambienceScroll}>
              <TouchableOpacity style={[styles.ambienceIconBg, { backgroundColor: isDark ? 'rgba(45, 212, 191, 0.2)' : 'rgba(0, 102, 102, 0.1)' }]}>
                <MaterialCommunityIcons name="water-outline" size={24} color={isDark ? '#2DD4BF' : '#006666'} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ambienceIconBg, styles.ambienceIconActive, { backgroundColor: isDark ? 'rgba(254, 152, 50, 0.2)' : 'rgba(139, 75, 0, 0.1)', borderColor: colors.primary }]}>
                <MaterialCommunityIcons name="nature" size={24} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ambienceIconBg, { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.2)' : 'rgba(73, 83, 172, 0.1)' }]}>
                <MaterialCommunityIcons name="weather-night" size={24} color={isDark ? '#818CF8' : '#4953AC'} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ambienceIconBg, { backgroundColor: colors.border }]}>
                <MaterialIcons name="add" size={24} color={colors.textSecondary} />
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>

        {/* Main Audio Controls */}
        <View style={styles.audioControls}>
          <TouchableOpacity style={[styles.audioBtnSmall, { backgroundColor: colors.border }]}>
            <MaterialCommunityIcons name="skip-previous" size={32} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.playBtn}
            onPress={() => setIsPlaying(!isPlaying)}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.playBtnGradient}
            >
              <MaterialCommunityIcons 
                name={isPlaying ? "pause" : "play"} 
                size={48} 
                color="#FFFFFF" 
              />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.audioBtnSmall, { backgroundColor: colors.border }]}>
            <MaterialCommunityIcons name="skip-next" size={32} color={colors.textPrimary} />
          </TouchableOpacity>
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

  profileBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },

  scroll: {
    paddingBottom: 20,
  },
  heroHeader: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 40,
  },
  heroTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 8,
  },

  heroTitle: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 48,
  },

  breathingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    position: 'relative',
  },
  haloRing: {
    position: 'absolute',
    width: 256,
    height: 256,
    borderRadius: 128,
    borderWidth: 4,
    borderColor: 'rgba(139, 75, 0, 0.1)',
  },
  breathingCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#8B4B00',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 5,
  },
  innerCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 10,
  },

  breatheStatus: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },

  breatheTime: {
    fontSize: 12,
    fontWeight: '600',
  },

  progressSection: {
    width: '100%',
    paddingHorizontal: 40,
    marginTop: 64,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  progressTime: {
    fontSize: 12,
    fontWeight: '700',
  },

  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  controlsGrid: {
    paddingHorizontal: 20,
    gap: 16,
    marginTop: 32,
  },
  controlCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  durationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  durationBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },

  durationBtnActive: {
    backgroundColor: '#8B4B00',
    shadowColor: '#8B4B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
    transform: [{ scale: 1.05 }],
  },
  durationText: {
    fontSize: 11,
    fontWeight: '800',
  },

  durationTextActive: {
    color: '#FFFFFF',
  },
  ambienceScroll: {
    flexDirection: 'row',
  },
  ambienceIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  ambienceIconActive: {
    borderWidth: 2,
  },

  audioControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    marginTop: 48,
    marginBottom: 40,
  },
  audioBtnSmall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 8,
  },
  playBtnGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GuidedMeditationScreen;
