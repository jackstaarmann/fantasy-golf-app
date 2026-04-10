import AuthProvider, { useAuth } from "@/app/providers/AuthProvider";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

function NavigationGuard() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const root = segments[0];      // "(app)" or "(auth)"
    const sub = segments[1];       // "(tabs)" or undefined

    const isAuthGroup = root === "(auth)";
    const isTabsGroup = sub === "(tabs)";

    // Not logged in → only allow (auth)
    if (!session) {
      if (!isAuthGroup) {
        router.replace("/(auth)/login");
      }
      return;
    }

    // Logged in → block access to (auth)
    if (session && isAuthGroup) {
      router.replace("/(app)/(tabs)");
      return;
    }

  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        <NavigationGuard />
      </ThemeProvider>
    </AuthProvider>
  );
}
