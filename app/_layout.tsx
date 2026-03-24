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

    const root = segments[0];

    // Screens that do NOT require authentication
    const publicScreens = ['login'];

    // Screens that DO require authentication but are NOT inside (tabs)
    const extraAuthScreens = [
      'pga-leaderboard',
      'rules',
      'all-news',
      'join-league',
      'create-league'
    ];

    const inTabsGroup = root === '(tabs)';
    const isPublic = publicScreens.includes(root);
    const isExtraAuth = extraAuthScreens.includes(root);

    // -------------------------
    // NOT LOGGED IN
    // -------------------------
    if (!session) {
      if (!isPublic) {
        router.replace('/login');
      }
      return;
    }

    // -------------------------
    // LOGGED IN
    // -------------------------
    // Allow:
    // - (tabs)
    // - any extra authenticated screen
    if (!inTabsGroup && !isExtraAuth) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

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
      <Stack.Screen name="all-news" />
      <Stack.Screen name="join-league" />
      <Stack.Screen name="create-league" />
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