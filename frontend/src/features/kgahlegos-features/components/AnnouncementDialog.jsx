// AnnouncementDialog.jsx
import React, { useEffect, useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  Paper,
  Box,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
} from "@mui/material";

import CampaignIcon from "@mui/icons-material/Campaign";
import ApartmentIcon from "@mui/icons-material/Apartment";
import GroupsIcon from "@mui/icons-material/Groups";
import FaceIcon from "@mui/icons-material/Face";
import PersonOutlineIcon from "@mui/icons-material/Person";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";

export default function AnnouncementDialog({
  open,
  onClose,
  onSave,
  announcement = null,
  user,
  assignments = [],
}) {
  const role = (user?.role || "").toLowerCase();

  const isAdmin = role.includes("admin");
  const isManager = role.includes("manager") || role.includes("center manager");
  const isTeacher = role.includes("teacher");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [audience, setAudience] = useState("");
  const [targetValue, setTargetValue] = useState("");

  const [attachment, setAttachment] = useState(null);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title || "");
      setMessage(announcement.message || "");
      setExpiresAt(
        announcement.expires_at ? announcement.expires_at.substring(0, 10) : "",
      );
      setAudience("");
      setTargetValue("");
      setAttachment(null);
    } else {
      setTitle("");
      setMessage("");
      setExpiresAt("");
      setAudience("");
      setTargetValue("");
      setAttachment(null);
    }

    setValidationError("");
  }, [announcement, open]);

  // Handle audience selection change
  const handleAudienceChange = (e, value) => {
    if (value === null) return;

    setAudience(value);

    if (isTeacher) {
      setTargetValue("");
    }
  };

  const handlePublish = () => {
    if (!title.trim()) {
      setValidationError("Please enter a title.");
      return;
    }

    if (!message.trim()) {
      setValidationError("Please enter a message.");
      return;
    }

    if (!isAdmin) {
      if (audience === "") {
        setValidationError("Please choose an audience.");
        return;
      }

      if (isTeacher && Number(audience) === 7 && targetValue === "") {
        setValidationError("Please choose a teaching assignment.");
        return;
      }
    }

    let targets = [];

    if (isAdmin) {
      targets = [
        {
          targetType: 0,
          targetValue: 0,
        },
      ];
    } else if (isManager) {
      // Backend will use the manager's centre_id
      targets = [
        {
          targetType: Number(audience),
          targetValue: Number(user.center_id),
        },
      ];
    } else if (isTeacher) {

  const selectedAssignment = assignments.find(
    (assignment) =>
      assignment.assignmentId === Number(targetValue)
  );


  if (!selectedAssignment) {
    setValidationError("Invalid teaching assignment selected.");
    return;
  }


  targets = [
    {
      targetType: Number(audience),
      targetValue: selectedAssignment.assignmentId,
    },
  ];
}
    const formData = new FormData();

    formData.append("Title", title.trim());
    formData.append("Message", message.trim());

    if (expiresAt) {
      formData.append("ExpiresAt", new Date(expiresAt).toISOString());
    }

    formData.append("TargetsJson", JSON.stringify(targets));

    if (attachment) {
      formData.append("Attachment", attachment);
    }
   

    //ERROR LOGGING
    console.log("TARGETS:", targets);
    console.log("FINAL ANNOUNCEMENT TARGET:", JSON.stringify(targets));
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CampaignIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" fontWeight={700}>
            {announcement ? "Edit Announcement" : "Broadcast Announcement"}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 1, pb: 2 }}>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {validationError && (
            <Alert severity="error" onClose={() => setValidationError("")}>
              {validationError}
            </Alert>
          )}

          <Box>
            <Typography
              variant="caption"
              sx={{
                mb: 0.75,
                fontWeight: 600,
                display: "block",
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Announcement Title
            </Typography>

            <TextField
              fullWidth
              size="small"
              placeholder="e.g. End of Term Examination Schedule"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Box>

          <Box>
            <Typography
              variant="caption"
              sx={{
                mb: 0.75,
                fontWeight: 600,
                display: "block",
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Announcement Message
            </Typography>

            <TextField
              fullWidth
              size="small"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Box>

          <Box>
            <Typography
              variant="caption"
              sx={{
                mb: 0.75,
                fontWeight: 600,
                display: "block",
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Expiry Date
            </Typography>

            <TextField
              fullWidth
              size="small"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              inputProps={{
                min: new Date().toISOString().split("T")[0],
              }}
            />
          </Box>

          <Divider />

          {!isAdmin && (
            <>
              <Typography variant="subtitle2" fontWeight={700}>
                Target Audience
              </Typography>

              <ToggleButtonGroup
                exclusive
                fullWidth
                value={audience}
                onChange={handleAudienceChange}
                sx={{
                  display: "grid",
                  gridTemplateColumns: isManager ? "repeat(3, 1fr)" : "1fr",
                  gap: 1,

                  "& .MuiToggleButton-root": {
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    py: 1,
                    justifyContent: "center",
                  },
                }}
              >
                {isManager && (
                  <ToggleButton value={1}>
                    <ApartmentIcon sx={{ mr: 1, fontSize: 20 }} />
                    Entire Centre
                  </ToggleButton>
                )}

                {isManager && (
                  <ToggleButton value={6}>
                    <FaceIcon sx={{ mr: 1, fontSize: 20 }} />
                    Centre Learners
                  </ToggleButton>
                )}

                {isManager && (
                  <ToggleButton value={5}>
                    <PersonOutlineIcon sx={{ mr: 1, fontSize: 20 }} />
                    Centre Teachers
                  </ToggleButton>
                )}

                {isTeacher && (
                  <ToggleButton value={7}>
                    <GroupsIcon sx={{ mr: 1, fontSize: 20 }} />
                    My Classes
                  </ToggleButton>
                )}
              </ToggleButtonGroup>

              {/* Teaching Assignment Selection (Only shown for Teachers) */}
              {isTeacher && Number(audience) === 7 && (
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      mb: 0.75,
                      fontWeight: 600,
                      display: "block",
                      color: "text.secondary",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Select Teaching Assignment
                  </Typography>

                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={targetValue}
                    onChange={(e) => {
                      console.log("SELECTED ASSIGNMENT:", e.target.value);

                      setTargetValue(e.target.value);
                    }}
                  >
                    {assignments.map((assignment) => (
                      <MenuItem
                        key={assignment.assignmentId}
                        value={assignment.assignmentId}
                        onClick={() =>
                          console.log(
                            "SELECTED ASSIGNMENT:",
                            assignment.assignmentId,
                            assignment.classId,
                          )
                        }
                      >
                        Grade {assignment.grade} - {assignment.className} -{" "}
                        {assignment.subjectName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              )}

              <Divider />
            </>
          )}

          <Box>
            <Typography
              variant="caption"
              sx={{
                mb: 0.75,
                fontWeight: 600,
                display: "block",
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Attachments
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 2.5,
                borderStyle: "dashed",
                borderWidth: 1.5,
                borderColor: "divider",
                bgcolor: "grey.50",
                textAlign: "center",
                cursor: "pointer",
                display: "block",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: (theme) => theme.palette.primary.main + "08",
                },
              }}
              component="label"
            >
              <UploadFileOutlinedIcon
                color="action"
                sx={{
                  fontSize: 38,
                  mb: 1,
                }}
              />

              <Typography variant="subtitle2" fontWeight={600}>
                Click to upload attachments
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                PDF, DOCX, Images, Videos, or ZIP files
              </Typography>

              <input
                hidden
                type="file"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
              />
            </Paper>

            {attachment && (
              <Stack spacing={1} sx={{ mt: 1.5 }}>
                <Alert severity="success">{attachment.name}</Alert>
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            px: 2.5,
            borderRadius: 1.5,
            borderColor: "grey.300",
            color: "text.primary",
            "&:hover": {
              borderColor: "grey.400",
              bgcolor: "grey.100",
            },
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          disableElevation
          onClick={handlePublish}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            px: 2.5,
            borderRadius: 1.5,
          }}
        >
          {announcement ? "Save Changes" : "Broadcast"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
