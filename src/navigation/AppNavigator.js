import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth Screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';

// Tab Navigators
import StudentTabs from './StudentTabs';
import TeacherTabs from './TeacherTabs';
import GuestTabs from './GuestTabs';
import JournalTabs from './JournalTabs';
import GuestOnboardingScreen from '../screens/guest/GuestOnboardingScreen';
import MainWalletScreen from '../screens/student/MainWalletScreen';
import CartScreen from '../screens/student/CartScreen';
import ProductDetailScreen from '../screens/student/ProductDetailScreen';

// Student standalone screens
import PersonalInfoScreen from '../screens/student/PersonalInfoScreen';
import AcademicDetailsScreen from '../screens/student/AcademicDetailsScreen';
import SettingsScreen from '../screens/student/SettingsScreen';
import HelpCenterScreen from '../screens/student/HelpCenterScreen';
import PrivacyScreen from '../screens/student/PrivacyScreen';
import SmartCampusScreen from '../screens/student/SmartCampusScreen';
import MarketplaceScreen from '../screens/student/MarketplaceScreen';
import TheHustleScreen from '../screens/student/TheHustleScreen';
import ERPTabs from './ERPTabs';
import ChatScreen from '../screens/student/ChatScreen';
import StudentSearchScreen from '../screens/student/StudentSearchScreen';
import OtherStudentProfileScreen from '../screens/student/OtherStudentProfileScreen';
import RaiseIssueScreen from '../screens/student/RaiseIssueScreen';

// Mentally Module Screens
import MentallyMainScreen from '../screens/student/mentally/MentallyMainScreen';
import DigitalDetoxScreen from '../screens/student/mentally/DigitalDetoxScreen';
import GuidedMeditationScreen from '../screens/student/mentally/GuidedMeditationScreen';
import MoodJournalScreen from '../screens/student/mentally/MoodJournalScreen';
import ZenMusicScreen from '../screens/student/mentally/ZenMusicScreen';

// Invertis AI Assistant Screens
import InvertisWelcomeScreen from '../screens/student/ai/InvertisWelcomeScreen';
import InvertisChatScreen from '../screens/student/ai/InvertisChatScreen';
import InvertisThinkingScreen from '../screens/student/ai/InvertisThinkingScreen';
import InvertisHelpScreen from '../screens/student/ai/InvertisHelpScreen';

// Campus Journal Screens
import CampusJournalFeedScreen from '../screens/student/journal/CampusJournalFeedScreen';
import CampusJournalReflectScreen from '../screens/student/journal/CampusJournalReflectScreen';
import CampusJournalExplorerScreen from '../screens/student/journal/CampusJournalExplorerScreen';
import CampusJournalInsightsScreen from '../screens/student/journal/CampusJournalInsightsScreen';
import SuggestWithAIScreen from '../screens/student/SuggestWithAIScreen';

// Guest Detail Screens
import FeeStructureScreen from '../screens/guest/FeeStructureScreen';
import PlacementRecordScreen from '../screens/guest/PlacementRecordScreen';
import HostelAmenitiesScreen from '../screens/guest/HostelAmenitiesScreen';
import CourseEligibilityScreen from '../screens/guest/CourseEligibilityScreen';
import AdmissionFormScreen from '../screens/guest/AdmissionFormScreen';

// Teacher standalone screens
import MarkAttendanceScreen from '../screens/teacher/MarkAttendanceScreen';
import DepartmentOverviewScreen from '../screens/teacher/DepartmentOverviewScreen';
import MyCoursesScreen from '../screens/teacher/MyCoursesScreen';
import FacultyDirectoryScreen from '../screens/teacher/FacultyDirectoryScreen';
import TeacherSettingsScreen from '../screens/teacher/TeacherSettingsScreen';
import TeacherHelpCenterScreen from '../screens/teacher/TeacherHelpCenterScreen';
import TeacherPrivacyScreen from '../screens/teacher/TeacherPrivacyScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      {/* Auth Flow */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding1" component={OnboardingScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_right' }} />

      {/* Student Main */}
      <Stack.Screen name="StudentMain" component={StudentTabs} options={{ animation: 'fade' }} />

      {/* Guest Flow */}
      <Stack.Screen name="GuestOnboarding" component={GuestOnboardingScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="GuestMain" component={GuestTabs} options={{ animation: 'fade' }} />

      {/* Student Profile Screens */}
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="AcademicDetails" component={AcademicDetailsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ animation: 'slide_from_right' }} />

      {/* New Student Module Screens */}
      <Stack.Screen name="SmartCampus" component={SmartCampusScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Marketplace" component={MarketplaceScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="SuggestWithAI" component={SuggestWithAIScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="MainWallet" component={MainWalletScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="TheHustle" component={TheHustleScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="ERPHub" component={ERPTabs} options={{ animation: 'fade' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="StudentSearch" component={StudentSearchScreen} options={{ animation: 'fade', presentation: 'transparentModal' }} />
      <Stack.Screen name="OtherStudentProfile" component={OtherStudentProfileScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="RaiseIssue" component={RaiseIssueScreen} options={{ animation: 'slide_from_bottom' }} />

      {/* Mentally Module */}
      <Stack.Screen name="MentallyMain" component={MentallyMainScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="DigitalDetox" component={DigitalDetoxScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="GuidedMeditation" component={GuidedMeditationScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="MoodJournal" component={MoodJournalScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="ZenMusic" component={ZenMusicScreen} options={{ animation: 'fade' }} />

      {/* Invertis AI Assistant Module */}
      <Stack.Screen name="InvertisWelcome" component={InvertisWelcomeScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="InvertisChat" component={InvertisChatScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="InvertisThinking" component={InvertisThinkingScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="InvertisHelp" component={InvertisHelpScreen} options={{ animation: 'fade' }} />

      {/* Campus Journal Module */}
      <Stack.Screen name="CampusJournal" component={JournalTabs} options={{ animation: 'slide_from_bottom' }} />

      {/* Guest Info Screens */}
      <Stack.Screen name="FeeStructure" component={FeeStructureScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="PlacementRecord" component={PlacementRecordScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="HostelAmenities" component={HostelAmenitiesScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="CourseEligibility" component={CourseEligibilityScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="AdmissionForm" component={AdmissionFormScreen} options={{ animation: 'slide_from_bottom' }} />

      {/* Teacher Main */}

      <Stack.Screen name="TeacherMain" component={TeacherTabs} options={{ animation: 'fade' }} />

      {/* Teacher Modal Screens */}
      <Stack.Screen
        name="MarkAttendance"
        component={MarkAttendanceScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="DepartmentOverview"
        component={DepartmentOverviewScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen name="TeacherCourses" component={MyCoursesScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="FacultyDirectory" component={FacultyDirectoryScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="TeacherSettings" component={TeacherSettingsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="TeacherHelp" component={TeacherHelpCenterScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="TeacherPrivacy" component={TeacherPrivacyScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
