import axios from "axios";
import { getOrCreateSessionId } from "../utils/session";

const axiosClient = axios.create({
  baseURL: "http://localhost:8080/api/v1",
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

export default axiosClient;