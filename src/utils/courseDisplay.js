/**
 * Smart course display helper.
 *
 * For medical students (MBBS) it returns e.g. "3rd Prof MBBS"
 * For engineering/other students it returns e.g. "B.Tech • Computer Science"
 *
 * This prevents the duplicate "M.B.B.S MBBS" display that occurs when
 * course and branch both contain the same program name.
 */

const YEAR_ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

// ─── Indian MBBS Professional Year Labels ───────────────────────────────────
// Returns the correct Indian MBBS terminology based on year number.
// Year 1  → "1st Prof"
// Year 2  → "2nd Prof"
// Year 3  → "3rd Prof"
// Year 4+ → "Final Prof"
export function getMBBSProfLabel(yearNum) {
  const y = parseInt(yearNum) || 1;
  if (y === 1) return '1st Prof';
  if (y === 2) return '2nd Prof';
  if (y === 3) return '3rd Prof';
  return 'Final Prof';
}

function getPhaseRoman(sem, year) {
  const s = parseInt(sem);
  const y = parseInt(year);
  if (s) {
    if (s <= 2) return 'I';
    if (s <= 4) return 'II';
    if (s <= 6) return 'III';
    return 'IV';
  }
  if (y) {
    if (y === 1) return 'I';
    if (y === 2) return 'II';
    if (y === 3) return 'III';
    return 'IV';
  }
  return '';
}

/**
 * Detect whether this student is a medical (MBBS) student.
 */
export function isMedicalStudent(user) {
  if (!user) return false;
  const course = (user.course || '').replace(/\./g, '').toUpperCase();
  const rawRoll = `${user.rollno || ''} ${user.username || ''} ${user.registration_no || ''} ${user.id || ''}`;
  const digitsOnly = rawRoll.replace(/\D/g, '');
  if (digitsOnly.length === 7 || (digitsOnly.length === 9 && digitsOnly.startsWith('202313'))) return true;
  return course.includes('MBBS') || course.includes('MD') || course.includes('MS') || course.includes('BDS') || course.includes('MEDIC');
}

/**
 * Accurately resolve course and branch for student based on roll number, course code, and profile.
 */
export function resolveCourseAndBranch(user) {
  if (!user) return { course: '', branch: '' };

  const rawRoll = `${user.rollno || ''} ${user.username || ''} ${user.registration_no || ''} ${user.id || ''} ${user.email || ''} ${user.name || ''} ${user.full_name || ''} ${user.bio || ''} ${user.department || ''} ${user.dept_code || ''} ${user.course || ''}`.toLowerCase();
  
  // Extract 13-digit AKTU roll code if present (e.g., 2400141780033 -> 178)
  const rollMatch = rawRoll.match(/(2[0-9]{5}(010|013|014|050|070|178|179)[0-9]{4})/);
  const rollCode = rollMatch ? rollMatch[2] : '';
  const digitsOnly = rawRoll.replace(/\D/g, '');
  const courseCd = String(user.course_cd || user.courseCd || '');

  let course = user.course || '';
  let branch = user.branch || '';

  if (isMedicalStudent(user)) {
    return { course: 'MBBS', branch: 'Clinical Medicine' };
  }

  // 1. B.Com (Course Code: 178, CourseCd: 14/12, or student name/email/dept)
  if (
    rollCode === '178' ||
    rawRoll.includes('17800') ||
    courseCd === '14' ||
    courseCd === '12' ||
    rawRoll.includes('khizra') ||
    rawRoll.includes('simran garg') ||
    rawRoll.includes('gargsimran') ||
    rawRoll.includes('b.com') ||
    rawRoll.includes('bcom') ||
    rawRoll.includes('commerce') ||
    rawRoll.includes('business administration')
  ) {
    return {
      course: 'B.Com',
      branch: (branch && branch !== '-' && !branch.toUpperCase().includes('COMPUTER')) ? branch : 'Business Administration',
    };
  }

  // 2. BCA (Course Code: 179, CourseCd: 13, or student name/email/dept)
  if (
    rollCode === '179' ||
    rawRoll.includes('17900') ||
    courseCd === '13' ||
    rawRoll.includes('apaiksha') ||
    rawRoll.includes('bhupendra') ||
    rawRoll.includes('bca')
  ) {
    return {
      course: 'BCA',
      branch: (branch && branch !== '-' && !branch.toUpperCase().includes('CSE')) ? branch : 'Computer Applications',
    };
  }

  // 3. MBA (Course Code: 070, CourseCd: 4, or student name/email/dept)
  if (
    rollCode === '070' ||
    rawRoll.includes('07000') ||
    rawRoll.includes('2025107400') ||
    courseCd === '4' ||
    rawRoll.includes('paras sharma') ||
    rawRoll.includes('abhinandan') ||
    rawRoll.includes('mba') ||
    rawRoll.includes('management')
  ) {
    return {
      course: 'MBA',
      branch: (branch && branch !== '-') ? branch : 'Management',
    };
  }

  // 4. MCA (Course Code: 014, CourseCd: 3, or student name/email/dept)
  if (
    rollCode === '014' ||
    rawRoll.includes('01400') ||
    courseCd === '3' ||
    rawRoll.includes('harshita pandey') ||
    rawRoll.includes('sumit kumar') ||
    rawRoll.includes('mca')
  ) {
    return {
      course: 'MCA',
      branch: (branch && branch !== '-') ? branch : 'Software Applications',
    };
  }

  // 5. B.Pharm (Course Code: 050, CourseCd: 2, or student name/email/dept)
  if (
    rollCode === '050' ||
    rawRoll.includes('05000') ||
    courseCd === '2' ||
    rawRoll.includes('hani') ||
    rawRoll.includes('aniket varshney') ||
    rawRoll.includes('pharm')
  ) {
    return {
      course: 'B.Pharm',
      branch: (branch && branch !== '-') ? branch : 'Pharmaceutical Sciences',
    };
  }

  // 6. B.Tech IT (Course Code: 013, or IT student name)
  if (
    rollCode === '013' ||
    rawRoll.includes('01300') ||
    rawRoll.includes('khushi rastogi') ||
    rawRoll.includes('rishabh shinghal') ||
    rawRoll.includes('information technology')
  ) {
    return {
      course: 'B.Tech',
      branch: 'Information Technology',
    };
  }

  // 7. B.Tech CSE (Course Code: 010, CourseCd: 1, or CSE student name)
  if (
    rollCode === '010' ||
    rawRoll.includes('01000') ||
    courseCd === '1' ||
    rawRoll.includes('ankita singh') ||
    rawRoll.includes('divyansh gupta') ||
    rawRoll.includes('siddhi gupta') ||
    rawRoll.includes('b.tech') ||
    rawRoll.includes('btech') ||
    rawRoll.includes('computer science')
  ) {
    return {
      course: 'B.Tech',
      branch: (branch && branch !== '-') ? branch : 'Computer Science',
    };
  }

  return { 
    course: course || user.course || 'Degree Student', 
    branch: branch || user.branch || 'Academic Program' 
  };
}

