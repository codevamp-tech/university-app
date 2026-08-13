import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Animated, Pressable, Dimensions, Platform, Alert,
  FlatList, TextInput, KeyboardAvoidingView, ActivityIndicator, ScrollView,
  Linking, Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from '@react-navigation/native';
import { APP_CONFIG } from '../../config/appConfig';
import { useUser } from '../../context/UserContext';
import { useChatSocketContext } from '../../context/ChatSocketContext';
import {
  getChatChannelsAPI,
  getChannelHistoryAPI,
  getDMContactsAPI,
  getFacultyGroupChats,
  sendPortalChatMessage,
  uploadAvatarAPI,
  uploadDocumentAPI,
} from '../../data/apiService';
import { getAvatarUrl } from '../../utils/avatar';
import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.78;

export function getPortalSubjects(user) {
  // Returns all medical subjects across all MBBS phases so students can view group chats for any subject
  return [
    // Phase 1 (Pre-Clinical)
    { id: 'Anatomy-AnandKumar', name: 'Anatomy', subcode: 'AN', department: 'ANATOMY', facultyId: 'D/11/094', facultyName: 'ANAND KUMAR' },
    { id: 'Physiology-BinduGarg', name: 'Physiology', subcode: 'PY', department: 'PHYSIOLOGY', facultyId: 'D/11/093', facultyName: 'KRANTHI KUMAR GARIKAPATI' },
    { id: 'Biochemistry-ShaliniGupta', name: 'Biochemistry', subcode: 'BC', department: 'BIOCHEMISTRY', facultyId: 'D/11/095', facultyName: 'SHALINI GUPTA' },
    
    // Phase 2 (Para-Clinical)
    { id: 'Pathology-ShanuGupta', name: 'Pathology', subcode: 'PA', department: 'PATHOLOGY', facultyId: '202011250', facultyName: 'SHANU GUPTA' },
    { id: 'Pharmacology-RajeshKumar', name: 'Pharmacology', subcode: 'PH', department: 'PHARMACOLOGY', facultyId: 'D/09/012', facultyName: 'DR. RAJESH KUMAR' },
    { id: 'Microbiology-AmitSingh', name: 'Microbiology', subcode: 'MI', department: 'MICROBIOLOGY', facultyId: 'D/09/013', facultyName: 'DR. AMIT SINGH' },
    { id: 'ForensicMedicine-NehaSharma', name: 'Forensic Medicine', subcode: 'FM', department: 'FORENSIC MEDICINE', facultyId: 'D/09/014', facultyName: 'DR. NEHA SHARMA' },

    // Phase 3 Part 1
    { id: 'CommunityMedicine-VikasChandra', name: 'Community Medicine', subcode: 'CM', department: 'COMMUNITY MEDICINE', facultyId: 'D/08/043', facultyName: 'DR. VIKAS CHANDRA' },
    { id: 'ENT-SanjayBansal', name: 'ENT (Otorhinolaryngology)', subcode: 'EN', department: 'ENT', facultyId: 'D/08/041', facultyName: 'DR. SANJAY BANSAL' },
    { id: 'Ophthalmology-MeenakshiJain', name: 'Ophthalmology', subcode: 'OP', department: 'OPHTHALMOLOGY', facultyId: 'D/08/042', facultyName: 'DR. MEENAKSHI JAIN' },

    // Phase 3 Part 2 (Clinical)
    { id: 'Medicine-AKSingh', name: 'General Medicine', subcode: 'IM', department: 'GENERAL MEDICINE', facultyId: 'D/07/011', facultyName: 'DR. A.K. SINGH' },
    { id: 'Surgery-PKJain', name: 'General Surgery', subcode: 'SU', department: 'GENERAL SURGERY', facultyId: 'D/07/012', facultyName: 'DR. P.K. JAIN' },
    { id: 'Paediatrics-SandhyaChauhan', name: 'Paediatrics', subcode: 'PE', department: 'PAEDIATRICS', facultyId: 'D/11/048', facultyName: 'SANDHYA CHAUHAN' },
    { id: 'OBG-RuchiGupta', name: 'Obstetrics & Gynaecology', subcode: 'OG', department: 'OBGY', facultyId: 'D/07/013', facultyName: 'DR. RUCHI GUPTA' },
    { id: 'Ortho-DrOrtho', name: 'Orthopedics', subcode: 'OR', department: 'ORTHOPAEDICS', facultyId: 'D/08/050', facultyName: 'DR. ORTHO FACULTY' },
    { id: 'Derma-DrDerma', name: 'Dermatology & Leprosy', subcode: 'DR', department: 'DERMATOLOGY', facultyId: 'D/08/051', facultyName: 'DR. DERMA FACULTY' },
    { id: 'Psychiatry-DrPsychiatry', name: 'Psychiatry', subcode: 'PS', department: 'PSYCHIATRY', facultyId: 'D/08/052', facultyName: 'DR. PSYCHIATRY FACULTY' },
    { id: 'Radio-DrRadio', name: 'Radiodiagnosis', subcode: 'RD', department: 'RADIODIAGNOSIS', facultyId: 'D/08/053', facultyName: 'DR. RADIOLOGY FACULTY' },
    { id: 'Anesthesia-DrAnesthesia', name: 'Anesthesiology', subcode: 'AS', department: 'ANESTHESIOLOGY', facultyId: 'D/08/054', facultyName: 'DR. ANESTHESIA FACULTY' },
    { id: 'Respi-DrRespi', name: 'Respiratory Medicine', subcode: 'CT', department: 'RESPIRATORY MEDICINE', facultyId: 'D/08/055', facultyName: 'DR. RESPI FACULTY' },
    { id: 'Dentistry-DrDentistry', name: 'Dentistry', subcode: 'DE', department: 'DENTISTRY', facultyId: 'D/08/056', facultyName: 'DR. DENTISTRY FACULTY' },
  ];
}

