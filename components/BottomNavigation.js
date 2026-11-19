
import React from "react";
import { View, Text, Pressable } from "react-native";

const BottomNavigation = ({
  styles,
  activeTab,
  setActiveTab,
  scrollViewRef,
  tasksSectionY,
  setShowNotificationSettings,
}) => {
  return (
    <View style={styles.bottomNav}>
      {/* Home */}
      <Pressable
        style={styles.navItem}
        onPress={() => {
          setActiveTab("Home");

          scrollViewRef.current?.scrollTo({
            y: 0,
            animated: true,
          });
        }}
      >
        <Text
          style={[
            styles.navIcon,
            activeTab === "Home" && styles.activeNavText,
          ]}
        >
          ⌂
        </Text>

        <Text
          style={[
            styles.navLabel,
            activeTab === "Home" && styles.activeNavText,
          ]}
        >
          Home
        </Text>
      </Pressable>

      {/* Tasks */}
      <Pressable
        style={styles.navItem}
        onPress={() => {
          setActiveTab("Tasks");

          scrollViewRef.current?.scrollTo({
            y: tasksSectionY,
            animated: true,
          });
        }}
      >
        <Text
          style={[
            styles.navIcon,
            activeTab === "Tasks" && styles.activeNavText,
          ]}
        >
          ☷
        </Text>

        <Text
          style={[
            styles.navLabel,
            activeTab === "Tasks" && styles.activeNavText,
          ]}
        >
          Tasks
        </Text>
      </Pressable>

      {/* Settings */}
      <Pressable
        style={styles.navItem}
        onPress={() => {
          setActiveTab("Settings");
          setShowNotificationSettings(true);
        }}
      >
        <Text
          style={[
            styles.navIcon,
            activeTab === "Settings" && styles.activeNavText,
          ]}
        >
          ⚙
        </Text>

        <Text
          style={[
            styles.navLabel,
            activeTab === "Settings" && styles.activeNavText,
          ]}
        >
          Settings
        </Text>
      </Pressable>
    </View>
  );
};

export default BottomNavigation;
