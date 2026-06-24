// utils/api.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// New backend (Laravel) on edeenapp.co.uk. The web root points at the Laravel
// `public/` folder, so the API lives under `/api/`. HTTPS is enabled on the
// domain (the server 301-redirects plain http -> https), which is also required
// by iOS App Transport Security.
const api = axios.create({
  baseURL: "https://edeenapp.co.uk/api/",
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      // React Native uses AsyncStorage instead of localStorage
      const token = await AsyncStorage.getItem("access_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      console.log("Token Fetch Error:", error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const request = async ({
  url,
  method = "GET",
  data = null,
  baseURL = null,
  headers = {},
}) => {
  try {
    const config = {
      url,
      method,
      baseURL: baseURL || api.defaults.baseURL,
      headers: {
        ...headers,
      },
    };

    if (data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    }

    if (method.toUpperCase() === "GET") {
      config.params = data;
    } else {
      config.data = data;
    }

    const response = await api(config);
    return response.data;
  } catch (error) {
    console.log("API Error:", error?.response?.data || error.message);
    throw error;
  }
};

export default api;
