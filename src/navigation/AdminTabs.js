import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useUser } from '../context/UserContext';

// Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import WardenOutpassesScreen from '../screens/admin/WardenOutpassesScreen';
import AdminVentureReviewScreen from '../screens/admin/AdminVentureReviewScreen';
import AdminGrievanceInboxScreen from '../screens/admin/AdminGrievanceInboxScreen';
import SettingsScreen from '../screens/student/SettingsScreen';

// Superadmin Dedicated Strategic Insights Screens
import SuperAdminVentureInsightsScreen from '../screens/admin/SuperAdminVentureInsightsScreen';
import SuperAdminLeaderboardInsightsScreen from '../screens/admin/SuperAdminLeaderboardInsightsScreen';
import SuperAdminFacultyInsightsScreen from '../screens/admin/SuperAdminFacultyInsightsScreen';

const Tab = createBottomTabNavigator();

const AdminTabs = () => {
  const { colors } = useTheme();
  const { user } = useUser();
  const role = user?.role || 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [styles.tabBar, {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          shadowColor: '#000000',
        }],
        tabBarItemStyle: styles.tabBarItem,

        tabBarIcon: ({ focused, color }) => {
          let IconLibrary = Feather;
          let iconName;
          let label;

          if (route.name === 'AdminDashboard') {
            iconName = 'grid';
            label = 'Dashboard';
          } else if (route.name === 'OutpassManager') {
            IconLibrary = MaterialCommunityIcons;
            iconName = 'door-open';
            label = 'Outpasses';
          } else if (route.name === 'VentureManager') {
            IconLibrary = MaterialCommunityIcons;
            iconName = 'rocket-launch-outline';
            label = 'Pitches';
          } else if (route.name === 'GrievanceManager') {
            IconLibrary = MaterialCommunityIcons;
            iconName = 'alert-octagon-outline';
            label = 'Support';
          } else if (route.name === 'VentureInsights') {
            IconLibrary = MaterialCommunityIcons;
            iconName = 'rocket-launch';
            label = 'Ventures';
          } else if (route.name === 'LeaderboardInsights') {
            IconLibrary = MaterialCommunityIcons;
            iconName = 'trophy';
            label = 'The Hustle';
          } else if (route.name === 'FacultyInsights') {
            iconName = 'book-open';
            label = 'Faculty';
          } else if (route.name === 'AdminSettings') {
            iconName = 'settings';
            label = 'Settings';
          }

          return (
            <View style={styles.tabButtonWrapper}>
              {focused && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
              <View style={styles.tabInner}>
                <IconLibrary
                  name={iconName}
                  size={20}
                  color={color}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: focused ? colors.primary : colors.textMuted },
                    focused && styles.tabLabelActive
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumScaleFactor={0.7}
                >
                  {label}
                </Text>
              </View>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      
      {/* Conditionally render operational tabs based on role */}
      {role === 'warden' && (
        <Tab.Screen name="OutpassManager" component={WardenOutpassesScreen} />
      )}
      
      {role === 'admin' && (
        <Tab.Screen name="VentureManager" component={AdminVentureReviewScreen} />
      )}
      
      {role === 'admin' && (
        <Tab.Screen name="GrievanceManager" component={AdminGrievanceInboxScreen} />
      )}

      {/* Conditionally render superadmin strategic tabs */}
      {role === 'super_admin' && (
        <Tab.Screen name="VentureInsights" component={SuperAdminVentureInsightsScreen} />
      )}

      {role === 'super_admin' && (
        <Tab.Screen name="LeaderboardInsights" component={SuperAdminLeaderboardInsightsScreen} />
      )}

      {role === 'super_admin' && (
        <Tab.Screen name="FacultyInsights" component={SuperAdminFacultyInsightsScreen} />
      )}
      
      <Tab.Screen name="AdminSettings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 74 : 64,
    borderTopWidth: 1,
    elevation: 8,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    paddingBottom: Platform.OS === 'ios' ? 14 : 0,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  tabButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  activeIndicator: {
    position: 'absolute',
    top: -4,
    width: 24,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginTop: 4,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});

export default AdminTabs;
