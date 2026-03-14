/** Animal options for default avatar when user has no profile image (10 animals) */
export const AVATAR_ANIMALS = [
  'cat',
  'dog',
  'fox',
  'bear',
  'rabbit',
  'panda',
  'owl',
  'wolf',
  'lion',
  'monkey',
] as const;

export type AvatarAnimal = (typeof AVATAR_ANIMALS)[number];

/** Returns a random animal for new users */
export function getDefaultAvatarAnimal(): AvatarAnimal {
  return AVATAR_ANIMALS[Math.floor(Math.random() * AVATAR_ANIMALS.length)];
}

/** Twemoji CDN: actual animal emoji images (cat, dog, fox, bear, rabbit, panda, owl, wolf) */
const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72';
const ANIMAL_EMOJI_CODEPOINTS: Record<string, string> = {
  cat: '1f431',
  dog: '1f436',
  fox: '1f98a',
  bear: '1f43b',
  rabbit: '1f430',
  panda: '1f43c',
  owl: '1f989',
  wolf: '1f43a',
  lion: '1f981',
  monkey: '1f412',
};

/** Avatar URL for a given animal: returns actual animal image (Twemoji) */
export function getAnimalAvatarUrl(animal: string): string {
  const code = ANIMAL_EMOJI_CODEPOINTS[animal.toLowerCase()] ?? ANIMAL_EMOJI_CODEPOINTS.cat;
  return `${TWEMOJI_BASE}/${code}.png`;
}

/** Resolve display avatar URL: use image if set, else animal avatar */
export function getAvatarUrl(image: string | null | undefined, avatarAnimal: string | null | undefined): string {
  if (image?.trim()) return image;
  const animal = avatarAnimal?.trim() || AVATAR_ANIMALS[0];
  return getAnimalAvatarUrl(animal);
}

/** True if URL is an actual SSO profile image (e.g. Google), not our animal fallback */
export function isSsoImage(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const u = url.trim();
  if (!u.startsWith('http://') && !u.startsWith('https://')) return false;
  return !u.includes('cdn.jsdelivr.net');
}

export function isAvatarAnimal(value: string): value is AvatarAnimal {
  return AVATAR_ANIMALS.includes(value as AvatarAnimal);
}
