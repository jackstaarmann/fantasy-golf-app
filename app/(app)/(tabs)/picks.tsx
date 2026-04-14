// --- SAME IMPORTS ---
import { useTheme } from "@/app/providers/ThemeProvider";
import supabase from '@/supabase';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import type { LeaderboardPlayer } from '@/api';
import { fetchLeaderboard } from '@/api';
import { PickSummaryWidget } from '@/components/pick-summary-widget';
import PickWidget from '@/components/pick-widget';
import SwingFooter from "@/components/SwingFooter"; // ✅ NEW IMPORT

type Pick = {
  id: number;
  user_id: string;
  golfer_id: string;
  users: {
    team_name: string | null;
    name: string | null;
    email: string | null;
  } | null;
  golferName?: string;
};

type Tournament = {
  id: string;
  name: string;
  activation_time: string | null;
  up_next: boolean;
  in_progress: boolean;
  is_completed: boolean;
  is_open_for_picks: boolean;
  purse: number | null;
  linger_window: boolean;
};

export default function PicksScreen() {
  const { themeColors } = useTheme();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);

  const [userPick, setUserPick] = useState<Pick | null>(null);
  const [leaguePicks, setLeaguePicks] = useState<Pick[]>([]);
  const [userInLeague, setUserInLeague] = useState(false);
  const [userLeagueId, setUserLeagueId] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingField, setLoadingField] = useState(true);

  const [pickerModalVisible, setPickerModalVisible] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  // -------------------------
  // Fetch current user
  // -------------------------
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  // -------------------------
  // Fetch tournament
  // -------------------------
  useEffect(() => {
    const loadTournament = async () => {
      setLoading(true);

      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .order('activation_time', { ascending: true });

      if (!data || data.length === 0) return;

      let activeEvent: Tournament | null = null;

      const inProgress = data.find(t => t.in_progress === true);
      if (inProgress) activeEvent = inProgress;

      if (!activeEvent) {
        const lingering = data.find(t => t.linger_window === true);
        if (lingering) activeEvent = lingering;
      }

      if (!activeEvent) {
        const upNext = data.find(t => t.up_next === true);
        if (upNext) activeEvent = upNext;
      }

      if (!activeEvent) {
        const completed = [...data]
          .filter(t => t.is_completed === true)
          .sort(
            (a, b) =>
              new Date(b.activation_time).getTime() -
              new Date(a.activation_time).getTime()
          )[0];

        activeEvent = completed ?? null;
      }

      setTournament(activeEvent);
      setLoading(false);
    };

    loadTournament();
  }, []);

  // -------------------------
  // Fetch league membership
  // -------------------------
  useEffect(() => {
    if (!currentUser) return;

    supabase
      .from('league_members')
      .select('league_id')
      .eq('user_id', currentUser.id)
      .maybeSingle()
      .then(({ data }) => {
        setUserInLeague(!!data);
        setUserLeagueId(data?.league_id ?? null);
      });
  }, [currentUser]);

  // -------------------------
  // Fetch picks + leaderboard
  // -------------------------
  const fetchPicksAndLeaderboard = async () => {
    if (!currentUser || !tournament || !userLeagueId) return;

    setLoadingField(true);

    const leaderboardData = await fetchLeaderboard(Number(tournament.id));
    setLeaderboard(leaderboardData);

    const withName = (p: Pick): Pick => {
      const match = leaderboardData.find((g) => g.id === p.golfer_id);
      return { ...p, golferName: match?.name ?? 'Unknown Golfer' };
    };

    const { data: userPickRaw } = await supabase
      .from('picks')
      .select(`
        id,
        user_id,
        golfer_id,
        users: user_id ( team_name, name, email )
      `)
      .eq('user_id', currentUser.id)
      .eq('tournament_id', tournament.id)
      .maybeSingle<Pick>();

    setUserPick(userPickRaw ? withName(userPickRaw) : null);

    const { data: leagueRaw } = await supabase
      .from('picks')
      .select(`
        id,
        user_id,
        golfer_id,
        users: user_id ( team_name, name, email )
      `)
      .eq('tournament_id', tournament.id)
      .eq('league_id', userLeagueId)
      .returns<Pick[]>();

    setLeaguePicks((leagueRaw ?? []).map(withName));

    setLoadingField(false);
  };

  useEffect(() => {
    if (currentUser && tournament && userLeagueId !== null) {
      fetchPicksAndLeaderboard();
    }
  }, [currentUser, tournament, userLeagueId]);

  // -------------------------
  // Quiet leaderboard refresh
  // -------------------------
  useEffect(() => {
    if (!tournament) return;

    const interval = setInterval(async () => {
      const leaderboardData = await fetchLeaderboard(Number(tournament.id));
      setLeaderboard(leaderboardData);
    }, 30000);

    return () => clearInterval(interval);
  }, [tournament]);

  // -------------------------
  // Picker
  // -------------------------
  const openPicker = () => {
    setSearchQuery("");
    setPickerModalVisible(true);
  };

  const submitPick = async (golfer: LeaderboardPlayer) => {
    if (!currentUser || !tournament || !tournament.is_open_for_picks) return;

    setUserPick((prev) => ({
      id: prev?.id ?? 0,
      user_id: currentUser.id,
      golfer_id: golfer.id,
      users: prev?.users ?? null,
      golferName: golfer.name,
    }));

    setLeaguePicks((prev) =>
      prev.map((p) =>
        p.user_id === currentUser.id
          ? { ...p, golfer_id: golfer.id, golferName: golfer.name }
          : p
      )
    );

    setPickerModalVisible(false);

    await supabase.from('picks').upsert(
      {
        user_id: currentUser.id,
        tournament_id: tournament.id,
        golfer_id: golfer.id,
        league_id: userLeagueId,
      },
      { onConflict: 'user_id,tournament_id' }
    );
  };

  // -------------------------
  // Render
  // -------------------------
  if (loading || !tournament) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.tint} />
      </View>
    );
  }

  if (loadingField) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.tint} />
        <Text style={{ marginTop: 12, fontSize: 16, color: themeColors.text + "99" }}>
          Loading your pick…
        </Text>
      </View>
    );
  }

  const filteredLeaderboard = leaderboard.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>

      <PickWidget
        golferId={userPick?.golfer_id ?? null}
        leaderboard={leaderboard}
        tournament={tournament}
      />

      {tournament.is_open_for_picks && (
        <TouchableOpacity
          style={[
            styles.makePickButton,
            {
              backgroundColor: userPick ? "#0E734A" : themeColors.tint,
            },
          ]}
          onPress={openPicker}
        >
          <Text style={[styles.buttonText, { color: themeColors.background }]}>
            {userPick ? "Change Pick" : "Make Pick"}
          </Text>
        </TouchableOpacity>
      )}

      <PickSummaryWidget
        tournamentId={tournament.id}
        inLeague={userInLeague}
        leagueId={userLeagueId}
        leaderboard={leaderboard}
        isOpenForPicks={tournament.is_open_for_picks}
      />

      {!userInLeague && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 16, marginBottom: 10, color: themeColors.text }}>
            You’re not in a league yet.
          </Text>

          <TouchableOpacity
            style={[styles.makePickButton, { backgroundColor: themeColors.tint }]}
            onPress={() => router.push('/join-league')}
          >
            <Text style={[styles.buttonText, { color: themeColors.background }]}>
              Join a League
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.makePickButton, { backgroundColor: themeColors.tint }]}
            onPress={() => router.push('/create-league')}
          >
            <Text style={[styles.buttonText, { color: themeColors.background }]}>
              Create a League
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {userInLeague && (
        <>
          {tournament.is_open_for_picks ? (
            <View
              style={{
                marginTop: 30,
                padding: 16,
                backgroundColor: themeColors.card,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: themeColors.border,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 6, color: themeColors.text }}>
                League Picks Locked
              </Text>
              <Text style={{ fontSize: 14, color: themeColors.text + "99" }}>
                League picks will be shown once picking closes.
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 30, color: themeColors.text }]}>
                League Picks
              </Text>

              <FlatList
                data={leaguePicks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  const name =
                    item.users?.team_name ||
                    item.users?.name ||
                    item.users?.email ||
                    "Unknown User";

                  const isCurrentUser = item.user_id === currentUser.id;

                  return (
                    <View
                      style={[
                        styles.pickItem,
                        { borderBottomColor: themeColors.border },
                      ]}
                    >
                      <Text
                        style={
                          isCurrentUser
                            ? { fontWeight: "bold", color: themeColors.tint, fontSize: 18 }
                            : { color: themeColors.text, fontSize: 16 }
                        }
                      >
                        {name}: {item.golferName ?? "Unknown Golfer"}
                      </Text>
                    </View>
                  );
                }}
                ListFooterComponent={
                  <SwingFooter />   // ✅ REUSABLE FOOTER
                }
              />
            </>
          )}
        </>
      )}

      <Modal visible={pickerModalVisible} animationType="slide">
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: themeColors.background }]}
          edges={["top", "left", "right", "bottom"]}
        >
          <Text style={[styles.modalTitle, { color: themeColors.text }]}>
            Select a Golfer
          </Text>

          <TextInput
            placeholder="Search golfers..."
            placeholderTextColor={themeColors.text + "66"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              fontSize: 16,
              color: themeColors.text,
              backgroundColor: themeColors.background,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: themeColors.border + "55",
              marginBottom: 12,
            }}
          />

          {!tournament.is_open_for_picks || leaderboard.length === 0 ? (
            <View style={{ marginTop: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: themeColors.text + "99", textAlign: 'center', paddingHorizontal: 20 }}>
                The field for this tournament is not available yet.
              </Text>
              <Text style={{ fontSize: 14, color: themeColors.text + "66", marginTop: 8 }}>
                Check back once the field is finalized.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredLeaderboard}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.golferItem,
                    { borderBottomWidth: 1, borderBottomColor: themeColors.border },
                  ]}
                  onPress={() =>
                    tournament.is_open_for_picks && submitPick(item)
                  }
                >
                  <Text style={[styles.golferName, { color: themeColors.text }]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: themeColors.tint }]}
            onPress={() => setPickerModalVisible(false)}
          >
            <Text style={[styles.buttonText, { color: themeColors.background }]}>
              Close
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  buttonText: { fontWeight: '600', fontSize: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  pickItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  centered: { alignItems: 'center', marginTop: 50 },
  makePickButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    marginTop: 10,
  },
  modalContainer: { flex: 1, padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  golferItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  golferName: { fontSize: 16 },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
});
