import supabase from "@/supabase";
import { useEffect, useState } from "react";

// ---------------------------------------------------------
// Leaderboard Types
// ---------------------------------------------------------
export type LeaderboardPlayer = {
  id: string;
  name: string;
  rank: string;
  toPar: number;
  thru: number;
  today: number;
  teeTime: string | null;
  round: number | null;
  projected_earnings: number;
};

export interface CourseLayout {
  courseId: string;
  totalYards: number;
  totalPar: number;
  parOut: number;
  parIn: number;

  holes: {
    number: number;
    par: number;
    yardage: number;
  }[];

  tournamentRoundStats?: {
    $ref: string;
  }[];
}

export interface HoleStats {
  number: number;
  par: number;
  yards: number;

  avgScore: number | null;
  scoreToPar: number | null;
  rank: number | null;

  eagles: number;
  birdies: number;
  pars: number;
  bogeys: number;
  doubleBogeys: number;
  other: number;

  raw: any;
}

export interface HoleStatsRound {
  round: number;
  available: boolean;
  holes: HoleStats[];
}

export interface HoleStatsAllRoundsResponse {
  tournamentId: string;
  courseId: string;
  rounds: HoleStatsRound[];
}

// ---------------------------------------------------------
// Fetch Leaderboard (Edge Function)
// ---------------------------------------------------------
export async function fetchLeaderboard(
  tournamentId: number
): Promise<LeaderboardPlayer[]> {
  const url =
    `https://abanaxcoxomkspaafcpm.supabase.co/functions/v1/get-leaderboard?tournament_id=${tournamentId}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!}`,
    },
  });

  if (!res.ok) {
    console.log("Fetch failed:", res.status);
    throw new Error("Leaderboard fetch failed");
  }

  const data = await res.json();
  return data.players as LeaderboardPlayer[];
}

// ---------------------------------------------------------
// Fetch Event Metadata (ESPN)
// ---------------------------------------------------------
export async function fetchEventMeta(eventId: number) {
  const url = `https://sports.core.api.espn.com/v2/sports/golf/leagues/pga/events/${eventId}?lang=en&region=us`;

  console.log("Fetching event metadata…", url);

  const res = await fetch(url);

  if (!res.ok) {
    console.log("Event metadata fetch failed:", res.status);
    throw new Error("Event metadata fetch failed");
  }

  return res.json();
}

// ---------------------------------------------------------
// Get Active Tournament
// ---------------------------------------------------------
export async function getActiveTournament() {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .order("activation_time", { ascending: true });

  if (error || !data) return null;

  const inProgress = data.find(t => t.in_progress === true);
  if (inProgress) return inProgress;

  const lingering = data.find(t => t.linger_window === true);
  if (lingering) return lingering;

  const upNext = data.find(t => t.up_next === true);
  if (upNext) return upNext;

  const completed = data
    .filter(t => t.is_completed === true)
    .sort(
      (a, b) =>
        new Date(b.activation_time).getTime() -
        new Date(a.activation_time).getTime()
    );

  return completed[0] ?? null;
}

// ---------------------------------------------------------
// Get User Pick
// ---------------------------------------------------------
export async function getUserPick(userId: string, tournamentId: string) {
  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/picks?user_id=eq.${userId}&tournament_id=eq.${tournamentId}&select=*`;

  console.log("getUserPick URL:", url);

  const res = await fetch(url, {
    headers: {
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!}`,
    },
  });

  console.log("getUserPick status:", res.status);

  const data = await res.json();
  console.log("getUserPick raw data:", data);

  return data?.[0] ?? null;
}

// ---------------------------------------------------------
// Projected Season Standings
// ---------------------------------------------------------
export async function getProjectedSeasonStandings(
  leagueId: string,
  tournamentId: string
) {
  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/projected-season-standings`;

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      league_id: leagueId,
      tournament_id: tournamentId,
    }),
  });

  if (!res.ok) {
    console.log("Projected standings failed:", res.status);
    console.log("ACCESS TOKEN:", accessToken);
    throw new Error("Projected standings fetch failed");
  }

  return await res.json();
}

// ---------------------------------------------------------
// Fetch Athlete (ESPN)
// ---------------------------------------------------------
export async function fetchAthlete(athleteId: number) {
  const url = `https://sports.core.api.espn.com/v2/sports/golf/leagues/pga/athletes/${athleteId}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.warn("Failed to fetch athlete", athleteId);
    return null;
  }

  const data = await res.json();

  return {
    id: data.id,
    fullName: data.fullName ?? null,
    headshot: data.headshot ?? null,
    flag: data.flag ?? null,
  };
}

