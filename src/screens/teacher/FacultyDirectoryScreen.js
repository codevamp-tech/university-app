import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

const FACULTY = [
  {
    id: 1,
    name: 'Dr. Amitabh Sharma',
    role: 'Head of Department',
    dept: 'Computer Science',
    email: 'amitabh.s@invertis.org',
    image: 'https://api.aifaces.com/api/v1/face?seed=doctor',
  },
  {
    id: 2,
    name: 'Prof. Sneha Gupta',
    role: 'Associate Professor',
    dept: 'Artificial Intelligence',
    email: 'sneha.g@invertis.org',
    image: 'https://api.aifaces.com/api/v1/face?seed=professor',
  },
  {
    id: 3,
    name: 'Mr. Rajeev Verma',
    role: 'Senior Lecturer',
    dept: 'Software Engineering',
    email: 'rajeev.v@invertis.org',
    image: 'https://api.aifaces.com/api/v1/face?seed=rajeev',
  },
  {
    id: 4,
    name: 'Dr. Meera Iyer',
    role: 'Assistant Professor',
    dept: 'Data Science',
    email: 'meera.i@invertis.org',
    image: 'https://api.aifaces.com/api/v1/face?seed=meera',
  },
];

const FacultyDirectoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredFaculty = FACULTY.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.dept.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Faculty Directory</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder="Search by name or department..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultsCount}>{filteredFaculty.length} Colleagues found</Text>

        {filteredFaculty.map((person) => (
          <View key={person.id} style={styles.facultyCard}>
            <Image source={{ uri: person.image }} style={styles.avatar} />
            <View style={styles.info}>
              <Text style={styles.name}>{person.name}</Text>
              <Text style={styles.role}>{person.role}</Text>
              <View style={styles.deptBadge}>
                <Text style={styles.deptText}>{person.dept}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionCircle}>
                <Ionicons name="mail-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCircle, { marginTop: 10 }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  searchSection: {
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLight,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 20,
  },
  resultsCount: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  facultyCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 18,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  role: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  deptBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  deptText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actions: {
    alignItems: 'center',
  },
  actionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FacultyDirectoryScreen;
