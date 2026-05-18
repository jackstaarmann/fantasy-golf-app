// constants/theme.ts

// ---------------------------------------------
// 1. Available user tint colors
// ---------------------------------------------
export const TintPalette = {
  green: "#0E734A",
  blue: "#1E6FEA",
  red: "#D64545",
  gold: "#C9A227",
} as const;

export type ColorPreference = keyof typeof TintPalette;

// ---------------------------------------------
// 2. Base colors
// ---------------------------------------------
const BaseColors = {
  light: {
    text: "#11181C",
    background: "#FFFFFF",
    icon: "#687076",
    tabIconDefault: "#687076",
    border: "#DDDDDD",
    card: "#F2F2F2",
    primaryText: "#000000",
  },

  dark: {
    text: "#FFFFFF",
    background: "#1A1A1A",
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    border: "#3A3A3A",
    card: "#2A2A2A",
    primaryText: "#FFFFFF",
  },
};

// ---------------------------------------------
// 3. Dynamic theme factory
// ---------------------------------------------
export const getTheme = (tint: string) => ({
  light: {
    ...BaseColors.light,
    tint,
    primary: tint,
    tabIconSelected: tint,
  },

  dark: {
    ...BaseColors.dark,
    tint,
    primary: tint,
    tabIconSelected: tint,
  },
});