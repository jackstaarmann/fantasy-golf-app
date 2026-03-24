import { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const placeholder = require("@/assets/images/golfer-placeholder.png");

type LeaderboardPlayer = {
  id: string;
  name: string;
  rank: string;
  toPar: number | null;
  thru: number | null;
  teeTime?: string | null;
  projected_earnings: number;   // ⭐ NEW
};

type Tournament = {
  id: string;
  name: string;
  purse: number | null;
  in_progress: boolean;
  up_next: boolean;
  is_completed: boolean;
  is_open_for_picks: boolean;
};

// ----------------------------
// Utility Functions
// ----------------------------

function formatToPar(toPar: number | null): string {
  if (toPar === null || toPar === undefined) return "--";
  if (toPar === 0) return "E";
  if (toPar > 0) return `+${toPar}`;
  return `${toPar}`;
}

function formatTeeTime(teeTime: string | null | undefined): string {
  if (!teeTime) return "--";
  const d = new Date(teeTime);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatThru(thru: number | null, teeTime: string | null | undefined): string {
  if (thru === null || thru === undefined) return "--";

  if (thru === 0) {
    const time = formatTeeTime(teeTime);
    return time ? `Tee Time: ${time}` : "Tee Time: --";
  }

  return `Thru: ${thru}`;
}

// ----------------------------
// Image Resolution
// ----------------------------

async function resolveImageFromHref(href: string): Promise<string | null> {
  try {
    const res = await fetch(href);
    const contentType = res.headers.get("content-type") ?? "";

    if (contentType.includes("image")) {
      return href;
    }

    const data = await res.json();

    if (Array.isArray(data.images)) {
      const full = data.images.find((img: any) => img.url?.includes("/full/"));
      return full?.url ?? data.images[0]?.url ?? null;
    }

    return null;
  } catch (err) {
    console.error("resolveImageFromHref error:", err);
    return null;
  }
}

// ----------------------------
// Season Extraction
// ----------------------------

function extractSeasonYear(seasonField: any): number | null {
  if (!seasonField) return null;

  const href =
    seasonField.href ??
    seasonField.$ref ??
    seasonField.ref ??
    (typeof seasonField === "string" ? seasonField : null);

  if (typeof href === "string") {
    const match = href.match(/seasons\/(\d{4})/);
    if (match) return parseInt(match[1], 10);
  }

  if (typeof seasonField.year === "number") {
    return seasonField.year;
  }

  return null;
}

// ----------------------------
// Athlete Fetch
// ----------------------------

async function fetchAthleteProfile(golferId: string, eventId: string) {
  try {
    const eventRes = await fetch(
      `https://sports.core.api.espn.com/v2/sports/golf/leagues/pga/events/${eventId}`
    );
    const eventData = await eventRes.json();

    const seasonYear = extractSeasonYear(eventData.season);

    if (!seasonYear) {
      console.warn("No season year resolved for event:", eventId, eventData.season);
      return { headshot: null, flag: null };
    }

    const athleteRes = await fetch(
      `https://sports.core.api.espn.com/v2/sports/golf/leagues/pga/seasons/${seasonYear}/athletes/${golferId}?lang=en&region=us`
    );
    const athleteData = await athleteRes.json();

    let headshot: string | null = null;
    if (athleteData.headshot?.href) {
      headshot = await resolveImageFromHref(athleteData.headshot.href);
    }

    let flag: string | null = null;
    if (athleteData.flag?.href) {
      flag = await resolveImageFromHref(athleteData.flag.href);
    }

    return { headshot, flag };
  } catch (err) {
    console.error("Athlete fetch error:", err);
    return { headshot: null, flag: null };
  }
}

// ----------------------------
// Component
// ----------------------------

export default function PickWidget({
  golferId,
  leaderboard,
  tournament,
}: {
  golferId: string | null;
  leaderboard: LeaderboardPlayer[];
  tournament: Tournament | null;
}) {
  const [profile, setProfile] = useState<{ headshot: string | null; flag: string | null }>({
    headshot: null,
    flag: null,
  });

  useEffect(() => {
    if (!golferId || !tournament?.id) return;
    fetchAthleteProfile(golferId, tournament.id).then(setProfile);
  }, [golferId, tournament?.id]);

  if (!golferId) {
    return (
      <View style={styles.container}>
        <Text style={styles.noPick}>No pick yet</Text>
      </View>
    );
  }

  const golfer = useMemo(
    () => leaderboard.find((g) => g.id === golferId) ?? null,
    [leaderboard, golferId]
  );

  if (!golfer) {
    return (
      <View style={styles.container}>
        <Text style={styles.noPick}>Golfer not found</Text>
      </View>
    );
  }

  const displayRank = golfer.rank ?? "--";

  // ⭐ Use backend-provided projected earnings
  const projected = golfer.projected_earnings ?? 0;

  const toParDisplay = formatToPar(golfer.toPar);
  const thruDisplay = formatThru(golfer.thru, golfer.teeTime);

  return (
    <View style={styles.container}>
      <View style={styles.leftColumn}>
        <Image
          source={profile.headshot ? { uri: profile.headshot } : placeholder}
          style={styles.headshot}
        />

        {profile.flag ? (
          <Image source={{ uri: profile.flag }} style={styles.flag} />
        ) : (
          <View style={styles.flagPlaceholder} />
        )}
      </View>

      <View style={styles.rightColumn}>
        <View style={styles.row}>
          <Text style={styles.name}>{golfer.name}</Text>
          <Text style={styles.rank}>{displayRank}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.sub}>To Par: {toParDisplay}</Text>
          <Text style={styles.sub}>{thruDisplay}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.projected}>
            Projected: ${projected.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ----------------------------
// Styles
// ----------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderColor: "#e0e0e0",
    borderWidth: 1,
    marginBottom: 12,
  },
  leftColumn: {
    width: 60,
    alignItems: "center",
    marginRight: 12,
  },
  headshot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 6,
  },
  flag: {
    width: 28,
    height: 18,
    borderRadius: 3,
  },
  flagPlaceholder: {
    width: 28,
    height: 18,
    borderRadius: 3,
    backgroundColor: "#ddd",
  },
  rightColumn: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  rank: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007aff",
  },
  sub: {
    fontSize: 14,
    color: "#666",
  },
  projected: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "600",
    color: "#0a7",
  },
  noPick: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
});