import React, { useState, useEffect, useRef } from "react";
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
  const scrollViewRef = useRef(null);
  const [tasksSectionY, setTasksSectionY] = useState(0);
  const [activeTab, setActiveTab] = useState("Home");
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
  const [sortBy, setSortBy] = useState("Due Date");
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
      const channels = await Notifications.getNotificationChannelsAsync();

      console.log("Notification Channels:", channels);

      Alert.alert(
        "Channel Information",
        JSON.stringify(channels, null, 2).slice(0, 2500),
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
    vibrationOverride = vibrationEnabled,
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

      const notificationId = await Notifications.scheduleNotificationAsync({
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
     

      const pendingNotifications =
        await Notifications.getAllScheduledNotificationsAsync();

     
      return notificationId;
    } catch (error) {
      console.log("Task Reminder Error:", error);
      Alert.alert("Reminder Error", error.message);
      return null;
    }
  };

  const updateSoundVibrationSettings = async (newSound, newVibration) => {
    try {
      // Save new settings
      setSoundEnabled(newSound);
      setVibrationEnabled(newVibration);

      // Cancel existing pending task reminders
      for (const task of tasks) {
        if (task.notificationId) {
          await Notifications.cancelScheduledNotificationAsync(
            task.notificationId,
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
            newVibration,
          );

          return { ...task, notificationId };
        }),
      );

      setTasks(updatedTasks);

     
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

    reminderDate.setHours(
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      0,
      0,
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
              completedAt: willComplete ? new Date().toISOString() : null,
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
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "Due Date") {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;

      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;

      return dateA - dateB;
    }

    if (sortBy === "Priority") {
      const priorityOrder = {
        High: 1,
        Medium: 2,
        Low: 3,
      };

      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }

    if (sortBy === "Newest First") {
      return Number(b.id) - Number(a.id);
    }

    return 0;
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

        updatedTime.setHours(time.getHours(), time.getMinutes(), 0, 0);

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
        const notifications = await AsyncStorage.getItem(
          "notificationsEnabled",
        );
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
        const savedHistory = await AsyncStorage.getItem("notificationHistory");

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
      JSON.stringify(notificationHistory),
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
    const subscription = Notifications.addNotificationResponseReceivedListener(
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
      },
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
        if (previousHistory.some((item) => item.id === historyItem.id)) {
          return previousHistory;
        }

        return [historyItem, ...previousHistory].slice(0, 100);
      });
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(
      saveNotificationToHistory,
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

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
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
        {/* Modern Dashboard Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>TaskFlow.</Text>
            <Text style={styles.subtitle}>YOUR DAILY PRODUCTIVITY</Text>
          </View>

          <Pressable
            style={styles.profile}
            onPress={() => setShowNotificationSettings(true)}
          >
            <Text style={styles.profileText}>J</Text>
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

          <Text style={styles.greeting}>Hello, Jiya! 👋</Text>
          <Text style={styles.description}>Let's make today productive.</Text>
        </View>

        {/* Overview */}

        {/* Overview Section */}
        <View style={styles.overviewHeader}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.overviewSubtitle}>Your progress</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.totalCard]}>
            <Text style={styles.statIcon}>📋</Text>
            <Text style={styles.statNumber}>{tasks.length}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>

          <View style={[styles.statCard, styles.pendingCard]}>
            <Text style={styles.statIcon}>⏳</Text>
            <Text style={styles.statNumber}>{pendingTasks}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={[styles.statCard, styles.completedCard]}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statNumber}>{completedTasks}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Productivity Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>Daily Progress ✨</Text>
              <Text style={styles.progressSubtitle}>
                Keep going, you're doing great!
              </Text>
            </View>

            <Text style={styles.progressPercentage}>
              {tasks.length === 0
                ? 0
                : Math.round((completedTasks / tasks.length) * 100)}
              %
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    tasks.length === 0
                      ? 0
                      : (completedTasks / tasks.length) * 100
                  }%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Task heading */}
        {/* Today's Tasks Heading */}
        <View style={styles.taskHeader}>
          <View
            style={styles.taskHeader}
            onLayout={(event) => setTasksSectionY(event.nativeEvent.layout.y)}
          ></View>
          <View>
            <Text style={styles.sectionTitle}>My Tasks</Text>
            <Text style={styles.taskSubtitle}>
              Manage your daily activities
            </Text>
          </View>

          <View style={styles.taskCountBadge}>
            <Text style={styles.taskCount}>{filteredTasks.length} Tasks</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search your tasks..."
            placeholderTextColor="#A29DB2"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText("")}>
              <Text style={styles.clearSearch}>×</Text>
            </Pressable>
          )}
        </View>

        {/* Task Status Filter */}
        <Text style={styles.filterHeading}>Task Status</Text>

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

        {/* Priority Filter */}
        <Text style={styles.filterHeading}>Priority</Text>

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
        {/* Task Sorting */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort By</Text>

          <View style={styles.sortOptions}>
            {["Due Date", "Priority", "Newest First"].map((option) => (
              <Pressable
                key={option}
                onPress={() => setSortBy(option)}
                style={[
                  styles.sortButton,
                  sortBy === option && styles.activeSortButton,
                ]}
              >
                <Text
                  style={[
                    styles.sortText,
                    sortBy === option && styles.activeSortText,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        {/* Premium Task List */}
        {sortedTasks.map((task) => (
          <View
            key={task.id}
            style={[
              styles.taskCard,
              task.completed && styles.completedTaskCard,
            ]}
          >
            <Pressable
              style={styles.taskInfo}
              onPress={() => toggleTask(task.id)}
            >
              <View style={styles.taskTitleRow}>
                <View
                  style={[
                    styles.taskCheckbox,
                    task.completed && styles.checkedCheckbox,
                  ]}
                >
                  {task.completed && <Text style={styles.checkmark}>✓</Text>}
                </View>

                <Text
                  numberOfLines={2}
                  style={[
                    styles.taskTitle,
                    task.completed && styles.completedText,
                  ]}
                >
                  {task.title}
                </Text>
              </View>

              <Text style={styles.taskTime}>
                🕒 {task.time || "No time set"}
              </Text>
              {task.dueDate && (
                <Text style={styles.dueDateText}>
                  📅{" "}
                  {new Date(task.dueDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              )}
              {task.dueDate &&
                !task.completed &&
                new Date(task.dueDate) < new Date() && (
                  <Text style={styles.overdueText}>⚠️ Overdue</Text>
                )}
              {task.completed && task.completedAt && (
                <Text style={styles.completedAtText}>
                  ✓ Completed on{" "}
                  {new Date(task.completedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              )}
            </Pressable>

            <View style={styles.taskActions}>
              <Text
                style={[
                  styles.priority,
                  task.priority === "High" && styles.highPriority,
                  task.priority === "Medium" && styles.mediumPriority,
                  task.priority === "Low" && styles.lowPriority,
                ]}
              >
                {task.priority}
              </Text>

              <View style={styles.actionButtons}>
                <Pressable
                  onPress={() => editTask(task.id)}
                  style={styles.editButton}
                >
                  <Text style={styles.editText}>✎</Text>
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
          <Text style={styles.emptyText}>No tasks found! ✨</Text>
        )}

        {/* Add button */}

        {/* Floating Add Task Button */}
        <Pressable
          style={styles.fab}
          onPress={() => {
            setEditingTaskId(null);
            setTaskTitle("");
            setPriority("Medium");
            setSelectedDate(new Date());

            const nextHour = new Date();
            nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
            setSelectedTime(nextHour);

            setModalVisible(true);
          }}
        >
          <Text style={styles.fabText}>＋</Text>
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
          <View style={styles.settingsModalContent}>
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
                  updateSoundVibrationSettings(!soundEnabled, vibrationEnabled)
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
                  updateSoundVibrationSettings(soundEnabled, !vibrationEnabled)
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
            {/* Test Notification */}
            {/* Notification History */}
            <Pressable
              style={styles.secondaryActionButton}
              onPress={() => {
                setShowNotificationSettings(false);
                setShowHistory(true);
              }}
            >
              <Text style={styles.secondaryActionText}>
                🕘 View Notification History
              </Text>
            </Pressable>
            <Text style={styles.settingsFooter}>
              TaskFlow • Stay productive ✨
            </Text>
            {/* Close */}
            <Pressable
              onPress={() => {
                setShowNotificationSettings(false);
                setActiveTab("Home");
              }}
            >
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
            <Text style={styles.modalTitle}>🔔 Notification History</Text>

            <ScrollView style={{ maxHeight: 400 }}>
              {notificationHistory.length === 0 ? (
                <Text style={styles.emptyText}>
                  No notification history yet!
                </Text>
              ) : (
                notificationHistory.map((item) => (
                  <View key={item.id} style={styles.taskCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.settingTitle}>{item.title}</Text>

                      <Text style={styles.settingDescription}>{item.body}</Text>

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
                      onPress: async () => {
                        setNotificationHistory([]);
                        await AsyncStorage.setItem(
                          "notificationHistory",
                          JSON.stringify([]),
                        );
                      },
                    },
                  ],
                );
              }}
            >
              <Text style={styles.addButtonText}>Clear History</Text>
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
    marginBottom: 32,
  },

  logo: {
    fontSize: 32,
    fontWeight: "900",
    color: "#6654D9",
    letterSpacing: -1,
  },

  subtitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#9993B8",
    marginTop: 5,
  },

  profile: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#E9E3FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  profileText: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#6654D9",
  },

  onlineDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#35C98A",
    right: 1,
    bottom: 2,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  welcome: {
    marginBottom: 32,
  },

  dateText: {
    fontSize: 13,
    color: "#8B83A8",
    fontWeight: "600",
    marginBottom: 10,
  },

  greeting: {
    fontSize: 29,
    fontWeight: "900",
    color: "#25213A",
  },

  description: {
    fontSize: 15,
    color: "#89869A",
    marginTop: 9,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 15,
  },

  overviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  overviewSubtitle: {
    color: "#9993B8",
    fontSize: 12,
    fontWeight: "600",
  },

  statsContainer: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 5,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },

  totalCard: {
    backgroundColor: "#EEE9FF",
  },

  pendingCard: {
    backgroundColor: "#FFF1DC",
  },

  completedCard: {
    backgroundColor: "#E2F8EE",
  },

  statIcon: {
    fontSize: 21,
    marginBottom: 7,
  },

  statNumber: {
    fontSize: 27,
    fontWeight: "900",
    color: "#6654D9",
  },

  statLabel: {
    fontSize: 11,
    color: "#77718A",
    marginTop: 5,
    fontWeight: "600",
  },

  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    marginBottom: 28,
    elevation: 2,
    shadowColor: "#6654D9",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  progressTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#29243D",
  },

  progressSubtitle: {
    fontSize: 11,
    color: "#9993A8",
    marginTop: 5,
  },

  progressPercentage: {
    fontSize: 22,
    fontWeight: "900",
    color: "#6654D9",
  },

  progressTrack: {
    height: 9,
    backgroundColor: "#F0EDFA",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: 9,
    backgroundColor: "#7159DF",
    borderRadius: 10,
  },

  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },

  taskSubtitle: {
    fontSize: 12,
    color: "#9993AA",
    marginTop: 4,
  },

  taskCountBadge: {
    backgroundColor: "#EEE9FF",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
  },

  taskCount: {
    color: "#6654D9",
    fontSize: 12,
    fontWeight: "800",
  },
  taskCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 18,
    marginBottom: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEEAF8",
    elevation: 2,
    shadowColor: "#6654D9",
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },

  completedTaskCard: {
    backgroundColor: "#F8F7FC",
  },

  taskInfo: {
    flex: 1,
    paddingRight: 8,
  },

  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  taskCheckbox: {
    width: 21,
    height: 21,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "#A99AE8",
    alignItems: "center",
    justifyContent: "center",
  },

  checkedCheckbox: {
    backgroundColor: "#6654D9",
    borderColor: "#6654D9",
  },

  checkmark: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },

  taskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#302B43",
  },

  completedText: {
    textDecorationLine: "line-through",
    color: "#999",
  },

  taskTime: {
    fontSize: 11,
    color: "#9993AA",
    marginTop: 9,
    marginLeft: 30,
  },

  taskActions: {
    alignItems: "flex-end",
    gap: 10,
  },

  priority: {
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 9,
    overflow: "hidden",
  },

  highPriority: {
    color: "#D64D5A",
    backgroundColor: "#FFE7E9",
  },

  mediumPriority: {
    color: "#B47A20",
    backgroundColor: "#FFF1D8",
  },

  lowPriority: {
    color: "#26946B",
    backgroundColor: "#E2F8ED",
  },

  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  editButton: {
    backgroundColor: "#F0EDFF",
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  editText: {
    color: "#6654D9",
    fontSize: 20,
  },

  deleteButton: {
    width: 30,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },

  deleteText: {
    color: "#E05252",
    fontSize: 24,
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
    backgroundColor: "rgba(30, 23, 55, 0.55)",
    justifyContent: "center",
    padding: 18,
  },

  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 25,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
  },

  modalTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#29243D",
    marginBottom: 22,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 9,
    color: "#514B65",
  },

  input: {
    borderWidth: 1,
    borderColor: "#E8E3F2",
    backgroundColor: "#FAF9FE",
    borderRadius: 13,
    padding: 14,
    marginBottom: 20,
    fontSize: 15,
    color: "#302B43",
  },

  priorityOptions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },

  priorityOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E0F0",
    backgroundColor: "#FAF9FE",
    borderRadius: 12,
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
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    elevation: 3,
    shadowColor: "#6654D9",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
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

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    paddingHorizontal: 14,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: "#EAE6F5",
    elevation: 1,
  },

  searchIcon: {
    fontSize: 25,
    color: "#8273D5",
    marginRight: 9,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 14,
    color: "#302B43",
  },

  clearSearch: {
    fontSize: 23,
    color: "#9993AA",
    paddingHorizontal: 5,
  },

  filterHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#39334D",
    marginTop: 12,
    marginBottom: 10,
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 12,
  },

  filterButton: {
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "#ECEBF3",
    borderWidth: 1,
    borderColor: "#ECEBF3",
  },

  activeFilterButton: {
    backgroundColor: "#6654D9",
    borderColor: "#6654D9",
  },

  filterText: {
    color: "#625D70",
    fontSize: 13,
    fontWeight: "600",
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
    padding: 15,
    backgroundColor: "#F8F6FF",
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEEAF8",
  },

  settingInfo: {
    flex: 1,
    paddingRight: 10,
  },

  settingTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#302B43",
  },

  settingDescription: {
    fontSize: 11,
    color: "#928CA5",
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
  settingsModalContent: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 25,
    elevation: 10,
    shadowColor: "#6654D9",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
  },

  settingsFooter: {
    textAlign: "center",
    color: "#A29DB2",
    fontSize: 11,
    marginTop: 18,
    fontWeight: "600",
  },
  secondaryActionButton: {
    backgroundColor: "#F0EDFF",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E3DDFB",
  },

  secondaryActionText: {
    color: "#6654D9",
    fontSize: 14,
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    right: 22,
    bottom: 95,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6654D9",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#6654D9",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  fabText: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "400",
    marginTop: -3,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EEEAF8",
    elevation: 12,
  },

  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  navIcon: {
    fontSize: 23,
    color: "#A29DB2",
    marginBottom: 3,
  },

  navLabel: {
    fontSize: 11,
    color: "#A29DB2",
    fontWeight: "600",
  },

  activeNavText: {
    color: "#6654D9",
    fontWeight: "900",
  },
  sortContainer: {
    marginTop: 12,
    marginBottom: 18,
  },

  sortLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#39334D",
    marginBottom: 10,
  },

  sortOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#F0EDFA",
    borderWidth: 1,
    borderColor: "#E8E3F5",
  },

  activeSortButton: {
    backgroundColor: "#6654D9",
    borderColor: "#6654D9",
  },

  sortText: {
    fontSize: 11,
    color: "#625D70",
    fontWeight: "600",
  },

  activeSortText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  dueDateText: {
    fontSize: 11,
    color: "#8273D5",
    marginTop: 6,
    marginLeft: 30,
    fontWeight: "600",
  },
  overdueText: {
    fontSize: 11,
    color: "#D64D5A",
    marginTop: 5,
    marginLeft: 30,
    fontWeight: "800",
  },
  completedAtText: {
    fontSize: 11,
    color: "#26946B",
    marginTop: 6,
    marginLeft: 30,
    fontWeight: "700",
  },
});
