import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const CommunityScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="school" size={26} color="#F97316" />
          <Text style={styles.headerLogo}>Invertis University</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="add-circle-outline" size={26} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('StudentSearch')}>
            <Ionicons name="search" size={24} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Chat')}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Pulse Stories Section */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesScroll} contentContainerStyle={styles.storiesContainer}>
          <TouchableOpacity style={styles.storyWrap}>
            <View style={styles.myStory}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAan4ADBMApbfQhx3DdGKlC1Qbz7FLG7-9Wj-9bdCTWRyQ_aknpIvqI9bH00gEra1CdGikCY1LOOFpxPfp-9qJ1WxlrTlyQoQeH0G9SUsVGVGa6i3deqAZRszu_G44tcFS8X6FDT9rUY0kkZqbCxf5_YJYcSG-yrnnz2uLp41aizPLeZvW7TkT8HRDr7qtaKAeTR7FPViqISWNwr0ywTBGWMVqLqDV8R7pDA31XnTLhK_DwefP-USTgV2dNycsppsYvfAenyGXpZ8Bj' }}
                style={styles.storyImg}
              />
              <View style={styles.addStoryBtn}>
                <Ionicons name="add" size={14} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>

          {[1, 2, 3, 4].map((i) => (
            <TouchableOpacity key={i} style={styles.storyWrap}>
              <View style={[styles.otherStory, { borderColor: i % 2 === 0 ? '#4953ac' : '#fe9832' }]}>
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
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.postAuthor}>
                <View style={[styles.authorIconBox, { backgroundColor: '#8b4b00' }]}>
                  <MaterialIcons name="code" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.authorName}>Invertis Coding Club</Text>
                  <Text style={styles.postMeta}>2 hours ago • <Text style={styles.metaTag}>Hackathon</Text></Text>
                </View>
              </View>
              <TouchableOpacity><MaterialIcons name="more-horiz" size={22} color="#6B7280" /></TouchableOpacity>
            </View>
            <Text style={styles.postTitle}>Invertis Coding Club Hackathon 2024: Registration Open! 🎉</Text>
            <Text style={styles.postText}>Join the biggest coding event on campus. 24 hours of pure innovation. Free food, stickers, and internship opportunities for the winners. Let's build the future of Bareilly together.</Text>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCo-D3MJmX9df86ZCo_00jYGYLjFqoInOWyh4iDJH1ujiNw4BC5azHbETDK3BqY7GuJxzjXUUlVv8juthPbexXcW_6JSUjt85AyRfWNvbBC8jEp4Ee_cGlvh2AeBOx_ClsmdGBQaCtCjTUkL1LSJp2O7JUgqvYMUt14Ns15QG_wEmyplQX9_p5HX-Ln5EspNzRZlKCcHgIyCkIF-3eSNC-xyHpQXiw3FeLTY2LIbmwRqWVXGZ8bWDw5v_1pXDYFsU7rI22_Ui1HV2W5' }}
              style={styles.postImg}
            />
            <View style={styles.postFooter}>
              <View style={styles.footerActions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="heart-outline" size={20} color="#6B7280" />
                  <Text style={styles.actionCount}>124</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
                  <Text style={styles.actionCount}>42</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.joinSquadBtn}>
                <Text style={styles.joinSquadText}>Join Squad</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Feed Card 2: Department Announcement */}
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.postAuthor}>
                <View style={[styles.authorIconBox, { backgroundColor: '#4953ac' }]}>
                  <MaterialIcons name="precision-manufacturing" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.authorName}>Mechanical Dept.</Text>
                  <Text style={styles.postMeta}>5 hours ago • <Text style={[styles.metaTag, { color: '#4953ac' }]}>Workshop</Text></Text>
                </View>
              </View>
              <TouchableOpacity><MaterialIcons name="more-horiz" size={22} color="#6B7280" /></TouchableOpacity>
            </View>
            <View style={styles.workshopBox}>
              <Text style={styles.workshopTitle}>Hands-on Robotics & Automation</Text>
              <Text style={styles.workshopDesc}>A specialized workshop focusing on modern industrial robotic arms. Limited to 30 students only from 3rd and 4th year B.Tech.</Text>
              <View style={styles.workshopMeta}>
                <View style={styles.wMetaItem}><MaterialIcons name="event" size={14} color="#4953ac" /><Text style={styles.wMetaText}>Oct 12</Text></View>
                <View style={styles.wMetaItem}><MaterialIcons name="location-on" size={14} color="#4953ac" /><Text style={styles.wMetaText}>Lab 4, Block B</Text></View>
              </View>
            </View>
            <View style={styles.postFooter}>
              <View style={styles.footerActions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="heart-outline" size={20} color="#6B7280" />
                  <Text style={styles.actionCount}>88</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="share-outline" size={18} color="#6B7280" />
                  <Text style={styles.actionCount}>12</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.joinSquadBtn, { backgroundColor: '#4953ac' }]}>
                <Text style={styles.joinSquadText}>Reserve Spot</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Feed Card 3: Project Update - Arjun Sharma */}
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.postAuthor}>
                <Image
                  source={{ uri: 'https://i.pravatar.cc/150?u=arjun' }}
                  style={styles.authorAvatar}
                />
                <View>
                  <Text style={styles.authorName}>Arjun Sharma</Text>
                  <Text style={styles.postMeta}>Yesterday • <Text style={[styles.metaTag, { color: '#059669' }]}>Project Update</Text></Text>
                </View>
              </View>
              <TouchableOpacity><MaterialIcons name="more-horiz" size={22} color="#6B7280" /></TouchableOpacity>
            </View>
            <Text style={styles.postTitle}>SMART CAMPUS APP</Text>
            <Text style={styles.postText}>
              Just finished the UI for our campus navigation module! Using AR to find classrooms is going to be a game changer for freshers. What do you think?
            </Text>
            <View style={styles.projectPreview}>
              <LinearGradient
                colors={['#059669', '#047857']}
                style={styles.projectPreviewBadge}
              >
                <MaterialCommunityIcons name="augmented-reality" size={20} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.projectPreviewContent}>
                <Text style={styles.projectPreviewTitle}>Campus AR Navigation</Text>
                <Text style={styles.projectPreviewSub}>In development • Beta release soon</Text>
              </View>
            </View>
            <View style={styles.postFooter}>
              <View style={styles.footerActions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="heart-outline" size={20} color="#6B7280" />
                  <Text style={styles.actionCount}>210</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
                  <Text style={styles.actionCount}>18</Text>
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
    backgroundColor: '#F5F6F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#EA580C',
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
    backgroundColor: '#FFFFFF',
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
    borderColor: '#fe9832',
    position: 'relative',
  },
  addStoryBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#8b4b00',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
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
    color: '#1F2937',
  },
  postMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  metaTag: {
    fontWeight: '700',
    color: '#8b4b00',
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  postText: {
    fontSize: 14,
    color: '#4B5563',
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
    borderTopColor: '#F3F4F6',
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
    color: '#6B7280',
  },
  joinSquadBtn: {
    backgroundColor: '#8b4b00',
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
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4953ac',
  },
  workshopTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    fontStyle: 'italic',
  },
  workshopDesc: {
    fontSize: 12,
    color: '#6B7280',
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
    color: '#4953ac',
  },
  projectPreview: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
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
    color: '#065F46',
  },
  projectPreviewSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  pulseIndicator: {
    position: 'absolute',
    top: 100,
    right: 0,
    zIndex: 10,
  },
  pulseInner: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  pulseNote: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
});

export default CommunityScreen;