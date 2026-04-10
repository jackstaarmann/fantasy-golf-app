// app/(app)/_layout.tsx
import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Register the (app) group */}
      <Stack.Screen name="(app)" />

      {/* Tabs group */}
      <Stack.Screen name="(tabs)" />

      {/* Standalone screens */}
      <Stack.Screen name="rules" />
      <Stack.Screen name="all-news" />
      <Stack.Screen name="create-league" />
      <Stack.Screen name="join-league" />
      <Stack.Screen name="pga-leaderboard" />
      <Stack.Screen name="pick-history" />
      <Stack.Screen name="league-settings-commissioner" />
      <Stack.Screen name="league-settings-member" />
    </Stack>
  );
}
