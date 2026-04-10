import { useTheme } from "@/app/providers/ThemeProvider";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type WeatherData = {
  temperature: number;
  conditionId: string;
  windSpeed: number;
  windDirection: string;
  precipitation: number;
};

type Props = {
  weather: WeatherData | null;
};

export default function WeatherWidget({ weather }: Props) {
  const { themeColors } = useTheme();
  if (!weather) return null;

  // -----------------------------
  // Weather Emoji Map
  // -----------------------------
  const WEATHER_EMOJI: Record<string, string> = {
    Sunny: "☀️",
    Clear: "🌙",
    Cloudy: "☁️",
    MostlyCloudy: "🌥️",
    PartlyCloudy: "⛅",
    Rain: "🌧️",
    Showers: "🌦️",
    Thunderstorms: "⛈️",
    Snow: "❄️",
    Fog: "🌫️",
    Windy: "💨",
  };

  const icon = WEATHER_EMOJI[weather.conditionId] ?? "🌤️";

  // -----------------------------
  // Wind Direction → Arrow
  // -----------------------------
  const WIND_ARROWS: Record<string, string> = {
    N: "↑",
    NE: "↗",
    E: "→",
    SE: "↘",
    S: "↓",
    SW: "↙",
    W: "←",
    NW: "↖",
  };

  const windArrow = WIND_ARROWS[weather.windDirection] ?? "";

  // -----------------------------
  // Difficulty Meter
  // -----------------------------
  // Simple scoring:
  // Wind > 15 mph = +2 difficulty
  // Wind 8–15 mph = +1
  // Rain > 40% = +2
  // Rain 10–40% = +1

  let difficultyScore = 0;

  if (weather.windSpeed > 15) difficultyScore += 2;
  else if (weather.windSpeed >= 8) difficultyScore += 1;

  if (weather.precipitation > 40) difficultyScore += 2;
  else if (weather.precipitation >= 10) difficultyScore += 1;

  const difficultyLabel =
    difficultyScore >= 3
      ? "Hard"
      : difficultyScore === 2
      ? "Moderate"
      : "Easy";

  const difficultyColor =
    difficultyScore >= 3
      ? "#D9534F" // red
      : difficultyScore === 2
      ? "#F0AD4E" // orange
      : "#5CB85C"; // green

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
      {/* Temperature + Emoji */}
      <View style={styles.section}>
        <Text style={{ fontSize: 22 }}>{icon}</Text>
        <Text style={[styles.temp, { color: themeColors.text }]}>
          {weather.temperature}°
        </Text>
      </View>

      {/* Wind */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: themeColors.text + "99" }]}>
          Wind
        </Text>
        <Text style={[styles.value, { color: themeColors.text }]}>
          {windArrow} {weather.windSpeed} mph
        </Text>
      </View>

      {/* Rain */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: themeColors.text + "99" }]}>
          Rain
        </Text>
        <Text style={[styles.value, { color: themeColors.text }]}>
          {weather.precipitation}%
        </Text>
      </View>

      {/* Difficulty Meter */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: themeColors.text + "99" }]}>
          Difficulty
        </Text>
        <Text style={[styles.value, { color: difficultyColor }]}>
          {difficultyLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  section: {
    flexDirection: "column",
    alignItems: "center",
    minWidth: 70,
  },
  temp: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: -2,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
  },
});
