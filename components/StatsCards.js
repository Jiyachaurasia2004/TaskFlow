import React from "react";
import { View, Text } from "react-native";

const StatsCards = ({
  styles,
  totalTasks,
  pendingTasks,
  completedTasks,
  overdueTasks,
}) => {
  console.log("StatsCards Props:", {
  totalTasks,
  pendingTasks,
  completedTasks,
  overdueTasks,
});
  return (
    <>
      {/* Overview Section */}
      <View style={styles.overviewHeader}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <Text style={styles.overviewSubtitle}>
          Your progress
        </Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        {/* Total Tasks */}
        <View style={[styles.statCard, styles.totalCard]}>
          <Text style={styles.statIcon}>📋</Text>
          <Text style={styles.statNumber}>{totalTasks}</Text>
          <Text style={styles.statLabel}>Total Tasks</Text>
        </View>

        {/* Pending Tasks */}
        <View style={[styles.statCard, styles.pendingCard]}>
          <Text style={styles.statIcon}>⏳</Text>
          <Text style={styles.statNumber}>{pendingTasks}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>

        {/* Completed Tasks */}
        <View style={[styles.statCard, styles.completedCard]}>
          <Text style={styles.statIcon}>🎯</Text>
          <Text style={styles.statNumber}>{completedTasks}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        {/* Overdue Tasks */}
        <View style={[styles.statCard, styles.pendingCard]}>
          <Text style={styles.statIcon}>⚠️</Text>
          <Text style={styles.statNumber}>{overdueTasks}</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
      </View>
    </>
  );
};

export default StatsCards;