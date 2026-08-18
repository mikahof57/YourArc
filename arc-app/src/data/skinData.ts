export interface CyberSkin {
  id: string;
  name: string;
  category: 'avatar' | 'title' | 'frame';
  skinCategory: 'Athlet & Sport' | 'Mindset & Zen' | 'Business & Leader' | 'Exzellenz & Fokus' | 'Spezial';
  price: number;
  description: string;
  avatarUrl?: string;
  frameColor?: string;
  titleName?: string;
  badgeText?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  visualDetails?: string;
}

// Helper to generate SVG Data URLs for clean vector avatars (no real human photos)
const makeSvgAvatar = (bgGrad: string, accentColor: string, innerSvg: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        ${bgGrad}
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <rect width="200" height="200" rx="40" fill="url(#bg)" />
    <circle cx="100" cy="100" r="85" fill="none" stroke="${accentColor}" stroke-width="2" stroke-dasharray="6,6" opacity="0.4" />
    <g transform="translate(100,100)">
      ${innerSvg}
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const AVAILABLE_SKINS: CyberSkin[] = [
  // ================= CATEGORY 1: ATHLET & SPORT =================
  {
    id: 'skin_sport_1',
    name: 'Eiserner Wille',
    category: 'avatar',
    skinCategory: 'Athlet & Sport',
    price: 100,
    description: 'Steht für unerschütterliche Ausdauer, tägliche Disziplin und harter körperlicher Einsatz.',
    visualDetails: 'Symbolisiert eiserne Hingabe. Schlagwort: Fleißig.',
    avatarUrl: makeSvgAvatar(
      '<stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/>',
      '#38bdf8',
      `<path d="M-30,-20 L30,-20 L20,20 L-20,20 Z" fill="#0284c7" />
       <rect x="-45" y="-12" width="15" height="24" rx="4" fill="#38bdf8" />
       <rect x="30" y="-12" width="15" height="24" rx="4" fill="#38bdf8" />
       <rect x="-55" y="-18" width="10" height="36" rx="3" fill="#0284c7" />
       <rect x="45" y="-18" width="10" height="36" rx="3" fill="#0284c7" />
       <circle cx="0" cy="0" r="8" fill="#f8fafc" />`
    ),
    rarity: 'common',
  },
  {
    id: 'skin_sport_2',
    name: 'Peak Performer',
    category: 'avatar',
    skinCategory: 'Athlet & Sport',
    price: 250,
    description: 'Steht für körperliche Höchstleistung, gezieltes Aufbautraining und messbaren Fortschritt.',
    visualDetails: 'Symbolisiert athletische Exzellenz. Schlagwort: Diszipliniert.',
    avatarUrl: makeSvgAvatar(
      '<stop offset="0%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#312e81"/>',
      '#818cf8',
      `<path d="M-40,30 L0,-45 L40,30 L20,30 L0,-10 L-20,30 Z" fill="#6366f1" filter="url(#glow)"/>
       <path d="M-20,30 L0,-10 L20,30 Z" fill="#a5b4fc" />
       <polygon points="0,-45 10,-20 0,-25 -10,-20" fill="#f43f5e" />`
    ),
    rarity: 'rare',
  },
  {
    id: 'skin_sport_3',
    name: 'Marathon Mindset',
    category: 'avatar',
    skinCategory: 'Athlet & Sport',
    price: 350,
    description: 'Steht für Ausdauer auf langen Strecken, stetiges Durchhalten und kontinuierliche Bewegung.',
    visualDetails: 'Symbolisiert unermüdliche Energie. Schlagwort: Fleißig.',
    avatarUrl: makeSvgAvatar(
      '<stop offset="0%" stop-color="#064e3b"/><stop offset="100%" stop-color="#022c22"/>',
      '#34d399',
      `<path d="M-30,20 C-10,-40 10,-40 30,-10 C10,0 -10,10 -30,20 Z" fill="#10b981" />
       <path d="M-10,-30 L20,-30 L35,10 L5,10 Z" fill="#34d399" opacity="0.8" />
       <circle cx="-10" cy="-10" r="14" fill="#a7f3d0" />
       <path d="M0,35 L15,10 L-20,10 Z" fill="#059669" />`
    ),
    rarity: 'rare',
  },
  {
    id: 'skin_sport_4',
    name: 'Titan Athlet',
    category: 'avatar',
    skinCategory: 'Athlet & Sport',
    price: 600,
    description: 'Steht für unaufhaltsame Kraft, eiserne Zähigkeit und den täglichen Kampf gegen eigenen Ausreden.',
    visualDetails: 'Symbolisiert unverwüstliche Stärke. Schlagwort: Diszipliniert.',
    avatarUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" rx="40" fill="#111827"/>
      <path d="M100 25 L160 55 L160 120 C160 155 100 180 100 180 C100 180 40 155 40 120 L40 55 Z" fill="#1f2937" stroke="#f59e0b" stroke-width="4"/>
      <path d="M100 45 L140 68 L140 115 C140 140 100 160 100 160 C100 160 60 140 60 115 L60 68 Z" fill="#f59e0b" opacity="0.2"/>
      <polygon points="100,60 112,88 142,90 118,108 126,138 100,120 74,138 82,108 58,90 88,88" fill="#fbbf24"/>
    </svg>`),
    rarity: 'epic',
  },
  {
    id: 'skin_sport_5',
    name: 'Apex Champion',
    category: 'avatar',
    skinCategory: 'Athlet & Sport',
    price: 1200,
    description: 'Steht für die absolute Spitze des Sports, Goldmedaillen-Standard und bedingungslosen Siegeswillen.',
    visualDetails: 'Höchste sportliche Trophäe. Schlagwort: Diszipliniert.',
    avatarUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#eab308"/>
          <stop offset="100%" stop-color="#854d0e"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="40" fill="#0f172a"/>
      <circle cx="100" cy="100" r="75" fill="none" stroke="url(#goldGrad)" stroke-width="6"/>
      <path d="M60 60 L140 60 L125 110 C125 130 100 140 100 140 C100 140 75 130 75 110 Z" fill="url(#goldGrad)"/>
      <path d="M100 140 L100 165 M80 165 L120 165" stroke="url(#goldGrad)" stroke-width="8" stroke-linecap="round"/>
      <path d="M50 70 C35 70 35 100 65 100 M150 70 C165 70 165 100 135 100" fill="none" stroke="url(#goldGrad)" stroke-width="5"/>
    </svg>`),
    rarity: 'legendary',
  },

  // ================= CATEGORY 2: MINDSET & ZEN =================
  {
    id: 'skin_zen_1',
    name: 'Stoischer Ruhepol',
    category: 'avatar',
    skinCategory: 'Mindset & Zen',
    price: 120,
    description: 'Steht für innere Gelassenheit, stoische Ruhe im Sturm und emotionale Souveränität.',
    visualDetails: 'Symbolisiert stoische Ausgeglichenheit. Schlagwort: Zen-Meister.',
    avatarUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" rx="40" fill="#0f172a"/>
      <circle cx="100" cy="100" r="70" fill="#1e293b" stroke="#38bdf8" stroke-width="3"/>
      <path d="M100 30 A70 70 0 0 1 100 170 A35 35 0 0 0 100 100 A35 35 0 0 1 100 30" fill="#38bdf8"/>
      <circle cx="100" cy="65" r="10" fill="#0f172a"/>
      <circle cx="100" cy="135" r="10" fill="#38bdf8"/>
    </svg>`),
    rarity: 'common',
  },
  {
    id: 'skin_zen_2',
    name: 'Tiefer Fokus',
    category: 'avatar',
    skinCategory: 'Mindset & Zen',
    price: 280,
    description: 'Steht für messerscharfe Konzentration, das Eliminieren aller Störfaktoren und pure Gegenwärtigkeit.',
    visualDetails: 'Symbolisiert absolute mental Fokus-Zone. Schlagwort: Diszipliniert.',
    avatarUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" rx="40" fill="#022c22"/>
      <circle cx="100" cy="100" r="75" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="8 4"/>
      <circle cx="100" cy="100" r="50" fill="none" stroke="#34d399" stroke-width="3"/>
      <circle cx="100" cy="100" r="25" fill="none" stroke="#6ee7b7" stroke-width="4"/>
      <circle cx="100" cy="100" r="8" fill="#a7f3d0"/>
      <line x1="100" y1="10" x2="100" y2="190" stroke="#10b981" stroke-width="1.5" opacity="0.5"/>
      <line x1="10" y1="100" x2="190" y2="100" stroke="#10b981" stroke-width="1.5" opacity="0.5"/>
    </svg>`),
    rarity: 'rare',
  },
  {
    id: 'skin_zen_3',
    name: 'Mindset Architekt',
    category: 'avatar',
    skinCategory: 'Mindset & Zen',
    price: 400,
    description: 'Steht für die bewusste Gestaltung der eigenen Denkweisen, Überzeugungen und mentalen Stärke.',
    visualDetails: 'Symbolisiert konstruktiven Geist. Schlagwort: Fleißig.',
    avatarUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" rx="40" fill="#18181b"/>
      <g stroke="#a1a1aa" stroke-width="3" fill="none">
        <polygon points="100,30 160,70 160,140 100,180 40,140 40,70"/>
        <line x1="100" y1="30" x2="100" y2="180"/>
        <line x1="160" y1="70" x2="40" y2="140"/>
        <line x1="40" y1="70" x2="160" y2="140"/>
      </g>
      <circle cx="100" cy="105" r="16" fill="#e4e4e7" />
    </svg>`),
    rarity: 'rare',
  },
  {
    id: 'skin_zen_4',
    name: 'Zen Ausgleich',
    category: 'avatar',
    skinCategory: 'Mindset & Zen',
    price: 700,
    description: 'Steht für die perfekte Harmonie zwischen intensivem Schaffen und erholsamer mentaler Regeneration.',
    visualDetails: 'Symbolisiert Lotus-Klarheit. Schlagwort: Zen-Meister.',
    avatarUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" rx="40" fill="#2e1065"/>
      <path d="M100 40 C120 80 160 100 160 120 C160 150 130 165 100 165 C70 165 40 150 40 120 C40 100 80 80 100 40 Z" fill="#a855f7" opacity="0.8"/>
      <path d="M100 70 C115 100 140 110 140 125 C140 145 120 155 100 155 C80 155 60 145 60 125 C60 110 85 100 100 70 Z" fill="#c084fc"/>
      <circle cx="100" cy="130" r="12" fill="#f3e8ff"/>
    </svg>`),
    rarity: 'epic',
  },
  {
    id: 'skin_zen_5',
    name: 'Meister der Stille',
    category: 'avatar',
    skinCategory: 'Mindset & Zen',
    price: 1500,
    description: 'Steht für meisterhafte Selbstbeherrschung, Erleuchtung durch Disziplin und unerschütterlichen Geist.',
    visualDetails: 'Goldene Erleuchtungs-Aura. Schlagwort: Zen-Meister.',
    avatarUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" rx="40" fill="#020617"/>
      <circle cx="100" cy="100" r="80" fill="none" stroke="#f59e0b" stroke-width="3" stroke-dasharray="4 8"/>
      <circle cx="100" cy="100" r="65" fill="#1e1b4b" stroke="#818cf8" stroke-width="2"/>
      <polygon points="100,45 115,85 155,100 115,115 100,155 85,115 45,100 85,85" fill="#f59e0b"/>
      <circle cx="100" cy="100" r="15" fill="#ffffff"/>
    </svg>`),
    rarity: 'legendary',
  },

  // ================= CATEGORY 3: BUSINESS & LEADER =================
  {
    id: 'skin_biz_1',
    name: 'Visionärer Strategie-Kopf',
    category: 'avatar',
    skinCategory: 'Business & Leader',
    price: 150,
    description: 'Steht für Weitblick, strategische Planung, analytisches Denken und zielgerichtete Projektführung.',
    visualDetails: 'Symbolisiert analytischen Verstand. Schlagwort: Teamleader.',
    avatarUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" rx="40" fill="#0f172a"/>
      <rect x="50" y="50" width="100" height="100" rx="20" fill="#1e293b" stroke="#38bdf8" stroke-width="3"/>
      <path d="M70 120 L95 90 L115 105 L135 75" fill="none" stroke="#38bdf8" stroke-width="5" stroke-linecap="round"/>
      <circle cx="135" cy="75" r="6" fill="#f0f9ff"/>
    </svg>`),
    rarity: 'common',
  },
  {
    id: 'skin_biz_2',
    name: 'High-Performance CEO',
    category: 'avatar',
    skinCategory: 'Business & Leader',
    price: 300,
    description: 'Steht für unternehmerische Entschlossenheit, hohe Verantwortung und konsequente Resultate.',
    visualDetails: 'Symbolisiert operative Exzellenz. Schlagwort: Teamleader.',
    avatarUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" rx="40" fill="#111827"/>
      <path d="M50 150 L100 50 L150 150 Z" fill="#1f2937" stroke="#10b981" stroke-width="4"/>
      <path d="M70 150 L100 90 L130 150 Z" fill="#10b981"/>
      <line x1="50" y1="150" x2="150" y2="150" stroke="#34d399" stroke-width="6"/>
    </svg>`),
    rarity: 'rare',
  },
  {
    id: 'skin_biz_3',
    name: 'Netzwerk Strategist',
    category: 'avatar',
    skinCategory: 'Business & Leader',
    price: 450,
    description: 'Steht für effektiven Beziehungsaufbau, Synergien im Team und wertvolles Networking.',
    visualDetails: 'Symbolisiert Vernetzung. Schlagwort: Teamleader.',
    avatarUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" rx="40" fill="#0f172a"/>
      <g stroke="#38bdf8" stroke-width="3">
        <line x1="100" y1="60" x2="50" y2="130"/>
        <line x1="100" y1="60" x2="150" y2="130"/>
        <line x1="50" y1="130" x2="150" y2="130"/>
      </g>
      <circle cx="100" cy="60" r="16" fill="#0284c7" stroke="#f0f9ff" stroke-width="3"/>
      <circle cx="50" cy="130" r="14" fill="#0284c7" stroke="#f0f9ff" stroke-width="3"/>
      <circle cx="150" cy="130" r="14" fill="#0284c7" stroke="#f0f9ff" stroke-width="3"/>
    </svg>`),
    rarity: 'rare',
  },
  {
    id: 'skin_biz_4',
    name: 'Monopolist Sovereign',
    category: 'avatar',
    skinCategory: 'Business & Leader',
    price: 800,
    description: 'Steht für finanzielle Freiheit, Marktführerschaft und beispiellose Skalierung von Projekten.',
    visualDetails: 'Symbolisiert Wohlstand & Souveränität. Schlagwort: Fleißig.',
    avatarUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" rx="40" fill="#064e3b"/>
      <circle cx="100" cy="100" r="65" fill="#047857" stroke="#a7f3d0" stroke-width="4"/>
      <text x="100" y="125" font-family="sans-serif" font-size="70" font-weight="900" fill="#f0fdf4" text-anchor="middle">€</text>
    </svg>`),
    rarity: 'epic',
  },
  {
    id: 'skin_biz_5',
    name: 'Global Titan Leader',
    category: 'avatar',
    skinCategory: 'Business & Leader',
    price: 2000,
    description: 'Steht für weltweiten Einfluss, zeitlose Führung, Inspiration für Tausende und wahres Unternehmertum.',
    visualDetails: 'Goldene Krone der Führung. Schlagwort: Teamleader.',
    avatarUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fbbf24"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="40" fill="#18181b"/>
      <path d="M40 140 L45 70 L75 105 L100 50 L125 105 L155 70 L160 140 Z" fill="url(#crownGrad)" stroke="#fef08a" stroke-width="3"/>
      <rect x="40" y="145" width="120" height="15" rx="4" fill="url(#crownGrad)"/>
      <circle cx="45" cy="65" r="7" fill="#f43f5e"/>
      <circle cx="100" cy="45" r="9" fill="#38bdf8"/>
      <circle cx="155" cy="65" r="7" fill="#f43f5e"/>
    </svg>`),
    rarity: 'legendary',
  },

  // ================= CATEGORY 4: EXZELLENZ & FOKUS =================
  {
    id: 'skin_fokus_1',
    name: 'Frühaufsteher 05:00',
    category: 'avatar',
    skinCategory: 'Exzellenz & Fokus',
    price: 130,
    description: 'Steht für den unfairen Vorteil durch frühes Aufstehen, Morgenroutinen und ungestörte Morgenstunden.',
    visualDetails: 'Symbolisiert den Start vor Sonnenaufgang. Schlagwort: Fleißig.',
    avatarUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" rx="40" fill="#0f172a"/>
      <path d="M30 140 A70 70 0 0 1 170 140 Z" fill="#f59e0b"/>
      <line x1="20" y1="140" x2="180" y2="140" stroke="#fbbf24" stroke-width="4"/>
      <text x="100" y="175" font-family="monospace" font-size="22" font-weight="bold" fill="#f8fafc" text-anchor="middle">05:00 AM</text>
    </svg>`),
    rarity: 'common',
  },
  {
    id: 'skin_fokus_2',
    name: 'Deep Work Spezialist',
    category: 'avatar',
    skinCategory: 'Exzellenz & Fokus',
    price: 320,
    description: 'Steht für mehrstündige, hyper-produktive Arbeitsphasen ohne jede Ablenkung oder Social Media.',
    visualDetails: 'Symbolisiert konzentrierten Schaffens-Flow. Schlagwort: Fleißig.',
    avatarUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" rx="40" fill="#1e1b4b"/>
      <path d="M100 30 C135 30 165 60 165 95 C165 145 100 175 100 175 C100 175 35 145 35 95 C35 60 65 30 100 30 Z" fill="#4338ca"/>
      <circle cx="100" cy="95" r="25" fill="#818cf8"/>
      <polygon points="100,75 108,90 125,95 110,105 115,120 100,110 85,120 90,105 75,95 92,90" fill="#e0e7ff"/>
    </svg>`),
    rarity: 'rare',
  },
  {
    id: 'skin_fokus_3',
    name: 'Consistency King',
    category: 'avatar',
    skinCategory: 'Exzellenz & Fokus',
    price: 480,
    description: 'Steht für makellose Beständigkeit über Wochen und Monate – Tag für Tag ohne Ausreden geliefert.',
    visualDetails: 'Symbolisiert tägliche Wiederholung. Schlagwort: Diszipliniert.',
    avatarUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" rx="40" fill="#0f172a"/>
      <g fill="#10b981">
        <rect x="40" y="50" width="30" height="30" rx="6"/>
        <rect x="85" y="50" width="30" height="30" rx="6"/>
        <rect x="130" y="50" width="30" height="30" rx="6"/>
        <rect x="40" y="95" width="30" height="30" rx="6"/>
        <rect x="85" y="95" width="30" height="30" rx="6"/>
        <rect x="130" y="95" width="30" height="30" rx="6"/>
        <rect x="40" y="140" width="30" height="30" rx="6"/>
        <rect x="85" y="140" width="30" height="30" rx="6"/>
        <rect x="130" y="140" width="30" height="30" rx="6" fill="#34d399"/>
      </g>
    </svg>`),
    rarity: 'rare',
  },
  {
    id: 'skin_fokus_4',
    name: 'Habit Master',
    category: 'avatar',
    skinCategory: 'Exzellenz & Fokus',
    price: 850,
    description: 'Steht für die vollendete Automatisierung positiver Lebensgewohnheiten in Sport, Geist und Beruf.',
    visualDetails: 'Symbolisiert unzerbrechliche Ketten. Schlagwort: Diszipliniert.',
    avatarUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" rx="40" fill="#18181b"/>
      <circle cx="100" cy="100" r="70" fill="none" stroke="#f59e0b" stroke-width="8"/>
      <path d="M70 100 L90 120 L135 75" fill="none" stroke="#f59e0b" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`),
    rarity: 'epic',
  },

  // ================= SPECIAL TITLES =================
  {
    id: 'title_teamleader',
    name: 'Titel: Teamleader',
    category: 'title',
    skinCategory: 'Spezial',
    price: 150,
    description: 'Zeigt den offiziellen Titel "Teamleader" im Profil an.',
    titleName: 'Teamleader',
    rarity: 'rare',
  },
  {
    id: 'title_zenmaster',
    name: 'Titel: Zen-Meister',
    category: 'title',
    skinCategory: 'Spezial',
    price: 300,
    description: 'Zeigt den erhabenen Titel "Zen-Meister" im Profil an.',
    titleName: 'Zen-Meister',
    rarity: 'legendary',
  },
];

