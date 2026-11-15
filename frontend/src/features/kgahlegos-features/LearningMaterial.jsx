import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import SearchIcon from "@mui/icons-material/Search";

import { useAuth } from "../../hooks/useAuth";

import LearningMaterialCard from "./components/LearningMaterialCard";
import LearningMaterialDialog from "./components/LearningMaterialDialog";

import useLearningMaterials from "../../hooks/kg-hooks/useLearningMaterial";
import useTeacherAssignments from "../../hooks/kg-hooks/useTeacherAssignment";
import useLearnerEnrollments from "../../hooks/kg-hooks/useLearnerEnrollment";

/* Distinct colors mapped sequentially to distinguish subject groups visually */
const SUBJECT_COLORS = [
  "#2563eb", // Blue
  "#7c3aed", // Purple
  "#059669", // Emerald
  "#d97706", // Amber
  "#dc2626", // Red
  "#0891b2", // Cyan
];

export default function LearningMaterials() {
  const { user } = useAuth();

  const role = (user?.role || "").toLowerCase();
  const isTeacher = role.includes("teacher");
  const isLearner = role.includes("learner");
  const userId = user?.user_id;

 const {
  materials = [],
  loading,
  error,
  loadMaterials,
  uploadMaterial,
  updateMaterial,
  deleteMaterial,
  recordMaterialOpen,
} = useLearningMaterials();

  const { assignments = [] } = useTeacherAssignments(
    isTeacher ? userId : null
  );

  const { enrollments = [] } = useLearnerEnrollments(
    isLearner ? userId : null
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [search, setSearch] = useState("");

  /* Set initial group */
  useEffect(() => {
    if (isTeacher && assignments.length && !selectedGroup) {
      setSelectedGroup(assignments[0]);
    }
  }, [assignments, isTeacher, selectedGroup]);

  useEffect(() => {
    if (isLearner && enrollments.length && !selectedGroup) {
      setSelectedGroup(enrollments[0]);
    }
  }, [enrollments, isLearner, selectedGroup]);

  /* Load materials across all assigned or enrolled classes */
  useEffect(() => {
    if (isTeacher && assignments.length) {
      assignments.forEach((a) => {
        const cId = a.classId || a.class_id;
        if (cId) loadMaterials(cId);
      });
    } else if (isLearner && enrollments.length) {
      enrollments.forEach((e) => {
        const cId = e.class_id || e.classId;
        if (cId) loadMaterials(cId);
      });
    }
  }, [assignments, enrollments, isTeacher, isLearner, loadMaterials]);

  /* Actions */
  const handleSave = async (formData) => {
    let success = false;

    if (editingMaterial) {
      success = await updateMaterial(formData);
    } else {
      success = await uploadMaterial(formData);
    }

    if (!success) return;

    if (selectedGroup) {
      const cId = isTeacher
        ? selectedGroup.classId || selectedGroup.class_id
        : selectedGroup.class_id || selectedGroup.classId;
      await loadMaterials(cId);
    }

    setDialogOpen(false);
    setEditingMaterial(null);
  };

  const handleDelete = async (materialId) => {
    const success = await deleteMaterial(materialId, userId);

    if (!success) return;

    if (selectedGroup) {
      const cId = isTeacher
        ? selectedGroup.classId || selectedGroup.class_id
        : selectedGroup.class_id || selectedGroup.classId;
      await loadMaterials(cId);
    }
  };

  /* Build groups for every assignment/enrollment and filter by search term */
  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();

    const rawGroups = isTeacher
      ? assignments.map((assignment) => {
          const subjectId = assignment.subjectId || assignment.subject_id;
          const classId = assignment.classId || assignment.class_id;
          const subjectName =
            assignment.subjectName || assignment.subject_name || "Subject";
          const className =
            assignment.className || assignment.class_name || "";
          const grade = assignment.grade || "";

          const groupMaterials = materials.filter(
            (material) =>
              String(material.subject_id) === String(subjectId) &&
              String(material.class_id) === String(classId) &&
              String(material.grade) === String(grade)
          );

          return {
            key: `${subjectId}-${classId}-${grade}`,
            title: subjectName,
            subtitle: `Grade ${grade}${className ? ` • ${className}` : ""}`,
            grade,
            className,
            classId,
            assignment,
            materials: groupMaterials,
          };
        })
      : enrollments.map((enrollment) => {
          const subjectId = enrollment.subject_id || enrollment.subjectId;
          const classId = enrollment.class_id || enrollment.classId;
          const subjectName =
            enrollment.subject_name || enrollment.subjectName || "Subject";
          const className =
            enrollment.class_name || enrollment.className || "";
          const grade = enrollment.grade || "";

          const groupMaterials = materials.filter(
            (material) =>
              String(material.subject_id) === String(subjectId) &&
              String(material.class_id) === String(classId) &&
              String(material.grade) === String(grade)
          );

          return {
            key: `${subjectId}-${classId}-${grade}`,
            title: subjectName,
            subtitle: `Grade ${grade}${className ? ` • ${className}` : ""}`,
            grade,
            className,
            classId,
            enrollment,
            materials: groupMaterials,
          };
        });

    if (!query) return rawGroups;

    /* Filter groups by subject name, grade, class name, or material title */
    return rawGroups
      .map((group) => {
        const matchesSubject = group.title.toLowerCase().includes(query);
        const matchesGrade =
          String(group.grade).toLowerCase().includes(query) ||
          `grade ${group.grade}`.toLowerCase().includes(query);
        const matchesClass = group.className.toLowerCase().includes(query);

        // If group metadata matches, keep all its materials; otherwise, filter materials by title
        if (matchesSubject || matchesGrade || matchesClass) {
          return group;
        }

        const filteredMaterials = group.materials.filter((material) =>
          (material.title || "").toLowerCase().includes(query)
        );

        return {
          ...group,
          materials: filteredMaterials,
        };
      })
      .filter((group) => {
        // Keep group if its metadata matches OR if it contains matching materials
        const matchesSubject = group.title.toLowerCase().includes(query);
        const matchesGrade =
          String(group.grade).toLowerCase().includes(query) ||
          `grade ${group.grade}`.toLowerCase().includes(query);
        const matchesClass = group.className.toLowerCase().includes(query);

        return (
          matchesSubject ||
          matchesGrade ||
          matchesClass ||
          group.materials.length > 0
        );
      });
  }, [assignments, enrollments, materials, isTeacher, search]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={0.5}>
        Learning Materials
      </Typography>

      <Typography color="text.secondary" mb={4}>
        {isTeacher
          ? "Upload and manage teaching resources."
          : "Browse learning resources by subject."}
      </Typography>

      <TextField
        fullWidth
        placeholder="Search subjects, grades, classes, or materials..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && (
        <Stack spacing={2.5}>
          {groups.length === 0 ? (
            <Alert severity="info" sx={{ py: 1, px: 2 }}>
              No matching learning materials, subjects, or classes found.
            </Alert>
          ) : (
            groups.map((group, index) => {
              const themeColor =
                SUBJECT_COLORS[index % SUBJECT_COLORS.length];

              return (
                <Accordion
                  key={group.key}
                  defaultExpanded
                  disableGutters
                  sx={{
                    borderRadius: 2,
                    overflow: "hidden",
                    borderLeft: `4px solid ${themeColor}`,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      <ExpandMoreIcon sx={{ color: "text.secondary" }} />
                    }
                    sx={{
                      backgroundColor: "grey.50",
                      px: 2.5,
                      py: 0.5,
                      minHeight: 52,
                      "& .MuiAccordionSummary-content": {
                        margin: "0 !important",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                      },
                    }}
                  >
                    {/* LEFT SECTION: Subject Name, Assignment Details, & File Count Chip */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      {/* Subject Name */}
                      <span
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 700,
                          color: "var(--mui-palette-text-primary, #0f172a)",
                          lineHeight: 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {group.title}
                      </span>

                      {/* Assignment Details (Grade/Class) */}
                      <span
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 700,
                          color: "var(--mui-palette-text-primary, #0f172a)",
                          lineHeight: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        • {group.subtitle}
                      </span>

                      {/* File Count Badge */}
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          flexShrink: 0,
                          marginLeft: "4px",
                        }}
                      >
                        <Chip
                          size="small"
                          label={`${group.materials.length} ${
                            group.materials.length === 1 ? "file" : "files"
                          }`}
                          sx={{
                            height: 22,
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            backgroundColor: `${themeColor}15`,
                            color: themeColor,
                            border: `1px solid ${themeColor}30`,
                            "& .MuiChip-label": {
                              px: 1,
                              py: 0,
                              lineHeight: "20px",
                            },
                          }}
                        />
                      </div>
                    </div>

                    {/* RIGHT SECTION: Upload Button */}
                    {isTeacher && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flexShrink: 0,
                          marginLeft: "16px",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="small"
                          variant="contained"
                          disableElevation
                          startIcon={
                            <CloudUploadOutlinedIcon sx={{ fontSize: 16 }} />
                          }
                          onClick={() => {
                            setSelectedGroup(group.assignment);
                            setEditingMaterial(null);
                            setDialogOpen(true);
                          }}
                          sx={{
                            backgroundColor: themeColor,
                            py: 0.5,
                            px: 1.75,
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            textTransform: "none",
                            borderRadius: 1.5,
                            lineHeight: 1,
                            "&:hover": {
                              backgroundColor: themeColor,
                              filter: "brightness(0.95)",
                            },
                          }}
                        >
                          Upload
                        </Button>
                      </div>
                    )}
                  </AccordionSummary>

                  <AccordionDetails sx={{ p: 2, backgroundColor: "#fff" }}>
                    {group.materials.length === 0 ? (
                      <Alert severity="info" sx={{ py: 0.5, px: 2 }}>
                        No learning materials uploaded yet.
                      </Alert>
                    ) : (
                      <Stack spacing={1}>
                        {group.materials.map((material) => (

                          <LearningMaterialCard
                            key={material.material_id}
                            material={material}
                            isOwner={
                              isTeacher && material.teacher_id === userId
                            }
                            onOpen={recordMaterialOpen}
                            accentColor={themeColor}
                            onEdit={(m) => {
                              setSelectedGroup(group.assignment);
                              setEditingMaterial(m);
                              setDialogOpen(true);
                            }}
                            onDelete={(id) => handleDelete(id)}
                          />

                        ))}
                      </Stack>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })
          )}
        </Stack>
      )}

      {isTeacher && (
        <LearningMaterialDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditingMaterial(null);
          }}
          material={editingMaterial}
          teacherId={userId}
          defaultAssignment={selectedGroup}
          onSave={handleSave}
        />
      )}
    </Box>
  );
}