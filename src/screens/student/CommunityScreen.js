import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAvatarUrl } from "../../utils/avatar";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Share, Animated
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  listSocialPostsAPI, 
  createSocialPostAPI, 
  createPostCommentAPI, 
  likeSocialPostAPI,
  likeCommentAPI,
  deleteCommentAPI,
  getConnectionStatsAPI,
  getSocialFeed, createPost, reactToPost, getPostComments, commentOnPost, repostPost, getPendingRequestsAPI 
} from '../../data/apiService';
import { APP_CONFIG } from '../../config/appConfig';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { fetchStudentsFromSheet } from '../../data/googleSheetsService';
import ContentLoader, { Rect, Circle } from 'react-content-loader/native';

const { width } = Dimensions.get('window');

const REACTION_ICONS = {
  like: { icon: '👍', color: '#0A66C2' },
  clap: { icon: '👏', color: '#057642' },
  heart: { icon: '❤️', color: '#DF704D' },
  bulb: { icon: '💡', color: '#F8C77E' },
  laugh: { icon: '😂', color: '#1B85CE' },
  sad: { icon: '😢', color: '#888888' },
};

function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now - past) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const CommunityScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { accessToken, user } = useUser();

  const [apiFeed, setApiFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [connectionStats, setConnectionStats] = useState({ followers: 0, following: 0, connections: 0 });
  const [pendingFollowsCount, setPendingFollowsCount] = useState(0);
  const [newPostContent, setNewPostContent] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [studentMap, setStudentMap] = useState({});

  // Interaction States
  const [activeReactionPostId, setActiveReactionPostId] = useState(null);
  
  // Comments Modal
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // { id: string, username: string }
  const [expandedReplies, setExpandedReplies] = useState({});

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const students = await fetchStudentsFromSheet();
        const map = {};
        students.forEach(s => {
          if (s.id) map[s.id.toLowerCase()] = s;
          if (s.email) map[s.email.toLowerCase()] = s;
        });
        setStudentMap(map);
      } catch (err) {
        console.warn('Failed to load student profiles:', err);
      }
    };
    loadStudents();
  }, []);

  const loadFeed = useCallback(async () => {
    if (!accessToken) return;
    setLoadingFeed(true);
    try {
      const posts = await listSocialPostsAPI(accessToken);
      if (posts) setApiFeed(posts);
      
      const stats = await getConnectionStatsAPI(accessToken);
      if (stats) setConnectionStats(stats);

      const pending = await getPendingRequestsAPI(accessToken);
      if (pending) setPendingFollowsCount(pending.length);
    } catch (e) {
      console.warn("Error loading feed:", e);
    } finally {
      setLoadingFeed(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setPosting(true);
    try {
      if (accessToken) {
        const result = await createPost(accessToken, { content: newPostContent });
        if (result) {
          setNewPostContent('');
          setShowCreateModal(false);
          loadFeed();
          Alert.alert('Post Created', 'Your post has been successfully shared with the campus feed.');
        }
      }
    } catch (err) {
      Alert.alert('Failed to Post', err.message || 'An error occurred.');
    } finally {
      setPosting(false);
    }
  };

  const handleReaction = async (postId, type) => {
    setActiveReactionPostId(null);
    if (!accessToken) return;
    
    // Optimistic UI update
    setApiFeed(prev => prev.map(p => {
      if (p.id === postId) {
        const isRemoving = p.user_reaction === type;
        const newReaction = isRemoving ? null : type;
        const newLikeCount = isRemoving ? Math.max(0, p.like_count - 1) : (p.user_reaction ? p.like_count : p.like_count + 1);
        
        const newCounts = { ...(p.reaction_counts || {}) };
        if (p.user_reaction) newCounts[p.user_reaction] = Math.max(0, (newCounts[p.user_reaction] || 1) - 1);
        if (newReaction) newCounts[newReaction] = (newCounts[newReaction] || 0) + 1;
        
        return { ...p, user_reaction: newReaction, like_count: newLikeCount, reaction_counts: newCounts };
      }
      return p;
    }));

    try {
      await reactToPost(accessToken, postId, type);
    } catch (err) {
      console.warn('Reaction failed', err);
      loadFeed(); // Revert
    }
  };

  const openComments = async (postId) => {
    setActiveCommentPostId(postId);
    setComments([]);
    setReplyingTo(null);
    setExpandedReplies({});
    if (!accessToken) return;
    try {
      const data = await getPostComments(accessToken, postId);
      if (data) setComments(data);
    } catch (err) {
      console.warn('Failed to load comments', err);
    }
  };

  const closeComments = () => {
    setActiveCommentPostId(null);
    setNewComment('');
    setReplyingTo(null);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !activeCommentPostId || !accessToken) return;
    setCommenting(true);
    try {
      const parentId = replyingTo ? replyingTo.id : null;
      const result = await commentOnPost(accessToken, activeCommentPostId, newComment, parentId);
      if (result) {
        setComments(prev => [...prev, result]);
        setNewComment('');
        setReplyingTo(null);
        // Expand replies automatically if replying to a thread
        if (parentId) {
           setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
        }
        // Update post count
        setApiFeed(prev => prev.map(p => p.id === activeCommentPostId ? { ...p, comment_count: p.comment_count + 1 } : p));
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
         return { ...c, user_liked: !c.user_liked, like_count: c.user_liked ? Math.max(0, c.like_count - 1) : c.like_count + 1 };
      }
      return c;
    }));
    try {
      const res = await likeCommentAPI(accessToken, commentId);
      if (res && res.like_count !== undefined) {
         setComments(prev => prev.map(c => c.id === commentId ? { ...c, like_count: res.like_count, user_liked: res.liked } : c));
      }
    } catch(err) {
       console.warn('Failed to like comment', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
     Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
       { text: 'Cancel', style: 'cancel' },
       { text: 'Delete', style: 'destructive', onPress: async () => {
          setComments(prev => prev.filter(c => c.id !== commentId && c.parent_id !== commentId));
          setApiFeed(prev => prev.map(p => p.id === activeCommentPostId ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p));
          try {
             await deleteCommentAPI(accessToken, commentId);
          } catch(e) {
             console.warn('Failed to delete comment', e);
          }
       }}
     ]);
  };

  const handleRepost = async (postId) => {
    Alert.alert('Repost', 'Share this post to your feed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Repost', onPress: async () => {
          if (!accessToken) return;
          try {
            await repostPost(accessToken, postId);
            Alert.alert('Success', 'Reposted to your feed');
            loadFeed();
          } catch(e) {
            Alert.alert('Error', 'Failed to repost');
          }
      }}
    ]);
  };

  const handleShare = async (post) => {
    try {
      await Share.share({
        message: `Check out this post on UniCampus: "${post.content.substring(0, 50)}..."`,
      });
    } catch (error) {
      console.warn('Share error:', error.message);
    }
  };

  const renderPost = (post, isRepost = false) => {
    const isOriginal = post.original_post_id && post.original_post;
    const targetPost = isOriginal ? post.original_post : post;
    
    // Top 3 reactions
    const topReactions = Object.entries(targetPost.reaction_counts || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    // Resolve user details
    const posterUsername = targetPost.user?.username;
    const isMe = posterUsername === user?.id;
    let displayName = posterUsername || 'User';
    let avatarUrl = targetPost.user?.avatar_url || getAvatarUrl(posterUsername || targetPost.id);
    let courseYearStr = '';

    if (isMe) {
      displayName = user?.name || displayName;
      avatarUrl = user?.avatar_url || getAvatarUrl(user?.id || user?.email || 'me');
      if (user?.course) courseYearStr = `${user.course} • Year ${user.year || '1'}`;
    } else if (posterUsername && studentMap[posterUsername.toLowerCase()]) {
      const pData = studentMap[posterUsername.toLowerCase()];
      displayName = pData.name || displayName;
      if (pData.course) courseYearStr = `${pData.course} • Year ${pData.year || '1'}`;
      if (pData.avatar) avatarUrl = pData.avatar;
    }

    return (
      <View key={post.id} style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, marginTop: isRepost ? 0 : 16 }]}>
        {isOriginal && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <MaterialCommunityIcons name="repeat" size={16} color={colors.textSecondary} />
            <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>
              {post.user?.username === user?.id ? 'You' : (studentMap[post.user?.username?.toLowerCase()]?.name || post.user?.username || 'User')} reposted this
            </Text>
          </View>
        )}

        <View style={styles.postHeader}>
          <View style={styles.postAuthor}>
            <Image source={{ uri: avatarUrl }} style={styles.authorAvatar} />
            <View>
              <Text style={[styles.authorName, { color: colors.textPrimary }]}>{displayName}</Text>
              {courseYearStr ? <Text style={[styles.postMeta, { color: colors.textSecondary }]}>{courseYearStr}</Text> : null}
              <Text style={[styles.postMeta, { color: colors.textSecondary }]}>
                {timeAgo(targetPost.created_at)}
              </Text>
            </View>
          </View>
          {!isMe && (
            <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.primary + '20' }}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>+ Follow</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.postText, { color: colors.textPrimary, fontSize: 15, lineHeight: 22 }]}>{targetPost.content}</Text>
        {targetPost.media_urls && targetPost.media_urls.length > 0 && (
          <Image source={{ uri: targetPost.media_urls[0] }} style={styles.postImg} />
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {topReactions.map((r, i) => (
               <Text key={i} style={{ fontSize: 14 }}>{REACTION_ICONS[r]?.icon}</Text>
            ))}
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 4 }}>
              {targetPost.like_count > 0 ? targetPost.like_count : ''}
            </Text>
          </View>
          
          <TouchableOpacity onPress={() => openComments(post.id)}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              {targetPost.comment_count > 0 ? `${targetPost.comment_count} comments • ` : ''}
              {targetPost.repost_count > 0 ? `${targetPost.repost_count} reposts` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.postFooter, { borderTopWidth: 0, marginTop: 8, paddingTop: 4 }]}>
          <View style={styles.footerActions}>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onLongPress={() => setActiveReactionPostId(post.id)}
              onPress={() => handleReaction(post.id, targetPost.user_reaction || 'like')}
            >
              {targetPost.user_reaction ? (
                <Text style={{ fontSize: 18 }}>{REACTION_ICONS[targetPost.user_reaction].icon}</Text>
              ) : (
                <Ionicons name="thumbs-up-outline" size={20} color={colors.textSecondary} />
              )}
              <Text style={[styles.actionCount, { color: targetPost.user_reaction ? REACTION_ICONS[targetPost.user_reaction].color : colors.textSecondary }]}>
                {targetPost.user_reaction ? targetPost.user_reaction.charAt(0).toUpperCase() + targetPost.user_reaction.slice(1) : 'Like'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(post.id)}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.actionCount, { color: colors.textSecondary }]}>Comment</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => handleRepost(post.id)}>
              <MaterialCommunityIcons name="repeat" size={22} color={colors.textSecondary} />
              <Text style={[styles.actionCount, { color: colors.textSecondary }]}>Repost</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(targetPost)}>
              <Ionicons name="paper-plane-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.actionCount, { color: colors.textSecondary }]}>Send</Text>
            </TouchableOpacity>
          </View>

          {activeReactionPostId === post.id && (
            <View style={[styles.reactionPopover, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {Object.keys(REACTION_ICONS).map(type => (
                <TouchableOpacity key={type} onPress={() => handleReaction(post.id, type)} style={{ padding: 8 }}>
                  <Text style={{ fontSize: 28 }}>{REACTION_ICONS[type].icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderCommentThread = () => {
    const rootComments = comments.filter(c => !c.parent_id);
    const repliesByParent = comments.reduce((acc, c) => {
      if (c.parent_id) {
        if (!acc[c.parent_id]) acc[c.parent_id] = [];
        acc[c.parent_id].push(c);
      }
      return acc;
    }, {});

    const renderCommentNode = (c, isReply = false) => {
      const username = c.user?.username;
      const isMe = username === user?.id;
      let dName = username || 'User';
      let aUrl = c.user?.avatar_url || getAvatarUrl(username || c.id);
      let cYear = '';

      if (isMe) {
        dName = user?.name || dName;
        aUrl = user?.avatar_url || getAvatarUrl(user?.id || user?.email || 'me');
        if (user?.course) cYear = `${user.course} • Year ${user.year || '1'}`;
      } else if (username && studentMap[username.toLowerCase()]) {
        const pData = studentMap[username.toLowerCase()];
        dName = pData.name || dName;
        if (pData.course) cYear = `${pData.course} • Year ${pData.year || '1'}`;
        if (pData.avatar) aUrl = pData.avatar;
      }

      const hasReplies = repliesByParent[c.id] && repliesByParent[c.id].length > 0;
      const isExpanded = expandedReplies[c.id];

      return (
        <View key={c.id} style={{ marginLeft: isReply ? 40 : 0, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Image source={{ uri: aUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
            <View style={{ flex: 1 }}>
              <View style={{ backgroundColor: isDark ? '#1F2937' : '#F3F4F6', padding: 12, borderRadius: 12, borderTopLeftRadius: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{dName}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{timeAgo(c.created_at)}</Text>
                </View>
                {cYear ? <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 6 }}>{cYear}</Text> : null}
                <Text style={{ color: colors.textPrimary, lineHeight: 20 }}>{c.content}</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 16, marginTop: 6, marginLeft: 8, alignItems: 'center' }}>
                <TouchableOpacity onPress={() => handleLikeComment(c.id)}>
                  <Text style={{ color: c.user_liked ? colors.primary : colors.textSecondary, fontSize: 13, fontWeight: c.user_liked ? '700' : '500' }}>
                    {c.like_count > 0 ? `${c.like_count} ` : ''}Like
                  </Text>
                </TouchableOpacity>
                {!isReply && (
                  <TouchableOpacity onPress={() => setReplyingTo({ id: c.id, name: dName })}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '500' }}>Reply</Text>
                  </TouchableOpacity>
                )}
                {isMe && (
                  <TouchableOpacity onPress={() => handleDeleteComment(c.id)}>
                     <MaterialCommunityIcons name="trash-can-outline" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {hasReplies && (
                <TouchableOpacity style={{ marginTop: 8, marginLeft: 8 }} onPress={() => setExpandedReplies(prev => ({ ...prev, [c.id]: !isExpanded }))}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                    {isExpanded ? 'Hide replies' : `Load ${repliesByParent[c.id].length} replies`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {hasReplies && isExpanded && (
            <View style={{ marginTop: 8, paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: colors.border, marginLeft: 20 }}>
              {repliesByParent[c.id].map(reply => renderCommentNode(reply, true))}
            </View>
          )}
        </View>
      );
    };

    return rootComments.map(c => renderCommentNode(c, false));
  };

  const renderSkeleton = () => {
    return (
      <View style={styles.feedContainer}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <ContentLoader 
              speed={1.5}
              width={width - 40}
              height={160}
              viewBox={`0 0 ${width - 40} 160`}
              backgroundColor={isDark ? "#334155" : "#f3f3f3"}
              foregroundColor={isDark ? "#475569" : "#ecebeb"}
            >
              <Circle cx="24" cy="24" r="24" />
              <Rect x="60" y="8" rx="4" ry="4" width="120" height="10" />
              <Rect x="60" y="28" rx="4" ry="4" width="80" height="8" />
              <Rect x="0" y="64" rx="4" ry="4" width="300" height="10" />
              <Rect x="0" y="84" rx="4" ry="4" width="250" height="10" />
              <Rect x="0" y="104" rx="4" ry="4" width="200" height="10" />
            </ContentLoader>
          </View>
        ))}
      </View>
    );
  };



  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="school" size={26} color={colors.primary} />
          <Text style={[styles.headerLogo, { color: colors.primary }]}>{APP_CONFIG.UNIVERSITY_NAME}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => { setNewPostContent(''); setShowCreateModal(true); }}>
            <Ionicons name="add-circle-outline" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('StudentSearch')}>
            <Ionicons name="search" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
            {pendingFollowsCount > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeText}>{pendingFollowsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Chat')}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Pulse Stories Section */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.storiesScroll, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : colors.card }]} contentContainerStyle={styles.storiesContainer}>
          <TouchableOpacity style={[styles.storyWrap, { alignItems: 'center' }]}>
            <View style={[styles.myStory, { borderColor: colors.primary }]}>
              <Image
                source={{ uri: user?.avatar_url || getAvatarUrl(user?.id || user?.email || 'me') }}
                style={styles.storyImg}
              />
              <View style={[styles.addStoryBtn, { backgroundColor: colors.primary, borderColor: colors.card }]}>
                <Ionicons name="add" size={14} color="#FFFFFF" />
              </View>
            </View>
            <Text style={{ fontSize: 10, marginTop: 4, color: colors.textSecondary, fontWeight: '700' }}>
              {connectionStats.followers} Followers
            </Text>
          </TouchableOpacity>
          {[1, 2, 3, 4].map((i) => (
            <TouchableOpacity key={i} style={styles.storyWrap}>
              <View style={[styles.otherStory, { borderColor: i % 2 === 0 ? colors.primary : '#818CF8' }]}>
                <Image
                  source={{ uri: getAvatarUrl('story' + i) }}
                  style={styles.storyImg}
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loadingFeed ? renderSkeleton() : apiFeed.length === 0 ? (
            <View style={{ padding: 32, alignItems: 'center', backgroundColor: colors.card, borderRadius: 20, borderColor: colors.border, borderWidth: 1, margin: 16 }}>
              <MaterialCommunityIcons name="post-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>No Posts Available</Text>
              <TouchableOpacity 
                style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 16 }}
                onPress={() => { setNewPostContent(''); setShowCreateModal(true); }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Create a Post</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.feedContainer, { gap: 8, paddingHorizontal: 0, backgroundColor: isDark ? '#000' : '#E9E5DF' }]}>
              {apiFeed.map(post => renderPost(post))}
            </View>
          )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Post Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent={true} onRequestClose={() => setShowCreateModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 300 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary }}>Create Post</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="What's happening on campus?"
              placeholderTextColor={colors.textSecondary}
              style={{ flex: 1, color: colors.textPrimary, fontSize: 16, textAlignVertical: 'top', minHeight: 150, padding: 12, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }}
              multiline={true}
              value={newPostContent}
              onChangeText={setNewPostContent}
            />
            <TouchableOpacity 
              style={{ backgroundColor: colors.primary, borderRadius: 16, padding: 14, alignItems: 'center', marginTop: 20 }}
              onPress={handleCreatePost}
              disabled={posting || !newPostContent.trim()}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>
                {posting ? 'Sharing...' : 'Share Post'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal visible={activeCommentPostId !== null} animationType="slide" transparent={true} onRequestClose={closeComments}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: Dimensions.get('window').height * 0.7 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>Comments</Text>
              <TouchableOpacity onPress={closeComments}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
              {renderCommentThread()}
            </ScrollView>
            
            {replyingTo && (
               <View style={{ backgroundColor: colors.primary + '15', padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                 <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Replying to {replyingTo.name}</Text>
                 <TouchableOpacity onPress={() => setReplyingTo(null)}>
                    <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                 </TouchableOpacity>
               </View>
            )}
            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: insets.bottom || 16 }}>
              <TextInput
                placeholder={replyingTo ? "Write a reply..." : "Leave a comment..."}
                placeholderTextColor={colors.textSecondary}
                value={newComment}
                onChangeText={setNewComment}
                style={{ flex: 1, backgroundColor: isDark ? '#374151' : '#F3F4F6', color: colors.textPrimary, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15 }}
              />
              <TouchableOpacity onPress={handleAddComment} disabled={commenting || !newComment.trim()}>
                <Ionicons name="send" size={24} color={newComment.trim() ? colors.primary : colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogo: { fontSize: 20, fontWeight: '900', fontStyle: 'italic' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIconBtn: { padding: 8 },
  scroll: { paddingBottom: 20 },
  storiesScroll: { paddingVertical: 16 },
  storiesContainer: { paddingHorizontal: 16, gap: 12 },
  storyWrap: { alignItems: 'center' },
  myStory: { width: 80, height: 80, borderRadius: 40, padding: 3, borderWidth: 2, position: 'relative' },
  addStoryBtn: { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  otherStory: { width: 80, height: 80, borderRadius: 40, padding: 3, borderWidth: 2 },
  storyImg: { width: '100%', height: '100%', borderRadius: 30 },
  feedContainer: { padding: 0, gap: 8 },
  postCard: { borderRadius: 0, padding: 16, borderTopWidth: 1, borderBottomWidth: 1, marginBottom: 8 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  postAuthor: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  authorAvatar: { width: 48, height: 48, borderRadius: 24 },
  authorName: { fontSize: 16, fontWeight: '700' },
  postMeta: { fontSize: 12, marginTop: 2 },
  postText: { fontSize: 15, lineHeight: 22, marginTop: 4 },
  postImg: { width: '100%', height: 250, borderRadius: 0, marginTop: 12, resizeMode: 'cover' },
  postFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  footerActions: { flexDirection: 'row', gap: 8, justifyContent: 'space-around', width: '100%' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, flex: 1, justifyContent: 'center' },
  actionCount: { fontSize: 14, fontWeight: '600' },
  reactionPopover: { position: 'absolute', bottom: 50, left: 0, flexDirection: 'row', borderRadius: 30, padding: 4, borderWidth: 1, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { height: -2, width: 0 } },
  badgeCount: { position: 'absolute', top: 4, right: 4, backgroundColor: 'red', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' }
});

export default CommunityScreen;
