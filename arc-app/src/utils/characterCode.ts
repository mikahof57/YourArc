/** Generates a local, presentation-only character code without any account dependency. */
export function generateCharacterCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let index = 0; index < 4; index += 1) {
    randomPart += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return `CYBER-${randomPart}-${Math.floor(10 + Math.random() * 90)}`;
}
