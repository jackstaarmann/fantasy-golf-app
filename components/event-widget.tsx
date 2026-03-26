// --- imports ---
import type { LeaderboardPlayer } from "@/api";
import { fetchAthlete, fetchEventMeta, fetchLeaderboard } from "@/api";
import { useTheme } from "@/app/providers/ThemeProvider";
import supabase from "@/supabase";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View
} from "react-native";

function getNextTuesdayAt3AMET(): Date {
  const now = new Date();

  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth();
  const utcDate = now.getUTCDate();
  const utcDay = now.getUTCDay();

  const TARGET_UTC_HOUR = 7; // 3 AM ET = 07:00 UTC

  const todayTuesdayTarget = new Date(
    Date.UTC(utcYear, utcMonth, utcDate, TARGET_UTC_HOUR, 0, 0, 0)
  );

  if (utcDay === 2 && now.getTime() < todayTuesdayTarget.getTime()) {
    return todayTuesdayTarget;
  }

  let daysUntilNextTuesday = (2 - utcDay + 7) % 7;
  if (daysUntilNextTuesday === 0) daysUntilNextTuesday = 7;

  return new Date(
    Date.UTC(
      utcYear,
      utcMonth,
      utcDate + daysUntilNextTuesday,
      TARGET_UTC_HOUR,
      0,
      0,
      0
    )
  );
}

type LeaderInfo = {
  name: string | null;
  headshot: string | null;
  flag: string | null;
  score: string | number | null;
  label?: string;
};

