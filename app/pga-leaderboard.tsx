import {
  fetchLeaderboard,
  type LeaderboardPlayer,
} from "@/api";
import { useAuth } from "@/app/providers/AuthProvider";
import { formatTimeWithTimezone } from "@/components/utils/time";
import supabase from "@/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PGALeaderboard() {
  const router = useRouter();
  const { session } = useAuth();
  const user = session?.user ?? null;

  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentId, setTournamentId] = useState<number | null>(null);
  const [tournamentName, setTournamentName] = useState("Leaderboard");
  const [timezone, setTimezone] = useState<string | null>(null);

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const formatToPar = (n: number) => {
    if (n === 0) return "E";
    if (n > 0) return `+${n}`;
    return `${n}`;
  };

  const formatThru = (thru: number | string) => {
    if (thru === 18) return "F";
    return thru;
  };

  async function loadUserTimezone() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("timezone")
      .eq("id", user.id)
      .maybeSingle();

    if (data?.timezone) {
      setTimezone(data.timezone);
    }
  }

  async function loadTournament() {
    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .order("activation_time", { ascending: true });

    if (!data || data.length === 0) return;

    const inProgress = data.find((t) => t.in_progress);
    const upNext = data.find((t) => t.up_next);
    const completed = [...data]
      .filter((t) => t.is_completed)
      .sort(
        (a, b) =>
          new Date(b.activation_time).getTime() -
          new Date(a.activation_time).getTime()
      )[0];

    const event = inProgress || upNext || completed || null;

    if (event) {
      setTournamentId(Number(event.id));
      setTournamentName(event.name);
    }
  }

  async function loadLeaderboard() {
    if (!tournamentId) return;

    try {
      const data = await fetchLeaderboard(tournamentId);
      setPlayers(data);
    } catch (err) {
      console.log("Full leaderboard error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      await loadUserTimezone();
      await loadTournament();
    }
    init();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUserTimezone();
    }, [])
  );

  useEffect(() => {
    if (!tournamentId) return;
    loadLeaderboard();

    const interval = setInterval(loadLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [tournamentId]);

  const currentRound = players[0]?.round ?? 1;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const isCutPlayer = (p: LeaderboardPlayer) =>
    p.thru === 0 && !p.teeTime && (p.round ?? 0) >= 2;

  const madeCut = players.filter((p) => !isCutPlayer(p));
  const missedCut = players.filter((p) => isCutPlayer(p));

  const combinedList = [
    ...madeCut,
    { id: "CUT_DIVIDER" } as any,
    ...missedCut,
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View
        style={{
          paddingBottom: 16,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderColor: "#eee",
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 16 }}>
          <Text style={{ fontSize: 18, color: "#0E734A", fontWeight: "600" }}>
            ← Back
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 20, fontWeight: "700", color: "#000" }}>
          {tournamentName}
        </Text>
      </View>

      {/* Column Headers */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          paddingVertical: 10,
          paddingRight: 16,
          borderBottomWidth: 1,
          borderColor: "#eee",
        }}
      >
        <Text style={{ width: 40, textAlign: "center", fontWeight: "600", color: "#555" }}>
          R{currentRound}
        </Text>
        <Text style={{ width: 70, textAlign: "center", fontWeight: "600", color: "#555" }}>
          THRU
        </Text>
        <Text style={{ width: 40, textAlign: "center", fontWeight: "600", color: "#555" }}>
          TOT
        </Text>
      </View>

      {/* Full Leaderboard */}
      <FlatList
        data={combinedList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => {
          if (item.id === "CUT_DIVIDER") {
            return (
              <View
                style={{
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderColor: "#ddd",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#444",
                  }}
                >
                  CUT
                </Text>
              </View>
            );
          }

          const isCut = isCutPlayer(item);

          const thruDisplay = isCut
            ? "-"
            : item.thru === 0 && item.teeTime
            ? formatTimeWithTimezone(item.teeTime, timezone)
            : formatThru(item.thru);

          return (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderColor: "#eee",
              }}
            >
              <Text style={{ fontSize: 16, color: "#000", flex: 1 }}>
                {item.rank}. {item.name}
              </Text>

              <Text style={{ width: 40, textAlign: "center", fontSize: 16, color: "#000" }}>
                {isCut ? "-" : formatToPar(item.today)}
              </Text>

              <Text style={{ width: 70, textAlign: "center", fontSize: 16, color: "#000" }}>
                {thruDisplay}
              </Text>

              <Text style={{ width: 40, textAlign: "center", fontSize: 16, color: "#000" }}>
                {formatToPar(item.toPar)}
              </Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}