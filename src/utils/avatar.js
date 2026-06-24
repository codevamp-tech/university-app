export function getAvatarUrl(name) {
  const seed = name || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=F97316&color=fff&size=250&bold=true`;
}
