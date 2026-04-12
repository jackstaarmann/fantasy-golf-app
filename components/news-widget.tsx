import { useTheme } from "@/app/providers/ThemeProvider";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

type Article = {
  headline: string;
  description?: string;
  image: string | null;
  link: string | null;
};

type NewsResponse = {
  featured: Article | null;
  articles: Article[];
  all?: Article[];
};

export default function NewsWidget() {
  const [data, setData] = React.useState<NewsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  const { themeColors } = useTheme();

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          "https://abanaxcoxomkspaafcpm.supabase.co/functions/v1/pga-news"
        );
        const json = (await res.json()) as NewsResponse;
        setData(json);
      } catch (error) {
        console.error("NewsWidget error:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const open = (url: string | null | undefined) => {
    if (url) Linking.openURL(url);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.widget,
          {
            backgroundColor: themeColors.card,
            borderColor: themeColors.border,
          },
        ]}
      >
        <ActivityIndicator size="small" color={themeColors.tint} />
      </View>
    );
  }

  if (!data || !data.featured) {
    return (
      <View
        style={[
          styles.widget,
          {
            backgroundColor: themeColors.card,
            borderColor: themeColors.border,
          },
        ]}
      >
        <Text style={{ color: themeColors.text + "99" }}>
          No news available
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.widget,
        {
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
        },
      ]}
    >
      {/* Featured Article */}
      <TouchableOpacity onPress={() => open(data.featured?.link)}>
        {data.featured.image ? (
          <Image
            source={{ uri: data.featured.image }}
            style={styles.featuredImage}
          />
        ) : (
          <View
            style={[
              styles.featuredImageFallback,
              { backgroundColor: themeColors.border },
            ]}
          />
        )}

        <Text
          style={[
            styles.featuredHeadline,
            { color: themeColors.text },
          ]}
        >
          {data.featured.headline}
        </Text>

        {data.featured.description ? (
          <Text
            style={[
              styles.featuredDescription,
              { color: themeColors.text + "99" },
            ]}
          >
            {data.featured.description}
          </Text>
        ) : null}
      </TouchableOpacity>

      {/* Additional Articles */}
      <View style={{ gap: 12, marginTop: 16 }}>
        {data.articles.map((a, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => open(a.link)}
            style={styles.row}
          >
            {a.image ? (
              <Image source={{ uri: a.image }} style={styles.thumb} />
            ) : (
              <View
                style={[
                  styles.thumbFallback,
                  { backgroundColor: themeColors.border },
                ]}
              />
            )}

            <Text
              style={[
                styles.rowHeadline,
                { color: themeColors.text },
              ]}
            >
              {a.headline}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* All News Button */}
      <TouchableOpacity
        onPress={() => router.push("/all-news")}
        style={styles.allNewsButton}
      >
        <Text
          style={[
            styles.allNewsText,
            { color: themeColors.tint },
          ]}
        >
          More News →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  widget: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 0,
  },
  featuredImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 8,
  },
  featuredImageFallback: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 8,
  },
  featuredHeadline: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  featuredDescription: {
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  thumb: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  thumbFallback: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  rowHeadline: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  allNewsButton: {
    marginTop: 20,
    alignSelf: "flex-end",
  },
  allNewsText: {
    fontSize: 15,
    fontWeight: "600",
  },
});