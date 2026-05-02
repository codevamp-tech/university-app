import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_CONFIG } from '../../config/appConfig';
import { useTheme } from '../../hooks/useTheme';


const { width } = Dimensions.get('window');

const CommunityScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();


  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="school" size={26} color={colors.primary} />
          <Text style={[styles.headerLogo, { color: colors.primary }]}>{APP_CONFIG.UNIVERSITY_NAME}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="add-circle-outline" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('StudentSearch')}>
            <Ionicons name="search" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Chat')}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

        </View>
      </View>


      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Pulse Stories Section */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.storiesScroll, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : colors.card }]} contentContainerStyle={styles.storiesContainer}>

          <TouchableOpacity style={styles.storyWrap}>
            <View style={[styles.myStory, { borderColor: colors.primary }]}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAan4ADBMApbfQhx3DdGKlC1Qbz7FLG7-9Wj-9bdCTWRyQ_aknpIvqI9bH00gEra1CdGikCY1LOOFpxPfp-9qJ1WxlrTlyQoQeH0G9SUsVGVGa6i3deqAZRszu_G44tcFS8X6FDT9rUY0kkZqbCxf5_YJYcSG-yrnnz2uLp41aizPLeZvW7TkT8HRDr7qtaKAeTR7FPViqISWNwr0ywTBGWMVqLqDV8R7pDA31XnTLhK_DwefP-USTgV2dNycsppsYvfAenyGXpZ8Bj' }}
                style={styles.storyImg}
              />
              <View style={[styles.addStoryBtn, { backgroundColor: colors.primary, borderColor: colors.card }]}>
                <Ionicons name="add" size={14} color="#FFFFFF" />
              </View>

            </View>
          </TouchableOpacity>

          {[1, 2, 3, 4].map((i) => (
            <TouchableOpacity key={i} style={styles.storyWrap}>
              <View style={[styles.otherStory, { borderColor: i % 2 === 0 ? colors.primary : '#818CF8' }]}>
                <Image
                  source={{ uri: `https://i.pravatar.cc/150?u=${i}` }}
                  style={styles.storyImg}
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>


        {/* Feed Feed */}
        <View style={styles.feedContainer}>
          {/* Feed Card 1: Club Activity */}
          <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>

            <View style={styles.postHeader}>
              <View style={styles.postAuthor}>
                <View style={[styles.authorIconBox, { backgroundColor: colors.primary }]}>
                  <MaterialIcons name="code" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[styles.authorName, { color: colors.textPrimary }]}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} Coding Club</Text>
                  <Text style={[styles.postMeta, { color: colors.textSecondary }]}>2 hours ago • <Text style={[styles.metaTag, { color: colors.primary }]}>Hackathon</Text></Text>
                </View>

              </View>
              <TouchableOpacity><MaterialIcons name="more-horiz" size={22} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            <Text style={[styles.postTitle, { color: colors.textPrimary }]}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} Coding Club Hackathon 2024: Registration Open! 🎉</Text>
            <Text style={[styles.postText, { color: colors.textSecondary }]}>Join the biggest coding event on campus. 24 hours of pure innovation. Free food, stickers, and internship opportunities for the winners. Let's build the future of {APP_CONFIG.CAMPUS_LOCATION} together.</Text>

            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCo-D3MJmX9df86ZCo_00jYGYLjFqoInOWyh4iDJH1ujiNw4BC5azHbETDK3BqY7GuJxzjXUUlVv8juthPbexXcW_6JSUjt85AyRfWNvbBC8jEp4Ee_cGlvh2AeBOx_ClsmdGBQaCtCjTUkL1LSJp2O7JUgqvYMUt14Ns15QG_wEmyplQX9_p5HX-Ln5EspNzRZlKCcHgIyCkIF-3eSNC-xyHpQXiw3FeLTY2LIbmwRqWVXGZ8bWDw5v_1pXDYFsU7rI22_Ui1HV2W5' }}
              style={styles.postImg}
            />
            <View style={[styles.postFooter, { borderTopColor: colors.border }]}>
              <View style={styles.footerActions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="heart-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.actionCount, { color: colors.textSecondary }]}>124</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.actionCount, { color: colors.textSecondary }]}>42</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.joinSquadBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.joinSquadText}>Join Squad</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Feed Card 2: Department Announcement */}
          <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>

            <View style={styles.postHeader}>
              <View style={styles.postAuthor}>
                <View style={[styles.authorIconBox, { backgroundColor: '#4338CA' }]}>
                  <MaterialIcons name="event-note" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[styles.authorName, { color: colors.textPrimary }]}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} Department</Text>
                  <Text style={[styles.postMeta, { color: colors.textSecondary }]}>5 hours ago • <Text style={[styles.metaTag, { color: '#4338CA' }]}>Workshop</Text></Text>
                </View>
              </View>
              <TouchableOpacity><MaterialIcons name="more-horiz" size={22} color={colors.textSecondary} /></TouchableOpacity>
            </View>

            <View style={[styles.workshopBox, { backgroundColor: isDark ? 'rgba(67, 56, 202, 0.1)' : '#F5F3FF', borderLeftColor: '#4338CA' }]}>
              <Text style={[styles.workshopTitle, { color: colors.textPrimary }]}>Hands-on Robotics & Automation</Text>
              <Text style={[styles.workshopDesc, { color: colors.textSecondary }]}>A specialized workshop focusing on modern industrial robotic arms. Limited to 30 students only from 3rd and 4th year B.Tech.</Text>
              <View style={styles.workshopMeta}>
                <View style={styles.wMetaItem}><MaterialIcons name="event" size={14} color={isDark ? '#A5B4FC' : '#4338CA'} /><Text style={[styles.wMetaText, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>Oct 12</Text></View>
                <View style={styles.wMetaItem}><MaterialIcons name="location-on" size={14} color={isDark ? '#A5B4FC' : '#4338CA'} /><Text style={[styles.wMetaText, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>Lab 4, Block B</Text></View>
              </View>
            </View>

            <View style={[styles.postFooter, { borderTopColor: colors.border }]}>
              <View style={styles.footerActions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="heart-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.actionCount, { color: colors.textSecondary }]}>88</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.actionCount, { color: colors.textSecondary }]}>12</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.joinSquadBtn, { backgroundColor: '#4338CA' }]}>
                <Text style={styles.joinSquadText}>Reserve Spot</Text>
              </TouchableOpacity>
            </View>
          </View>


          {/* Feed Card 3: Project Update - Arjun Sharma */}
          <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>

            <View style={styles.postHeader}>
              <View style={styles.postAuthor}>
                <Image
                  source={{ uri: 'https://i.pravatar.cc/150?u=arjun' }}
                  style={styles.authorAvatar}
                />
                <View>
                  <Text style={[styles.authorName, { color: colors.textPrimary }]}>Arjun Sharma</Text>
                  <Text style={[styles.postMeta, { color: colors.textSecondary }]}>Yesterday • <Text style={[styles.metaTag, { color: '#059669' }]}>Project Update</Text></Text>
                </View>

              </View>
              <TouchableOpacity><MaterialIcons name="more-horiz" size={22} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            <Text style={[styles.postTitle, { color: colors.textPrimary }]}>SMART CAMPUS APP</Text>
            <Text style={[styles.postText, { color: colors.textSecondary }]}>
              Just finished the UI for our campus navigation module! Using AR to find classrooms is going to be a game changer for freshers. What do you think?
            </Text>

            <View style={[styles.projectPreview, { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.1)' : '#ECFDF5', borderColor: isDark ? 'rgba(5, 150, 105, 0.3)' : '#D1FAE5' }]}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.projectPreviewBadge}
              >
                <MaterialCommunityIcons name="augmented-reality" size={20} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.projectPreviewContent}>
                <Text style={[styles.projectPreviewTitle, { color: isDark ? '#A7F3D0' : '#047857' }]}>Campus AR Navigation</Text>
                <Text style={[styles.projectPreviewSub, { color: colors.textSecondary }]}>In development • Beta release soon</Text>
              </View>
            </View>

            <View style={[styles.postFooter, { borderTopColor: colors.border }]}>
              <View style={styles.footerActions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="heart-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.actionCount, { color: colors.textSecondary }]}>210</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.actionCount, { color: colors.textSecondary }]}>18</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.joinSquadBtn, { backgroundColor: '#059669' }]}>
                <Text style={styles.joinSquadText}>Support Project</Text>
              </TouchableOpacity>
            </View>
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
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconBtn: {
    padding: 8,
  },
  scroll: {
    paddingBottom: 20,
  },
  storiesScroll: {
    paddingVertical: 16,
  },

  storiesContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  storyWrap: {
    alignItems: 'center',
  },
  myStory: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    borderWidth: 2,
    position: 'relative',
  },
  addStoryBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },

  otherStory: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    borderWidth: 2,
  },
  storyImg: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  feedContainer: {
    padding: 16,
    gap: 16,
  },
  postCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
  },

  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  postAuthor: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  authorIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '800',
  },
  postMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  metaTag: {
    fontWeight: '700',
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  postText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  postImg: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 16,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },

  footerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '700',
  },
  joinSquadBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  joinSquadText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  workshopBox: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },

  workshopTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  workshopDesc: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  workshopMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  wMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wMetaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  projectPreview: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
  },

  projectPreviewBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectPreviewContent: {
    flex: 1,
  },
  projectPreviewTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  projectPreviewSub: {
    fontSize: 11,
    marginTop: 2,
  },
});


export default CommunityScreen;