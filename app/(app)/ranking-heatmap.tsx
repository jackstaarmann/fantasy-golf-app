import { useRankingTrends } from "@/api";
import { useTheme } from "@/providers/ThemeProvider";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import HeatmapHeader from "@/components/heatmap/HeatmapHeader";
import HeatmapRow from "@/components/heatmap/HeatmapRow";

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

  const weeks = rankingTrends?.weeks ?? [];
  const teams: TeamTrend[] = rankingTrends?.teams ?? [];
  const totalTeams = teams.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
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
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingVertical: 6, paddingRight: 20, width: 60 }}
        >
          <Text style={{ color: themeColors.text, fontSize: 16 }}>← Back</Text>
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
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}
          >
            <View>
              {/* Week Labels */}
              <HeatmapHeader weekLabels={weeks} />

              {/* Team Rows */}
              {teams.map((team: TeamTrend) => (
                <HeatmapRow
                  key={team.userId}
                  teamName={team.teamName}
                  ranks={team.ranks}
                  totalTeams={totalTeams}
                />
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
