import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../../hooks/useAuth';

export default function Assessments() {
  const { authUser } = useAuth();
  const isManagementOrTeacher = ['admin', 'manager', 'teacher'].includes(authUser?.user_role?.toLowerCase());

  // Dummy catalog payload matrix
  const assessmentsPlaceholder = [
    { id: 'ASM01', name: 'Mathematics Term 2 Assignment', grade: 'Grade 11', subject: 'Mathematics', type: 'Project', deadline: '2026-07-15' },
    { id: 'ASM02', name: 'Physical Sciences Physics Lab 1', grade: 'Grade 12', subject: 'Physical Sciences', type: 'Practical', deadline: '2026-07-20' },
  ];

  return (
    <Box sx={{ p: 1, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Assessments Workspace</Typography>
          <Typography variant="body2" color="text.secondary">Manage or view upcoming formal curriculum projects, tests, and homework parameters.</Typography>
        </Box>
        {isManagementOrTeacher && (
          <Button variant="contained" startIcon={<AddIcon />} sx={{ textTransform: 'none', borderRadius: '8px' }}>
            Create Assessment
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Assessment Item</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Academic Track</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Subject Category</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Format</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assessmentsPlaceholder.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.id}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                <TableCell>{row.grade}</TableCell>
                <TableCell>{row.subject}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell>{row.deadline}</TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined" sx={{ textTransform: 'none', borderRadius: '6px' }}>
                    {isManagementOrTeacher ? 'Edit Track' : 'View Scope'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}