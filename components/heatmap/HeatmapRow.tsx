// components/heatmap/HeatmapRow.tsx
import { useTheme } from "@/providers/ThemeProvider";
import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import HeatmapCell from "./HeatmapCell";

type HeatmapRowProps = {
  teamName: string;
  ranks: number[];      // sliced to last 5 weeks by parent
  totalTeams: number;
};

function HeatmapRowBase({ teamName, ranks, totalTeams }: HeatmapRowProps) {
  const { themeColors } = useTheme();

  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.teamName,
          { color: themeColors.text },
        ]}
        numberOfLines={1}
      >
        {teamName}
      </Text>

      <View style={styles.cellsContainer}>
        {ranks.map((rank, idx) => (
          <HeatmapCell
            key={idx}
            rank={rank}
            totalTeams={totalTeams}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  teamName: {
    width: 120,
    fontSize: 12,
    fontWeight: "500",
    marginRight: 8,
  },
  cellsContainer: {
    flexDirection: "row",
  },
});

const HeatmapRow = memo(HeatmapRowBase);
export default HeatmapRow;
