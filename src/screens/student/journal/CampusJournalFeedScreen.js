import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const CampusJournalFeedScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJuOAM0oovCadUOqe7o0MWt9vcoFpRGEdgjO7cPgqqVCsYshnCKyK1lMVbi3anAJ2okLWbyQORuafp286VHHSmtcW_Kjr2pP7Y-kjpuZLR59HWmTuHI1z3dWxI4IqsD6Vmr0d8ltS0bvKm3_GjKfoLxcLCd5knrCCXAio2piHk6N_rc53DJvD2qsSaclvXAxF71x2DxB3NB6Pua1eWczGAgwW5AocHmyEKogYEdtzKw-2W-u3DWRJM3Ar2-Ga4MrAVntW_n5mD2P6U' }}
            style={styles.profilePic}
          />
          <Text style={styles.headerTitle}>Campus Journal</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <MaterialIcons name="local-fire-department" size={24} color="#EA580C" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="search" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Today Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionDate}>Oct 24</Text>
        </View>

        {/* Bento Media Card */}
        <TouchableOpacity style={styles.bentoCard}>
          <View style={styles.bentoGrid}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_aOOLCUf67CFzbzeggK9YESFlLoCv2XJQeHYEpXD2OYDD21xFwiGKFTPSSjg4FKv6Mxf_-dxFzi9Ih53aXXOH5FTw65mKyMlNOUYgJj-mEsp-EVIfmaazaTv_ppLWklvx1rx5pmZexfaaXvdiyswWz4kx-isW3WAiztRxfyXZ7i_ikvlZAeyD3dicM_4sMA6IT4kP85IqvpdjoYZ3jLgkkZscVl7LnfuXmu69CZhjZpA-qAUF4JcbPieZadlLi23tvbrF6ic0HFKS' }}
              style={styles.bentoMainImg}
            />
            <View style={styles.bentoRightCol}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACZwEylevcGTrV_i5OkjLQeUes7wCEjLUbGPuIeqHjGo6vUlNAz6AtqgbKZhMXzDxtubH2Mlp2LXBF2Dclb8pVtaTtZpSgTS_-kaib_SzFe8uROo9iEL6qemUJBX85Ax29Z6CtcpJlibKZ773vGOB1jYEIshGNnRhsn0_BnBtMKG8faxnHof9XRiJHN2PkPNUd_K65YoO2QFF60sGvdbX9fS1r9XvVBEjIvV0aUyPiqPMWaa6aETPLapvU6YQ1jNCgX0U6N53RTDGQ' }}
                style={styles.bentoSideImg}
              />
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrU3bstlFwet5JDOFkO3VRBimLyLTmhEXVsQMDTzv9nQGER3vnj7y0-p_ftgGDAiwnTySKWgfWsfI31So3qjozHfFOmT6BMEKg54u_R0KuKcYUjFrzqqWWARiRLsArJ6HjlXxQlrYuc11Ux4mE2mDa0ux4LS3aIIdn_pHVTdZofya1Vc3vdk6qkQjMF_cMZlupDpnxiVGVJ871huPojnd_pZYlrsbWiaVMGj1WyEdlJDzeXuapDx6eW7RQ-60C_ROgshJf2i2PPRed' }}
                style={[styles.bentoSideImg, { marginTop: 4 }]}
              />
            </View>
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.tagRow}>
              <View style={styles.tag}><Text style={styles.tagText}>#CampusLife</Text></View>
              <View style={[styles.tag, { backgroundColor: '#8dedec' }]}><Text style={[styles.tagText, { color: '#004343' }]}>#MainLibrary</Text></View>
            </View>
            <Text style={styles.entryText}>
              Spent the entire morning lost in the archives. The light hitting the central atrium in the Main Library today was something else. Managed to finish my research paper draft ahead of schedule.
            </Text>
            <View style={styles.footerRow}>
              <View style={styles.footerItem}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.footerText}>10:45 AM</Text>
              </View>
              <View style={styles.footerItem}>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text style={styles.footerText}>Invertis Library</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* AI Reflection Card */}
        <LinearGradient colors={['#EEF2FF', '#FFF7ED']} style={styles.aiCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.aiIconCircle}>
            <MaterialCommunityIcons name="auto-fix" size={24} color="#EA580C" />
          </View>
          <View style={styles.aiContent}>
            <Text style={styles.aiTitle}>Invertia AI Reflection</Text>
            <Text style={styles.aiText}>
              You've been extremely productive in the Library today! Your focused sessions are trending upwards. Why not reward yourself with a break at the cafeteria later?
            </Text>
          </View>
        </LinearGradient>

        {/* Single Large Photo Card */}
        <TouchableOpacity style={styles.photoCard}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIEZ6c-gQtDKD3Le8787VA5bzuNSEmpSPXyMrs7el6CYguiq9W3hVvUtZmKwcxAmTtS7u664PHqTM876Av7oBAGNoLbziueHeWkgFG36JGqr2ntSDeABKjOJQPhcx8wt9aGutvoRB0uVOJwtc6EvWWO4UKvGxftuB8f0ZgWgxQ__3McU7Tt4BHkQdUagQatTkmks4cJpxoSNMbgYqYu8VIAESjQLiCL586b2LJjSPQduJ_D81bg-aG4ezr8OgTHBOAOPfRfnjga4pZ' }}
            style={styles.largeImg}
          />
          <View style={styles.cardInfo}>
            <View style={styles.tagRow}>
              <View style={styles.tag}><Text style={styles.tagText}>#CodeLife</Text></View>
            </View>
            <Text style={styles.entryText}>
              Lab session was intense. Finally got the neural network to converge! 🚀 The engineering block has the best energy after 4 PM.
            </Text>
            <View style={styles.footerRow}>
              <View style={styles.footerItem}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.footerText}>4:30 PM</Text>
              </View>
              <View style={styles.footerItem}>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text style={styles.footerText}>Block C, Lab 402</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Yesterday Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Yesterday</Text>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionDate}>Oct 23</Text>
        </View>

        {/* Masonry Card */}
        <TouchableOpacity style={styles.photoCard}>
          <View style={styles.masonryGrid}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQGm_Q57a13L5Gr3Z8v-20VNcCrWQ9N_F8k0C5zA0bNTwWrkWn30cVBukkNhnTfh9_kHumbcl72phYJqpLyQY6-bE7KZQNhCpLaugo-YimuYzFk4QsBkR7tesk3yMkLKA5M6fW4SOEmS_vx6GTHkADFMVTmL1xnW15i8j38ZjYN543_xcBSA5EoplH6hZDX3dRi87QzUzVlUwGg3VkbcfJdBjVzjAk8eCoNu6bD9J1jJzknjpuSO9Zv-QkKUeAJ6HzwvKTkHU4ihwn' }}
              style={styles.masonryLarge}
            />
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWZtTlHxNXtOam9x_p3sHc_eUzjrIRKfvuiVkKwo48TflFzx1pTg7tri8uNV5RDZwQyUYaOHpabUgzjqKgkOQWjNGAs3s3bIjZ1Zs9U0B5p_oOwZgxCX01B9NTQbXgHlbQ1zmZnW6Gn6IIke_Akp1ZqAcchkeUO_-_kAvb1a9J3iuiLC0sSjxaduJbSCBG323uDlPviCojgEVWqW9jfdToSCImNlbkN4AnZaYRnJwl4p6rSWPcKn3xJFDeTUXlgTy3xliK4lFshgYK' }}
              style={styles.masonrySmall}
            />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.entryText}>
              Beautiful evening walk around the central courtyard. Caught up with the debate club team about the upcoming nationals.
            </Text>
            <View style={styles.footerRow}>
              <View style={styles.footerItem}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.footerText}>6:15 PM</Text>
              </View>
              <View style={styles.footerItem}>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text style={styles.footerText}>Central Courtyard</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: 100 }]}
        onPress={() => navigation.navigate('JournalReflect')}
      >
        <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.fabGradient}>
          <MaterialIcons name="add" size={32} color="#FFFFFF" />
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
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fe9832',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4953ac',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#4953ac',
  },
  sectionLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e6e8ea',
    borderRadius: 1,
  },
  sectionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#595c5d',
  },
  bentoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  bentoGrid: {
    flexDirection: 'row',
    height: 300,
  },
  bentoMainImg: {
    flex: 2,
    height: '100%',
  },
  bentoRightCol: {
    flex: 1,
    paddingLeft: 4,
  },
  bentoSideImg: {
    flex: 1,
    width: '100%',
  },
  cardInfo: {
    padding: 20,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#cbceff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#343d96',
  },
  entryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c2f30',
    lineHeight: 24,
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  aiCard: {
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#EA580C',
  },
  aiIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  aiContent: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4953ac',
    marginBottom: 4,
  },
  aiText: {
    fontSize: 13,
    color: '#595c5d',
    lineHeight: 18,
  },
  photoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  largeImg: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  masonryGrid: {
    flexDirection: 'row',
    gap: 4,
    padding: 8,
    height: 200,
  },
  masonryLarge: {
    flex: 2,
    height: '100%',
    borderRadius: 12,
  },
  masonrySmall: {
    flex: 1,
    height: '100%',
    borderRadius: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  bottomBarInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  navItemActive: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
  },
  navTextActive: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default CampusJournalFeedScreen;
