import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import AppNavbar from './components/AppNavbar';
import Header from './components/Header';
import SideMenu from './components/SideMenu';
import AppTheme from './shared-theme/AppTheme';

import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from './theme/customizations';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

export default function Dashboard({ currentRole, onRoleChange, ...props }) {
  const navigate = useNavigate();

  // Reset navigation path safely when swapping roles to avoid rendering dead views
  const handleRoleTransition = (newRole) => {
    onRoleChange(newRole);
    navigate('/dashboard/overview');
  };

  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        
        {/* Sidebar Frame */}
        <SideMenu 
          currentRole={currentRole} 
          onRoleChange={handleRoleTransition}
        />
        
        <AppNavbar currentRole={currentRole} />
        
        {/* Core Canvas Viewport */}
       <Box
  component="main"
  sx={(theme) => ({
    flexGrow: 1,
    minWidth: 0,
    minHeight: '100vh',
    backgroundColor: theme.vars
      ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
      : alpha(theme.palette.background.default, 1),
    overflow: 'auto',
  })}
>
  <Box
    sx={{
      width: '100%',
      minWidth: 0,
      px: 3,
      pb: 5,
      pt: { xs: 8, md: 2 },
    }}
  >
    <Outlet />
  </Box>
</Box>
      </Box>
    </AppTheme>
  );
}
