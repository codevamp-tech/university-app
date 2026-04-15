import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

// Guest Screens
import ExploreScreen from '../screens/guest/ExploreScreen';
import HubScreen from '../screens/guest/HubScreen';
import GuestProfileScreen from '../screens/guest/GuestProfileScreen';

const Tab = createBottomTabNavigator();

const GuestTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#EA580C',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: { flex: 1 },
        tabBarIcon: ({ focused, color }) => {
          let IconLibrary = Feather;
          let iconName;
          let label;

          if (route.name === 'Explore') {
            IconLibrary = Feather;
            iconName = 'compass';
            label = 'Explore';
          } else if (route.name === 'Hub') {
            IconLibrary = MaterialCommunityIcons;
            iconName = 'bullseye-arrow';
            label = 'Hub';
          } else if (route.name === 'Profile') {
            IconLibrary = Feather;
            iconName = 'user';
            label = 'Profile';
          }

          return (
            <View style={styles.tabButtonWrapper}>
              {focused && <View style={styles.topIndicator} />}
              <View style={styles.tabInner}>
                <IconLibrary name={iconName} size={24} color={color} />
                <Text
                  style={[styles.tabLabel, focused && styles.tabLabelActive]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  allowFontScaling={false}
                >
                  {label}
                </Text>
              </View>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Hub" component={HubScreen} />
      <Tab.Screen name="Profile" component={GuestProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 85 : 70,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 8,
  },
  tabButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  topIndicator: {
    position: 'absolute',
    top: -8,
    width: 40,
    height: 4,
    backgroundColor: '#EA580C',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.3,
    marginTop: 6,
    textAlign: 'center',
    width: '100%',
    includeFontPadding: false,
  },
  tabLabelActive: {
    color: '#EA580C',
    fontWeight: '700',
  },
});

export default GuestTabs;