import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { ThemeProvider, useTheme } from "@/app/providers/ThemeProvider";
import AuthProvider, { useAuth } from "./providers/AuthProvider";

function NavigationGuard() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const root = segments[0];

    const publicScreens = ["login"];
    const extraAuthScreens = [
      "pga-leaderboard",
      "rules",
      "all-news",
      "join-league",
      "create-league",
      "pick-history",
      "app",
    ];

    const inTabsGroup = root === "(tabs)";
    const isPublic = publicScreens.includes(root);
    const isExtraAuth = extraAuthScreens.includes(root);

    if (!session) {
      if (!isPublic) router.replace("/login");
      return;
    }

    if (!inTabsGroup && !isExtraAuth) {
      router.replace("/(tabs)");
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />; // ⭐ Slot is now directly under ThemeProvider → re-renders on theme change
}

function ThemedStatusBar() {
  const { theme, themeColors } = useTheme();

  return (
    <StatusBar
      style={theme === "dark" ? "light" : "dark"}
      backgroundColor={themeColors.background}
      translucent={false}
    />
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ThemedStatusBar />
        <NavigationGuard />
      </ThemeProvider>
    </AuthProvider>
  );
}