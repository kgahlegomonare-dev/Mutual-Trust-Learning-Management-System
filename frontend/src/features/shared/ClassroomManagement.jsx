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
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';

// Import our custom logic brain hook and visual modal files
import { useClasses } from '../../hooks/useClasses';
import ClassroomFormModal from '../../components/ClassroomFormModal';
import DeactivateClassModal from '../../components/DeactivateClassModal';

export default function ClassroomDashboard() {
  const {
    classes,
    searchTerm,
    setSearchTerm,
    loading,
    error,
    successMessage,
    modalState,
    archiveTarget,
    setArchiveTarget,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSaveClassroom,
    handleArchive,
    loadClasses
  } = useClasses();

  // Load the classes when the dashboard mounts
  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
      {/* Upper Action Bar Banner Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Campus Classrooms & Spaces
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Configure venue boundaries, modify operational properties, and manage schedule structures.
          </Typography>
        </Box>
        <Button variant="contained" color="primary" onClick={openCreateModal} sx={{ fontWeight: 600 }}>
          + Create New Class
        </Button>
      </Box>

      {/* Dynamic System Alert Feedbacks */}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

      {/* Roster Live Filtration Searching Input Field */}
      <TextField
        placeholder="Filter classes by name..."
        variant="outlined"
        size="small"
        fullWidth
        sx={{ mb: 3, backgroundColor: 'background.paper' }}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Classroom Master Data Grid Layout */}
      <TableContainer component={Paper} variant="outlined">
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>Class Name</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>Max Desk Capacity</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>Operational Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>Management Controls</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Syncing campus database layout configurations...
                </TableCell>
              </TableRow>
            ) : classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No classroom structures found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              classes.map((cls) => (
                <TableRow key={cls.class_id} hover sx={{ opacity: cls.is_active ? 1 : 0.6 }}>
                  <TableCell sx={{ fontWeight: 600 }}>{cls.class_name}</TableCell>
                  <TableCell>{cls.class_capacity} Seats Assigned</TableCell>
                  <TableCell>
                    <Chip
                      label={cls.is_active ? 'Active' : 'Suspended'}
                      size="small"
                      color={cls.is_active ? 'success' : 'error'}
                      variant="outlined"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Button size="small" variant="outlined" onClick={() => openEditModal(cls)} disabled={!cls.is_active}>
                        Edit
                      </Button>
                      {cls.is_active ? (
                        <Button size="small" variant="outlined" color="error" onClick={() => setArchiveTarget(cls)}>
                          Deactivate
                        </Button>
                      ) : (
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', display: 'block', maxWidth: '200px', alignSelf: 'center' }} title={cls.reason_for_deactivation}>
                          Reason: {cls.reason_for_deactivation}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Form Overlay Popup Window */}
      <ClassroomFormModal
        modalState={modalState}
        onClose={closeModal}
        onSave={handleSaveClassroom}
        loading={loading}
      />

      {/* Deactivation Compliance Reason Form Window */}
      <DeactivateClassModal
        targetClass={archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        loading={loading}
      />
    </Box>
  );
}