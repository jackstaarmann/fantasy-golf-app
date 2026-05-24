import { useTheme } from "@/providers/ThemeProvider";
import supabase from "@/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Switch,
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

  // Cuts
  const [cutsEnabled, setCutsEnabled] = useState(false);
  const memberCount = members.length;

  // Load user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  // Load league + members
  useEffect(() => {
    if (!leagueId) return;

    supabase
      .from("leagues")
      .select("name, invite_code, cuts_enabled")
      .eq("id", leagueId)
      .maybeSingle()
      .then(({ data }) => {
        setLeagueName(data?.name ?? "");
        setOriginalLeagueName(data?.name ?? "");
        setInviteCode(data?.invite_code ?? "");
        setCutsEnabled(data?.cuts_enabled ?? false);
      });

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
      .then(({ data }) => {
        setMembers(data ?? []);
      });
  }, [leagueId]);

  async function renameLeague() {
    if (!leagueId) return;
    if (leagueName.trim() === originalLeagueName.trim()) return;

    setSavingName(true);

    await supabase
      .from("leagues")
      .update({ name: leagueName })
      .eq("id", leagueId);

    setOriginalLeagueName(leagueName);
    setSavingName(false);
  }

  async function saveCutsSetting(newValue: boolean) {
    if (!leagueId) return;

    await supabase
      .from("leagues")
      .update({ cuts_enabled: newValue })
      .eq("id", leagueId);

    setCutsEnabled(newValue);
  }

  async function regenerateInviteCode() {
    if (!leagueId) return;

    setRegenLoading(true);

    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    await supabase
      .from("leagues")
      .update({ invite_code: newCode })
      .eq("id", leagueId);

    setInviteCode(newCode);
    setRegenLoading(false);
  }

  async function removeMember(targetUserId: string) {
    if (!leagueId) return;

    await supabase
      .from("league_members")
      .delete()
      .eq("user_id", targetUserId)
      .eq("league_id", leagueId);

    setMembers((prev) => prev.filter((m) => m.user_id !== targetUserId));
  }

  async function deleteLeague() {
    if (!leagueId) return;

    await supabase.from("league_members").delete().eq("league_id", leagueId);
    await supabase.from("leagues").delete().eq("id", leagueId);

    router.replace("/(app)/(tabs)/leaderboard");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      {/* ⭐ SCROLLABLE CONTENT */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/(app)/(tabs)/leaderboard");
            }}
            style={{ marginBottom: 20 }}
          >
            <Text style={{ fontSize: 18, color: themeColors.tint, fontWeight: "600" }}>
              ← Back
            </Text>
          </TouchableOpacity>

          <Text style={[styles.header, { color: themeColors.text }]}>
            Commissioner Settings
          </Text>

          {/* League Name Card */}
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.label, { color: themeColors.text }]}>League Name</Text>

            <TextInput
              value={leagueName}
              onChangeText={setLeagueName}
              style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
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
            <Text style={[styles.label, { color: themeColors.text, marginTop: 20 }]}>
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
                  backgroundColor: regenLoading ? themeColors.border : themeColors.tint,
                  marginTop: 10,
                },
              ]}
            >
              <Text style={{ color: themeColors.background, fontWeight: "700" }}>
                {regenLoading ? "Generating..." : "Regenerate Code"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cuts Section */}
          <Text style={[styles.subheader, { color: themeColors.text }]}>
            End‑of‑Season Cuts
          </Text>

          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={[styles.label, { color: themeColors.text }]}>Enable Cuts</Text>

              <Switch
                value={cutsEnabled}
                onValueChange={(val) => {
                  if (memberCount < 4) return;
                  saveCutsSetting(val);
                }}
                disabled={memberCount < 4}
                trackColor={{ false: themeColors.border, true: themeColors.tint }}
                thumbColor={cutsEnabled ? themeColors.background : themeColors.border}
              />
            </View>

            {memberCount < 4 && (
              <Text style={{ color: themeColors.text, marginTop: 10, opacity: 0.7 }}>
                At least 4 members are required to enable cuts.
              </Text>
            )}

            {cutsEnabled && memberCount >= 4 && (
              <View style={{ marginTop: 16 }}>
                <Text style={[styles.label, { color: themeColors.text }]}>
                  Cut 1: Top 70% (after Wyndham)
                </Text>
                <Text style={[styles.label, { color: themeColors.text, marginTop: 6 }]}>
                  Cut 2: Top 50% (after St. Jude)
                </Text>
                <Text style={[styles.label, { color: themeColors.text, marginTop: 6 }]}>
                  Cut 3: Top 30% (after BMW)
                </Text>
              </View>
            )}
          </View>

          {/* Members */}
          <Text style={[styles.subheader, { color: themeColors.text }]}>
            Members
          </Text>

          <FlatList
            data={members}
            scrollEnabled={false}
            keyExtractor={(item) => item.user_id}
            renderItem={({ item }) => (
              <View style={[styles.memberRow, { borderColor: themeColors.border }]}>
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
                    style={styles.removeButton}
                  >
                    <Text style={{ color: "white", fontWeight: "700" }}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />

          {/* Danger Zone */}
          <TouchableOpacity onPress={deleteLeague} style={styles.deleteButton}>
            <Text style={{ color: "white", fontWeight: "700" }}>Delete League</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
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
