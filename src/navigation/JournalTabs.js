import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import CampusJournalFeedScreen from '../screens/student/journal/CampusJournalFeedScreen';
import CampusJournalReflectScreen from '../screens/student/journal/CampusJournalReflectScreen';
import CampusJournalDetailScreen from '../screens/student/journal/CampusJournalDetailScreen';
import CampusJournalExplorerScreen from '../screens/student/journal/CampusJournalExplorerScreen';
import CampusJournalInsightsScreen from '../screens/student/journal/CampusJournalInsightsScreen';

const Stack = createNativeStackNavigator();

const JournalTabs = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName="JournalFeed"
    >
      <Stack.Screen name="JournalFeed" component={CampusJournalFeedScreen} />
      <Stack.Screen 
        name="JournalReflect" 
        component={CampusJournalReflectScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="JournalDetail" component={CampusJournalDetailScreen} />
      <Stack.Screen name="JournalExplore" component={CampusJournalExplorerScreen} />
      <Stack.Screen name="JournalInsights" component={CampusJournalInsightsScreen} />
    </Stack.Navigator>
  );
};

export default JournalTabs;