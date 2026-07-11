import {
  getAvailableTournaments,
  getUserPick,
  getWeatherForEvent,
} from "@/api";

import AsyncStorage from "@react-native-async-storage/async-storage";

import EventWidget from "@/components/event-widget";
import LeaderboardWidget from "@/components/leaderboard-widget";
import NewsWidget from "@/components/news-widget";
import WeatherWidget from "@/components/weather-widget";

import supabase from "@/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../providers/AuthProvider";

import LogoutIcon from "@/assets/images/logout-button.png";
import SwingFooter from "@/components/SwingFooter";
import { useTheme } from "@/providers/ThemeProvider";

type Tournament = {
  id: number | string;
  name?: string;
  activation_time?: string;
  in_progress?: boolean;
  up_next?: boolean;
  linger_window?: boolean;
};

export default function HomePage() {
  const { session } = useAuth();
  const user = session?.user ?? null;

  const { themeColors } = useTheme();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);

  const [golferId, setGolferId] = useState<string | null>(null);
  const [leagueId, setLeagueId] = useState<string | null>(null);

  const [weather, setWeather] = useState<any>(null);
  const SELECTED_TOURNAMENT_KEY = "selectedTournamentId";

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function load() {
        if (!user) return;

        const available =
          await getAvailableTournaments();

        if (!isActive || !available.length) return;

        setTournaments(available);

        const savedTournamentId =
  await AsyncStorage.getItem(
    SELECTED_TOURNAMENT_KEY
  );

const savedTournament = savedTournamentId
  ? available.find(
      (t) => String(t.id) === savedTournamentId
    )
  : null;

const initialTournament =
  savedTournament ?? available[0];

setSelectedTournament(initialTournament);

        const pick = await getUserPick(
          user.id,
          String(savedTournament.id)
        );

        if (isActive) {
          setGolferId(
            pick?.golfer_id ?? null
          );
        }

        const { data: league } = await supabase
          .from("league_members")
          .select("league_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (isActive) {
          setLeagueId(
            league?.league_id ?? null
          );
        }

        const w = await getWeatherForEvent(
          String(savedTournament.id)
        );

        if (isActive) {
          setWeather(w);
        }
      }

      load();

      return () => {
        isActive = false;
      };
    }, [user])
  );


  const handleTournamentChange = async (
  tournament: Tournament
) => {

  await AsyncStorage.setItem(
    SELECTED_TOURNAMENT_KEY,
    String(tournament.id)
  );

  setSelectedTournament(tournament);

  if (!user) return;

  const pick = await getUserPick(
    user.id,
    String(tournament.id)
  );

  setGolferId(
    pick?.golfer_id ?? null
  );

  const w = await getWeatherForEvent(
    String(tournament.id)
  );

  setWeather(w);
};


  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };


  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: themeColors.background,
      }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            backgroundColor:
              themeColors.background,
          },
        ]}
      >

        <View style={styles.authButtonContainer}>
          {session ? (
            <Pressable onPress={handleLogout}>
              <Image
                source={LogoutIcon}
                style={{
                  width: 26,
                  height: 26,
                  tintColor:
                    themeColors.text,
                }}
              />
            </Pressable>
          ) : (
            <Pressable
              onPress={() =>
                router.push("/login")
              }
            >
              <Text
                style={[
                  styles.authButtonText,
                  {
                    color:
                      themeColors.tint,
                  },
                ]}
              >
                Login
              </Text>
            </Pressable>
          )}
        </View>


        <View style={styles.infoButtonContainer}>
          <Pressable
            onPress={() =>
              router.push("/rules")
            }
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                borderWidth: 1.5,
                borderColor:
                  themeColors.text,
                alignItems: "center",
                justifyContent:
                  "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color:
                    themeColors.text,
                  fontWeight:
                    "600",
                }}
              >
                i
              </Text>
            </View>
          </Pressable>
        </View>


        <Text
          style={[
            styles.title,
            {
              color:
                themeColors.text,
            },
          ]}
        >
          Swing by Staarmann
        </Text>


        {/* Tournament Selector */}
        {tournaments.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.selector}
          >
            {tournaments.map((tournament) => (
              <Pressable
                key={String(tournament.id)}
                onPress={() =>
                  handleTournamentChange(
                    tournament
                  )
                }
                style={[
                  styles.tournamentButton,
                  selectedTournament?.id ===
                    tournament.id &&
                    styles.selectedTournament,
                ]}
              >
                <Text
                  style={{
                    color:
                      selectedTournament?.id ===
                      tournament.id
                        ? "#fff"
                        : themeColors.text,
                    fontWeight:
                      "600",
                  }}
                >
                  {tournament.name ??
                    "Tournament"}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}


        <View style={styles.widgetSpacing}>
          <EventWidget
            tournamentId={
              selectedTournament?.id
            }
          />
        </View>


        <View style={styles.widgetSpacing}>
          <WeatherWidget
            weather={weather}
          />
        </View>


        <View style={styles.widgetSpacing}>
          <LeaderboardWidget
            tournamentId={
              selectedTournament?.id
            }
          />
        </View>


        <View style={styles.widgetSpacing}>
          <NewsWidget />
        </View>


        <SwingFooter />

      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "flex-start",
  },

  widgetSpacing: {
    marginBottom: 0,
  },

  selector: {
    marginBottom: 15,
  },

  tournamentButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },

  selectedTournament: {
    backgroundColor: "#000",
  },

  authButtonContainer: {
    position: "absolute",
    top: 30,
    left: 20,
    zIndex: 20,
  },

  infoButtonContainer: {
    position: "absolute",
    top: 30,
    right: 20,
    zIndex: 20,
  },

  authButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 0,
    textAlign: "center",
  },
});

