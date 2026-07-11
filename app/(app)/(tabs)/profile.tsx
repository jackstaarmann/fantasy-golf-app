import { uploadProfilePicture } from "@/components/utils/upload-profile-picture";
import { TintPalette } from "@/constants/theme";
import { useTheme } from "@/providers/ThemeProvider";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../providers/AuthProvider";

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

  const { theme, setTheme, color, setColor, themeColors } = useTheme();

  const [profile, setProfile] = useState<any>(null);
  const [teamName, setTeamName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [timezoneModalVisible, setTimezoneModalVisible] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // ✅ useEffect before any conditional returns
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
        setTheme(data.theme_preference || "system");
        setColor(data.color_preference || "green");
        setProfilePicture(data.profile_picture || null);
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  // ✅ Conditional returns safely after all hooks
  if (!themeColors || !color) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <Text style={{ color: themeColors.text }}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled) {
    const imageUri = result.assets[0].uri;

    // Show image immediately
    setProfilePicture(imageUri);

    // Upload image to Supabase Storage
    const uploadedUrl = await uploadProfilePicture(
      profile.id,
      imageUri
    );

    if (uploadedUrl) {
      // Save URL to user profile
      const { error } = await supabase
        .from("users")
        .update({
          profile_picture: uploadedUrl,
        })
        .eq("id", profile.id);

      if (error) {
        console.error("Failed saving profile picture:", error);
      } else {
        // Replace local URI with permanent URL
        setProfilePicture(uploadedUrl);
      }
    }
  }
};

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
        theme_preference: theme,
        color_preference: color,
      })
      .eq("id", profile.id);

    if (error) {
      setErrorMessage("Failed to save profile.");
      return;
    }

    setSuccessMessage("Profile updated.");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
  <View style={{ flex: 1 }}>
    <Text style={[styles.title, { color: themeColors.text }]}>
      Profile
    </Text>

    <Text style={[styles.label, { color: themeColors.text }]}>
      Email
    </Text>

    <Text style={[styles.value, { color: themeColors.text }]}>
      {profile.email}
    </Text>
  </View>

  <View style={styles.avatarSection}>
    <View
    style={[
      styles.avatar,
      {
        backgroundColor: themeColors.card,
        borderColor: themeColors.border,
      },
    ]}
  >
    {profilePicture ? (
      <Image
        source={{ uri: profilePicture }}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    ) : (
      <Text
        style={{
          color: themeColors.text,
          fontSize: 42,
          fontWeight: "700",
        }}
      >
        {teamName?.[0]?.toUpperCase() ||
          profile.email?.[0]?.toUpperCase() ||
          "?"}
      </Text>
    )}
  </View>

    <TouchableOpacity
      onPress={pickImage}
      style={[
        styles.avatarButton,
        { backgroundColor: themeColors.tint },
      ]}
    >
      <Text
        style={{
          color: themeColors.background,
          fontWeight: "600",
        }}
      >
        Change Photo
      </Text>
    </TouchableOpacity>
  </View>
</View>

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
              onPress={() => setTheme(opt)}
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

        {/* Color Preference */}
        <Text style={[styles.label, { color: themeColors.text, marginTop: 20 }]}>
          App Color
        </Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
          {Object.entries(TintPalette).map(([key, value]) => (
            <TouchableOpacity
              key={key}
              onPress={() => setColor(key as any)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: value,
                borderWidth: color === key ? 3 : 1,
                borderColor:
                  color === key ? themeColors.text : themeColors.border,
              }}
            />
          ))}
        </View>

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
          <Text style={[styles.saveText, { color: themeColors.background }]}>
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
                style={[styles.modalCloseText, { color: themeColors.background }]}
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
    marginBottom: 20,
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

  profileHeader: {
  flexDirection: "row",
  alignItems: "flex-start",
  marginBottom: 20,
  },

  avatarSection: {
    alignItems: "center",
    marginLeft: 20,
    paddingRight: 20,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatarButton: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
});