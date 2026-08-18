import animeMaleImg from '../assets/images/anime_male_avatar_1786203723233.jpg';
import animeFemaleImg from '../assets/images/anime_female_avatar_1786203738274.jpg';
import superheroMaleImg from '../assets/images/superhero_male_avatar_1786203751969.jpg';
import superheroFemaleImg from '../assets/images/superhero_female_avatar_1786203766332.jpg';
import comicMaleImg from '../assets/images/comic_male_avatar_1786203781095.jpg';
import comicFemaleImg from '../assets/images/comic_female_avatar_1786203797170.jpg';

export interface AvatarOption {
  id: string;
  name: string;
  category: 'superheroes' | 'anime' | 'comic';
  gender: 'm' | 'f';
  url: string;
}

export const AVATAR_PRESETS: AvatarOption[] = [
  // Anime Badass - Male
  {
    id: 'anime-m-1',
    name: 'Shadow Monarch (Solo)',
    category: 'anime',
    gender: 'm',
    url: animeMaleImg,
  },
  {
    id: 'anime-m-2',
    name: 'Ronin Cyber Blade',
    category: 'anime',
    gender: 'm',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=RoninCyberBlade&hair=short04&hairColor=0f172a&skinColor=f2d3b1&eyes=variant12',
  },
  {
    id: 'anime-m-3',
    name: 'Neon Shinobi',
    category: 'anime',
    gender: 'm',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=NeonShinobiX&hair=short02&hairColor=00f0ff&skinColor=f2d3b1',
  },

  // Anime Badass - Female
  {
    id: 'anime-f-1',
    name: 'Kitsune Cyber Blade',
    category: 'anime',
    gender: 'f',
    url: animeFemaleImg,
  },
  {
    id: 'anime-f-2',
    name: 'Cyber Samurai Queen',
    category: 'anime',
    gender: 'f',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=CyberSamuraiQueen&hairColor=ec4899&skinColor=f2d3b1',
  },
  {
    id: 'anime-f-3',
    name: 'Mecha Maiden',
    category: 'anime',
    gender: 'f',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=MechaMaidenX&hairColor=00f0ff&skinColor=f2d3b1',
  },

  // Superheroes - Male
  {
    id: 'hero-m-1',
    name: 'Cyber Knight Prime',
    category: 'superheroes',
    gender: 'm',
    url: superheroMaleImg,
  },
  {
    id: 'hero-m-2',
    name: 'Apex Mech Armor',
    category: 'superheroes',
    gender: 'm',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ApexMechArmor&textureChance=100&colors[]=00f0ff&colors[]=3b82f6',
  },
  {
    id: 'hero-m-3',
    name: 'Neon Sentinel',
    category: 'superheroes',
    gender: 'm',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonSentinel9000&sidesChance=100&top[]=antenna&colors[]=00f0ff',
  },

  // Superheroes - Female
  {
    id: 'hero-f-1',
    name: 'Valkyrie Prime',
    category: 'superheroes',
    gender: 'f',
    url: superheroFemaleImg,
  },
  {
    id: 'hero-f-2',
    name: 'Cyber Operative Nova',
    category: 'superheroes',
    gender: 'f',
    url: 'https://api.dicebear.com/7.x/micah/svg?seed=NovaOperative&hair=pixie&hairColor=00f0ff&baseColor=f2d3b1',
  },

  // Comic - Male
  {
    id: 'comic-m-1',
    name: 'Noir Detective Titan',
    category: 'comic',
    gender: 'm',
    url: comicMaleImg,
  },
  {
    id: 'comic-m-2',
    name: 'Graphic Novel Titan',
    category: 'comic',
    gender: 'm',
    url: 'https://api.dicebear.com/7.x/notionists/svg?seed=GraphicNovelTitan&hair=short02&body=variant01',
  },

  // Comic - Female
  {
    id: 'comic-f-1',
    name: 'Neon Comic Heroine',
    category: 'comic',
    gender: 'f',
    url: comicFemaleImg,
  },
  {
    id: 'comic-f-2',
    name: 'Stealth Comic Phantom',
    category: 'comic',
    gender: 'f',
    url: 'https://api.dicebear.com/7.x/notionists/svg?seed=ComicStealthPhantom&hair=long01&body=variant02',
  },
];