export const translateSkinName = (skin: CyberSkin, lang: string = 'de'): string => {
  if (lang !== 'en') return skin.name;
  const map: Record<string, string> = {
    skin_sport_1: 'Iron Will',
    skin_sport_2: 'Peak Performer',
    skin_sport_3: 'Marathon Mindset',
    skin_sport_4: 'Titan Strength',
    skin_sport_5: 'Olympian Dominator',
    skin_zen_1: 'Stoic Anchor',
    skin_zen_2: 'Deep Focus',
    skin_zen_3: 'Mindset Architect',
    skin_zen_4: 'Zen Equilibrium',
    skin_zen_5: 'Master of Stillness',
    skin_mind_1: 'Zen Master',
    skin_mind_2: 'Stoic Warrior',
    skin_mind_3: 'Deep Focus',
    skin_mind_4: 'Clarity of Mind',
    skin_mind_5: 'Monk Discipline',
    skin_biz_1: 'Visionary Strategist',
    skin_biz_2: 'High-Performance CEO',
    skin_biz_3: 'Network Strategist',
    skin_biz_4: 'Monopolist Sovereign',
    skin_biz_5: 'Global Titan Leader',
    skin_fokus_1: 'Early Riser 05:00',
    skin_fokus_2: 'Deep Work Specialist',
    skin_fokus_3: 'Consistency King',
    skin_fokus_4: 'Habit Master',
    skin_ex_1: 'Protocol Excellence',
    skin_ex_2: 'Unstoppable Momentum',
    skin_ex_3: 'Mastermind',
    skin_ex_4: 'Surgical Precision',
    skin_ex_5: 'Apex Dominator',
    skin_spec_1: 'Cyber Overlord',
    skin_spec_2: 'Golden Legend',
    skin_spec_3: 'Shadow Operator',
    skin_spec_4: 'Quantum Entity',
    skin_spec_5: 'Starlight Sovereign',
    title_teamleader: 'Title: Team Leader',
    title_zenmaster: 'Title: Zen Master',
  };
  return map[skin.id] || skin.name;
};

