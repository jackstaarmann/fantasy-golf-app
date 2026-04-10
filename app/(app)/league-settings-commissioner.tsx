import { useTheme } from "@/app/providers/ThemeProvider";
import supabase from "@/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LeagueSettingsCommissioner() {
  const router = useRouter();
  const { leagueId } = useLocalSearchParams<{ leagueId: string }>();
  const { themeColors } = useTheme();

  const [leagueName, setLeagueName] = useState("");
  const [originalLeagueName, setOriginalLeagueName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [savingName, setSavingName] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);

  // -----------------------------
  // Load user
  // -----------------------------
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  // -----------------------------
  // Initial league + members load
  // -----------------------------
  useEffect(() => {
    if (!leagueId) return;

    // League info
    supabase
      .from("leagues")
      .select("name, invite_code")
      .eq("id", leagueId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.log("load league error:", error);
          return;
        }
        setLeagueName(data?.name ?? "");
        setOriginalLeagueName(data?.name ?? "");
        setInviteCode(data?.invite_code ?? "");
      });

    // Members
    supabase
      .from("league_members")
      .select(`
        user_id,
        commissioner_status,
        users:user_id (
          name,
          email
        )
      `)
      .eq("league_id", leagueId)
      .then(({ data, error }) => {
        if (error) {
          console.log("load members error:", error);
          return;
        }
        setMembers(data ?? []);
      });
  }, [leagueId]);

  // -----------------------------
  // Rename League
  // -----------------------------
  async function renameLeague() {
    if (!leagueId) return;
    if (leagueName.trim() === originalLeagueName.trim()) return;

    setSavingName(true);

    const { error } = await supabase
      .from("leagues")
      .update({ name: leagueName })
      .eq("id", leagueId);

    if (error) {
      console.log("renameLeague error:", error);
      setSavingName(false);
      return;
    }

    // DB accepted the change → lock in as original
    setOriginalLeagueName(leagueName);
    setSavingName(false);
  }

  // -----------------------------
  // Regenerate Invite Code
  // -----------------------------
  async function regenerateInviteCode() {
    if (!leagueId) return;

    setRegenLoading(true);

    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error } = await supabase
      .from("leagues")
      .update({ invite_code: newCode })
      .eq("id", leagueId);

    if (error) {
      console.log("regenerateInviteCode error:", error);
      setRegenLoading(false);
      return;
    }

    // DB accepted the change → update local state
    setInviteCode(newCode);
    setRegenLoading(false);
  }

  // -----------------------------
  // Remove Member
  // -----------------------------
  async function removeMember(targetUserId: string) {
    if (!leagueId) return;

    const { error } = await supabase
      .from("league_members")
      .delete()
      .eq("user_id", targetUserId)
      .eq("league_id", leagueId);

    if (error) {
      console.log("removeMember error:", error);
      return;
    }

    setMembers((prev) => prev.filter((m) => m.user_id !== targetUserId));
  }

  // -----------------------------
  // Delete League
  // -----------------------------
  async function deleteLeague() {
    if (!leagueId) return;

    const { error: membersError } = await supabase
      .from("league_members")
      .delete()
      .eq("league_id", leagueId);

    if (membersError) {
      console.log("deleteLeague members error:", membersError);
      return;
    }

    const { error: leagueError } = await supabase
      .from("leagues")
      .delete()
      .eq("id", leagueId);

    if (leagueError) {
      console.log("deleteLeague league error:", leagueError);
      return;
    }

    router.replace("/(app)/(tabs)/leaderboard");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>

        {/* Back Button */}
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
          Commissioner Settings
        </Text>

        {/* League Name Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: themeColors.card, borderColor: themeColors.border },
          ]}
        >
          <Text style={[styles.label, { color: themeColors.text }]}>
            League Name
          </Text>

          <TextInput
            value={leagueName}
            onChangeText={setLeagueName}
            style={[
              styles.input,
              { color: themeColors.text, borderColor: themeColors.border },
            ]}
          />

          <TouchableOpacity
            onPress={renameLeague}
            disabled={savingName || leagueName.trim() === originalLeagueName.trim()}
            style={[
              styles.button,
              {
                backgroundColor:
                  savingName || leagueName.trim() === originalLeagueName.trim()
                    ? themeColors.border
                    : themeColors.tint,
              },
            ]}
          >
            <Text style={{ color: themeColors.background, fontWeight: "700" }}>
              {savingName ? "Saving..." : "Save Name"}
            </Text>
          </TouchableOpacity>

          {/* Invite Code */}
          <Text
            style={[
              styles.label,
              { color: themeColors.text, marginTop: 20 },
            ]}
          >
            Invite Code
          </Text>
          <Text style={[styles.value, { color: themeColors.text }]}>
            {inviteCode}
          </Text>

          <TouchableOpacity
            onPress={regenerateInviteCode}
            disabled={regenLoading}
            style={[
              styles.button,
              {
                backgroundColor: regenLoading
                  ? themeColors.border
                  : themeColors.tint,
                marginTop: 10,
              },
            ]}
          >
            <Text style={{ color: themeColors.background, fontWeight: "700" }}>
              {regenLoading ? "Generating..." : "Regenerate Code"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Members */}
        <Text style={[styles.subheader, { color: themeColors.text }]}>
          Members
        </Text>

        <FlatList
          data={members}
          keyExtractor={(item) => item.user_id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.memberRow,
                { borderColor: themeColors.border },
              ]}
            >
              <View>
                <Text style={{ color: themeColors.text, fontWeight: "600" }}>
                  {item.users?.name ?? item.users?.email}
                </Text>
                {item.commissioner_status && (
                  <Text style={{ color: themeColors.tint, fontSize: 12 }}>
                    Commissioner
                  </Text>
                )}
              </View>

              {!item.commissioner_status && (
                <TouchableOpacity
                  onPress={() => removeMember(item.user_id)}
                  style={[styles.removeButton]}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>
                    Remove
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />

        {/* Danger Zone */}
        <TouchableOpacity
          onPress={deleteLeague}
          style={[styles.deleteButton]}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            Delete League
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: "700", marginBottom: 20 },
  subheader: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 30,
  },
  label: { fontSize: 14, opacity: 0.7 },
  value: { fontSize: 18, fontWeight: "600", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    fontSize: 16,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  removeButton: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: "#b30000",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 30,
  },
});
