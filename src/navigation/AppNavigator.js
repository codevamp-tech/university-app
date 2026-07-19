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
import AdminTabs from './AdminTabs';
import GuestOnboardingScreen from '../screens/guest/GuestOnboardingScreen';
import MainWalletScreen from '../screens/student/MainWalletScreen';
import CartScreen from '../screens/student/CartScreen';
import ProductDetailScreen from '../screens/student/ProductDetailScreen';

// Standalone Admin Screens
import AdminBroadcastCenterScreen from '../screens/admin/AdminBroadcastCenterScreen';
import AdminMentalHealthInsightsScreen from '../screens/admin/AdminMentalHealthInsightsScreen';
import SuperAdminDrilldownScreen from '../screens/admin/SuperAdminDrilldownScreen';
import AdminGrievanceInboxScreen from '../screens/admin/AdminGrievanceInboxScreen';
import AdminVentureReviewScreen from '../screens/admin/AdminVentureReviewScreen';
import AdminMarketplaceReviewScreen from '../screens/admin/AdminMarketplaceReviewScreen';
import WardenOutpassesScreen from '../screens/admin/WardenOutpassesScreen';
import AdminStudentsDirectoryScreen from '../screens/admin/AdminStudentsDirectoryScreen';

// Campus Food Ordering
import CampusBitesMenuScreen from '../screens/student/CampusBitesMenuScreen';
import FoodItemDetailScreen from '../screens/student/FoodItemDetailScreen';
import FoodCartScreen from '../screens/student/FoodCartScreen';

// Student standalone screens
import PersonalInfoScreen from '../screens/student/PersonalInfoScreen';
import AcademicDetailsScreen from '../screens/student/AcademicDetailsScreen';
import SettingsScreen from '../screens/student/SettingsScreen';
import HelpCenterScreen from '../screens/student/HelpCenterScreen';
import PrivacyScreen from '../screens/student/PrivacyScreen';
import SmartCampusScreen from '../screens/student/SmartCampusScreen';
import CommunityScreen from '../screens/student/CommunityScreen';
import MarketplaceScreen from '../screens/student/MarketplaceScreen';
import AddProductScreen from '../screens/student/AddProductScreen';
import AddGigScreen from '../screens/student/AddGigScreen';
import AddRequestScreen from '../screens/student/AddRequestScreen';
import TheHustleScreen from '../screens/student/TheHustleScreen';
import ERPTabs from './ERPTabs';
import ChatScreen from '../screens/student/ChatScreen';
import StudentSearchScreen from '../screens/student/StudentSearchScreen';
import NotificationsScreen from '../screens/student/NotificationsScreen';
import AdminStudentProfileScreen from '../screens/student/AdminStudentProfileScreen';
import DMConversationScreen from '../screens/student/DMConversationScreen';
import RaiseIssueScreen from '../screens/student/RaiseIssueScreen';
import SkillGapTestScreen from '../screens/student/SkillGapTestScreen';
import DeepDiveAnalysisScreen from '../screens/student/DeepDiveAnalysisScreen';
import FitnessDetailScreen from '../screens/student/FitnessDetailScreen';
import LibraryMainScreen from '../screens/student/library/LibraryMainScreen';
import BookDetailScreen from '../screens/student/library/BookDetailScreen';

// Mentally Module Screens
import MentallyMainScreen from '../screens/student/mentally/MentallyMainScreen';
import DigitalDetoxScreen from '../screens/student/mentally/DigitalDetoxScreen';
import GuidedMeditationScreen from '../screens/student/mentally/GuidedMeditationScreen';
import MoodJournalScreen from '../screens/student/mentally/MoodJournalScreen';
import ZenMusicScreen from '../screens/student/mentally/ZenMusicScreen';
import CounsellorBookingScreen from '../screens/student/mentally/CounsellorBookingScreen';

// AI Assistant Screens
import CampusAIWelcomeScreen from '../screens/student/ai/CampusAIWelcomeScreen';
import CampusAIChatScreen from '../screens/student/ai/CampusAIChatScreen';
import CampusAIThinkingScreen from '../screens/student/ai/CampusAIThinkingScreen';
import CampusAIHelpScreen from '../screens/student/ai/CampusAIHelpScreen';

