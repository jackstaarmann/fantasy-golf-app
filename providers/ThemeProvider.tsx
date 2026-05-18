import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import supabase from "@/supabase";
import { useColorScheme } from "react-native";

import * as ThemeDebug from "@/constants/theme";
import { ColorPreference, TintPalette, getTheme } from "@/constants/theme";

console.log("REAL THEME MODULE:", ThemeDebug);

type ThemePreference = "light" | "dark" | "system";

type ThemeContextType = {
  theme: ThemePreference;
  setTheme: (t: ThemePreference) => void;

  color: ColorPreference;
  setColor: (c: ColorPreference) => void;

  themeColors: any;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();

  const [theme, setTheme] = useState<ThemePreference>("system");
  const [color, setColor] = useState<ColorPreference>("green");

  // ✅ safe fallback BEFORE anything else
  const safeColor: ColorPreference = color ?? "green";

  const resolvedTheme: "light" | "dark" =
    theme === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : theme === "dark"
        ? "dark"
        : "light";

  // ✅ ALWAYS safe tint (never undefined)
  const tint = TintPalette[safeColor] ?? TintPalette.green;

  // ✅ fully guarded theme builder
  const themeColors = useMemo(() => {
    const base = getTheme(tint);

    return base?.[resolvedTheme] ?? getTheme(TintPalette.green).light;
  }, [tint, resolvedTheme]);

  useEffect(() => {
    async function loadPreferences() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("theme_preference, color_preference")
        .eq("id", user.id)
        .maybeSingle();

      if (!data) return;

      // theme
      if (data.theme_preference) {
        setTheme(data.theme_preference);
      }

      // color (strict validation)
      if (
        data.color_preference &&
        TintPalette[data.color_preference as ColorPreference]
      ) {
        setColor(data.color_preference as ColorPreference);
      } else {
        setColor("green");
      }
    }

    loadPreferences();
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        color,
        setColor,
        themeColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}