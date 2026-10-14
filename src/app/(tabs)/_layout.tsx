import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import Icon from "../../components/Icon";
import { colors, fonts } from "../../theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bold,
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Icon name="home" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: "Curriculum",
          tabBarIcon: ({ color }) => (
            <Icon name="book" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="roadmap"
        options={{
          title: "Roadmap",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.activePillIcon,
                focused && styles.activePillIconFocused,
              ]}
            >
              <Icon
                name="route"
                size={20}
                color={focused ? colors.primary : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Icon name="user" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activePillIcon: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  activePillIconFocused: {
    backgroundColor: colors.mint,
  },
});
