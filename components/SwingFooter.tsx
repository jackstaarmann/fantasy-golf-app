import { useTheme } from "@/app/providers/ThemeProvider";
import SwingLogo from "@/assets/images/Swing.png";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

export default function SwingFooter() {
  const { themeColors } = useTheme();

  return (
    <View style={styles.container}>
      <Image
        source={SwingLogo}
        style={[styles.logo, { tintColor: themeColors.text }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 120,
    height: 120,
    opacity: 0.15,
  },
});
