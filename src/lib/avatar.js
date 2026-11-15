// Deterministic "random" avatar — same user always gets the same look,
// no external network calls or generated-image services involved.
const GRADIENTS = [
  ['#ff5722', '#ff3d00'],
  ['#e01b24', '#6d28d9'],
  ['#f59e0b', '#b45309'],
  ['#f43f5e', '#9f1239'],
  ['#10b981', '#047857'],
  ['#ff4500', '#3730a3'],
  ['#ec4899', '#9d174d'],
  ['#ff6b00', '#c2410c'],
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarStyle(seed) {
  const hash = hashString(String(seed || 'guest'));
  const [from, to] = GRADIENTS[hash % GRADIENTS.length];
  const rotate = hash % 360;
  return {
    background: `linear-gradient(${rotate}deg, ${from}, ${to})`,
  };
}

export function getInitials(name, email) {
  const source = (name || '').trim() || (email || '').trim();
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
