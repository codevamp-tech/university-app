export function getAvatarUrl(name) {
  if (name && typeof name === 'string' && name.startsWith('http')) {
    if (name.includes('pravatar.cc')) {
      return `https://ui-avatars.com/api/?name=User&background=F97316&color=fff&size=250&bold=true`;
    }
    return name;
  }
  const seed = name || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=F97316&color=fff&size=250&bold=true`;
}
