const fs = require('fs');
let code = fs.readFileSync('src/screens/student/TalentIdentityScreen.js', 'utf8');

// Replace the component definition
code = code.replace(
  'const TalentIdentityScreen = ({ navigation }) => {',
  'const AdminStudentProfileScreen = ({ navigation, route }) => {\\n  const passedStudent = route?.params?.student;\\n  const isOwnProfile = !passedStudent;'
);

// Replace the useUser line
code = code.replace(
  'const { user, accessToken, updateAvatarUrl } = useUser();',
  'const { user: contextUser, accessToken, updateAvatarUrl } = useUser();\\n  const [publicProfile, setPublicProfile] = React.useState(null);\\n  const user = isOwnProfile ? contextUser : (publicProfile || passedStudent || {});'
);

// Add the useEffect hook to fetch data
code = code.replace(
  '  React.useEffect(() => {\\n    let isMounted = true;\\n    \\n    const loadData = () => {\\n      if (!accessToken) return;\\n      connectionStatsAPI(accessToken)\\n        .then(res => {\\n          if (isMounted && res) {\\n            setStats(res);\\n          }\\n        })\\n        .catch(err => console.warn(\'[TalentIdentityScreen] stats error:\', err));\\n\\n      getStartups(accessToken, 0, 50, true)\\n        .then(res => {\\n          if (isMounted && res) {\\n            setMyStartups(res);\\n          }\\n        })\\n        .catch(err => console.warn(\'[TalentIdentityScreen] startups error:\', err))\\n        .finally(() => {\\n          if (isMounted) setLoadingData(false);\\n        });\\n    };\\n\\n    loadData();\\n\\n    const unsubscribe = navigation.addListener(\'focus\', () => {\\n      loadData();\\n    });\\n\\n    return () => {\\n      isMounted = false;\\n      unsubscribe();\\n    };\\n  }, [accessToken, navigation]);',
  `
  React.useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!accessToken) return;
      try {
        if (!isOwnProfile && passedStudent?.id) {
          const { getPublicProfile } = require('../../data/apiService');
          const profData = await getPublicProfile(accessToken, passedStudent.id);
          if (isMounted && profData) {
            setPublicProfile(profData);
            setUserBio(profData.bio || defaultBio);
          }
        }
        
        const targetId = isOwnProfile ? null : passedStudent?.id;
        const res = await connectionStatsAPI(accessToken, targetId);
        if (isMounted && res) setStats(res);
        
        if (isOwnProfile) {
          const stRes = await getStartups(accessToken, 0, 50, true);
          if (isMounted && stRes) setMyStartups(stRes);
        }
      } catch (err) {
        console.warn('[AdminStudentProfileScreen] data error:', err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    loadData();

    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [accessToken, navigation, passedStudent?.id]);
  `
);

// HIDE BUTTONS

// 1. Journal Icon
code = code.replace(
  '<TouchableOpacity \\n            style={styles.headerIconBtn}\\n            onPress={() => navigation.navigate(\\'CampusJournal\\')}\\n          >',
  '{isOwnProfile && <TouchableOpacity \\n            style={styles.headerIconBtn}\\n            onPress={() => navigation.navigate(\\'CampusJournal\\')}\\n          >'
);
code = code.replace(
  'style={styles.journalIcon}\\n            />\\n          </TouchableOpacity>',
  'style={styles.journalIcon}\\n            />\\n          </TouchableOpacity>}'
);


// 2. Edit Pic
code = code.replace(
  '{/* Editable Profile Picture Icon */}\\n                <TouchableOpacity onPress={handlePickImage}',
  '{/* Editable Profile Picture Icon */}\\n                {isOwnProfile && <TouchableOpacity onPress={handlePickImage}'
);
code = code.replace(
  '<Ionicons name="camera" size={20} color={colors.textPrimary} />\\n                  )}\\n                </TouchableOpacity>',
  '<Ionicons name="camera" size={20} color={colors.textPrimary} />\\n                  )}\\n                </TouchableOpacity>}'
);

// 3. Edit Bio
code = code.replace(
  '<TouchableOpacity style={[styles.editBioBtn, { backgroundColor: colors.border }]} onPress={handleGenerateBio}>\\n              <MaterialIcons name="edit" size={18} color={colors.textSecondary} />\\n            </TouchableOpacity>',
  '{isOwnProfile && (<TouchableOpacity style={[styles.editBioBtn, { backgroundColor: colors.border }]} onPress={handleGenerateBio}>\\n              <MaterialIcons name="edit" size={18} color={colors.textSecondary} />\\n            </TouchableOpacity>)}'
);

// 4. Update Mood
code = code.replace(
  '<TouchableOpacity style={[styles.updateMoodBtn, { backgroundColor: isDark ? \\'rgba(255,255,255,0.1)\\' : \\'#FFFFFF\\' }]}>\\n            <Text style={[styles.updateMoodText, { color: isDark ? \\'#D1FAE5\\' : \\'#004D40\\' }]}>UPDATE MOOD</Text>\\n          </TouchableOpacity>',
  '{isOwnProfile && (<TouchableOpacity style={[styles.updateMoodBtn, { backgroundColor: isDark ? \\'rgba(255,255,255,0.1)\\' : \\'#FFFFFF\\' }]}>\\n            <Text style={[styles.updateMoodText, { color: isDark ? \\'#D1FAE5\\' : \\'#004D40\\' }]}>UPDATE MOOD</Text>\\n          </TouchableOpacity>)}'
);

// 5. Venture Buttons
code = code.replace(
  '<View style={styles.ventureActions}>',
  '{isOwnProfile && (<View style={styles.ventureActions}>'
);
code = code.replace(
  '</TouchableOpacity>\\n            </View>\\n          </LinearGradient>',
  '</TouchableOpacity>\\n            </View>)}\\n          </LinearGradient>'
);

// 6. View All Certs
code = code.replace(
  '{finalCerts.length > 0 && (\\n              <TouchableOpacity style={styles.viewAllRow}>\\n                <Text style={[styles.viewAllCertText, { color: colors.primary }]}>VIEW ALL</Text>\\n                <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />\\n              </TouchableOpacity>\\n            )}',
  '{finalCerts.length > 0 && isOwnProfile && (\\n              <TouchableOpacity style={styles.viewAllRow}>\\n                <Text style={[styles.viewAllCertText, { color: colors.primary }]}>VIEW ALL</Text>\\n                <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />\\n              </TouchableOpacity>\\n            )}'
);

// Add back button in header if not own profile
code = code.replace(
  '<View style={styles.headerLeft}>',
  '<View style={styles.headerLeft}>\\n          {!isOwnProfile && (\\n            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>\\n              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />\\n            </TouchableOpacity>\\n          )}'
);

// Update export
code = code.replace('export default TalentIdentityScreen;', 'export default AdminStudentProfileScreen;');

fs.writeFileSync('src/screens/student/AdminStudentProfileScreen.js', code);
console.log('Done refactoring and hiding buttons!');
