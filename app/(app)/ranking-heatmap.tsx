import { useRankingTrends } from "@/api";
import { CELL_TOTAL } from "@/components/heatmap/HeatmapCell";
import HeatmapRow from "@/components/heatmap/HeatmapRow";
import { useTheme } from "@/providers/ThemeProvider";
import supabase from "@/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TeamTrend = {
  userId: string;
  teamName: string;
  ranks: number[];
};

export default function RankingHeatmapScreen() {
  const router = useRouter();
  const { leagueId } = useLocalSearchParams<{ leagueId: string }>();
  const { themeColors } = useTheme();

  const { data: rankingTrends } = useRankingTrends(leagueId);

  const weeks: number[] = rankingTrends?.weeks ?? [];
  const teams: TeamTrend[] = rankingTrends?.teams ?? [];
  const totalTeams = teams.length;

  // CUT SETTINGS
  const [cutsEnabled, setCutsEnabled] = React.useState(false);
  const [cutPercents, setCutPercents] = React.useState<number[]>([
    70,
    50,
    30,
  ]);

  React.useEffect(() => {
    if (!leagueId) return;

    supabase
      .from("leagues")
      .select("cuts_enabled, cut1_percent, cut2_percent, cut3_percent")
      .eq("id", leagueId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;

        setCutsEnabled(data.cuts_enabled ?? false);

        setCutPercents([
          data.cut1_percent ?? 70,
          data.cut2_percent ?? 50,
          data.cut3_percent ?? 30,
        ]);
      });
  }, [leagueId]);

  const [cut1, cut2, cut3] = cutPercents.map((p) =>
    Math.ceil(totalTeams * (p / 100))
  );

  // Sort by latest rank
  const sortedTeams = [...teams].sort((a, b) => {
    const rankA = a.ranks[a.ranks.length - 1] ?? 999;
    const rankB = b.ranks[b.ranks.length - 1] ?? 999;

    return rankA - rankB;
  });

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: themeColors.background,
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderColor: themeColors.border,
          backgroundColor: themeColors.background,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            paddingVertical: 6,
            paddingRight: 20,
            width: 60,
          }}
        >
          <Text
            style={{
              color: themeColors.text,
              fontSize: 16,
            }}
          >
            ← Back
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: themeColors.text,
            marginTop: 4,
          }}
        >
          Full Season Heatmap
        </Text>
      </View>

      {/* Content */}
      {!weeks.length || !teams.length ? (
        <View style={{ padding: 20 }}>
          <Text style={{ color: themeColors.text + "99" }}>
            No ranking trend data available.
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 20,
            }}
          >
            <View>
              {/* Header Row */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                {/* Rank spacer */}
                <View
                  style={{
                    width: 24,
                    marginRight: 6,
                  }}
                />

                {/* Team spacer */}
                <View
                  style={{
                    width: 120,
                    marginRight: 8,
                  }}
                />

                {/* Week labels */}
                <View style={{ flexDirection: "row" }}>
                  {weeks.map((week: number) => (
                    <View
                      key={week}
                      style={{
                        width: CELL_TOTAL,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: themeColors.text + "99",
                          fontSize: 11,
                          fontWeight: "600",
                        }}
                      >
                        W{week}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Team Rows */}
              {sortedTeams.map((team) => {
                const latestRank =
                  team.ranks[team.ranks.length - 1];

                return (
                  <View
                    key={team.userId}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    {/* Rank Number */}
                    <Text
                      style={{
                        width: 24,
                        textAlign: "center",
                        fontSize: 12,
                        fontWeight: "700",
                        color: themeColors.text,
                        marginRight: 6,
                      }}
                    >
                      {latestRank}
                    </Text>

                    {/* Heatmap Row */}
                    <HeatmapRow
                      teamName={team.teamName}
                      ranks={team.ranks}
                      totalTeams={totalTeams}
                      cutsEnabled={cutsEnabled}
                      cut1={cut1}
                      cut2={cut2}
                      cut3={cut3}
                    />
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});