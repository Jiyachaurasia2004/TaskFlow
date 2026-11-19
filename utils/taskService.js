
import API from "./api";

// Create a new task
export const createTask = async (taskData) => {
  try {
    const response = await API.post("/tasks", taskData);
    return response.data;
  } catch (error) {
    console.log("Create Task Error:", error.response?.data || error.message);
    throw error;
  }
};

// Get all tasks of logged-in user
export const getTasks = async (filters = {}) => {
  try {
    const response = await API.get("/tasks", {
      params: filters,
    });

    return response.data;
  } catch (error) {
    console.log("Get Tasks Error:", error.response?.data || error.message);
    throw error;
  }
};




export const updateTask = async (taskId, taskData) => {
  try {
    const response = await API.put(`/tasks/${taskId}`, taskData);

    console.log("Update API Status:", response.status);
    console.log("Update API Data:", response.data);

    return response.data;
  } catch (error) {
    console.log("Update Task Error:", error.response?.data || error.message);
    throw error;
  }
};

// Delete a task
export const deleteTask = async (taskId) => {
  try {
    const response = await API.delete(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.log("Delete Task Error:", error.response?.data || error.message);
    throw error;
  }
};

// Fetch Task Statistics from MongoDB
const fetchTaskStats = async () => {
  try {
    const response = await getTaskStats();

    console.log("Complete Statistics Response:", response);
    console.log("Overdue Tasks Count:", response.stats.overdueTasks);

    setTaskStats({
      totalTasks: response.stats.totalTasks ?? 0,
      completedTasks: response.stats.completedTasks ?? 0,
      pendingTasks: response.stats.pendingTasks ?? 0,
      overdueTasks: response.stats.overdueTasks ?? 0,
    });

  } catch (error) {
    console.log(
      "Fetch Task Stats Error:",
      error.response?.data || error.message
    );
  }
};
// Get Task Statistics from MongoDB
export const getTaskStats = async () => {
  try {
    const response = await API.get("/tasks/stats");
    return response.data;
  } catch (error) {
    console.log(
      "Get Task Stats Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};