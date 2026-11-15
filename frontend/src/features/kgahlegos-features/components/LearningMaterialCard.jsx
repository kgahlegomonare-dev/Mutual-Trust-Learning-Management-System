import React from "react";
import { Card, Chip, Button, IconButton, Tooltip } from "@mui/material";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

export default function LearningMaterialCard({
  material,
  isOwner = false,
  onEdit,
  onDelete,
  onOpen,
  accentColor = "#2563eb",
}) 

{
const handleOpen = async () => {
  console.log("OPEN CLICKED");
  console.log("Material ID:", material.material_id);
  console.log("onOpen function:", onOpen);

  try {
    if (onOpen) {
      console.log("Calling onOpen...");

      const result = await onOpen(material.material_id);

      console.log("onOpen result:", result);
    } else {
      console.error("onOpen is undefined!");
    }
  } catch (err) {
    console.error("onOpen FAILED:", err);
  }

  console.log("Opening file:", material.file_path);

  window.open(
    `http://localhost:7060/${material.file_path}`,
    "_blank",
    "noopener,noreferrer"
  );
};

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        backgroundColor: "background.paper",
        boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.04)",
        transition: "all 0.2s ease-in-out",
        px: 2,
        py: 1.25,
        "&:hover": {
          boxShadow: `0px 4px 12px ${accentColor}1A`,
          transform: "translateY(-1px)",
        },
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          gap: "12px",
        }}
      >
        {/* Left Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            minWidth: 0,
            flex: 1,
          }}
        >
          {/* File Icon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <DescriptionOutlinedIcon
              sx={{
                fontSize: 20,
                color: accentColor,
                display: "block",
              }}
            />
          </div>

          {/* Text / Metadata */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              minWidth: 0,
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {/* Title */}
            <span
              title={material.title}
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--mui-palette-text-primary, #1e293b)",
                lineHeight: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "inline-block",
              }}
            >
              {material.title}
            </span>

            {/* File Name */}
            {material.file_name && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "var(--mui-palette-text-secondary, #64748b)",
                  lineHeight: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "inline-block",
                }}
              >
                ({material.file_name})
              </span>
            )}

            {/* File Size */}
            {material.file_size && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${(material.file_size / 1024 / 1024).toFixed(1)} MB`}
                  sx={{
                    height: 20,
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    borderColor: "grey.300",
                    backgroundColor: "grey.50",
                    color: "text.secondary",
                    "& .MuiChip-label": {
                      px: 0.75,
                      py: 0,
                      lineHeight: "20px",
                    },
                  }}
                />
              </div>
            )}

            {/* Uploaded Date */}
            {material.uploaded_at && (
              <span
                style={{
                  fontSize: "0.725rem",
                  color: "var(--mui-palette-text-disabled, #94a3b8)",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  display: "inline-block",
                }}
              >
                • {new Date(material.uploaded_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            flexShrink: 0,
          }}
        >
          {/* Open */}
          <Button
            size="small"
            variant="text"
            endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
            onClick={handleOpen}
            sx={{
              textTransform: "none",
              py: 0.25,
              px: 1.25,
              minWidth: "auto",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: accentColor,
              borderRadius: 1.5,
              lineHeight: 1,
              "&:hover": {
                backgroundColor: `${accentColor}12`,
              },
            }}
          >
            Open
          </Button>

          {/* Teacher controls */}
          {isOwner && (
            <>
              <Tooltip title="Edit material">
                <IconButton
                  size="small"
                  onClick={() => onEdit?.(material)}
                  sx={{
                    color: "text.secondary",
                    p: 0.5,
                    "&:hover": {
                      color: "primary.main",
                    },
                  }}
                >
                  <EditOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete material">
                <IconButton
                  size="small"
                  onClick={() => onDelete?.(material.material_id)}
                  sx={{
                    color: "text.secondary",
                    p: 0.5,
                    "&:hover": {
                      color: "error.main",
                    },
                  }}
                >
                  <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
