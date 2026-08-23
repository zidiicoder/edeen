// utils/api.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// New backend (Laravel) on api.edeenapp.co.uk subdomain (dedicated API endpoint
// with JavaScript challenge disabled for mobile app compatibility). The web root
// points at the Laravel `public/` folder, so the API lives under `/api/`. HTTPS
// is enabled on the domain (the server 301-redirects plain http -> https), which
// is also required by iOS App Transport Security.
const api = axios.create({
  baseURL: "https://api.edeenapp.co.uk/api/",
  headers: {
    Accept: "application/json",
    // Add browser-like User-Agent to bypass hosting security
    "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
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

    console.log('📡 API Request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
    });

    if (data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    }

    if (method.toUpperCase() === "GET") {
      config.params = data;
    } else {
      config.data = data;
    }

    const response = await api(config);
    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response Data:', response.data);
    return response.data;
  } catch (error) {
    console.log("❌ API Error:", error?.response?.data || error.message);
    console.log("❌ API Error Status:", error?.response?.status);
    console.log("❌ API Error Full:", error);
    throw error;
  }
};

export default api;
