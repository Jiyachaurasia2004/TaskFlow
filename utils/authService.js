import API from "./api";
import { saveAuthData } from "./authStorage";
import { getAuthToken, clearAuthData } from "./authStorage";
// Register API
export const registerUser = async (userData) => {
  try {
    const response = await API.post("/auth/register", userData);

    const { token, user } = response.data;

    await saveAuthData(token, user);

    return response.data;
  } catch (error) {
    console.log(
      "Register Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

// Login API
export const loginUser = async (email, password) => {
  try {
    const response = await API.post("/auth/login", {
      email,
      password,
    });

    const { token, user } = response.data;

    await saveAuthData(token, user);

    return response.data;
  } catch (error) {
    console.log(
      "Login Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

// Get Logged-in User
export const getCurrentUser = async () => {
  try {
    const response = await API.get("/auth/me");

    console.log("Current User:", response.data.user);

    return response.data;
  } catch (error) {
    console.log(
      "Get Current User Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

// Update Logged-in User Profile
export const updateProfile = async (profileData) => {
  try {
    const response = await API.put(
      "/auth/update-profile",
      profileData
    );

    const updatedUser = response.data.user;

    // Update saved user information
    const token = await getAuthToken();

    await saveAuthData(token, updatedUser);

    console.log("Profile Updated:", updatedUser);

    return response.data;
  } catch (error) {
    console.log(
      "Update Profile Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};
// Change User Password
export const changePassword = async (passwordData) => {
  try {
    const response = await API.put(
      "/auth/change-password",
      passwordData
    );

    console.log("Password Changed:", response.data.message);

    return response.data;
  } catch (error) {
    console.log(
      "Change Password Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};
// Check saved login session
export const checkAuthStatus = async () => {
  try {
    const token = await getAuthToken();

    // No saved token
    if (!token) {
      return {
        isAuthenticated: false,
        user: null,
      };
    }

    // Verify token with backend
    const response = await API.get("/auth/me");

    return {
      isAuthenticated: true,
      user: response.data.user,
    };
  } catch (error) {
    console.log(
      "Authentication Check Failed:",
      error.response?.data || error.message
    );

    await clearAuthData();

    return {
      isAuthenticated: false,
      user: null,
    };
  }
};
export const logoutUser = async () => {
  try {
    await clearAuthData();
    console.log("Logout Successful");
  } catch (error) {
    console.log("Logout Error:", error.message);
    throw error;
  }
};