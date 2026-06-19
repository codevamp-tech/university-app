import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, Modal, Animated, Easing
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { uploadAvatarAPI, createJournalAPI, listJournalAPI } from '../../../data/apiService';
import { useUser } from '../../../context/UserContext';
import { APP_CONFIG } from '../../../config/appConfig';

const { width } = Dimensions.get('window');

const CampusJournalReflectScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { accessToken, user } = useUser();
  
  const [mood, setMood] = React.useState('Focused');
  const [text, setText] = React.useState('');
  const [tagsInput, setTagsInput] = React.useState('');
  const LOCATIONS = ['Main campus', 'Canteen', 'Library', 'Auditorium', 'Play ground', 'Bus'];
  const [location, setLocation] = React.useState(LOCATIONS[0]);
  const [showLocationDropdown, setShowLocationDropdown] = React.useState(false);
  const [images, setImages] = React.useState([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isSaving) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [isSaving]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const moods = [
    { name: 'Inspired', icon: 'sentiment-very-satisfied', color: '#ff9832' },
    { name: 'Focused', icon: 'sentiment-satisfied', color: '#fe9832' },
    { name: 'Calm', icon: 'sentiment-neutral', color: '#3b82f6' },
    { name: 'Pensive', icon: 'psychology', color: '#14b8a6' },
  ];

  const [memories, setMemories] = React.useState([]);

  React.useEffect(() => {
    const loadMemories = async () => {
      try {
        const data = await listJournalAPI(accessToken);
        if (data) {
          const withImages = data.filter(e => e.image_urls && e.image_urls.length > 0).slice(0, 5);
          const mapped = withImages.map(m => ({
            title: m.tags && m.tags.length > 0 ? `#${m.tags[0]}` : m.mood,
            date: new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            img: m.image_urls[0]
          }));
          setMemories(mapped);
        }
      } catch (e) {
        console.warn(e);
      }
    };
    loadMemories();
  }, []);

  const handlePickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.3,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setImages([...images, ...newImages]);
    }
  };

  const handleSave = async () => {
    if (!text.trim() && images.length === 0) return;
    
    setIsSaving(true);
    try {
      const uploadedUrls = [];
      for (const uri of images) {
        const uploadRes = await uploadAvatarAPI(accessToken, uri);
        if (uploadRes.ok && uploadRes.json?.success) {
          uploadedUrls.push(uploadRes.json.data.file_url || uploadRes.json.data.avatar_url);
        } else {
          uploadedUrls.push(uri);
        }
      }

      const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

      const newEntry = {
        mood,
        text,
        images: uploadedUrls,
        tags,
        location,
      };

      const res = await createJournalAPI(accessToken, newEntry);
      
      // Fallback: update local storage anyway for immediate feed display without network reload
      const existingData = await AsyncStorage.getItem('@unicampus_campus_journal');
      const parsedData = existingData ? JSON.parse(existingData) : [];
      if (res) {
        parsedData.unshift({ ...newEntry, id: res.id || Date.now().toString(), date: new Date().toISOString() });
      } else {
        parsedData.unshift({ ...newEntry, id: Date.now().toString(), date: new Date().toISOString() });
      }
      await AsyncStorage.setItem('@unicampus_campus_journal', JSON.stringify(parsedData));
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving journal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Saving Overlay */}
      <Modal transparent visible={isSaving} animationType="fade">
        <View style={styles.savingOverlay}>
          <View style={styles.savingBox}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <MaterialCommunityIcons name="timer-sand" size={48} color="#EA580C" />
            </Animated.View>
            <Text style={styles.savingText}>Publishing Journal...</Text>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#EA580C" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Image
            source={{ uri: user?.avatar_url || (user?.gender === 'F' || user?.gender === 'Female' ? 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500' : 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500') }}
            style={styles.headerProfile}
          />
          <Text style={styles.headerTitle}>New Journal Entry</Text>
        </View>
        <TouchableOpacity>
          <MaterialIcons name="psychology" size={28} color="#EA580C" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.entrySection}>
          <View style={styles.entryHeader}>
            <View>
              <Text style={styles.entryTitle}>Today's Entry</Text>
              <Text style={styles.entrySub}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • {location}</Text>
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
                value={text}
                onChangeText={setText}
              />
              
              <View style={{ zIndex: 10 }}>
                <TouchableOpacity 
                  style={styles.inputRow}
                  onPress={() => setShowLocationDropdown(!showLocationDropdown)}
                >
                  <Ionicons name="location-outline" size={18} color="#9CA3AF" />
                  <Text style={[styles.metaInput, { color: location ? '#1E293B' : '#9CA3AF', paddingVertical: 12 }]}>
                    {location || "Select Location"}
                  </Text>
                  <Ionicons name={showLocationDropdown ? "chevron-up" : "chevron-down"} size={18} color="#9CA3AF" />
                </TouchableOpacity>
                
                {showLocationDropdown && (
                  <View style={styles.dropdownContainer}>
                    {LOCATIONS.map((loc, idx) => (
                      <TouchableOpacity 
                        key={idx} 
                        style={styles.dropdownItem}
                        onPress={() => { setLocation(loc); setShowLocationDropdown(false); }}
                      >
                        <Text style={styles.dropdownItemText}>{loc}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputRow}>
                <Ionicons name="pricetag-outline" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.metaInput}
                  placeholder="Tags (comma separated)"
                  placeholderTextColor="#9CA3AF"
                  value={tagsInput}
                  onChangeText={setTagsInput}
                />
              </View>
              
              {images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewScroll}>
                  {images.map((uri, idx) => (
                    <View key={idx} style={styles.imagePreviewContainer}>
                      <Image source={{ uri }} style={styles.imagePreview} />
                      <TouchableOpacity 
                        style={styles.removeImageBtn}
                        onPress={() => setImages(images.filter((_, i) => i !== idx))}
                      >
                        <MaterialIcons name="close" size={16} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <View style={styles.toolRow}>
                <TouchableOpacity style={styles.toolBtn}>
                  <Ionicons name="mic-outline" size={20} color="#4953ac" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={handlePickImages}>
                  <Ionicons name="image-outline" size={20} color="#4953ac" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>


        {/* Memory Lane */}
        {memories.length > 0 && (
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
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB (Save/Add) */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: 100 }, isSaving && { opacity: 0.7 }]} 
        onPress={handleSave}
        disabled={isSaving}
      >
        <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.fabGradient}>
          {isSaving ? (
            <MaterialIcons name="hourglass-empty" size={32} color="#FFFFFF" />
          ) : (
            <MaterialIcons name="check" size={32} color="#FFFFFF" />
          )}
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 16,
    paddingBottom: 8,
  },
  metaInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginTop: -8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
  },
  imagePreviewScroll: {
    marginTop: 12,
    marginBottom: 4,
  },
  imagePreviewContainer: {
    marginRight: 12,
    position: 'relative',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EA580C',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
  savingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingBox: {
    width: 200,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  savingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
});

export default CampusJournalReflectScreen;
