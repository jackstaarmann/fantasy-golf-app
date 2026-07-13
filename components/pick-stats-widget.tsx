import { useTheme } from "@/providers/ThemeProvider";
import supabase from "@/supabase";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
 
type PickStats = {
  season: string | null;
  winners: number;
  top5: number;
  top10: number;
  madeCutPercentage: number;
  averageFinish: number | null;
  totalPicks: number;
};
 
type Props = {
  userId: string | null;
};
 
const SEASONS = ["Career", "2024", "2025", "2026"];
 
export default function PickStatsWidget({ userId }: Props) {
  const { themeColors } = useTheme();
 
  const [season, setSeason] = useState<string | null>(null); // null = Career
  const [stats, setStats] = useState<PickStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  const fetchStats = async (selectedSeason: string | null) => {
    if (!userId) {
      console.log("⏳ StatsWidget waiting for userId...");
      return;
    }
 
    setLoading(true);
    setError(null);
 
    const { data, error } = await supabase.functions.invoke("user-stats", {
      body: {
        userId,
        season: selectedSeason === "Career" ? null : selectedSeason,
      },
    });
 
    if (error) {
      console.error("❌ PickStats error:", error);
      setStats(null);
      setError("Couldn't load your stats. Pull to refresh or try again.");
      setLoading(false);
      return;
    }
 
    setStats(data);
    setLoading(false);
  };
 
  useEffect(() => {
    if (!userId) return;
    fetchStats(season);
  }, [season, userId]);
 
  const renderStat = (label: string, value: string | number | null) => (
    <View style={styles.statBox}>
      <Text
        style={[
          styles.statLabel,
          { color: themeColors.text + "99" },
        ]}
      >
        {label}
      </Text>
 
      <Text
        style={[
          styles.statValue,
          { color: themeColors.tint },
        ]}
      >
        {value ?? "-"}
      </Text>
    </View>
  );
 
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
        },
      ]}
    >
      <Text style={[styles.title, { color: themeColors.text }]}>
        Your Pick Stats
      </Text>
 
      {/* Season Selector */}
      <View style={styles.seasonRow}>
        {SEASONS.map((s) => {
          const isSelected =
            (season === null && s === "Career") || season === s;
 
          return (
            <TouchableOpacity
              key={s}
              onPress={() => setSeason(s === "Career" ? null : s)}
              style={[
                styles.seasonButton,
                {
                  backgroundColor: isSelected
                    ? themeColors.tint
                    : "transparent",
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: isSelected
                    ? themeColors.background
                    : themeColors.text,
                  fontWeight: "600",
                }}
              >
                {s}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
 
      {loading ? (
        <View style={{ paddingVertical: 20 }}>
          <ActivityIndicator size="large" color={themeColors.tint} />
        </View>
      ) : error ? (
        <View style={{ paddingVertical: 20 }}>
          <Text
            style={{
              color: themeColors.text,
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => fetchStats(season)}
            style={[
              styles.seasonButton,
              {
                alignSelf: "center",
                borderColor: themeColors.border,
              },
            ]}
          >
            <Text style={{ color: themeColors.text, fontWeight: "600" }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : stats ? (
        <>
          <View style={styles.grid}>
            {renderStat("Winners", stats.winners)}
            {renderStat("Top 5s", stats.top5)}
            {renderStat("Top 10s", stats.top10)}
            {renderStat("Made Cut %", `${stats.madeCutPercentage}%`)}
            {renderStat("Avg Finish", stats.averageFinish)}
            {renderStat("Total Picks", stats.totalPicks)}
          </View>
 
          <Text
            style={{
              marginTop: 12,
              fontSize: 13,
              color: themeColors.text + "99",
              textAlign: "center",
            }}
          >
            Season: {stats.season ?? "Career"}
          </Text>
        </>
      ) : null}
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  seasonRow: {
    flexDirection: "row",
    marginBottom: 15,
    flexWrap: "wrap",
  },
  seasonButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statBox: {
    width: "48%",
    paddingVertical: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
});