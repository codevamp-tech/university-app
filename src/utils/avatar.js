export function getAvatarUrl(seed) {
  if (!seed) return 'https://robohash.org/default_cat?set=set4&bgset=bg1';
  return `https://robohash.org/${encodeURIComponent(seed)}?set=set4&bgset=bg1`;
}
