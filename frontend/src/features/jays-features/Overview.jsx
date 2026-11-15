import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { useAuth } from '../../hooks/useAuth';

export default function Overview() {
  const { authUser } = useAuth();
  const userRole = authUser?.user_role?.toLowerCase() || 'admin';

  return (
    <Box sx={{ p: 1, width: '100%' }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
        System Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Welcome back! Here is your workspace summary for today.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Active Profile View: {userRole.toUpperCase()}
            </Typography>
            
            {userRole === 'admin' && (
              <Typography variant="body1">
                Admin Console: Use the left navigation panel to regulate institutional center registries, control global administrative configuration scopes, and configure cross-cutting user security credentials.
              </Typography>
            )}
            {userRole === 'manager' && (
              <Typography variant="body1">
                Manager Control Board: Access timetables, regulate local subject tracks, manage classrooms assigned to your center facility, and review overarching student metrics.
              </Typography>
            )}
            {userRole === 'teacher' && (
              <Typography variant="body1">
                Educator Terminal: Update mark schedules, track daily digital class attendance registers, manage quiz resources, and design interactive lesson plans.
              </Typography>
            )}
            {userRole === 'learner' && (
              <Typography variant="body1">
                Learner Desk: Keep track of pending assessment submissions, view personal weekly schedules, track report card grading updates, and fetch online learning files.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '12px', bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Quick Notifications
            </Typography>
            <Typography variant="caption" color="text.secondary">
              No new critical operational exceptions logged within this sector block. Check the announcements route for global institutional notices.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}