import { getActiveTournament, getUserPick, getWeatherForEvent } from "@/api";
import EventWidget from "@/components/event-widget";
import LeaderboardWidget from "@/components/leaderboard-widget";
import NewsWidget from "@/components/news-widget";
import WeatherWidget from "@/components/weather-widget";

import supabase from "@/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../providers/AuthProvider";

import { useTheme } from "@/app/providers/ThemeProvider";
import LogoutIcon from "@/assets/images/logout-button.png";

export default function HomePage() {
  const { session } = useAuth();
  const user = session?.user ?? null;
  const { themeColors } = useTheme();

  const [golferId, setGolferId] = useState<string | null>(null);
  const [tournamentId, setTournamentId] = useState<number | null>(null);
  const [leagueId, setLeagueId] = useState<string | null>(null);

  const [weather, setWeather] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function load() {
        if (!user || !isActive) return;

        const tournament = await getActiveTournament();
        if (!tournament || !isActive) return;

        setTournamentId(Number(tournament.id));

        const pick = await getUserPick(user.id, String(tournament.id));
        if (isActive) setGolferId(pick?.golfer_id ?? null);

        const { data: league } = await supabase
          .from("league_members")
          .select("league_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (isActive) setLeagueId(league?.league_id ?? null);

        const w = await getWeatherForEvent(String(tournament.id));
        if (isActive) setWeather(w);
      }

      load();

      return () => {
        isActive = false;
      };
    }, [user])
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: themeColors.background }]}>

        {/* Logout Button */}
        <View style={styles.authButtonContainer}>
          {session ? (
            <Pressable onPress={handleLogout}>
              <Image
                source={LogoutIcon}
                style={{ width: 26, height: 26, tintColor: themeColors.text }}
              />
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push("/login")}>
              <Text style={[styles.authButtonText, { color: themeColors.tint }]}>Login</Text>
            </Pressable>
          )}
        </View>

        {/* Info Button */}
        <View style={styles.infoButtonContainer}>
          <Pressable onPress={() => router.push("/rules")}>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                borderWidth: 1.5,
                borderColor: themeColors.text,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: themeColors.text,
                  fontWeight: "600",
                }}
              >
                i
              </Text>
            </View>
          </Pressable>
        </View>

        <Text style={[styles.title, { color: themeColors.text }]}>
          Swing by Staarmann
        </Text>

        {/* EVENT */}
        <View style={styles.widgetSpacing}>
          <EventWidget />
        </View>

        {/* WEATHER */}
        <View style={styles.widgetSpacing}>
          <WeatherWidget weather={weather} />
        </View>

        {/* LEADERBOARD */}
        <View style={styles.widgetSpacing}>
          <LeaderboardWidget />
        </View>

        {/* NEWS */}
        <View style={styles.widgetSpacing}>
          <NewsWidget />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "flex-start",
  },
  widgetSpacing: {
    marginBottom: 0, // 🔥 compact + uniform spacing (matches original top widgets)
  },
  authButtonContainer: {
    position: "absolute",
    top: 30,
    left: 20,
    zIndex: 20,
  },
  infoButtonContainer: {
    position: "absolute",
    top: 30,
    right: 20,
    zIndex: 20,
  },
  authButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 0,
    textAlign: "center",
  },
});
