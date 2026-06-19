import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../context/UserContext';
import { searchUsersAPI, followUserAPI } from '../../data/apiService';
import { getAvatarUrl } from '../../utils/avatar';
import { useTheme } from '../../hooks/useTheme';

const StudentSearchScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { accessToken } = useUser();
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setLoading(true);
        try {
          const results = await searchUsersAPI(accessToken, searchQuery);
          setUsers(results);
        } catch(e) {
          console.warn("Search error:", e);
        } finally {
          setLoading(false);
        }
      } else {
        setUsers([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, accessToken]);

  const handleFollow = async (userId) => {
    try {
      const res = await followUserAPI(accessToken, userId);
      if (res) {
        Alert.alert("Success", "Follow request sent!");
      }
    } catch (error) {
      console.warn("Follow error:", error);
      Alert.alert("Error", "Failed to send follow request.");
    }
  };

  const handleProfileClick = async (item) => {
    try {
      // Mark profile as viewed and store viewed by (local simulation)
      let viewsData = await AsyncStorage.getItem('@unicampus_profile_views');
      let views = viewsData ? JSON.parse(viewsData) : [];
      views.unshift({
        viewer_id: user?.id || 'current_user',
        viewer_name: user?.name || 'You',
        viewed_profile_id: item.id,
        timestamp: new Date().toISOString()
      });
      await AsyncStorage.setItem('@unicampus_profile_views', JSON.stringify(views.slice(0, 50)));
    } catch(e) {
      console.warn("Error saving profile view", e);
    }
    
    // Navigate with full student data
    navigation.navigate('OtherStudentProfile', { student: item });
  };

  const renderStudent = ({ item }) => (
    <TouchableOpacity 
      style={[styles.studentCard, { backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1 }]}
      onPress={() => handleProfileClick(item)}
    >
      <View style={styles.avatarPlaceholder}>
        <Image source={{ uri: item.avatar_url || getAvatarUrl(item.username) }} style={{ width: 50, height: 50, borderRadius: 25 }} />
      </View>
      <View style={styles.studentInfo}>
        <Text style={[styles.studentName, { color: colors.textPrimary, fontSize: 16 }]}>{item.username}</Text>
        <Text style={[styles.studentCourse, { color: colors.textSecondary, fontSize: 13, marginTop: 2 }]}>
          {item.course || 'Student'} {item.branch ? `• ${item.branch}` : ''}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
          {item.year ? `Year ${item.year} ` : ''}• {item.followers || 0} followers
        </Text>
      </View>
      <TouchableOpacity 
        style={{ backgroundColor: isDark ? colors.background : '#F3F4F6', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}
        onPress={() => handleFollow(item.id)}
      >
        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>Connect</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Network Search</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? colors.card : '#F3F4F6' }]}>
          <Ionicons name="search" size={20} color={colors.textMuted || "#6B7280"} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search students by name or roll no..."
            placeholderTextColor={colors.textMuted || "#9CA3AF"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted || "#9CA3AF"} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderStudent}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={colors.textMuted || "#D1D5DB"} />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>{loading ? "Searching..." : searchQuery.length < 2 ? "Type to search..." : "No students found"}</Text>
          </View>
        }
      />
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b4b0020',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8b4b00',
  },
  studentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  studentCourse: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
});

export default StudentSearchScreen;
