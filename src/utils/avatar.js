export function getAvatarUrl(name, nameFallback) {
  if (name && typeof name === 'string' && name.startsWith('http')) {
    if (name.includes('pravatar.cc')) {
      let seed = nameFallback || 'User';
      // Attempt to extract name from url e.g. ?u=rohan
      const match = name.match(/[?&]u=([^&]+)/);
      if (match && match[1]) {
        seed = decodeURIComponent(match[1]);
      }
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=F97316&color=fff&size=250&bold=true`;
    }
    return name;
  }
  const seed = nameFallback || name || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=F97316&color=fff&size=250&bold=true`;
}
