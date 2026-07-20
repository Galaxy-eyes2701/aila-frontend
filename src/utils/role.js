export function normalizeRole(role) {
  if (!role && role !== 0) return '';

  const value = String(role).trim();
  if (!value) return '';

  const normalized = value.toLowerCase();

  if (normalized.includes('admin')) return 'Admin';
  if (normalized.includes('expert')) return 'Expert';
  if (normalized.includes('learner')) return 'Learner';

  return value;
}
