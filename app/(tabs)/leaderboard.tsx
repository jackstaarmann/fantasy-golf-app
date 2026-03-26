import { getActiveTournament, getProjectedSeasonStandings } from '@/api';
import { useTheme } from "@/app/providers/ThemeProvider";
import supabase from '@/supabase';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type LeaderboardUser = {
  id: string;
  name: string | null;
  team_name: string | null;
  email: string;
  total_points: number;
  movement?: number;
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const { themeColors } = useTheme();

  const [activeTab, setActiveTab] = useState<'global' | 'league'>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [projected, setProjected] = useState<LeaderboardUser[]>([]);
  const [showProjected, setShowProjected] = useState(false);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [leagueId, setLeagueId] = useState<string | null>(null);
  const [tournamentId, setTournamentId] = useState<string | null>(null);

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [leagueName, setLeagueName] = useState<string | null>(null);

  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [profileMap, setProfileMap] = useState<Record<string, any>>({});

  // Load user
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    }
    loadUser();
  }, []);

  // Load league membership
  useEffect(() => {
    if (!userId) return;

    async function loadLeague() {
      const { data } = await supabase
        .from('league_members')
        .select('league_id')
        .eq('user_id', userId)
        .single();

      setLeagueId(data?.league_id ?? null);
    }

    loadLeague();
  }, [userId]);

  // Load league info
  useEffect(() => {
    if (!leagueId) return;

    async function loadLeagueInfo() {
      const { data } = await supabase
        .from('leagues')
        .select('invite_code, name')
        .eq('id', leagueId)
        .single();

      setInviteCode(data?.invite_code ?? null);
      setLeagueName(data?.name ?? null);
    }

    loadLeagueInfo();
  }, [leagueId]);

  // Load active tournament
  useEffect(() => {
    async function loadTournament() {
      const t = await getActiveTournament();
      if (t) setTournamentId(String(t.id));
    }
    loadTournament();
  }, []);

  // Load leaderboard
  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, leagueId]);

  async function fetchLeaderboard() {
    if (!userId) return;
    setLoading(true);

    try {
      let userIdsToInclude: string[] = [];

      if (activeTab === 'global') {
        const { data: profiles } = await supabase
          .from('users')
          .select('id');

        userIdsToInclude = profiles?.map((p: any) => p.id) ?? [];
      } else {
        if (!leagueId) return;

        const { data: members } = await supabase
          .from('league_members')
          .select('user_id')
          .eq('league_id', leagueId);

        userIdsToInclude = members?.map((m: any) => m.user_id) ?? [];
      }

      const { data: profiles } = await supabase
        .from('users')
        .select('id, name, team_name, email')
        .in('id', userIdsToInclude);

      const { data: picks } = await supabase
        .from('picks')
        .select('user_id, points')
        .in('user_id', userIdsToInclude);

      const totals: Record<string, LeaderboardUser> = {};

      (profiles ?? []).forEach((p: any) => {
        totals[p.id] = {
          id: p.id,
          name: p.name,
          team_name: p.team_name,
          email: p.email,
          total_points: 0,
        };
      });

      (picks ?? []).forEach((pick: any) => {
        totals[pick.user_id].total_points += Number(pick.points || 0);
      });

      const map = Object.fromEntries(
        (profiles ?? []).map((p: any) => [p.id, p])
      );
      setProfileMap(map);

      setLeaderboard(
        Object.values(totals).sort((a, b) => b.total_points - a.total_points)
      );
    } catch (err) {
      console.error('Leaderboard error:', err);
      setLeaderboard([]);
    }

    setLoading(false);
  }

  // Fetch projected standings
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
          total_points: p.projected_total ?? 0,
          movement: p.movement ?? 0,
        };
      });

      setProjected(normalized);
    } catch (err) {
      console.error("Projected standings error:", err);
      setProjected([]);
    }
  }

  function renderMovementArrow(movement: number) {
    if (movement > 0) {
      return <Text style={{ color: themeColors.tint, fontWeight: "bold" }}>↑{movement}</Text>;
    }
    if (movement < 0) {
      return <Text style={{ color: "#ff4d4d", fontWeight: "bold" }}>↓{Math.abs(movement)}</Text>;
    }
    return <Text style={{ color: themeColors.text + "66" }}>–</Text>;
  }

  const dataToRender = showProjected ? projected : leaderboard;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              { borderBottomColor: themeColors.border },
              activeTab === 'global' && { borderBottomColor: themeColors.tint }
            ]}
            onPress={() => {
              setShowProjected(false);
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
              setShowProjected(false);
              setActiveTab('league');
            }}
          >
            <Text style={[styles.tabText, { color: themeColors.text }]}>League</Text>
          </TouchableOpacity>
        </View>

        {/* League header */}
        {activeTab === 'league' && leagueId && (
          <>
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
                onPress={() => setShowSettings(true)}
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
              onPress={() => {
                const next = !showProjected;
                setShowProjected(next);
                if (next) fetchProjected();
              }}
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
                {showProjected ? 'Showing: Projected' : 'Showing: Live'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Leaderboard */}
        {loading ? (
          <Text style={{ marginTop: 16, color: themeColors.text + "99" }}>
            Loading leaderboard...
          </Text>
        ) : (
          <FlatList
            data={dataToRender}
            keyExtractor={(item) => item.id}
            style={{ marginTop: 16 }}
            renderItem={({ item, index }) => {
              const isCurrentUser = item.id === userId;
              const displayName =
                item.team_name || item.name || item.email || 'Unknown User';

              return (
                <View
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

                  {showProjected && (
                    <View style={{ width: 40, alignItems: "center" }}>
                      {renderMovementArrow(item.movement ?? 0)}
                    </View>
                  )}

                  <Text style={[styles.points, { color: themeColors.text }]}>
                    {item.total_points}
                  </Text>
                </View>
              );
            }}
          />
        )}
      </View>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: themeColors.card, borderColor: themeColors.border },
            ]}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12, color: themeColors.text }}>
              League Settings
            </Text>

            <TouchableOpacity
              onPress={() => {
                setShowSettings(false);
                setShowCodeModal(true);
              }}
              style={[styles.modalButton, { backgroundColor: themeColors.tint }]}
            >
              <Text style={[styles.modalButtonText, { color: themeColors.background }]}>
                View Invite Code
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowSettings(false)}
              style={[
                styles.modalButton,
                { backgroundColor: themeColors.border },
              ]}
            >
              <Text style={[styles.modalButtonText, { color: themeColors.text }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* INVITE CODE MODAL */}
      {showCodeModal && (
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: themeColors.card, borderColor: themeColors.border },
            ]}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12, color: themeColors.text }}>
              Invite Code
            </Text>

            <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20, color: themeColors.text }}>
              {inviteCode}
            </Text>

            <TouchableOpacity
              onPress={() => setShowCodeModal(false)}
              style={[
                styles.modalButton,
                { backgroundColor: themeColors.border },
              ]}
            >
              <Text style={[styles.modalButtonText, { color: themeColors.text }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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

  // MODALS
  modalOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  modalButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});