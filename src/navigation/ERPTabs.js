import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

// ERP Screens
import ERPHubScreen from '../screens/student/ERPHubScreen';
import ERPResultsScreen from '../screens/student/ERPResultsScreen';
import ERPFeesScreen from '../screens/student/ERPFeesScreen';
import ERPDocumentsScreen from '../screens/student/ERPDocumentsScreen';

const Tab = createBottomTabNavigator();

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          let iconName;
          let label;

          if (route.name === 'ERPHome') {
            iconName = 'home';
            label = 'Home';
          } else if (route.name === 'ERPResultsTab') {
            iconName = 'grade';
            label = 'Results';
          } else if (route.name === 'ERPFeesTab') {
            iconName = 'payments';
            label = 'Fees';
          } else if (route.name === 'ERPDocumentsTab') {
            iconName = 'folder-shared';
            label = 'Documents';
          }

          const color = isFocused ? '#EA580C' : '#64748B';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                {isFocused && <View style={styles.activeIndicator} />}
                <View style={[
                  styles.iconWrapper,
                  isFocused && styles.iconWrapperActive
                ]}>
                  <MaterialIcons name={iconName} size={22} color={color} />
                </View>
                <Text
                  style={[
                    styles.label,
                    { color },
                    isFocused && styles.labelActive
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const ERPTabs = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="ERPHome" component={ERPHubScreen} />
      <Tab.Screen name="ERPResultsTab" component={ERPResultsScreen} />
      <Tab.Screen name="ERPFeesTab" component={ERPFeesScreen} />
      <Tab.Screen name="ERPDocumentsTab" component={ERPDocumentsScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 25 : 15,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 35,
    height: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  tabItem: {
    flex: 1,
    height: 70,
  },
  tabContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 32,
    height: 3,
    backgroundColor: '#EA580C',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  iconWrapperActive: {
    backgroundColor: '#FFF7ED',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    includeFontPadding: false,
  },
  labelActive: {
    fontWeight: '700',
  },
});

export default ERPTabs;