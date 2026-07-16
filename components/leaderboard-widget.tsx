import { fetchLeaderboard, type LeaderboardPlayer } from "@/api";
import { formatTimeWithTimezone } from "@/components/utils/time";
import { useTheme } from "@/providers/ThemeProvider";
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

type LeaderboardWidgetProps = {
  tournamentId?: string | number;
};

export default function LeaderboardWidget({
  tournamentId: selectedTournamentId,
}: LeaderboardWidgetProps) {
  const router = useRouter();
  const { themeColors } = useTheme();

  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(1);

  const [selectedGolferIds, setSelectedGolferIds] = useState<number[]>([]);
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

  async function loadLeaderboard() {
    if (!selectedTournamentId) return;

    try {
      const data = await fetchLeaderboard(Number(selectedTournamentId));

      const round = computeTournamentRound(data);
      setCurrentRound(round);

      setPlayers(data.slice(0, 5));
      setLoading(false);
    } catch (err) {
      console.log("Widget leaderboard error:", err);
    }
  }

  // Initial load
  useEffect(() => {
    async function init() {
      await loadUserTimezone();
    }
    init();
  }, []);

  // Refresh timezone when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      loadUserTimezone();
    }, [])
  );

  // FIXED: Load leaderboard whenever selectedTournamentId changes
  useEffect(() => {
    if (!selectedTournamentId) return;

    setLoading(true);
    loadLeaderboard();

    const interval = setInterval(loadLeaderboard, 10000);
    return () => clearInterval(interval);
  }, [selectedTournamentId]);

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

      {!loading && selectedTournamentId && players.length > 0 && (
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
                    setSelectedGolferIds(p.athleteIds ?? [Number(p.id)]);
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

      {!loading && !selectedTournamentId && (
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
        golferIds={selectedGolferIds}
        onClose={() => setShowBio(false)}
        themeColors={themeColors}
      />
    </View>
  );
}
