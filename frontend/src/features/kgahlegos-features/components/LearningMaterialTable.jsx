import React from "react";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Chip,
  Tooltip,
  Stack,
} from "@mui/material";

import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";

export default function LearningMaterialTable({
  materials = [],
  isTeacher,
  onEdit,
  onDelete,
}) {
  const formatSize = (bytes) => {
    if (!bytes) return "-";

    if (bytes < 1024)
      return `${bytes} B`;

    if (bytes < 1024 * 1024)
      return `${(bytes / 1024).toFixed(1)} KB`;

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
      <Table>

        <TableHead>

          <TableRow>

            <TableCell>Title</TableCell>

            <TableCell>Subject</TableCell>

            <TableCell>Grade</TableCell>

            <TableCell>Class</TableCell>

            <TableCell>File</TableCell>

            <TableCell>Size</TableCell>

            <TableCell>Uploaded</TableCell>

            <TableCell align="right">
              Actions
            </TableCell>

          </TableRow>

        </TableHead>

        <TableBody>

          {materials.length === 0 && (

            <TableRow>

              <TableCell colSpan={8} align="center">

                <Typography
                  color="text.secondary"
                  py={4}
                >
                  No learning material found.
                </Typography>

              </TableCell>

            </TableRow>

          )}

          {materials.map((material) => (

            <TableRow key={material.material_id} hover>

              <TableCell>

                <Typography fontWeight={600}>
                  {material.title}
                </Typography>

              </TableCell>

              <TableCell>

                {material.subject_name}

              </TableCell>

              <TableCell>

                <Chip
                  size="small"
                  label={`Grade ${material.grade}`}
                />

              </TableCell>

              <TableCell>

                {material.class_name}

              </TableCell>

              <TableCell>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >

                  <InsertDriveFileRoundedIcon
                    color="primary"
                    fontSize="small"
                  />

                  <Typography
                    variant="body2"
                  >
                    {material.file_name}
                  </Typography>

                </Stack>

              </TableCell>

              <TableCell>

                {formatSize(material.file_size)}

              </TableCell>

              <TableCell>

                {new Date(
                  material.uploaded_at
                ).toLocaleDateString()}

              </TableCell>

              <TableCell align="right">

                <Tooltip title="Download">

                  <IconButton
                    component="a"
                    href={`http://localhost:5000/${material.file_path}`}
                    target="_blank"
                  >

                    <DownloadRoundedIcon />

                  </IconButton>

                </Tooltip>

                {isTeacher && (

                  <>

                    <Tooltip title="Edit">

                      <IconButton
                        onClick={() => onEdit(material)}
                      >

                        <EditRoundedIcon />

                      </IconButton>

                    </Tooltip>

                    <Tooltip title="Delete">

                      <IconButton
                        color="error"
                        onClick={() =>
                          onDelete(material)
                        }
                      >

                        <DeleteRoundedIcon />

                      </IconButton>

                    </Tooltip>

                  </>

                )}

              </TableCell>

            </TableRow>

          ))}

        </TableBody>

      </Table>
    </TableContainer>
  );
}