import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ExploreScreen = () => {
  const insets = useSafeAreaInsets();

  const campusEvents = [
    {
      title: 'Invertia 2026',
      date: '13-14 FEB',
      category: 'Annual Fest',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=400',
      color: '#EA580C'
    },
    {
      title: 'Tech Convergence',
      date: '22 MAY',
      category: 'Innovation',
      image: 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=400',
      color: '#4338CA'
    },
    {
      title: 'Placement Drive',
      date: '10 JUN',
      category: 'Careers',
      image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=400',
      color: '#16A34A'
    }
  ];

  const faculties = [
    {
      name: 'Engineering',
      icon: 'cogs',
      type: 'font-awesome-5',
      color: '#4338CA',
      gradient: ['#4338CA', '#312E81'],
      courses: ['B.Tech CSE', 'B.Tech AI/ML', 'B.Tech Cloud', 'B.Tech IoT', 'M.Tech Programs']
    },
    {
      name: 'Computer Apps',
      icon: 'laptop-code',
      type: 'font-awesome-5',
      color: '#0891B2',
      gradient: ['#0891B2', '#065F73'],
      courses: ['BCA Data Science', 'BCA AI & ML', 'B.Sc CS', 'MCA Programs']
    },
    {
      name: 'Management',
      icon: 'briefcase',
      type: 'font-awesome-5',
      color: '#EA580C',
      gradient: ['#EA580C', '#9A3412'],
      courses: ['BBA Fintech', 'BBA Analytics', 'B.Com', 'MBA Specializations']
    },
    {
      name: 'Applied Science',
      icon: 'flask',
      type: 'font-awesome-5',
      color: '#16A34A',
      gradient: ['#16A34A', '#0A6C34'],
      courses: ['B.Sc PCM', 'B.Sc ZBC', 'B.Sc Biotech', 'M.Sc Programs']
    },
    {
      name: 'Law & Legal',
      icon: 'gavel',
      type: 'font-awesome-5',
      color: '#B45309',
      gradient: ['#B45309', '#78350F'],
      courses: ['LL.B', 'BA LLB', 'BBA LLB', 'LL.M']
    },
    {
      name: 'Agriculture',
      icon: 'seedling',
      type: 'font-awesome-5',
      color: '#65A30D',
      gradient: ['#65A30D', '#4D7C0F'],
      courses: ['B.Sc Agriculture', 'M.Sc Agriculture', 'Research Programs']
    },
  ];

  const facilities = [
    { title: 'High-tech Labs', icon: 'microscope', gradient: ['#4338CA', '#312E81'] },
    { title: 'Sports Arenas', icon: 'basketball-ball', gradient: ['#DB2777', '#BE185D'] },
    { title: 'Digital Library', icon: 'book', gradient: ['#EA580C', '#9A3412'] },
    { title: 'Premium Hostels', icon: 'bed', gradient: ['#16A34A', '#0A6C34'] },
    { title: 'CSED Industry Hub', icon: 'industry', gradient: ['#7C3AED', '#5B21B6'] },
    { title: 'Green Campus', icon: 'tree', gradient: ['#0891B2', '#065F73'] },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Premium Header */}
      <LinearGradient
        colors={['#FFFFFF', '#F9FAFB']}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#EA580C', '#9A3412']}
            style={styles.logoCircle}
          >
            <MaterialCommunityIcons name="school" size={20} color="white" />
          </LinearGradient>
          <Text style={styles.headerTitle}>Invertis University</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconButton}>
            <Feather name="search" size={20} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#1E1B4B', '#312E81']}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
              style={styles.liveBadge}
            >
              <View style={styles.dot} />
              <Text style={styles.liveText}>ADMISSIONS OPEN 2026</Text>
            </LinearGradient>
            <Text style={styles.heroTitle}>Shape Your Future{'\n'}with Excellence</Text>
            <Text style={styles.heroDesc}>Explore industry-aligned programs and a world-class campus designed for your success.</Text>

            <TouchableOpacity style={styles.primaryButton}>
              <LinearGradient
                colors={['#FFFFFF', '#F9FAFB']}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>Apply Now</Text>
                <Feather name="arrow-right" size={16} color="#312E81" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.statsRow}
          >
            <View style={styles.statItem}>
              <Text style={styles.statValue}>41 LPA</Text>
              <Text style={styles.statLabel}>Highest Pkg</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>75+</Text>
              <Text style={styles.statLabel}>Programs</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>10k+</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
          </LinearGradient>
        </LinearGradient>

        {/* Experience Invertis AR Card */}
        <TouchableOpacity style={styles.arCard} activeOpacity={0.95}>
          <LinearGradient
            colors={['#EA580C', '#9A3412']}
            style={styles.arGradient}
          >
            <View style={styles.arContent}>
              <View style={styles.arLeft}>
                <View style={styles.arBadge}>
                  <MaterialCommunityIcons name="augmented-reality" size={24} color="#FFFFFF" />
                  <Text style={styles.arBadgeText}>AR EXPERIENCE</Text>
                </View>
                <Text style={styles.arTitle}>Experience Invertis in Augmented Reality</Text>
                <Text style={styles.arDesc}>Take a virtual tour of our campus, labs, and facilities right from your phone.</Text>
                <View style={styles.arStats}>
                  <View style={styles.arStat}>
                    <MaterialCommunityIcons name="camera" size={16} color="#FFFFFF" />
                    <Text style={styles.arStatText}>360° View</Text>
                  </View>
                  <View style={styles.arStat}>
                    <MaterialCommunityIcons name="map-marker" size={16} color="#FFFFFF" />
                    <Text style={styles.arStatText}>15+ Locations</Text>
                  </View>
                  <View style={styles.arStat}>
                    <MaterialCommunityIcons name="clock" size={16} color="#FFFFFF" />
                    <Text style={styles.arStatText}>Live Tours</Text>
                  </View>
                </View>
                <LinearGradient
                  colors={['#FFFFFF', '#F9FAFB']}
                  style={styles.arButton}
                >
                  <Text style={styles.arButtonText}>Start AR Tour →</Text>
                </LinearGradient>
              </View>
              <View style={styles.arRight}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
                  style={styles.arIconCircle}
                >
                  <MaterialCommunityIcons name="virtual-reality" size={48} color="#FFFFFF" />
                </LinearGradient>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Explore Courses Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Explore Courses</Text>
            <Text style={styles.sectionSubtitle}>Tailored programs for global careers</Text>
          </View>
          <TouchableOpacity style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>View All</Text>
            <Feather name="chevron-right" size={14} color="#EA580C" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.facultiesScroll}
          contentContainerStyle={styles.facultiesScrollContent}
        >
          {faculties.map((faculty, index) => (
            <LinearGradient
              key={index}
              colors={['#FFFFFF', '#F9FAFB']}
              style={styles.facultyCard}
            >
              <LinearGradient
                colors={faculty.gradient}
                style={styles.facultyIconWrapper}
              >
                <FontAwesome5 name={faculty.icon} size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.facultyName, { color: faculty.color }]}>{faculty.name}</Text>
              <View style={styles.courseList}>
                {faculty.courses.map((course, i) => (
                  <View key={i} style={styles.courseItem}>
                    <View style={[styles.courseDot, { backgroundColor: faculty.color }]} />
                    <Text style={styles.courseText}>{course}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={styles.exploreBtn}>
                <Text style={[styles.exploreBtnText, { color: faculty.color }]}>Learn More</Text>
                <Feather name="chevron-right" size={16} color={faculty.color} />
              </TouchableOpacity>
            </LinearGradient>
          ))}
        </ScrollView>

        {/* Campus Facilities */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Campus Facilities</Text>
            <Text style={styles.sectionSubtitle}>Everything you need for an active life</Text>
          </View>
        </View>

        <View style={styles.facilitiesGrid}>
          {facilities.map((facility, index) => (
            <LinearGradient
              key={index}
              colors={['#FFFFFF', '#F9FAFB']}
              style={styles.facilityItem}
            >
              <LinearGradient
                colors={facility.gradient}
                style={styles.facilityIcon}
              >
                <FontAwesome5 name={facility.icon} size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.facilityTitle}>{facility.title}</Text>
            </LinearGradient>
          ))}
        </View>

        {/* Scholarship Banner */}
        <TouchableOpacity style={styles.scholarshipSection}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1523240715630-99c8931cc424?auto=format&fit=crop&q=80&w=600' }}
            style={styles.scholarshipImg}
          />
          <LinearGradient
            colors={['rgba(234, 88, 12, 0.95)', 'rgba(154, 52, 18, 0.9)']}
            style={styles.scholarshipOverlay}
          >
            <View style={styles.scholarshipBadge}>
              <Text style={styles.scholarshipBadgeText}>🎓 SCHOLARSHIPS 2026</Text>
            </View>
            <Text style={styles.scholarshipTitle}>Your Merit, Our Mission</Text>
            <Text style={styles.scholarshipDesc}>Apply for merit-based scholarships worth up to 100% of your tuition fee.</Text>
            <TouchableOpacity style={styles.scholarshipBtn}>
              <Text style={styles.scholarshipBtnText}>Check Eligibility →</Text>
            </TouchableOpacity>
          </LinearGradient>
        </TouchableOpacity>

        {/* Campus Life Section */}
        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
          <View>
            <Text style={styles.sectionTitle}>Campus Life</Text>
            <Text style={styles.sectionSubtitle}>Experience the vibrant student culture</Text>
          </View>
          <TouchableOpacity style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>Gallery</Text>
            <Feather name="image" size={14} color="#EA580C" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.eventsScroll}
          contentContainerStyle={styles.eventsScrollContent}
        >
          {campusEvents.map((event, index) => (
            <TouchableOpacity key={index} style={styles.eventCard}>
              <Image source={{ uri: event.image }} style={styles.eventImg} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.eventOverlay}
              >
                <View style={styles.eventBadge}>
                  <Text style={styles.eventBadgeText}>{event.category.toUpperCase()}</Text>
                </View>
                <View style={styles.eventInfo}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateText}>{event.date.split(' ')[0]}</Text>
                    <Text style={styles.monthText}>{event.date.split(' ')[1]}</Text>
                  </View>
                  <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Career Section */}
        <LinearGradient
          colors={['#FFFFFF', '#FFF7ED']}
          style={styles.careerCard}
        >
          <View style={styles.careerInfo}>
            <Text style={styles.careerTitle}>Confused about your career?</Text>
            <Text style={styles.careerDesc}>Talk to our expert counselors today and find the right path for you.</Text>
            <TouchableOpacity style={styles.careerBtn}>
              <LinearGradient
                colors={['#EA580C', '#9A3412']}
                style={styles.careerBtnGradient}
              >
                <Text style={styles.careerBtnText}>Speak with Experts</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={styles.consultantImages}>
            <Image source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} style={styles.consImg} />
            <Image source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }} style={[styles.consImg, { marginLeft: -15 }]} />
            <LinearGradient
              colors={['#D1FAE5', '#A7F3D0']}
              style={styles.onlineStatus}
            >
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Online</Text>
            </LinearGradient>
          </View>
        </LinearGradient>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#EA580C',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    padding: 20,
  },
  heroCard: {
    borderRadius: 32,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  heroContent: {
    marginBottom: 24,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F97316',
    marginRight: 8,
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    lineHeight: 38,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#312E81',
    fontWeight: '800',
    marginRight: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  // AR Card Styles
  arCard: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  arGradient: {
    padding: 24,
  },
  arContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  arLeft: {
    flex: 1,
    marginRight: 16,
  },
  arBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  arBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  arTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  arDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
    marginBottom: 16,
  },
  arStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  arStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arStatText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  arButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  arButtonText: {
    color: '#EA580C',
    fontWeight: '800',
    fontSize: 13,
  },
  arRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  facultiesScroll: {
    marginBottom: 24,
    marginHorizontal: -20,
  },
  facultiesScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20, // Prevent shadow clipping
    paddingTop: 4,
  },
  facultyCard: {
    width: width * 0.72,
    borderRadius: 32,
    padding: 24,
    marginRight: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  facultyIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  facultyName: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 16,
  },
  courseList: {
    marginBottom: 20,
    gap: 10,
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
    opacity: 0.7,
  },
  courseText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 4,
  },
  exploreBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  facilityItem: {
    width: (width - 52) / 2,
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  facilityIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  facilityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  scholarshipSection: {
    height: 220,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  scholarshipImg: {
    width: '100%',
    height: '100%',
  },
  scholarshipOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 24,
    justifyContent: 'center',
  },
  scholarshipBadge: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  scholarshipBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scholarshipTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  scholarshipDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: '80%',
  },
  scholarshipBtn: {
    alignSelf: 'flex-start',
  },
  scholarshipBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  careerCard: {
    borderRadius: 28,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
  careerInfo: {
    flex: 1,
  },
  careerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
  },
  careerDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 16,
  },
  careerBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  careerBtnGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  careerBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 13,
  },
  consultantImages: {
    marginLeft: 15,
    alignItems: 'center',
  },
  consImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46',
  },
  eventsScroll: {
    marginBottom: 32,
    marginHorizontal: -20,
  },
  eventsScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  eventCard: {
    width: width * 0.65,
    height: 180,
    borderRadius: 24,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventImg: {
    width: '100%',
    height: '100%',
  },
  eventOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    justifyContent: 'space-between',
  },
  eventBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  eventBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateBox: {
    backgroundColor: 'white',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  monthText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#EA580C',
  },
  eventTitle: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
});

export default ExploreScreen;