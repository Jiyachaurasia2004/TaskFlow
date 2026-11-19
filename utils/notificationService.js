
import * as Notifications from "expo-notifications";

// 1. Request notification permission
export const requestNotificationPermission = async () => {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } =
        await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (error) {
    console.log("Permission Error:", error);
    return false;
  }
};

// 2. Cancel a scheduled notification
export const cancelTaskReminder = async (notificationId) => {
  try {
    if (!notificationId) return;

    await Notifications.cancelScheduledNotificationAsync(
      notificationId
    );
  } catch (error) {
    console.log("Cancel Reminder Error:", error);
  }
};

// 3. Check scheduled notifications
export const getScheduledTaskReminders = async () => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.log("Scheduled Notifications Error:", error);
    return [];
  }
};

// 4. Send test notification
export const sendTestNotification = async () => {
  try {
    const hasPermission = await requestNotificationPermission();

    if (!hasPermission) {
      return false;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "TaskFlow Reminder 🔔",
        body: "Your notifications are working perfectly!",
        sound: "default",
      },
      trigger: null,
    });

    return true;
  } catch (error) {
    console.log("Test Notification Error:", error);
    return false;
  }
};
