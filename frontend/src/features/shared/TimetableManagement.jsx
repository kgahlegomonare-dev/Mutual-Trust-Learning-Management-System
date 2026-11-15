import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Alert from '@mui/material/Alert';

import { fetchCenterClasses } from '../../services/classService';
import { useTeacherAssignments } from '../../hooks/useTeacherAssignments';
import { useTimetables } from '../../hooks/useTimetables';
import TimetableFormModal from '../../components/TimetableFormModal';

const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

export default function TimetableCalendar() {
  const [classesList, setClassesList] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');

  const { assignments, loadAssignments } = useTeacherAssignments(selectedClass);
  const { timetableSlots, error, successMessage, isModalOpen, setIsModalOpen, loadTimetable, handleAddSlot, handleDropSlot, loading } = useTimetables(selectedClass);

  useEffect(() => {
    fetchCenterClasses().then(data => {
      if (data && data.length > 0) {
        setClassesList(data);
        setSelectedClass(data[0].class_id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadAssignments();
      loadTimetable();
    }
  }, [selectedClass, loadAssignments, loadTimetable]);

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Master Academic Timetables</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Track and schedule course slots dynamically for specific workspace classrooms.</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200, backgroundColor: 'background.paper' }}>
            <InputLabel>Active Classroom Space</InputLabel>
            <Select value={selectedClass} label="Active Classroom Space" onChange={(e) => setSelectedClass(e.target.value)}>
              {classesList.map(cls => <MenuItem key={cls.class_id} value={cls.class_id}>{cls.class_name}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" disabled={!selectedClass} onClick={() => setIsModalOpen(true)}>+ Schedule Slot</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

      <Grid container spacing={2}>
        {WEEK_DAYS.map((day) => {
          // Safeguard fallback array and sort slots chronologically by start_time
          const slotsForDay = (timetableSlots || [])
            .filter(s => s.timetable_day?.toLowerCase() === day)
            .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

          return (
            <Grid item xs={12} md={2.4} key={day}>
              <Paper variant="outlined" sx={{ p: 1.5, minHeight: '450px', backgroundColor: 'action.hover' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', mb: 2, pb: 0.5, borderBottom: '2px solid', borderColor: 'divider' }}>
                  {day}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {slotsForDay.length === 0 ? (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mt: 4, fontStyle: 'italic' }}>
                      No lessons
                    </Typography>
                  ) : (
                    slotsForDay.map((slot) => (
                      <Card key={slot.timetable_id} variant="outlined" sx={{ position: 'relative', overflow: 'visible' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', pr: 2 }}>{slot.subject_name}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            Instructor: {slot.teacher_last_name || 'Unassigned'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, mt: 0.5, display: 'block' }}>
                            {slot.start_time ? slot.start_time.slice(0, 5) : '--:--'} - {slot.end_time ? slot.end_time.slice(0, 5) : '--:--'}
                          </Typography>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDropSlot(slot.timetable_id)} 
                            sx={{ position: 'absolute', top: 4, right: 4 }}
                          >
                            <DeleteIcon fontSize="inherit" />
                          </IconButton>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <TimetableFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleAddSlot} assignments={assignments} loading={loading} />
    </Box>
  );
}