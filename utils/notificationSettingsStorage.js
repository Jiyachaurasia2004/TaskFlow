
import AsyncStorage from "@react-native-async-storage/async-storage";

// Load notification settings
export const loadNotificationSettings = async () => {
  try {
    const notifications = await AsyncStorage.getItem("notificationsEnabled");
    const sound = await AsyncStorage.getItem("soundEnabled");
    const vibration = await AsyncStorage.getItem("vibrationEnabled");

    return {
      notificationsEnabled:
        notifications !== null ? notifications === "true" : null,
      soundEnabled: sound !== null ? sound === "true" : null,
      vibrationEnabled: vibration !== null ? vibration === "true" : null,
    };
  } catch (error) {
    console.log("Settings Load Error:", error);
    return null;
  }
};

// Save notification settings
export const saveNotificationSettings = async (
  notificationsEnabled,
  soundEnabled,
  vibrationEnabled
) => {
  try {
    await AsyncStorage.multiSet([
      ["notificationsEnabled", String(notificationsEnabled)],
      ["soundEnabled", String(soundEnabled)],
      ["vibrationEnabled", String(vibrationEnabled)],
    ]);
  } catch (error) {
    console.log("Settings Save Error:", error);
  }
};
