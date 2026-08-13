import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAvatarUrl } from "../../utils/avatar";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Share, Animated, FlatList,
  TouchableWithoutFeedback, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSocket } from '../../hooks/useSocket';
import { useNotifications } from '../../context/NotificationContext';

const STORY_KEY = '@unicampus_stories_v2';
const STORY_TTL = 24 * 60 * 60 * 1000; // 24 h
import * as ImagePicker from 'expo-image-picker';
import { 
  likeCommentAPI,
  deleteCommentAPI,
  deletePostAPI,
  connectionStatsAPI,
  getSocialFeed, 
  createPost, 
  reactToPost, 
  getPostComments, 
  commentOnPost, 
  repostPost, 
  getPendingRequestsAPI,
  uploadAvatarAPI,
  getStoriesAPI,
  createStoryAPI,
  viewStoryAPI,
  likeStoryAPI,
  deleteStoryAPI,
  followUserAPI,
  getAllStudents,
  getPostLikersAPI,
  getStoryCommentsAPI,
  addStoryCommentAPI,
  removeConnectionAPI,
} from '../../data/apiService';
import { APP_CONFIG } from '../../config/appConfig';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import ContentLoader, { Rect, Circle } from 'react-content-loader/native';

const POST_CHAR_LIMIT = 3000;

const { width } = Dimensions.get('window');

const REACTION_ICONS = {
  like: { icon: '👍', color: '#0A66C2', label: 'Like' },
  clap: { icon: '👏', color: '#057642', label: 'Clap' },
  heart: { icon: '❤️', color: '#DF704D', label: 'Love' },
  bulb: { icon: '💡', color: '#F8C77E', label: 'Insightful' },
  laugh: { icon: '😂', color: '#1B85CE', label: 'Laugh' },
  sad: { icon: '😢', color: '#888888', label: 'Sad' },
};

