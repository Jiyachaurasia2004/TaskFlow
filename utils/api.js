import axios from "axios";
import { getAuthToken } from "./authStorage";

const API = axios.create({
  baseURL: "http://10.64.31.52:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Automatically attach JWT token
API.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const testBackendConnection = async () => {
  try {
    const response = await axios.get(
      "http://10.64.31.52:5000/"
    );

    console.log("Backend Connected:", response.data);

    return response.data;
  } catch (error) {
    console.log(
      "Backend Connection Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

export default API;