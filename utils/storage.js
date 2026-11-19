
import AsyncStorage from "@react-native-async-storage/async-storage";

// Save tasks
export const saveTasks = async (tasks) => {
  try {
    await AsyncStorage.setItem("tasks", JSON.stringify(tasks));
  } catch (error) {
    console.log("Save Error:", error);
  }
};

// Load tasks
export const loadTasks = async () => {
  try {
    const savedTasks = await AsyncStorage.getItem("tasks");

    if (savedTasks !== null) {
      return JSON.parse(savedTasks);
    }

    return null;
  } catch (error) {
    console.log("Load Error:", error);
    return null;
  }
};
