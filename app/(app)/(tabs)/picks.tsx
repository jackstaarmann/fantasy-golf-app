// --- SAME IMPORTS ---
import { useTheme } from "@/providers/ThemeProvider";
import supabase from '@/supabase';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import type { LeaderboardPlayer } from '@/api';
import { fetchLeaderboard, useAvailableTournaments } from '@/api';
import { PickSummaryWidget } from '@/components/pick-summary-widget';
import PickWidget from '@/components/pick-widget';
import SwingFooter from "@/components/SwingFooter";

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
  event_type: string | null;
};

type PickerPlayer = {
  athleteId: string;
  name: string;
  teamName: string;
  teamId: string;
};

function buildPickerList(leaderboard: LeaderboardPlayer[]): PickerPlayer[] {
  const players: PickerPlayer[] = [];

  for (const team of leaderboard) {
    const names = team.name.split(" / ").map((n) => n.trim());
    const ids = team.athleteIds ?? [];

    if ((team as any).isTeam && names.length === 2 && ids.length === 2) {
      players.push({
        athleteId: String(ids[0]),
        name: names[0],
        teamName: team.name,
        teamId: team.id,
      });
      players.push({
        athleteId: String(ids[1]),
        name: names[1],
        teamName: team.name,
        teamId: team.id,
      });
    } else {
      players.push({
        athleteId: ids[0] ? String(ids[0]) : team.id,
        name: team.name,
        teamName: team.name,
        teamId: team.id,
      });
    }
  }

  return players;
}

