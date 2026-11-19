
import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "notificationHistory";

// Load notification history
export const loadNotificationHistory = async () => {
  try {
    const savedHistory = await AsyncStorage.getItem(HISTORY_KEY);

    return savedHistory !== null
      ? JSON.parse(savedHistory)
      : null;
  } catch (error) {
    console.log("History Load Error:", error);
    return null;
  }
};

// Save notification history
export const saveNotificationHistory = async (history) => {
  try {
    await AsyncStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history)
    );
  } catch (error) {
    console.log("History Save Error:", error);
  }
};

// Clear notification history
export const clearNotificationHistory = async () => {
  try {
    await AsyncStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([])
    );
  } catch (error) {
    console.log("History Clear Error:", error);
  }
};
