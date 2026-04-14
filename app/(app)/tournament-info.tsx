import { CourseLayout, fetchEventMeta, getCourseLayout } from "@/api";
import { useTheme } from "@/app/providers/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import HoleStatsModal from "@/components/hole-stats-modal";
import SwingFooter from "@/components/SwingFooter"; // ⭐ NEW IMPORT

export default function TournamentInfoScreen() {
  const { tournamentId } = useLocalSearchParams<{ tournamentId: string }>();
  const { themeColors } = useTheme();

  const [layout, setLayout] = useState<CourseLayout | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedHole, setSelectedHole] = useState<number | null>(null);
  const [availableRounds, setAvailableRounds] = useState<number[]>([0]);

  const [defendingChamp, setDefendingChamp] = useState<{
    name: string | null;
    headshot: string | null;
    flag: string | null;
  } | null>(null);

  // ---------------------------
  // LOAD DEFENDING CHAMP
  // ---------------------------
  useEffect(() => {
    async function loadDefendingChampion() {
      try {
        const meta = await fetchEventMeta(Number(tournamentId));
        const champ = meta?.defendingChampion?.athlete;

        if (champ) {
          setDefendingChamp({
            name: champ.fullName ?? null,
            headshot: champ.headshot?.href ?? null,
            flag: champ.flag?.href ?? null,
          });
        }
      } catch (err) {
        console.error("Failed to load defending champion", err);
      }
    }

    if (tournamentId) loadDefendingChampion();
  }, [tournamentId]);

  // ---------------------------
  // LOAD COURSE LAYOUT
  // ---------------------------
  useEffect(() => {
    async function load() {
      try {
        if (!tournamentId) return;

        const data = await getCourseLayout(tournamentId);
        setLayout(data);

        if (data?.tournamentRoundStats?.length) {
          const rounds = [0];
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

  // ---------------------------
  // LOADING STATES
  // ---------------------------
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

  // ---------------------------
  // MAIN UI
  // ---------------------------
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
          style={{ padding: 6, width: 40 }}
        >
          <Ionicons name="chevron-back" size={28} color={themeColors.text} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: "center" }}>
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

        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* --------------------------- */}
        {/* DEFENDING CHAMPION SECTION */}
        {/* --------------------------- */}
        {defendingChamp && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                marginBottom: 12,
                color: themeColors.text,
              }}
            >
              Defending Champion
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {defendingChamp.headshot && (
                <Image
                  source={{ uri: defendingChamp.headshot }}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    marginRight: 14,
                  }}
                />
              )}

              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: themeColors.text,
                  }}
                >
                  {defendingChamp.name}
                </Text>

                {defendingChamp.flag && (
                  <Image
                    source={{ uri: defendingChamp.flag }}
                    style={{
                      width: 32,
                      height: 20,
                      borderRadius: 3,
                      marginTop: 6,
                    }}
                  />
                )}
              </View>
            </View>
          </View>
        )}

        {/* --------------------------- */}
        {/* COURSE LAYOUT HEADER */}
        {/* --------------------------- */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
            marginBottom: 10,
            color: themeColors.text,
          }}
        >
          Course Layout
        </Text>

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
                onPress={() => setSelectedHole(hole.number)}
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

      {/* --------------------------- */}
      {/* FOOTER */}
      {/* --------------------------- */}
      <SwingFooter />

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
