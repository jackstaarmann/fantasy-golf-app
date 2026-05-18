// app/(app)/(tabs)/_layout.tsx

import React from "react";

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useTheme } from "@/providers/ThemeProvider";

export default function TabLayout() {
  const { themeColors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor:
          themeColors.tint,

        tabBarInactiveTintColor:
          themeColors.tabIconDefault,

        tabBarStyle: {
          backgroundColor:
            themeColors.background,

          borderTopColor:
            themeColors.border,

          height: 60,
          paddingBottom: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",

          tabBarIcon: ({ color }) => (
            <Ionicons
              name="home"
              size={28}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="picks"
        options={{
          title: "Picks",

          tabBarIcon: ({ color }) => (
            <Ionicons
              name="list"
              size={28}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",

          tabBarIcon: ({ color }) => (
            <Ionicons
              name="trophy"
              size={28}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",

          tabBarIcon: ({ color }) => (
            <Ionicons
              name="person"
              size={28}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}