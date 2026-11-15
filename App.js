import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Platform,
} from "react-native";

import { StatusBar } from "expo-status-bar";

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  // Task data
  const [tasks, setTasks] = useState([
    {
      id: "1",
      title: "Learn React Native",
      time: "10:00 AM",
      priority: "High",
      completed: false,
    },
    {
      id: "2",
      title: "Build TaskFlow UI",
      time: "12:00 PM",
      priority: "Medium",
      completed: false,
    },
    {
      id: "3",
      title: "Practice JavaScript",
      time: "02:00 PM",
      priority: "Low",
      completed: true,
    },
  ]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Modal state
  const [showNotificationSettings, setShowNotificationSettings] =
    useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);

  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  // Input state
  const [taskTitle, setTaskTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [editingTaskId, setEditingTaskId] = useState(null);
  // Counts
  const [selectedTime, setSelectedTime] = useState(() => {
    const time = new Date();
    time.setHours(time.getHours() + 1, 0, 0, 0);
    return time;
  });

  const [showTimePicker, setShowTimePicker] = useState(false);
  const completedTasks = tasks.filter((task) => task.completed).length;
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [historyLoaded, setHistoryLoaded] = useState(false);
const [showHistory, setShowHistory] = useState(false);
  const [notificationSettingsLoaded, setNotificationSettingsLoaded] =
    useState(false);
  const pendingTasks = tasks.length - completedTasks;
  const requestNotificationPermission = async () => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();

      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow notifications to receive task reminders.",
      );
      return false;
    }

    return true;
  };




const sendTestNotification = async () => {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "TaskFlow Test 🔔",
        body: "Testing notification without custom channel",
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
      },
    });

    Alert.alert("Success", "Test notification scheduled!");
  } catch (error) {
    console.log("Test Notification Error:", error);
    Alert.alert("Notification Error", error.message);
  }
};



  const checkScheduledNotifications = async () => {
    try {
      const notifications =
        await Notifications.getAllScheduledNotificationsAsync();

      if (notifications.length === 0) {
        Alert.alert("Scheduled Notifications", "No notifications scheduled.");
        return;
      }

      const notificationDetails = notifications.map(
        (item, index) =>
          `${index + 1}. ${item.content.title}\n${item.content.body}`,
      );

      Alert.alert(
        `Scheduled Notifications (${notifications.length})`,
        notificationDetails.join("\n\n"),
      );
    } catch (error) {
      console.log("Notification Error:", error);
      Alert.alert("Error", "Unable to fetch notifications.");
    }
  };

const checkNotificationChannels = async () => {
  try {
    const channels =
      await Notifications.getNotificationChannelsAsync();

    console.log("Notification Channels:", channels);

    Alert.alert(
      "Channel Information",
      JSON.stringify(channels, null, 2).slice(0, 2500)
    );
  } catch (error) {
    console.log("Channel Check Error:", error);
    Alert.alert("Error", error.message);
  }
};

  // Add task


const scheduleTaskReminder = async (
  task,
  force = false,
  soundOverride = soundEnabled,
  vibrationOverride = vibrationEnabled
) => {
  try {
    if (!notificationsEnabled && !force) return null;
    if (!task.dueDate || task.completed) return null;

    const reminderDate = new Date(task.dueDate);

    if (
      isNaN(reminderDate.getTime()) ||
      reminderDate.getTime() <= Date.now()
    ) {
      return null;
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;

    const notificationId =
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "TaskFlow Reminder 🔔",
          body: `Reminder: ${task.title}`,
          sound: soundOverride ? "default" : null,
          data: { taskId: task.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
        },
      });

    console.log("Task reminder scheduled:", notificationId);
    console.log("Reminder Date:", reminderDate.toString());
console.log("Current Time:", new Date().toString());

const pendingNotifications =
  await Notifications.getAllScheduledNotificationsAsync();

console.log("All Pending Notifications:", pendingNotifications);
    return notificationId;
  } catch (error) {
    console.log("Task Reminder Error:", error);
    Alert.alert("Reminder Error", error.message);
    return null;
  }
};



