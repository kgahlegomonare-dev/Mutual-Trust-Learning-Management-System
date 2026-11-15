import React from 'react';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuContent from './MenuContent';
import logo from "../assets/icons/logo.svg";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';

const drawerWidth = 240;

const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  mt: 10,
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
    /* Hide scrollbar on the drawer container */
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
});

export default function SideMenu({ currentRole = 'admin' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Extract first_name and last_name from logged in user profile
  const firstName = user?.first_name || '';
  const lastName = user?.last_name || '';
  
  // Combine full name for display
  const fullName = `${firstName} ${lastName}`.trim() || 'User Profile';
  
  // Extract initials (e.g., "TM" for Thabo Monare)
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  const userInitials = (firstInitial + lastInitial) || 'U';

  // Subtitle / identifier string
  const userIdentifier = user?.email || user?.login_number || user?.operational_id || '';

  const handleLogoutClick = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        [`& .${drawerClasses.paper}`]: {
          backgroundColor: 'background.paper',
        },
      }}
    >
      {/* Top Section: Logo Container */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          mt: 'calc(var(--template-frame-height, 0px) + 12px)',
          px: 2,
          py: 1,
          width: '100%',
          height: '80px',
        }}
      >
        <Box
          component={Link}
          to="/dashboard/overview"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            height: '100%',
            textDecoration: 'none',
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.85,
            },
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="mutual-trust-logo"
            sx={{
              maxHeight: '70%',
              maxWidth: '100%',
              objectFit: 'contain',
              transform: 'scale(1.3)',
              transformOrigin: 'left center',
            }}
          />
        </Box>
      </Box>
      <Divider sx={{ mt: 1 }} />

      {/* Middle Section: Navigation Menu Links & Logout Button (Scrollbar hidden) */}
      <Box 
        sx={{ 
          overflowY: 'auto', 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          p: 1,
          /* Hide scrollbar for Chrome, Safari and Opera */
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          /* Hide scrollbar for IE, Edge and Firefox */
          msOverflowStyle: 'none',  /* IE and Edge */
          scrollbarWidth: 'none',  /* Firefox */
        }}
      >
        <MenuContent currentRole={currentRole} />

        {/* Dynamic spacer that pushes the action component down */}
        <Box sx={{ mt: 'auto', pt: 2, pb: 1 }}>
          <Button
            variant="text"
            fullWidth
            color="error"
            startIcon={<LogoutRoundedIcon />}
            onClick={handleLogoutClick}
            sx={{
              justifyContent: 'flex-start',
              px: 2,
              py: 1,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              '&:hover': {
                backgroundColor: 'error.lighter',
              },
            }}
          >
            Logout Account
          </Button>
        </Box>
      </Box>

      {/* Bottom Section: Actual Logged-In User Profile Identity Card */}
      <Stack
        direction="row"
        sx={{ p: 2, gap: 1.5, alignItems: 'center', borderTop: '1px solid', borderColor: 'divider' }}
      >
        <Avatar
          sizes="small"
          alt={fullName}
          sx={{ 
            width: 36, 
            height: 36, 
            bgcolor: '#0A3161', 
            fontSize: '0.85rem', 
            fontWeight: 600 
          }}
        >
          {userInitials}
        </Avatar>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600, lineHeight: '16px' }}>
            {fullName}
          </Typography>
          {userIdentifier && (
            <Typography variant="caption" noWrap sx={{ color: 'text.secondary', display: 'block' }}>
              {userIdentifier}
            </Typography>
          )}
        </Box>
      </Stack>
    </Drawer>
  );
}
