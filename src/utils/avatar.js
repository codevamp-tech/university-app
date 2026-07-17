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
  // If it's a real non-pravatar HTTP URL, use it directly
  if (name && typeof name === 'string' && name.startsWith('http')) {
    if (!name.includes('pravatar.cc')) {
      return name;
    }
    // pravatar.cc — fall through to ERP or initials resolution below
  }

  // If we have a roll number, resolve the real ERP portal photo
  if (rollno && typeof rollno === 'string' && rollno.trim()) {
    const cleanRoll = rollno.trim();
    return `https://myportal.srms.ac.in/srMSERP/Registration/StudentDocument/11/${cleanRoll}/${cleanRoll}.jpg`;
  }

  // Final fallback: ui-avatars.com initials
  const seed = name || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=F97316&color=fff&size=250&bold=true`;
}