const updateSoundVibrationSettings = async (
  newSound,
  newVibration
) => {
  try {
    // Save new settings
    setSoundEnabled(newSound);
    setVibrationEnabled(newVibration);

    // Cancel existing pending task reminders
    for (const task of tasks) {
      if (task.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(
          task.notificationId
        );
      }
    }

    // Reschedule pending tasks using new settings
    const updatedTasks = await Promise.all(
      tasks.map(async (task) => {
        if (task.completed || !task.dueDate || !notificationsEnabled) {
          return { ...task, notificationId: null };
        }

        const notificationId = await scheduleTaskReminder(
          task,
          true,
          newSound,
          newVibration
        );

        return { ...task, notificationId };
      })
    );

    setTasks(updatedTasks);

    Alert.alert(
      "Settings Updated",
      "Task reminders have been updated with your new sound and vibration settings."
    );
  } catch (error) {
    console.log("Settings Update Error:", error);
    Alert.alert("Error", error.message);
  }
};

  const addTask = async () => {
    if (taskTitle.trim() === "") {
      Alert.alert("Error", "Please enter task title");
      return;
    }

    // Combine selected date and selected time
    const reminderDate = new Date(selectedDate);

  console.log("Selected Time:", selectedTime.toString());
console.log("Selected Hour:", selectedTime.getHours());
console.log("Selected Minute:", selectedTime.getMinutes());

reminderDate.setHours(
  selectedTime.getHours(),
  selectedTime.getMinutes(),
  0,
  0
);

console.log("Final Reminder Date:", reminderDate.toString());

    if (reminderDate <= new Date()) {
      Alert.alert("Invalid Reminder", "Please select a future date and time.");
      return;
    }

    const newTask = {
      id: Date.now().toString(),
      title: taskTitle.trim(),

      // Display selected reminder time, not current time
      time: reminderDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),

      priority: priority,
      completed: false,
      dueDate: reminderDate.toISOString(),
    };

    const notificationId = await scheduleTaskReminder(newTask);

    const taskWithReminder = {
      ...newTask,
      notificationId,
    };

    setTasks((previousTasks) => [...previousTasks, taskWithReminder]);

    setTaskTitle("");
    setPriority("Medium");
    setSelectedDate(new Date());

    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    setSelectedTime(nextHour);

    setModalVisible(false);
  };

  // Complete / Incomplete task
  const toggleTask = async (id) => {
    const selectedTask = tasks.find((task) => task.id === id);

    if (!selectedTask) return;

    const willComplete = !selectedTask.completed;

    let notificationId = selectedTask.notificationId || null;

    if (willComplete) {
      // Cancel reminder when task is completed
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      }

      notificationId = null;
    } else {
      // Schedule reminder again when task becomes pending
      notificationId = await scheduleTaskReminder(selectedTask);
    }

    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: willComplete,
              notificationId: notificationId,
            }
          : task,
      ),
    );
  };

  // Delete task
  const deleteTask = (id) => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const taskToDelete = tasks.find((task) => task.id === id);

          if (taskToDelete?.notificationId) {
            await Notifications.cancelScheduledNotificationAsync(
              taskToDelete.notificationId,
            );
          }

          setTasks((previousTasks) =>
            previousTasks.filter((task) => task.id !== id),
          );
        },
      },
    ]);
  };

  const editTask = (id) => {
    const selectedTask = tasks.find((task) => task.id === id);

    if (!selectedTask) return;

    setTaskTitle(selectedTask.title);
    setPriority(selectedTask.priority);
    setEditingTaskId(id);

    if (selectedTask.dueDate) {
      const savedDate = new Date(selectedTask.dueDate);

      setSelectedDate(savedDate);
      setSelectedTime(savedDate);
    } else {
      const now = new Date();

      setSelectedDate(now);

      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);

      setSelectedTime(nextHour);
    }

    setModalVisible(true);
  };

  const updateTask = async () => {
    if (taskTitle.trim() === "") {
      Alert.alert("Error", "Please enter task title");
      return;
    }

    const existingTask = tasks.find((task) => task.id === editingTaskId);

    if (!existingTask) return;

    // Combine selected date and time
    const reminderDate = new Date(selectedDate);

    reminderDate.setHours(
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      0,
      0,
    );

    if (!existingTask.completed && reminderDate <= new Date()) {
      Alert.alert("Invalid Reminder", "Please select a future date and time.");
      return;
    }

    // Cancel old reminder
    if (existingTask.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(
        existingTask.notificationId,
      );
    }

    const updatedTask = {
      ...existingTask,
      title: taskTitle.trim(),
      priority: priority,
      dueDate: reminderDate.toISOString(),
      time: reminderDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      notificationId: null,
    };

    // Schedule new reminder for pending task
    const notificationId = existingTask.completed
      ? null
      : await scheduleTaskReminder(updatedTask);

    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === editingTaskId ? { ...updatedTask, notificationId } : task,
      ),
    );

    setTaskTitle("");
    setPriority("Medium");
    setEditingTaskId(null);
    setSelectedDate(new Date());

    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    setSelectedTime(nextHour);

    setModalVisible(false);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchText.toLowerCase());

    const matchesStatus =
      filterStatus === "All" ||
      (filterStatus === "Completed" && task.completed) ||
      (filterStatus === "Pending" && !task.completed);

    const matchesPriority =
      filterPriority === "All" || task.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });
  const toggleNotificationSettings = async () => {
    if (notificationsEnabled) {
      // Turn OFF
      for (const task of tasks) {
        if (task.notificationId) {
          await Notifications.cancelScheduledNotificationAsync(
            task.notificationId,
          );
        }
      }

      setTasks((previousTasks) =>
        previousTasks.map((task) => ({
          ...task,
          notificationId: null,
        })),
      );

      setNotificationsEnabled(false);

      Alert.alert(
        "Notifications Disabled",
        "All scheduled task reminders have been cancelled.",
      );
    } else {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) return;

      const updatedTasks = await Promise.all(
        tasks.map(async (task) => {
          if (task.completed || !task.dueDate) {
            return { ...task, notificationId: null };
          }

         const notificationId = await scheduleTaskReminder(task, true);

          return {
            ...task,
            notificationId,
          };
        }),
      );

      setTasks(updatedTasks);
      setNotificationsEnabled(true);

      Alert.alert(
        "Notifications Enabled",
        "Task reminders have been scheduled.",
      );
    }
  };
  const handleDateChange = (event, date) => {
    setShowDatePicker(false);

    if (event?.type === "set" && date) {
      setSelectedDate(date);
    }
  };


