import { getProjectedSeasonStandings, useAvailableTournaments, useRankingTrends } from '@/api';
import { useTheme } from "@/providers/ThemeProvider";
import supabase from '@/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BigMoversWidget from "@/components/big-movers-widget";
import RankingHeatmapWidget from "@/components/ranking-heatmap-widget";

type LeaderboardUser = {
  id: string;
  name: string | null;
  team_name: string | null;
  email: string;
  total_points: number;
  movement?: number;
  out_of_first?: number;
};

type LeaderboardMode = 'live' | 'projected' | 'outOfFirst';

export default function LeaderboardScreen() {
  const router = useRouter();
  const { themeColors } = useTheme();

  const [activeTab, setActiveTab] = useState<'global' | 'league'>('global');

  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardUser[]>([]);
  const [leagueLeaderboard, setLeagueLeaderboard] = useState<LeaderboardUser[]>([]);
  const [projected, setProjected] = useState<LeaderboardUser[]>([]);
  const [mode, setMode] = useState<LeaderboardMode>('live');

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [leagueId, setLeagueId] = useState<string | null>(null);
  const [tournamentId, setTournamentId] = useState<string | null>(null);

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [leagueName, setLeagueName] = useState<string | null>(null);
  const [isCommissioner, setIsCommissioner] = useState(false);

  const [profileMap, setProfileMap] = useState<Record<string, any>>({});

  const { data: rankingTrends } = useRankingTrends(leagueId);

  const { tournaments: availableTournaments } = useAvailableTournaments();

  const [cutsEnabled, setCutsEnabled] = useState(false);
  const [cutPercents, setCutPercents] = useState<number[]>([70, 50, 30]);

  // ---------------------------------------------------------
  // Set userId
  // ---------------------------------------------------------
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  // ---------------------------------------------------------
  // Set leagueId + commissioner status
  // ---------------------------------------------------------
  useEffect(() => {
    if (!userId) return;

    supabase
      .from('league_members')
      .select('league_id, commissioner_status')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        setLeagueId(data?.league_id ?? null);
        setIsCommissioner(data?.commissioner_status ?? false);
      });
  }, [userId]);

  // ---------------------------------------------------------
  // Set tournamentId using your hook (THIS FIXES PROJECTIONS)
  // ---------------------------------------------------------
  useEffect(() => {
    if (!availableTournaments || availableTournaments.length === 0) return;

    const primary = availableTournaments[0]; // same logic as homepage
    setTournamentId(String(primary.id));
  }, [availableTournaments]);

  // ---------------------------------------------------------
  // Load league metadata
  // ---------------------------------------------------------
  useFocusEffect(
    useCallback(() => {
      if (!leagueId) return;

      supabase
        .from('leagues')
        .select('invite_code, name, cuts_enabled, cut1_percent, cut2_percent, cut3_percent')
        .eq('id', leagueId)
        .maybeSingle()
        .then(({ data }) => {
          setInviteCode(data?.invite_code ?? null);
          setLeagueName(data?.name ?? null);

          setCutsEnabled(data?.cuts_enabled ?? false);
          setCutPercents([
            data?.cut1_percent ?? 70,
            data?.cut2_percent ?? 50,
            data?.cut3_percent ?? 30,
          ]);
        });
    }, [leagueId])
  );

  // ---------------------------------------------------------
  // Fetch leaderboard (global or league)
  // ---------------------------------------------------------
  async function fetchLeaderboard(tab: 'global' | 'league') {
    setLoading(true);

    try {
      let userIds: string[] = [];

      if (tab === 'global') {
        const { data: profiles } = await supabase
          .from('users')
          .select('id');

        userIds = profiles?.map((p) => p.id) ?? [];
      } else {
        if (!leagueId) {
          setLeagueLeaderboard([]);
          setLoading(false);
          return;
        }

        const { data: members } = await supabase
          .from('league_members')
          .select('user_id')
          .eq('league_id', leagueId);

        userIds = members?.map((m) => m.user_id) ?? [];
      }

      if (userIds.length === 0) {
        tab === 'global'
          ? setGlobalLeaderboard([])
          : setLeagueLeaderboard([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('users')
        .select('id, name, team_name, email')
        .in('id', userIds);

      const { data: picks } = await supabase
        .from('picks')
        .select('user_id, points')
        .in('user_id', userIds);

      const totals: Record<string, LeaderboardUser> = {};

      (profiles ?? []).forEach((p) => {
        totals[p.id] = {
          id: p.id,
          name: p.name,
          team_name: p.team_name,
          email: p.email,
          total_points: 0,
        };
      });

      (picks ?? []).forEach((pick) => {
        totals[pick.user_id].total_points += Number(pick.points || 0);
      });

      const sorted = Object.values(totals).sort(
        (a, b) => b.total_points - a.total_points
      );

      if (tab === 'global') setGlobalLeaderboard(sorted);
      else setLeagueLeaderboard(sorted);

      setProfileMap(Object.fromEntries((profiles ?? []).map((p) => [p.id, p])));

    } catch (err) {
      console.error('Leaderboard error:', err);
      tab === 'global'
        ? setGlobalLeaderboard([])
        : setLeagueLeaderboard([]);
    }

    setLoading(false);
  }

  // ---------------------------------------------------------
  // Auto-fetch leaderboard when switching tabs
  // ---------------------------------------------------------
  useEffect(() => {
    if (!userId) return;

    if (activeTab === 'global' && globalLeaderboard.length === 0) {
      fetchLeaderboard('global');
    }

    if (activeTab === 'league' && leagueId && leagueLeaderboard.length === 0) {
      fetchLeaderboard('league');
    }
  }, [activeTab, leagueId, userId]);

  // ---------------------------------------------------------
  // Fetch projected standings (NOW WORKS)
  // ---------------------------------------------------------
  async function fetchProjected() {
    if (!leagueId || !tournamentId) return;

    try {
      const data = await getProjectedSeasonStandings(leagueId, tournamentId);
      const rows = data.standings ?? data;

      const normalized = rows.map((p: any) => {
        const profile = profileMap[p.user_id];

        return {
          id: p.user_id,
          name: profile?.name ?? "Unknown",
          team_name: profile?.team_name ?? null,
          email: profile?.email ?? "",
          total_points: p.projected_total,
          movement: p.movement ?? 0,
        };
      });

      setProjected(normalized);
    } catch (err) {
      console.error("Projected standings error:", err);
      setProjected([]);
    }
  }

  // ---------------------------------------------------------
  // Movement arrow
  // ---------------------------------------------------------
  function renderMovementArrow(movement: number) {
    if (movement > 0) {
      return (
        <Text style={{ color: themeColors.tint, fontWeight: "bold" }}>
          ↑{movement}
        </Text>
      );
    }
    if (movement < 0) {
      return (
        <Text style={{ color: "#ff4d4d", fontWeight: "bold" }}>
          ↓{Math.abs(movement)}
        </Text>
      );
    }
    return (
      <Text style={{ color: themeColors.text + "66" }}>
        –
      </Text>
    );
  }

  // ---------------------------------------------------------
  // Out-of-first mode
  // ---------------------------------------------------------
  function computeOutOfFirst(rows: LeaderboardUser[]) {
    if (!rows.length) return [];
    const leader = rows[0].total_points;

    return rows.map((u) => ({
      ...u,
      out_of_first: leader - u.total_points,
    }));
  }

  // ---------------------------------------------------------
  // Toggle mode
  // ---------------------------------------------------------
  function cycleMode() {
    setMode((prev) => {
      if (prev === 'live') {
        fetchProjected();
        return 'projected';
      }
      if (prev === 'projected') {
        return 'outOfFirst';
      }
      return 'live';
    });
  }

  let base = activeTab === 'global' ? globalLeaderboard : leagueLeaderboard;

  let dataToRender;
  if (mode === 'live') {
    dataToRender = base;
  } else if (mode === 'projected') {
    dataToRender = projected;
  } else {
    dataToRender = computeOutOfFirst(base);
  }

  function formatMoney(n: number | undefined) {
    if (n === undefined || n === null) return "$0";
    return `$${n.toLocaleString()}`;
  }

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              { borderBottomColor: themeColors.border },
              activeTab === 'global' && { borderBottomColor: themeColors.tint }
            ]}
            onPress={() => {
              setMode('live');
              setActiveTab('global');
            }}
          >
            <Text style={[styles.tabText, { color: themeColors.text }]}>Global</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              { borderBottomColor: themeColors.border },
              activeTab === 'league' && { borderBottomColor: themeColors.tint }
            ]}
            onPress={() => {
              setMode('live');
              setActiveTab('league');
            }}
          >
            <Text style={[styles.tabText, { color: themeColors.text }]}>League</Text>
          </TouchableOpacity>
        </View>

        {/* League header OR Join/Create UI */}
        {activeTab === 'league' && (
          <>
            {!leagueId ? (
              <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 16, marginBottom: 10, color: themeColors.text }}>
                  You're not in a league yet.
                </Text>

                <TouchableOpacity
                  style={[styles.joinButton, { backgroundColor: themeColors.tint }]}
                  onPress={() => router.push('/(app)/create-league')}
                >
                  <Text style={{ color: themeColors.background, fontWeight: "600" }}>
                    Create a League
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.joinButton, { backgroundColor: themeColors.tint }]}
                  onPress={() => router.push('/(app)/join-league')}
                >
                  <Text style={{ color: themeColors.background, fontWeight: "600" }}>
                    Join a League
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* League header */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 20, fontWeight: '700', color: themeColors.text }}>
                    {leagueName || 'League'}
                  </Text>

                  <TouchableOpacity
                    onPress={() => {
                      if (!leagueId) return;
                      if (isCommissioner) {
                        router.push(`/(app)/league-settings-commissioner?leagueId=${leagueId}`);
                      } else {
                        router.push(`/(app)/league-settings-member?leagueId=${leagueId}`);
                      }
                    }}
                    style={{ padding: 6 }}
                  >
                    <Image
                      source={require('@/assets/images/settings-icon.png')}
                      style={{
                        width: 22,
                        height: 22,
                        tintColor: themeColors.text,
                        resizeMode: 'contain',
                      }}
                    />
                  </TouchableOpacity>
                </View>

                {/* Toggle */}
                <TouchableOpacity
                  onPress={cycleMode}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    backgroundColor: themeColors.card,
                    borderRadius: 8,
                    alignSelf: 'flex-start',
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: themeColors.border,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: themeColors.text }}>
                    {mode === 'live' && 'Showing: Live'}
                    {mode === 'projected' && 'Showing: Projected'}
                    {mode === 'outOfFirst' && 'Showing: $ Out of 1st'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* Leaderboard rows */}
        {loading ? (
          <Text style={{ marginTop: 16, color: themeColors.text + "99" }}>
            Loading leaderboard...
          </Text>
        ) : (
          dataToRender.map((item, index) => {
            const isCurrentUser = item.id === userId;
            const displayName =
              item.team_name || item.name || item.email || 'Unknown User';

            return (
              <View
                key={item.id}
                style={[
                  styles.row,
                  {
                    borderColor: themeColors.border,
                    backgroundColor: isCurrentUser
                      ? themeColors.tint + "22"
                      : themeColors.background,
                  },
                ]}
              >
                <Text style={[styles.rank, { color: themeColors.text }]}>
                  {index + 1}
                </Text>

                <Text style={[styles.username, { color: themeColors.text }]}>
                  {displayName}
                </Text>

                {mode === 'projected' && (
                  <View style={{ width: 40, alignItems: "center" }}>
                    {renderMovementArrow(item.movement ?? 0)}
                  </View>
                )}

                {mode === 'outOfFirst' ? (
                  <Text style={[styles.points, { color: themeColors.text }]}>
                    {formatMoney(item.out_of_first)}
                  </Text>
                ) : (
                  <Text style={[styles.points, { color: themeColors.text }]}>
                    {formatMoney(item.total_points)}
                  </Text>
                )}
              </View>
            );
          })
        )}

        {/* Big Movers */}
        {leagueId && activeTab === "league" && (
          <View style={{ marginTop: 24 }}>
            <BigMoversWidget teams={rankingTrends?.teams ?? []} />
          </View>
        )}

        {/* Heatmap */}
        {leagueId && activeTab === "league" && (
          <View style={{ marginTop: 24 }}>
            <RankingHeatmapWidget
              data={rankingTrends ?? null}
              cutsEnabled={cutsEnabled}
              cutPercents={cutPercents}
              onPress={() =>
                router.push({
                  pathname: "/(app)/ranking-heatmap",
                  params: { leagueId },
                })
              }
            />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  tabs: { flexDirection: 'row', marginBottom: 16 },
  tabButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  tabText: { fontSize: 16, fontWeight: 'bold' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rank: { width: 30, fontWeight: 'bold' },
  username: { flex: 1 },
  points: { fontWeight: 'bold' },

  joinButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
});
