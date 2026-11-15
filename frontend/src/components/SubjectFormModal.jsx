import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

export default function SubjectFormModal({ modalState, onClose, onSave, loading }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [grade, setGrade] = useState('');

  useEffect(() => {
    if (modalState.mode === 'edit' && modalState.selectedSubject) {
      setName(modalState.selectedSubject.subject_name);
      setCode(modalState.selectedSubject.subject_code);
      setGrade(modalState.selectedSubject.grade);
    } else {
      setName('');
      setCode('');
      setGrade('');
    }
  }, [modalState]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !grade) return;
    onSave({ subject_name: name.trim(), subject_code: code.trim().toUpperCase(), grade: parseInt(grade) });
  };

  return (
    <Dialog open={modalState.isOpen} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 600 }}>
        {modalState.mode === 'create' ? 'Add Academic Subject' : 'Modify Subject Details'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Subject Name"
              placeholder="e.g., Mathematics"
              fullWidth required disabled={loading}
              value={name} onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Subject Code"
              placeholder="e.g., MATH101"
              fullWidth required disabled={loading}
              value={code} onChange={(e) => setCode(e.target.value)}
            />
            <TextField
              label="Grade Level Target"
              placeholder="e.g., 10"
              type="number" fullWidth required disabled={loading}
              inputProps={{ min: 1, max: 12 }}
              value={grade} onChange={(e) => setGrade(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} disabled={loading} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : modalState.mode === 'create' ? 'Create Subject' : 'Apply Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}