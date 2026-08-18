export interface InterfaceColorOption {
  id: string;
  name: string;
  nameEn?: string;
  hex: string;
  bgGlow: string;
  price: number;
  description: string;
  descriptionEn?: string;
}

export interface UIAnimationOption {
  id: string;
  name: string;
  nameEn?: string;
  price: number;
  description: string;
  descriptionEn?: string;
  complexity: string;
  complexityEn?: string;
  badge: string;
}

export const INTERFACE_COLOR_PALETTE: InterfaceColorOption[] = [
  {
    id: 'color_amber',
    name: 'Cyber Gold',
    nameEn: 'Cyber Gold',
    hex: '#f59e0b',
    bgGlow: 'rgba(245, 158, 11, 0.25)',
    price: 100,
    description: 'Goldener High-Performance Glanz. Hüllt HUD-Elemente und Hintergründe in warmes Cyber-Gold.',
    descriptionEn: 'Golden high-performance glow. Envelops HUD elements and backgrounds in warm cyber gold.',
  },
  {
    id: 'color_cyan',
    name: 'Neon Cyan (Standard)',
    nameEn: 'Neon Cyan (Standard)',
    hex: '#06b6d4',
    bgGlow: 'rgba(6, 182, 212, 0.25)',
    price: 0,
    description: 'Futuristisches Eisblau. Das Standard-Interface Design (von Beginn an enthalten).',
    descriptionEn: 'Futuristic ice blue. The standard interface design (included from the start).',
  },
  {
    id: 'color_emerald',
    name: 'Smaragd Grün',
    nameEn: 'Emerald Green',
    hex: '#10b981',
    bgGlow: 'rgba(16, 185, 129, 0.25)',
    price: 100,
    description: 'Fokus & Vitalität. Verleiht dem Interface eine smaragdgrüne Frische-Aura.',
    descriptionEn: 'Focus & vitality. Gives the interface an emerald green fresh aura.',
  },
  {
    id: 'color_purple',
    name: 'Plasma Violett',
    nameEn: 'Plasma Violet',
    hex: '#a855f7',
    bgGlow: 'rgba(168, 85, 247, 0.25)',
    price: 100,
    description: 'Mystisches Neon-Violett für tiefen Fokus und stoische Eleganz.',
    descriptionEn: 'Mystic neon violet for deep focus and stoic elegance.',
  },
  {
    id: 'color_rose',
    name: 'Neon Rose',
    nameEn: 'Neon Rose',
    hex: '#f43f5e',
    bgGlow: 'rgba(244, 63, 94, 0.25)',
    price: 100,
    description: 'Energiegeladenes Pink-Rot für maximale Intensität und Aufmerksamkeit.',
    descriptionEn: 'High-energy pink-red for maximum intensity and focus.',
  },
  {
    id: 'color_blue',
    name: 'Electric Blau',
    nameEn: 'Electric Blue',
    hex: '#3b82f6',
    bgGlow: 'rgba(59, 130, 246, 0.25)',
    price: 100,
    description: 'Tiefes Ozeanblau. Bringt klare Strukturen und ruhige Seriosität auf den Bildschirm.',
    descriptionEn: 'Deep ocean blue. Brings clear structure and calm clarity to your display.',
  },
  {
    id: 'color_silver',
    name: 'Titan Silber',
    nameEn: 'Titanium Silver',
    hex: '#e2e8f0',
    bgGlow: 'rgba(226, 232, 240, 0.25)',
    price: 100,
    description: 'Edler Metall-Schimmer für edles, minimalistisches Design.',
    descriptionEn: 'Refined metallic shimmer for sleek, minimalist design.',
  },
  {
    id: 'color_orange',
    name: 'Solar Orange',
    nameEn: 'Solar Orange',
    hex: '#f97316',
    bgGlow: 'rgba(249, 115, 22, 0.25)',
    price: 100,
    description: 'Kräftiges Sonnenfeuer für motivierenden Elan und dynamische Akzente.',
    descriptionEn: 'Vibrant solar fire for motivating energy and dynamic accents.',
  },
];

export const UI_ANIMATION_OPTIONS: UIAnimationOption[] = [
  {
    id: 'anim_gold_rain',
    name: 'Langsamer Geldregen',
    nameEn: 'Slow Money Rain',
    price: 750,
    description: 'Goldene Münzen & Credits schweben sanft und grazil im Hintergrund der App herunter.',
    descriptionEn: 'Golden coins & credits float gracefully down in the background of the app.',
    complexity: 'Extrem / Premium',
    complexityEn: 'Extreme / Premium',
    badge: '750 Credits',
  },
  {
    id: 'anim_electric_lines',
    name: 'Elektrischer Strom',
    nameEn: 'Electric Current',
    price: 500,
    description: 'Elektrische Hochspannungsimpulse fließen entlang der feinen Linien und Ränder der Rahmen.',
    descriptionEn: 'High voltage electrical pulses flow along the fine lines and borders.',
    complexity: 'Hoch',
    complexityEn: 'High',
    badge: '500 Credits',
  },
  {
    id: 'anim_matrix_stream',
    name: 'Cyber Code Stream',
    nameEn: 'Cyber Code Stream',
    price: 400,
    description: 'Smaragdgrüne und neon-blaue Datenströme bewegen sich vertikal durch das Interface.',
    descriptionEn: 'Emerald green and neon blue data streams cascade vertically through the interface.',
    complexity: 'Mittel-Hoch',
    complexityEn: 'Medium-High',
    badge: '400 Credits',
  },
  {
    id: 'anim_zen_aura',
    name: 'Zen Aura Dust',
    nameEn: 'Zen Aura Dust',
    price: 350,
    description: 'Subtile, beruhigende Lichtpartikel steigen langsam auf und schaffen eine fokussierte Atmosphäre.',
    descriptionEn: 'Subtle, calming light particles rise gently, creating a focused atmosphere.',
    complexity: 'Mittel',
    complexityEn: 'Medium',
    badge: '350 Credits',
  },
  {
    id: 'anim_gentle_rain',
    name: 'Sanfter Regen',
    nameEn: 'Gentle Rain',
    price: 250,
    description: 'Ein beruhigender, feiner Sommerregen zieht diagonal im Hintergrund vorbei.',
    descriptionEn: 'A soothing, fine summer rain drifts diagonally across the background.',
    complexity: 'Basis',
    complexityEn: 'Basic',
    badge: '250 Credits',
  },
];