export const translateSkinDesc = (skin: CyberSkin, lang: string = 'de'): string => {
  if (lang !== 'en') return skin.description;
  const map: Record<string, string> = {
    skin_sport_1: 'Stands for unwavering endurance, daily discipline, and hard physical effort.',
    skin_sport_2: 'Stands for peak physical performance, targeted strength building, and measurable progress.',
    skin_sport_3: 'Master long-distance discipline, pacing control, and mental endurance for every challenge.',
    skin_sport_4: 'Pure raw power and unbreakable resilience built through relentless daily training.',
    skin_sport_5: 'The ultimate athletic status. Unlocks the golden aura of true competitive dominance.',
    skin_zen_1: 'Inner composure, stoic calm amidst the storm, and emotional sovereignty.',
    skin_zen_2: 'Razor-sharp concentration, eliminating all distractions, and pure presence.',
    skin_zen_3: 'Conscious shaping of mindsets, beliefs, and unyielding mental fortitude.',
    skin_zen_4: 'Perfect harmony between intense creation and restorative mental regeneration.',
    skin_zen_5: 'Masterful self-control, enlightenment through discipline, and an unshakable spirit.',
    skin_biz_1: 'Visionary foresight, strategic planning, analytical thinking, and goal-oriented execution.',
    skin_biz_2: 'Entrepreneurial determination, high accountability, and relentless results.',
    skin_biz_3: 'Effective relationship building, team synergies, and high-value networking.',
    skin_biz_4: 'Financial freedom, market leadership, and unprecedented project scaling.',
    skin_biz_5: 'Global influence, timeless leadership, inspiration for thousands, and true entrepreneurship.',
    skin_fokus_1: 'The unfair advantage of early mornings, powerful routines, and undisturbed focus hours.',
    skin_fokus_2: 'Multi-hour, hyper-productive work blocks without any distraction or social media.',
    skin_fokus_3: 'Flawless consistency over weeks and months — showing up every single day without excuses.',
    skin_fokus_4: 'Complete automation of positive life habits across physical, mental, and professional realms.',
    title_teamleader: 'Displays the official "Team Leader" title on your profile.',
    title_zenmaster: 'Displays the exalted "Zen Master" title on your profile.',
  };
  return map[skin.id] || skin.description;
};