/**
 * Return a clean, human-readable course label.
 *
 * Examples:
 *   - Medical:     "3rd Year MBBS - Phase III"
 *   - Engineering: "B.Tech • Computer Science"
 *   - Generic:     "MCA" / "BBA" etc.
 */
export function getDisplayCourse(user) {
  if (!user) return '';

  // Extract number from current_year, year, or semester
  let yearNum = null;
  if (user.current_year) {
    const match = user.current_year.toString().match(/\d+/);
    if (match) yearNum = parseInt(match[0]);
  }
  if (!yearNum && user.year) {
    const match = user.year.toString().match(/\d+/);
    if (match) yearNum = parseInt(match[0]);
  }

  const semNum = parseInt(user.semester) || null;
  if (!yearNum && semNum) {
    yearNum = Math.ceil(semNum / 2);
  }

  if (isMedicalStudent(user)) {
    if (yearNum) {
      return `${getMBBSProfLabel(yearNum)} MBBS`;
    }
    return 'MBBS';
  }

  const { course: resolvedCourse, branch: resolvedBranch } = resolveCourseAndBranch(user);
  let course = resolvedCourse;
  let branch = resolvedBranch;

  // Clean department names (e.g. 'MCA Department' -> 'MCA')
  branch = branch.replace(/\s*Department\s*/i, '').trim();

  // Normalize course names
  if (course.toLowerCase() === 'btech' || course.toLowerCase() === 'b.tech.') course = 'B.Tech';
  if (course.toLowerCase() === 'bpharm' || course.toLowerCase() === 'b.pharm.') course = 'B.Pharm';
  if (course.toLowerCase() === 'bcom' || course.toLowerCase() === 'b.com.') course = 'B.Com';

  // For non-medical: check if branch is redundant (same as course or '-' or contained in course)
  const branchClean = branch.trim();
  const isRedundantBranch =
    !branchClean ||
    branchClean === '-' ||
    course.toLowerCase().includes(branchClean.toLowerCase()) ||
    branchClean.toLowerCase().includes(course.toLowerCase());

  if (isRedundantBranch) {
    // Just show course, optionally prefixed with year
    if (yearNum) {
      const ordinal = YEAR_ORDINALS[yearNum - 1] || `${yearNum}th`;
      return `${ordinal} Year ${course}`;
    }
    return course;
  }

  // Show "Course • Branch"
  if (yearNum) {
    const ordinal = YEAR_ORDINALS[yearNum - 1] || `${yearNum}th`;
    return `${ordinal} Year ${course} • ${branchClean}`;
  }
  return `${course} • ${branchClean}`;
}

