/** Onboarding identities only. Shop inventory and legacy avatars remain separate. */
export type OnboardingGender = 'm' | 'f';
export const ONBOARDING_CHARACTERS = [
  { gender: 'm', url: '/assets/characters/arc-male.svg', labels: { en: 'Male', de: 'Männlich' } },
  { gender: 'f', url: '/assets/characters/arc-female.svg', labels: { en: 'Female', de: 'Weiblich' } },
] as const;
