import { useTheme } from "@/providers/ThemeProvider";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type TeamTrend = {
  userId: string;
  teamName: string;
  ranks: number[];
};

type BigMoversProps = {
  teams: TeamTrend[];
};

export default function BigMoversWidget({ teams }: BigMoversProps) {
  const { themeColors } = useTheme();

  const movers = useMemo(() => {
    if (!teams?.length) return null;

    const hasTwoWeeks = teams[0].ranks.length >= 2;
    if (!hasTwoWeeks) return null;

    const lastIndex = teams[0].ranks.length - 1;

    const deltas = teams
      .map((t) => {
        const prev = t.ranks[lastIndex - 1];
        const curr = t.ranks[lastIndex];
        if (!prev || !curr) return null;

        return {
          userId: t.userId,
          teamName: t.teamName,
          delta: prev - curr,
        };
      })
      .filter(Boolean) as { userId: string; teamName: string; delta: number }[];

    if (!deltas.length) return null;

    const sorted = [...deltas].sort((a, b) => b.delta - a.delta);

    const risers = sorted.filter((d) => d.delta > 0).slice(0, 5);
    const fallers = sorted.filter((d) => d.delta < 0).slice(0, 5);

    return { risers, fallers };
  }, [teams]);

  const styles = themedStyles(themeColors);

  if (!movers || (!movers.risers.length && !movers.fallers.length)) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Big Movers</Text>
        <Text style={styles.text}>No significant movement this week</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Big Movers</Text>

      {/* Risers */}
      <Text style={styles.sectionHeader}>⬆️ Biggest Risers</Text>
      {movers.risers.length ? (
        movers.risers.map((r) => (
          <Text key={r.userId} style={styles.riser}>
            +{r.delta}  {r.teamName}
          </Text>
        ))
      ) : (
        <Text style={styles.text}>No risers this week</Text>
      )}

      {/* Fallers */}
      <Text style={[styles.sectionHeader, { marginTop: 12 }]}>
        ⬇️ Biggest Fallers
      </Text>
      {movers.fallers.length ? (
        movers.fallers.map((f) => (
          <Text key={f.userId} style={styles.faller}>
            {f.delta}  {f.teamName}
          </Text>
        ))
      ) : (
        <Text style={styles.text}>No fallers this week</Text>
      )}
    </View>
  );
}

function themedStyles(themeColors: any) {
  return StyleSheet.create({
    card: {
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
      backgroundColor: themeColors.card,
    },
    title: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 8,
      color: themeColors.text,
    },
    sectionHeader: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 4,
      color: themeColors.text,
    },
    riser: {
      fontSize: 14,
      color: themeColors.tint, // your accent color
      fontWeight: "600",
    },
    faller: {
      fontSize: 14,
      color: "#ff4d4d", // safe red that works in dark mode
      fontWeight: "600",
    },
    text: {
      fontSize: 14,
      color: themeColors.text + "99",
    },
  });
}
