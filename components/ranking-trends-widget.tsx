import supabase from "@/supabase";
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { VictoryAxis, VictoryChart, VictoryLine } from "victory-native";

type RankingTrendsWidgetProps = {
  leagueId: string;
  userId: string;
};

type ApiResponse = {
  weeks: number[];
  teams: {
    userId: string;
    teamName: string;
    ranks: number[];
  }[];
};

export default function RankingTrendsWidget({
  leagueId,
  userId,
}: RankingTrendsWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState<number[]>([]);
  const [teamRanks, setTeamRanks] = useState<number[]>([]);

  useEffect(() => {
    if (!leagueId || !userId) return;

    const fetchTrends = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke(
          "get-ranking-trends",
          {
            body: { league_id: leagueId },
          }
        );

        if (error) throw error;

        const res = data as ApiResponse;

        setWeeks(res?.weeks ?? []);

        const currentUser = res?.teams?.find(
          (t) => t.userId === userId
        );

        setTeamRanks(currentUser?.ranks ?? []);
      } catch (err) {
        console.error("Ranking trends error:", err);
        setWeeks([]);
        setTeamRanks([]);
      }

      setLoading(false);
    };

    fetchTrends();
  }, [leagueId, userId]);

  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.text}>Loading trends...</Text>
      </View>
    );
  }

  if (!weeks.length || !teamRanks.length) {
    return (
      <View style={styles.card}>
        <Text style={styles.text}>No trend data available</Text>
      </View>
    );
  }

  const chartData = weeks.map((week, i) => ({
    x: week,
    y: teamRanks[i],
  }));

  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Ranking Trends</Text>

      <VictoryChart
        width={screenWidth - 60}
        height={220}
      >
        {/* X axis (weeks) */}
        <VictoryAxis />

        {/* Y axis (rank — inverted so rank 1 is at top) */}
        <VictoryAxis dependentAxis inverted />

        <VictoryLine
          data={chartData}
          interpolation="natural"
          style={{
            data: { stroke: "#4f46e5", strokeWidth: 3 },
          }}
        />
      </VictoryChart>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
  },
});