// ── Default channels shown before API loads ──────────────────────────────────
const MEDICAL_CHANNELS = [
  { id: null, name: 'Campus Pulse', slug: 'campus-pulse', icon: 'lightning-bolt', desc: 'Daily campus life, events & vibes 🎓' },
  { id: null, name: 'Clinical Rotations', slug: 'clinical-rotations', icon: 'stethoscope', desc: 'Ward rounds, case presentations & OPD 🩺' },
  { id: null, name: 'Alumni Network & Advice', slug: 'alumni-network', icon: 'account-school', desc: 'Connect with senior medical alumni & residency advice 🎓' },
  { id: 'official-batch-chat', name: 'Official Batch Chat', slug: 'official-batch-chat', icon: 'chat-outline', desc: 'Sync of ERP Official Batch Chat 🏛️' },
];

const ENGINEERING_CHANNELS = [
  { id: null, name: 'Campus Pulse', slug: 'campus-pulse', icon: 'lightning-bolt', desc: 'Daily campus life & vibes 🎓' },
  { id: null, name: 'Career Launchpad', slug: 'career-launchpad', icon: 'rocket-launch', desc: 'Placements, internships & prep 🚀' },
  { id: null, name: "Maker's Den", slug: 'makers-den', icon: 'hammer-wrench', desc: 'Hackathons & side projects 🛠️' },
  { id: 'official-batch-chat', name: 'Official Batch Chat', slug: 'official-batch-chat', icon: 'chat-outline', desc: 'Sync of ERP Official Batch Chat 🏛️' },
];

const ChatSkeletonLoader = ({ isDark }) => {
  const bubbleMeBg = isDark ? '#374151' : '#FFF7ED';
  const bubbleOtherBg = isDark ? '#1F2937' : '#F3F4F6';
  const lineBg = isDark ? '#4B5563' : '#E5E7EB';

  const ChatSkeletonItem = ({ isMe, width }) => (
    <View style={{
      flexDirection: 'row',
      justifyContent: isMe ? 'flex-end' : 'flex-start',
      marginVertical: 8,
      width: '100%',
    }}>
      {!isMe && <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: lineBg, marginRight: 8, alignSelf: 'flex-end' }} />}
      <View style={{
        borderRadius: 16,
        padding: 12,
        gap: 6,
        width,
        backgroundColor: isMe ? bubbleMeBg : bubbleOtherBg,
        borderBottomRightRadius: isMe ? 4 : 16,
        borderBottomLeftRadius: isMe ? 16 : 4,
      }}>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: lineBg, width: '100%' }} />
        <View style={{ height: 10, borderRadius: 5, backgroundColor: lineBg, width: '60%' }} />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <ChatSkeletonItem isMe={false} width="70%" />
      <ChatSkeletonItem isMe={true} width="50%" />
      <ChatSkeletonItem isMe={false} width="85%" />
      <ChatSkeletonItem isMe={true} width="60%" />
      <ChatSkeletonItem isMe={false} width="40%" />
    </View>
  );
};

const ChatScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { accessToken, user } = useUser();
  const { colors, isDark } = useTheme();
  const isSuperAdmin = user?.role === 'super_admin';
  const isMed = user && (
    (user.course || '').replace(/\./g, '').toLowerCase().includes('mbbs') ||
    (user.course || '').toLowerCase().includes('medicine') ||
    (user.category || '').toLowerCase().includes('medical')
  );

  const initialChannels = isMed ? MEDICAL_CHANNELS : ENGINEERING_CHANNELS;

  const [selectedBatch, setSelectedBatch] = useState(user?.batch_year || user?.batch || '2025');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [channels, setChannels] = useState(initialChannels);
  // Default to Campus Pulse (index 0) — NOT Official Batch Chat
  const [activeChannel, setActiveChannel] = useState(initialChannels[0]);
  const [dmContacts, setDmContacts] = useState([]);
  const [loadingDMs, setLoadingDMs] = useState(false);
  const [inputText, setInputText] = useState('');
  const [portalMessages, setPortalMessages] = useState([]);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [sendingPortalMessage, setSendingPortalMessage] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const portalSubjects = React.useMemo(() => getPortalSubjects(user), [user]);
  const [activePortalSubject, setActivePortalSubject] = useState(() => getPortalSubjects(user)[0]);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  useEffect(() => {
    if (portalSubjects.length > 0) {
      const exists = portalSubjects.some(sub => sub.id === activePortalSubject?.id);
      if (!exists) {
        setActivePortalSubject(portalSubjects[0]);
      }
    }
  }, [portalSubjects]);

  const slideAnim = useRef(new Animated.Value(1)).current;

  const {
    connected,
    onlineUsers,
    channelMessages,
    sendChannelMessage,
    joinChannel,
    loadChannelHistory,
    lastError,
    clearError,
  } = useChatSocketContext();

  // ── Fetch channels & DM contacts ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingDMs(true);
      try {
        const [chs, dms] = await Promise.all([
          getChatChannelsAPI(accessToken),
          getDMContactsAPI(accessToken),
        ]);
        const initialChs = isMed ? MEDICAL_CHANNELS : ENGINEERING_CHANNELS;
        
        let merged = initialChs;
        if (chs?.length) {
          if (isMed) {
            const mappedChs = chs.map(c => {
              if (c.slug === 'career-launchpad') {
                return { ...c, name: 'Clinical Rotations', icon: 'stethoscope', desc: 'Ward rounds, case presentations & OPD 🩺' };
              }
              if (c.slug === 'makers-den') {
                return { ...c, name: 'Alumni Network & Advice', icon: 'account-school', desc: 'Connect with senior medical alumni & residency advice 🎓' };
              }
              return c;
            });
            merged = [
              ...mappedChs,
              { id: 'official-batch-chat', name: 'Official Batch Chat', slug: 'official-batch-chat', icon: 'chat-outline', desc: 'Sync of ERP Official Batch Chat 🏛️' },
            ];
          } else {
            merged = [
              ...chs,
              { id: 'official-batch-chat', name: 'Official Batch Chat', slug: 'official-batch-chat', icon: 'chat-outline', desc: 'Sync of ERP Official Batch Chat 🏛️' },
            ];
          }
        }
        setChannels(merged);
        setActiveChannel(prev => {
          if (prev?.id && prev.id !== 'official-batch-chat') return prev; // already has a real social channel
          const matchBySlug = merged.find(c => c.slug === prev?.slug);
          return matchBySlug || merged[0]; // land on first social channel
        });
        if (Array.isArray(dms)) {
          const enrichedDms = dms.map(dm => ({
            ...dm,
            username: dm.full_name || dm.username,
          }));
          setDmContacts(enrichedDms);
        }
      } catch (e) {
        console.warn('[ChatScreen] load error', e);
      } finally {
        setLoadingDMs(false);
      }
    };
    if (accessToken) load();
  }, [accessToken, isMed]);

  // ── Join channel & load history when active channel changes ───────────────
  useEffect(() => {
    if (!activeChannel?.id) return;
    if (activeChannel.id === 'official-batch-chat') return; // Bypass WebSocket for portal chat
    joinChannel(activeChannel.id);
    getChannelHistoryAPI(accessToken, activeChannel.id).then((history) => {
      if (history?.length) loadChannelHistory(activeChannel.id, history);
    }).catch(() => { });
  }, [activeChannel?.id]);

  // ── Load legacy portal messages ───────────────────────────────────────────
  const loadPortalMessages = useCallback(async (clearFirst = false) => {
    if (!accessToken || activeChannel?.id !== 'official-batch-chat') {
      console.log('[ChatScreen] loadPortalMessages skipped. activeChannel.id:', activeChannel?.id);
      return;
    }
    if (clearFirst) {
      setPortalMessages([]);
    }
    setLoadingPortal(true);
    try {
      const batchYear = isSuperAdmin ? selectedBatch : (user?.batch_year || user?.batch || '2025');
      const bStr = String(batchYear || '').trim();
      let targetPhase = '1';
      let targetSubphase = '1';
      if (bStr.includes('2023')) {
        targetPhase = '3';
        targetSubphase = '1';
      } else if (bStr.includes('2024')) {
        targetPhase = '2';
        targetSubphase = '2';
      } else if (bStr.includes('2022')) {
        targetPhase = '3';
        targetSubphase = '2';
      }

      console.log('[ChatScreen] Fetching chats for batch:', batchYear, 'phase:', targetPhase, 'subject:', activePortalSubject.name, 'facultyId:', activePortalSubject.facultyId);
      let history = await getFacultyGroupChats(
        activePortalSubject.facultyId,
        String(batchYear),
        targetPhase,
        targetSubphase
      );
      console.log('[ChatScreen] Received portal history length:', history?.length);
      // Real production behavior: load only messages of the logged-in student's batch
      const mappedHistory = (history || [])
        .map(msg => {
          let isMeUser = false;
          if (user?.role === 'teacher') {
            isMeUser = msg.classlabel === 'left' && String(msg.ChatFacId || '').trim().toUpperCase() === String(user?.emp_id || '').trim().toUpperCase();
          } else if (user?.role === 'super_admin') {
            isMeUser = msg.classlabel === 'left' && String(msg.ChatFacId || '').trim().toUpperCase() === String(user?.emp_id || user?.id || '').trim().toUpperCase();
          } else {
            // Student: Check if classlabel is right/non-left and student's name matches logged-in user name
            const loggedName = String(user?.name || user?.id || '').trim().toLowerCase();
            isMeUser = msg.classlabel !== 'left' && String(msg.StudentName || '').trim().toLowerCase() === loggedName;
          }
          return {
            ...msg,
            isMe: isMeUser
          };
        })
        .filter(msg => {
          const isBCBatch = ['2024', '2025', '2026'].includes(bStr);

          const currentSubcode = (activePortalSubject.department === 'BIOCHEMISTRY')
            ? (isBCBatch ? 'BC' : 'BI')
            : activePortalSubject.subcode;

          const msgSubcode = String(msg.subcode || '').trim().toUpperCase();
          const targetSubcodeNorm = String(currentSubcode || '').trim().toUpperCase();
          const msgDept = String(msg.department || '').trim().toUpperCase();
          const targetDeptNorm = String(activePortalSubject.department || '').trim().toUpperCase();

          if (msgSubcode && msgSubcode !== '0' && targetSubcodeNorm && msgSubcode === targetSubcodeNorm) return true;
          if (msgDept && targetDeptNorm) {
            if (msgDept.includes(targetDeptNorm) || targetDeptNorm.includes(msgDept)) return true;
            if (msgDept.slice(0, 4) === targetDeptNorm.slice(0, 4)) return true;
          }
          if (!msgSubcode || msgSubcode === '0' || !msgDept || msgDept === '0') return true;
          return false;
        });
      console.log('[ChatScreen] Mapped and filtered history length:', mappedHistory.length);
      setPortalMessages([...mappedHistory].reverse());
    } catch (e) {
      console.warn('[ChatScreen] error loading portal messages:', e);
    } finally {
      setLoadingPortal(false);
    }
  }, [accessToken, activeChannel, activePortalSubject, user, selectedBatch, isSuperAdmin]);

  useEffect(() => {
    if (activeChannel?.id === 'official-batch-chat') {
      loadPortalMessages(true);
    }
  }, [activeChannel?.id, activePortalSubject, selectedBatch, loadPortalMessages]);

  useEffect(() => {
    if (activeChannel?.id !== 'official-batch-chat') return;
    const interval = setInterval(() => {
      loadPortalMessages(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeChannel?.id, activePortalSubject, selectedBatch, loadPortalMessages]);

  // ── Drawer animation ──────────────────────────────────────────────────────
  const toggleDrawer = () => {
    if (isDrawerOpen) {
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setIsDrawerOpen(false));
    } else {
      setIsDrawerOpen(true);
      Animated.timing(slideAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }
  };

  const drawerTranslateX = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-DRAWER_WIDTH, 0] });
  const overlayOpacity = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  useFocusEffect(
    useCallback(() => {
      if (!route?.params?.directToChannel) {
        setIsDrawerOpen(true);
        Animated.timing(slideAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      }
    }, [route?.params])
  );

  const flatListRef = useRef(null);

  // ── Show server errors ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (lastError) {
      Alert.alert('Message Failed', lastError);
      clearError();
    }
  }, [lastError]);

  const handleAttachmentPress = async (url, department) => {
    if (!url) return;
    let cleanUrl = url.trim();
    while (
      (cleanUrl.startsWith('"') && cleanUrl.endsWith('"')) ||
      (cleanUrl.toLowerCase().startsWith('%22') && cleanUrl.toLowerCase().endsWith('%22'))
    ) {
      if (cleanUrl.startsWith('"') && cleanUrl.endsWith('"')) {
        cleanUrl = cleanUrl.substring(1, cleanUrl.length - 1);
      } else {
        cleanUrl = cleanUrl.substring(3, cleanUrl.length - 3);
      }
      cleanUrl = cleanUrl.trim();
    }
    let targetUrl = cleanUrl;
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      const deptName = department || 'Physiology';
      targetUrl = `https://myportal.srms.ac.in/SRMSERP/Faculty/ChatsFile?pathname=${encodeURIComponent(cleanUrl)}&department=${encodeURIComponent(deptName)}`;
    }
    try {
      const supported = await Linking.canOpenURL(targetUrl);
      if (supported) {
        await Linking.openURL(targetUrl);
      } else {
        Alert.alert('Cannot Open URL', 'No app is available to open this link: ' + targetUrl);
      }
    } catch (err) {
      console.warn('[Chat] Failed to open attachment URL:', err);
      Alert.alert('Error', 'Failed to open the attachment.');
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Permission to access gallery is required to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setSelectedAttachment({
          uri: asset.uri,
          name: asset.fileName || asset.uri.split('/').pop() || 'image.jpg',
          type: 'image'
        });
      }
    } catch (err) {
      console.warn('[ChatScreen] pickImage error:', err);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setSelectedAttachment({
          uri: asset.uri,
          name: asset.name || 'document.pdf',
          type: 'document'
        });
      }
    } catch (err) {
      console.warn('[ChatScreen] pickDocument error:', err);
    }
  };

  const handleSelectAttachment = () => {
    Alert.alert(
      'Attach File',
      'Choose an option:',
      [
        { text: 'Image from Gallery', onPress: pickImage },
        { text: 'PDF Document', onPress: pickDocument },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const textVal = inputText.trim();
    if (activeChannel?.id === 'official-batch-chat') {
      if (!textVal && !selectedAttachment) return;
    } else {
      if (!textVal) return;
    }
    if (!activeChannel?.id) return;

    if (activeChannel.id === 'official-batch-chat') {
      setSendingPortalMessage(true);
      try {
        let attachmentUrl = '';
        if (selectedAttachment) {
          if (selectedAttachment.type === 'image') {
            const res = await uploadAvatarAPI(accessToken || '', selectedAttachment.uri);
            if (res.ok && res.json?.data?.avatar_url) {
              attachmentUrl = res.json.data.avatar_url;
            } else {
              throw new Error(res.json?.message || 'Failed to upload image to server.');
            }
          } else if (selectedAttachment.type === 'document') {
            const res = await uploadDocumentAPI(accessToken || '', selectedAttachment.uri, selectedAttachment.name);
            if (res.ok && res.json?.data?.document_url) {
              attachmentUrl = res.json.data.document_url;
            } else {
              throw new Error(res.json?.message || 'Failed to upload document to server.');
            }
          }
        }

        const batchYear = isSuperAdmin ? selectedBatch : (user?.batch_year || user?.batch || '2025');
        const colgcd = user?.emp_id ? (user.emp_id.split('/')[1] || '11') : '11';
        const isFaculty = user?.role === 'teacher';

        const formatCrtDt = (date) => {
          const pad = (n) => String(n).padStart(2, '0');
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        };

        let calculatedCbme = '2024';
        try {
          const bNum = parseInt(batchYear);
          if (!isNaN(bNum)) {
            if (bNum === 2023) {
              calculatedCbme = '2024';
            } else {
              calculatedCbme = String(bNum - 1);
            }
          }
        } catch {}

        let targetPhase = '1';
        let targetSubphase = '1';
        const bStr = String(batchYear || '').trim();
        if (bStr.includes('2023')) {
          targetPhase = '3';
          targetSubphase = '1';
        } else if (bStr.includes('2024')) {
          targetPhase = '2';
          targetSubphase = '2';
        } else if (bStr.includes('2022')) {
          targetPhase = '3';
          targetSubphase = '2';
        }

        const payload = {
          chatid: 0,
          ChatFacId: activePortalSubject.facultyId,
          FacultyName: activePortalSubject.facultyName,
          ChatStudId: String(batchYear),
          StudentName: isFaculty ? String(batchYear) : (user?.name || user?.id || 'Student'),
          Chat_Desc: textVal || `Shared an attachment: ${selectedAttachment?.name || 'File'}`,
          classlabel: isFaculty ? 'left' : 'right',
          Crt_dt: formatCrtDt(new Date()),
          colgcd: colgcd,
          course_cd: '1',
          coursecd: '1',
          cbme: String(calculatedCbme),
          cbmey: String(calculatedCbme),
          batch: String(batchYear),
          phase: targetPhase,
          sub_phase: targetSubphase,
          subphase: targetSubphase,
          sub_phase_part: targetSubphase,
          department: activePortalSubject.department,
          attachfile: attachmentUrl,
          subcode: activePortalSubject.subcode,
          msgflg: 0,
          ctype: 'GROUP'
        };

        const res = await sendPortalChatMessage(payload);
        if (res && res.Mess === 'Success') {
          setInputText('');
          setSelectedAttachment(null);
          loadPortalMessages();
        } else {
          Alert.alert('Send Failed', res?.Mess || 'An error occurred while sending message to portal.');
        }
      } catch (err) {
        Alert.alert('Send Failed', err.message || 'Failed to send message.');
      } finally {
        setSendingPortalMessage(false);
      }
      return;
    }

    sendChannelMessage(activeChannel.id, textVal, {
      id: user?.id,
      name: user?.name,
      username: user?.username,
      avatar_url: user?.avatar_url,
    });
    setInputText('');
  }, [inputText, activeChannel, sendChannelMessage, user, activePortalSubject, loadPortalMessages, selectedBatch, isSuperAdmin, selectedAttachment, accessToken]);

  // Current channel messages from socket or REST
  const messages = activeChannel?.id === 'official-batch-chat'
    ? portalMessages
    : (activeChannel?.id ? channelMessages[activeChannel.id] : []) || [];

  const socialDMs = dmContacts.filter(dm => !dm.is_marketplace);
  const marketplaceDMs = dmContacts.filter(dm => dm.is_marketplace);

  // Scroll to latest when messages update
  useEffect(() => {
    if (messages.length > 0) {
      const scroll = () => flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      scroll();
      const t = setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 150);
      return () => clearTimeout(t);
    }
  }, [messages.length]);

  const renderMessage = ({ item }) => {
    let isMe, senderName, messageText, timeText, avatarSource;

    if (activeChannel?.id === 'official-batch-chat') {
      isMe = item.isMe;
      senderName = item.sender || 'Portal User';
      messageText = item.text || '';
      timeText = item.timestamp || '';
      avatarSource = { uri: getAvatarUrl(item.ChatFacId || item.StudentName || 'u') };
    } else {
      isMe = item.user?._id === user?.user_id ||
        item.user?._id === user?.id ||
        item.user?.user_id === user?.user_id ||
        item.user?.user_id === user?.id;
      senderName = item.user?.name || 'Student';
      messageText = item.text || '';
      timeText = item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      avatarSource = { uri: getAvatarUrl(item.user?.avatar || item.user?._id || 'u') };
    }

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isMe && (
          <Image
            source={avatarSource}
            style={styles.msgAvatar}
          />
        )}
        <View style={[
          styles.bubble,
          isMe
            ? [styles.bubbleRight, { backgroundColor: colors.primary }]
            : [styles.bubbleLeft, { backgroundColor: isDark ? colors.card : '#F3F4F6' }]
        ]}>
          {isMe && activeChannel?.id === 'official-batch-chat' && (
            <Text style={[styles.bubbleSender, { color: '#FFFFFF', opacity: 0.85, fontSize: 11, fontWeight: '700', marginBottom: 2 }]}>
              You {user?.role === 'teacher' || user?.role === 'super_admin' ? '[F]' : '[S]'}
            </Text>
          )}
          {!isMe && (
            <Text style={[styles.bubbleSender, { color: colors.primary }]}>
              {senderName}{activeChannel?.id === 'official-batch-chat' ? (item.classlabel === 'left' ? ' [F]' : ' [S]') : ''} {activeChannel?.id === 'official-batch-chat' && item.department ? `(${item.department})` : ''}
            </Text>
          )}
          <Text style={[styles.bubbleText, { color: isMe ? '#FFFFFF' : colors.textPrimary }]}>{messageText}</Text>
          {item.attachment ? (
            <TouchableOpacity
              style={styles.attachmentButton}
              activeOpacity={0.8}
              onPress={() => handleAttachmentPress(item.attachment, item.department)}
            >
              <Ionicons name="document-attach-outline" size={16} color={isMe ? '#FFF' : colors.primary} />
              <Text style={{ color: isMe ? '#FFF' : colors.primary, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
                {item.attachment.split('/').pop() || 'Attachment'}
              </Text>
            </TouchableOpacity>
          ) : null}
          <Text style={[styles.bubbleTime, { color: isMe ? 'rgba(255,255,255,0.6)' : colors.textSecondary }]}>
            {timeText}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={{ paddingTop: insets.top, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              onPress={() => {
                if (isDrawerOpen) {
                  navigation.goBack();
                } else {
                  toggleDrawer();
                }
              }} 
              style={{ marginRight: 6 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuBtn} onPress={toggleDrawer}>
              <Ionicons name="menu" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerLogo, { color: colors.textPrimary }]}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} Channels</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.connDot, { backgroundColor: connected ? '#10B981' : '#EF4444' }]} />
            <TouchableOpacity onPress={() => navigation.navigate('StudentSearch')}>
              <Ionicons name="search" size={24} color={colors.textMuted || "#6B7280"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Channel Bar */}
        <View style={[styles.activeChannelBar, { backgroundColor: isDark ? colors.background : '#FAFAFA', borderBottomColor: colors.border }]}>
          <MaterialCommunityIcons name={activeChannel?.icon || 'lightning-bolt'} size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.activeChannelName, { color: colors.textPrimary }]}>{activeChannel?.name || 'Campus Pulse'}</Text>
            <Text style={styles.activeChannelDesc} numberOfLines={1}>{activeChannel?.desc || ''}</Text>
          </View>
          <Text style={{ fontSize: 12, color: onlineUsers.length > 0 ? '#10B981' : (colors.textMuted || '#9CA3AF'), fontWeight: '700' }}>
            {onlineUsers.length} online
          </Text>
        </View>

        {activeChannel?.id === 'official-batch-chat' && (
          <View style={[styles.dropdownContainer, { borderBottomColor: colors.border, backgroundColor: isDark ? colors.card : '#F8FAFC' }]}>
            <Text style={[styles.dropdownLabel, { color: colors.textSecondary }]}>Subject Chat Filter:</Text>
            <TouchableOpacity
              onPress={() => setShowSubjectDropdown(true)}
              style={[styles.dropdownButton, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF', borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              {(() => {
                const batchYear = isSuperAdmin ? selectedBatch : (user?.batch_year || user?.batch || '2025');
                const batchYearStr = String(batchYear).trim();
                const isBCBatch = ['2024', '2025', '2026'].includes(batchYearStr);
                const displayName = activePortalSubject?.department === 'BIOCHEMISTRY'
                  ? (isBCBatch ? 'Biochemistry_(CBME 2024)' : 'Biochemistry_(CBME 2019)')
                  : activePortalSubject?.name;
                const displaySubcode = activePortalSubject?.department === 'BIOCHEMISTRY'
                  ? (isBCBatch ? 'BC' : 'BI')
                  : activePortalSubject?.subcode;
                
                return (
                  <Text style={[styles.dropdownButtonText, { color: colors.textPrimary }]}>
                    {displayName || 'Select Subject'} ({displaySubcode})
                  </Text>
                );
              })()}
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {activeChannel?.id === 'official-batch-chat' && isSuperAdmin && (
          <View style={[styles.batchSelector, { borderBottomColor: colors.border, backgroundColor: isDark ? colors.card : '#FAFAFA' }]}>
            <Text style={[styles.batchTitle, { color: colors.textSecondary }]}>Batch:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectScrollContent}>
              {['2022', '2023', '2024', '2025', '2026'].map((b) => {
                const isSel = selectedBatch === b;
                return (
                  <TouchableOpacity
                    key={b}
                    style={[
                      styles.subjectPill,
                      {
                        backgroundColor: isSel ? colors.primary : (isDark ? '#1F2937' : '#FFFFFF'),
                        borderColor: isSel ? colors.primary : colors.border
                      }
                    ]}
                    onPress={() => setSelectedBatch(b)}
                  >
                    <Text style={[styles.subjectPillText, { color: isSel ? '#FFFFFF' : colors.textPrimary }]}>
                      {b}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Messages */}
      {activeChannel?.id === 'official-batch-chat' && loadingPortal && portalMessages.length === 0 ? (
        <ChatSkeletonLoader isDark={isDark} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => (item.id || item._id || Math.random()).toString()}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={{ padding: 12 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <MaterialCommunityIcons name="chat-outline" size={48} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>No messages yet. Say hi! 👋</Text>
            </View>
          }
        />
      )}

      {/* Selected Attachment preview bar */}
      {selectedAttachment && (
        <View style={[styles.attachmentPreviewBar, { backgroundColor: isDark ? 'rgba(234,88,12,0.1)' : '#FFF7ED', borderTopColor: colors.border }]}>
          <Ionicons
            name={selectedAttachment.type === 'image' ? 'image-outline' : 'document-text-outline'}
            size={18}
            color={colors.primary}
          />
          <Text style={[styles.attachmentPreviewText, { color: colors.primary }]} numberOfLines={1}>
            {selectedAttachment.name}
          </Text>
          <TouchableOpacity onPress={() => setSelectedAttachment(null)} style={styles.attachmentClearBtn}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Bar */}
      <View style={[
        styles.inputBar,
        { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) }
      ]}>


        <TextInput
          style={[
            styles.textInput,
            { backgroundColor: isDark ? colors.background : '#F3F4F6', color: colors.textPrimary }
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={activeChannel?.id === 'official-batch-chat' ? `Message ${activePortalSubject.facultyName.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}...` : `Message #${activeChannel?.slug || 'campus-pulse'}`}
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={1000}
          returnKeyType="default"
          blurOnSubmit={false}
          autoCorrect={true}
          autoCapitalize="sentences"
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: ((inputText.trim() || selectedAttachment) && !sendingPortalMessage) ? colors.primary : (isDark ? '#374151' : '#E5E7EB') }]}
          onPress={handleSend}
          disabled={(!inputText.trim() && !selectedAttachment) || sendingPortalMessage}
          activeOpacity={0.8}
        >
          {sendingPortalMessage ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialIcons name="send" size={20} color={(inputText.trim() || selectedAttachment) ? '#FFFFFF' : (isDark ? '#6B7280' : '#9CA3AF')} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Backdrop Overlay ── */}
      {isDrawerOpen && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={{ flex: 1 }} onPress={toggleDrawer} />
        </Animated.View>
      )}

      {/* ── Side Drawer ── */}
      <Animated.View
        pointerEvents={isDrawerOpen ? 'auto' : 'none'}
        style={[styles.drawer, { transform: [{ translateX: drawerTranslateX }], backgroundColor: colors.card }]}>
        <View style={[styles.drawerHeader, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
          <LinearGradient colors={isDark ? [colors.primary, '#6D28D9'] : ['#EA580C', '#9A3412']} style={styles.drawerLogoIcon}>
            <MaterialCommunityIcons name="school" size={24} color="#FFFFFF" />
          </LinearGradient>
          <View>
            <Text style={[styles.drawerBrand, { color: colors.textPrimary }]}>{APP_CONFIG.UNIVERSITY_SHORT_NAME}</Text>
            <Text style={styles.drawerSubBrand}>Community Hub</Text>
          </View>
        </View>

        <Animated.ScrollView style={styles.drawerList} showsVerticalScrollIndicator={false}>
          {/* AI Section */}
          <Text style={styles.drawerSectionTitle}>AI ASSISTANT</Text>
          <TouchableOpacity
            style={[styles.channelItem, { backgroundColor: isDark ? 'rgba(234,88,12,0.1)' : '#FFF7ED', borderColor: colors.primary, borderWidth: 1 }]}
            onPress={() => { toggleDrawer(); navigation.navigate('CampusAIWelcome'); }}
          >
            <MaterialIcons name="smart-toy" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.channelItemText, { color: colors.primary }]}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} AI Assistant</Text>
              <Text style={styles.channelItemDesc}>Ask me anything 🤖</Text>
            </View>
            <View style={[styles.newBadge, { backgroundColor: colors.primary }]}><Text style={styles.newBadgeText}>AI</Text></View>
          </TouchableOpacity>

          <View style={[styles.drawerDivider, { backgroundColor: colors.border }]} />

          {/* Channels */}
          <Text style={styles.drawerSectionTitle}>CHANNELS</Text>
          {channels.map((channel) => {
            const isActive = activeChannel?.slug === channel.slug || activeChannel?.id === channel.id;
            return (
              <TouchableOpacity
                key={channel.id || channel.slug}
                style={[styles.channelItem, isActive && { backgroundColor: isDark ? 'rgba(234,88,12,0.1)' : '#FFF7ED' }]}
                onPress={() => { setActiveChannel(channel); toggleDrawer(); }}
              >
                <MaterialCommunityIcons
                  name={channel.icon || 'hashtag'}
                  size={20}
                  color={isActive ? colors.primary : colors.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.channelItemText, { color: isActive ? colors.primary : colors.textSecondary }]}>
                    {channel.name}
                  </Text>
                  <Text style={styles.channelItemDesc} numberOfLines={1}>{channel.desc || channel.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={[styles.drawerDivider, { backgroundColor: colors.border }]} />

          {/* Direct Messages */}
          <Text style={styles.drawerSectionTitle}>DIRECT MESSAGES</Text>
          {loadingDMs ? (
            <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : socialDMs.length === 0 ? (
            <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 8 }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                No connections yet. Connect with students on the Social tab to start DMing.
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  // Retry loading DM contacts
                  setLoadingDMs(true);
                  try {
                    const dms = await getDMContactsAPI(accessToken);
                    if (Array.isArray(dms)) {
                      setDmContacts(dms.map(dm => ({ ...dm, username: dm.full_name || dm.username })));
                    }
                  } catch (e) {
                    console.warn('[ChatScreen] DM refresh error', e);
                  } finally {
                    setLoadingDMs(false);
                  }
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: colors.primary + '18', alignSelf: 'flex-start' }}
              >
                <Ionicons name="refresh-outline" size={14} color={colors.primary} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>Refresh Connections</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {socialDMs.map((dm) => {
            const isOnline = onlineUsers.includes(dm.user_id);
            return (
              <TouchableOpacity
                key={dm.user_id}
                style={styles.dmItem}
                onPress={() => {
                  toggleDrawer();
                  navigation.navigate('DMConversation', { contact: dm, source: 'social' });
                }}
              >
                <View style={styles.dmAvatarWrap}>
                  <Image source={{ uri: getAvatarUrl(dm.avatar_url || dm.user_id) }} style={styles.dmAvatar} />
                  <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#D1D5DB' }]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dmName, { color: colors.textPrimary }]}>{dm.username || 'Student'}</Text>
                  {dm.last_message && (
                    <Text style={styles.dmLastMsg} numberOfLines={1}>{dm.last_message}</Text>
                  )}
                </View>
                <Text style={{ fontSize: 10, color: isOnline ? '#10B981' : '#9CA3AF', fontWeight: '700' }}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={[styles.drawerDivider, { backgroundColor: colors.border }]} />

          {/* Marketplace Messages */}
          <Text style={styles.drawerSectionTitle}>MARKETPLACE MESSAGES</Text>
          {marketplaceDMs.length === 0 && (
            <Text style={{ fontSize: 13, color: '#9CA3AF', paddingHorizontal: 12, paddingBottom: 8 }}>
              No marketplace messages yet 🛒
            </Text>
          )}
          {marketplaceDMs.map((dm) => {
            const isOnline = onlineUsers.includes(dm.user_id);
            return (
              <TouchableOpacity
                key={dm.user_id}
                style={styles.dmItem}
                onPress={() => {
                  toggleDrawer();
                  navigation.navigate('DMConversation', { contact: dm, source: 'marketplace' });
                }}
              >
                <View style={styles.dmAvatarWrap}>
                  <Image source={{ uri: getAvatarUrl(dm.avatar_url || dm.user_id) }} style={styles.dmAvatar} />
                  <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#D1D5DB' }]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dmName, { color: colors.textPrimary }]}>{dm.username || 'Student'}</Text>
                  {dm.last_message && (
                    <Text style={styles.dmLastMsg} numberOfLines={1}>{dm.last_message}</Text>
                  )}
                </View>
                <Text style={{ fontSize: 10, color: isOnline ? '#10B981' : '#9CA3AF', fontWeight: '700' }}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.ScrollView>

        <View style={[styles.drawerFooter, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.footerAction} onPress={() => { toggleDrawer(); navigation.navigate('Settings'); }}>
            <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerAction} onPress={() => { toggleDrawer(); navigation.navigate('Notifications'); }}>
            <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>Notifications</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Subject Selector Dropdown Modal */}
      <Modal
        visible={showSubjectDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSubjectDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSubjectDropdown(false)}
        >
          <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.dropdownMenuTitle, { color: colors.textPrimary }]}>Choose Subject</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {portalSubjects.map((sub) => {
                const batchYear = isSuperAdmin ? selectedBatch : (user?.batch_year || user?.batch || '2025');
                const batchYearStr = String(batchYear).trim();
                const isBCBatch = ['2024', '2025', '2026'].includes(batchYearStr);
                
                const resolvedName = sub.department === 'BIOCHEMISTRY'
                  ? (isBCBatch ? 'Biochemistry_(CBME 2024)' : 'Biochemistry_(CBME 2019)')
                  : sub.name;
                const resolvedSubcode = sub.department === 'BIOCHEMISTRY'
                  ? (isBCBatch ? 'BC' : 'BI')
                  : sub.subcode;
                
                const isSel = activePortalSubject?.id === sub.id;

                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[
                      styles.dropdownItem,
                      isSel && { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#FFF7ED' }
                    ]}
                    onPress={() => {
                      setActivePortalSubject({ ...sub, name: resolvedName, subcode: resolvedSubcode });
                      setShowSubjectDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      { color: isSel ? colors.primary : colors.textPrimary, fontWeight: isSel ? '700' : '400' }
                    ]}>
                      {resolvedName} ({resolvedSubcode})
                    </Text>
                    {isSel && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuBtn: { padding: 4 },
  headerLogo: { fontSize: 18, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  connDot: { width: 8, height: 8, borderRadius: 4 },
  activeChannelBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#FAFAFA', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  activeChannelName: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  activeChannelDesc: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginTop: 1 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 15,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Messages
  msgRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
    maxWidth: '82%',
  },
  msgRowLeft: { alignSelf: 'flex-start' },
  msgRowRight: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 6 },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '100%',
  },
  bubbleLeft: { borderTopLeftRadius: 4 },
  bubbleRight: { borderTopRightRadius: 4 },
  bubbleSender: { fontSize: 11, fontWeight: '700', marginBottom: 3 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  overlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99,
  },
  drawer: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: DRAWER_WIDTH, backgroundColor: '#FFFFFF',
    zIndex: 100, shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 12,
  },
  drawerHeader: {
    paddingHorizontal: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  drawerLogoIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  drawerBrand: { fontSize: 20, fontWeight: '900', color: '#111827' },
  drawerSubBrand: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  drawerList: { flex: 1, padding: 16 },
  drawerSectionTitle: {
    fontSize: 10, fontWeight: '900', color: '#9CA3AF',
    letterSpacing: 1.5, marginBottom: 12, marginTop: 8,
  },
  channelItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 12, marginBottom: 4, gap: 12,
  },
  channelItemActive: { backgroundColor: '#FFF7ED' },
  channelItemText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  channelItemTextActive: { color: '#EA580C' },
  channelItemDesc: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginTop: 2 },
  drawerDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  dmItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 8, gap: 12, marginBottom: 4,
  },
  dmAvatarWrap: { position: 'relative' },
  dmAvatar: { width: 40, height: 40, borderRadius: 20 },
  statusDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6,
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  dmName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  dmLastMsg: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginTop: 2 },
  drawerFooter: {
    padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6',
    flexDirection: 'row', justifyContent: 'space-around',
  },
  footerAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  newBadge: { backgroundColor: '#EA580C', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  newBadgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  subjectSelector: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  batchSelector: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  batchTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 12,
  },
  subjectScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: 'row',
  },
  subjectPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  subjectPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  attachmentPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  attachmentPreviewText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  attachmentClearBtn: {
    padding: 2,
  },
  attachTriggerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 180,
  },
  dropdownButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    width: '80%',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  dropdownMenuTitle: {
    fontSize: 14,
    fontWeight: '900',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    marginBottom: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemText: {
    fontSize: 14,
  },
});

export default ChatScreen;
