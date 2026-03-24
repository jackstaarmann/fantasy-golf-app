import { getActiveTournament, getUserPick } from "@/api";
import EventWidget from "@/components/event-widget";
import LeaderboardWidget from "@/components/leaderboard-widget";
import NewsWidget from "@/components/news-widget";

import supabase from "@/supabase";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../providers/AuthProvider";

// Logout icon
import LogoutIcon from "@/assets/images/logout-button.png";

export default function HomePage() {
  const { session } = useAuth();
  const user = session?.user ?? null;

  const [golferId, setGolferId] = useState<string | null>(null);
  const [tournamentId, setTournamentId] = useState<number | null>(null);
  const [leagueId, setLeagueId] = useState<string | null>(null);

  // ---------------------------------------------------------
  // Load tournament + user pick + league
  // ---------------------------------------------------------
  useEffect(() => {
    async function load() {
      if (!user) return;

      const tournament = await getActiveTournament();
      if (!tournament) return;

      setTournamentId(Number(tournament.id));

      const pick = await getUserPick(user.id, String(tournament.id));
      setGolferId(pick?.golfer_id ?? null);

      const { data: league } = await supabase
        .from("league_members")
        .select("league_id")
        .eq("user_id", user.id)
        .maybeSingle();

      setLeagueId(league?.league_id ?? null);
    }

    load();
  }, [user]);

  // ---------------------------------------------------------
  // Logout
  // ---------------------------------------------------------
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* 🔐 Logout Button (Top Left) */}
        <View style={styles.authButtonContainer}>
          {session ? (
            <Pressable onPress={handleLogout}>
              <Image
                source={LogoutIcon}
                style={{ width: 26, height: 26, resizeMode: "contain" }}
              />
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push("/login")}>
              <Text style={styles.authButtonText}>Login</Text>
            </Pressable>
          )}
        </View>

        {/* ℹ️ Info Button (Top Right) */}
        <View style={styles.infoButtonContainer}>
          <Pressable onPress={() => router.push("/rules")}>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                borderWidth: 1.5,
                borderColor: "#000000",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: "#000000",
                  fontWeight: "600",
                }}
              >
                i
              </Text>
            </View>
          </Pressable>
        </View>

        <Text style={styles.title}>Swing by Staarmann</Text>

        {/* 1️ EVENT WIDGET */}
        <EventWidget />

        {/* 2 LEADERBOARD WIDGET */}
        <LeaderboardWidget />

        {/* 3 NEWS WIDGET */}
        <NewsWidget />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#ffffff",
    justifyContent: "flex-start",
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
    color: "#0a7f42",
    fontWeight: "600",
    fontSize: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 0,
    color: "black",
    textAlign: "center",
  },
});