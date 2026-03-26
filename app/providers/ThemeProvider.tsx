import { Colors } from "@/constants/theme";
import supabase from "@/supabase";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

type ThemePreference = "light" | "dark" | "system";

type ThemeContextType = {
  theme: ThemePreference;
  setTheme: (t: ThemePreference) => void;
  themeColors: any;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemePreference>("system");

  // Load saved preference on app start
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("theme_preference")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.theme_preference) {
        setTheme(data.theme_preference);
      }
    }
    load();
  }, []);

  // Resolve actual theme
  const resolved = theme === "system" ? systemScheme ?? "dark" : theme;
  const themeColors = Colors[resolved];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}