// ---------------------------------------------------------
// NEW: getPickSummary (Edge Function)
// ---------------------------------------------------------
export async function getPickSummary(
  id: string,
  mode: "league" | "global",
  leagueId?: string
) {
  const { data: { session } } = await supabase.auth.getSession();

  if (mode === "league" && !leagueId) {
    return {
      topPicks: [],
      chalkMeter: null,
      sampleSize: 0,
    };
  }

  const body: any = {
    tournament_id: String(id),
    mode,
  };

  if (mode === "league") {
    body.league_id = leagueId;
  }

  const res = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/pick-summary`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    console.error("pick-summary error:", res.status);
    throw new Error("Failed to load pick summary");
  }

  return res.json();
}

// ---------------------------------------------------------
// NEW: usePickSummary Hook
// ---------------------------------------------------------
export function usePickSummary(
  tournamentId: string,
  mode: "global" | "league",
  leagueId?: string
) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      try {
        const result = await getPickSummary(tournamentId, mode, leagueId);
        if (active) setData(result);
      } catch (err) {
        console.error("usePickSummary error:", err);
      }

      if (active) setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [tournamentId, mode, leagueId]);

  return { data, loading };
}

// ---------------------------------------------------------
// Get Golfer Bio (Edge Function)
// ---------------------------------------------------------
export async function getGolferBio(golferId: number) {
  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-golfer-bio`;

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ golfer_id: golferId }),
  });

  if (!res.ok) {
    console.error("getGolferBio failed:", res.status);
    return null;
  }

  return res.json();
}

// ---------------------------------------------------------
// Weather
// ---------------------------------------------------------
export async function getWeatherForEvent(eventId: string) {
  try {
    const eventRes = await fetch(
      `https://sports.core.api.espn.com/v2/sports/golf/leagues/pga/events/${eventId}?lang=en&region=us`
    );

    if (!eventRes.ok) return null;
    const eventJson = await eventRes.json();

    const course = eventJson?.courses?.[0];
    const weatherRef = course?.weather?.$ref;

    if (!weatherRef) {
      console.warn("No weather ref found in courses for event:", eventId);
      return null;
    }

    const weatherRes = await fetch(weatherRef);
    if (!weatherRes.ok) return null;

    const w = await weatherRes.json();

    return {
      temperature: w.temperature ?? null,
      conditionId: w.conditionId ?? "Unknown",
      windSpeed: w.windSpeed ?? 0,
      windDirection: w.windDirection ?? "",
      precipitation: w.precipitation ?? 0,
    };
  } catch (err) {
    console.error("Weather fetch error:", err);
    return null;
  }
}

// ---------------------------------------------------------
// Tournament Course Layout
// ---------------------------------------------------------
export async function getCourseLayout(tournamentId: string): Promise<CourseLayout> {
  const res = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/pga-course-layout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ tournament_id: tournamentId }),
    }
  );

  if (!res.ok) {
    console.error("getCourseLayout error:", await res.text());
    throw new Error("Failed to fetch course layout");
  }

  return res.json();
}

// ---------------------------------------------------------
// UPDATED: Get Hole Stats (ALL ROUNDS)
// ---------------------------------------------------------
export async function getHoleStats(
  tournamentId: string,
  courseId: string
): Promise<HoleStatsAllRoundsResponse> {
  try {
    const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-hole-stats`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournamentId, courseId }),
    });

    if (!res.ok) {
      console.error("getHoleStats error:", res.status);
      return {
        tournamentId,
        courseId,
        rounds: []
      };
    }

    return await res.json();
  } catch (err) {
    console.error("getHoleStats exception:", err);
    return {
      tournamentId,
      courseId,
      rounds: []
    };
  }
}
