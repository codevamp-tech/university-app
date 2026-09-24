import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useUser } from '../context/UserContext';
import { isCsEligibleForPlacement } from '../utils/placementReadiness';

// Student Screens
import DashboardScreen from '../screens/student/DashboardScreen';
import CommunityScreen from '../screens/student/CommunityScreen';
import TalentIdentityScreen from '../screens/student/TalentIdentityScreen';
import VentureScreen from '../screens/student/VentureScreen';
import MarketplaceScreen from '../screens/student/MarketplaceScreen';
import AlertsScreen from '../screens/student/AlertsScreen';
import PlacementReadinessScreen from '../screens/student/PlacementReadinessScreen';

const Tab = createBottomTabNavigator();

const StudentTabs = () => {
  const { colors, isDark } = useTheme();
  const { user } = useUser();
  const isMed = user && (user.course?.toLowerCase().includes('mbbs') || user.course?.toLowerCase().includes('medicine') || user.category?.toLowerCase().includes('medical'));
  const isPlacementActive = isCsEligibleForPlacement(user);

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
          shadowColor: isDark ? '#000000' : '#000000',
        }],
        tabBarItemStyle: styles.tabBarItem,

        tabBarIcon: ({ focused, color }) => {
          let IconLibrary = Feather;
          let iconName;
          let label;

          if (route.name === 'Discover') {
            iconName = 'home';
            label = 'Home';
          } else if (route.name === 'Community') {
            iconName = 'users';
            label = 'Feed';
          } else if (route.name === 'Identity') {
            IconLibrary = MaterialCommunityIcons;
            iconName = 'card-account-details-outline';
            label = 'ID';
          } else if (route.name === 'Venture') {
            IconLibrary = MaterialCommunityIcons;
            iconName = isMed ? 'microscope' : 'rocket-outline';
            label = isMed ? 'Research' : 'Venture';
          } else if (route.name === 'Marketplace') {
            IconLibrary = MaterialCommunityIcons;
            iconName = 'storefront-outline';
            label = 'Shop';
          } else if (route.name === 'Placement') {
            IconLibrary = MaterialCommunityIcons;
            iconName = focused ? 'briefcase-check' : 'briefcase-check-outline';
            label = 'Placement';
          } else if (route.name === 'Alerts') {
            iconName = 'bell';
            label = 'Alerts';
          }

          return (
            <View style={styles.tabButtonWrapper}>
              {focused && <View style={[{ backgroundColor: colors.primary }]} />}
              <View style={styles.tabInner}>
                <IconLibrary
                  name={iconName}
                  size={24}
                  color={color}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: focused ? colors.primary : colors.textMuted },
                    focused && styles.tabLabelActive
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {label}
                </Text>
              </View>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Discover" component={DashboardScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Venture" component={VentureScreen} />
      <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
      {isPlacementActive ? (
        <Tab.Screen name="Placement" component={PlacementReadinessScreen} />
      ) : (
        <Tab.Screen name="Alerts" component={AlertsScreen} />
      )}
      <Tab.Screen name="Identity" component={TalentIdentityScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 70 : 70,
    borderTopWidth: 1,
    elevation: 8,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  tabButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
    minWidth: 44,
    maxWidth: 60,
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});

export default StudentTabs;
