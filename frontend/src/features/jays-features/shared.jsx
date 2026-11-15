import React from 'react';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import BookIcon from '@mui/icons-material/MenuBook';

// Status helper for Teacher views (expects roster row)
export function rosterStatus(row) {
  if (!row?.submission_id) return 'not_started';
  if (row.status === 'not_submitted') return 'in_progress';
  return row.status; // 'submitted' | 'graded'
}

// Status helper for Learner/Student views (expects assessment item with submission info)
export function assessmentStatusFor(a) {
  if (!a?.submission_id) return 'not_started';
  if (a.submission_status === 'not_submitted') return 'in_progress';
  return a.submission_status; // 'submitted' | 'graded'
}

// Universal MUI Status Badge (Handles both Submission & Assessment Lifecycle States)
export function StatusBadge({ status }) {
  const config = {
    // Submission Lifecycle States
    not_started: { label: 'Not started', color: 'default' },
    in_progress: { label: 'In progress', color: 'info' },
    submitted: { label: 'Pending grading', color: 'warning' },
    graded: { label: 'Completed', color: 'success' },

    // Assessment Lifecycle States (Teacher side)
    draft: { label: 'Draft', color: 'default' },
    published: { label: 'Published', color: 'success' },
    closed: { label: 'Closed', color: 'error' },
  };

  const current = config[status] || { label: status || 'Unknown', color: 'default' };

  return (
    <Chip
      label={current.label}
      color={current.color}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 600, fontSize: '0.7rem' }}
    />
  );
}

// Universal MUI Subject Pills
export function SubjectPills({ subjects = [], selected, onSelect }) {
  if (!subjects.length) return null;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 1 }}>
      {subjects.map((s) => {
        const isSelected = String(selected) === String(s.id);
        return (
          <Chip
            key={s.id}
            icon={<BookIcon fontSize="small" />}
            label={s.name || s.subject_name}
            clickable
            color={isSelected ? 'primary' : 'default'}
            onClick={() => onSelect(isSelected ? null : s.id)}
            variant={isSelected ? 'filled' : 'outlined'}
            sx={{ fontWeight: isSelected ? 600 : 400 }}
          />
        );
      })}
    </Box>
  );
}