// The physical wheel every flap is mounted on. Order matters: a real split-flap
// unit can only rotate forward, never backward, so the sequence below is the
// actual path a flap travels when cycling from one character to the next.
// Blank sits first because tiles rest on blank between messages.

export const COLOR_TILE_PREFIX = "#";

// Named color tiles, rendered as solid swatches rather than characters.
export const COLOR_TILES = [
  "#red",
  "#orange",
  "#yellow",
  "#green",
  "#blue",
  "#violet",
  "#white",
  "#black",
] as const;

export const CHARACTER_WHEEL: readonly string[] = [
  " ",
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "0",
  "!", "@", "#", "$", "%", "&", "*", "(", ")",
  "-", "+", "=", ":", ";", "'", '"', ",", ".", "?", "/",
  ...COLOR_TILES,
];

const INDEX_BY_CHAR = new Map<string, number>(
  CHARACTER_WHEEL.map((c, i) => [c, i])
);

export function wheelIndex(char: string): number {
  const idx = INDEX_BY_CHAR.get(char);
  if (idx !== undefined) return idx;
  // Unknown characters (accents, emoji, lowercase) fold to nearest known glyph.
  const upper = char.toUpperCase();
  return INDEX_BY_CHAR.get(upper) ?? 0; // default to blank
}

export function charAt(index: number): string {
  const n = CHARACTER_WHEEL.length;
  return CHARACTER_WHEEL[((index % n) + n) % n];
}

export function isColorTile(char: string): boolean {
  return char.startsWith(COLOR_TILE_PREFIX);
}

/**
 * Returns the forward path of wheel indices from `from` to `to`, inclusive
 * of the destination, exclusive of the start. A flap can only spin forward,
 * so reaching a character "behind" the current one means wrapping around
 * the full wheel — exactly like the real hardware.
 */
export function forwardPath(fromChar: string, toChar: string): number[] {
  const from = wheelIndex(fromChar);
  const to = wheelIndex(toChar);
  const n = CHARACTER_WHEEL.length;
  if (from === to) return [];
  const steps = ((to - from) + n) % n;
  const path: number[] = [];
  for (let i = 1; i <= steps; i++) {
    path.push((from + i) % n);
  }
  return path;
}

export function normalizeChar(input: string): string {
  if (input.startsWith(COLOR_TILE_PREFIX)) return input;
  if (input === "") return " ";
  const upper = input.toUpperCase();
  return INDEX_BY_CHAR.has(upper) ? upper : " ";
}
