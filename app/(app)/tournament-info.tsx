import { CourseLayout, getCourseLayout } from "@/api";
import { useTheme } from "@/app/providers/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import HoleStatsModal from "@/components/hole-stats-modal";

export default function TournamentInfoScreen() {
  const { tournamentId } = useLocalSearchParams<{ tournamentId: string }>();
  const { themeColors } = useTheme();

  const [layout, setLayout] = useState<CourseLayout | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedHole, setSelectedHole] = useState<number | null>(null);

  // Available rounds for stats (default: overall)
  const [availableRounds, setAvailableRounds] = useState<number[]>([0]);

  useEffect(() => {
    async function load() {
      try {
        if (!tournamentId) return;

        const data = await getCourseLayout(tournamentId);
        setLayout(data);

        // Extract available rounds from ESPN structure
        if (data?.tournamentRoundStats?.length) {
          const rounds = [0]; // always include overall

          data.tournamentRoundStats.forEach((refObj: any) => {
            if (refObj?.$ref) {
              const roundNum = extractRoundFromRef(refObj.$ref);
              if (!isNaN(roundNum)) rounds.push(roundNum);
            }
          });

          setAvailableRounds(rounds);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tournamentId]);

  function extractRoundFromRef(url: string): number {
    try {
      const parts = url.split("/rounds/");
      return parseInt(parts[1].split("/")[0], 10);
    } catch {
      return NaN;
    }
  }

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
          <Ionicons name="chevron-back" size={28} color={themeColors.text} />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: themeColors.text,
          }}
        >
          Tournament Info
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

        <FlatList
          data={layout.holes}
          keyExtractor={(h) => h.number.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToAlignment="center"
          decelerationRate="fast"
          snapToInterval={140}
          contentContainerStyle={{ paddingRight: 20 }}
          renderItem={({ item: hole }) => (
            <View style={{ marginRight: 16 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  console.log("Pressed hole:", hole.number);
                  setSelectedHole(hole.number);
                }}
                style={{
                  width: 120,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: themeColors.card,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    marginBottom: 6,
                    color: themeColors.text,
                  }}
                >
                  Hole {hole.number}
                </Text>

                <Text style={{ color: themeColors.text, marginBottom: 2 }}>
                  Par: {hole.par}
                </Text>

                <Text style={{ color: themeColors.text }}>
                  Yards: {hole.yardage}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </ScrollView>

      {/* Hole Stats Modal */}
      <HoleStatsModal
        visible={selectedHole !== null}
        onClose={() => setSelectedHole(null)}
        tournamentId={tournamentId}
        courseId={layout.courseId}
        holeNumber={selectedHole ?? 1}
        availableRounds={availableRounds}
      />
    </SafeAreaView>
  );
}
