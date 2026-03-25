import { fetchLeaderboard, type LeaderboardPlayer } from "@/api";
import { formatTimeWithTimezone } from "@/components/utils/time";
import supabase from "@/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export default function LeaderboardWidget() {
  const router = useRouter();
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentId, setTournamentId] = useState<number | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);

  const formatToPar = (n: number) => {
    if (n === 0) return "E";
    if (n > 0) return `+${n}`;
    return `${n}`;
  };

  const formatThru = (thru: number | string) => {
    if (thru === 18) return "F";
    return thru;
  };

  // -----------------------------
  // Load user timezone
  // -----------------------------
  async function loadUserTimezone() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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

  // -----------------------------
  // Fetch correct tournament (5-STATE LOGIC)
  // -----------------------------
  async function loadTournament() {
    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .order("activation_time", { ascending: true });

    if (!data || data.length === 0) return;

    let activeEvent: any = null;

    // 1️⃣ In Progress
    const inProgress = data.find((t) => t.in_progress === true);
    if (inProgress) activeEvent = inProgress;

    // 2️⃣ Linger Window
    if (!activeEvent) {
      const lingering = data.find((t) => t.linger_window === true);
      if (lingering) activeEvent = lingering;
    }

    // 3️⃣ Up Next
    if (!activeEvent) {
      const upNext = data.find((t) => t.up_next === true);
      if (upNext) activeEvent = upNext;
    }

    // 4️⃣ Most recent completed
    if (!activeEvent) {
      const completed = [...data]
        .filter((t) => t.is_completed === true)
        .sort(
          (a, b) =>
            new Date(b.activation_time).getTime() -
            new Date(a.activation_time).getTime()
        )[0];

      activeEvent = completed ?? null;
    }

    // NEW: Load leaderboard for ANY activeEvent
    if (activeEvent) {
      setTournamentId(Number(activeEvent.id));
    } else {
      setTournamentId(null);
      setPlayers([]);
      setLoading(false);
    }
  }

  // -----------------------------
  // Fetch leaderboard
  // -----------------------------
  async function loadLeaderboard() {
    if (!tournamentId) return;

    try {
      const data = await fetchLeaderboard(tournamentId);
      setPlayers(data.slice(0, 5));
      setLoading(false);
    } catch (err) {
      console.log("Widget leaderboard error:", err);
    }
  }

  // -----------------------------
  // Initial load
  // -----------------------------
  useEffect(() => {
    async function init() {
      await loadUserTimezone();
      await loadTournament();
    }
    init();
  }, []);

  // -----------------------------
  // Reload timezone when screen regains focus
  // -----------------------------
  useFocusEffect(
    React.useCallback(() => {
      loadUserTimezone();
    }, [])
  );

  // -----------------------------
  // Load leaderboard on tournament change
  // -----------------------------
  useEffect(() => {
    if (!tournamentId) return;

    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 10000);

    return () => clearInterval(interval);
  }, [tournamentId]);

  const currentRound = players[0]?.round ?? 1;

  return (
    <View
      style={{
        padding: 16,
        borderRadius: 12,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e0e0e0",
        marginBottom: 16,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          marginBottom: 10,
          color: "#000",
        }}
      >
        Live Leaderboard
      </Text>

      {loading && <ActivityIndicator size="small" color="#000" />}

      {!loading && tournamentId && players.length > 0 && (
        <>
          {/* Header Row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              paddingBottom: 6,
              borderBottomWidth: 1,
              borderColor: "#eee",
            }}
          >
            <Text
              style={{
                width: 40,
                textAlign: "center",
                fontWeight: "600",
                color: "#555",
              }}
            >
              R{currentRound}
            </Text>
            <Text
              style={{
                width: 70,
                textAlign: "center",
                fontWeight: "600",
                color: "#555",
              }}
            >
              THRU
            </Text>
            <Text
              style={{
                width: 40,
                textAlign: "center",
                fontWeight: "600",
                color: "#555",
              }}
            >
              TOT
            </Text>
          </View>

          {/* Player Rows */}
          {players.map((p) => {
            const thruDisplay =
              p.thru === 0 && p.teeTime
                ? formatTimeWithTimezone(p.teeTime, timezone)
                : formatThru(p.thru);

            return (
              <View
                key={p.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 8,
                  borderBottomWidth: 0.5,
                  borderColor: "#eee",
                }}
              >
                <Text style={{ fontSize: 16, color: "#000", flex: 1 }}>
                  {p.rank}. {p.name}
                </Text>

                <Text
                  style={{
                    width: 40,
                    textAlign: "center",
                    fontSize: 16,
                    color: "#000",
                  }}
                >
                  {formatToPar(p.today)}
                </Text>

                <Text
                  style={{
                    width: 70,
                    textAlign: "center",
                    fontSize: 16,
                    color: "#000",
                  }}
                >
                  {thruDisplay}
                </Text>

                <Text
                  style={{
                    width: 40,
                    textAlign: "center",
                    fontSize: 16,
                    color: "#000",
                  }}
                >
                  {formatToPar(p.toPar)}
                </Text>
              </View>
            );
          })}
        </>
      )}

      {/* No tournament at all */}
      {!loading && !tournamentId && (
        <Text style={{ color: "#555", marginTop: 4 }}>
          Leaderboard will appear when tee times are posted.
        </Text>
      )}

      {/* Button */}
      <Pressable
        onPressIn={() => router.push("/pga-leaderboard")}
        style={{
          marginTop: 12,
          backgroundColor: "#0E734A",
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 6,
          alignSelf: "flex-start",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>
          View Full Leaderboard
        </Text>
      </Pressable>
    </View>
  );
}