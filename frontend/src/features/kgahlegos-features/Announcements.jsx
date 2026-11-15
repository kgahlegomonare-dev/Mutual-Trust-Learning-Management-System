import React, { useEffect, useState } from "react";

import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";

import CampaignIcon from "@mui/icons-material/Campaign";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AttachFileIcon from "@mui/icons-material/AttachFile";

import { useAuth } from "../../hooks/useAuth";

import useAnnouncements from "../../hooks/kg-hooks/useAnnouncements";
import useTeacherAssignments from "../../hooks/kg-hooks/useTeacherAssignment";

import AnnouncementDialog from "./components/AnnouncementDialog";

export default function Announcements() {
  const { user } = useAuth();

  const role = (user?.role || "").toLowerCase();

  const isAdmin = role.includes("admin");

  const isManager =
    (role.includes("manager") || role.includes("center manager")) && !isAdmin;

  const isTeacher = role.includes("teacher");

  const canPublish = isAdmin || isManager || isTeacher;

  // Dynamic subtitle based on role
  const getSubtitle = () => {
    if (isAdmin) {
      return "Broadcast and manage important updates, notices to all members in the system.";
    }
    if (isManager) {
      return "Broadcast and manage important updates, notices to all members in your center.";
    }
    if (isTeacher) {
      return "Broadcast and manage important updates, notices to all learners enrolled in your subjects.";
    }
    return "View important updates and notices.";
  };

  const {
    announcements,
    loading,
    error,
    loadAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  } = useAnnouncements();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  const { assignments: teacherAssignments, loading: assignmentsLoading } =
    useTeacherAssignments(isTeacher ? user?.user_id : null);

  console.log("ASSIGNMENTS:", teacherAssignments);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setDialogOpen(true);
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAnnouncement(null);
  };

  const handleSave = async (payload) => {
    let success;

    if (editingAnnouncement) {
      success = await updateAnnouncement(editingAnnouncement.id, payload);
    } else {
      success = await createAnnouncement(payload);
    }

    if (success) {
      handleCloseDialog();
    }
  };

  const handleDelete = async (announcementId) => {
    if (!window.confirm("Delete this announcement?")) {
      return;
    }

    await deleteAnnouncement(announcementId);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Announcements
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {getSubtitle()}
          </Typography>
        </Box>

        {canPublish && (
          <Button
            variant="contained"
            size="small"
            startIcon={<CampaignIcon />}
            onClick={handleCreate}
          >
            Broadcast Notice
          </Button>
        )}
      </Box>

      {loading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 4,
          }}
        >
          <CircularProgress size={30} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading &&
        Array.isArray(announcements) &&
        announcements.length === 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography align="center" variant="body2">
              No announcements available.
            </Typography>
          </Paper>
        )}

      <Stack spacing={1.5}>
        {(Array.isArray(announcements) ? announcements : []).map(
          (announcement) => (
            <Paper
              key={announcement.id}
              elevation={1}
              sx={{
                p: 1.5,
                borderRadius: 2,
              }}
            >
              {/* Compact Header */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 1,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <CampaignOutlinedIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
                    {announcement.title}
                  </Typography>
                </Stack>

                {announcement.sender_id === user?.user_id && (
                  <Stack direction="row" spacing={0.5}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                      onClick={() => handleEdit(announcement)}
                      sx={{ py: 0.2, px: 1, minWidth: 0, fontSize: "0.75rem" }}
                    >
                      Edit
                    </Button>

                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
                      onClick={() => handleDelete(announcement.id)}
                      sx={{ py: 0.2, px: 1, minWidth: 0, fontSize: "0.75rem" }}
                    >
                      Delete
                    </Button>
                  </Stack>
                )}
              </Box>

              {/* Compact Blue Message Box */}
              <Paper
                variant="outlined"
                sx={{
                  p: 1.25,
                  mb: 1,
                  maxHeight: 120,
                  overflowY: "auto",
                  borderRadius: 1.5,
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(2, 136, 209, 0.12)"
                      : "#f0f7ff",
                  borderColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(2, 136, 209, 0.3)"
                      : "#bfe0ff",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.4,
                    color: "text.primary",
                    fontSize: "0.875rem",
                  }}
                >
                  {announcement.message}
                </Typography>
              </Paper>

              {/* Attachments Section with Paper Clip Icon */}
              {announcement.attachments?.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
                    <AttachFileIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                    <Typography variant="caption" fontWeight={800}>
                      Attachments
                    </Typography>
                  </Stack>

                  <Stack spacing={0.5}>
                    {announcement.attachments.map((file) => (
                      <a
                        key={file.id}
                        href={`https://localhost:7060/${file.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: "none" }}
                      >
                        <Paper
                          variant="outlined"
                          sx={{
                            px: 1,
                            py: 0.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            transition: "0.2s",
                            "&:hover": {
                              bgcolor: "action.hover",
                            },
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <DownloadIcon color="primary" sx={{ fontSize: 16 }} />
                            <Typography variant="caption" fontWeight={500}>
                              {file.file_name}
                            </Typography>
                          </Stack>

                          <Button
                            variant="contained"
                            size="small"
                            sx={{ py: 0.1, px: 1, fontSize: "0.7rem", minWidth: 0 }}
                          >
                            Open
                          </Button>
                        </Paper>
                      </a>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Compact Footer */}
              <Box
                sx={{
                  pt: 0.75,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                  Posted on{" "}
                  {new Date(announcement.created_at).toLocaleString()}
                </Typography>
              </Box>
            </Paper>
          )
        )}
      </Stack>

      <AnnouncementDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSave}
        announcement={editingAnnouncement}
        user={user}
        assignments={teacherAssignments}
      />
    </Box>
  );
}