// Campus Journal Screens
import CampusJournalFeedScreen from '../screens/student/journal/CampusJournalFeedScreen';
import CampusJournalReflectScreen from '../screens/student/journal/CampusJournalReflectScreen';
import CampusJournalExplorerScreen from '../screens/student/journal/CampusJournalExplorerScreen';
import CampusJournalInsightsScreen from '../screens/student/journal/CampusJournalInsightsScreen';
import SuggestWithAIScreen from '../screens/student/SuggestWithAIScreen';
import ResumeBuilderScreen from '../screens/student/ResumeBuilderScreen';

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
import TeacherAlertsScreen from '../screens/teacher/TeacherAlertsScreen';
import OtherTeacherProfileScreen from '../screens/teacher/OtherTeacherProfileScreen';
import AdminFacultyDetailScreen from '../screens/admin/AdminFacultyDetailScreen';
import SalarySlipScreen from '../screens/teacher/SalarySlipScreen';
import LeaveBalanceScreen from '../screens/teacher/LeaveBalanceScreen';
import FacultyOfficialChatScreen from '../screens/teacher/FacultyOfficialChatScreen';
import FacultyStudentsDirectoryScreen from '../screens/teacher/FacultyStudentsDirectoryScreen';
import UGLogbookScreen from '../screens/teacher/UGLogbookScreen';
import PGLogbookScreen from '../screens/teacher/PGLogbookScreen';
import StudentFacultyDirectoryScreen from '../screens/student/FacultyDirectoryScreen';

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

      {/* Admin Main */}
      <Stack.Screen name="AdminMain" component={AdminTabs} options={{ animation: 'fade' }} />
      <Stack.Screen name="AdminBroadcastCenter" component={AdminBroadcastCenterScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="AdminMentalHealthInsights" component={AdminMentalHealthInsightsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="SuperAdminDrilldown" component={SuperAdminDrilldownScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="GrievanceManager" component={AdminGrievanceInboxScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="VentureManager" component={AdminVentureReviewScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="MarketplaceManager" component={AdminMarketplaceReviewScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="OutpassManager" component={WardenOutpassesScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="AdminFacultyDetail" component={AdminFacultyDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="AdminStudentsDirectory" component={AdminStudentsDirectoryScreen} options={{ animation: 'slide_from_right' }} />

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
      <Stack.Screen name="Community" component={CommunityScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Marketplace" component={MarketplaceScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="AddGig" component={AddGigScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="AddRequest" component={AddRequestScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="SuggestWithAI" component={SuggestWithAIScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="MainWallet" component={MainWalletScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="TheHustle" component={TheHustleScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="ERPHub" component={ERPTabs} options={{ animation: 'fade' }} />

      {/* Campus Food Ordering */}
      <Stack.Screen name="CampusBitesMenu" component={CampusBitesMenuScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="FoodItemDetail" component={FoodItemDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="FoodCart" component={FoodCartScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="StudentSearch" component={StudentSearchScreen} options={{ animation: 'fade', presentation: 'transparentModal' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_right' }} />
      {/* Global Modals / Shared Screens */}
      <Stack.Screen name="OtherStudentProfile" component={AdminStudentProfileScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="DMConversation" component={DMConversationScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="StudentFacultyDirectory" component={StudentFacultyDirectoryScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="RaiseIssue" component={RaiseIssueScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="SkillGapTest" component={SkillGapTestScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="DeepDiveAnalysis" component={DeepDiveAnalysisScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="FitnessDetail" component={FitnessDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="LibraryMain" component={LibraryMainScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ResumeBuilder" component={ResumeBuilderScreen} options={{ animation: 'slide_from_right' }} />

      {/* Mentally Module */}
      <Stack.Screen name="MentallyMain" component={MentallyMainScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="DigitalDetox" component={DigitalDetoxScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="GuidedMeditation" component={GuidedMeditationScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="MoodJournal" component={MoodJournalScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="ZenMusic" component={ZenMusicScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="CounsellorBooking" component={CounsellorBookingScreen} options={{ animation: 'slide_from_right' }} />

      {/* AI Assistant Module */}
      <Stack.Screen name="CampusAIWelcome" component={CampusAIWelcomeScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="CampusAIChat" component={CampusAIChatScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="CampusAIThinking" component={CampusAIThinkingScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="CampusAIHelp" component={CampusAIHelpScreen} options={{ animation: 'fade' }} />

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
      <Stack.Screen name="OtherTeacherProfile" component={OtherTeacherProfileScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="TeacherSettings" component={TeacherSettingsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="TeacherHelp" component={TeacherHelpCenterScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="TeacherPrivacy" component={TeacherPrivacyScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="TeacherAlerts" component={TeacherAlertsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="SalarySlip" component={SalarySlipScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="LeaveBalance" component={LeaveBalanceScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="FacultyOfficialChat" component={FacultyOfficialChatScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="FacultyStudentsDirectory" component={FacultyStudentsDirectoryScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="UGLogbook" component={UGLogbookScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="PGLogbook" component={PGLogbookScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
