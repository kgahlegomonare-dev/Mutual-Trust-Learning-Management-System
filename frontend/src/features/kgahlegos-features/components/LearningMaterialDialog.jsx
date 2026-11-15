import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  TextField,
  Paper,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";

import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

export default function LearningMaterialDialog({
  open,
  onClose,
  onSave,
  material = null,
  teacherId,
  defaultAssignment = null,
}) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (material) {
      setTitle(material.title || "");
      setFile(null);
    } else {
      setTitle("");
      setFile(null);
    }

    setError("");
  }, [material, open]);

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setError("");

    if (!title.trim()) {
      const nameWithoutExtension = selectedFile.name
        .split(".")
        .slice(0, -1)
        .join(".");
      setTitle(nameWithoutExtension || selectedFile.name);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }

    if (!defaultAssignment) {
      setError("No teaching assignment selected.");
      return;
    }

    if (!material && !file) {
      setError("Please select or drop a file to upload.");
      return;
    }

    const formData = new FormData();

    if (material) {
      formData.append("MaterialId", material.material_id);
    }

    formData.append("Title", title.trim());
    formData.append("TeacherId", teacherId);
    formData.append("SubjectId", defaultAssignment.subjectId);
    formData.append("ClassId", defaultAssignment.classId);
    formData.append("Grade", defaultAssignment.grade);

    if (file) {
      formData.append("File", file);
    }

    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <SchoolRoundedIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" fontWeight={700}>
            {material ? "Edit Learning Material" : "Upload Learning Material"}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 1, pb: 2 }}>
        <Stack spacing={2.5} mt={1}>
          {error && (
            <Alert severity="error" onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {/* Processed Assignment Display */}
          {defaultAssignment && (
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
                Target Class & Subject
              </Typography>

              <Chip
                icon={<SchoolRoundedIcon sx={{ fontSize: "1.1rem !important" }} />}
                label={`${defaultAssignment.subjectName} • Grade ${defaultAssignment.grade} (${defaultAssignment.className})`}
                color="primary"
                variant="outlined"
                sx={{
                  fontWeight: 600,
                  borderRadius: 2,
                  py: 0.5,
                  backgroundColor: (theme) => theme.palette.primary.main + "0A",
                }}
              />
            </Box>
          )}

          {/* Title */}
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
              Material Title
            </Typography>

            <TextField
              fullWidth
              size="small"
              placeholder="e.g. Chapter 3 Practice Problems"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Box>

          {/* File Upload Zone */}
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
              File Attachment
            </Typography>

            {/* Drop Area */}
            <Paper
              component="label"
              variant="outlined"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                p: 3,
                borderRadius: 2.5,
                borderStyle: "dashed",
                borderWidth: isDragging ? 2 : 1.5,
                borderColor: isDragging ? "primary.main" : "divider",
                bgcolor: isDragging
                  ? (theme) => theme.palette.primary.main + "0D"
                  : "grey.50",
                textAlign: "center",
                cursor: "pointer",
                display: "block",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: (theme) => theme.palette.primary.main + "08",
                },
              }}
            >
              <CloudUploadRoundedIcon
                sx={{
                  fontSize: 42,
                  color: isDragging ? "primary.main" : "text.secondary",
                  mb: 1,
                  transition: "color 0.2s ease-in-out",
                }}
              />

              <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                {isDragging
                  ? "Drop your file here..."
                  : "Click or drag file to this area"}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                Supports PDF, DOCX, PPTX, XLSX, ZIP, Images, or Videos
              </Typography>

              <input
                hidden
                type="file"
                accept="*/*"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
            </Paper>

            {/* Selected File Card */}
            {file && (
              <Paper
                variant="outlined"
                sx={{
                  mt: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "success.50",
                  borderColor: "success.200",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                  <InsertDriveFileRoundedIcon color="success" />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      noWrap
                      color="text.primary"
                    >
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.size)}
                    </Typography>
                  </Box>
                </Stack>

                <Tooltip title="Remove file">
                  <IconButton size="small" onClick={() => setFile(null)}>
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Paper>
            )}

            {/* Existing File Notice (Editing Mode) */}
            {material && !file && (
              <Paper
                variant="outlined"
                sx={{
                  mt: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "grey.50",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <CheckCircleRoundedIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary" noWrap>
                  Current file: <strong>{material.file_name}</strong>
                </Typography>
              </Paper>
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
          onClick={handleSubmit}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            px: 2.5,
            borderRadius: 1.5,
          }}
        >
          {material ? "Save Changes" : "Upload Material"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}