// components/heatmap/getHeatColor.ts

type ThemeColors = {
  mode?: "light" | "dark";
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hslToHex(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  const toHex = (x: number) => {
    const v = Math.round(255 * x).toString(16).padStart(2, "0");
    return v;
  };

  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

// rank: 1 = best, totalTeams = max rank
export function getHeatColor(
  rank: number,
  totalTeams: number,
  themeColors: ThemeColors
): string {
  if (!totalTeams || rank <= 0) return "#999";

  const t = Math.min(Math.max((rank - 1) / Math.max(totalTeams - 1, 1), 0), 1);

  const isDark = themeColors.mode === "dark";

  const stops = isDark
    ? [
        { h: 140, s: 40, l: 35 }, // green
        { h: 55, s: 55, l: 45 },  // yellow
        { h: 30, s: 60, l: 45 },  // orange
        { h: 0, s: 60, l: 45 },   // red
      ]
    : [
        { h: 140, s: 55, l: 45 },
        { h: 55, s: 70, l: 55 },
        { h: 30, s: 75, l: 55 },
        { h: 0, s: 70, l: 55 },
      ];

  const segment = t * 3;
  const i = Math.floor(segment);
  const localT = segment - i;

  const a = stops[i] ?? stops[stops.length - 2];
  const b = stops[i + 1] ?? stops[stops.length - 1];

  const h = lerp(a.h, b.h, localT);
  const s = lerp(a.s, b.s, localT);
  const l = lerp(a.l, b.l, localT);

  return hslToHex(h, s, l);
}
