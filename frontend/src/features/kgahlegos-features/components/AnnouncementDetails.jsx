import React from "react";

import {
  Paper,
  Typography,
  Box,
  Divider,
  Button,
  Stack,
} from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function AnnouncementDetails({
  announcement,
  canEdit,
  onEdit,
  onDelete,
}) {
  if (!announcement) {
    return (
      <Paper
        elevation={2}
        sx={{
          height: "75vh",
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="text.secondary">
          Select an announcement
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        height: "75vh",
        borderRadius: 3,
        p: 3,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Header: Title + Action Buttons in 1 Line */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography variant="h5" fontWeight={700} sx={{ wordBreak: "break-word" }}>
          {announcement.title}
        </Typography>

        {canEdit && (
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<EditIcon />}
              onClick={onEdit}
            >
              Edit
            </Button>

            <Button
              size="small"
              color="error"
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={onDelete}
            >
              Delete
            </Button>
          </Stack>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Main Content Area (Scrollable if message is long) */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", pr: 1 }}>
        <Typography
          sx={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
            color: "text.primary",
            mb: 3,
          }}
        >
          {announcement.message}
        </Typography>

        {/* Attachments Section */}
        {announcement.attachments?.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Attachments
            </Typography>

            <Stack spacing={1}>
              {announcement.attachments.map((file) => (
                <Button
                  key={file.id}
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  component="a"
                  href={`https://localhost:7060/${file.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    width: "fit-content",
                  }}
                >
                  {file.file_name}
                </Button>
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      {/* Bottom Footer: Sent / Published Timestamp */}
      <Divider sx={{ my: 2 }} />

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Published{" "}
          {announcement.created_at &&
            new Date(announcement.created_at).toLocaleString()}
        </Typography>
      </Box>
    </Paper>
  );
}