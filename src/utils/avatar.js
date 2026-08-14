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
  // If it's a real custom uploaded HTTP image URL (NOT ui-avatars.com and NOT pravatar.cc), return it directly
  if (name && typeof name === 'string' && name.startsWith('http')) {
    const isUiAvatars = name.includes('ui-avatars.com');
    const isPravatar = name.includes('pravatar.cc');
    if (!isUiAvatars && !isPravatar) {
      return name;
    }
  }

  // Extract roll number if provided or if name itself is a numeric roll number
  let cleanRoll = (rollno && typeof rollno === 'string') ? rollno.trim() : '';
  if (!cleanRoll && name && typeof name === 'string' && !name.startsWith('http')) {
    const trimmed = name.trim();
    if (/^\d+$/.test(trimmed)) {
      cleanRoll = trimmed;
    }
  }

  // 1. If we have a numeric roll number, resolve the real ERP portal photo
  if (cleanRoll && /^\d+$/.test(cleanRoll)) {
    return `https://myportal.srms.ac.in/SRMSERP/Registration/StudentDocument/11/${cleanRoll}/${cleanRoll}.jpg`;
  }

  // 2. Sanitize seed name for ui-avatars initials fallback (never use digits, UUIDs, or generic 'Student')
  let seed = name || 'User';
  if (typeof seed === 'string') {
    if (seed.startsWith('http')) {
      const match = seed.match(/name=([^&]+)/);
      if (match && match[1]) {
        const decoded = decodeURIComponent(match[1]);
        seed = (/^\d+$/.test(decoded) || decoded.toLowerCase() === 'student') ? 'User' : decoded;
      } else {
        seed = 'User';
      }
    } else if (/^\d+$/.test(seed.trim()) || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(seed.trim())) {
      seed = 'User';
    }
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=F97316&color=fff&size=250&bold=true`;
}
