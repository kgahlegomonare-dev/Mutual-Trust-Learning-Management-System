import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

export default function DeactivateClassModal({ targetClass, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason('');
  };

  return (
    <Dialog open={Boolean(targetClass)} onClose={onClose} fullWidth maxLength="xs">
      <DialogTitle sx={{ color: 'error.main', fontWeight: 600 }}>Deactivate Classroom Space</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <DialogContentText sx={{ mb: 2, fontSize: '0.9rem' }}>
            Are you sure you want to suspend access to <strong>{targetClass?.class_name}</strong>? 
            Please state an administrative reason for record keeping:
          </DialogContentText>
          <TextField
            label="Deactivation Audit Note"
            placeholder="e.g., Semester track finished / Instructor scheduling reallocation"
            multiline
            rows={3}
            fullWidth
            required
            disabled={loading}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={loading} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" color="error" disabled={loading || !reason.trim()}>
            {loading ? 'Archiving...' : 'Confirm Suspension'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}