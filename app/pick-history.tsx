import { useAuth } from "@/app/providers/AuthProvider";
import { useTheme } from "@/app/providers/ThemeProvider";
import supabase from "@/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type PickHistoryItem = {
  id: string;
  tournamentName: string;
  golferName: string;
  headshot: string | null;
  finish: string;
  earnings: number;
  toPar: number | null;
};

export default function PickHistoryScreen() {
  const { themeColors } = useTheme();
  const router = useRouter();
  const { session } = useAuth();

  const [picks, setPicks] = useState<PickHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) return;

    async function loadHistory() {
      setLoading(true);

      // 1️⃣ Fetch picks
      const { data: pickRows, error } = await supabase
        .from("picks")
        .select("id, golfer_id, tournament_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Pick history error:", error);
        setLoading(false);
        return;
      }

      const results: PickHistoryItem[] = [];

      for (const p of pickRows) {
        // 2️⃣ Fetch tournament name
        const { data: tournamentRow } = await supabase
          .from("tournaments")
          .select("name")
          .eq("id", p.tournament_id)
          .single();

        // 3️⃣ Fetch leaderboard for this tournament
        let leaderboard: any[] = [];
        try {
          const res = await fetch(
            "https://abanaxcoxomkspaafcpm.supabase.co/functions/v1/get-leaderboard",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.access_token}`,
              },
              body: JSON.stringify({ tournament_id: p.tournament_id }),
            }
          );

          const json = await res.json();
          leaderboard = json.players ?? [];
        } catch (err) {
          console.error("Leaderboard fetch error:", err);
        }

        // 4️⃣ Find golfer in leaderboard
        const golferRow = leaderboard.find(
          (g: any) => String(g.id) === String(p.golfer_id)
        );

        // 5️⃣ Fetch headshot from ESPN athlete JSON
        let headshot = null;
        try {
          const res = await fetch(
            `https://sports.core.api.espn.com/v2/sports/golf/leagues/pga/athletes/${p.golfer_id}`
          );
          const json = await res.json();
          headshot = json?.headshot?.href ?? null;
        } catch (err) {
          console.log("Headshot fetch failed:", err);
        }

        results.push({
          id: p.id,
          tournamentName: tournamentRow?.name ?? "Unknown Tournament",
          golferName: golferRow?.name ?? "Unknown Golfer",
          headshot,
          finish: golferRow?.rank ?? "--",
          earnings: golferRow?.projected_earnings ?? 0,
          toPar: golferRow?.toPar ?? null,
        });
      }

      setPicks(results);
      setLoading(false);
    }

    loadHistory();
  }, [userId]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Text style={{ color: themeColors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/picks")}>
          <Text style={[styles.backButton, { color: themeColors.tint }]}>← Back</Text>
        </TouchableOpacity>

        <Text style={[styles.header, { color: themeColors.text }]}>
          Your Pick History
        </Text>

        <View style={{ width: 50 }} />
      </View>

      <FlatList
        data={picks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              { backgroundColor: themeColors.card, borderColor: themeColors.border },
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
                    Finish: {item.finish}
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