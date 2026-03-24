import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AuthProvider, { useAuth } from './providers/AuthProvider';


function RootNavigation() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inTabsGroup = segments[0] === '(tabs)';
    const onLogin = segments[0] === 'login';
    const onPgaLeaderboard = segments[0] === 'pga-leaderboard';
    const onRules = segments[0] === 'rules';
    const onAllNews = segments[0] === 'all-news';   // ⭐ allow all-news screen

    if (!session && inTabsGroup) {
      router.replace('/login');
    } 
    else if (
      session &&
      !inTabsGroup &&
      !onPgaLeaderboard &&
      !onRules &&
      !onAllNews   // ⭐ allow this route for logged-in users
    ) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="pga-leaderboard" />
      <Stack.Screen name="rules" />
      <Stack.Screen name="all-news" />   {/* ⭐ NEW ROUTE */}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />
      <RootNavigation />
    </AuthProvider>
  );
}