function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  // Support formatting issues by replacing space with 'T' if ISO format is slightly off
  const formattedString = dateString.replace(' ', 'T');
  const past = new Date(formattedString);
  if (isNaN(past.getTime())) return '';
  const diffInSeconds = Math.floor((now - past) / 1000);
  if (isNaN(diffInSeconds)) return '';
  if (diffInSeconds < 60) return `${Math.max(0, diffInSeconds)}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const CommunityScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { accessToken, user } = useUser();
  const { refreshUnreadCounts } = useNotifications();

  const [apiFeed, setApiFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [connectionStats, setConnectionStats] = useState({ followers: 0, following: 0, connections: 0 });
  const [pendingFollowsCount, setPendingFollowsCount] = useState(0);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);   // local URIs
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [studentMap, setStudentMap] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const lastFeedFetchRef = useRef(0); // Stale-time guard

  // ── WebSocket real-time handlers ─────────────────────────────────────────
  const handleWsPostLike = useCallback((msg) => {
    // Update like_count for the affected post in the feed without a full reload
    setApiFeed(prev => prev.map(p =>
      p.id === msg.post_id
        ? { ...p, like_count: msg.like_count }
        : p
    ));
  }, []);

  const handleWsPostReaction = useCallback((msg) => {
    setApiFeed(prev => prev.map(p =>
      p.id === msg.post_id
        ? { ...p, like_count: msg.like_count, reaction_counts: msg.reaction_counts }
        : p
    ));
  }, []);

  const handleWsNewComment = useCallback((msg) => {
    // Update comment count on feed post
    setApiFeed(prev => prev.map(p =>
      p.id === msg.post_id
        ? { ...p, comment_count: (p.comment_count || 0) + 1 }
        : p
    ));
    // Append to open comments modal if user is viewing this post's comments
    setActiveCommentPostId(current => {
      if (current === msg.post_id && msg.comment) {
        setComments(prev => {
          // Avoid duplicate if optimistic update already added it
          if (prev.some(c => c.id === msg.comment.id)) return prev;
          return [...prev, msg.comment];
        });
      }
      return current;
    });
  }, []);

  const handleWsNewPost = useCallback((msg) => {
    if (!msg.post) return;
    // Prepend new post to feed (only if it's not from the current user — they already see it)
    setApiFeed(prev => {
      if (prev.some(p => p.id === msg.post.id)) return prev; // Deduplicate
      return [msg.post, ...prev];
    });
  }, []);

  // Handle real-time notification events (likes, comments, reposts directed at current user)
  const handleWsNotification = useCallback(() => {
    // Immediately refresh the notification badge count without waiting for 30s poll
    refreshUnreadCounts();
  }, [refreshUnreadCounts]);

  // Connect to WebSocket
  const { isConnected: wsConnected } = useSocket(accessToken, {
    onPostLike: handleWsPostLike,
    onPostReaction: handleWsPostReaction,
    onNewComment: handleWsNewComment,
    onNewPost: handleWsNewPost,
    onNotification: handleWsNotification,
  });


  // Interaction States
  const [activeReactionPostId, setActiveReactionPostId] = useState(null);

  // Lightbox
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  // ── Stories ───────────────────────────────────────────────────────────────
  const [storyGroups, setStoryGroups] = useState([]); // [{ userId, username, avatarUrl, items:[], viewed }]
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerGroupIdx, setViewerGroupIdx] = useState(0);
  const [viewerItemIdx, setViewerItemIdx] = useState(0);
  const storyProgress = useRef(new Animated.Value(0)).current;
  const storyTimerRef = useRef(null);
  const [createStoryVisible, setCreateStoryVisible] = useState(false);
  const [storyImage, setStoryImage] = useState(null);
  const [storyCaption, setStoryCaption] = useState('');
  const [postingStory, setPostingStory] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsStoryItem, setAnalyticsStoryItem] = useState(null);

  // Comments Modal
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});

  // Post Likers Modal
  const [postLikersModalVisible, setPostLikersModalVisible] = useState(false);
  const [postLikers, setPostLikers] = useState([]);
  const [loadingPostLikers, setLoadingPostLikers] = useState(false);

  // Story Comments
  const [storyCommentsModalVisible, setStoryCommentsModalVisible] = useState(false);
  const [activeStoryItem, setActiveStoryItem] = useState(null);
  const [storyCommentsList, setStoryCommentsList] = useState([]);
  const [loadingStoryComments, setLoadingStoryComments] = useState(false);
  const [newStoryCommentText, setNewStoryCommentText] = useState('');
  const [postingStoryComment, setPostingStoryComment] = useState(false);

  const handleOpenPostLikers = async (postId) => {
    setPostLikersModalVisible(true);
    setLoadingPostLikers(true);
    try {
      const data = await getPostLikersAPI(accessToken, postId);
      setPostLikers(data || []);
    } catch (e) {
      console.warn("Failed to load post likers:", e);
    } finally {
      setLoadingPostLikers(false);
    }
  };

  const handleOpenStoryComments = async (item) => {
    setActiveStoryItem(item);
    setStoryCommentsModalVisible(true);
    setLoadingStoryComments(true);
    try {
      const data = await getStoryCommentsAPI(accessToken, item.id);
      setStoryCommentsList(data || []);
    } catch (e) {
      console.warn("Failed to load story comments:", e);
    } finally {
      setLoadingStoryComments(false);
    }
  };

  const handleSendStoryComment = async () => {
    if (!newStoryCommentText.trim() || !activeStoryItem) return;
    setPostingStoryComment(true);
    const content = newStoryCommentText.trim();
    setNewStoryCommentText('');
    try {
      const res = await addStoryCommentAPI(accessToken, activeStoryItem.id, content);
      if (res) {
        setStoryCommentsList(prev => [...prev, {
          id: res.id,
          content: res.content,
          created_at: res.created_at || new Date().toISOString(),
          username: user?.name || 'You',
          full_name: user?.name || 'You',
          avatar_url: user?.avatar_url,
        }]);
      }
    } catch (e) {
      console.warn("Failed to send story comment:", e);
    } finally {
      setPostingStoryComment(false);
    }
  };

  // ── Load / persist stories ────────────────────────────────────────────────
  const loadStories = useCallback(async () => {
    if (!accessToken) return;
    try {
      const dbGroups = await getStoriesAPI(accessToken);
      let fresh = dbGroups || [];

      // Read viewed story item IDs from AsyncStorage
      const viewedRaw = await AsyncStorage.getItem('@story_viewed_ids');
      const viewedIds = viewedRaw ? JSON.parse(viewedRaw) : [];

      // Check viewed status for groups
      fresh = fresh.map(g => {
        const unviewed = g.items.some(item => !viewedIds.includes(item.id));
        return { ...g, viewed: !unviewed };
      });

      setStoryGroups(fresh);
    } catch (e) { console.warn('stories load error', e); }
  }, [accessToken]);

  useEffect(() => { loadStories(); }, [loadStories]);

  // Register view dynamically when opening someone else's story
  useEffect(() => {
    if (!viewerVisible || !accessToken) return;
    const group = storyGroups[viewerGroupIdx];
    if (!group) return;
    const item = group.items[viewerItemIdx];
    if (!item) return;

    const myId = user?.id || user?.user_id || 'me';
    if (group.userId !== myId) {
      viewStoryAPI(accessToken, item.id).catch(e => console.warn('Failed to register story view', e));
    }
  }, [viewerVisible, viewerGroupIdx, viewerItemIdx, accessToken, storyGroups, user]);

  const openViewerAnalytics = (item) => {
    storyProgress.stopAnimation();
    setAnalyticsStoryItem(item);
    setShowAnalyticsModal(true);
  };

  const closeViewerAnalytics = () => {
    setShowAnalyticsModal(false);
    setAnalyticsStoryItem(null);
    storyProgress.setValue(0);
    const anim = Animated.timing(storyProgress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (finished) {
        const currentGroup = storyGroups[viewerGroupIdx];
        if (currentGroup) {
          if (viewerItemIdx + 1 < currentGroup.items.length) {
            setViewerItemIdx(prev => prev + 1);
          } else if (viewerGroupIdx + 1 < storyGroups.length) {
            setViewerGroupIdx(prev => prev + 1);
            setViewerItemIdx(0);
          } else {
            setViewerVisible(false);
          }
        }
      }
    });
  };

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const students = await getAllStudents(accessToken);
        const map = {};
        students.forEach(s => {
          const key = (s.username || s.rollno || '').toLowerCase();
          if (key) {
            map[key] = {
              id: s.rollno || s.username,
              name: s.full_name || s.username,
              course: s.course,
              year: s.current_year,
              avatar: s.avatar_url || getAvatarUrl(s.username),
            };
          }
        });
        setStudentMap(map);
      } catch (err) {
        console.warn('Failed to load student profiles:', err);
      }
    };
    if (accessToken) {
      loadStudents();
    }
  }, [accessToken]);

  const loadFeed = useCallback(async (force = false) => {
    if (!accessToken) return;
    // Stale-time guard: don't re-fetch if data was loaded less than 30s ago
    const now = Date.now();
    if (!force && (now - lastFeedFetchRef.current) < 30000) return;
    lastFeedFetchRef.current = now;

    setLoadingFeed(true);
    setHasMorePosts(true);
    setLoadingMore(false);
    try {
      const posts = await getSocialFeed(accessToken, 0, 20);
      if (posts) {
        setApiFeed(posts);
        if (posts.length < 20) setHasMorePosts(false);
      }

      // Load stats in parallel (non-blocking — don't await together)
      connectionStatsAPI(accessToken).then(stats => { if (stats) setConnectionStats(stats); }).catch(() => {});
      getPendingRequestsAPI(accessToken).then(pending => { if (pending) setPendingFollowsCount(pending.length); }).catch(() => {});

      // Reload stories to keep in sync
      loadStories();
    } catch (e) {
      console.warn("Error loading feed:", e);
    } finally {
      setLoadingFeed(false);
    }
  }, [accessToken, loadStories]);

  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMorePosts || !accessToken || loadingFeed) return;
    setLoadingMore(true);
    try {
      const nextPosts = await getSocialFeed(accessToken, apiFeed.length, 20);
      if (!nextPosts || nextPosts.length === 0) {
        setHasMorePosts(false);
      } else {
        setApiFeed(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNext = nextPosts.filter(p => !existingIds.has(p.id));
          if (uniqueNext.length < 20) setHasMorePosts(false);
          return [...prev, ...uniqueNext];
        });
      }
    } catch (err) {
      console.warn("Failed to load more posts:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [accessToken, apiFeed.length, hasMorePosts, loadingMore, loadingFeed]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFeed(true); // Force refresh bypasses stale-time guard
    } catch (e) {
      console.warn("Pull-to-refresh error:", e);
    } finally {
      setRefreshing(false);
    }
  }, [loadFeed]);

  useFocusEffect(
    React.useCallback(() => {
      loadFeed(); // Respects 30s stale-time — won't hammer API on every tab switch
    }, [loadFeed])
  );

  // ── Story viewer logic ───────────────────────────────────────────────────
  const STORY_DURATION = 5000;

  useEffect(() => {
    if (!viewerVisible) {
      storyProgress.setValue(0);
      return;
    }

    storyProgress.setValue(0);
    const anim = Animated.timing(storyProgress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });

    anim.start(({ finished }) => {
      if (finished) {
        const currentGroup = storyGroups[viewerGroupIdx];
        if (currentGroup) {
          if (viewerItemIdx + 1 < currentGroup.items.length) {
            setViewerItemIdx(prev => prev + 1);
          } else if (viewerGroupIdx + 1 < storyGroups.length) {
            setViewerGroupIdx(prev => prev + 1);
            setViewerItemIdx(0);
          } else {
            setViewerVisible(false);
          }
        }
      }
    });

    return () => {
      anim.stop();
    };
  }, [viewerVisible, viewerGroupIdx, viewerItemIdx, storyGroups]);

  const openViewer = (groupIdx) => {
    const group = storyGroups[groupIdx];
    if (group) {
      setStoryGroups(prev => {
        const updated = prev.map((g, i) => i === groupIdx ? { ...g, viewed: true } : g);
        return updated;
      });

      (async () => {
        try {
          const viewedRaw = await AsyncStorage.getItem('@story_viewed_ids');
          const viewedIds = viewedRaw ? JSON.parse(viewedRaw) : [];
          group.items.forEach(item => {
            if (!viewedIds.includes(item.id)) viewedIds.push(item.id);
          });
          await AsyncStorage.setItem('@story_viewed_ids', JSON.stringify(viewedIds));
        } catch (e) {}
      })();
    }
    setViewerGroupIdx(groupIdx);
    setViewerItemIdx(0);
    setViewerVisible(true);
  };

  const closeViewer = () => {
    setViewerVisible(false);
  };

  const onStoryTapLeft = () => {
    if (viewerItemIdx > 0) {
      setViewerItemIdx(prev => prev - 1);
    } else if (viewerGroupIdx > 0) {
      setViewerGroupIdx(prev => prev - 1);
      setViewerItemIdx(0);
    }
  };

  const onStoryTapRight = () => {
    const currentGroup = storyGroups[viewerGroupIdx];
    if (currentGroup) {
      if (viewerItemIdx + 1 < currentGroup.items.length) {
        setViewerItemIdx(prev => prev + 1);
      } else if (viewerGroupIdx + 1 < storyGroups.length) {
        setViewerGroupIdx(prev => prev + 1);
        setViewerItemIdx(0);
      } else {
        setViewerVisible(false);
      }
    }
  };

  // ── Create story ─────────────────────────────────────────────────────────
  const handlePickStoryImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.6,
    });
    if (!res.canceled && res.assets[0]) setStoryImage(res.assets[0].uri);
  };

  const handlePostStory = async () => {
    if (!storyImage || !accessToken) return;
    setPostingStory(true);
    try {
      let imageUrl = storyImage;
      try {
        const up = await uploadAvatarAPI(accessToken, storyImage);
        if (up.ok && up.json?.success) {
          imageUrl = up.json.data.file_url || up.json.data.avatar_url || storyImage;
        }
      } catch (err) {
        console.warn('Failed to upload story image, trying raw URI:', err);
      }

      await createStoryAPI(accessToken, {
        image_url: imageUrl,
        caption: storyCaption,
      });

      await loadStories();

      setCreateStoryVisible(false);
      setStoryImage(null);
      setStoryCaption('');
    } catch (e) {
      Alert.alert('Error', 'Failed to post story');
    } finally {
      setPostingStory(false);
    }
  };

  // ── Post image picker ─────────────────────────────────────────────────────
  const handlePickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.5,
    });
    if (!result.canceled && result.assets) {
      setSelectedImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 9));
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && selectedImages.length === 0) return;
    if (newPostContent.length > POST_CHAR_LIMIT) {
      Alert.alert('Too long', `Posts can be at most ${POST_CHAR_LIMIT} characters.`);
      return;
    }
    setPosting(true);
    try {
      if (accessToken) {
        // Upload images first
        let mediaUrls = [];
        if (selectedImages.length > 0) {
          setUploadingImages(true);
          for (const uri of selectedImages) {
            try {
              const up = await uploadAvatarAPI(accessToken, uri);
              if (up.ok && up.json?.success) {
                mediaUrls.push(up.json.data.file_url || up.json.data.avatar_url || uri);
              } else {
                mediaUrls.push(uri); // fallback to local URI
              }
            } catch { mediaUrls.push(uri); }
          }
          setUploadingImages(false);
        }

        const result = await createPost(accessToken, {
          content: newPostContent,
          media_urls: mediaUrls,
        });
        if (result) {
          setNewPostContent('');
          setSelectedImages([]);
          setShowCreateModal(false);
          loadFeed();
          Alert.alert('Post Created', 'Your post has been successfully shared with the campus feed.');
        }
      }
    } catch (err) {
      Alert.alert('Failed to Post', err.message || 'An error occurred.');
    } finally {
      setPosting(false);
      setUploadingImages(false);
    }
  };

  // ── Open lightbox ─────────────────────────────────────────────────────────
  const openLightbox = (images, startIndex = 0) => {
    setLightboxImages(images);
    setLightboxIndex(startIndex);
    setShowLightbox(true);
  };

  // ── Hashtag highlight helper ───────────────────────────────────────────────
  const renderHashtagText = (content, textStyle) => {
    if (!content) return null;
    const parts = content.split(/(#[\w\u0900-\u097F]+)/g);
    return (
      <Text style={textStyle}>
        {parts.map((part, i) =>
          part.startsWith('#') ? (
            <Text key={i} style={styles.hashtag}>{part}</Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  // ── Post image grid ──────────────────────────────────────────────────────
  const renderPostImages = (mediaUrls) => {
    if (!mediaUrls || mediaUrls.length === 0) return null;
    const count = mediaUrls.length;

    if (count === 1) {
      return (
        <TouchableOpacity activeOpacity={0.9} onPress={() => openLightbox(mediaUrls, 0)} style={styles.imgGrid1}>
          <Image source={{ uri: mediaUrls[0] }} style={styles.imgGrid1Img} />
        </TouchableOpacity>
      );
    }
    if (count === 2) {
      return (
        <View style={styles.imgGrid2}>
          {mediaUrls.map((uri, i) => (
            <TouchableOpacity key={i} activeOpacity={0.9} onPress={() => openLightbox(mediaUrls, i)} style={styles.imgGrid2Item}>
              <Image source={{ uri }} style={styles.imgGridFull} />
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    if (count === 3) {
      return (
        <View style={styles.imgGrid3}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => openLightbox(mediaUrls, 0)} style={styles.imgGrid3Left}>
            <Image source={{ uri: mediaUrls[0] }} style={styles.imgGridFull} />
          </TouchableOpacity>
          <View style={styles.imgGrid3Right}>
            {[1, 2].map(i => (
              <TouchableOpacity key={i} activeOpacity={0.9} onPress={() => openLightbox(mediaUrls, i)} style={styles.imgGrid3RightItem}>
                <Image source={{ uri: mediaUrls[i] }} style={styles.imgGridFull} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
    // 4+
    const shown = mediaUrls.slice(0, 4);
    const extra = count - 4;
    return (
      <View style={styles.imgGrid4}>
        {shown.map((uri, i) => (
          <TouchableOpacity key={i} activeOpacity={0.9} onPress={() => openLightbox(mediaUrls, i)} style={styles.imgGrid4Item}>
            <Image source={{ uri }} style={styles.imgGridFull} />
            {i === 3 && extra > 0 && (
              <View style={styles.imgGridMore}>
                <Text style={styles.imgGridMoreText}>+{extra}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
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

  const handleDeletePost = async (postId) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
         // Optimistic UI update
         setApiFeed(prev => prev.filter(p => p.id !== postId));
         try {
            await deletePostAPI(accessToken, postId);
         } catch(e) {
            console.warn('Failed to delete post', e);
            loadFeed(); // Revert/Reload if fails
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
    const isMe = posterUsername === user?.id || targetPost.author_id === user?.user_id;
    const isAuthor = post.user?.username === user?.id || post.author_id === user?.user_id;
    let displayName = targetPost.user?.full_name || targetPost.user?.name || posterUsername || 'Student';
    let avatarUrl = targetPost.user?.avatar_url || getAvatarUrl(displayName, posterUsername);
    let courseYearStr = '';

    if (isMe) {
      displayName = user?.name || user?.full_name || displayName;
      avatarUrl = user?.avatar_url || getAvatarUrl(displayName, user?.rollno || user?.id);
      if (user?.course) courseYearStr = `${user.course} • Year ${user.year || '1'}`;
    } else if (posterUsername && studentMap[posterUsername.toLowerCase()]) {
      const pData = studentMap[posterUsername.toLowerCase()];
      displayName = pData.name || pData.full_name || displayName;
      if (pData.course) courseYearStr = `${pData.course} • Year ${pData.year || '1'}`;
      avatarUrl = targetPost.user?.avatar_url || pData.avatar || getAvatarUrl(displayName, posterUsername);
    }

    if (displayName === 'Admin' || displayName === 'admin' || posterUsername === 'admin' || targetPost.user?.role === 'super_admin' || targetPost.user?.role === 'admin') {
      displayName = 'Super Admin (Aditya Murti)';
      courseYearStr = 'Campus Administration';
    }

    let repostAuthorName = 'User';
    if (isOriginal) {
      const repUsername = post.user?.username;
      const isRepMe = repUsername === user?.id;
      if (isRepMe) {
        repostAuthorName = 'You';
      } else if (repUsername && studentMap[repUsername.toLowerCase()]) {
        repostAuthorName = studentMap[repUsername.toLowerCase()].name || repUsername;
      } else {
        repostAuthorName = post.user?.full_name || repUsername || 'User';
      }
      if (repostAuthorName === 'Admin' || repostAuthorName === 'admin' || repUsername === 'admin' || post.user?.role === 'super_admin' || post.user?.role === 'admin') {
        repostAuthorName = 'Super Admin (Aditya Murti)';
      }
    }

    return (
      <View key={post.id} style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, marginTop: isRepost ? 0 : 16 }]}>
        {isOriginal && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <MaterialCommunityIcons name="repeat" size={16} color={colors.textSecondary} />
            <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>
              {repostAuthorName} reposted {displayName}'s post
            </Text>
          </View>
        )}

        <View style={styles.postHeader}>
          <TouchableOpacity
            style={[styles.postAuthor, { flex: 1, marginRight: 8 }]}
            onPress={() => {
              if (isMe) {
                navigation.navigate('Profile');
              } else {
                navigation.navigate('OtherStudentProfile', {
                  student: {
                    id: targetPost.author_id,
                    name: displayName,
                    avatar_url: avatarUrl,
                    rollNo: posterUsername,
                  }
                });
              }
            }}
          >
            <Image source={{ uri: avatarUrl }} style={styles.authorAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.authorName, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{displayName}</Text>
              {courseYearStr ? <Text style={[styles.postMeta, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{courseYearStr}</Text> : null}
              <Text style={[styles.postMeta, { color: colors.textSecondary }]}>
                {timeAgo(targetPost.created_at)}
              </Text>
            </View>
          </TouchableOpacity>
          {isAuthor ? (
            <TouchableOpacity
              onPress={() => handleDeletePost(post.id)}
              style={{
                padding: 8,
                flexShrink: 0,
              }}
            >
              <MaterialCommunityIcons name="delete-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          ) : (
            !isMe && (
              <TouchableOpacity
                onPress={async () => {
                  if (!accessToken) return;
                  if (targetPost.connection_status === 'Pending' || targetPost.connection_status === 'Connected') return;
                  try {
                    await followUserAPI(accessToken, targetPost.author_id);
                    const name = targetPost.author_name || displayName;
                    Alert.alert('Connection Request Sent', `Your connection request has been sent to ${name}.`);
                    // Optimistically update all posts from this author to show Pending
                    setApiFeed(prev => prev.map(p =>
                      p.author_id === targetPost.author_id
                        ? { ...p, connection_status: 'Pending' }
                        : p
                    ));
                  } catch (e) {
                    Alert.alert('Error', 'Failed to send connection request.');
                  }
                }}
                disabled={targetPost.connection_status === 'Pending' || targetPost.connection_status === 'Connected'}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  flexShrink: 0,
                  backgroundColor: targetPost.connection_status === 'Connected'
                    ? colors.border
                    : targetPost.connection_status === 'Pending'
                      ? colors.border + '50'
                      : colors.primary + '20'
                }}
              >
                <Text style={{
                  color: targetPost.connection_status === 'Connected'
                    ? colors.textSecondary
                    : targetPost.connection_status === 'Pending'
                      ? colors.textMuted
                      : colors.primary,
                  fontWeight: '700',
                  fontSize: 13
                }}>
                  {targetPost.connection_status === 'Connected'
                    ? 'Connected'
                    : targetPost.connection_status === 'Pending'
                      ? 'Pending'
                      : '+ Connect'}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {renderHashtagText(targetPost.content, [styles.postText, { color: colors.textPrimary, fontSize: 15, lineHeight: 22 }])}
        {renderPostImages(targetPost.media_urls)}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <TouchableOpacity onPress={() => handleOpenPostLikers(targetPost.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {topReactions.map((r, i) => (
               <Text key={i} style={{ fontSize: 14 }}>{REACTION_ICONS[r]?.icon}</Text>
            ))}
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 4, textDecorationLine: targetPost.like_count > 0 ? 'underline' : 'none' }}>
              {targetPost.like_count > 0 ? `${targetPost.like_count} ${targetPost.like_count === 1 ? 'like' : 'likes'}` : '0 likes'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => openComments(targetPost.id)}>
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
              onLongPress={() => setActiveReactionPostId(targetPost.id)}
              onPress={() => handleReaction(targetPost.id, targetPost.user_reaction || 'like')}
            >
              {targetPost.user_reaction ? (
                <Text style={{ fontSize: 18 }}>{REACTION_ICONS[targetPost.user_reaction].icon}</Text>
              ) : (
                <Ionicons name="thumbs-up-outline" size={20} color={colors.textSecondary} />
              )}
              <Text style={[styles.actionCount, { color: targetPost.user_reaction ? REACTION_ICONS[targetPost.user_reaction].color : colors.textSecondary }]}>
                {targetPost.user_reaction ? (REACTION_ICONS[targetPost.user_reaction]?.label || targetPost.user_reaction.charAt(0).toUpperCase() + targetPost.user_reaction.slice(1)) : 'Like'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(targetPost.id)}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.actionCount, { color: colors.textSecondary }]}>Comment</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => handleRepost(targetPost.id)}>
              <MaterialCommunityIcons name="repeat" size={22} color={colors.textSecondary} />
              <Text style={[styles.actionCount, { color: colors.textSecondary }]}>Repost</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(targetPost)}>
              <Ionicons name="paper-plane-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.actionCount, { color: colors.textSecondary }]}>Send</Text>
            </TouchableOpacity>
          </View>

          {activeReactionPostId === targetPost.id && (
            <View style={[styles.reactionPopover, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {Object.keys(REACTION_ICONS).map(type => (
                <TouchableOpacity key={type} onPress={() => handleReaction(targetPost.id, type)} style={{ padding: 8 }}>
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
          <LinearGradient
            colors={isDark ? ['#9A3412', '#7C2D12'] : ['#EA580C', '#9A3412']}
            style={styles.logoIconBg}
          >
            <MaterialIcons name="groups" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.headerLogo, { color: colors.textPrimary }]}>Campus Social</Text>
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

      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 400;
          if (isCloseToBottom && hasMorePosts && !loadingMore && !loadingFeed) {
            loadMorePosts();
          }
        }}
        scrollEventThrottle={300}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Pulse Stories Section */}
        {/* ── Stories Row ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.storiesScroll, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : colors.card }]}
          contentContainerStyle={styles.storiesContainer}
        >
          {/* My Story tile */}
          <TouchableOpacity
            style={[styles.storyWrap, { alignItems: 'center' }]}
            onPress={() => {
              const myId = user?.id || user?.user_id || 'me';
              const myGroupIdx = storyGroups.findIndex(g => g.userId === myId);
              if (myGroupIdx >= 0) {
                openViewer(myGroupIdx);
              } else {
                setCreateStoryVisible(true);
              }
            }}
          >
            <View style={[styles.myStory, { borderColor: colors.primary }]}>
              <Image
                source={{ uri: user?.avatar_url || getAvatarUrl(user?.name || user?.full_name || 'Me') }}
                style={styles.storyImg}
              />
              <View style={[styles.addStoryBtn, { backgroundColor: colors.primary, borderColor: colors.card }]}>
                <Ionicons name="add" size={14} color="#FFFFFF" />
              </View>
            </View>
            <Text style={{ fontSize: 10, marginTop: 4, color: colors.textSecondary, fontWeight: '700' }}>Your Story</Text>
          </TouchableOpacity>

          {/* Other users' stories */}
          {storyGroups
            .filter(g => g.userId !== (user?.id || user?.user_id || 'me'))
            .map((group, idx) => {
              const realIdx = storyGroups.indexOf(group);
              return (
                <TouchableOpacity key={group.userId} style={styles.storyWrap} onPress={() => openViewer(realIdx)}>
                  <LinearGradient
                    colors={group.viewed ? ['#D1D5DB', '#9CA3AF'] : ['#EA580C', '#8B5CF6']}
                    style={styles.storyRing}
                  >
                    <View style={[styles.storyRingInner, { borderColor: colors.card }]}>
                      <Image source={{ uri: group.avatarUrl || getAvatarUrl(group.userId) }} style={styles.storyImg} />
                    </View>
                  </LinearGradient>
                  <Text style={{ fontSize: 10, marginTop: 4, color: colors.textSecondary, fontWeight: '600', maxWidth: 72 }} numberOfLines={1}>
                    {group.username}
                  </Text>
                </TouchableOpacity>
              );
            })
          }
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
              {loadingMore && (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>Loading more posts...</Text>
                </View>
              )}
              {!hasMorePosts && apiFeed.length > 0 && (
                <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>You're all caught up! 🎉</Text>
                </View>
              )}
            </View>
          )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Post Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent={true} onRequestClose={() => { setShowCreateModal(false); setSelectedImages([]); setNewPostContent(''); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 32, maxHeight: '90%' }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary }}>Create Post</Text>
              <TouchableOpacity onPress={() => { setShowCreateModal(false); setSelectedImages([]); setNewPostContent(''); }}>
                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Text Input */}
              <TextInput
                placeholder={`What's on your mind? Use #hashtags to reach more people...`}
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.postTextInput,
                  { color: colors.textPrimary, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
                    borderColor: newPostContent.length > POST_CHAR_LIMIT ? '#EF4444' : 'transparent',
                    borderWidth: 1,
                  }
                ]}
                multiline
                value={newPostContent}
                onChangeText={t => t.length <= POST_CHAR_LIMIT + 50 && setNewPostContent(t)}
                maxLength={POST_CHAR_LIMIT + 50}
                autoFocus
              />

              {/* Character counter */}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4, marginBottom: 12 }}>
                <Text style={{
                  fontSize: 12, fontWeight: '600',
                  color: newPostContent.length > POST_CHAR_LIMIT ? '#EF4444' : newPostContent.length > POST_CHAR_LIMIT * 0.85 ? '#F59E0B' : colors.textSecondary
                }}>
                  {newPostContent.length} / {POST_CHAR_LIMIT}
                </Text>
              </View>

              {/* Image Previews */}
              {selectedImages.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 8 }}>
                  {selectedImages.map((uri, idx) => (
                    <View key={idx} style={styles.imgPickerPreviewWrap}>
                      <Image source={{ uri }} style={styles.imgPickerPreview} />
                      <TouchableOpacity
                        style={styles.imgPickerRemoveBtn}
                        onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <Ionicons name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {selectedImages.length < 9 && (
                    <TouchableOpacity style={styles.imgPickerAddMore} onPress={handlePickImages}>
                      <Ionicons name="add" size={28} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </ScrollView>
              )}

              {/* Toolbar */}
              <View style={styles.postModalToolbar}>
                <TouchableOpacity style={[styles.postModalTool, { backgroundColor: colors.primary + '15' }]} onPress={handlePickImages}>
                  <Ionicons name="image-outline" size={20} color={colors.primary} />
                  <Text style={[styles.postModalToolLabel, { color: colors.primary }]}>Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.postModalTool, { backgroundColor: '#8B5CF6' + '15' }]}
                  onPress={() => setNewPostContent(p => p + ' #')}
                >
                  <Ionicons name="pricetag-outline" size={20} color="#8B5CF6" />
                  <Text style={[styles.postModalToolLabel, { color: '#8B5CF6' }]}>Tag</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Share Button */}
            <TouchableOpacity
              style={[
                styles.sharePostBtn,
                { backgroundColor: (posting || (!newPostContent.trim() && selectedImages.length === 0) || newPostContent.length > POST_CHAR_LIMIT) ? colors.border : colors.primary }
              ]}
              onPress={handleCreatePost}
              disabled={posting || (!newPostContent.trim() && selectedImages.length === 0) || newPostContent.length > POST_CHAR_LIMIT}
            >
              {(posting || uploadingImages) ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialIcons name="hourglass-empty" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{uploadingImages ? 'Uploading photos...' : 'Sharing...'}</Text>
                </View>
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>Share Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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

      {/* ── Lightbox Modal ── */}
      <Modal visible={showLightbox} transparent animationType="fade" onRequestClose={() => setShowLightbox(false)}>
        <View style={styles.lightboxBg}>
          <TouchableOpacity style={styles.lightboxClose} onPress={() => setShowLightbox(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <FlatList
            data={lightboxImages}
            horizontal
            pagingEnabled
            initialScrollIndex={lightboxIndex}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            keyExtractor={(_, i) => i.toString()}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={{ width, justifyContent: 'center', alignItems: 'center' }}>
                <Image source={{ uri: item }} style={styles.lightboxImg} resizeMode="contain" />
              </View>
            )}
          />
          <Text style={styles.lightboxCounter}>{lightboxImages.length > 1 ? `${lightboxIndex + 1} / ${lightboxImages.length}` : ''}</Text>
        </View>
      </Modal>

      {/* ── Story Viewer Modal ── */}
      <Modal visible={viewerVisible} transparent animationType="fade" onRequestClose={closeViewer}>
        <View style={styles.svContainer}>
          {(() => {
            const group = storyGroups[viewerGroupIdx];
            if (!group) return null;
            const item = group.items[viewerItemIdx];
            if (!item) return null;
            return (
              <>
                {/* Background image */}
                <Image source={{ uri: item.imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.25)' }]} />

                {/* Progress bars */}
                <View style={[styles.svProgressRow, { paddingTop: insets.top + 8 }]}>
                  {group.items.map((_, i) => (
                    <View key={i} style={styles.svProgressTrack}>
                      <Animated.View
                        style={[
                          styles.svProgressFill,
                          {
                            width: i < viewerItemIdx
                              ? '100%'
                              : i === viewerItemIdx
                                ? storyProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                                : '0%',
                          },
                        ]}
                      />
                    </View>
                  ))}
                </View>

                {/* Header: avatar + name + delete + close */}
                <View style={styles.svHeader}>
                  <Image source={{ uri: group.avatarUrl || getAvatarUrl(group.userId) }} style={styles.svAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.svUsername}>{group.username}</Text>
                    <Text style={styles.svTime}>{timeAgo(new Date(item.createdAt).toISOString())}</Text>
                  </View>
                  {(group.userId === (user?.id || user?.user_id || 'me') || user?.role === 'super_admin' || user?.role === 'admin') && (
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert("Delete Story", "Are you sure you want to delete this story?", [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: async () => {
                              closeViewer();
                              try {
                                await deleteStoryAPI(accessToken, item.id);
                                loadStories();
                              } catch (e) {
                                console.warn("Delete story error", e);
                              }
                            }
                          }
                        ]);
                      }}
                      style={{ padding: 6, marginRight: 8 }}
                    >
                      <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={closeViewer} style={styles.svClose}>
                    <Ionicons name="close" size={26} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Tap zones */}
                <View style={styles.svTapRow} pointerEvents="box-none">
                  <TouchableWithoutFeedback onPress={onStoryTapLeft}>
                    <View style={styles.svTapLeft} />
                  </TouchableWithoutFeedback>
                  <TouchableWithoutFeedback onPress={onStoryTapRight}>
                    <View style={styles.svTapRight} />
                  </TouchableWithoutFeedback>
                </View>

                {/* Bottom Overlay: Caption + Heart Icon (for liking) + View stats (for own stories) */}
                <View style={styles.svBottomOverlay}>
                  {/* Caption */}
                  {!!item.caption && (
                    <Text style={styles.svCaption}>{item.caption}</Text>
                  )}

                  {/* Actions row */}
                  <View style={styles.svActionsRow}>
                    {/* Heart Like button */}
                    <TouchableOpacity
                      style={styles.svLikeButton}
                      onPress={async () => {
                        if (!accessToken) return;
                        const isLiked = item.user_liked;
                        setStoryGroups(prev => prev.map((g, gIdx) => {
                          if (gIdx === viewerGroupIdx) {
                            const newItems = g.items.map((it, iIdx) => {
                              if (iIdx === viewerItemIdx) {
                                return {
                                  ...it,
                                  user_liked: !isLiked,
                                  like_count: isLiked ? Math.max(0, it.like_count - 1) : it.like_count + 1
                                };
                              }
                              return it;
                            });
                            return { ...g, items: newItems };
                          }
                          return g;
                        }));

                        try {
                          await likeStoryAPI(accessToken, item.id);
                          loadStories();
                        } catch (e) {
                          console.warn('Story like error', e);
                        }
                      }}
                    >
                      <Ionicons
                        name={item.user_liked ? "heart" : "heart-outline"}
                        size={28}
                        color={item.user_liked ? "#EF4444" : "#FFFFFF"}
                      />
                      {item.like_count > 0 && (
                        <Text style={styles.svLikeCount}>{item.like_count}</Text>
                      )}
                    </TouchableOpacity>

                    {/* Comment on Story button */}
                    <TouchableOpacity
                      style={styles.svLikeButton}
                      onPress={() => handleOpenStoryComments(item)}
                    >
                      <Ionicons name="chatbubble-outline" size={26} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Own story viewer stats badge */}
                    {group.userId === (user?.id || user?.user_id || 'me') && (
                      <TouchableOpacity
                        style={styles.svStatsBadge}
                        onPress={() => {
                          openViewerAnalytics(item);
                        }}
                      >
                        <Ionicons name="eye-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.svStatsText}>{item.view_count || 0}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </>
            );
          })()}
        </View>
      </Modal>

      {/* ── Create Story Modal ── */}
      <Modal visible={createStoryVisible} animationType="slide" transparent onRequestClose={() => { setCreateStoryVisible(false); setStoryImage(null); setStoryCaption(''); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={[styles.csContainer, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.csHeader, { paddingTop: insets.top + 10 }]}>
              <TouchableOpacity onPress={() => { setCreateStoryVisible(false); setStoryImage(null); setStoryCaption(''); }}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.csTitle, { color: colors.textPrimary }]}>New Story</Text>
              <TouchableOpacity
                style={[styles.csShareBtn, { backgroundColor: storyImage ? colors.primary : colors.border }]}
                onPress={handlePostStory}
                disabled={!storyImage || postingStory}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{postingStory ? 'Posting...' : 'Share'}</Text>
              </TouchableOpacity>
            </View>

            {/* Image preview or pick */}
            <TouchableOpacity style={styles.csImageArea} onPress={handlePickStoryImage} activeOpacity={0.8}>
              {storyImage ? (
                <Image source={{ uri: storyImage }} style={styles.csImagePreview} resizeMode="cover" />
              ) : (
                <View style={[styles.csImagePlaceholder, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6', borderColor: colors.border }]}>
                  <Ionicons name="image-outline" size={64} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, marginTop: 12, fontWeight: '700', fontSize: 15 }}>Tap to choose a photo</Text>
                  <Text style={{ color: colors.textMuted, marginTop: 4, fontSize: 12 }}>Best: portrait / 9:16</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Caption */}
            <View style={[styles.csCaptionBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <Ionicons name="text-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.csCaptionInput, { color: colors.textPrimary }]}
                placeholder="Add a caption (optional)..."
                placeholderTextColor={colors.textSecondary}
                value={storyCaption}
                onChangeText={setStoryCaption}
                maxLength={150}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Story Viewer Analytics Modal ── */}
      <Modal
        visible={showAnalyticsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeViewerAnalytics}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '60%' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>Viewer Analytics</Text>
              <TouchableOpacity onPress={closeViewerAnalytics}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Stats Summary */}
            <View style={{ flexDirection: 'row', gap: 20, marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="eye-outline" size={20} color={colors.textSecondary} />
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>
                  {analyticsStoryItem?.viewers?.length || 0} Views
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="heart" size={20} color="#EF4444" />
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>
                  {analyticsStoryItem?.likes?.length || 0} Likes
                </Text>
              </View>
            </View>

            {/* Viewers & Likers List */}
            <FlatList
              data={(() => {
                if (!analyticsStoryItem) return [];
                const likesUserIds = new Set((analyticsStoryItem.likes || []).map(l => String(l.user_id)));
                const allViewerIds = new Set((analyticsStoryItem.viewers || []).map(v => String(v.user_id)));
                
                const list = [];
                (analyticsStoryItem.viewers || []).forEach(v => {
                  list.push({
                    userId: String(v.user_id),
                    username: v.username,
                    full_name: v.full_name,
                    avatar_url: v.avatar_url,
                    liked: likesUserIds.has(String(v.user_id)),
                    created_at: v.created_at
                  });
                });
                
                (analyticsStoryItem.likes || []).forEach(l => {
                  if (!allViewerIds.has(String(l.user_id))) {
                    list.push({
                      userId: String(l.user_id),
                      username: l.username,
                      full_name: l.full_name,
                      avatar_url: l.avatar_url,
                      liked: true,
                      created_at: l.created_at
                    });
                  }
                });

                return list;
              })()}
              keyExtractor={item => item.userId}
              renderItem={({ item }) => {
                const isMe = item.username === user?.id;
                let displayName = item.full_name || item.username || 'Student';
                let avatarUrl = item.avatar_url || getAvatarUrl(item.username || item.userId);
                
                if (isMe) {
                  displayName = user?.name || displayName;
                  avatarUrl = user?.avatar_url || avatarUrl;
                } else if (item.username && studentMap[item.username.toLowerCase()]) {
                  const pData = studentMap[item.username.toLowerCase()];
                  displayName = pData.name || displayName;
                  if (pData.avatar) avatarUrl = pData.avatar;
                }

                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Image source={{ uri: avatarUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                      <View>
                        <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{displayName}</Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                          {item.created_at ? timeAgo(item.created_at) : ''}
                        </Text>
                      </View>
                    </View>
                    {item.liked && (
                      <Ionicons name="heart" size={20} color="#EF4444" />
                    )}
                  </View>
                );
              }}
              ListEmptyComponent={() => (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary }}>No views or reactions yet.</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ── Post Likers Modal ── */}
      <Modal visible={postLikersModalVisible} animationType="slide" transparent onRequestClose={() => setPostLikersModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPostLikersModalVisible(false)}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '75%', paddingBottom: (insets.bottom || 16) + 12 }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Reactions</Text>
                <TouchableOpacity onPress={() => setPostLikersModalVisible(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {loadingPostLikers ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
              ) : postLikers.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Ionicons name="heart-outline" size={48} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>No reactions yet</Text>
                </View>
              ) : (
                <FlatList
                  data={postLikers}
                  keyExtractor={(item) => item.user_id || item.username}
                  renderItem={({ item }) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 8 }}>
                        <Image source={{ uri: getAvatarUrl(item.avatar_url || item.username) }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '700', fontSize: 15, color: colors.textPrimary }} numberOfLines={1} ellipsizeMode="tail">
                            {item.full_name || item.username}
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.textSecondary }}>@{item.username}</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 20 }}>
                        {REACTION_ICONS[item.reaction_type]?.icon || '👍'}
                      </Text>
                    </View>
                  )}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* ── Story Comments Modal ── */}
      <Modal visible={storyCommentsModalVisible} animationType="slide" transparent onRequestClose={() => setStoryCommentsModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '80%' }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Story Comments</Text>
                <TouchableOpacity onPress={() => setStoryCommentsModalVisible(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {loadingStoryComments ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
              ) : storyCommentsList.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>No comments yet. Be the first!</Text>
                </View>
              ) : (
                <FlatList
                  data={storyCommentsList}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                      <Image source={{ uri: getAvatarUrl(item.avatar_url || item.username) }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontWeight: '700', fontSize: 14, color: colors.textPrimary }}>{item.full_name || item.username}</Text>
                          {item.created_at && (
                            <Text style={{ fontSize: 11, color: colors.textSecondary }}>{timeAgo(item.created_at)}</Text>
                          )}
                        </View>
                        <Text style={{ fontSize: 14, color: colors.textPrimary, marginTop: 2 }}>{item.content}</Text>
                      </View>
                    </View>
                  )}
                />
              )}

              {/* Story comment input bar */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: isDark ? colors.background : '#F3F4F6', color: colors.textPrimary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, fontSize: 14 }}
                  placeholder="Reply to story..."
                  placeholderTextColor={colors.textSecondary}
                  value={newStoryCommentText}
                  onChangeText={setNewStoryCommentText}
                />
                <TouchableOpacity
                  style={{ backgroundColor: newStoryCommentText.trim() ? colors.primary : colors.border, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}
                  onPress={handleSendStoryComment}
                  disabled={!newStoryCommentText.trim() || postingStoryComment}
                >
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLogo: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  headerIconBtn: { padding: 6 },
  scroll: { paddingBottom: 20 },
  storiesScroll: { paddingVertical: 16 },
  storiesContainer: { paddingHorizontal: 16, gap: 12 },
  storyWrap: { alignItems: 'center' },
  myStory: { width: 80, height: 80, borderRadius: 40, padding: 3, borderWidth: 2, position: 'relative' },
  addStoryBtn: { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  otherStory: { width: 80, height: 80, borderRadius: 40, padding: 3, borderWidth: 2 },
  storyImg: { width: '100%', height: '100%', borderRadius: 30 },
  storyRing: { width: 86, height: 86, borderRadius: 43, padding: 3, justifyContent: 'center', alignItems: 'center' },
  storyRingInner: { width: 78, height: 78, borderRadius: 39, overflow: 'hidden', borderWidth: 3 },
  // Story Viewer
  svContainer: { flex: 1, backgroundColor: '#000' },
  svProgressRow: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', gap: 4, paddingHorizontal: 12, zIndex: 20 },
  svProgressTrack: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2, overflow: 'hidden' },
  svProgressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  svHeader: { position: 'absolute', top: 48, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10, zIndex: 20 },
  svAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  svUsername: { color: '#fff', fontWeight: '800', fontSize: 15 },
  svTime: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 },
  svClose: { padding: 6 },
  svTapRow: { position: 'absolute', inset: 0, flexDirection: 'row', zIndex: 10 },
  svTapLeft: { flex: 1 },
  svTapRight: { flex: 2 },
  svCaptionWrap: { position: 'absolute', bottom: 80, left: 0, right: 0, paddingHorizontal: 20, zIndex: 20 },
  svCaption: { color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  svBottomOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 16,
    zIndex: 20,
  },
  svActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  svLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  svLikeCount: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  svStatsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  svStatsText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  // Create Story
  csContainer: { flex: 1 },
  csHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  csTitle: { fontSize: 20, fontWeight: '900' },
  csShareBtn: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20 },
  csImageArea: { flex: 1, margin: 16, borderRadius: 24, overflow: 'hidden' },
  csImagePreview: { width: '100%', height: '100%' },
  csImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 24, borderWidth: 2, borderStyle: 'dashed' },
  csCaptionBar: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderTopWidth: 1 },
  csCaptionInput: { flex: 1, fontSize: 15 },
  feedContainer: { padding: 0, gap: 8 },
  postCard: { borderRadius: 0, padding: 16, borderTopWidth: 1, borderBottomWidth: 1, marginBottom: 8 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  postAuthor: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  authorAvatar: { width: 48, height: 48, borderRadius: 24 },
  authorName: { fontSize: 16, fontWeight: '700' },
  postMeta: { fontSize: 12, marginTop: 2 },
  postText: { fontSize: 15, lineHeight: 22, marginTop: 4 },
  hashtag: { color: '#0A66C2', fontWeight: '700' },
  postImg: { width: '100%', height: 250, borderRadius: 0, marginTop: 12, resizeMode: 'cover' },
  // Image grids
  imgGrid1: { marginTop: 10, borderRadius: 12, overflow: 'hidden' },
  imgGrid1Img: { width: '100%', height: 260, resizeMode: 'cover' },
  imgGrid2: { flexDirection: 'row', gap: 3, marginTop: 10, height: 220 },
  imgGrid2Item: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  imgGrid3: { flexDirection: 'row', gap: 3, marginTop: 10, height: 220 },
  imgGrid3Left: { flex: 1.3, borderRadius: 12, overflow: 'hidden' },
  imgGrid3Right: { flex: 1, gap: 3 },
  imgGrid3RightItem: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  imgGrid4: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 10 },
  imgGrid4Item: { width: '48.5%', height: 140, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  imgGridFull: { width: '100%', height: '100%', resizeMode: 'cover' },
  imgGridMore: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  imgGridMoreText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  // Lightbox
  lightboxBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', justifyContent: 'center' },
  lightboxClose: { position: 'absolute', top: 56, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 6 },
  lightboxImg: { width, height: Dimensions.get('window').height * 0.8 },
  lightboxCounter: { position: 'absolute', bottom: 48, alignSelf: 'center', color: '#fff', fontSize: 14, fontWeight: '700', opacity: 0.8 },
  // Create Post Modal
  postTextInput: { minHeight: 140, textAlignVertical: 'top', fontSize: 15, padding: 14, borderRadius: 16, lineHeight: 22 },
  postModalToolbar: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  postModalTool: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  postModalToolLabel: { fontSize: 13, fontWeight: '700' },
  sharePostBtn: { borderRadius: 18, padding: 15, alignItems: 'center', marginTop: 4 },
  imgPickerPreviewWrap: { position: 'relative' },
  imgPickerPreview: { width: 90, height: 90, borderRadius: 14 },
  imgPickerRemoveBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444', borderRadius: 12, width: 22, height: 22, justifyContent: 'center', alignItems: 'center' },
  imgPickerAddMore: { width: 90, height: 90, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  postFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  footerActions: { flexDirection: 'row', gap: 8, justifyContent: 'space-around', width: '100%' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, flex: 1, justifyContent: 'center' },
  actionCount: { fontSize: 14, fontWeight: '600' },
  reactionPopover: { position: 'absolute', bottom: 50, left: 0, flexDirection: 'row', borderRadius: 30, padding: 4, borderWidth: 1, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { height: -2, width: 0 } },
  badgeCount: { position: 'absolute', top: 4, right: 4, backgroundColor: 'red', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  // Bottom Sheet Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    padding: 4,
  },
});

export default CommunityScreen;
