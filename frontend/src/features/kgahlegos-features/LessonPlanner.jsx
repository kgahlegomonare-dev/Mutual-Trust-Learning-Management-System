import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useAuth } from '../../hooks/useAuth';

export default function LessonPlanner() {
  const { authUser } = useAuth();
  const userRole = authUser?.user_role?.toLowerCase() || 'learner';
  const isAuthorizedAuthor = ['admin', 'manager', 'teacher'].includes(userRole);

  return (
    <Box sx={{ p: 1, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Lesson Planner</Typography>
          <Typography variant="body2" color="text.secondary">
            {isAuthorizedAuthor 
              ? 'Organize weekly instructional topics, match educational frameworks, and structure milestones.' 
              : 'Review upcoming lesson outcomes, preparation schedules, and weekly chapter scopes.'}
          </Typography>
        </Box>
        {isAuthorizedAuthor && (
          <Button variant="contained" startIcon={<AddIcon />} sx={{ textTransform: 'none', borderRadius: '8px' }}>
            Draft Lesson Plan
          </Button>
        )}
      </Box>

      {isAuthorizedAuthor ? (
        <Stack spacing={3}>
          <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
              <CalendarMonthIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Week 3: Analytical Geometry (Mathematics Grade 12)
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Scope: Focus on lines of inclination, coordinate systems, and mid-point proofs. Includes formative quiz integration tracking.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="text" sx={{ textTransform: 'none' }}>Edit Details</Button>
              <Button size="small" variant="text" color="error" sx={{ textTransform: 'none' }}>Archive Plan</Button>
            </Box>
          </Paper>
        </Stack>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary', borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          No public weekly lesson outlines have been released by your instructors for the current topic tracks.
        </Paper>
      )}
    </Box>
  );
}