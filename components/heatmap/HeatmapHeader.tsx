// components/heatmap/HeatmapHeader.tsx
import { useTheme } from "@/providers/ThemeProvider";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type HeatmapHeaderProps = {
  weekLabels: (string | number)[];
};

export default function HeatmapHeader({ weekLabels }: HeatmapHeaderProps) {
  const { themeColors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.spacer, { color: "transparent" }]}>Team</Text>

      <View style={styles.weeksContainer}>
        {weekLabels.map((w, idx) => (
          <Text
            key={idx}
            style={[
              styles.weekLabel,
              { color: themeColors.text + "99" },
            ]}
          >
            {`W${w}`}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  spacer: {
    width: 120,
    fontSize: 12,
    fontWeight: "600",
    marginRight: 8,
  },
  weeksContainer: {
    flexDirection: "row",
  },
  weekLabel: {
    width: 22,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "600",
    marginHorizontal: 1,
  },
});
