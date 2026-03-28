import type { LeaderboardPlayer } from "@/api";
import { usePickSummary } from "@/api";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  tournamentId: string | number;
  inLeague: boolean;
  leagueId?: string | null;
  leaderboard: LeaderboardPlayer[];
  isOpenForPicks: boolean;
};

type PickSummaryItem = {
  golferId: string;
  pickRate: number;
  projectedEarnings: number;
  name: string;
  headshot: string;
  rank?: number;
};

export function PickSummaryWidget({
  tournamentId,
  inLeague,
  leagueId,
  leaderboard,
  isOpenForPicks,
}: Props) {
  const { themeColors } = useTheme();

  const [mode, setMode] = useState<"league" | "global">(
    inLeague ? "league" : "global"
  );
  const [infoVisible, setInfoVisible] = useState(false);

  const normalizedId = String(tournamentId);

  // -------------------------------------------------------
  // PRELOAD BOTH MODES (GLOBAL + LEAGUE)
  // -------------------------------------------------------
  const {
    data: globalHookData,
    loading: globalLoading,
  } = usePickSummary(normalizedId, "global");

  const {
    data: leagueHookData,
    loading: leagueLoading,
  } = usePickSummary(normalizedId, "league", leagueId ?? undefined);

  // Local cached state (soft refresh)
  const [globalData, setGlobalData] = useState<any>(null);
  const [leagueData, setLeagueData] = useState<any>(null);

  // Soft-refresh global
  useEffect(() => {
    if (globalHookData) setGlobalData(globalHookData);
  }, [globalHookData]);

  // Soft-refresh league
  useEffect(() => {
    if (leagueHookData) setLeagueData(leagueHookData);
  }, [leagueHookData]);

  // Active dataset (never blank)
  const activeData = mode === "global" ? globalData : leagueData;

  // First-load spinner (only if both are empty)
  const initialLoading =
    !globalData && (mode === "global" ? globalLoading : false) ||
    (!leagueData && mode === "league" && leagueLoading);

  const hasData =
    activeData &&
    Array.isArray(activeData.topPicks) &&
    activeData.topPicks.length > 0;

  // -------------------------------------------------------
  // DERIVED STATE
  // -------------------------------------------------------
  const topPicksWithEarnings = useMemo(() => {
    if (!hasData) return [];

    return activeData.topPicks.map((p: PickSummaryItem) => {
      const lb = leaderboard.find((g) => g.id === p.golferId);
      return {
        ...p,
        projectedEarnings: lb?.projected_earnings ?? 0,
      };
    });
  }, [activeData, leaderboard, hasData]);

  const yourPickWithEarnings = useMemo(() => {
    if (!activeData?.yourPick) return null;

    const lb = leaderboard.find((g) => g.id === activeData.yourPick.golferId);
    return {
      ...activeData.yourPick,
      projectedEarnings: lb?.projected_earnings ?? 0,
    };
  }, [activeData, leaderboard]);

  // -------------------------------------------------------
  // LOCKED STATE
  // -------------------------------------------------------
  if (isOpenForPicks) {
    return (
      <View
        style={{
          marginTop: 20,
          padding: 16,
          borderRadius: 12,
          backgroundColor: themeColors.card,
          borderWidth: 1,
          borderColor: themeColors.border,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: themeColors.border,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text style={{ fontSize: 24, color: themeColors.text + "99" }}>
            🔒
          </Text>
        </View>

        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: themeColors.text,
          }}
        >
          Pick Trends Locked
        </Text>

        <Text
          style={{
            marginTop: 6,
            color: themeColors.text + "99",
            textAlign: "center",
            fontSize: 14,
          }}
        >
          Trends will unlock once picks close.
        </Text>
      </View>
    );
  }

  // -------------------------------------------------------
  // NORMAL PICK SUMMARY
  // -------------------------------------------------------
  return (
    <View
      style={{
        marginTop: 20,
        padding: 16,
        borderRadius: 12,
        backgroundColor: themeColors.card,
        borderWidth: 1,
        borderColor: themeColors.border,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "600", color: themeColors.text }}>
          Pick Trends
        </Text>

        {/* Toggle */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: themeColors.border,
            borderRadius: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => setMode("league")}
            disabled={!inLeague}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              backgroundColor:
                mode === "league" ? themeColors.tint : "transparent",
              borderRadius: 8,
              opacity: inLeague ? 1 : 0.4,
            }}
          >
            <Text
              style={{
                color:
                  mode === "league"
                    ? themeColors.background
                    : themeColors.text + "99",
              }}
            >
              League
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMode("global")}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              backgroundColor:
                mode === "global" ? themeColors.tint : "transparent",
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color:
                  mode === "global"
                    ? themeColors.background
                    : themeColors.text + "99",
              }}
            >
              Global
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Spinner only on FIRST load */}
      {initialLoading && (
        <View style={{ paddingVertical: 20 }}>
          <ActivityIndicator color={themeColors.tint} />
        </View>
      )}

      {/* No picks */}
      {!initialLoading && !hasData && (
        <Text style={{ color: themeColors.text + "99" }}>No picks yet.</Text>
      )}

      {/* Chalk Meter */}
      {!initialLoading && hasData && (
        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <Text style={{ fontWeight: "500", marginRight: 6, color: themeColors.text }}>
              Chalk Meter
            </Text>

            <TouchableOpacity onPress={() => setInfoVisible(true)}>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 1,
                  borderColor: themeColors.text + "99",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 12, color: themeColors.text + "99" }}>
                  i
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View
            style={{
              height: 8,
              backgroundColor: themeColors.border,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: 8,
                width: `${(activeData.chalkScore ?? 0) * 100}%`,
                backgroundColor: themeColors.tint,
              }}
            />
          </View>
        </View>
      )}

      {/* Chalk Meter Info Modal */}
      <Modal
        visible={infoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setInfoVisible(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: themeColors.card,
              padding: 20,
              borderRadius: 12,
              maxWidth: 300,
              borderWidth: 1,
              borderColor: themeColors.border,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 8,
                color: themeColors.text,
              }}
            >
              Chalk Meter
            </Text>
            <Text style={{ fontSize: 14, color: themeColors.text + "99" }}>
              The Chalk Meter shows how concentrated the picks are this week.
              A longer bar means more people picked the same golfer.
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Top Picks */}
      {!initialLoading &&
        hasData &&
        topPicksWithEarnings.map(
          (p: PickSummaryItem, idx: number) => (
            <View
              key={p.golferId}
              style={{
                paddingVertical: 10,
                borderBottomWidth:
                  idx === topPicksWithEarnings.length - 1 ? 0 : 1,
                borderColor: themeColors.border,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontSize: 16, color: themeColors.text }}>
                {p.name}
              </Text>

              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 14, color: themeColors.text }}>
                  {(p.pickRate * 100).toFixed(1)}%
                </Text>
                <Text style={{ fontSize: 12, color: themeColors.text + "99" }}>
                  ${Math.round(p.projectedEarnings).toLocaleString()}
                </Text>
              </View>
            </View>
          )
        )}

      {/* Your Pick */}
      {!initialLoading && yourPickWithEarnings && (
        <View
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: themeColors.background,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: themeColors.border,
          }}
        >
          <Text style={{ fontWeight: "600", color: themeColors.text }}>
            Your Pick
          </Text>
          <Text style={{ marginTop: 4, color: themeColors.text }}>
            Pick Rate: {(yourPickWithEarnings.pickRate * 100).toFixed(1)}% •
            Rank {yourPickWithEarnings.rank}
          </Text>
          <Text style={{ marginTop: 4, color: themeColors.text + "99" }}>
            Earnings: ${yourPickWithEarnings.projectedEarnings.toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  );
}