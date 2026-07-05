const fs = require('fs');
let code = fs.readFileSync('src/screens/student/AdminStudentProfileScreen.js', 'utf8');

// 1. Add getPublicProfile import if not there
if (!code.includes('getPublicProfile')) {
  code = code.replace(
    "import { getStartups, connectionStatsAPI, uploadAvatarAPI } from '../../data/apiService';",
    "import { getStartups, connectionStatsAPI, uploadAvatarAPI, getPublicProfile } from '../../data/apiService';"
  );
}

// 2. Update loadData
code = code.replace(
  /React\.useEffect\(\(\) => \{[\s\S]*?loadData\(\);\s*const unsubscribe = navigation\.addListener\('focus', \(\) => \{\s*loadData\(\);\s*\}\);\s*return \(\) => \{\s*isMounted = false;\s*unsubscribe\(\);\s*\};\s*\}, \[accessToken, navigation\]\);/,
  `React.useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!accessToken) return;
      try {
        if (passedStudent?.id) {
          const profData = await getPublicProfile(accessToken, passedStudent.id);
          if (isMounted && profData) {
            setPublicProfile(profData);
            setUserBio(profData.bio || defaultBio);
          }
        }
        
        const targetId = passedStudent?.id;
        const res = await connectionStatsAPI(accessToken, targetId);
        if (isMounted && res) setStats(res);
        
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
  }, [accessToken, navigation, passedStudent?.id]);`
);

// 3. Comment out buttons

// Journal Icon
code = code.replace(
  /<TouchableOpacity \s*style=\{styles\.headerIconBtn\}\s*onPress=\{\(\) => navigation\.navigate\('CampusJournal'\)\}\s*>[\s\S]*?<\/TouchableOpacity>/,
  '{/* $& */}'
);

// Edit Pic
code = code.replace(
  /<TouchableOpacity onPress=\{handlePickImage\} style=\{\[styles\.editPicBtn, \{ backgroundColor: colors\.background \}\]\}>[\s\S]*?<\/TouchableOpacity>/,
  '{/* $& */}'
);

// Edit Bio
code = code.replace(
  /<TouchableOpacity style=\{\[styles\.editBioBtn, \{ backgroundColor: colors\.border \}\]\} onPress=\{handleGenerateBio\}>[\s\S]*?<\/TouchableOpacity>/,
  '{/* $& */}'
);

// Update Mood
code = code.replace(
  /<TouchableOpacity style=\{\[styles\.updateMoodBtn, \{ backgroundColor: isDark \? 'rgba\(255,255,255,0\.1\)' : '#FFFFFF' \}\]\}>[\s\S]*?<\/TouchableOpacity>/,
  '{/* $& */}'
);

// Venture Actions
code = code.replace(
  /<View style=\{styles\.ventureActions\}>[\s\S]*?<\/View>/,
  '{/* $& */}'
);

// View All Certs
code = code.replace(
  /\{finalCerts\.length > 0 && \([\s\S]*?<TouchableOpacity style=\{styles\.viewAllRow\}>[\s\S]*?<\/TouchableOpacity>\s*\)\}/,
  '{/* View All Certs Button Removed For Admin */}'
);


fs.writeFileSync('src/screens/student/AdminStudentProfileScreen.js', code);
console.log('Done modifying screen!');