export default function PicksScreen() {
  const { themeColors } = useTheme();

  const [currentUser, setCurrentUser] = useState<any>(null);

  const [userPicks, setUserPicks] = useState<Pick[]>([]);
  const [leaguePicks, setLeaguePicks] = useState<Pick[]>([]);
  const [userInLeague, setUserInLeague] = useState(false);
  const [userLeagueId, setUserLeagueId] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { tournaments: availableTournaments } = useAvailableTournaments();
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);

  // -------------------------
  // Fetch current user
  // -------------------------
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  // -------------------------
  // Set active tournament from available tournaments
  // -------------------------
  useEffect(() => {
    if (!availableTournaments || availableTournaments.length === 0) return;
    setActiveTournamentId(String(availableTournaments[0].id));
  }, [availableTournaments]);

  const activeTournament: Tournament | null =
    availableTournaments.find((t: any) => String(t.id) === activeTournamentId) ?? null;

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
  // Fetch picks + leaderboard for a given tournament
  // -------------------------
  const fetchPicksAndLeaderboard = async (tournament: Tournament) => {
    if (!currentUser || !tournament) return;

    setLoading(true);

    const leaderboardData = await fetchLeaderboard(Number(tournament.id));
    setLeaderboard(leaderboardData);

    const withName = (p: Pick): Pick => {
      for (const team of leaderboardData) {
        const names = team.name.split(" / ").map((n) => n.trim());
        const ids = (team.athleteIds ?? []).map(String);
        const idx = ids.indexOf(p.golfer_id);
        if (idx !== -1) {
          return { ...p, golferName: names[idx] ?? team.name };
        }
      }
      return { ...p, golferName: "Unknown Golfer" };
    };

    const { data: userPicksRaw } = await supabase
      .from('picks')
      .select(`
        id,
        user_id,
        golfer_id,
        users: user_id ( team_name, name, email )
      `)
      .eq('user_id', currentUser.id)
      .eq('tournament_id', tournament.id)
      .returns<Pick[]>();

    setUserPicks((userPicksRaw ?? []).map(withName));

    if (userLeagueId) {
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
    } else {
      setLeaguePicks([]);
    }

    setLoading(false);
  };

  // initial load (like home screen: driven by user + league, not tab change)
  useEffect(() => {
    if (currentUser && activeTournament) {
      fetchPicksAndLeaderboard(activeTournament);
    }
  }, [currentUser, userLeagueId, activeTournament]);

  // -------------------------
  // Quiet leaderboard refresh for active tournament
  // -------------------------
  useEffect(() => {
    if (!activeTournament) return;

    const interval = setInterval(async () => {
      const leaderboardData = await fetchLeaderboard(Number(activeTournament.id));
      setLeaderboard(leaderboardData);
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTournament]);

  // -------------------------
  // Picker
  // -------------------------
  const openPicker = () => {
    setSearchQuery("");
    setPickerModalVisible(true);
  };

  const maxPicks =
    activeTournament?.event_type && activeTournament.event_type.startsWith("MAJOR_")
      ? 4
      : 1;

  const picksRemaining = maxPicks - userPicks.length;

  const submitPick = async (player: PickerPlayer) => {
    if (!currentUser || !activeTournament || !activeTournament.is_open_for_picks) return;

    if (userPicks.some(p => p.golfer_id === player.athleteId)) return;
    if (userPicks.length >= maxPicks) return;

    await supabase.from('picks').insert({
      user_id: currentUser.id,
      tournament_id: activeTournament.id,
      golfer_id: player.athleteId,
      league_id: userLeagueId,
    });

    setPickerModalVisible(false);
    await fetchPicksAndLeaderboard(activeTournament);
  };

  const deletePick = async (pickId: number) => {
    if (!activeTournament) return;

    await supabase
      .from('picks')
      .delete()
      .eq('id', pickId)
      .eq('tournament_id', activeTournament.id);

    await fetchPicksAndLeaderboard(activeTournament);
  };

  // -------------------------
  // Render
  // -------------------------
  if (!activeTournament) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.tint} />
      </View>
    );
  }

  const pickerList = buildPickerList(leaderboard);

  const filteredPickerList = pickerList.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Tournament Selector — match Home screen UI */}
        {availableTournaments.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 15 }}
          >
            {availableTournaments.map((tournament: any) => {
              const isSelected = String(tournament.id) === activeTournamentId;

              return (
                <Pressable
                  key={String(tournament.id)}
                  onPress={() => {
                    setActiveTournamentId(String(tournament.id));
                    fetchPicksAndLeaderboard(tournament);
                  }}
                  style={{
                    paddingHorizontal: 15,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    marginRight: 10,
                    borderColor: themeColors.text,
                    backgroundColor: isSelected ? "#000" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? "#fff" : themeColors.text,
                      fontWeight: "600",
                    }}
                  >
                    {tournament.name ?? "Tournament"}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <PickWidget
          golferIds={userPicks.map(p => p.golfer_id)}
          leaderboard={leaderboard}
          tournament={activeTournament}
          onRemove={(golferId) => {
            const pick = userPicks.find(p => p.golfer_id === golferId);
            if (pick) deletePick(pick.id);
          }}
        />

        {activeTournament.is_open_for_picks && (
          <>
            <TouchableOpacity
              style={[
                styles.makePickButton,
                {
                  backgroundColor:
                    userPicks.length > 0 ? "#0E734A" : themeColors.tint,
                },
              ]}
              onPress={openPicker}
            >
              <Text style={[styles.buttonText, { color: themeColors.background }]}>
                {userPicks.length === 0
                  ? "Make Pick"
                  : picksRemaining > 0
                  ? `Add Pick (${picksRemaining} left)`
                  : "Edit Picks"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.makePickButton,
                { backgroundColor: themeColors.tint, marginTop: 6 }
              ]}
              onPress={() => router.push("/(app)/pick-history")}
            >
              <Text style={[styles.buttonText, { color: themeColors.background }]}>
                View Pick History
              </Text>
            </TouchableOpacity>
          </>
        )}

        {!activeTournament.is_open_for_picks && (
          <TouchableOpacity
            style={[styles.makePickButton, { backgroundColor: themeColors.tint, marginTop: 6 }]}
            onPress={() => router.push("/(app)/pick-history")}
          >
            <Text style={[styles.buttonText, { color: themeColors.background }]}>
              View Pick History
            </Text>
          </TouchableOpacity>
        )}

        {/* Summary widget switches with active tab (S-1) */}
        <PickSummaryWidget
          tournamentId={activeTournament.id}
          inLeague={userInLeague}
          leagueId={userLeagueId}
          leaderboard={leaderboard}
          isOpenForPicks={activeTournament.is_open_for_picks}
        />

        {!userInLeague && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 16, marginBottom: 10, color: themeColors.text }}>
              You're not in a league yet.
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
            {activeTournament.is_open_for_picks ? (
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
                  renderItem={({ item, index }) => {
                    const placement = index + 1;

                    const name =
                      item.users?.team_name ||
                      item.users?.name ||
                      item.users?.email ||
                      "Unknown User";

                    const isCurrentUser = item.user_id === currentUser.id;

                    return (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 12,
                          paddingHorizontal: 8,
                          backgroundColor: isCurrentUser
                            ? themeColors.tint + "22"
                            : themeColors.background,
                          borderBottomWidth: 1,
                          borderBottomColor: themeColors.border,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            width: 30,
                            fontSize: 16,
                            fontWeight: "700",
                            color: themeColors.text,
                          }}
                        >
                          {placement}
                        </Text>

                        <Text
                          style={{
                            flex: 1,
                            fontSize: 16,
                            color: themeColors.text,
                            fontWeight: "400",
                          }}
                        >
                          {name}: {item.golferName ?? "Unknown Golfer"}
                        </Text>
                      </View>
                    );
                  }}
                  ListFooterComponent={<SwingFooter />}
                />
              </>
            )}
          </>
        )}

      </ScrollView>

      {/* Picker Modal */}
      <Modal visible={pickerModalVisible} animationType="slide">
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: themeColors.background }]}
          edges={["top", "left", "right", "bottom"]}
        >
          <Text style={[styles.modalTitle, { color: themeColors.text }]}>
            Select a Golfer
          </Text>

          {/* Tournament Selector inside modal — match Home screen UI */}
          {availableTournaments.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 15 }}
            >
              {availableTournaments.map((tournament: any) => {
                const isSelected = String(tournament.id) === activeTournamentId;

                return (
                  <Pressable
                    key={String(tournament.id)}
                    onPress={() => {
                      setActiveTournamentId(String(tournament.id));
                      setSearchQuery("");
                      fetchPicksAndLeaderboard(tournament);
                    }}
                    style={{
                      paddingHorizontal: 15,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: 1,
                      marginRight: 10,
                      borderColor: themeColors.text,
                      backgroundColor: isSelected ? "#000" : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? "#fff" : themeColors.text,
                        fontWeight: "600",
                      }}
                    >
                      {tournament.name ?? "Tournament"}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

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

          {!activeTournament.is_open_for_picks || pickerList.length === 0 ? (
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
              data={filteredPickerList}
              keyExtractor={(item) => item.athleteId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.golferItem,
                    { borderBottomWidth: 1, borderBottomColor: themeColors.border },
                  ]}
                  onPress={() =>
                    activeTournament.is_open_for_picks && submitPick(item)
                  }
                >
                  <Text style={[styles.golferName, { color: themeColors.text }]}>
                    {item.name}
                  </Text>
                  {item.teamName !== item.name && (
                    <Text style={{ fontSize: 13, color: themeColors.text + "88", marginTop: 2 }}>
                      Partner: {item.teamName.replace(item.name, "").replace(" / ", "").trim()}
                    </Text>
                  )}
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

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: { fontWeight: "600", fontSize: 16 },

  sectionTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },

  pickItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },

  makePickButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    marginTop: 10,
  },

  modalContainer: { flex: 1, padding: 20 },

  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },

  golferItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },

  golferName: { fontSize: 16 },

  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
});
