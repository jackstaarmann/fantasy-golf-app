import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
      <View style={styles.widget}>
        <ActivityIndicator size="small" color="#999" />
      </View>
    );
  }

  if (!data || !data.featured) {
    return (
      <View style={styles.widget}>
        <Text style={{ color: "#999" }}>No news available</Text>
      </View>
    );
  }

  return (
    <View style={styles.widget}>
      {/* Featured Article */}
      <TouchableOpacity onPress={() => open(data.featured?.link)}>
        {data.featured.image ? (
          <Image
            source={{ uri: data.featured.image }}
            style={styles.featuredImage}
          />
        ) : (
          <View style={styles.featuredImageFallback} />
        )}

        <Text style={styles.featuredHeadline}>{data.featured.headline}</Text>

        {data.featured.description ? (
          <Text style={styles.featuredDescription}>
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
              <View style={styles.thumbFallback} />
            )}

            <Text style={styles.rowHeadline}>{a.headline}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* All News Button */}
      <TouchableOpacity
        onPress={() => router.push("/all-news")}
        style={styles.allNewsButton}
      >
        <Text style={styles.allNewsText}>More News →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  widget: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    backgroundColor: "#fff",
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
    backgroundColor: "#f0f0f0",
  },
  featuredHeadline: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  featuredDescription: {
    fontSize: 14,
    color: "#666",
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
    backgroundColor: "#f0f0f0",
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
    color: "#007AFF",
  },
});