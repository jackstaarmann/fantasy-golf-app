import { useTheme } from "@/app/providers/ThemeProvider";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../providers/AuthProvider";

// Timezone list
const TIMEZONES = Intl.supportedValuesOf
  ? Intl.supportedValuesOf("timeZone")
  : [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "Europe/London",
      "Europe/Paris",
      "Asia/Tokyo",
    ];

export default function ProfileScreen() {
  const { supabase } = useAuth();
  const router = useRouter();

  // ⭐ GLOBAL THEME — the fix
  const { theme, setTheme, themeColors } = useTheme();

  const [profile, setProfile] = useState<any>(null);
  const [teamName, setTeamName] = useState("");
  const [timezone, setTimezone] = useState("");

  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [timezoneModalVisible, setTimezoneModalVisible] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState("");

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setTeamName(data.team_name || "");
        setTimezone(data.timezone || "");

        // ⭐ Sync global theme with saved preference
        setTheme(data.theme_preference || "system");
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  // Save profile
  const saveProfile = async () => {
    if (!profile) return;

    setErrorMessage("");
    setSuccessMessage("");

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("team_name", teamName)
      .neq("id", profile.id)
      .maybeSingle();

    if (existing) {
      setErrorMessage("Team name is already taken.");
      return;
    }

    const { error } = await supabase
      .from("users")
      .update({
        team_name: teamName,
        timezone: timezone || null,
        theme_preference: theme, // ⭐ Save global theme
      })
      .eq("id", profile.id);

    if (error) {
      setErrorMessage("Failed to save profile.");
      return;
    }

    setSuccessMessage("Profile updated.");
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <Text style={{ color: themeColors.text }}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: themeColors.text }]}>Profile</Text>

        {/* Email */}
        <Text style={[styles.label, { color: themeColors.text }]}>Email</Text>
        <Text style={[styles.value, { color: themeColors.text }]}>
          {profile.email}
        </Text>

        {/* Team Name */}
        <Text style={[styles.label, { color: themeColors.text }]}>
          Team Name
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: themeColors.border,
              backgroundColor: themeColors.card,
              color: themeColors.text,
            },
          ]}
          value={teamName}
          onChangeText={setTeamName}
          placeholder="Enter your team name"
          placeholderTextColor={themeColors.text + "55"}
        />

        {/* Timezone */}
        <Text style={[styles.label, { color: themeColors.text }]}>
          Timezone
        </Text>

        <TouchableOpacity
          style={[
            styles.input,
            {
              borderColor: themeColors.border,
              backgroundColor: themeColors.card,
              justifyContent: "center",
            },
          ]}
          onPress={() => setTimezoneModalVisible(true)}
        >
          <Text
            style={{
              color: timezone ? themeColors.text : themeColors.text + "55",
            }}
          >
            {timezone || "Select your timezone"}
          </Text>
        </TouchableOpacity>

        {/* Theme Preference */}
        <Text style={[styles.label, { color: themeColors.text }]}>Theme</Text>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
          {(["light", "dark", "system"] as const).map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => setTheme(opt)} // ⭐ GLOBAL THEME UPDATE
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: themeColors.border,
                backgroundColor:
                  theme === opt ? themeColors.tint : themeColors.card,
              }}
            >
              <Text
                style={{
                  color:
                    theme === opt ? themeColors.background : themeColors.text,
                  fontWeight: "600",
                }}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inline validation */}
        {errorMessage !== "" && (
          <Text style={[styles.inlineError, { color: "#FF3B30" }]}>
            {errorMessage}
          </Text>
        )}

        {successMessage !== "" && (
          <Text style={[styles.inlineSuccess, { color: themeColors.tint }]}>
            {successMessage}
          </Text>
        )}

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: themeColors.tint }]}
          onPress={saveProfile}
        >
          <Text
            style={[styles.saveText, { color: themeColors.background }]}
          >
            Save Changes
          </Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: "#FF3B30" }]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Timezone Modal */}
      {timezoneModalVisible && (
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Select Timezone
            </Text>

            <TextInput
              style={[
                styles.modalSearch,
                {
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                },
              ]}
              placeholder="Search..."
              placeholderTextColor={themeColors.text + "55"}
              value={timezoneSearch}
              onChangeText={setTimezoneSearch}
            />

            <ScrollView style={{ flex: 1 }}>
              {TIMEZONES.filter((tz) =>
                tz.toLowerCase().includes(timezoneSearch.toLowerCase())
              )
                .slice(0, 80)
                .map((tz) => (
                  <TouchableOpacity
                    key={tz}
                    style={[
                      styles.modalItem,
                      { borderColor: themeColors.border },
                    ]}
                    onPress={() => {
                      setTimezone(tz);
                      setTimezoneModalVisible(false);
                    }}
                  >
                    <Text
                      style={[styles.modalItemText, { color: themeColors.text }]}
                    >
                      {tz}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalClose, { backgroundColor: themeColors.tint }]}
              onPress={() => setTimezoneModalVisible(false)}
            >
              <Text
                style={[
                  styles.modalCloseText,
                  { color: themeColors.background },
                ]}
              >
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
  container: { flex: 1, padding: 20 },

  title: {
    fontSize: 32,
    marginBottom: 30,
    fontWeight: "bold",
  },

  label: {
    fontSize: 16,
    marginTop: 15,
  },

  value: {
    fontSize: 16,
    marginTop: 5,
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
    fontSize: 16,
  },

  inlineError: {
    fontSize: 14,
    textAlign: "right",
    marginTop: 4,
    fontWeight: "500",
  },

  inlineSuccess: {
    fontSize: 14,
    textAlign: "right",
    marginTop: 4,
    fontWeight: "500",
  },

  saveButton: {
    padding: 14,
    borderRadius: 8,
    marginTop: 30,
    alignItems: "center",
  },
  saveText: { fontWeight: "600", fontSize: 16 },

  logoutButton: {
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  logoutText: { color: "white", fontWeight: "600", fontSize: 16 },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#00000055",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    width: "90%",
    height: "70%",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },

  modalSearch: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },

  modalItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },

  modalItemText: {
    fontSize: 16,
  },

  modalClose: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  modalCloseText: {
    fontWeight: "600",
    fontSize: 16,
  },
});