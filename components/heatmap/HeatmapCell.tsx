import { useTheme } from "@/providers/ThemeProvider";
import React from "react";
import { StyleSheet, View } from "react-native";
import { getHeatColor } from "./getHeatColor";

type HeatmapCellProps = {
  rank: number;
  totalTeams: number;

  cutsEnabled?: boolean;
  cut1?: number;
  cut2?: number;
  cut3?: number;
};

// ⭐ SHARED SIZING CONSTANTS
export const CELL_SIZE = 22;
export const CELL_MARGIN = 1;
export const CELL_TOTAL = CELL_SIZE + CELL_MARGIN * 2;

export default function HeatmapCell({
  rank,
  totalTeams,
  cutsEnabled = false,
  cut1 = 0,
  cut2 = 0,
  cut3 = 0,
}: HeatmapCellProps) {
  const { themeColors } = useTheme();

  const bg = getHeatColor(
    rank,
    totalTeams,
    themeColors,
    cutsEnabled,
    { cut1, cut2, cut3 }
  );

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
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 4,
    borderWidth: 1,
    marginHorizontal: CELL_MARGIN,
  },
});