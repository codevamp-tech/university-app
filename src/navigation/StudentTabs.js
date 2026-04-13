import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

// Student Screens
import DashboardScreen from '../screens/student/DashboardScreen';
import CommunityScreen from '../screens/student/CommunityScreen';
import TalentIdentityScreen from '../screens/student/TalentIdentityScreen';
import VentureScreen from '../screens/student/VentureScreen';
import MarketplaceScreen from '../screens/student/MarketplaceScreen';
import ProfileScreen from '../screens/student/ProfileScreen';

const Tab = createBottomTabNavigator();

const StudentTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false, // Rendering label inside icon logic for full control
        tabBarActiveTintColor: '#de8324',
        tabBarInactiveTintColor: '#4B5563',
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: { flex: 1 },
        tabBarBackground: () => (
          <View style={styles.tabBackground} />
        ),
        tabBarIcon: ({ focused, color }) => {
          let IconLibrary = Feather;
          let iconName;
          let label;

          // Wire up the correct icon and label for each route
          if (route.name === 'Discover') {
            IconLibrary = Feather;
            iconName = 'home';
            label = 'HOME';
          } else if (route.name === 'Community') {
            IconLibrary = Feather;
            iconName = 'users';
            label = 'COMMUNITY';
          } else if (route.name === 'Identity') {
            IconLibrary = MaterialCommunityIcons;
            iconName = 'card-account-details-outline';
            label = 'IDENTITY';
          } else if (route.name === 'Venture') {
            IconLibrary = MaterialCommunityIcons;
            iconName = 'rocket-outline';
            label = 'VENTURE';
          } else if (route.name === 'Marketplace') {
            IconLibrary = MaterialCommunityIcons;
            iconName = 'storefront-outline';
            label = 'MARKETPLACE';
          } else if (route.name === 'Profile') {
            IconLibrary = Feather;
            iconName = 'user';
            label = 'PROFILE';
          }

          return (
            <View style={styles.tabButtonWrapper}>
              {/* Top Orange Indicator Line */}
              {focused && <View style={styles.topIndicator} />}

              <View style={styles.tabInner}>
                <View style={styles.iconContainer}>
                  <IconLibrary name={iconName} size={26} color={color} />
                </View>
                <Text 
                  style={[styles.tabLabel, focused && styles.tabLabelActive]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
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
      <Tab.Screen name="Identity" component={TalentIdentityScreen} />
      <Tab.Screen name="Venture" component={VentureScreen} />
      <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 85 : 65,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
  },
  tabBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tabButtonWrapper: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  topIndicator: {
    position: 'absolute',
    top: 0,
    width: '80%',
    height: 3,
    backgroundColor: '#de8324',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    gap: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#4B5563', // Inactive color
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#de8324', // Active color
    fontWeight: '800',
  },
});

export default StudentTabs;