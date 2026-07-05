const fs = require('fs');
let code = fs.readFileSync('src/screens/student/AdminStudentProfileScreen.js', 'utf8');

// 1. Journal Icon
code = code.replace(
  '<TouchableOpacity \n            style={styles.headerIconBtn}\n            onPress={() => navigation.navigate(\'CampusJournal\')}\n          >',
  '{isOwnProfile && <TouchableOpacity \n            style={styles.headerIconBtn}\n            onPress={() => navigation.navigate(\'CampusJournal\')}\n          >'
);
code = code.replace(
  'style={styles.journalIcon}\n            />\n          </TouchableOpacity>',
  'style={styles.journalIcon}\n            />\n          </TouchableOpacity>}'
);

// 2. Edit Pic
code = code.replace(
  '{/* Editable Profile Picture Icon */}\n                <TouchableOpacity onPress={handlePickImage}',
  '{/* Editable Profile Picture Icon */}\n                {isOwnProfile && <TouchableOpacity onPress={handlePickImage}'
);
code = code.replace(
  '<Ionicons name="camera" size={20} color={colors.textPrimary} />\n                  )}\n                </TouchableOpacity>',
  '<Ionicons name="camera" size={20} color={colors.textPrimary} />\n                  )}\n                </TouchableOpacity>}'
);

// 3. Edit Bio
code = code.replace(
  '<TouchableOpacity style={[styles.editBioBtn, { backgroundColor: colors.border }]} onPress={handleGenerateBio}>\n              <MaterialIcons name="edit" size={18} color={colors.textSecondary} />\n            </TouchableOpacity>',
  '{isOwnProfile && (<TouchableOpacity style={[styles.editBioBtn, { backgroundColor: colors.border }]} onPress={handleGenerateBio}>\n              <MaterialIcons name="edit" size={18} color={colors.textSecondary} />\n            </TouchableOpacity>)}'
);

// 4. Update Mood
code = code.replace(
  '<TouchableOpacity style={[styles.updateMoodBtn, { backgroundColor: isDark ? \'rgba(255,255,255,0.1)\' : \'#FFFFFF\' }]}>\n            <Text style={[styles.updateMoodText, { color: isDark ? \'#D1FAE5\' : \'#004D40\' }]}>UPDATE MOOD</Text>\n          </TouchableOpacity>',
  '{isOwnProfile && (<TouchableOpacity style={[styles.updateMoodBtn, { backgroundColor: isDark ? \'rgba(255,255,255,0.1)\' : \'#FFFFFF\' }]}>\n            <Text style={[styles.updateMoodText, { color: isDark ? \'#D1FAE5\' : \'#004D40\' }]}>UPDATE MOOD</Text>\n          </TouchableOpacity>)}'
);

// 5. Venture Buttons
code = code.replace(
  '<View style={styles.ventureActions}>',
  '{isOwnProfile && (<View style={styles.ventureActions}>'
);
code = code.replace(
  '</TouchableOpacity>\n            </View>\n          </LinearGradient>',
  '</TouchableOpacity>\n            </View>)}\n          </LinearGradient>'
);

// 6. View All Certs
code = code.replace(
  '{finalCerts.length > 0 && (\n              <TouchableOpacity style={styles.viewAllRow}>\n                <Text style={[styles.viewAllCertText, { color: colors.primary }]}>VIEW ALL</Text>\n                <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />\n              </TouchableOpacity>\n            )}',
  '{finalCerts.length > 0 && isOwnProfile && (\n              <TouchableOpacity style={styles.viewAllRow}>\n                <Text style={[styles.viewAllCertText, { color: colors.primary }]}>VIEW ALL</Text>\n                <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />\n              </TouchableOpacity>\n            )}'
);

fs.writeFileSync('src/screens/student/AdminStudentProfileScreen.js', code);
console.log('Replaced buttons properly.');
