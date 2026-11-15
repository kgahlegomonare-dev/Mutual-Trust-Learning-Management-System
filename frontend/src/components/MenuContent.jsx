import React from 'react';
import { NavLink } from 'react-router-dom';
import "../styles/main.css";
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import FlagIcon from '@mui/icons-material/Flag';

// Core structural material icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import ClassIcon from '@mui/icons-material/Class';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GradeIcon from '@mui/icons-material/Grade';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import RateReviewIcon from '@mui/icons-material/RateReview';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import QuizIcon from '@mui/icons-material/Quiz';
import ForumIcon from '@mui/icons-material/Forum';
import CoPresentIcon from '@mui/icons-material/CoPresent';
import NoteAltIcon from '@mui/icons-material/NoteAlt';


// Custom megaphone icon asset pointer
import megaphoneIcon from "../assets/icons/megaphone.svg";

// Get authorization session hook
import { useAuth } from '../hooks/useAuth';

export default function MenuContent({ currentRole }) {
  // 1. Extract the actual authenticated user state from the system core
  const { user } = useAuth();
  
  // 2. Safely grab the raw role string and normalize it to lowercase
  const rawRole = (user?.user_role || currentRole || 'learner').toLowerCase();
  
  // 3. Normalize variations like "Center Manager" or "manager" down to a clean match key
  let activeRole = 'learner';
  if (rawRole.includes('admin')) activeRole = 'admin';
  else if (rawRole.includes('manager')) activeRole = 'manager';
  else if (rawRole.includes('teacher')) activeRole = 'teacher';
  
  // Custom wrapper fallback to cleanly parse custom img layout tags inside list rows
  const Megaphone = <img src={megaphoneIcon} alt="announcements" className="menu-custom-icon" />;

  // Explicit role matrix mapping layout structure
  const roleMenus = {
    admin: [
      //{ text: 'Overview', path: '/dashboard/overview', icon: <DashboardIcon /> },
      { text: 'User Management', path: '/dashboard/users', icon: <PeopleIcon /> },
      { text: 'Center Management', path: '/dashboard/centers', icon: <CorporateFareIcon /> },
      { text: 'Announcements', path: '/dashboard/announcements', icon: Megaphone },
      { text: 'Reports', path: '/dashboard/reports', icon: <AssessmentIcon /> },
    ],
    manager: [
      //{ text: 'Overview', path: '/dashboard/overview', icon: <DashboardIcon /> },
      { text: 'User Management', path: '/dashboard/users', icon: <PeopleIcon /> },
      { text: 'Class Management', path: '/dashboard/classes', icon: <ClassIcon /> },
      { text: 'Subject Management', path: '/dashboard/subjects', icon: <MenuBookIcon /> },
      { text: 'Learner Feedback', path: '/dashboard/feedback', icon: <RateReviewIcon /> },
      { text: 'Reports', path: '/dashboard/reports', icon: <AssessmentIcon /> },
      { text: 'Announcements', path: '/dashboard/announcements', icon: Megaphone },
       { text: 'Flagging', path: '/dashboard/flagging', icon: <FlagIcon /> },
    ],
    teacher: [
      //{ text: 'Overview', path: '/dashboard/overview', icon: <DashboardIcon /> },
      { text: 'Lesson Planner', path: '/dashboard/lesson-planner', icon: <NoteAltIcon /> },
      { text: 'Learning Material', path: '/dashboard/materials', icon: <AutoStoriesIcon /> },
      //{ text: 'Mark Management', path: '/dashboard/marks', icon: <GradeIcon /> },
      //{ text: 'Quizzes', path: '/dashboard/quizzes', icon: <QuizIcon /> },
      { text: 'Assessments', path: '/teacher-assessments', icon: <AssessmentIcon /> },
      //{ text: 'Discussion Forums', path: '/dashboard/forums', icon: <ForumIcon /> },
      { text: 'Attendance', path: '/dashboard/attendance', icon: <CoPresentIcon /> },
      // { text: 'Timetables', path: '/dashboard/timetable', icon: <CalendarMonthIcon /> },
      { text: 'Reports', path: '/dashboard/reports', icon: <AssessmentIcon /> },
      { text: 'Announcements', path: '/dashboard/announcements', icon: Megaphone },
      { text: 'Flagging', path: '/dashboard/flagging', icon: <FlagIcon /> },
    ],
    learner: [
      //{ text: 'Overview', path: '/dashboard/overview', icon: <DashboardIcon /> },
      { text: 'Learning Material', path: '/dashboard/materials', icon: <AutoStoriesIcon /> },
      //{ text: 'Marks', path: '/dashboard/my-marks', icon: <GradeIcon /> },
      //{ text: 'Quizzes', path: '/dashboard/my-quizzes', icon: <QuizIcon /> },
      { text: 'Assessments', path: '/student-assessments', icon: <AssessmentIcon /> },
      { text: 'Learning Guide', path: '/dashboard/lesson-plan', icon: <NoteAltIcon /> },
	  { text: 'My Attendance', path: '/dashboard/attendance', icon: <CoPresentIcon /> },
      //{ text: 'Discussion Forum', path: '/dashboard/forum', icon: <ForumIcon /> },
      { text: 'Learner Feedback', path: '/dashboard/my-feedback', icon: <RateReviewIcon /> },
      { text: 'Personal Report', path: '/dashboard/my-report', icon: <AssessmentIcon /> },
      { text: 'Announcements', path: '/dashboard/announcements', icon: Megaphone }
    ]
  };

  // Extract the specific role items safely, matching the active user session tier
  const visibleItems = roleMenus[activeRole] || roleMenus.learner;

  return (
    <List dense>
      {visibleItems.map((item, index) => (
        <ListItem key={index} disablePadding sx={{ display: 'block' }}>
          <ListItemButton 
            component={NavLink} 
            to={item.path}
            sx={{
              '&.active': {
                backgroundColor: 'action.selected',
                color: 'primary.main',
                fontWeight: 'bold',
                '& .MuiListItemIcon-root': { color: 'primary.main' }
              }
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}