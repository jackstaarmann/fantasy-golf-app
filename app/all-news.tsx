import { useTheme } from "@/app/providers/ThemeProvider";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Article = {
  headline: string;
  image: string | null;
  link: string | null;
  published?: string | null;
};

export default function AllNewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [showInfo, setShowInfo] = useState(false);

  const { themeColors } = useTheme();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          "https://abanaxcoxomkspaafcpm.supabase.co/functions/v1/pga-news"
        );
        const json = await res.json();

        const sorted = (json.all ?? []).sort((a: Article, b: Article) => {
          if (!a.published || !b.published) return 0;
          return (
            new Date(b.published).getTime() -
            new Date(a.published).getTime()
          );
        });

        setArticles(sorted);
      } catch (err) {
        console.error("AllNews error:", err);
      }
    }

    load();
  }, []);

  const open = (url: string | null | undefined) => {
    if (url) Linking.openURL(url);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: themeColors.background }}
    >
      {/* Header */}
      <View style={[styles.headerRow, { borderColor: themeColors.border }]}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.backButton,
            {
              borderColor: themeColors.text,
            },
          ]}
        >
          <Text
            style={[
              styles.backButtonText,
              { color: themeColors.text },
            ]}
          >
            ←
          </Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: themeColors.text }]}>
          Golf News
        </Text>

        {/* Info Button */}
        <TouchableOpacity
          onPress={() => setShowInfo(true)}
          style={styles.infoButton}
        >
          <View
            style={[
              styles.infoCircle,
              { borderColor: themeColors.text },
            ]}
          >
            <Text
              style={[
                styles.infoText,
                { color: themeColors.text },
              ]}
            >
              i
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Attribution Modal */}
      <Modal
        visible={showInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: themeColors.text },
              ]}
            >
              Content Attribution
            </Text>

            <Text
              style={[
                styles.modalText,
                { color: themeColors.text + "99" },
              ]}
            >
              All article headlines, images, and external links are provided
              courtesy of ESPN.
            </Text>

            <Pressable
              onPress={() => setShowInfo(false)}
              style={[
                styles.modalButton,
                { backgroundColor: themeColors.tint },
              ]}
            >
              <Text
                style={[
                  styles.modalButtonText,
                  { color: themeColors.background },
                ]}
              >
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={[
          styles.container,
          { backgroundColor: themeColors.background },
        ]}
      >
        {articles.map((a, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => open(a.link)}
            style={styles.card}
          >
            {a.image && (
              <Image
                source={{ uri: a.image }}
                style={styles.image}
              />
            )}

            <Text
              style={[
                styles.headline,
                { color: themeColors.text },
              ]}
            >
              {a.headline}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },

  // Info button
  infoButton: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    fontSize: 16,
    fontWeight: "600",
  },

  card: {
    marginBottom: 24,
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 8,
  },
  headline: {
    fontSize: 17,
    fontWeight: "600",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 15,
    marginBottom: 20,
  },
  modalButton: {
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  modalButtonText: {
    fontWeight: "600",
  },
});