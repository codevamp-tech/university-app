import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_CONFIG } from '../../../config/appConfig';

const { width } = Dimensions.get('window');

const CampusAIWelcomeScreen = ({ navigation }) => {
  const SUGGESTIONS = [
    {
      id: '1',
      title: 'When is my next lecture?',
      desc: 'Check your real-time timetable',
      icon: 'schedule',
      lib: 'MaterialIcons',
      color: '#4953AC',
      bgColor: '#CBCEFF',
    },
    {
      id: '2',
      title: 'Show my attendance summary',
      desc: 'View overall and subject-wise percentage',
      icon: 'analytics',
      lib: 'MaterialIcons',
      color: '#006666',
      bgColor: '#8DEDEC',
    },
    {
      id: '3',
      title: 'When is the next unit test?',
      desc: 'Stay updated with academic calendar',
      icon: 'event-note',
      lib: 'MaterialIcons',
      color: '#8B4B00',
      bgColor: '#FE9832',
    },
    {
      id: '4',
      title: 'Am I eligible for a bus pass?',
      desc: 'Check transport services & criteria',
      icon: 'directions-bus',
      lib: 'MaterialIcons',
      color: '#3E47A0',
      bgColor: '#F3F1FF',
    },
  ];

  const renderIcon = (item) => {
    if (item.lib === 'MaterialIcons') {
      return <MaterialIcons name={item.icon} size={24} color={item.color} />;
    }
    return <Ionicons name={item.icon} size={24} color={item.color} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.mascotContainer}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDgWlyQrAEgrDG1toe8Jo8UfQFYSuux1wQN7DpiVBHPhDYUcg-TIVdlgNzBN_7GfKtvM5MFO3cR2nNYodRjBo_gdMmftD0pH9Iya7swV5wPkKpKasbRp-DRTeScW02MBAcE2w1O4vIxpyGUgzBHusDeT1xdlpgjXlow5gncSXz5sk2STSHVWx9ecXffY8RtyWtF7xja8wDokNzWaFSJCgo598_ed7EbECbKI7nBDo0A-ohzACe1l6Q2aSchJ2mWYr_dJsSfChUi_6_' }}
              style={styles.mascotSmall}
            />
          </View>
          <Text style={styles.headerTitle}>{APP_CONFIG.AI_ASSISTANT_NAME}</Text>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroImageWrapper}>
            <View style={styles.blob} />
            <View style={styles.heroImageShadow}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8ODzCHyw53-GyO4WCuev86ZftQKanuJBXPBWaz0jR1_Vg8JizBJ2qSzxIEse0f4zzbqQf_bUwm5YympEnFVf99rWgd4TNNRJSX10qw7dPtV9qhtABAEODUd2dUXt_0naD5LOD6GJC7khlhfG0x4Z-LCLSPTTNuu7Qf8VoiVvkhPVW9-Qn2dKF4_rh6PLRvsQjzEc4z2UvUhqrd2eAKvj-0c2cxokPGPjZFeL4KcxWoeeO_Bo-7MbFpJQ1hqPdqstaa6Frlq7C9EtQ' }}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.heroGreeting}>
            Namaste! I'm {'\n'}
            <Text style={styles.heroHighlight}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} AI.</Text>
          </Text>
          <Text style={styles.heroSubtext}>
            Your personal campus co-pilot. Ask me about your classes, attendance, fees, or even for career guidance.
          </Text>
        </View>

        {/* Suggestions Grid */}
        <View style={styles.grid}>
          {SUGGESTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => navigation.navigate('CampusAIChat', { initialQuery: item.title })}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
                {renderIcon(item)}
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Input Bar */}
      <SafeAreaView style={styles.inputSticky}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="attach" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.placeholderText}>Type a message...</Text>
          <TouchableOpacity 
            style={styles.sendBtn}
            onPress={() => navigation.navigate('CampusAIChat')}
          >
            <LinearGradient
              colors={['#EA580C', '#9A3412']}
              style={styles.sendBtnGradient}
            >
              <Ionicons name="search" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

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
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: 'rgba(245, 246, 247, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(234, 88, 12, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  mascotContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FE9832',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mascotSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: -0.5,
  },
  moreBtn: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    marginBottom: 40,
  },
  heroImageWrapper: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  blob: {
    position: 'absolute',
    width: 220,
    height: 220,
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
    borderRadius: 110,
    transform: [{ scaleX: 1.2 }],
  },
  heroImageShadow: {
    width: 180,
    height: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 10,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGreeting: {
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    color: '#1F2937',
    lineHeight: 40,
    marginBottom: 16,
  },
  heroHighlight: {
    color: '#EA580C',
  },
  heroSubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '90%',
  },
  grid: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 18,
    borderRadius: 24,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  inputSticky: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  attachBtn: {
    padding: 8,
  },
  placeholderText: {
    flex: 1,
    color: '#9CA3AF',
    fontSize: 15,
    marginLeft: 8,
  },
  sendBtn: {
    marginLeft: 8,
  },
  sendBtnGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CampusAIWelcomeScreen;
