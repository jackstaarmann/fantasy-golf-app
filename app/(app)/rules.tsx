import { useTheme } from "@/app/providers/ThemeProvider";
import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RulesScreen() {
  const { themeColors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text
            style={[
              styles.backButtonText,
              { color: themeColors.text },
            ]}
          >
            ←
          </Text>
        </Pressable>

        <Text
          style={[
            styles.headerTitle,
            { color: themeColors.text },
          ]}
        >
          Game Rules
        </Text>

        {/* Spacer */}
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: themeColors.background },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: themeColors.text },
          ]}
        >
          1. Picking a Golfer
        </Text>
        <Text
          style={[
            styles.bodyText,
            { color: themeColors.text + "99" },
          ]}
        >
          Each week, you select one golfer from the tournament field. Once you
          pick a golfer, you cannot pick them again for the rest of the season.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            { color: themeColors.text },
          ]}
        >
          2. Scoring
        </Text>
        <Text
          style={[
            styles.bodyText,
            { color: themeColors.text + "99" },
          ]}
        >
          Your score for the week is based on your golfer’s official tournament
          earnings. Higher earnings mean more points.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            { color: themeColors.text },
          ]}
        >
          3. Leaderboards
        </Text>
        <Text
          style={[
            styles.bodyText,
            { color: themeColors.text + "99" },
          ]}
        >
          You can compete globally or within your league. Standings are based on
          cumulative earnings across all events.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            { color: themeColors.text },
          ]}
        >
          4. Deadlines
        </Text>
        <Text
          style={[
            styles.bodyText,
            { color: themeColors.text + "99" },
          ]}
        >
          Picks must be submitted before the first golfer tees off. Late picks
          are not allowed.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            { color: themeColors.text },
          ]}
        >
          5. Strategy
        </Text>
        <Text
          style={[
            styles.bodyText,
            { color: themeColors.text + "99" },
          ]}
        >
          Use the Pick Trends and Chalk Meter to understand how other players
          are choosing. Sometimes going against the crowd pays off.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            { color: themeColors.text },
          ]}
        >
          6. Skins
        </Text>
        <Text
          style={[
            styles.bodyText,
            { color: themeColors.text + "99" },
          ]}
        >
          Being the only person in a league to pick the winner of a tournament
          brings bonus earnings.
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            { color: themeColors.text },
          ]}
        >
          7. Majors
        </Text>
        <Text
          style={[
            styles.bodyText,
            { color: themeColors.text + "99" },
          ]}
        >
          Picking for the 4 majors works slightly different. Each person will
          pick 4 golfers instead of 1. You can pick golfers once for the
          standard events and once for the majors.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },

  backButton: {
    padding: 6,
  },

  backButtonText: {
    fontSize: 26,
    fontWeight: "600",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },

  container: {
    padding: 20,
    paddingTop: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 6,
  },

  bodyText: {
    fontSize: 15,
    lineHeight: 20,
  },
});