
import React from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
} from "react-native";

const NotificationSettings = ({
  styles,
  visible,
  onClose,
  notificationsEnabled,
  toggleNotificationSettings,
  soundEnabled,
  vibrationEnabled,
  updateSoundVibrationSettings,
  checkScheduledNotifications,
  onViewHistory,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.settingsModalContent}>
          <Text style={styles.modalTitle}>
            ⚙️ Notification Settings
          </Text>

          {/* Main Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingDescription}>
                Enable or disable all task reminders
              </Text>
            </View>

            <Pressable
              style={[
                styles.toggleButton,
                notificationsEnabled && styles.toggleActive,
              ]}
              onPress={toggleNotificationSettings}
            >
              <Text style={styles.toggleText}>
                {notificationsEnabled ? "ON" : "OFF"}
              </Text>
            </Pressable>
          </View>

          {/* Sound */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>
                Notification Sound 🔊
              </Text>
              <Text style={styles.settingDescription}>
                Play sound with reminders
              </Text>
            </View>

            <Pressable
              style={[
                styles.toggleButton,
                soundEnabled && styles.toggleActive,
              ]}
              onPress={() =>
                updateSoundVibrationSettings(
                  !soundEnabled,
                  vibrationEnabled
                )
              }
            >
              <Text style={styles.toggleText}>
                {soundEnabled ? "ON" : "OFF"}
              </Text>
            </Pressable>
          </View>

          {/* Vibration */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>
                Vibration 📳
              </Text>
              <Text style={styles.settingDescription}>
                Vibrate when reminder arrives
              </Text>
            </View>

            <Pressable
              style={[
                styles.toggleButton,
                vibrationEnabled && styles.toggleActive,
              ]}
              onPress={() =>
                updateSoundVibrationSettings(
                  soundEnabled,
                  !vibrationEnabled
                )
              }
            >
              <Text style={styles.toggleText}>
                {vibrationEnabled ? "ON" : "OFF"}
              </Text>
            </Pressable>
          </View>

          {/* Check Reminders */}
          <Pressable
            style={styles.saveButton}
            onPress={checkScheduledNotifications}
          >
            <Text style={styles.addButtonText}>
              📋 Check Scheduled Reminders
            </Text>
          </Pressable>

          {/* Notification History */}
          <Pressable
            style={styles.secondaryActionButton}
            onPress={onViewHistory}
          >
            <Text style={styles.secondaryActionText}>
              🕘 View Notification History
            </Text>
          </Pressable>

          <Text style={styles.settingsFooter}>
            TaskFlow • Stay productive ✨
          </Text>

          {/* Close */}
          <Pressable onPress={onClose}>
            <Text style={styles.cancelText}>
              Close Settings
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default NotificationSettings;
