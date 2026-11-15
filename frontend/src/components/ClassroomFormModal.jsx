import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

export default function ClassroomFormModal({ modalState, onClose, onSave, loading }) {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');

  // Hydrate fields if we are entering Edit mode
  useEffect(() => {
    if (modalState.mode === 'edit' && modalState.selectedClass) {
      setName(modalState.selectedClass.class_name);
      setCapacity(modalState.selectedClass.class_capacity);
    } else {
      setName('');
      setCapacity('');
    }
  }, [modalState]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !capacity) return;
    onSave(name.trim(), capacity);
  };

  return (
    <Dialog open={modalState.isOpen} onClose={onClose} fullWidth maxLength="xs">
      <DialogTitle sx={{ fontWeight: 600 }}>
        {modalState.mode === 'create' ? 'Provision New Class Venue' : 'Modify Classroom Settings'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Classroom Designation Name"
              placeholder="e.g., Grade 10A Mathematics"
              variant="outlined"
              fullWidth
              required
              disabled={loading}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Student Seating Capacity"
              placeholder="e.g., 35"
              type="number"
              variant="outlined"
              fullWidth
              required
              disabled={loading}
              inputProps={{ min: 1 }}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} disabled={loading} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading} color="primary">
            {loading ? 'Saving Layout...' : modalState.mode === 'create' ? 'Create Class' : 'Apply Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}