import { fetchLeaderboard, type LeaderboardPlayer } from "@/api";
import { useTheme } from "@/app/providers/ThemeProvider";
import { formatTimeWithTimezone } from "@/components/utils/time";
import supabase from "@/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View
} from "react-native";

import PlayerBioModal from "@/components/player-bio-modal";

// -----------------------------
// TOURNAMENT ROUND DETECTOR
// -----------------------------
function computeTournamentRound(players: LeaderboardPlayer[]): number {
  if (!players || players.length === 0) return 1;

  const active = players.filter((p) => (p.thru ?? 0) > 0);

  if (active.length === 0) {
    const maxRound = players.reduce(
      (max, p) => Math.max(max, p.round ?? 0),
      0
    );
    return maxRound || 1;
  }

  const maxActiveRound = active.reduce(
    (max, p) => Math.max(max, p.round ?? 0),
    0
  );

  return maxActiveRound || 1;
}

export default function LeaderboardWidget() {
  const router = useRouter();
  const { themeColors } = useTheme();

  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentId, setTournamentId] = useState<number | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(1);

  const [selectedGolferId, setSelectedGolferId] = useState<number | null>(null);
  const [showBio, setShowBio] = useState(false);

  const formatToPar = (n: number) => {
    if (n === 0) return "E";
    if (n > 0) return `+${n}`;
    return `${n}`;
  };

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

  async function loadTournament() {
    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .order("activation_time", { ascending: true });

    if (!data || data.length === 0) return;

    let activeEvent: any = null;

    const inProgress = data.find((t) => t.in_progress === true);
    if (inProgress) activeEvent = inProgress;

    if (!activeEvent) {
      const lingering = data.find((t) => t.linger_window === true);
      if (lingering) activeEvent = lingering;
    }

    if (!activeEvent) {
      const upNext = data.find((t) => t.up_next === true);
      if (upNext) activeEvent = upNext;
    }

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

    if (activeEvent) {
      setTournamentId(Number(activeEvent.id));
    } else {
      setTournamentId(null);
      setPlayers([]);
      setLoading(false);
    }
  }

  async function loadLeaderboard() {
    if (!tournamentId) return;

    try {
      const data = await fetchLeaderboard(tournamentId);

      // compute round from FULL field
      const round = computeTournamentRound(data);
      setCurrentRound(round);

      // only show top 5
      setPlayers(data.slice(0, 5));
      setLoading(false);
    } catch (err) {
      console.log("Widget leaderboard error:", err);
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
    const interval = setInterval(loadLeaderboard, 10000);

    return () => clearInterval(interval);
  }, [tournamentId]);

  return (
    <View
      style={{
        padding: 16,
        borderRadius: 12,
        backgroundColor: themeColors.card,
        borderWidth: 1,
        borderColor: themeColors.border,
        marginBottom: 16,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          marginBottom: 10,
          color: themeColors.text,
        }}
      >
        Live Leaderboard
      </Text>

      {loading && <ActivityIndicator size="small" color={themeColors.tint} />}

      {!loading && tournamentId && players.length > 0 && (
        <>
          {/* Header Row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              paddingBottom: 6,
              borderBottomWidth: 1,
              borderColor: themeColors.border,
            }}
          >
            <Text
              style={{
                width: 40,
                textAlign: "center",
                fontWeight: "600",
                color: themeColors.text + "99",
              }}
            >
              R{currentRound}
            </Text>
            <Text
              style={{
                width: 70,
                textAlign: "center",
                fontWeight: "600",
                color: themeColors.text + "99",
              }}
            >
              THRU
            </Text>
            <Text
              style={{
                width: 40,
                textAlign: "center",
                fontWeight: "600",
                color: themeColors.text + "99",
              }}
            >
              TOT
            </Text>
          </View>

          {/* Player Rows */}
          {players.map((p) => {
            const thruDisplay = (() => {
              const playerRound = p.round ?? 0;
              const teeTime = p.teeTime ?? "";

              if (playerRound < currentRound) {
                return teeTime
                  ? formatTimeWithTimezone(teeTime, timezone ?? "")
                  : "TBD";
              }

              if (playerRound === currentRound) {
                if (p.thru === 18) return "F";
                if (p.thru === 0 && teeTime) {
                  return formatTimeWithTimezone(teeTime, timezone ?? "");
                }
                return p.thru;
              }

              return "-";
            })();

            return (
              <View
                key={p.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 8,
                  borderBottomWidth: 0.5,
                  borderColor: themeColors.border,
                }}
              >
                <Pressable
                  onPress={() => {
                    setSelectedGolferId(Number(p.id));
                    setShowBio(true);
                  }}
                  style={({ pressed }) => ({
                    flex: 1,
                    opacity: pressed ? 0.5 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: themeColors.text,
                    }}
                  >
                    {p.rank}. {p.name}
                  </Text>
                </Pressable>

                <Text
                  style={{
                    width: 40,
                    textAlign: "center",
                    fontSize: 16,
                    color: themeColors.text,
                  }}
                >
                  {formatToPar(p.today)}
                </Text>

                <Text
                  style={{
                    width: 70,
                    textAlign: "center",
                    fontSize: 16,
                    color: themeColors.text,
                  }}
                >
                  {thruDisplay}
                </Text>

                <Text
                  style={{
                    width: 40,
                    textAlign: "center",
                    fontSize: 16,
                    color: themeColors.text,
                  }}
                >
                  {formatToPar(p.toPar)}
                </Text>
              </View>
            );
          })}
        </>
      )}

      {!loading && !tournamentId && (
        <Text style={{ color: themeColors.text + "99", marginTop: 4 }}>
          Leaderboard will appear when tee times are posted.
        </Text>
      )}

      <Pressable
        onPressIn={() => router.push("/pga-leaderboard")}
        style={{
          marginTop: 12,
          backgroundColor: themeColors.tint,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 6,
          alignSelf: "flex-start",
        }}
      >
        <Text
          style={{
            color: themeColors.background,
            fontWeight: "600",
          }}
        >
          View Full Leaderboard
        </Text>
      </Pressable>

      <PlayerBioModal
        visible={showBio}
        golferId={selectedGolferId}
        onClose={() => setShowBio(false)}
        themeColors={themeColors}
      />
    </View>
  );
}