export default function HomeEventWidget() {
  const router = useRouter();
  const { themeColors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [userPicks, setUserPicks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [round, setRound] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<string>("");

  const [teeTime, setTeeTime] = useState<string | null>(null);
  const firstTeeTimeRef = useRef<string | null>(null);

  const [leader, setLeader] = useState<LeaderInfo | null>(null);

  // ---------------------------
  // INITIAL LOAD
  // ---------------------------
  useEffect(() => {
    loadData();
  }, []);

  // ---------------------------
  // COUNTDOWN EFFECT
  // ---------------------------
  useEffect(() => {
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [event, nextEvent, teeTime]);

  // ---------------------------
  // LOAD BASE EVENT + PICKS
  // ---------------------------
  async function loadData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);

    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .order("activation_time", { ascending: true });

    let activeEvent: any = null;

    if (data && data.length > 0) {
      const inProgress = data.find((t) => t.in_progress === true);
      if (inProgress) activeEvent = inProgress;

      if (!activeEvent) {
        const lingering = data.find((t) => t.linger_window === true);
        if (lingering) activeEvent = lingering;
      }

      if (!activeEvent) {
        const upNext = data.find((t) => t.up_next === true);
        if (upNext) activeEvent = upNext;
      }

      if (!activeEvent) {
        const completed =
          [...data]
            .filter((t) => t.is_completed === true)
            .sort(
              (a, b) =>
                new Date(b.activation_time).getTime() -
                new Date(a.activation_time).getTime()
            )[0] ?? null;

        activeEvent = completed;
      }

      let next = null;

      if (activeEvent) {
        next =
          [...data]
            .filter(
              (t) =>
                new Date(t.activation_time).getTime() >
                new Date(activeEvent.activation_time).getTime()
            )
            .sort(
              (a, b) =>
                new Date(a.activation_time).getTime() -
                new Date(b.activation_time).getTime()
            )[0] ?? null;
      }

      setNextEvent(next ?? null);
    }

    setEvent(activeEvent);

    if (activeEvent && user) {
      const { data: picks } = await supabase
        .from("picks")
        .select("*")
        .eq("tournament_id", activeEvent.id)
        .eq("user_id", user.id);

      setUserPicks(picks || []);
    }

    setLoading(false);
  }

  // ---------------------------
  // LOAD CURRENT LEADER
  // ---------------------------
  useEffect(() => {
    if (!event) return;

    if (event.in_progress) {
      loadCurrentLeader(event);
    } else if (event.linger_window) {
      loadCurrentLeader(event);
    } else if (event.up_next) {
      loadDefendingChampion(event);
      loadTeeTimeOnly(event);
    } else if (event.is_completed) {
      loadCurrentLeader(event);
    }
  }, [event]);

  async function loadCurrentLeader(activeEvent: any) {
    try {
      const leaderboard = await fetchLeaderboard(Number(activeEvent.id));
      if (!leaderboard || leaderboard.length === 0) return;

      const tiedLeaders = leaderboard.filter(
        (p) => p.rank === "1" || p.rank === "T1"
      );

      const first =
        tiedLeaders.length > 0
          ? tiedLeaders.sort((a, b) => {
              if (!a.teeTime || !b.teeTime) return 0;
              return (
                new Date(a.teeTime).getTime() -
                new Date(b.teeTime).getTime()
              );
            })[0]
          : leaderboard[0];

      if (first.teeTime) {
        firstTeeTimeRef.current = first.teeTime;
        setTeeTime(first.teeTime);
      }

      setRound(first.round ?? null);

      const athlete = await fetchAthlete(Number(first.id));

      setLeader({
        name: athlete?.fullName ?? first.name ?? null,
        headshot: athlete?.headshot?.href ?? null,
        flag: athlete?.flag?.href ?? null,
        score: first.toPar ?? null,
      });
    } catch (e) {
      console.log("Failed to load leader", e);
    }
  }

  // ---------------------------
  // LOAD ONLY TEE TIME (for up_next)
  // ---------------------------
  async function loadTeeTimeOnly(activeEvent: any) {
    try {
      const leaderboard = await fetchLeaderboard(Number(activeEvent.id));
      if (!leaderboard || leaderboard.length === 0) return;

      const sorted = leaderboard
        .filter(
          (p): p is LeaderboardPlayer & { teeTime: string } =>
            p.teeTime !== null
        )
        .sort(
          (a, b) =>
            new Date(a.teeTime).getTime() -
            new Date(b.teeTime).getTime()
        );

      const earliest = sorted[0];
      if (earliest?.teeTime) {
        firstTeeTimeRef.current = earliest.teeTime;
        setTeeTime(earliest.teeTime);
      }
    } catch (e) {
      console.log("Failed to load tee time", e);
    }
  }

  // ---------------------------
  // DEFENDING CHAMPION
  // ---------------------------
  async function loadDefendingChampion(activeEvent: any) {
    const meta = await fetchEventMeta(Number(activeEvent.id));

    const champ = meta?.defendingChampion?.athlete;
    if (!champ) return;

    setLeader({
      name: champ.fullName ?? null,
      headshot: champ.headshot?.href ?? null,
      flag: champ.flag?.href ?? null,
      score: null,
      label: "Defending Champion",
    });
  }

  // ---------------------------
  // COUNTDOWN
  // ---------------------------
  function updateCountdown() {
    let target: Date | null = null;

    if (event?.up_next && firstTeeTimeRef.current) {
      target = new Date(firstTeeTimeRef.current);
    } else if (event?.is_completed) {
      target = getNextTuesdayAt3AMET();
    }

    if (!target || isNaN(target.getTime())) {
      setCountdown("");
      return;
    }

    const now = Date.now();
    const diff = target.getTime() - now;

    if (diff <= 0) {
      setCountdown("Teeing off soon");
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    const label = event?.is_completed
      ? "until next week's picks open"
      : "until tee-off";

    setCountdown(`${days}d ${hours}h ${minutes}m ${label}`);
  }

  const goToPicks = () => {
    router.push("../picks");
  };

  // ---------------------------
  // RENDER
  // ---------------------------
  if (loading) {
    return (
      <View style={{ padding: 16 }}>
        <ActivityIndicator size="small" color={themeColors.tint} />
      </View>
    );
  }

  if (!event) {
    return (
      <View
        style={{
          padding: 16,
          borderRadius: 12,
          backgroundColor: themeColors.card,
          borderWidth: 1,
          borderColor: themeColors.border,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: themeColors.text,
          }}
        >
          No Event This Week
        </Text>
        <Text
          style={{
            marginTop: 4,
            color: themeColors.text + "99",
          }}
        >
          Check back soon for the next tournament.
        </Text>
      </View>
    );
  }

  // ---------------------------
  // STATUS TEXT
  // ---------------------------
  let statusText = "";

  if (event.in_progress) {
    statusText = round ? `Round ${round} in Progress` : "Live Now";
  } else if (event.linger_window) {
    statusText = "Finalizing Results";
  } else if (event.up_next) {
    statusText = "Rounds Not Started";
  } else if (event.is_open_for_picks) {
    statusText = "Picks Open";
  } else if (event.is_completed) {
    statusText = "Tournament Completed";
  } else {
    statusText = "Upcoming Event";
  }

  const Wrapper = ({ children }: any) => (
    <View
      style={{
        padding: 16,
        borderRadius: 12,
        backgroundColor: themeColors.card,
        borderWidth: 1,
        borderColor: themeColors.border,
        marginBottom: 16,
      }}
    >
      {children}
    </View>
  );

  // ---------------------------
  // RETURN UI
  // ---------------------------
  return (
    <Wrapper>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "stretch",
        }}
      >
        {/* LEFT SIDE */}
        <View
          style={{
            flex: 1,
            paddingRight: 12,
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: themeColors.text,
              }}
            >
              {event.name}
            </Text>

            <Text
              style={{
                marginTop: 4,
                color: themeColors.tint,
                fontWeight: "600",
              }}
            >
              {statusText}
            </Text>

            {(event.up_next || event.is_completed) &&
              countdown !== "" && (
                <Text
                  style={{
                    marginTop: 4,
                    color: themeColors.text + "99",
                  }}
                >
                  {countdown}
                </Text>
              )}

            {!event.is_completed && (
              <Text
                style={{
                  marginTop: 4,
                  color: themeColors.text + "99",
                }}
              >
                {userPicks.length === 0
                  ? "You haven't made your pick yet."
                  : "Your picks are locked in."}
              </Text>
            )}
          </View>

          {(!event.is_completed ||
            (event.is_completed && countdown !== "")) && (
            <TouchableOpacity
              onPress={goToPicks}
              style={{
                backgroundColor: themeColors.tint,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 6,
                alignSelf: "flex-start",
                marginTop: 12,
              }}
            >
              <Text
                style={{
                  color: themeColors.background,
                  fontWeight: "600",
                }}
              >
                {userPicks.length === 0 ? "Make Picks" : "Go to Picks"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* RIGHT SIDE — Leader / Defending Champ */}
        {leader && leader.headshot && leader.flag && (
          <View
            style={{
              width: 100,
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 2,
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                overflow: "hidden",
              }}
            >
              <Image
                source={{ uri: leader.headshot }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            </View>

            <Image
              source={{ uri: leader.flag }}
              style={{
                width: 32,
                height: 20,
                borderRadius: 3,
                marginTop: 6,
              }}
              resizeMode="cover"
            />

            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: themeColors.text,
                textAlign: "center",
                marginTop: 4,
              }}
              numberOfLines={1}
            >
              {leader.name}
            </Text>

            <Text
              style={{
                fontSize: 11,
                color: themeColors.text + "99",
                textAlign: "center",
                marginTop: 2,
              }}
            >
              {leader.label ?? "Leader"}
            </Text>
          </View>
        )}
      </View>
    </Wrapper>
  );
}