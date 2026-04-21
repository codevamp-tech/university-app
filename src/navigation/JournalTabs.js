import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Text, Platform, Dimensions } from 'react-native';

// Screens
import CampusJournalFeedScreen from '../screens/student/journal/CampusJournalFeedScreen';
import CampusJournalReflectScreen from '../screens/student/journal/CampusJournalReflectScreen';
import CampusJournalExplorerScreen from '../screens/student/journal/CampusJournalExplorerScreen';
import CampusJournalInsightsScreen from '../screens/student/journal/CampusJournalInsightsScreen';

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

const JournalTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#EA580C',
        tabBarInactiveTintColor: '#94A3B8',
      }}
    >
      <Tab.Screen
        name="JournalFeed"
        component={CampusJournalFeedScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={focused ? "newspaper" : "newspaper-outline"}
              label="Journal"
            />
          ),
        }}
      />
      <Tab.Screen
        name="JournalReflect"
        component={CampusJournalReflectScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={focused ? "flash" : "flash-outline"}
              label="Reflect"
            />
          ),
        }}
      />
      <Tab.Screen
        name="JournalExplore"
        component={CampusJournalExplorerScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={focused ? "map" : "map-outline"}
              label="Explore"
            />
          ),
        }}
      />
      <Tab.Screen
        name="JournalInsights"
        component={CampusJournalInsightsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={focused ? "analytics" : "analytics-outline"}
              label="Insights"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const TabIcon = ({ focused, icon, label }) => {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
        <Ionicons name={icon} size={22} color={focused ? "#EA580C" : "#64748B"} />
      </View>
      <Text
        style={[styles.tabLabel, focused && styles.activeTabLabel]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 15 : 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    height: 64,
    borderTopWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    // Professional soft shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrapper: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginBottom: 4,
  },
  activeIconWrapper: {
    backgroundColor: 'rgba(234, 88, 12, 0.08)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  activeTabLabel: {
    color: '#EA580C',
    fontWeight: '800',
  },
});

export default JournalTabs;