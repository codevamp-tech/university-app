import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

// Teacher Screens
import TeacherDashboardScreen from '../screens/teacher/TeacherDashboardScreen';
import CourseManagementScreen from '../screens/teacher/CourseManagementScreen';
import DepartmentOverviewScreen from '../screens/teacher/DepartmentOverviewScreen';
import TeacherProfileScreen from '../screens/teacher/TeacherProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const AcademicStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CourseManagement" component={CourseManagementScreen} />
    <Stack.Screen name="DepartmentOverview" component={DepartmentOverviewScreen} />
  </Stack.Navigator>
);

const TeacherTabs = () => {
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
            Academic: focused ? 'school' : 'school-outline',
            Reports: focused ? 'bar-chart' : 'bar-chart-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={TeacherDashboardScreen} />
      <Tab.Screen name="Academic" component={AcademicStack} />
      <Tab.Screen name="Reports" component={DepartmentOverviewScreen} />
      <Tab.Screen name="Profile" component={TeacherProfileScreen} />
    </Tab.Navigator>
  );
};

export default TeacherTabs;
