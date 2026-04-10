import {
  fetchLeaderboard,
  type LeaderboardPlayer,
} from "@/api";
import { useAuth } from "@/app/providers/AuthProvider";
import { useTheme } from "@/app/providers/ThemeProvider";
import PlayerBioModal from "@/components/player-bio-modal";
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

// -----------------------------
// FORMAT TEE TIME
// -----------------------------
function formatTeeTime(iso: string | null, timezone: string | null) {
  if (!iso) return null;

  try {
    const date = new Date(iso);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone ?? "UTC",
    });
  } catch {
    return iso;
  }
}

// -----------------------------
// TOURNAMENT ROUND DETECTION
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

export default function PGALeaderboard() {
  const router = useRouter();
  const { session } = useAuth();
  const user = session?.user ?? null;

  const { themeColors } = useTheme();

  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentId, setTournamentId] = useState<number | null>(null);
  const [tournamentName, setTournamentName] = useState("Leaderboard");
  const [timezone, setTimezone] = useState<string | null>(null);
  const [tournament, setTournament] = useState<any>(null);

  // Modal state
  const [selectedGolferId, setSelectedGolferId] = useState<number | null>(null);
  const [showBio, setShowBio] = useState(false);

  if (!user) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: themeColors.background,
        }}
      >
        <ActivityIndicator size="large" color={themeColors.tint} />
      </SafeAreaView>
    );
  }

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
      setTournament(event);
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

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: themeColors.background,
        }}
      >
        <ActivityIndicator size="large" color={themeColors.tint} />
      </SafeAreaView>
    );
  }

  // -----------------------------
  // CUT / PROJECTED CUT / WD LOGIC
  // -----------------------------

  const tournamentRound =
    players.length > 0 ? computeTournamentRound(players) : 1;

  const currentRound = tournamentRound;

  const sortedPlayers = [...players].sort((a, b) => a.toPar - b.toPar);

  let projectedCutScore: number | null = null;
  if (tournament?.cut_rule && tournament.cut_rule > 0) {
    const index = tournament.cut_rule - 1;
    if (sortedPlayers[index]) {
      projectedCutScore = sortedPlayers[index].toPar;
    }
  }

  const cutIsOfficial = tournamentRound >= 3;

  const isWDPlayer = (p: LeaderboardPlayer) =>
    p.rank === "-" &&
    (p.round ?? 0) < tournamentRound &&
    p.thru < 18;

  const isCutPlayer = (p: LeaderboardPlayer) =>
    cutIsOfficial &&
    !isWDPlayer(p) &&
    (p.round ?? 1) < tournamentRound &&
    !p.teeTime &&
    p.thru === 18;

  const isProjectedCutPlayer = (p: LeaderboardPlayer) => {
    if (cutIsOfficial) return false;
    if (!tournament?.cut_rule || projectedCutScore === null) return false;
    return p.toPar > projectedCutScore;
  };

  const madeCut = players.filter(
    (p) => !isCutPlayer(p) && !isWDPlayer(p) && !isProjectedCutPlayer(p)
  );
  const projectedCut = players.filter((p) => isProjectedCutPlayer(p));
  const cutPlayers = players.filter((p) => isCutPlayer(p));
  const wdPlayers = players.filter((p) => isWDPlayer(p));

  const combinedList = [
    ...madeCut,
    ...(projectedCut.length > 0 || cutPlayers.length > 0
      ? [{ id: "CUT_DIVIDER" } as any]
      : []),
    ...projectedCut,
    ...cutPlayers,
    ...wdPlayers,
  ];

  const cutLabel = cutIsOfficial ? "CUT" : "PROJECTED CUT";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      {/* Header */}
      <View
        style={{
          paddingBottom: 16,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderColor: themeColors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingRight: 16 }}
        >
          <Text
            style={{
              fontSize: 18,
              color: themeColors.tint,
              fontWeight: "600",
            }}
          >
            ← Back
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: themeColors.text,
          }}
        >
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
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.card,
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: "700",
                    color: themeColors.text,
                  }}
                >
                  {cutLabel}
                </Text>
              </View>
            );
          }

          const isWD = isWDPlayer(item);
          const isCut = isCutPlayer(item);

          const rankDisplay = isWD
            ? "WD"
            : isCut
            ? "CUT"
            : item.rank;

          const todayDisplay = isWD || isCut ? "-" : formatToPar(item.today);

          // -----------------------------
          // THRU DISPLAY WITH ROUND-AWARE TEE TIME
          // -----------------------------
          let thruDisplay: string | number | null;

          if (isWD || isCut) {
            thruDisplay = "-";
          } else {
            const playerRound = item.round ?? 0;

            if (playerRound < currentRound) {
              // Player has finished their last round and not yet started currentRound → show tee time
              thruDisplay = item.teeTime
                ? formatTeeTime(item.teeTime, timezone)
                : "-";
            } else if (playerRound === currentRound) {
              if (item.thru === 18) {
                thruDisplay = "F";
              } else if (item.thru === 0 && item.teeTime) {
                thruDisplay = formatTeeTime(item.teeTime, timezone);
              } else {
                thruDisplay = item.thru;
              }
            } else {
              // Player somehow ahead of currentRound (shouldn't really happen)
              thruDisplay = "-";
            }
          }

          const totalDisplay = formatToPar(item.toPar);

          return (
            <TouchableOpacity
              onPress={() => {
                setSelectedGolferId(Number(item.id));
                setShowBio(true);
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderBottomWidth: 1,
                  borderColor: themeColors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: themeColors.text,
                    flex: 1,
                  }}
                >
                  {rankDisplay}. {item.name}
                </Text>

                <Text
                  style={{
                    width: 40,
                    textAlign: "center",
                    fontSize: 16,
                    color: themeColors.text,
                  }}
                >
                  {todayDisplay}
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
                  {totalDisplay}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* PLAYER BIO MODAL */}
      <PlayerBioModal
        visible={showBio}
        golferId={selectedGolferId}
        onClose={() => setShowBio(false)}
        themeColors={themeColors}
      />
    </SafeAreaView>
  );
}
