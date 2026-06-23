import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  Modal,
} from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../hooks/useTheme';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '../../../context/UserContext';
import { createFocusSessionAPI } from '../../../data/apiService';


const { width } = Dimensions.get('window');

const GuidedMeditationScreen = ({ navigation, route }) => {
  const { mode } = route.params || {};
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useUser();
  const [duration, setDuration] = React.useState(10);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [selectedAmbience, setSelectedAmbience] = React.useState('nature');
  const [showSettings, setShowSettings] = React.useState(false);

  // Ambient sound state
  const [ambientSound, setAmbientSound] = React.useState(null);

  // Set up audio mode once
  useEffect(() => {
    const setupAudio = async () => {
      try {
        if (Audio && typeof Audio.setAudioModeAsync === 'function') {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldRouteThroughReceiverLongFormVideo: false,
          });
        }
      } catch (e) {
        console.warn('[AudioMeditation] Setup error:', e);
      }
    };
    setupAudio();
  }, []);

  const ambienceTracks = {
    none: null,
    water: 'https://cdn.freesound.org/previews/177/177479_1038806-hq.mp3', // Rain/Water
    nature: 'https://res.cloudinary.com/ddlfjeqxs/video/upload/v1782225245/Breath_of_the_Mountain_ujdaxl.mp3', // Breath of the Mountain Cloudinary
    night: 'https://cdn.freesound.org/previews/180/180050_1728127-hq.mp3', // Wind/Night
  };

  const stopSound = async () => {
    try {
      if (ambientSound) {
        await ambientSound.stopAsync();
        await ambientSound.unloadAsync();
        setAmbientSound(null);
      }
    } catch (e) {
      console.warn('[MeditationSound] stop error:', e);
    }
  };

  const playAmbientSound = async (type) => {
    try {
      await stopSound();
      const uri = ambienceTracks[type];
      if (!uri) return;

      if (!Audio || !Audio.Sound) {
        console.warn('Audio module is not available');
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, isLooping: true, volume: 0.4 },
        null,
        false // Do not wait for full download, stream instantly
      );
      setAmbientSound(newSound);
    } catch (e) {
      console.warn('[MeditationSound] play error:', e);
    }
  };

  // Sync ambient playback with isPlaying and selectedAmbience
  useEffect(() => {
    if (isPlaying) {
      playAmbientSound(selectedAmbience);
    } else {
      stopSound();
    }
    return () => {
      stopSound();
    };
  }, [isPlaying, selectedAmbience]);

  const ambientSoundRef = useRef(null);
  useEffect(() => {
    ambientSoundRef.current = ambientSound;
  }, [ambientSound]);

  useFocusEffect(
    useCallback(() => {
      // Screen focused
      return () => {
        // Screen blurred
        setIsPlaying(false);
        if (ambientSoundRef.current) {
          ambientSoundRef.current.stopAsync().catch(() => {});
          ambientSoundRef.current.unloadAsync().catch(() => {});
          setAmbientSound(null);
        }
      };
    }, [])
  );

  // Breathing techniques for different relief modes
  const techniques = React.useMemo(() => ({
    Anxious: [
      { state: 'Inhale', duration: 4 },
      { state: 'Hold', duration: 4 },
      { state: 'Exhale', duration: 4 },
      { state: 'Hold', duration: 4 },
    ],
    Focus: [
      { state: 'Inhale', duration: 4 },
      { state: 'Hold', duration: 2 },
      { state: 'Exhale', duration: 4 },
    ],
    'Burned Out': [
      { state: 'Inhale', duration: 5 },
      { state: 'Exhale', duration: 5 },
    ],
    'Visual Guide': [
      { state: 'Inhale', duration: 4 },
      { state: 'Hold', duration: 7 },
      { state: 'Exhale', duration: 8 },
    ],
    'Deep Breathing': [
      { state: 'Inhale', duration: 4 },
      { state: 'Hold', duration: 7 },
      { state: 'Exhale', duration: 8 },
    ],
    Default: [
      { state: 'Inhale', duration: 4 },
      { state: 'Exhale', duration: 4 },
    ],
  }), []);

  // Theme settings mapped to each quick relief mode
  const modeTheme = React.useMemo(() => {
    switch (mode) {
      case 'Anxious':
        return {
          colors: isDark ? ['#0E7490', '#155E75'] : ['#E0F2FE', '#BAE6FD'],
          accent: isDark ? '#22D3EE' : '#0284C7',
          desc: 'Quiet the mind with Box Breathing (4s Inhale, 4s Hold, 4s Exhale, 4s Hold) to calm the nervous system.',
          subtitle: 'Box Breathing Cycle',
        };
      case 'Focus':
        return {
          colors: isDark ? ['#065F46', '#064E3B'] : ['#D1FAE5', '#A7F3D0'],
          accent: isDark ? '#34D399' : '#059669',
          desc: 'Sharpen concentration with 4-2-4 Breathing (4s Inhale, 2s Hold, 4s Exhale) to increase brain oxygenation.',
          subtitle: 'Concentration Cycle',
        };
      case 'Burned Out':
        return {
          colors: isDark ? ['#C2410C', '#9A3412'] : ['#FFEDD5', '#FED7AA'],
          accent: isDark ? '#FB923C' : '#EA580C',
          desc: 'Restore energy with Resonant Breathing (5s Inhale, 5s Exhale) to balance autonomic activity and ease stress.',
          subtitle: 'Resonant Flow',
        };
      case 'Visual Guide':
      case 'Deep Breathing':
      default:
        return {
          colors: isDark ? ['#6D28D9', '#5B21B6'] : ['#F5F3FF', '#EDE9FE'],
          accent: isDark ? '#A78BFA' : '#7C3AED',
          desc: 'Relax deeply with 4-7-8 Breathing (4s Inhale, 7s Hold, 8s Exhale) to release physical tension.',
          subtitle: '4-7-8 Relaxing Breath',
        };
    }
  }, [mode, isDark]);

  const selectedTechnique = techniques[mode] || techniques.Default;

  const [phaseIdx, setPhaseIdx] = React.useState(0);
  const [breatheState, setBreatheState] = React.useState('Tap to Start');
  const [secondsLeft, setSecondsLeft] = React.useState(4);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Animation for the breathing circle
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  const triggerBreatheAnimation = (state, durationMs) => {
    breatheAnim.stopAnimation();
    opacityAnim.stopAnimation();
    
    if (state === 'Inhale') {
      Animated.parallel([
        Animated.timing(breatheAnim, { toValue: 1.3, duration: durationMs, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0.8, duration: durationMs, useNativeDriver: true }),
      ]).start();
    } else if (state === 'Exhale') {
      Animated.parallel([
        Animated.timing(breatheAnim, { toValue: 1.0, duration: durationMs, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0.3, duration: durationMs, useNativeDriver: true }),
      ]).start();
    } else if (state === 'Hold') {
      Animated.timing(opacityAnim, { toValue: 0.6, duration: durationMs, useNativeDriver: true }).start();
    }
  };

  useEffect(() => {
    let timer;
    if (isPlaying) {
      // Set initial
      let currentIdx = 0;
      setPhaseIdx(0);
      let phase = selectedTechnique[currentIdx];
      setBreatheState(phase.state);
      setSecondsLeft(phase.duration);
      triggerBreatheAnimation(phase.state, phase.duration * 1000);

      timer = setInterval(() => {
        setElapsedSeconds((prevE) => {
          if (prevE + 1 >= duration * 60) {
            // Save completed session to API so progress updates dynamically
            if (user?.accessToken) {
              createFocusSessionAPI(user.accessToken, {
                duration_minutes: duration,
                session_type: mode || 'Focus',
              }).catch(e => console.warn(e));
            }
            
            setIsPlaying(false);
            return 0;
          }
          return prevE + 1;
        });

        setSecondsLeft((prev) => {
          if (prev <= 1) {
            currentIdx = (currentIdx + 1) % selectedTechnique.length;
            setPhaseIdx(currentIdx);
            const nextPhase = selectedTechnique[currentIdx];
            setBreatheState(nextPhase.state);
            triggerBreatheAnimation(nextPhase.state, nextPhase.duration * 1000);
            return nextPhase.duration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreatheState(elapsedSeconds > 0 ? 'Paused' : 'Tap to Start');
      setPhaseIdx(0);
      setSecondsLeft(4);
      breatheAnim.setValue(1);
      opacityAnim.setValue(0.3);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, selectedTechnique, duration]);

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
        <TouchableOpacity 
          style={[styles.profileBox, { borderColor: isDark ? 'rgba(254, 152, 50, 0.4)' : 'rgba(139, 75, 0, 0.2)' }]}
          onPress={() => setShowSettings(true)}
        >
          <MaterialIcons name="tune" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>


      <View style={{ flex: 1, paddingBottom: 40, justifyContent: 'space-between' }}>
        {/* Editorial Header */}
        <View style={styles.heroHeader}>
          <Text style={[styles.heroTag, { color: modeTheme.accent }]}>{mode ? mode.toUpperCase() : 'GUIDED EXPERIENCE'}</Text>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
            {modeTheme.subtitle}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8, lineHeight: 20 }}>
            {modeTheme.desc}
          </Text>
        </View>


        {/* Pulsating Breathing Pacer */}
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => setIsPlaying(!isPlaying)}
          style={styles.breathingContainer}
        >
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
              colors={modeTheme.colors}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={[styles.innerCircle, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              <Text style={[styles.breatheStatus, { color: colors.primary }]}>{breatheState}</Text>
              <Text style={[styles.breatheTime, { color: colors.textSecondary }]}>{secondsLeft} Seconds</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* Progress Indicator */}
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Session Progress</Text>
            <Text style={[styles.progressTime, { color: colors.textPrimary }]}>{formatTime(elapsedSeconds)} / {duration}:00</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={[styles.progressBarFill, { width: `${duration > 0 ? (elapsedSeconds / (duration * 60)) * 100 : 0}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>

      </View>

      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowSettings(false)} />
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: insets.bottom + 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textPrimary }}>Session Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <MaterialIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Controls Grid */}
            <View style={{ gap: 16 }}>
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
                      style={[
                        styles.durationBtn, 
                        { backgroundColor: colors.border }, 
                        duration === t && styles.durationBtnActive, 
                        duration === t && { backgroundColor: colors.primary }
                      ]}
                      onPress={() => setDuration(t)}
                    >
                      <Text style={[
                        styles.durationText, 
                        { color: colors.textSecondary }, 
                        duration === t && styles.durationTextActive,
                        duration === t && { color: '#FFFFFF' }
                      ]}>
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
                  <Text style={[styles.controlLabel, { color: isDark ? '#818CF8' : '#4953AC' }]}>AMBIENCE LOOP</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ambienceScroll}>
                  <TouchableOpacity 
                    style={[
                      styles.ambienceIconBg, 
                      { 
                        backgroundColor: selectedAmbience === 'none' 
                          ? (isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.25)') 
                          : (isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(150, 0, 0, 0.05)'),
                        borderColor: selectedAmbience === 'none' ? modeTheme.accent : 'transparent',
                        borderWidth: selectedAmbience === 'none' ? 2 : 0 
                      }
                    ]}
                    onPress={() => {
                      setSelectedAmbience('none');
                    }}
                  >
                    <MaterialCommunityIcons name="volume-off" size={24} color={isDark ? '#F87171' : '#B91C1C'} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.ambienceIconBg, 
                      { 
                        backgroundColor: selectedAmbience === 'water' 
                          ? (isDark ? 'rgba(45, 212, 191, 0.35)' : 'rgba(45, 212, 191, 0.25)') 
                          : (isDark ? 'rgba(45, 212, 191, 0.1)' : 'rgba(0, 102, 102, 0.05)'),
                        borderColor: selectedAmbience === 'water' ? modeTheme.accent : 'transparent',
                        borderWidth: selectedAmbience === 'water' ? 2 : 0 
                      }
                    ]}
                    onPress={() => {
                      setSelectedAmbience('water');
                      if (!isPlaying) setIsPlaying(true);
                    }}
                  >
                    <MaterialCommunityIcons name="water-outline" size={24} color={isDark ? '#2DD4BF' : '#006666'} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.ambienceIconBg, 
                      { 
                        backgroundColor: selectedAmbience === 'nature' 
                          ? (isDark ? 'rgba(254, 152, 50, 0.35)' : 'rgba(254, 152, 50, 0.25)') 
                          : (isDark ? 'rgba(254, 152, 50, 0.1)' : 'rgba(139, 75, 0, 0.05)'),
                        borderColor: selectedAmbience === 'nature' ? modeTheme.accent : 'transparent',
                        borderWidth: selectedAmbience === 'nature' ? 2 : 0 
                      }
                    ]}
                    onPress={() => {
                      setSelectedAmbience('nature');
                      if (!isPlaying) setIsPlaying(true);
                    }}
                  >
                    <MaterialCommunityIcons name="nature" size={24} color={isDark ? '#FE9832' : '#8B4B00'} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.ambienceIconBg, 
                      { 
                        backgroundColor: selectedAmbience === 'night' 
                          ? (isDark ? 'rgba(129, 140, 248, 0.35)' : 'rgba(129, 140, 248, 0.25)') 
                          : (isDark ? 'rgba(129, 140, 248, 0.1)' : 'rgba(73, 83, 172, 0.05)'),
                        borderColor: selectedAmbience === 'night' ? modeTheme.accent : 'transparent',
                        borderWidth: selectedAmbience === 'night' ? 2 : 0
                      }
                    ]}
                    onPress={() => {
                      setSelectedAmbience('night');
                      if (!isPlaying) setIsPlaying(true);
                    }}
                  >
                    <MaterialCommunityIcons name="weather-night" size={24} color={isDark ? '#818CF8' : '#4953AC'} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.ambienceIconBg, { backgroundColor: colors.border }]} onPress={() => Alert.alert('Premium feature', 'Unlock all ambient sounds in your profile settings.')}>
                    <MaterialIcons name="add" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </Modal>

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
    width: 256,
    height: 256,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
    position: 'relative',
  },
  haloRing: {
    position: 'absolute',
    top: 0,
    left: 0,
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
    textAlign: 'center',
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
