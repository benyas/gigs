export const MOROCCAN_CITIES = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Fès',
  'Tanger',
  'Agadir',
  'Meknès',
  'Oujda',
  'Kénitra',
  'Tétouan',
  'Salé',
  'Nador',
  'Mohammedia',
  'El Jadida',
  'Béni Mellal',
] as const;

export const GIG_CATEGORIES = [
  { name: 'Plomberie', slug: 'plomberie', icon: '🔧' },
  { name: 'Électricité', slug: 'electricite', icon: '⚡' },
  { name: 'Ménage', slug: 'menage', icon: '🧹' },
  { name: 'Déménagement', slug: 'demenagement', icon: '📦' },
  { name: 'Peinture', slug: 'peinture', icon: '🎨' },
  { name: 'Jardinage', slug: 'jardinage', icon: '🌿' },
  { name: 'Réparation', slug: 'reparation', icon: '🛠️' },
  { name: 'Cours particuliers', slug: 'cours-particuliers', icon: '📚' },
  { name: 'Photographie', slug: 'photographie', icon: '📷' },
  { name: 'Traiteur', slug: 'traiteur', icon: '🍽️' },
] as const;

export const REGIONS: Record<string, string> = {
  Casablanca: 'Casablanca-Settat',
  Rabat: 'Rabat-Salé-Kénitra',
  Marrakech: 'Marrakech-Safi',
  Fès: 'Fès-Meknès',
  Tanger: 'Tanger-Tétouan-Al Hoceïma',
  Agadir: 'Souss-Massa',
  Meknès: 'Fès-Meknès',
  Oujda: 'Oriental',
  Kénitra: 'Rabat-Salé-Kénitra',
  Tétouan: 'Tanger-Tétouan-Al Hoceïma',
  Salé: 'Rabat-Salé-Kénitra',
  Nador: 'Oriental',
  Mohammedia: 'Casablanca-Settat',
  'El Jadida': 'Casablanca-Settat',
  'Béni Mellal': 'Béni Mellal-Khénifra',
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;
