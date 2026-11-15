import axios from "axios";

const dotnetApi = axios.create({
  baseURL: "http://localhost:7060/api",
});

dotnetApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Existing user identification mechanism
  const storedUser = localStorage.getItem("user");

  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);

      if (user?.user_id) {
        config.headers["X-User-Id"] = user.user_id;
      }
    } catch (error) {
      console.error("Failed to parse stored user:", error);
    }
  }

  return config;
});

export default dotnetApi;