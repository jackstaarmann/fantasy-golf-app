import { useAuth } from "@/app/providers/AuthProvider";
import { useTheme } from "@/app/providers/ThemeProvider";
import supabase from "@/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PickHistoryItem = {
  id: string;
  tournamentName: string;
  golferName: string;
  headshot: string | null;
  finish: string;
  earnings: number;
  toPar: number | null;
  eventType: string;
  isCompleted: boolean;
};

export default function PickHistoryScreen() {
  const { themeColors } = useTheme();
  const router = useRouter();
  const { session } = useAuth();

  const [picks, setPicks] = useState<PickHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"regular" | "majors">("regular");

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) return;

    async function loadHistory() {
      setLoading(true);

      // 1️⃣ Fetch all picks
      const { data: pickRows, error } = await supabase
        .from("picks")
        .select("id, golfer_id, tournament_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error || !pickRows) {
        console.error("Pick history error:", error);
        setLoading(false);
        return;
      }

      // Extract unique tournament + golfer IDs
      const tournamentIds = [...new Set(pickRows.map((p) => p.tournament_id))];
      const golferIds = [...new Set(pickRows.map((p) => p.golfer_id))];

      // 2️⃣ Batch fetch tournaments
      const { data: tournaments } = await supabase
        .from("tournaments")
        .select("id, name, event_type, in_progress")
        .in("id", tournamentIds);

      const tournamentMap = Object.fromEntries(
        (tournaments ?? []).map((t) => [t.id, t])
      );

      // 3️⃣ Batch fetch leaderboards (parallel)
      const leaderboardMap: Record<string, any[]> = {};

      await Promise.all(
        tournamentIds.map(async (tid) => {
          try {
            const res = await fetch(
              "https://abanaxcoxomkspaafcpm.supabase.co/functions/v1/get-leaderboard",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ tournament_id: tid }),
              }
            );

            const json = await res.json();
            leaderboardMap[tid] = json.players ?? [];
          } catch (err) {
            console.error("Leaderboard fetch error:", err);
            leaderboardMap[tid] = [];
          }
        })
      );

      // 4️⃣ Batch fetch headshots (parallel)
      const headshotMap: Record<string, string | null> = {};

      await Promise.all(
        golferIds.map(async (gid) => {
          try {
            const res = await fetch(
              `https://sports.core.api.espn.com/v2/sports/golf/leagues/pga/athletes/${gid}`
            );
            const json = await res.json();
            headshotMap[gid] = json?.headshot?.href ?? null;
          } catch {
            headshotMap[gid] = null;
          }
        })
      );

      // 5️⃣ Build final results
      const results: PickHistoryItem[] = pickRows.map((p) => {
        const tournament = tournamentMap[p.tournament_id];
        const leaderboard = leaderboardMap[p.tournament_id] ?? [];

        const golferRow = leaderboard.find((g: any) => {
          const ids = (g.athleteIds ?? []).map(String);
          return ids.includes(String(p.golfer_id));
        });

        // Resolve team event names
        let golferName = "Unknown Golfer";
        if (golferRow) {
          const names = golferRow.name.split(" / ").map((n: string) => n.trim());
          const ids = (golferRow.athleteIds ?? []).map(String);
          const idx = ids.indexOf(String(p.golfer_id));
          golferName = names[idx] ?? golferRow.name;
        }

        return {
          id: p.id,
          tournamentName: tournament?.name ?? "Unknown Tournament",
          golferName,
          headshot: headshotMap[p.golfer_id] ?? null,
          finish: golferRow?.rank ?? "--",
          earnings: golferRow?.projected_earnings ?? 0,
          toPar: golferRow?.toPar ?? null,
          eventType: tournament?.event_type ?? "REGULAR",
          isCompleted: tournament?.in_progress === false,
        };
      });

      setPicks(results);
      setLoading(false);
    }

    loadHistory();
  }, [userId]);

  const regularPicks = picks.filter(
    (p) => !p.eventType.startsWith("MAJOR_")
  );

  const majorPicks = picks.filter(
    (p) => p.eventType.startsWith("MAJOR_")
  );

  const dataToRender =
    activeTab === "regular" ? regularPicks : majorPicks;

  // -----------------------------
  // LOADING SPINNER
  // -----------------------------
  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: themeColors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
        edges={["top", "left", "right"]}
      >
        <ActivityIndicator size="large" color={themeColors.tint} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backButton, { color: themeColors.tint }]}>
              ← Back
            </Text>
          </TouchableOpacity>

          <Text style={[styles.header, { color: themeColors.text }]}>
            Your Pick History
          </Text>

          <View style={{ width: 50 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              {
                borderBottomColor:
                  activeTab === "regular"
                    ? themeColors.tint
                    : themeColors.border,
              },
            ]}
            onPress={() => setActiveTab("regular")}
          >
            <Text style={[styles.tabText, { color: themeColors.text }]}>
              Regular Events
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              {
                borderBottomColor:
                  activeTab === "majors"
                    ? themeColors.tint
                    : themeColors.border,
              },
            ]}
            onPress={() => setActiveTab("majors")}
          >
            <Text style={[styles.tabText, { color: themeColors.text }]}>
              Majors
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        <FlatList
          data={dataToRender}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <View style={styles.row}>
                <Image
                  source={
                    item.headshot
                      ? { uri: item.headshot }
                      : require("@/assets/images/golfer-placeholder.png")
                  }
                  style={styles.headshot}
                />

                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: themeColors.text }]}>
                    {item.golferName}
                  </Text>
                  <Text style={[styles.sub, { color: themeColors.text + "99" }]}>
                    {item.tournamentName}
                  </Text>

                  <View style={styles.inline}>
                    <Text style={[styles.result, { color: themeColors.tint }]}>
                      {item.isCompleted ? "Finish" : "Projected"}: {item.finish}
                    </Text>

                    <Text style={[styles.result, { color: themeColors.text + "99" }]}>
                      To Par: {item.toPar ?? "--"}
                    </Text>
                  </View>

                  <Text style={[styles.earnings, { color: themeColors.tint }]}>
                    Earnings: ${item.earnings.toLocaleString()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  backButton: {
    fontSize: 16,
    fontWeight: "600",
  },

  header: {
    fontSize: 20,
    fontWeight: "700",
  },

  tabs: {
    flexDirection: "row",
    marginBottom: 16,
  },

  tabButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderBottomWidth: 2,
  },

  tabText: {
    fontSize: 16,
    fontWeight: "bold",
  },

  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  row: { flexDirection: "row" },

  headshot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },

  name: { fontSize: 16, fontWeight: "600" },

  sub: { fontSize: 14, marginTop: 2 },

  inline: {
    flexDirection: "row",
    marginTop: 6,
    justifyContent: "space-between",
    width: "80%",
  },

  result: { fontSize: 14, fontWeight: "500" },

  earnings: { marginTop: 6, fontSize: 15, fontWeight: "600" },
});
