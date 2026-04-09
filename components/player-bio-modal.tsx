import { getGolferBio } from "@/api"; // ← NEW IMPORT
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type GolferBio = {
  id: number;
  name: string | null;
  headshot: string | null;
  flag: string | null;
  nationality: string | null;
  age: number | null;
  height: string | null;
  birthplace: {
    city: string;
    country: string;
    countryAbbreviation: string;
  } | null;
  turnedPro: number | null;
  fedexPoints: number | null;
  fedexRank: number | null;
};

type Props = {
  visible: boolean;
  golferId: number | null;
  onClose: () => void;
  themeColors: any;
};

export default function PlayerBioModal({
  visible,
  golferId,
  onClose,
  themeColors,
}: Props) {
  const [bio, setBio] = useState<GolferBio | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !golferId) return;

    setLoading(true);

    getGolferBio(golferId)
      .then((data) => {
        setBio(data);
      })
      .catch((err) => {
        console.error("Bio fetch error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [visible, golferId]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={[styles.container, { backgroundColor: themeColors.card }]}>
          {/* Close Button */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: themeColors.text }]}>
              ✕
            </Text>
          </TouchableOpacity>

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.primary} />
              <Text style={{ color: themeColors.text, marginTop: 10 }}>
                Loading player info…
              </Text>
            </View>
          )}

          {/* Bio Content */}
          {!loading && bio && (
            <ScrollView contentContainerStyle={styles.content}>
              {/* Headshot */}
              {bio.headshot && (
                <Image source={{ uri: bio.headshot }} style={styles.headshot} />
              )}

              {/* Name */}
              <Text style={[styles.name, { color: themeColors.text }]}>
                {bio.name}
              </Text>

              {/* Flag + Nationality */}
              <View style={styles.row}>
                {bio.flag && (
                  <Image source={{ uri: bio.flag }} style={styles.flag} />
                )}
                <Text
                  style={[styles.nationality, { color: themeColors.text }]}
                >
                  {bio.nationality}
                </Text>
              </View>

              {/* Basic Info */}
              <View style={styles.infoBlock}>
                {bio.age && (
                  <Text style={[styles.infoText, { color: themeColors.text }]}>
                    Age: {bio.age}
                  </Text>
                )}
                {bio.height && (
                  <Text style={[styles.infoText, { color: themeColors.text }]}>
                    Height: {bio.height}
                  </Text>
                )}
                {bio.birthplace && (
                  <Text style={[styles.infoText, { color: themeColors.text }]}>
                    Birthplace: {bio.birthplace.city},{" "}
                    {bio.birthplace.country}
                  </Text>
                )}
                {bio.turnedPro && (
                  <Text style={[styles.infoText, { color: themeColors.text }]}>
                    Turned Pro: {bio.turnedPro}
                  </Text>
                )}
              </View>

              {/* FedExCup */}
              <View style={styles.infoBlock}>
                <Text
                  style={[styles.sectionTitle, { color: themeColors.text }]}
                >
                  FedExCup
                </Text>
                <Text style={[styles.infoText, { color: themeColors.text }]}>
                  Rank: {bio.fedexRank ?? "—"}
                </Text>
                <Text style={[styles.infoText, { color: themeColors.text }]}>
                  Points: {bio.fedexPoints ?? "—"}
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  container: {
    height: "70%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 6,
  },
  closeText: {
    fontSize: 22,
    fontWeight: "600",
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingBottom: 40,
  },
  headshot: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  flag: {
    width: 32,
    height: 20,
    marginRight: 8,
    borderRadius: 3,
  },
  nationality: {
    fontSize: 16,
    fontWeight: "500",
  },
  infoBlock: {
    width: "100%",
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 4,
  },
});
