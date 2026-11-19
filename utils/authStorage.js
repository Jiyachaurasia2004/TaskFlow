import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "taskflow_auth_token";
const USER_KEY = "taskflow_user";

export const saveAuthData = async (token, user) => {
  try {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [USER_KEY, JSON.stringify(user)],
    ]);

    console.log("Authentication data saved successfully");
  } catch (error) {
    console.log("Auth Storage Error:", error.message);
    throw error;
  }
};

export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.log("Token Read Error:", error.message);
    return null;
  }
};

export const getSavedUser = async () => {
  try {
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.log("User Read Error:", error.message);
    return null;
  }
};

export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    console.log("Authentication data cleared");
  } catch (error) {
    console.log("Auth Clear Error:", error.message);
    throw error;
  }
};