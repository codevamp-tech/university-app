import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fixImageUrl } from '../../../utils/imageUrl';

const { width } = Dimensions.get('window');

const CampusJournalDetailScreen = ({ route, navigation }) => {
  const { entry } = route.params;
  const insets = useSafeAreaInsets();

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Entry Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.metaContainer}>
          <Text style={styles.dateText}>{formatDate(entry.date)}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{formatTime(entry.date)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{entry.location || 'Campus'}</Text>
            </View>
          </View>
          
          <View style={styles.tagRow}>
            <View style={styles.moodTag}>
              <Text style={styles.moodText}>{entry.mood}</Text>
            </View>
            {entry.tags && entry.tags.map((tag, i) => (
              <View key={i} style={styles.hashTag}>
                <Text style={styles.hashText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {entry.text ? (
          <View style={styles.textContainer}>
            <Text style={styles.bodyText}>{entry.text}</Text>
          </View>
        ) : null}

        {entry.images && entry.images.length > 0 && (
          <View style={styles.imagesContainer}>
            {entry.images.map((imgUri, idx) => (
              <Image key={idx} source={{ uri: fixImageUrl(imgUri) }} style={styles.entryImage} />
            ))}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(249,250,251,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  metaContainer: {
    marginBottom: 24,
  },
  dateText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodTag: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  moodText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  hashTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  hashText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  textContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  bodyText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 28,
    color: '#374151',
  },
  imagesContainer: {
    gap: 16,
  },
  entryImage: {
    width: '100%',
    height: width * 0.75, // 4:3 aspect ratio
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
});

export default CampusJournalDetailScreen;
