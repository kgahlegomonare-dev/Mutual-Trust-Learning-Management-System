import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useAuth } from '../../hooks/useAuth';

//Import Components
import AdminReports from '../../components/reports/AdminReports';
import LearnerReports from '../../components/reports/LearnerReports';
import ManagerReports from '../../components/reports/ManagerReports';
import TeacherReports from '../../components/reports/TeacherReports';

export default function Reports() {
  const { user } = useAuth();
  const role = user?.user_role?.toLowerCase() || '';

  if (role.includes('admin')) {
    return <AdminReports />;
  }
  if (role.includes('manager')) {
    return <ManagerReports />;
  }
  if (role.includes('teacher')) {
    return <TeacherReports />;
  }
  if (role.includes('learner')) {
    return <LearnerReports />;
  }
  return <div> Unable to display reports for the current user role.</div>;
}