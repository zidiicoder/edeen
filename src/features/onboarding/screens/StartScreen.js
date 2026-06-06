import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useNavigation } from "@react-navigation/native";
import colors from "../../../theme/colors";

const { width } = Dimensions.get("window");

export default function StartScreen() {
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = [
    {
      id: "1",
      title: "Assalamu Alaikum,\nWelcome to our EDeen app",
      text: "In this app you will embark on a transformative journey to form new habits in just 40 days.",
      image: require("../../../assets/images/logo.png"),
    },
    {
      id: "2",
      title: "",
      text: "The concept of forming habits over a period of 40 days has a significance in Islamic teachings.",
      image: require("../../../assets/images/start1img.png"),
    },
    {
      id: "3",
      title: "",
      text: "",
      image: require("../../../assets/images/start2img.png"),
      buttons: true,
    },
  ];

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfigRef = useRef({
    viewAreaCoveragePercentThreshold: 50,
  });

  const goToSlide = (index) => {
    flatListRef.current.scrollToIndex({ index, animated: true });
  };

  const goToAuth = (screen) => {
    navigation.navigate("Auth", { screen });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfigRef.current}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image source={item.image} style={styles.image} resizeMode="contain" />

            {item.title !== "" && (
              <Text style={styles.title}>{item.title}</Text>
            )}

            {item.text !== "" && (
              <Text style={styles.text}>{item.text}</Text>
            )}
            {item.buttons && (
              <View style={styles.buttonStack}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => goToAuth("Login")}
                >
                  <Text style={styles.primaryButtonText}>Log In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => goToAuth("Register")}
                >
                  <Text style={styles.primaryButtonText}>Register</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
      <View style={styles.dots}>
        {slides.map((_, index) => (
          <TouchableOpacity key={index} onPress={() => goToSlide(index)}>
            <View
              style={[
                styles.dot,
                activeIndex === index
                  ? styles.dotActive
                  : styles.dotMuted,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  slide: {
    width,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },

  image: {
    width: 280,
    height: 280,
    marginBottom: 25,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 16,
  },

  text: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 40,
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  dotMuted: {
    backgroundColor: colors.dotMuted,
  },

  dotActive: {
    backgroundColor: colors.dotActive,
  },

  buttonStack: {
    width: "100%",
    marginTop: 30,
    gap: 14,
  },

  primaryButton: {
    backgroundColor: colors.button,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});