const handleTimeChange = (event, time) => {
  setShowTimePicker(false);

  if (event?.type === "set" && time) {
    setSelectedTime((previousTime) => {
      const updatedTime = new Date(previousTime);

      updatedTime.setHours(
        time.getHours(),
        time.getMinutes(),
        0,
        0
      );

      console.log("Picker selected hour:", time.getHours());
      console.log("Saved selected hour:", updatedTime.getHours());

      return updatedTime;
    });
  }
};


  // Load tasks from storage
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const savedTasks = await AsyncStorage.getItem("tasks");

        if (savedTasks !== null) {
          setTasks(JSON.parse(savedTasks));
        }
      } catch (error) {
        console.log("Load Error:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTasks();
  }, []);

  // Save tasks whenever they change
  useEffect(() => {
    if (!isLoaded) return;

    const saveTasks = async () => {
      try {
        await AsyncStorage.setItem("tasks", JSON.stringify(tasks));
      } catch (error) {
        console.log("Save Error:", error);
      }
    };

    saveTasks();
  }, [tasks, isLoaded]);
  // Load notification setting
useEffect(() => {
  const loadNotificationSettings = async () => {
    try {
      const notifications = await AsyncStorage.getItem("notificationsEnabled");
      const sound = await AsyncStorage.getItem("soundEnabled");
      const vibration = await AsyncStorage.getItem("vibrationEnabled");

      if (notifications !== null) {
        setNotificationsEnabled(notifications === "true");
      }

      if (sound !== null) {
        setSoundEnabled(sound === "true");
      }

      if (vibration !== null) {
        setVibrationEnabled(vibration === "true");
      }
    } catch (error) {
      console.log("Settings load error:", error);
    } finally {
      setNotificationSettingsLoaded(true);
    }
  };

  loadNotificationSettings();
}, []);
// Load notification history
useEffect(() => {
  const loadNotificationHistory = async () => {
    try {
      const savedHistory =
        await AsyncStorage.getItem("notificationHistory");

      if (savedHistory !== null) {
        setNotificationHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.log("History Load Error:", error);
    } finally {
      setHistoryLoaded(true);
    }
  };

  loadNotificationHistory();
}, []);

// Save notification history
useEffect(() => {
  if (!historyLoaded) return;

  AsyncStorage.setItem(
    "notificationHistory",
    JSON.stringify(notificationHistory)
  ).catch((error) => {
    console.log("History Save Error:", error);
  });
}, [notificationHistory, historyLoaded]);
  // Save notification setting
useEffect(() => {
  if (!notificationSettingsLoaded) return;

  const saveSettings = async () => {
    try {
      await AsyncStorage.multiSet([
        ["notificationsEnabled", String(notificationsEnabled)],
        ["soundEnabled", String(soundEnabled)],
        ["vibrationEnabled", String(vibrationEnabled)],
      ]);
    } catch (error) {
      console.log("Notification settings save error:", error);
    }
  };

  saveSettings();
}, [
  notificationsEnabled,
  soundEnabled,
  vibrationEnabled,
  notificationSettingsLoaded,
]);
// Listen for received notifications

useEffect(() => {
  const subscription =
    Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("NOTIFICATION TAPPED:", response);

        const content = response.notification.request.content;

        const historyItem = {
          id: response.notification.request.identifier,
          title: content.title || "TaskFlow Reminder",
          body: content.body || "",
          taskId: content.data?.taskId || null,
          receivedAt: new Date().toISOString(),
        };

        setNotificationHistory((previousHistory) => {
          if (previousHistory.some((item) => item.id === historyItem.id)) {
            return previousHistory;
          }

          return [historyItem, ...previousHistory].slice(0, 100);
        });
      }
    );

  return () => subscription.remove();
}, []);



