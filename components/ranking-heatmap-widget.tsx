// components/heatmap/ranking-heatmap-widget.tsx

import { useTheme } from "@/providers/ThemeProvider";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import HeatmapHeader from "./heatmap/HeatmapHeader";
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
  onPress?: () => void; // optional: open full screen
};

export default function RankingHeatmapWidget({ data, onPress }: Props) {
  const { themeColors } = useTheme();

  // No data yet
  if (!data || !data.weeks?.length || !data.teams?.length) {
    return (
      <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.title, { color: themeColors.text }]}>Ranking Heatmap</Text>
        <Text style={{ color: themeColors.text + "99" }}>No trend data available</Text>
      </View>
    );
  }

  // Slice to last 5 weeks
  const lastWeeks = data.weeks.slice(-5);
  const slicedTeams = useMemo(() => {
    return data.teams.map((t) => ({
      ...t,
      ranks: t.ranks.slice(-5),
    }));
  }, [data]);

  const totalTeams = data.teams.length;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
    >
      <Text style={[styles.title, { color: themeColors.text }]}>Ranking Heatmap</Text>

      {/* Header */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HeatmapHeader weekLabels={lastWeeks} />
      </ScrollView>

      {/* Rows */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {slicedTeams.map((team) => (
            <HeatmapRow
              key={team.userId}
              teamName={team.teamName}
              ranks={team.ranks}
              totalTeams={totalTeams}
            />
          ))}
        </View>
      </ScrollView>

      <Text style={[styles.footer, { color: themeColors.text + "66" }]}>
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
