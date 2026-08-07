import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useUser } from '../context/UserContext';

// Teacher Screens
import TeacherDashboardScreen from '../screens/teacher/TeacherDashboardScreen';
import CourseManagementScreen from '../screens/teacher/CourseManagementScreen';
import TeacherAttendanceScreen from '../screens/teacher/TeacherAttendanceScreen';
import TeacherProfileScreen from '../screens/teacher/TeacherProfileScreen';
import HODDashboardScreen from '../screens/teacher/HODDashboardScreen';

const Tab = createBottomTabNavigator();

const TeacherTabs = () => {
  const { isHOD } = useUser();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F5EEFC',
          paddingTop: 6,
          paddingBottom: 6,
          height: 62,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Schedule: focused ? 'calendar' : 'calendar-outline',
            Attendance: focused ? 'finger-print' : 'finger-print-outline',
            Profile: focused ? 'person' : 'person-outline',
            'My Dept': focused ? 'business' : 'business-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={TeacherDashboardScreen} />
      <Tab.Screen name="Schedule" component={CourseManagementScreen} />
      <Tab.Screen name="Attendance" component={TeacherAttendanceScreen} />
      {/* HOD-only tab: My Department — only visible when faculty has is_hod=true */}
      {isHOD && (
        <Tab.Screen
          name="My Dept"
          component={HODDashboardScreen}
          options={{
            tabBarBadge: undefined,
          }}
        />
      )}
      <Tab.Screen name="Profile" component={TeacherProfileScreen} />
    </Tab.Navigator>
  );
};

export default TeacherTabs;
