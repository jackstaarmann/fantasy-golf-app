import { CELL_TOTAL } from "@/components/heatmap/HeatmapCell";
import { useTheme } from "@/providers/ThemeProvider";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import HeatmapRow from "./heatmap/HeatmapRow";

type TeamTrend = {
  userId: string;
  teamName: string;
  ranks: number[];
};

type RankingTrends = {
  weeks: number[];
  teams: TeamTrend[];
};

type Props = {
  data: RankingTrends | null;
  onPress?: () => void;

  // CUT SETTINGS
  cutsEnabled?: boolean;
  cutPercents?: number[]; // [70, 50, 30]
};

export default function RankingHeatmapWidget({
  data,
  onPress,
  cutsEnabled = false,
  cutPercents = [70, 50, 30],
}: Props) {
  const { themeColors } = useTheme();

  // No data yet
  if (!data || !data.weeks?.length || !data.teams?.length) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: themeColors.card,
            borderColor: themeColors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.title,
            { color: themeColors.text },
          ]}
        >
          Ranking Heatmap
        </Text>

        <Text style={{ color: themeColors.text + "99" }}>
          No trend data available
        </Text>
      </View>
    );
  }

  // ⭐ Slice to last 7 weeks
  const lastWeeks = data.weeks.slice(-7);

  const slicedTeams = useMemo(() => {
    return data.teams.map((t) => ({
      ...t,
      ranks: t.ranks.slice(-7),
    }));
  }, [data]);

  const totalTeams = data.teams.length;

  // Compute cut thresholds
  const [cut1, cut2, cut3] = cutPercents.map((p) =>
    Math.ceil(totalTeams * (p / 100))
  );

  // ⭐ SORT BY CURRENT RANK
  const sortedTeams = [...slicedTeams].sort((a, b) => {
    const rankA = a.ranks[a.ranks.length - 1] ?? 999;
    const rankB = b.ranks[b.ranks.length - 1] ?? 999;

    return rankA - rankB;
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: themeColors.text },
        ]}
      >
        Ranking Heatmap
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
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
              {lastWeeks.map((week: number) => (
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

      <Text
        style={[
          styles.footer,
          { color: themeColors.text + "66" },
        ]}
      >
        Tap to view full season heatmap
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },

  footer: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "center",
  },
});
