import { CourseLayout, getCourseLayout } from "@/api";
import { useTheme } from "@/app/providers/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function TournamentInfoScreen() {
  const { tournamentId } = useLocalSearchParams<{ tournamentId: string }>();
  const { themeColors, theme } = useTheme();

  const [layout, setLayout] = useState<CourseLayout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (!tournamentId) return;
        const data = await getCourseLayout(tournamentId);
        setLayout(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tournamentId]);

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: themeColors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={themeColors.text} />
      </SafeAreaView>
    );
  }

  if (!layout) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: themeColors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: themeColors.text }}>
          Unable to load course layout.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingBottom: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 6, marginRight: 10 }}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={themeColors.text}
          />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: themeColors.text,
          }}
        >
          Course Layout
        </Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Overview */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, color: themeColors.text }}>
            Total Yards: {layout.totalYards}
          </Text>
          <Text style={{ fontSize: 16, color: themeColors.text }}>
            Total Par: {layout.totalPar}
          </Text>
          <Text style={{ fontSize: 16, color: themeColors.text }}>
            Front 9 Par: {layout.parOut}
          </Text>
          <Text style={{ fontSize: 16, color: themeColors.text }}>
            Back 9 Par: {layout.parIn}
          </Text>
        </View>

        {/* Holes */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
            marginBottom: 10,
            color: themeColors.text,
          }}
        >
          Holes
        </Text>

        {layout.holes.map((hole) => (
          <View
            key={hole.number}
            style={{
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderColor: themeColors.border,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "500",
                color: themeColors.text,
              }}
            >
              Hole {hole.number}
            </Text>
            <Text style={{ color: themeColors.text }}>Par: {hole.par}</Text>
            <Text style={{ color: themeColors.text }}>
              Yardage: {hole.yardage}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
