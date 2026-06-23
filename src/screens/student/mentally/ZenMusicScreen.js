import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert
} from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../hooks/useTheme';
import { APP_CONFIG } from '../../../config/appConfig';
import { ActivityIndicator, PanResponder } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ZenMusicScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Audio Player State
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(45 * 60 * 1000);
  const [volume, setVolume] = useState(0.75);
  const sliderWidthRef = React.useRef(0);
  const [favorites, setFavorites] = useState([]);
  
  const [currentTrack, setCurrentTrack] = useState({
    title: 'Deep Meditation',
    sub: 'Zen Frequencies • Focus & Calm',
    uri: 'https://res.cloudinary.com/ddlfjeqxs/video/upload/v1781803883/zen-music/q51xt1ybb463h1kdeddf.mp3',
    image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=1000&auto=format&fit=crop',
    id: 'meditation'
  });

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      if (status.durationMillis) {
        setDuration(status.durationMillis);
      }
      setIsPlaying(status.isPlaying);
      setIsLoading(status.isBuffering);
    } else if (status.error) {
      console.warn('Playback error:', status.error);
      setIsLoading(false);
    }
  };

  const playSound = async (track) => {
    if (track.isPremium) {
      Alert.alert('Premium Feature', `${track.title} is locked in this demo.`);
      return;
    }

    try {
      if (!Audio || !Audio.Sound) {
        Alert.alert('Native Module Required', 'Audio playback is not supported on this client yet.');
        return;
      }

      // Immediately update UI to show the selected track and a loading state
      setCurrentTrack(track);
      setIsLoading(true);

      if (sound) {
        // Unload the old sound asynchronously without blocking
        sound.unloadAsync().catch(e => console.warn('Unload error:', e));
        setSound(null);
      }

      // Create new sound without auto-play initially
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        { shouldPlay: false, volume: volume },
        onPlaybackStatusUpdate,
        false
      );
      
      setSound(newSound);
      setIsLoading(false);
      
      // Start playback explicitly
      await newSound.playAsync();
      setIsPlaying(true);
    } catch (e) {
      setIsLoading(false);
      console.warn('Playback error:', e);
      Alert.alert('Playback Error', 'Could not play audio track. ' + e.message);
    }
  };

  const handlePlayPause = async () => {
    if (!Audio || !Audio.Sound) {
      Alert.alert('Native Module Required', 'Audio playback is not supported on this client yet. Rebuild required.');
      return;
    }
    try {
      if (!sound) {
        await playSound(currentTrack);
        return;
      }
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn('Play/pause error:', e);
    }
  };

  const formatTime = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  useEffect(() => {
    const configureAudio = async () => {
      try {
        if (Audio && Audio.setAudioModeAsync) {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldRouteThroughReceiverLongFormVideo: false,
          });
        }
      } catch (e) {
        console.warn('Initial audio mode error:', e);
      }
    };
    configureAudio();

    const loadFavs = async () => {
      try {
        const stored = await AsyncStorage.getItem('zen_favorites');
        if (stored) setFavorites(JSON.parse(stored));
      } catch (e) {
        console.warn('Load favs error:', e);
      }
    };
    loadFavs();

    return () => {
      if (sound) {
        sound.unloadAsync().catch(e => console.warn('[ZenMusic] Cleanup unload error:', e));
      }
    };
  }, [sound]);

  const toggleFavorite = async () => {
    let newFavs;
    if (favorites.includes(currentTrack.id)) {
      newFavs = favorites.filter(id => id !== currentTrack.id);
    } else {
      newFavs = [...favorites, currentTrack.id];
    }
    setFavorites(newFavs);
    try {
      await AsyncStorage.setItem('zen_favorites', JSON.stringify(newFavs));
    } catch (e) {
      console.warn('Save fav error:', e);
    }
  };

  const handleVolumeChange = async (newVol) => {
    setVolume(newVol);
    if (soundRef.current) {
      try {
        await soundRef.current.setVolumeAsync(newVol);
      } catch (e) {
        console.warn('Set volume error:', e);
      }
    }
  };

  const initialVolumeRef = React.useRef(0);

  const volumePanResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (sliderWidthRef.current > 0) {
          const startVol = Math.max(0, Math.min(1, evt.nativeEvent.locationX / sliderWidthRef.current));
          initialVolumeRef.current = startVol;
          handleVolumeChange(startVol);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (sliderWidthRef.current > 0) {
          const deltaVol = gestureState.dx / sliderWidthRef.current;
          const newVol = Math.max(0, Math.min(1, initialVolumeRef.current + deltaVol));
          handleVolumeChange(newVol);
        }
      }
    })
  ).current;

  const durationRef = React.useRef(duration);
  const soundRef = React.useRef(sound);
  const progressWidthRef = React.useRef(0);
  const initialProgressRef = React.useRef(0);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  const handleProgressGrant = async (evt) => {
    if (progressWidthRef.current > 0 && soundRef.current && durationRef.current > 0) {
      const x = evt.nativeEvent.locationX;
      const percent = Math.max(0, Math.min(1, x / progressWidthRef.current));
      initialProgressRef.current = percent;
      const newPos = percent * durationRef.current;
      setPosition(newPos);
      try {
        await soundRef.current.setPositionAsync(newPos);
      } catch (e) {
        console.warn('Seek error:', e);
      }
    }
  };

  const handleProgressMove = async (evt, gestureState) => {
    if (progressWidthRef.current > 0 && soundRef.current && durationRef.current > 0) {
      const deltaPercent = gestureState.dx / progressWidthRef.current;
      const percent = Math.max(0, Math.min(1, initialProgressRef.current + deltaPercent));
      const newPos = percent * durationRef.current;
      setPosition(newPos);
      try {
        await soundRef.current.setPositionAsync(newPos);
      } catch (e) {
        console.warn('Seek error:', e);
      }
    }
  };

  const progressPanResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: handleProgressGrant,
      onPanResponderMove: handleProgressMove
    })
  ).current;

  useFocusEffect(
    React.useCallback(() => {
      // When screen focuses, do nothing special
      return () => {
        // When screen loses focus (e.g. navigating away)
        if (sound) {
          sound.pauseAsync().catch(e => console.warn('[ZenMusic] Blur pause error:', e));
          setIsPlaying(false);
        }
      };
    }, [sound])
  );

  const binauralBeats = [
    { title: 'Deep Meditation', desc: 'Zen Frequencies • Calm', icon: 'psychology', color: '#006666', uri: 'https://res.cloudinary.com/ddlfjeqxs/video/upload/v1781803883/zen-music/q51xt1ybb463h1kdeddf.mp3', id: 'meditation' },
    { title: 'Inspiring Flow', desc: 'Female Vocals • Motivation', icon: 'lightbulb-outline', color: '#4953AC', uri: 'https://res.cloudinary.com/ddlfjeqxs/video/upload/v1781803850/zen-music/wfailvhjis4oml53moee.mp3', id: 'inspire_f' },
    { title: 'Inspiring Momentum', desc: 'Male Vocals • Drive', icon: 'trending-up', color: '#8B4B00', uri: 'https://res.cloudinary.com/ddlfjeqxs/video/upload/v1781803864/zen-music/uiygfebabkx75ybratw4.mp3', id: 'inspire_m' },
  ];

  const soundscapes = [
    { 
      title: 'Mossy Dawn', 
      sub: 'Morning Bird Chorus', 
      icon: 'forest', 
      uri: 'https://res.cloudinary.com/ddlfjeqxs/video/upload/v1781803894/zen-music/vexrnpnay0eherxruarj.mp3',
      id: 'mossy_dawn',
      image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1000&auto=format&fit=crop',
      isPremium: true
    },
    { 
      title: 'Whispering Pines', 
      sub: 'Soft Wind & Trees', 
      icon: 'air', 
      uri: 'https://res.cloudinary.com/ddlfjeqxs/video/upload/v1781803938/zen-music/icqqup3tksnpefbq4fgc.mp3',
      id: 'whispering_pines',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop',
      isPremium: true
    },
  ];

  const curatedMixes = [
    { 
      title: 'Tideglass Calm', 
      sub: 'Gentle relaxation', 
      uri: 'https://res.cloudinary.com/ddlfjeqxs/video/upload/v1781803929/zen-music/w4xmosw5xm5nzaidmupg.mp3',
      id: 'tideglass',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop' 
    },
    { 
      title: 'Tideglass Drift', 
      sub: 'Deep ambient sleep', 
      uri: 'https://res.cloudinary.com/ddlfjeqxs/video/upload/v1781803912/zen-music/qxyow2rur1la6aw84ghq.mp3',
      id: 'tideglass_drift',
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop' 
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
      </View>


      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Now Playing Hero */}
        <View style={styles.heroSection}>
          <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>

            <View style={styles.artContainer}>
              <Image 
                source={{ uri: currentTrack.image }} 
                style={styles.heroImage} 
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.heroGradient}
              />
              <View style={styles.heroInfo}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>AMBIENT ZEN PLAYER</Text>
                </View>
                <Text style={styles.heroTitle}>{currentTrack.title}</Text>
                <Text style={styles.heroSub}>{currentTrack.sub}</Text>
              </View>
            </View>

            <View style={styles.controlsInterface}>
              <View style={styles.playbackInfo}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.trackTitle, { color: isDark ? '#818CF8' : '#4953AC' }]}>{currentTrack.title}</Text>
                  <Text style={[styles.trackSub, { color: colors.textSecondary }]}>
                    {isLoading ? 'Buffering...' : (isPlaying ? 'Relieving Anxiety...' : 'Paused')}
                  </Text>
                </View>
                <TouchableOpacity onPress={toggleFavorite}>
                  <MaterialIcons name={favorites.includes(currentTrack.id) ? "favorite" : "favorite-border"} size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>


              <View style={styles.progressContainer}>
                <View 
                  style={[styles.progressBarBg, { backgroundColor: colors.border }]}
                  onLayout={(e) => { progressWidthRef.current = e.nativeEvent.layout.width; }}
                  {...progressPanResponder.panHandlers}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>

                <View style={styles.timeRow}>
                  <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(position)}</Text>
                  <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(duration)}</Text>
                </View>
              </View>


              <View style={styles.mainControls}>
                <TouchableOpacity onPress={() => Alert.alert('Previous track', 'Moving to previous track.')}><MaterialIcons name="skip-previous" size={32} color={isDark ? '#818CF8' : '#4953AC'} /></TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.playBtnLarge, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                  onPress={handlePlayPause}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="large" />
                  ) : (
                    <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={40} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Alert.alert('Next track', 'Moving to next track.')}><MaterialIcons name="skip-next" size={32} color={isDark ? '#818CF8' : '#4953AC'} /></TouchableOpacity>
              </View>


              <View style={styles.volumeContainer}>
                <MaterialIcons name="volume-down" size={20} color={colors.textSecondary} />
                <View 
                  style={[styles.volumeSliderBg, { backgroundColor: colors.border }]}
                  onLayout={(e) => { sliderWidthRef.current = e.nativeEvent.layout.width; }}
                  {...volumePanResponder.panHandlers}
                >
                  <View style={[styles.volumeSliderFill, { backgroundColor: isDark ? '#818CF8' : '#4953AC' }, { width: `${volume * 100}%` }]} pointerEvents="none" />
                  <View style={[styles.volumeThumb, { borderColor: isDark ? '#818CF8' : '#4953AC', backgroundColor: colors.card }, { left: `${volume * 100}%` }]} pointerEvents="none" />
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
            <TouchableOpacity onPress={() => Alert.alert('Premium feature', 'Unlock all beats.')}><Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text></TouchableOpacity>
          </View>

          <View style={styles.beatsGrid}>
            {binauralBeats.map((beat) => {
              const isCurrent = currentTrack.id === beat.id;
              return (
                <TouchableOpacity 
                  key={beat.title} 
                  style={[
                    styles.beatCard, 
                    { backgroundColor: isDark ? colors.card : '#EFF1F2' },
                    isCurrent && [styles.beatCardActive, { backgroundColor: colors.card, borderColor: colors.primary + '4D' }]
                  ]}
                  onPress={() => playSound({ ...beat, image: currentTrack.image })}
                >

                  <View style={[styles.beatIconBg, { backgroundColor: `${beat.color}1A` }]}>
                    <MaterialIcons name={beat.icon} size={28} color={beat.color} />
                  </View>
                  <View style={styles.beatInfo}>
                    <Text style={[styles.beatTitle, { color: colors.textPrimary }]}>{beat.title}</Text>
                    <Text style={[styles.beatSub, { color: colors.textSecondary }]}>{beat.desc}</Text>
                  </View>
                  {isCurrent && isPlaying ? (
                    <MaterialIcons name="equalizer" size={20} color={colors.primary} />
                  ) : (
                    <MaterialIcons name="play-circle-outline" size={20} color={colors.textSecondary} style={styles.playIcon} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Campus Ambience */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Campus Ambience</Text>

          <View style={styles.ambienceGrid}>
            {soundscapes.map((scene) => {
              const isCurrent = currentTrack.id === scene.id;
              return (
                <TouchableOpacity 
                  key={scene.title} 
                  style={[styles.ambienceCard, isCurrent && { borderWidth: 2, borderColor: colors.primary }, scene.isPremium && { opacity: 0.7 }]}
                  onPress={() => playSound(scene)}
                >
                  <Image source={{ uri: scene.image }} style={styles.ambienceImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.heroGradient}
                  />
                  <View style={styles.ambienceContent}>
                    <Text style={styles.ambienceTitle}>{scene.title}</Text>
                    <Text style={styles.ambienceSub}>{scene.sub}</Text>
                  </View>
                  {scene.isPremium ? (
                    <View style={styles.ambienceIconWrapper}>
                      <MaterialIcons name="lock" size={16} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={styles.ambienceIconWrapper}>
                      <MaterialIcons name={isCurrent && isPlaying ? "pause" : scene.icon} size={16} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
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
            {curatedMixes.map((mix) => {
              const isCurrent = currentTrack.id === mix.id;
              return (
                <TouchableOpacity 
                  key={mix.title} 
                  style={[styles.mixCard, isCurrent && { borderWidth: 2, borderColor: colors.primary, borderRadius: 16 }]}
                  onPress={() => playSound(mix)}
                >
                  <Image source={{ uri: mix.image }} style={styles.mixImage} />
                  <View style={styles.mixPlayOverlay}>
                     <View style={[styles.smallPlayBtn, { backgroundColor: colors.primary, opacity: 1 }]}>
                       <MaterialIcons name={isCurrent && isPlaying ? "pause" : "play-arrow"} size={32} color="#FFFFFF" />
                     </View>
                  </View>

                  <Text style={[styles.mixTitle, { color: colors.textPrimary }]}>{mix.title}</Text>
                  <Text style={[styles.mixSub, { color: colors.textSecondary }]}>{mix.sub}</Text>
                </TouchableOpacity>
              );
            })}
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
