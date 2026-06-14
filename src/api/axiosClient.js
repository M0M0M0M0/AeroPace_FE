import axios from "axios";
import { getOrCreateSessionId } from "../utils/session";

const axiosClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/v1`,
});

axiosClient.interceptors.request.use((config) => {
  const sessionId = getOrCreateSessionId();
  if (sessionId) {
    config.headers["X-Session-Id"] = sessionId;
  }
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");

      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;