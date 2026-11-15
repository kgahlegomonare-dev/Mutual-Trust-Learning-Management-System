import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';

export default function TimetableFormModal({ isOpen, onClose, onSave, assignments, loading }) {
  const [assignmentId, setAssignmentId] = useState('');
  const [day, setDay] = useState('monday');
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('09:00');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!assignmentId || !day || !start || !end) return;
    onSave(assignmentId, day, start, end);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 600 }}>Schedule New Timetable Slot</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <FormControl fullWidth required disabled={loading}>
              <InputLabel>Target Course & Teacher</InputLabel>
              <Select
                value={assignmentId}
                label="Target Course & Teacher"
                onChange={(e) => setAssignmentId(e.target.value)}
              >
                {assignments.map((asg) => (
                  <MenuItem key={asg.assignment_id} value={asg.assignment_id}>
                    {asg.subject_name} ({asg.subject_code}) - {asg.teacher_first_name} {asg.teacher_last_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required disabled={loading}>
              <InputLabel>Day of Week</InputLabel>
              <Select value={day} label="Day of Week" onChange={(e) => setDay(e.target.value)}>
                <MenuItem value="monday">Monday</MenuItem>
                <MenuItem value="tuesday">Tuesday</MenuItem>
                <MenuItem value="wednesday">Wednesday</MenuItem>
                <MenuItem value="thursday">Thursday</MenuItem>
                <MenuItem value="friday">Friday</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Start Time" type="time" fullWidth required disabled={loading}
                InputLabelProps={{ shrink: true }} inputProps={{ step: 300 }}
                value={start} onChange={(e) => setStart(e.target.value)}
              />
              <TextField
                label="End Time" type="time" fullWidth required disabled={loading}
                InputLabelProps={{ shrink: true }} inputProps={{ step: 300 }}
                value={end} onChange={(e) => setEnd(e.target.value)}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} disabled={loading} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading || assignments.length === 0}>
            Add Slot
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}