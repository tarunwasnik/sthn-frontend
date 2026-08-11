// frontend/src/api/axios.ts

import axios from "axios";

import {
  ACCESS_TOKEN_KEY,
  SESSION_EXPIRED_EVENT,
  clearAccessToken,
} from "../auth/session";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + "/api",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAccessToken();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  }
);

export default api;
