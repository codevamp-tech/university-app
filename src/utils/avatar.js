/**
 * Resolves the best available avatar URL for a user.
 *
 * Priority order:
 *  1. A real uploaded avatar_url (not pravatar.cc)
 *  2. Real ERP student portal photo resolved by roll number
 *  3. ui-avatars.com initials fallback
 *
 * @param {string} name      - avatar_url or any name/seed string
 * @param {string} rollno    - student roll number (optional) — used to resolve real ERP photo
 */
export function getAvatarUrl(name, rollno) {
  // 1. If it's a real custom HTTP URL (not pravatar.cc and not ui-avatars.com), use it directly
  if (name && typeof name === 'string' && name.startsWith('http')) {
    if (!name.includes('pravatar.cc') && !name.includes('ui-avatars.com')) {
      return name;
    }
  }

  // 2. Extract clean roll number if provided or present in name
  let cleanRoll = (rollno && typeof rollno === 'string') ? rollno.trim() : '';
  if (!cleanRoll && name && typeof name === 'string') {
    const trimmed = name.trim();
    if (/^\d+$/.test(trimmed)) {
      cleanRoll = trimmed;
    }
  }

  // 3. If we have a numeric roll number, resolve the real ERP portal photo
  if (cleanRoll && /^\d+$/.test(cleanRoll)) {
    let fullRoll = cleanRoll;
    if (cleanRoll.length === 7 && cleanRoll.startsWith('2')) {
      fullRoll = '20' + cleanRoll;
    }
    return `https://myportal.srms.ac.in/srMSERP/Registration/StudentDocument/11/${fullRoll}/${fullRoll}.jpg`;
  }

  // 4. Fallback: ui-avatars.com initials based on name or extracted query
  let seed = 'Student';
  if (name && typeof name === 'string') {
    if (!name.startsWith('http')) {
      seed = name;
    } else {
      const match = name.match(/name=([^&]+)/);
      if (match && match[1]) {
        seed = decodeURIComponent(match[1]);
      }
    }
  }
  if ((seed === 'Student' || seed === 'User') && rollno) {
    seed = String(rollno);
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=F97316&color=fff&size=250&bold=true`;
}
