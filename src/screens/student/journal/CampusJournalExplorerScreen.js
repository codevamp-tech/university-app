import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const CampusJournalExplorerScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const categories = [
    { name: 'All Entries', icon: 'folder-open-outline', count: 124, color: '#4953ac' },
    { name: 'Journal', icon: 'book-outline', count: 42, color: '#4953ac' },
    { name: 'Travel', icon: 'compass-outline', count: 18, color: '#4953ac' },
    { name: 'Fitness', icon: 'fitness', count: 31, color: '#4953ac' },
    { name: 'Family', icon: 'people-outline', count: 25, color: '#4953ac' },
    { name: 'Reading', icon: 'library-outline', count: 8, color: '#4953ac' },
    { name: 'Deleted', icon: 'trash-outline', count: 3, color: '#b02500' },
  ];

  const recent = [
    { 
      title: 'Workshop Day 1', 
      desc: 'The new design thinking workshop started with a bang today. Met some amazing folks from the CS department.', 
      time: '2 hours ago', 
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLlhsRcKCDTNqCEtwTwocU1a2IyXFxXQL_wLai_w2z6DhGCofNP876Ia0rpgHo4DwPLcB2U4RtS4QosJ0U7z8HJdmdpn2Rzij1opAmIE_tLOafEkyGAFli5oGuZ0jgxUbQvj6Jz9Qpvsvp0yH5IDe62i_b0EK2cjxjsPQi1P_CEhj9YKdCBT6XlRG5_TMxLym93qIgcych-j6xOqwhfU-SeZC5E9yf1i19cNpl4kJ4RyZsdFxIp0cQAVRHMDo5kIrIuQnUlX3LZXZQ',
      tag: 'Journal'
    },
    { 
      title: 'Early Morning Yoga', 
      desc: 'Nothing beats the calm of the campus at 6 AM. Focused on breathing and flexibility.', 
      time: 'Yesterday', 
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuT05nxbI82DycyZSNbuUFT1oTMKHtUYFZ60YoMWDK5iZv_xe4cBpd9dcCJhGdhMgWXa6y7uy3WnXiSi_gHPFoHy0hyxp9XzwUXdyWvicWoJDCcq26Jp7Emzvi8hD5fInSEMUJkP0VeAKLjdDPl7EC-4Kzsw9eEVPuFtLVL2-85dxzSIO68fWy2eVyqM4xhhl6iruWPE-XeecYQJ4TlwW38QSeH5Rc9BdIaToRYZzq4OKUXXjfBkgFOyu0s5KqtSczaaHh2eQU1Ppd',
      tag: 'Fitness'
    },
  ];

  const recommended = [
    {
      title: "Tanya's Birthday",
      date: 'OCT 12, 2023',
      location: 'Bareilly Heights',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWO39sft8klSmQ_LnGKwnBIzQVupLvoyt1nxP_CQ2k7XyTJmT7J3B4ZuBpcKMzPlfVGsr1unSDrMFLdYVQ64wTzu-3abEAQCtPD7sk5mSIeIDNXrN8HEcoZzrHrcDfQ5yxfHGDWErOai4C1oB0wRR1GD6F8GUHbrk1CMHhpaW-Mb0xzbFxgJE-biyApQytHDPOo7BOYJlNlRvaQbgYBvFfgseMnu2yduzIXlDIo5WeRWzJpIsWAdIodT93akVgd1sFn3C4lISUT-2Y',
      details: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCqou_b8pfepYJ0cvKctv4F4em48tbrDBM-Ono2RlDlQiK4k-TnPBnZaaRs5C1Y4Cj3PPCoi-yQA5ixDjv9ySsG7VS_Ddi1DGVH758K4m3gsMMTeyi0sjNwOBxq4zdBz8F1tcpjHrxBnBdrhgLwj_I8ZCdTsfyD2cB_47HSghSrWoH7InnG4Qf8rmtEH_w-CAlF_c1Pn5atnvlsSzp0mBSmEbsKcZH9KRnC8EClxCIlnVHqTcqcBI_4eenJV8MxaDrplzHqRsS9ONoO',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuArteIinI9MAfiD0mVN2hpfIIkAm9hDrIU2IyzrE4HFoumlLS0UUiBDno4get046fyD3s9ieKsEtzqU4Uju0_G9SUUCdEmlVPHTs8EY__yaFt0c50SmD3VMNVxyM3S5bcVE8G1sl6w3aX-icMMZ5wTXFCe1n7EhBPkRCgwNARzYbfWQOPkg_Zlxh63Hmj4RGXcH1N2OF8jFlJxxRaaWwhfTswzjY5VaT4jNtheo4UIvHu2NK993UoSFVZNkxD0lWuYdFbuzSt0H5S0H'
      ],
      extraPhotos: 14
    },
    {
      title: "Visit to Farmhouse",
      date: 'NOV 04, 2023',
      location: 'Green Meadows',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDC3SMhsh5lpfsviJ-MSxU3d2uVikQBgMD1HEQwsu6Tk_bFQMvwpOFhECP6HOwpMMs5DAQR34sNs2C_tNmmawjZrVD5oYk4D0kP8TTFwaS8GowqtyAYv2M_kKSTSr2aUfdLsCs1reH1RptCVoGT_3vRb1vaG6B7vddxzuzoO1l2wAtMyKIyu9u8bnKYXCJVUuK_q-w0Lpa7qs9rGcphaZpoOVOvrl1av6nnSGZv_06JNcFHW9EiJgcLoKcFmGBeu0D3IbGVIpweTRMs',
      details: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDP7yTkNOeCcGlg0F55DNyG-dTXE0pk0wiKJsNl1ftuivZJzB9lMLE2hgXRIGKnjRWWHJTytnuYr6oymuXUJ6K2WYJ0HRXC8mlav5cVmt-k2GMvEqw_EFD1A2PRPzTizVNsi-Yq0rOHWBSRKq0nRgNP_f48y77XrNOwtaYaIwKrn6-sgkV383ccT9OJry0fa_NerEE4K-FB85_lP6DZQMB1AgP-t2HpDSembWAcCADIDEc_cojrZHSgGSUe8uuelKTw3dzqDicLBIpn',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDJjrQuK206ixAJ5Du-dY-zr57dCvkIUb1uHu3lA3ee0ZNVNsUciAaguYQ5s0lAqFeRSLp6owS8lauHQzCXijYp_T4tmWzB87btFrDfy-iO9sLbukzUdGDjuHgOcXNVp5segAXJVT0Zq5UU_Ve-r57cnTuIl12UIhWCH7SuKedWVf5VG-Fk40EaN2fhDfP8BcdxfY1FNKrFF8aBH_CeN0ruXjVYuK9CKJ7m3vMiwkYNXm6bToZJ2A5TwiS4nBB00EgcGgszVzhIl1qS'
      ],
      extraPhotos: 8
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5eiPeOVvsDZzTS49GYwdSuvbKE3qojx7QZvxUoAnnrs2kNy858FgvoT6DfprGzfnh7shoB1N6Sae96Udnr82IvHKJkD_wlX7HnX9y3iz7yqmRxG-ZSfCia_q_7DUmyZWgRUhj661Y0b5NoWBLlQ3zvXH7xvp9qTb4tnwVYM-3onxnYYsNsWiH0zWv9lQuur-o_9CpRcPh6EJTKQTfQwCBn41s_OLWYES8XbOOCa54AqprIXpAjSHSfCtGcYi5FP5DCDo6tcnap4mI' }}
            style={styles.profilePic}
          />
          <Text style={styles.headerTitle}>Campus Journal</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="search" size={20} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn}>
            <MaterialIcons name="local-fire-department" size={24} color="#EA580C" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Daily Reflection Prompt */}
        <View style={styles.heroSection}>
          <LinearGradient 
            colors={['#EA580C', '#FE9832']} 
            style={styles.heroCard} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>DAILY REFLECTION</Text>
              </View>
              <Text style={styles.heroTitle}>Think about something you love to do and why it brings you joy.</Text>
              <TouchableOpacity style={styles.heroBtn}>
                <Text style={styles.heroBtnText}>Start Writing</Text>
              </TouchableOpacity>
            </View>
            <MaterialCommunityIcons name="note-edit-outline" size={140} color="rgba(255,255,255,0.15)" style={styles.heroBgIcon} />
          </LinearGradient>
        </View>

        {/* Recommended Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Recommended</Text>
              <Text style={styles.sectionSub}>Relive your best campus moments</Text>
            </View>
            <TouchableOpacity><Text style={styles.viewAllBtn}>View All</Text></TouchableOpacity>
          </View>

          {recommended.map((item, index) => (
            <TouchableOpacity key={index} style={styles.recCard}>
              <View style={styles.recImgWrapper}>
                <Image source={{ uri: item.image }} style={styles.recImg} />
              </View>
              <View style={styles.recContent}>
                <View style={styles.recTextHeader}>
                  <View>
                    <Text style={styles.recDate}>{item.date}</Text>
                    <Text style={styles.recName}>{item.title}</Text>
                  </View>
                  <View style={styles.locBadge}>
                    <Ionicons name="location-sharp" size={12} color="#4953ac" />
                    <Text style={styles.locText}>{item.location}</Text>
                  </View>
                </View>
                
                {/* Memory Box Thumbnails */}
                <View style={styles.memoryBox}>
                  {item.details.map((child, i) => (
                    <View key={i} style={styles.detailImgWrapper}>
                      <Image source={{ uri: child }} style={styles.detailImg} />
                    </View>
                  ))}
                  <View style={styles.extraBox}>
                    <Text style={styles.extraText}>+{item.extraPhotos} photos</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.catGrid}>
            {categories.map((c, i) => (
              <TouchableOpacity key={i} style={styles.catCard}>
                <View style={[styles.catIconCircle, { backgroundColor: `${c.color}15` }]}>
                  <Ionicons name={c.icon} size={22} color={c.color} />
                </View>
                <Text style={styles.catName}>{c.name}</Text>
                <Text style={styles.catCount}>{c.count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Feed Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent</Text>
          <View style={styles.recentList}>
            {recent.map((r, i) => (
              <TouchableOpacity key={i} style={styles.recentItem}>
                <Image source={{ uri: r.img }} style={styles.recentImg} />
                <View style={styles.recentContent}>
                  <Text style={styles.recentTitle}>{r.title}</Text>
                  <Text style={styles.recentDesc} numberOfLines={1}>{r.desc}</Text>
                  <View style={styles.recentFooter}>
                    <View style={styles.recentTag}><Text style={styles.recentTagText}>{r.tag}</Text></View>
                    <Text style={styles.recentTime}>{r.time}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* FAB - Adjusted to avoid tab bar overlap */}
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
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profilePic: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  heroSection: {
    marginBottom: 40,
  },
  heroCard: {
    borderRadius: 28,
    padding: 32,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  heroContent: {
    zIndex: 1,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 34,
    marginBottom: 24,
  },
  heroBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  heroBtnText: {
    color: '#8b4b00',
    fontWeight: '800',
    fontSize: 14,
  },
  heroBgIcon: {
    position: 'absolute',
    right: -20,
    top: -20,
  },
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#4953ac',
  },
  sectionSub: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
  },
  viewAllBtn: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EA580C',
  },
  recCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  recImgWrapper: {
    aspectRatio: 16 / 10,
    width: '100%',
  },
  recImg: {
    width: '100%',
    height: '100%',
  },
  recContent: {
    padding: 24,
  },
  recTextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  recDate: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  recName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#4953ac',
  },
  locBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4953ac',
  },
  memoryBox: {
    flexDirection: 'row',
    gap: 8,
  },
  detailImgWrapper: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  detailImg: {
    width: '100%',
    height: '100%',
  },
  extraBox: {
    flex: 1,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#cbceff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  extraText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#343d96',
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  catCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  catIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  catName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4953ac',
    marginBottom: 2,
  },
  catCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  recentList: {
    gap: 16,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  recentImg: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4953ac',
    marginBottom: 4,
  },
  recentDesc: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 10,
  },
  recentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentTag: {
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recentTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EA580C',
  },
  recentTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 24,
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
});

export default CampusJournalExplorerScreen;
