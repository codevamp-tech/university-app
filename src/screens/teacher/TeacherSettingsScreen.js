import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

const TeacherSettingsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = React.useState(true);
  const [attendanceReminders, setAttendanceReminders] = React.useState(true);
  const [autoSave, setAutoSave] = React.useState(false);

  const SETTINGS_GROUPS = [
    {
      title: 'NOTIFICATIONS',
      items: [
        { 
          id: 'notif', 
          label: 'App Notifications', 
          type: 'switch', 
          value: notifications, 
          onValueChange: setNotifications,
          icon: 'notifications-outline' 
        },
        { 
          id: 'att', 
          label: 'Attendance Reminders', 
          type: 'switch', 
          value: attendanceReminders, 
          onValueChange: setAttendanceReminders,
          icon: 'time-outline' 
        },
      ]
    },
    {
      title: 'DATA MANAGEMENT',
      items: [
        { 
          id: 'autosave', 
          label: 'Auto-save Grading', 
          type: 'switch', 
          value: autoSave, 
          onValueChange: setAutoSave,
          icon: 'save-outline' 
        },
        { 
          id: 'clearcache', 
          label: 'Clear App Cache', 
          type: 'button',
          icon: 'trash-outline',
          onPress: () => Alert.alert('Clear Cache', 'Cache cleared successfully!') 
        },
      ]
    },
    {
      title: 'ACCOUNT',
      items: [
        { 
          id: 'pass', 
          label: 'Change Password', 
          type: 'link', 
          icon: 'lock-closed-outline' 
        },
        { 
          id: 'lang', 
          label: 'App Language', 
          type: 'link', 
          value: 'English', 
          icon: 'globe-outline' 
        },
      ]
    }
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {SETTINGS_GROUPS.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item, index) => (
                <View 
                  key={item.id} 
                  style={[
                    styles.item, 
                    index < group.items.length - 1 && styles.itemBorder
                  ]}
                >
                  <View style={styles.itemLeft}>
                    <View style={styles.iconContainer}>
                      <Ionicons name={item.icon} size={20} color={Colors.primary} />
                    </View>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                  </View>

                  {item.type === 'switch' ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onValueChange}
                      trackColor={{ false: '#E5E7EB', true: '#C4B5FD' }}
                      thumbColor={item.value ? Colors.primary : '#F3F4F6'}
                    />
                  ) : item.type === 'link' ? (
                    <View style={styles.itemRight}>
                      {item.value && <Text style={styles.itemValue}>{item.value}</Text>}
                      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                    </View>
                  ) : (
                    <TouchableOpacity onPress={item.onPress}>
                      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
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
  scrollContent: {
    padding: 20,
  },
  group: {
    marginBottom: 25,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1,
  },
  groupCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemValue: {
    fontSize: 14,
    color: Colors.textMuted,
    marginRight: 8,
  },
});

export default TeacherSettingsScreen;
