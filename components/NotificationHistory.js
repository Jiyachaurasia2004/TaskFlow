
import React from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { clearNotificationHistory } from "../utils/notificationStorage";


const NotificationHistory = ({
  styles,
  visible,
  onClose,
  notificationHistory,
  setNotificationHistory,
}) => {


const clearHistory = () => {
  Alert.alert(
    "Clear History",
    "Are you sure you want to delete all notification history?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await clearNotificationHistory();
          setNotificationHistory([]);
        },
      },
    ]
  );
};


  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            🔔 Notification History
          </Text>

          <ScrollView style={{ maxHeight: 400 }}>
            {notificationHistory.length === 0 ? (
              <Text style={styles.emptyText}>
                No notification history yet!
              </Text>
            ) : (
              notificationHistory.map((item) => (
                <View key={item.id} style={styles.taskCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingTitle}>
                      {item.title}
                    </Text>

                    <Text style={styles.settingDescription}>
                      {item.body}
                    </Text>

                    <Text style={styles.taskTime}>
                      {new Date(item.receivedAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <Pressable
            style={styles.saveButton}
            onPress={clearHistory}
          >
            <Text style={styles.addButtonText}>
              Clear History
            </Text>
          </Pressable>

          <Pressable onPress={onClose}>
            <Text style={styles.cancelText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default NotificationHistory;
