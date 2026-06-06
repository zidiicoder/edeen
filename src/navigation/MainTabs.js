import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Image,
} from "react-native";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import HabitTrackerScreen from "../features/home/screens/HabitTrackerScreen";
import DuaBankScreen from "../features/home/screens/DuaBankScreen";
import SalahTrackerScreen from "../features/home/screens/SalahTrackerScreen";
import JournalScreen from "../features/home/screens/JournalScreen";
import colors from "../theme/colors";

const Tab = createBottomTabNavigator();

const THEME_BLUE = colors.primary ?? "rgb(211,227,243)";
const PINK = "#111111";
const INACTIVE_PINK = "#111111";

const TAB_ICONS = {
  HabitTracker: require("../assets/navigation/habbit.png"),
  DuaBank: require("../assets/navigation/dua.png"),
  SalahTracker: require("../assets/navigation/salah.jpg"),
  Journal: require("../assets/navigation/journal.png"),
};

function getIcon(routeName, color, size) {
  return (
    <Image
      source={TAB_ICONS[routeName] ?? TAB_ICONS.Journal}
      style={{ width: size, height: size, opacity: 1 }}
      resizeMode="contain"
    />
  );
}

function PillTabBar({ state, descriptors, navigation }) {
  const anim = useRef(new Animated.Value(0)).current;

  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.tabWrap,
        {
          opacity: anim,
          transform: [{ translateY }],
          bottom: insets.bottom + 12,
        },
      ]}
    >
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };
          const activeIcon = PINK;
          const inactiveIcon = INACTIVE_PINK;

          if (isFocused) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.9}
                style={styles.activePill}
              >
                {getIcon(route.name, activeIcon, 24)}
                <Text style={styles.activeLabel}>
                  {String(label).replace("\n", " ")}
                </Text>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.85}
              style={styles.iconOnly}
            >
              {getIcon(route.name, inactiveIcon, 26)}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}
export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="HabitTracker"
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <PillTabBar {...props} />}
    >
      <Tab.Screen
        name="HabitTracker"
        component={HabitTrackerScreen}
        options={{ tabBarLabel: "Habit" }}
      />

      <Tab.Screen
        name="DuaBank"
        component={DuaBankScreen}
        options={{ tabBarLabel: "Dua" }}
      />

      <Tab.Screen
        name="SalahTracker"
        component={SalahTrackerScreen}
        options={{ tabBarLabel: "Salah" }}
      />

      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{ tabBarLabel: "Journal" }}
      />
    </Tab.Navigator>
  );
}
const styles = StyleSheet.create({
  tabWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  tabBar: {
    width: "92%",
    height: 66,
    backgroundColor: THEME_BLUE,
    borderRadius: 28,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 10 },
      },
      android: {
        elevation: 10,
      },
    }),
  },

  iconOnly: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },

  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 24,
  },

  activeLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: PINK,
  },
});
