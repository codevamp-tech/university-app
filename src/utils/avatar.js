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
  // 1. If it's a real custom uploaded HTTP image URL (Cloudinary, S3, Firebase, Imgur, etc.), use it directly
  if (name && typeof name === 'string' && name.startsWith('http')) {
    if (!name.includes('pravatar.cc') && !name.includes('ui-avatars.com') && !name.includes('myportal.srms.ac.in')) {
      return name;
    }
  }

  // Helper to sanitize raw UUIDs or pure digits into valid human name seeds
  const sanitizeSeed = (str) => {
    if (!str || typeof str !== 'string') return '';
    const trimmed = str.trim();
    // Reject UUID format (e.g. 5cd4786b-f744-4a5d-95b9-cf87f50e6bc1) or pure digits
    if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed) || /^\d+$/.test(trimmed)) {
      return '';
    }
    return trimmed;
  };

  // 2. Extract clean seed name for ui-avatars initials
  let seed = '';
  if (name && typeof name === 'string') {
    if (!name.startsWith('http')) {
      seed = sanitizeSeed(name);
    } else {
      const match = name.match(/name=([^&]+)/);
      if (match && match[1]) {
        seed = sanitizeSeed(decodeURIComponent(match[1]));
      }
    }
  }

  if (!seed && rollno && typeof rollno === 'string') {
    seed = sanitizeSeed(rollno);
  }

  if (!seed) {
    seed = 'Student';
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=F97316&color=fff&size=250&bold=true`;
}
