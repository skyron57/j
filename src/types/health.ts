export type HealthStatus = 'Excellente' | 'Bonne' | 'Satisfaisante' | 'Mauvaise' | 'Critique';

export const getHealthStatus = (health: number): HealthStatus => {
  if (health >= 100) return 'Excellente';
  if (health >= 70) return 'Bonne';
  if (health >= 60) return 'Satisfaisante';
  if (health >= 30) return 'Mauvaise';
  if (health >= 10) return 'Critique';
  return 'Critique';
};

export const HEALTH_STATUS_COLORS: Record<HealthStatus, string> = {
  'Excellente': 'text-green-500',
  'Bonne': 'text-green-400',
  'Satisfaisante': 'text-yellow-500',
  'Mauvaise': 'text-orange-500',
  'Critique': 'text-red-500'
};
