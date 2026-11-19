
import React from "react";
import { View, Text, Pressable } from "react-native";

const Header = ({ styles, currentUser, onOpenProfile }) => {
  const userName =
    currentUser?.name || currentUser?.username || "User";

  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      {/* Modern Dashboard Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>TaskFlow.</Text>
          <Text style={styles.subtitle}>
            YOUR DAILY PRODUCTIVITY
          </Text>
        </View>

        <Pressable
          style={styles.profile}
          onPress={onOpenProfile}
        >
          <Text style={styles.profileText}>
            {userInitial}
          </Text>
          <View style={styles.onlineDot} />
        </Pressable>
      </View>

      {/* Welcome Section */}
      <View style={styles.welcome}>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Text>

        <Text style={styles.greeting}>
          Hello, {userName}! 👋
        </Text>

        <Text style={styles.description}>
          Let's make today productive.
        </Text>
      </View>
    </>
  );
};

export default Header;
