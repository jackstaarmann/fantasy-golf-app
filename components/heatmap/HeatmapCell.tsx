// components/heatmap/HeatmapCell.tsx
import { useTheme } from "@/providers/ThemeProvider";
import React from "react";
import { StyleSheet, View } from "react-native";
import { getHeatColor } from "./getHeatColor";

type HeatmapCellProps = {
  rank: number;
  totalTeams: number;
};

export default function HeatmapCell({ rank, totalTeams }: HeatmapCellProps) {
  const { themeColors } = useTheme();

  const bg = getHeatColor(rank, totalTeams, themeColors);

  return (
    <View
      style={[
        styles.cell,
        {
          backgroundColor: bg,
          borderColor: themeColors.border,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  cell: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    marginHorizontal: 1,
  },
});
