import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

// ERP Screens
import ERPHubScreen from '../screens/student/ERPHubScreen';
import ERPResultsScreen from '../screens/student/ERPResultsScreen';
import ERPFeesScreen from '../screens/student/ERPFeesScreen';
import ERPDocumentsScreen from '../screens/student/ERPDocumentsScreen';

const Tab = createBottomTabNavigator();

const ERPTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#EA580C',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: { flex: 1 },
        tabBarBackground: () => (
          <View style={styles.tabBackground} />
        ),
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          let label;

          if (route.name === 'ERPHome') {
            iconName = 'home';
            label = 'HOME';
          } else if (route.name === 'ERPResultsTab') {
            iconName = 'grade';
            label = 'RESULTS';
          } else if (route.name === 'ERPFeesTab') {
            iconName = 'payments';
            label = 'FEES';
          } else if (route.name === 'ERPDocumentsTab') {
            iconName = 'folder-shared';
            label = 'DOCUMENT';
          }

          return (
            <View style={styles.tabButtonWrapper}>
              {focused && <View style={styles.topIndicator} />}
              <View style={styles.tabInner}>
                <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                  <MaterialIcons name={iconName} size={24} color={color} />
                </View>
                <Text
                  style={[styles.tabLabel, focused && styles.tabLabelActive]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="ERPHome" component={ERPHubScreen} />
      <Tab.Screen name="ERPResultsTab" component={ERPResultsScreen} />
      <Tab.Screen name="ERPFeesTab" component={ERPFeesScreen} />
      <Tab.Screen name="ERPDocumentsTab" component={ERPDocumentsScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 85 : 68,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
  },
  tabBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 12,
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
    width: '70%',
    height: 3,
    backgroundColor: '#EA580C',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    gap: 3,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  iconContainerActive: {
    backgroundColor: '#FFF7ED',
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: '#EA580C',
    fontWeight: '800',
  },
});

export default ERPTabs;
