/**
 * Smart course display helper.
 *
 * For medical students (MBBS) it returns e.g. "3rd Year MBBS"
 * For engineering/other students it returns e.g. "B.Tech • Computer Science"
 *
 * This prevents the duplicate "M.B.B.S MBBS" display that occurs when
 * course and branch both contain the same program name.
 */

const YEAR_ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

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
  const category = (user.category || '').toLowerCase();
  return course.includes('MBBS') || category.includes('medical');
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

  const course = user.course || '';
  const branch = user.branch || '';
  
  // Extract number from year string or current_year property
  let yearNum = null;
  if (user.year) {
    const match = user.year.toString().match(/\d+/);
    if (match) yearNum = parseInt(match[0]);
  }
  if (!yearNum && user.current_year) {
    const match = user.current_year.toString().match(/\d+/);
    if (match) yearNum = parseInt(match[0]);
  }
  
  const semNum = parseInt(user.semester) || null;
  if (!yearNum && semNum) {
    yearNum = Math.ceil(semNum / 2);
  }

  if (isMedicalStudent(user)) {
    const ordinal = yearNum ? (YEAR_ORDINALS[yearNum - 1] || `${yearNum}th`) : '';
    if (ordinal) {
      return `${ordinal} Year MBBS`;
    }
    const phase = getPhaseRoman(semNum, yearNum);
    return phase ? `Phase ${phase} MBBS` : 'MBBS';
  }

  // For non-medical: check if branch is redundant (same as course or '-')
  const branchClean = branch.trim();
  const isRedundantBranch =
    !branchClean ||
    branchClean === '-' ||
    course.toLowerCase().includes(branchClean.toLowerCase());

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
