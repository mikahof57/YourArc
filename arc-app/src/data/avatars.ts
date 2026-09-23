import animeMaleImg from '../assets/images/anime_male_avatar_1786203723233.jpg';
import animeFemaleImg from '../assets/images/anime_female_avatar_1786203738274.jpg';
import superheroMaleImg from '../assets/images/superhero_male_avatar_1786203751969.jpg';
import superheroFemaleImg from '../assets/images/superhero_female_avatar_1786203766332.jpg';
import comicMaleImg from '../assets/images/comic_male_avatar_1786203781095.jpg';
import comicFemaleImg from '../assets/images/comic_female_avatar_1786203797170.jpg';

/** Compatibility assets only: saved avatar URLs and the existing fallback still
 * reference these files. Keep them bundled; do not expose them as a picker. */
export const LEGACY_AVATAR_URLS = [
  animeMaleImg, animeFemaleImg, superheroMaleImg,
  superheroFemaleImg, comicMaleImg, comicFemaleImg,
] as const;

export const DEFAULT_AVATAR_URL = LEGACY_AVATAR_URLS[0];
