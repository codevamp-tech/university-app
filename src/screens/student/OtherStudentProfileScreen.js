import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_CONFIG } from '../../config/appConfig';

const OtherStudentProfileScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { student } = route.params || {};
  const [connectionStatus, setConnectionStatus] = useState('Connect'); // 'Connect', 'Pending', 'Connected'

  const handleConnect = () => {
    if (connectionStatus === 'Connect') {
      setConnectionStatus('Pending');
    }
  };

  const handleMessage = () => {
    navigation.navigate('Chat', { contactName: student?.name });
  };

  if (!student) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.headerIconBtn}>
          <MaterialIcons name="more-horiz" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Header Image */}
        <View style={styles.profileHeroSection}>
          <View style={styles.profileHeroCard}>
            <LinearGradient colors={['#4953ac', '#8b2fc9']} style={styles.heroImgPlaceholder}>
              <Text style={styles.heroInitial}>{student.name.charAt(0)}</Text>
            </LinearGradient>
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.heroOverlay}>
              <Text style={styles.heroName}>{student.name}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Major & Batch Info */}
        <View style={styles.basicInfo}>
          <Text style={styles.majorText}>B.Tech Computer Science Engineering</Text>
          <Text style={styles.batchSubText}>Batch of 2025 • {student.rollNo}</Text>
          
          <View style={styles.capsuleRow}>
            <View style={styles.capsule}>
              <Text style={styles.capsuleLabel}>FOLLOWERS</Text>
              <Text style={styles.capsuleValue}>1.2K</Text>
            </View>
            <View style={styles.capsule}>
              <Text style={styles.capsuleLabel}>CONNECTIONS</Text>
              <Text style={styles.capsuleValue}>500+</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[
                styles.actionBtnPrimary, 
                connectionStatus === 'Pending' && styles.actionBtnPending
              ]}
              onPress={handleConnect}
            >
              <Ionicons 
                name={connectionStatus === 'Pending' ? "time-outline" : "person-add-outline"} 
                size={18} 
                color={connectionStatus === 'Pending' ? '#4B5563' : '#FFFFFF'} 
              />
              <Text style={[
                styles.actionBtnTextPrimary,
                connectionStatus === 'Pending' && styles.actionBtnTextPending
              ]}>
                {connectionStatus}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnSecondary} onPress={handleMessage}>
              <Ionicons name="chatbubble-outline" size={18} color="#1F2937" />
              <Text style={styles.actionBtnTextSecondary}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>About</Text>
          <Text style={styles.bioText}>
            Passionate software engineering student deeply interested in Full Stack Development and AI. 
            Actively participating in hackathons and leading the {APP_CONFIG.UNIVERSITY_SHORT_NAME} Coding Club. Let's connect and build something awesome together!
          </Text>
        </View>

        {/* Skills */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Top Skills</Text>
          <View style={styles.skillsRow}>
            <View style={styles.skillBadge}><Text style={styles.skillText}>React Native</Text></View>
            <View style={styles.skillBadge}><Text style={styles.skillText}>Node.js</Text></View>
            <View style={styles.skillBadge}><Text style={styles.skillText}>Cloud Computing</Text></View>
            <View style={styles.skillBadge}><Text style={styles.skillText}>Leadership</Text></View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerIconBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  scroll: {
    paddingBottom: 20,
  },
  profileHeroSection: {
    padding: 16,
  },
  profileHeroCard: {
    height: 320,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    backgroundColor: '#000',
  },
  heroImgPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInitial: {
    fontSize: 80,
    fontWeight: '900',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'flex-end',
    padding: 24,
  },
  heroName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  basicInfo: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  majorText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4953ac',
  },
  batchSubText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  capsuleRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  capsule: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  capsuleLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  capsuleValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1F2937',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: '#8b2fc9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#8b2fc9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnPending: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionBtnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  actionBtnTextPending: {
    color: '#4B5563',
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  actionBtnTextSecondary: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skillText: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
  },
});

export default OtherStudentProfileScreen;
