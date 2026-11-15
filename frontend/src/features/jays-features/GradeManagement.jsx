import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../../hooks/useAuth';

export default function GradeManagement() {
  const { authUser } = useAuth();
  const userRole = authUser?.user_role?.toLowerCase() || 'learner';

  return (
    <Box sx={{ p: 1, width: '100%' }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
        {userRole === 'learner' ? 'My Academic Marks Log' : 'Grade & Performance Management'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        {userRole === 'learner' 
          ? 'Review your current continuous assessment marks, weights, and term progress parameters.' 
          : 'Record class exam values, adjust assessment weight matrices, and verify report evaluations.'}
      </Typography>

      {userRole !== 'learner' && (
        <Box sx={{ mb: 3, maxWidth: '400px' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search learner rosters or subjects..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
        </Box>
      )}

      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Typography variant="body1" color="text.secondary">
          No grade profiles or record spreadsheets are currently active. {userRole === 'learner' ? 'Marks appear here once published by your educator.' : 'Select a class level or specialized syllabus subject row to activate the ledger inputs.'}
        </Typography>
      </Paper>
    </Box>
  );
}