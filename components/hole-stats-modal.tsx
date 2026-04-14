import { getHoleStats, HoleStats, HoleStatsRound } from "@/api";
import { useTheme } from "@/app/providers/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  tournamentId: string;
  courseId: string;
  holeNumber: number;
  availableRounds: number[];
}

export default function HoleStatsModal({
  visible,
  onClose,
  tournamentId,
  courseId,
  holeNumber,
  availableRounds,
}: Props) {
  const { themeColors } = useTheme();

  const [selectedRound, setSelectedRound] = useState<number>(availableRounds[0]);
  const [loading, setLoading] = useState(true);
  const [roundsData, setRoundsData] = useState<HoleStatsRound[]>([]);
  const [stats, setStats] = useState<HoleStats | null>(null);

  // Fetch ALL rounds once when modal opens
  useEffect(() => {
    if (!visible) return;

    async function load() {
      setLoading(true);

      const data = await getHoleStats(tournamentId, courseId);

      const validRounds = data.rounds.filter((r) => r.available);
      setRoundsData(validRounds);

      if (!validRounds.some((r) => r.round === selectedRound)) {
        setSelectedRound(validRounds[0]?.round ?? 0);
      }

      setLoading(false);
    }

    load();
  }, [visible]);

  // Update stats when selected round changes
  useEffect(() => {
    if (!visible || roundsData.length === 0) return;

    const roundData = roundsData.find((r) => r.round === selectedRound);

    if (!roundData || !roundData.available) {
      setStats(null);
      return;
    }

    const hole = roundData.holes.find((h) => h.number === holeNumber) ?? null;
    setStats(hole);
  }, [selectedRound, roundsData, holeNumber, visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            maxHeight: "85%",
            backgroundColor: themeColors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 20,
            paddingTop: 20,
          }}
        >
          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            style={{ position: "absolute", top: 10, right: 20 }}
          >
            <Ionicons name="close" size={30} color={themeColors.text} />
          </TouchableOpacity>

          {/* Title */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: themeColors.text,
              marginBottom: 10,
              marginTop: 10,
            }}
          >
            Hole {holeNumber} Stats
          </Text>

          {/* Round Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20 }}
          >
            {roundsData.map((r) => (
              <TouchableOpacity
                key={r.round}
                onPress={() => setSelectedRound(r.round)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                  marginRight: 10,
                  backgroundColor:
                    selectedRound === r.round
                      ? themeColors.primary
                      : themeColors.card,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                }}
              >
                <Text
                  style={{
                    color:
                      selectedRound === r.round
                        ? themeColors.primaryText
                        : themeColors.text, // <-- FIXED: theme-aware
                    fontWeight: "600",
                  }}
                >
                  {r.round === 0 ? "Overall" : `Round ${r.round}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Content */}
          {loading ? (
            <ActivityIndicator size="large" color={themeColors.text} />
          ) : !stats ? (
            <Text style={{ color: themeColors.text }}>
              No stats available for this round.
            </Text>
          ) : (
            <ScrollView>
              {/* Basic Info */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: themeColors.text,
                    marginBottom: 6,
                  }}
                >
                  Par {stats.par} • {stats.yards} yards
                </Text>

                <Text style={{ color: themeColors.text, fontSize: 16 }}>
                  Avg Score: {stats.avgScore?.toFixed(3)}
                </Text>
                <Text style={{ color: themeColors.text, fontSize: 16 }}>
                  Score to Par: {stats.scoreToPar}
                </Text>
                <Text style={{ color: themeColors.text, fontSize: 16 }}>
                  Difficulty Rank: {stats.rank}
                </Text>
              </View>

              {/* Scoring Breakdown */}
              <View
                style={{
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: themeColors.card,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: themeColors.text,
                    marginBottom: 10,
                  }}
                >
                  Scoring Breakdown
                </Text>

                <StatRow label="Eagles" value={stats.eagles} color={themeColors.text} />
                <StatRow label="Birdies" value={stats.birdies} color={themeColors.text} />
                <StatRow label="Pars" value={stats.pars} color={themeColors.text} />
                <StatRow label="Bogeys" value={stats.bogeys} color={themeColors.text} />
                <StatRow
                  label="Double Bogeys"
                  value={stats.doubleBogeys}
                  color={themeColors.text}
                />
                <StatRow label="Other" value={stats.other} color={themeColors.text} />
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
      }}
    >
      <Text style={{ color }}>{label}</Text>
      <Text style={{ color, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}
