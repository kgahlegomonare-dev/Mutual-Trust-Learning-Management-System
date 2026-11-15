// useAnnouncements.js
import * as announcementService from "../../services/kgs-services/AnnouncementsService";
import { useState, useCallback } from "react";

export default function useAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await announcementService.getAnnouncements();

      console.log("Hook received:", data);

      setAnnouncements(Array.isArray(data) ? data : []);
      return true;
    } catch (err) {
      console.error("Announcement hook error:", err);
      console.error("Response:", err.response?.data);

      setError(
        err.response?.data?.message ||
          JSON.stringify(err.response?.data) ||
          "Failed to load announcements."
      );

      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const createAnnouncement = async (announcementData) => {
    try {
      setLoading(true);
      setError(null);

      await announcementService.createAnnouncement(announcementData);
      await loadAnnouncements();

      return true;
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Failed to create announcement.");

      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateAnnouncement = async (announcementId, announcementData) => {
    try {
      setLoading(true);
      setError(null);

      await announcementService.updateAnnouncement(
        announcementId,
        announcementData
      );
      await loadAnnouncements();

      return true;
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Failed to update announcement.");

      return false;
    } finally {
      setLoading(false);
    }
  };

const deleteAnnouncement = async (id) => {
    try {
        await announcementService.deleteAnnouncement(id);

        setAnnouncements((prev) =>
            prev.filter(
                (announcement) => announcement.id !== id
            )
        );

        return true;

    } catch (error) {
        console.error(
            "Failed to delete announcement:",
            error
        );

        return false;
    }
};

  return {
    announcements,
    loading,
    error,
    loadAnnouncements,
    refreshAnnouncements: loadAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  };
}