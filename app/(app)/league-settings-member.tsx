import { useTheme } from "@/app/providers/ThemeProvider";
import supabase from "@/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LeagueSettingsMember() {
  const router = useRouter();
  const { leagueId } = useLocalSearchParams<{ leagueId: string }>();
  const { themeColors } = useTheme();

  const [leagueName, setLeagueName] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Load user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  // Load league info
  useEffect(() => {
    if (!leagueId) return;

    supabase
      .from("leagues")
      .select("name, invite_code")
      .eq("id", leagueId)
      .maybeSingle()
      .then(({ data }) => {
        setLeagueName(data?.name ?? null);
        setInviteCode(data?.invite_code ?? null);
      });
  }, [leagueId]);

  async function leaveLeague() {
    if (!userId || !leagueId) return;

    await supabase
      .from("league_members")
      .delete()
      .eq("user_id", userId)
      .eq("league_id", leagueId);

    router.replace("/(app)/(tabs)/leaderboard");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>

        {/* ⭐ BACK BUTTON */}
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(app)/(tabs)/leaderboard");
            }
          }}
          style={{ marginBottom: 20 }}
        >
          <Text
            style={{
              fontSize: 18,
              color: themeColors.tint,
              fontWeight: "600",
            }}
          >
            ← Back
          </Text>
        </TouchableOpacity>

        <Text style={[styles.header, { color: themeColors.text }]}>
          League Settings
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: themeColors.card, borderColor: themeColors.border },
          ]}
        >
          <Text style={[styles.label, { color: themeColors.text }]}>
            League Name
          </Text>
          <Text style={[styles.value, { color: themeColors.text }]}>
            {leagueName}
          </Text>

          <Text
            style={[
              styles.label,
              { color: themeColors.text, marginTop: 16 },
            ]}
          >
            Invite Code
          </Text>
          <Text style={[styles.value, { color: themeColors.text }]}>
            {inviteCode}
          </Text>
        </View>

        <TouchableOpacity
          onPress={leaveLeague}
          style={[styles.leaveButton, { backgroundColor: "#ff4d4d" }]}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            Leave League
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: "700", marginBottom: 20 },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 30,
  },
  label: { fontSize: 14, opacity: 0.7 },
  value: { fontSize: 18, fontWeight: "600", marginTop: 4 },
  leaveButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
});
