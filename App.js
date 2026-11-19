import React, { useState, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import Header from "./components/Header";
import StatsCards from "./components/StatsCards";
import TaskCard from "./components/TaskCard";
import AddTaskModal from "./components/AddTaskModal";
import NotificationSettings from "./components/NotificationSettings";
import NotificationHistory from "./components/NotificationHistory";
import BottomNavigation from "./components/BottomNavigation";
import { saveTasks, loadTasks } from "./utils/storage";
import { sortTasks } from "./utils/taskHelpers";
import { calculateTaskStats } from "./utils/taskStats";
import ProfileScreen from "./screens/ProfileScreen";
import {
  getTasks,
  createTask,
  updateTask as updateTaskAPI,
  deleteTask as deleteTaskAPI,
  getTaskStats,
} from "./utils/taskService";

import {
  requestNotificationPermission,
  cancelTaskReminder,
  getScheduledTaskReminders,
  sendTestNotification as sendTestNotificationService,
} from "./utils/notificationService";
import {
  loadNotificationSettings,
  saveNotificationSettings,
} from "./utils/notificationSettingsStorage";
import {
  loadNotificationHistory,
  saveNotificationHistory,
} from "./utils/notificationStorage";
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
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import {
  checkAuthStatus,
  logoutUser,
  updateProfile,
  changePassword,
} from "./utils/authService";
export default function App() {
  const scrollViewRef = useRef(null);
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
  });
  const [tasksSectionY, setTasksSectionY] = useState(0);
  const [showRegister, setShowRegister] = useState(false);
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
  const [showProfile, setShowProfile] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [backendTasksLoading, setBackendTasksLoading] = useState(false);
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

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [notificationSettingsLoaded, setNotificationSettingsLoaded] =
    useState(false);
  const { totalTasks, completedTasks, pendingTasks, progressPercentage } =
    calculateTaskStats(tasks);
  const sendTestNotification = async () => {
    const success = await sendTestNotificationService();

    if (success) {
      Alert.alert("Success", "Test notification scheduled!");
    } else {
      Alert.alert(
        "Notification Error",
        "Unable to send test notification. Please check permission.",
      );
    }
  };

  const checkScheduledNotifications = async () => {
    try {
      const notifications = await getScheduledTaskReminders();

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
          await cancelTaskReminder(task.notificationId);
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

    // Combine selected date and time
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

    try {
      // Step 1: Save task in MongoDB
      const response = await createTask({
        title: taskTitle.trim(),
        description: "",
        priority: priority,
        dueDate: reminderDate.toISOString(),
      });

      const savedTask = response.task;

      // Step 2: Format MongoDB task
      const newTask = {
        ...savedTask,
        id: savedTask._id,
        time: reminderDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        notificationId: null,
      };

      // Step 3: Schedule local notification
      const notificationId = await scheduleTaskReminder(newTask);

      const taskWithReminder = {
        ...newTask,
        notificationId,
      };

      // Step 4: Update Dashboard
      setTasks((previousTasks) => [...previousTasks, taskWithReminder]);

      await fetchTaskStats();
      console.log("Task Saved in MongoDB:", savedTask);

      // Step 5: Reset form
      setTaskTitle("");
      setPriority("Medium");
      setSelectedDate(new Date());

      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      setSelectedTime(nextHour);

      setModalVisible(false);
    } catch (error) {
      console.log("Create Task Error:", error.response?.data || error.message);

      Alert.alert("Error", "Task could not be saved. Please try again.");
    }
  };

  // Complete / Incomplete task
  const toggleTask = async (id) => {
    const selectedTask = tasks.find((task) => task.id === id);

    if (!selectedTask) return;

    const willComplete = !selectedTask.completed;

    let notificationId = selectedTask.notificationId || null;

    try {
      // Step 1: Update task in MongoDB
      const response = await updateTaskAPI(id, {
        completed: willComplete,
        completedAt: willComplete ? new Date().toISOString() : null,
      });

      console.log("MongoDB Update Response:", response);

      // Step 2: Handle notifications
      if (willComplete) {
        if (notificationId) {
          await cancelTaskReminder(notificationId);
        }

        notificationId = null;
      } else {
        notificationId = await scheduleTaskReminder(selectedTask);
      }

      // Step 3: Update Dashboard
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

      await fetchTaskStats();

      console.log("Task Status Updated in MongoDB:", id);
    } catch (error) {
      console.log("Toggle Task Error:", error.response?.data || error.message);

      Alert.alert("Error", "Unable to update task status.");
    }
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

          if (!taskToDelete) return;

          try {
            // Step 1: Delete task from MongoDB
            const response = await deleteTaskAPI(id);

            console.log("MongoDB Delete Response:", response);

            // Step 2: Cancel task reminder
            if (taskToDelete.notificationId) {
              await cancelTaskReminder(taskToDelete.notificationId);
            }

            // Step 3: Remove task from Dashboard
            setTasks((previousTasks) =>
              previousTasks.filter((task) => task.id !== id),
            );

            await fetchTaskStats();

            console.log("Task Deleted from MongoDB:", id);
          } catch (error) {
            console.log(
              "Delete Task Error:",
              error.response?.data || error.message,
            );

            Alert.alert("Error", "Unable to delete task. Please try again.");
          }
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

    try {
      // Step 1: Update task in MongoDB
      const response = await updateTaskAPI(editingTaskId, {
        title: taskTitle.trim(),
        priority: priority,
        dueDate: reminderDate.toISOString(),
      });

      console.log("MongoDB Edit Response:", response);

      // Step 2: Cancel old reminder
      if (existingTask.notificationId) {
        await cancelTaskReminder(existingTask.notificationId);
      }

      const updatedTask = {
        ...existingTask,
        ...response.task,
        id: response.task._id,
        title: response.task.title,
        priority: response.task.priority,
        dueDate: response.task.dueDate,
        time: reminderDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        notificationId: null,
      };

      // Step 3: Schedule new reminder for pending task
      const notificationId = existingTask.completed
        ? null
        : await scheduleTaskReminder(updatedTask);

      // Step 4: Update Dashboard
      setTasks((previousTasks) =>
        previousTasks.map((task) =>
          task.id === editingTaskId ? { ...updatedTask, notificationId } : task,
        ),
      );

      await fetchTaskStats();

      // Step 5: Reset form
      setTaskTitle("");
      setPriority("Medium");
      setEditingTaskId(null);
      setSelectedDate(new Date());

      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      setSelectedTime(nextHour);

      setModalVisible(false);

      console.log("Task Updated Successfully in MongoDB");
    } catch (error) {
      console.log("Update Task Error:", error.response?.data || error.message);

      Alert.alert("Error", "Unable to update task. Please try again.");
    }
  };
  // Fetch Task Statistics from MongoDB
  const fetchTaskStats = async () => {
    console.log("getTaskStats type:", typeof getTaskStats);

    try {
      const response = await getTaskStats();

      console.log("Statistics API Response:", response);

      console.log("Overdue Tasks Count:", response.stats.overdueTasks);

      setTaskStats({
        totalTasks: response.stats.totalTasks ?? 0,
        completedTasks: response.stats.completedTasks ?? 0,
        pendingTasks: response.stats.pendingTasks ?? 0,
        overdueTasks: response.stats.overdueTasks ?? 0,
      });
    } catch (error) {
      console.log("Statistics Error:", error);
      console.log("Error Message:", error.message);
    }
  };
  const sortedTasks = sortTasks(tasks, sortBy);
  const toggleNotificationSettings = async () => {
    if (notificationsEnabled) {
      // Turn OFF
      for (const task of tasks) {
        if (task.notificationId) {
          await cancelTaskReminder(task.notificationId);
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

  useEffect(() => {
    const getTasks = async () => {
      try {
        const savedTasks = await loadTasks();

        if (savedTasks !== null) {
          setTasks(savedTasks);
        }
      } catch (error) {
        console.log("Load Error:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    getTasks();
  }, []);

  // Save tasks whenever they change
  useEffect(() => {
    if (!isLoaded) return;

    saveTasks(tasks);
  }, [tasks, isLoaded]);
  // Load notification setting
  useEffect(() => {
    const getSettings = async () => {
      try {
        const settings = await loadNotificationSettings();

        if (settings !== null) {
          if (settings.notificationsEnabled !== null) {
            setNotificationsEnabled(settings.notificationsEnabled);
          }

          if (settings.soundEnabled !== null) {
            setSoundEnabled(settings.soundEnabled);
          }

          if (settings.vibrationEnabled !== null) {
            setVibrationEnabled(settings.vibrationEnabled);
          }
        }
      } finally {
        setNotificationSettingsLoaded(true);
      }
    };

    getSettings();
  }, []);
  // Load notification history

  useEffect(() => {
    const getNotificationHistory = async () => {
      try {
        const savedHistory = await loadNotificationHistory();

        if (savedHistory !== null) {
          setNotificationHistory(savedHistory);
        }
      } finally {
        setHistoryLoaded(true);
      }
    };

    getNotificationHistory();
  }, []);

  // Save notification history
  useEffect(() => {
    if (!historyLoaded) return;

    saveNotificationHistory(notificationHistory);
  }, [notificationHistory, historyLoaded]);
  // Save notification setting
  useEffect(() => {
    if (!notificationSettingsLoaded) return;

    saveNotificationSettings(
      notificationsEnabled,
      soundEnabled,
      vibrationEnabled,
    );
  }, [
    notificationsEnabled,
    soundEnabled,
    vibrationEnabled,
    notificationSettingsLoaded,
  ]);
  // Listen for received notifications

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

  useEffect(() => {
    const verifyAuthentication = async () => {
      try {
        const result = await checkAuthStatus();

        setIsAuthenticated(result.isAuthenticated);
        setCurrentUser(result.user);

        console.log("Authentication Status:", result.isAuthenticated);
      } catch (error) {
        console.log("Authentication Error:", error.message);
        setIsAuthenticated(false);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    verifyAuthentication();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isActive = true;

    const fetchBackendTasks = async () => {
      try {
        setBackendTasksLoading(true);

        // Backend API ke liye filters prepare karo
        const filters = {};

        if (searchText.trim()) {
          filters.search = searchText.trim();
        }

        if (filterPriority !== "All") {
          filters.priority = filterPriority;
        }

        if (filterStatus !== "All") {
          filters.status = filterStatus.toLowerCase();
        }

        // Backend se filtered tasks fetch karo
        const response = await getTasks(filters);

        const formattedTasks = response.tasks.map((task) => ({
          ...task,
          id: task._id,
          time: task.dueDate
            ? new Date(task.dueDate).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          notificationId: null,
        }));

        if (isActive) {
          setTasks(formattedTasks);
          console.log("Filtered Tasks Loaded:", formattedTasks);
        }
      } catch (error) {
        console.log(
          "Fetch Backend Tasks Error:",
          error.response?.data || error.message,
        );
      } finally {
        if (isActive) {
          setBackendTasksLoading(false);
        }
      }
    };

    // Search typing rukne ke 500ms baad API call hogi
    const timer = setTimeout(() => {
      fetchBackendTasks();
    }, 500);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [isAuthenticated, searchText, filterStatus, filterPriority]);

  // Load Task Statistics when user logs in
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchTaskStats();
  }, [isAuthenticated]);
  if (!isLoaded || authLoading || (isAuthenticated && backendTasksLoading)) {
    return (
      <View style={styles.container}>
        <Text>Loading TaskFlow...</Text>
      </View>
    );
  }
  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <RegisterScreen
          onRegisterSuccess={(user) => {
            setCurrentUser(user);
            setIsAuthenticated(true);
            setShowRegister(false);
          }}
          onShowLogin={() => setShowRegister(false)}
        />
      );
    }

    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
        }}
        onShowRegister={() => setShowRegister(true)}
      />
    );
  }
  // Show Profile Screen
  if (showProfile) {
    return (
      <ProfileScreen
        currentUser={currentUser}
        onBack={() => setShowProfile(false)}
        onLogout={async () => {
          try {
            await logoutUser();
            setIsAuthenticated(false);
            setCurrentUser(null);
            setShowProfile(false);
          } catch (error) {
            console.log("Logout Failed:", error.message);
          }
        }}
        onSave={async (profileData) => {
  try {
    if (!profileData.name.trim() || !profileData.email.trim()) {
      Alert.alert("Error", "Please enter name and email.");
      return;
    }

    const response = await updateProfile({
      name: profileData.name.trim(),
      email: profileData.email.trim(),
    });

    setCurrentUser(response.user);

    Alert.alert(
      "Success",
      "Profile updated successfully!"
    );
  } catch (error) {
    Alert.alert(
      "Update Failed",
      error.response?.data?.message || "Unable to update profile."
    );
  }
}}
onChangePassword={async (passwordData) => {
  try {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      Alert.alert("Error", "Please fill all password fields.");
      return false;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return false;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return false;
    }

    const response = await changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });

    Alert.alert(
      "Success",
      response.message || "Password changed successfully!"
    );

    return true;
  } catch (error) {
    Alert.alert(
      "Password Update Failed",
      error.response?.data?.message || "Unable to change password."
    );

    return false;
  }
}}
      />
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
        <BottomNavigation
          styles={styles}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          scrollViewRef={scrollViewRef}
          tasksSectionY={tasksSectionY}
          setShowNotificationSettings={setShowNotificationSettings}
        />

        <Header
          styles={styles}
          currentUser={currentUser}
          onOpenProfile={() => setShowProfile(true)}
        />
     
        <StatsCards
          styles={styles}
          totalTasks={taskStats.totalTasks}
          pendingTasks={taskStats.pendingTasks}
          completedTasks={taskStats.completedTasks}
          overdueTasks={taskStats.overdueTasks}
        />

        {/* Productivity Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>Daily Progress ✨</Text>
              <Text style={styles.progressSubtitle}>
                Keep going, you're doing great!
              </Text>
            </View>

            <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
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
        <View
          style={styles.taskHeader}
          onLayout={(event) => setTasksSectionY(event.nativeEvent.layout.y)}
        >
          <View style={styles.taskHeaderContent}>
            <Text style={styles.sectionTitle}>My Tasks</Text>

            <Text style={styles.taskSubtitle}>
              Manage your daily activities
            </Text>
          </View>

          <View style={styles.taskCountBadge}>
            <Text style={styles.taskCount}>{sortedTasks.length} Tasks</Text>
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
        {/* Clear Filters Button */}
        <Pressable
          style={styles.clearFiltersButton}
          onPress={() => {
            setSearchText("");
            setFilterStatus("All");
            setFilterPriority("All");
          }}
        >
          <Text style={styles.clearFiltersText}>✕ Clear Filters</Text>
        </Pressable>
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
          <TaskCard
            key={task.id}
            task={task}
            styles={styles}
            onToggle={toggleTask}
            onEdit={editTask}
            onDelete={deleteTask}
          />
        ))}

        {sortedTasks.length === 0 && (
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

      <AddTaskModal
        styles={styles}
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        taskTitle={taskTitle}
        setTaskTitle={setTaskTitle}
        priority={priority}
        setPriority={setPriority}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        showTimePicker={showTimePicker}
        setShowTimePicker={setShowTimePicker}
        handleDateChange={handleDateChange}
        handleTimeChange={handleTimeChange}
        editingTaskId={editingTaskId}
        setEditingTaskId={setEditingTaskId}
        updateTask={updateTask}
        addTask={addTask}
      />

      <NotificationSettings
        styles={styles}
        visible={showNotificationSettings}
        onClose={() => {
          setShowNotificationSettings(false);
          setActiveTab("Home");
        }}
        notificationsEnabled={notificationsEnabled}
        toggleNotificationSettings={toggleNotificationSettings}
        soundEnabled={soundEnabled}
        vibrationEnabled={vibrationEnabled}
        updateSoundVibrationSettings={updateSoundVibrationSettings}
        checkScheduledNotifications={checkScheduledNotifications}
        onViewHistory={() => {
          setShowNotificationSettings(false);
          setShowHistory(true);
        }}
      />

      <NotificationHistory
        styles={styles}
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        notificationHistory={notificationHistory}
        setNotificationHistory={setNotificationHistory}
      />
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
    width: "100%",
    marginBottom: 20,
  },

  taskHeaderContent: {
    flex: 1,
    alignItems: "flex-start",
  },

  sectionTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F1F2E", // Dark heading
    textAlign: "left",
  },

  taskSubtitle: {
    fontSize: 16,
    color: "#9996A8", // Light grey text
    marginTop: 8,
    textAlign: "left",
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
  clearFiltersButton: {
    alignSelf: "flex-end",
    marginTop: 10,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#FFE8E8",
    borderRadius: 8,
  },

  clearFiltersText: {
    color: "#D32F2F",
    fontSize: 14,
    fontWeight: "600",
  },
});
