const ICON_COLOR_MAP: Record<string, string> = {
  Y: "#yellow",
  W: "#white",
  B: "#blue",
  V: "#violet",
  G: "#green",
  O: "#orange",
  R: "#red",
};

const ICONS: Record<string, string[]> = {
  sun: [
    "  YYYYY  ",
    " YYYYYYY ",
    "YYYYYYYYY",
    "YYYYYYYYY",
    " YYYYYYY ",
    "  YYYYY  ",
  ],
  partlyCloudy: [
    "YY       ",
    "YYY WW   ",
    " Y WWWWW ",
    "  WWWWWWW",
    "  WWWWWWW",
    "         ",
  ],
  cloud: [
    "   WWW   ",
    "  WWWWW  ",
    " WWWWWWW ",
    "WWWWWWWWW",
    "WWWWWWWWW",
    "         ",
  ],
  fog: [
    "         ",
    "WWWWWWWWW",
    "         ",
    "WWWWWWWWW",
    "         ",
    "WWWWWWWWW",
  ],
  rain: [
    "  WWWWW  ",
    " WWWWWWW ",
    "WWWWWWWWW",
    " B B B B ",
    "B B B B B",
    " B B B B ",
  ],
  snow: [
    "  WWWWW  ",
    " WWWWWWW ",
    "WWWWWWWWW",
    " W W W W ",
    "W W W W W",
    " W W W W ",
  ],
  storm: [
    "  WWWWW  ",
    " WWWWWWW ",
    "WWWWWWWWW",
    "   VV    ",
    "  VV     ",
    " VV      ",
  ],
};
export const ICON_WIDTH = 9;
export const ICON_HEIGHT = 6;

export function iconForWeatherCode(code: number): string[] {
  if (code === 0 || code === 1) return ICONS.sun;
  if (code === 2) return ICONS.partlyCloudy;
  if (code === 3) return ICONS.cloud;
  if (code === 45 || code === 48) return ICONS.fog;
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return ICONS.rain;
  if ([71, 73, 75].includes(code)) return ICONS.snow;
  if ([95, 96, 99].includes(code)) return ICONS.storm;
  return ICONS.cloud;
}

export function stampIcon(
  raw: string[],
  pattern: string[],
  topRow: number,
  leftCol: number,
  boardCols: number
) {
  pattern.forEach((rowStr, r) => {
    Array.from(rowStr).forEach((ch, c) => {
      if (ch === " ") return;
      const color = ICON_COLOR_MAP[ch];
      if (!color) return;
      const row = topRow + r;
      const col = leftCol + c;
      if (col < 0 || col >= boardCols) return;
      raw[row * boardCols + col] = color;
    });
  });
}
