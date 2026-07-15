/**
 * studentAvatarCache.js
 *
 * Lightweight cross-screen lookup: rollno → avatar_url.
 * Populated once when the Faculty Students Directory loads its student list
 * (which includes real avatar_url values from the UniCampus backend).
 * The UG / PG Logbook screens can then look up real photos by roll number
 * without making any additional API calls.
 */

// rollno (lowercased) → avatar_url
const _lookup = {};

/**
 * Feed the full student list from the directory into the lookup.
 * Call this right after getAllStudents() resolves.
 * @param {Array} students  – array of student objects with { rollno, avatar_url }
 */
export function populateStudentAvatars(students = []) {
  students.forEach((s) => {
    if (s.rollno && s.avatar_url && !s.avatar_url.includes('pravatar.cc')) {
      _lookup[s.rollno.trim().toLowerCase()] = s.avatar_url;
    }
  });
}

/**
 * Look up a student's avatar_url by their roll number.
 * Returns null if no real photo is available (caller should fall back to initials).
 * @param {string} rollNo
 * @returns {string|null}
 */
export function getStudentAvatar(rollNo) {
  if (!rollNo) return null;
  const cleanRoll = rollNo.trim();
  if (!cleanRoll) return null;
  return _lookup[cleanRoll.toLowerCase()] || `https://myportal.srms.ac.in/srMSERP/Registration/StudentDocument/11/${cleanRoll}/${cleanRoll}.jpg`;
}