useEffect(() => {
  const saveNotificationToHistory = (response) => {
    if (!response) return;

    const notification = response.notification;
    const content = notification.request.content;

    const historyItem = {
      id: notification.request.identifier,
      title: content.title || "TaskFlow Reminder",
      body: content.body || "",
      taskId: content.data?.taskId || null,
      receivedAt: new Date().toISOString(),
    };

    setNotificationHistory((previousHistory) => {
      if (
        previousHistory.some(
          (item) => item.id === historyItem.id
        )
      ) {
        return previousHistory;
      }

      return [historyItem, ...previousHistory].slice(0, 100);
    });
  };

  const subscription =
    Notifications.addNotificationResponseReceivedListener(
      saveNotificationToHistory
    );

  return () => subscription.remove();
}, []);


useEffect(() => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: soundEnabled,
      shouldSetBadge: false,
    }),
  });
}, [soundEnabled]);
  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <Text>Loading Tasks...</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>TaskFlow.</Text>
            <Text style={styles.subtitle}>Manage your day better</Text>
          </View>

          <View style={styles.profile}>
            <Text style={styles.profileText}>J</Text>
          </View>
        </View>

        {/* Welcome */}
        <View style={styles.welcome}>
          <Text style={styles.greeting}>Hello, Jiya! 👋</Text>
          <Text style={styles.description}>Let's make today productive.</Text>
        </View>

        {/* Overview */}
        <Text style={styles.sectionTitle}>Overview</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{tasks.length}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pendingTasks}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedTasks}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Task heading */}
        <View style={styles.taskHeader}>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          <Text style={styles.taskCount}>{tasks.length} tasks</Text>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          value={searchText}
          onChangeText={setSearchText}
        />
        <View style={styles.filterRow}>
          {["All", "Pending", "Completed"].map((status) => (
            <Pressable
              key={status}
              onPress={() => setFilterStatus(status)}
              style={[
                styles.filterButton,
                filterStatus === status && styles.activeFilterButton,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filterStatus === status && styles.activeFilterText,
                ]}
              >
                {status}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.inputLabel}>Priority Filter</Text>

        <View style={styles.filterRow}>
          {["All", "High", "Medium", "Low"].map((item) => (
            <Pressable
              key={item}
              onPress={() => setFilterPriority(item)}
              style={[
                styles.filterButton,
                filterPriority === item && styles.activeFilterButton,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filterPriority === item && styles.activeFilterText,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Task list */}
        {filteredTasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <Pressable
              style={styles.taskInfo}
              onPress={() => toggleTask(task.id)}
            >
              <Text
                style={[
                  styles.taskTitle,
                  task.completed && styles.completedText,
                ]}
              >
                {task.completed ? "✓ " : "○ "}
                {task.title}
              </Text>

              <Text style={styles.taskTime}>{task.time}</Text>
            </Pressable>

            <View style={styles.taskActions}>
              <Text style={styles.priority}>{task.priority}</Text>
              <View style={styles.actionButtons}>
                <Pressable
                  onPress={() => editTask(task.id)}
                  style={styles.editButton}
                >
                  <Text style={{ color: "#6654D9" }}>Edit</Text>
                </Pressable>

                <Pressable
                  onPress={() => deleteTask(task.id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteText}>×</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
        {filteredTasks.length === 0 && (
          <Text style={styles.emptyText}>No tasks found!</Text>
        )}

        {/* Add button */}
        <Pressable
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Add New Task</Text>
        </Pressable>
        <Pressable
  style={styles.addButton}
  onPress={() => setShowHistory(true)}
>
  <Text style={styles.addButtonText}>
    🔔 Notification History ({notificationHistory.length})
  </Text>
</Pressable>
        <Pressable
          style={styles.addButton}
          onPress={checkScheduledNotifications}
        >
          <Text style={styles.addButtonText}>📋 Check Scheduled Reminders</Text>
        </Pressable>

        <Pressable
          style={styles.addButton}
          onPress={toggleNotificationSettings}
        >
          <Text style={styles.addButtonText}>
            🔔 Notifications: {notificationsEnabled ? "ON" : "OFF"}
          </Text>
        </Pressable>

        <Pressable style={styles.addButton} onPress={sendTestNotification}>
          <Text style={styles.addButtonText}>🔔 Test Notification</Text>
        </Pressable>
        <Pressable
  style={styles.addButton}
  onPress={checkNotificationChannels}
>
  <Text style={styles.addButtonText}>
    Check Android Channels
  </Text>
</Pressable>
        <Pressable
          style={styles.addButton}
          onPress={() => setShowNotificationSettings(true)}
        >
          <Text style={styles.addButtonText}>⚙️ Notification Settings</Text>
        </Pressable>
      </ScrollView>

      {/* Add Task Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Task</Text>

            <Text style={styles.inputLabel}>Task Title</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your task"
              value={taskTitle}
              onChangeText={setTaskTitle}
            />

            <Text style={styles.inputLabel}>Select Priority</Text>

            <View style={styles.priorityOptions}>
              {["Low", "Medium", "High"].map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.priorityOption,
                    priority === item && styles.selectedPriority,
                  ]}
                  onPress={() => setPriority(item)}
                >
                  <Text
                    style={[
                      styles.priorityOptionText,
                      priority === item && styles.selectedPriorityText,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.inputLabel}>Select Due Date</Text>

            <Pressable
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                📅 {selectedDate.toLocaleDateString()}
              </Text>
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
            )}

            <Text style={styles.inputLabel}>Select Reminder Time</Text>

            <Pressable
              style={styles.dateButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                🕒{" "}
                {selectedTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </Pressable>

           
{showTimePicker && (
  <DateTimePicker
    value={selectedTime}
    mode="time"
    display="clock"
    is24Hour={false}
    onChange={handleTimeChange}
  />
)}


            <Pressable
              style={styles.saveButton}
              onPress={editingTaskId ? updateTask : addTask}
            >
              <Text style={styles.addButtonText}>
                {editingTaskId ? "Update Task" : "Save Task"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setModalVisible(false);
                setTaskTitle("");
                setPriority("Medium");
                setEditingTaskId(null);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Notification Settings Modal */}
      <Modal
        visible={showNotificationSettings}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNotificationSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚙️ Notification Settings</Text>

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
                <Text style={styles.settingTitle}>Notification Sound 🔊</Text>
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
                <Text style={styles.settingTitle}>Vibration 📳</Text>
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

            {/* Close */}
            <Pressable onPress={() => setShowNotificationSettings(false)}>
              <Text style={styles.cancelText}>Close Settings</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

<Modal
  visible={showHistory}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setShowHistory(false)}
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
            <View
              key={item.id}
              style={styles.taskCard}
            >
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
        onPress={() => {
          Alert.alert(
            "Clear History",
            "Are you sure you want to delete all notification history?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Clear",
                style: "destructive",
                onPress: () => setNotificationHistory([]),
              },
            ]
          );
        }}
      >
        <Text style={styles.addButtonText}>
          Clear History
        </Text>
      </Pressable>

      <Pressable onPress={() => setShowHistory(false)}>
        <Text style={styles.cancelText}>Close</Text>
      </Pressable>
    </View>
  </View>
</Modal>

    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7FC",
    paddingHorizontal: 20,
    paddingTop: 45,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  logo: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#6654D9",
  },

  subtitle: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },

  profile: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#E5DFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  profileText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6654D9",
  },

  welcome: {
    marginBottom: 30,
  },

  greeting: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#222",
  },

  description: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 15,
  },

  statsContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 30,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    borderRadius: 15,
    alignItems: "center",
    elevation: 2,
  },

  statNumber: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#6654D9",
  },

  statLabel: {
    fontSize: 11,
    color: "#777",
    marginTop: 7,
  },

  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  taskCount: {
    color: "#888",
    fontSize: 12,
  },

  taskCard: {
    backgroundColor: "#FFFFFF",
    padding: 17,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 1,
  },

  taskInfo: {
    flex: 1,
  },

  taskTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },

  completedText: {
    textDecorationLine: "line-through",
    color: "#999",
  },

  taskTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },

  taskActions: {
    alignItems: "center",
    gap: 8,
  },

  priority: {
    fontSize: 11,
    color: "#6654D9",
    backgroundColor: "#EEEAFE",
    padding: 8,
    borderRadius: 8,
  },

  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 2,
  },

  deleteText: {
    color: "#E05252",
    fontSize: 23,
  },

  addButton: {
    backgroundColor: "#6654D9",
    padding: 17,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 15,
    marginBottom: 50,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },

  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 20,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 25,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    color: "#444",
  },

  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    padding: 13,
    marginBottom: 22,
    fontSize: 15,
  },

  priorityOptions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 25,
  },

  priorityOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    alignItems: "center",
  },

  selectedPriority: {
    backgroundColor: "#6654D9",
    borderColor: "#6654D9",
  },

  priorityOptionText: {
    color: "#555",
  },

  selectedPriorityText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  saveButton: {
    backgroundColor: "#6654D9",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  cancelText: {
    textAlign: "center",
    marginTop: 18,
    color: "#777",
    fontSize: 15,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  editButton: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchInput: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 10,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E5EF",
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#EEEEF5",
  },

  activeFilterButton: {
    backgroundColor: "#6654D9",
  },

  filterText: {
    color: "#333333",
  },

  activeFilterText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#888888",
  },
  dateButton: {
    backgroundColor: "#F0EDFF",
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },

  dateButtonText: {
    color: "#6654D9",
    fontSize: 15,
    fontWeight: "600",
  },

  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEF5",
  },

  settingInfo: {
    flex: 1,
    paddingRight: 10,
  },

  settingTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },

  settingDescription: {
    fontSize: 11,
    color: "#888",
    marginTop: 5,
  },

  toggleButton: {
    backgroundColor: "#E5E5EF",
    paddingVertical: 9,
    paddingHorizontal: 17,
    borderRadius: 20,
    minWidth: 65,
    alignItems: "center",
  },

  toggleActive: {
    backgroundColor: "#6654D9",
  },

  toggleText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
  },
});
