// AnnouncementService.js
import api from "../../api/dotnetAxios";

const getUserHeaders = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return {
    "X-User-Id": user.user_id ?? "",
    "X-User-Role": user.role ?? "",
    "X-Center-Id": user.center_id ?? "",
  };
};

export const createAnnouncement = async (formData) => {
  const response = await api.post("/Announcement", formData, {
    headers: {
      ...getUserHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const updateAnnouncement = async (id, formData) => {
  const response = await api.put(`/Announcement/${id}`, formData, {
    headers: {
      ...getUserHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const deleteAnnouncement = async (id) => {
  const response = await api.delete(`/Announcement/${id}`, {
    headers: getUserHeaders(),
  });

  return response.data;
};

export const getAnnouncements = async () => {
  try {
    const response = await api.get("/Announcement", {
      headers: getUserHeaders(),
    });

    console.log("Status:", response.status);
    console.log("Data:", response.data);

    return response.data;
  } catch (err) {
    console.log("========== API ERROR ==========");
    console.log(err);
    console.log(err.response);
    console.log(err.response?.status);
    console.log(err.response?.data);

    throw err;
  }
};