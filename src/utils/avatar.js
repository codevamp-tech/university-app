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
  // If it's a real custom uploaded HTTP image URL (not pravatar or ui-avatars with digits), return it directly
  if (name && typeof name === 'string' && name.startsWith('http')) {
    const isPravatar = name.includes('pravatar.cc');
    const isUiAvatarsWithDigits = name.includes('ui-avatars.com') && /name=\d+/.test(name);
    if (!isPravatar && !isUiAvatarsWithDigits) {
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
    return `https://myportal.srms.ac.in/srMSERP/Registration/StudentDocument/11/${cleanRoll}/${cleanRoll}.jpg`;
  }

  // 2. Sanitize seed name for ui-avatars initials fallback (never use digits or UUIDs)
  let seed = name || 'Student';
  if (typeof seed === 'string') {
    if (seed.startsWith('http')) {
      const match = seed.match(/name=([^&]+)/);
      if (match && match[1]) {
        const decoded = decodeURIComponent(match[1]);
        seed = /^\d+$/.test(decoded) ? 'Student' : decoded;
      } else {
        seed = 'Student';
      }
    } else if (/^\d+$/.test(seed.trim()) || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(seed.trim())) {
      seed = 'Student';
    }
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=F97316&color=fff&size=250&bold=true`;
}
