export interface ThemeOption {
  id: string;
  name: string;
  type: 'dark' | 'light';
  description: string;
  accent: string;
  accent2: string;
  bg: string;
  cardBg: string;
  border: string;
}

export const THEMES: ThemeOption[] = [
  {
    id: 'dark',
    name: 'Midnight Slate',
    type: 'dark',
    description: 'Deep navy elegan dengan aksen cyan & teal modern (Bawaan)',
    accent: '#06b6d4',
    accent2: '#14b8a6',
    bg: '#0a0e1a',
    cardBg: '#0f172a',
    border: 'rgba(255, 255, 255, 0.08)'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    type: 'dark',
    description: 'Nuansa futuristik high-tech dengan neon cyan, ungu listrik & magenta',
    accent: '#00f0ff',
    accent2: '#bd00ff',
    bg: '#080711',
    cardBg: '#15102a',
    border: 'rgba(189, 0, 255, 0.2)'
  },
  {
    id: 'emerald',
    name: 'Emerald Matrix',
    type: 'dark',
    description: 'Nuansa hijau terminal / pine forest yang sejuk & fokus di mata',
    accent: '#10b981',
    accent2: '#34d399',
    bg: '#040e0b',
    cardBg: '#07221b',
    border: 'rgba(16, 185, 129, 0.2)'
  },
  {
    id: 'sapphire',
    name: 'Royal Sapphire',
    type: 'dark',
    description: 'Biru royal samudra mewah dengan aksen sky blue & gold amber',
    accent: '#38bdf8',
    accent2: '#6366f1',
    bg: '#060b19',
    cardBg: '#0c1c3f',
    border: 'rgba(56, 189, 248, 0.2)'
  },
  {
    id: 'sunset',
    name: 'Sunset Amber',
    type: 'dark',
    description: 'Nuansa espresso gelap hangat dengan pendaran orange & emas senja',
    accent: '#f97316',
    accent2: '#f59e0b',
    bg: '#120b08',
    cardBg: '#241710',
    border: 'rgba(249, 115, 22, 0.2)'
  },
  {
    id: 'oled',
    name: 'Obsidian OLED',
    type: 'dark',
    description: 'Hitam pekat murni 100% hemat daya untuk layar OLED / AMOLED',
    accent: '#38bdf8',
    accent2: '#a855f7',
    bg: '#000000',
    cardBg: '#121212',
    border: 'rgba(255, 255, 255, 0.12)'
  },
  {
    id: 'light',
    name: 'Clean White',
    type: 'light',
    description: 'Mode terang minimalis Skandinavia dengan kontras tajam & bersih',
    accent: '#0891b2',
    accent2: '#0d9488',
    bg: '#f8fafc',
    cardBg: '#ffffff',
    border: 'rgba(0, 0, 0, 0.08)'
  },
  {
    id: 'nordic',
    name: 'Nordic Ice Frost',
    type: 'light',
    description: 'Mode terang es Arktik dengan sentuhan biru glacier yang segar',
    accent: '#0284c7',
    accent2: '#4f46e5',
    bg: '#f0f7ff',
    cardBg: '#ffffff',
    border: 'rgba(2, 132, 199, 0.15)'
  }
];
