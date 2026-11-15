import React, { useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';

import { useSubjects } from '../../hooks/useSubjects';
import SubjectFormModal from '../../components/SubjectFormModal';

export default function SubjectDashboard() {
  const {
    subjects, searchTerm, setSearchTerm, loading, error, successMessage,
    modalState, openCreateModal, openEditModal, closeModal, handleSaveSubject, handleDeleteSubject, loadSubjects
  } = useSubjects();

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Academic Curriculum Subjects</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Define core course profiles, systemic tracking identifiers, and grade level milestones.</Typography>
        </Box>
        <Button variant="contained" onClick={openCreateModal} sx={{ fontWeight: 600 }}>+ Add New Subject</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

      <TextField
        placeholder="Filter subjects by name or tracking identifier code..."
        size="small" fullWidth sx={{ mb: 3, backgroundColor: 'background.paper' }}
        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
      />

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead sx={{ backgroundColor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Subject Code</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Subject Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Target Grade Milestone</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Management Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(subjects || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  {loading ? 'Syncing curriculum items...' : 'No curriculum subjects found matching criteria.'}
                </TableCell>
              </TableRow>
            ) : (
              subjects.map((sub) => (
                <TableRow key={sub.subject_id} hover>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>{sub.subject_code}</TableCell>
                  <TableCell>{sub.subject_name}</TableCell>
                  <TableCell>Grade {sub.grade}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Button size="small" variant="outlined" onClick={() => openEditModal(sub)}>Edit</Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteSubject(sub.subject_id)}>Delete</Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <SubjectFormModal modalState={modalState} onClose={closeModal} onSave={handleSaveSubject} loading={loading} />
    </Box>
  );
}