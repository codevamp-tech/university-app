/**
 * Resolves the best available avatar URL for a user with smart college routing.
 *
 * Priority order:
 *  1. A real uploaded avatar_url (not pravatar.cc, not ui-avatars.com)
 *  2. Real ERP student portal photo resolved by roll number & college code
 *  3. ui-avatars.com initials fallback
 *
 * @param {string} name      - avatar_url or any name/seed string
 * @param {string} rollno    - student roll number (optional) — used to resolve real ERP photo
 * @param {string} course    - course name/code (optional) — used to determine college code
 */
export function getAvatarUrl(name, rollno, course) {
  // If it's a real non-pravatar, non-ui-avatars HTTP URL, use it directly
  if (name && typeof name === 'string' && name.startsWith('http')) {
    if (!name.includes('pravatar.cc') && !name.includes('ui-avatars.com')) {
      return name;
    }
  }

  // If we have a roll number, resolve the real ERP portal photo
  if (rollno && typeof rollno === 'string' && rollno.trim()) {
    const cleanRoll = rollno.trim();
    const isMed = cleanRoll.toUpperCase().includes('MBBS') || 
                  (course && typeof course === 'string' && (course.toLowerCase().includes('mbbs') || course.toLowerCase().includes('medical')));
    const colg = isMed ? '11' : '1';
    const ext = isMed ? 'jpg' : 'JPG';
    return `https://myportal.srms.ac.in/srmserp/Registration/StudentDocument/${colg}/${cleanRoll}/${cleanRoll}.${ext}`;
  }

  // Final fallback: ui-avatars.com initials
  const seed = name || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=F97316&color=fff&size=250&bold=true`;
}

/**
 * Returns an ordered array of candidate photo URLs to attempt in sequence.
 * SafeStudentAvatar cycles through them until one loads successfully.
 */
export function getAvatarCandidates(nameOrUri, rollno) {
  const candidates = [];
  const cleanRoll = rollno && typeof rollno === 'string' ? rollno.trim() : null;

  // 1. Direct URI if valid HTTP (non-placeholder)
  if (nameOrUri && typeof nameOrUri === 'string' && nameOrUri.startsWith('http')) {
    if (!nameOrUri.includes('pravatar.cc') && !nameOrUri.includes('ui-avatars.com')) {
      candidates.push(nameOrUri);
    }
  }

  // 2. SRMS ERP Document Candidates
  if (cleanRoll) {
    const isMed = cleanRoll.toUpperCase().includes('MBBS');
    if (isMed) {
      candidates.push(`https://myportal.srms.ac.in/srmserp/Registration/StudentDocument/11/${cleanRoll}/${cleanRoll}.jpg`);
      candidates.push(`https://myportal.srms.ac.in/srmserp/Registration/StudentDocument/11/${cleanRoll}/${cleanRoll}.JPG`);
      candidates.push(`https://myportal.srms.ac.in/SRMSERP/Registration/StudentDocument/11/${cleanRoll}/${cleanRoll}.jpg`);
      candidates.push(`https://myportal.srms.ac.in/srmserp/Registration/StudentDocument/12/${cleanRoll}/${cleanRoll}.jpg`);
    } else {
      candidates.push(`https://myportal.srms.ac.in/srmserp/Registration/StudentDocument/1/${cleanRoll}/${cleanRoll}.JPG`);
      candidates.push(`https://myportal.srms.ac.in/srmserp/Registration/StudentDocument/1/${cleanRoll}/${cleanRoll}.jpg`);
      candidates.push(`https://myportal.srms.ac.in/SRMSERP/Registration/StudentDocument/1/${cleanRoll}/${cleanRoll}.JPG`);
      candidates.push(`https://myportal.srms.ac.in/srmserp/Registration/StudentDocument/11/${cleanRoll}/${cleanRoll}.jpg`);
      candidates.push(`https://myportal.srms.ac.in/srmserp/Registration/StudentDocument/10/${cleanRoll}/${cleanRoll}.JPG`);
      candidates.push(`https://myportal.srms.ac.in/srmserp/Registration/StudentDocument/13/${cleanRoll}/${cleanRoll}.JPG`);
    }
  }

  // Remove duplicates while preserving order
  return [...new Set(candidates)];
}

