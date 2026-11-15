import React, { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';

/* Format a stored date as a plain, local day — avoids the UTC shift
   showing "22:00 the day before". */
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
  });

export default function LessonPlanner() {
  const { user } = useAuth();
  const role = (user?.user_role || '').toLowerCase();

  if (role === 'teacher') return <TeacherPlanner />;
  if (role === 'learner') return <LearnerPlanner />;

  return (
    <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Lesson Planner</Typography>
      <Typography variant="body2" color="text.secondary">
        Teachers plan lessons here; learners can see what's coming up.
      </Typography>
    </Box>
  );
}

/* ============================================================
   Shared: the three views of a lesson list
   ============================================================ */
function LessonViews({ lessons, view, renderActions, showTeacher }) {
  if (lessons.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No lessons planned yet.
        </Typography>
      </Paper>
    );
  }

  if (view === 'week') {
    // group by week number
    const byWeek = {};
    for (const l of lessons) {
      (byWeek[l.week] = byWeek[l.week] || []).push(l);
    }
    const weeks = Object.keys(byWeek).sort((a, b) => a - b);
    return (
      <Box>
        {weeks.map((w) => (
          <Box key={w} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Week {w}
            </Typography>
            <LessonTable lessons={byWeek[w]} renderActions={renderActions} showTeacher={showTeacher} />
          </Box>
        ))}
      </Box>
    );
  }

  if (view === 'calendar') {
    return <CalendarView lessons={lessons} />;
  }

  // default: flat list
  return <LessonTable lessons={lessons} renderActions={renderActions} showTeacher={showTeacher} />;
}

function LessonTable({ lessons, renderActions, showTeacher }) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
      <Table size="small">
        <TableHead sx={{ backgroundColor: 'action.hover' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Wk</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Topic</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
            {showTeacher && <TableCell sx={{ fontWeight: 600 }}>Teacher</TableCell>}
            {renderActions && <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {lessons.map((l) => (
            <TableRow key={l.planner_id} hover>
              <TableCell>{fmtDate(l.lesson_date)}</TableCell>
              <TableCell>{l.week}</TableCell>
              <TableCell sx={{ fontWeight: 500 }}>{l.topic || '—'}</TableCell>
              <TableCell>{l.subject_name}</TableCell>
              <TableCell>{l.class_name}</TableCell>
              {showTeacher && <TableCell>{l.teacher_name}</TableCell>}
              {renderActions && (
                <TableCell align="right">{renderActions(l)}</TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/* A light calendar: months with day cells that carry lessons */
function CalendarView({ lessons }) {
  // group lessons by YYYY-MM-DD
  const byDay = {};
  for (const l of lessons) {
    const d = new Date(l.lesson_date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    (byDay[key] = byDay[key] || []).push(l);
  }

  // show the month of the earliest and latest lesson range, simple: one month grid
  // per distinct month present
  const months = {};
  for (const l of lessons) {
    const d = new Date(l.lesson_date);
    const mkey = `${d.getFullYear()}-${d.getMonth()}`;
    months[mkey] = { year: d.getFullYear(), month: d.getMonth() };
  }
  const monthList = Object.values(months).sort(
    (a, b) => a.year - b.year || a.month - b.month
  );

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];

  return (
    <Box>
      {monthList.map(({ year, month }) => {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);

        return (
          <Paper key={`${year}-${month}`} variant="outlined" sx={{ p: 2, borderRadius: '12px', mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
              {monthNames[month]} {year}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
              {dayNames.map((dn) => (
                <Typography key={dn} variant="caption" sx={{ fontWeight: 600, textAlign: 'center', color: 'text.secondary' }}>
                  {dn}
                </Typography>
              ))}
              {cells.map((d, i) => {
                if (d === null) return <Box key={`e${i}`} />;
                const key = `${year}-${month}-${d}`;
                const dayLessons = byDay[key] || [];
                return (
                  <Box
                    key={key}
                    sx={{
                      minHeight: 64,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '8px',
                      p: 0.5,
                      backgroundColor: dayLessons.length ? 'action.hover' : 'transparent',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{d}</Typography>
                    {dayLessons.map((l) => (
                      <Typography
                        key={l.planner_id}
                        variant="caption"
                        sx={{
                          display: 'block', mt: 0.25, px: 0.5, borderRadius: '4px',
                          backgroundColor: 'primary.main', color: 'primary.contrastText',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          fontSize: '0.65rem',
                        }}
                        title={`${l.topic || 'Lesson'} — ${l.subject_name}`}
                      >
                        {l.topic || l.subject_name}
                      </Typography>
                    ))}
                  </Box>
                );
              })}
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
}

/* A small view-switcher used by both roles */
function ViewToggle({ view, setView }) {
  return (
    <ToggleButtonGroup
      value={view}
      exclusive
      size="small"
      onChange={(e, v) => v && setView(v)}
    >
      <ToggleButton value="list" sx={{ textTransform: 'none' }}>List</ToggleButton>
      <ToggleButton value="week" sx={{ textTransform: 'none' }}>By week</ToggleButton>
      <ToggleButton value="calendar" sx={{ textTransform: 'none' }}>Calendar</ToggleButton>
    </ToggleButtonGroup>
  );
}

/* ============================================================
   TEACHER
   ============================================================ */
function TeacherPlanner() {
  const [assignments, setAssignments] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);  // lesson being edited, or null for new

  const loadAssignments = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/teacher/attendance/assignments');
      setAssignments(res.data || []);
    } catch (err) {
      console.error('Could not load assignments:', err);
    }
  }, []);

  const loadLessons = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/teacher/lessons');
      setLessons(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your lessons.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAssignments(); loadLessons(); }, [loadAssignments, loadLessons]);

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (lesson) => { setEditing(lesson); setDialogOpen(true); };

  const handleDelete = async (lesson) => {
    if (!window.confirm(`Delete the lesson "${lesson.topic || 'Untitled'}"?`)) return;
    try {
      await axiosInstance.delete(`/teacher/lessons/${lesson.planner_id}`);
      setSuccess('Lesson deleted.');
      await loadLessons();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the lesson.');
    }
  };

  const renderActions = (l) => (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
      <IconButton size="small" onClick={() => openEdit(l)}><EditIcon fontSize="small" /></IconButton>
      <IconButton size="small" onClick={() => handleDelete(l)}><DeleteIcon fontSize="small" /></IconButton>
    </Box>
  );

  if (loading) {
    return <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Lesson Planner</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Plan what you're teaching and when. Learners can see it too.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={openNew}
          sx={{ fontWeight: 600, textTransform: 'none', borderRadius: '8px' }}
        >
          + New Lesson
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Box sx={{ mb: 2 }}>
        <ViewToggle view={view} setView={setView} />
      </Box>

      <LessonViews lessons={lessons} view={view} renderActions={renderActions} showTeacher={false} />

      <LessonDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        assignments={assignments}
        editing={editing}
        onSaved={async (msg) => {
          setDialogOpen(false);
          setSuccess(msg);
          await loadLessons();
        }}
        onError={setError}
      />
    </Box>
  );
}

/* Create / edit dialog */
function LessonDialog({ open, onClose, assignments, editing, onSaved, onError }) {
  const [assignment, setAssignment] = useState('');
  const [week, setWeek] = useState('');
  const [lessonDate, setLessonDate] = useState('');
  const [topic, setTopic] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setWeek(editing.week ?? '');
      // date input needs YYYY-MM-DD
      const d = new Date(editing.lesson_date);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      setLessonDate(iso);
      setTopic(editing.topic || '');
      setAssignment(''); // subject/class not editable on edit
    } else {
      setAssignment(''); setWeek(''); setLessonDate(''); setTopic('');
    }
  }, [editing, open]);

  const handleSave = async () => {
    const weekNum = parseInt(week, 10);
    if (Number.isNaN(weekNum) || weekNum < 1) {
      onError('Week must be a positive number.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await axiosInstance.patch(`/teacher/lessons/${editing.planner_id}`, {
          week: weekNum,
          lesson_date: lessonDate || undefined,
          topic,
        });
        onSaved('Lesson updated.');
      } else {
        const a = assignments.find((x) => x.assignment_id === assignment);
        if (!a) { onError('Pick a class and subject.'); setSaving(false); return; }
        await axiosInstance.post('/teacher/lessons', {
          subject_id: a.subject_id,
          class_id: a.class_id,
          week: weekNum,
          lesson_date: lessonDate,
          topic,
        });
        onSaved('Lesson planned.');
      }
    } catch (err) {
      onError(err.response?.data?.message || 'Could not save the lesson.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle>{editing ? 'Edit lesson' : 'New lesson'}</DialogTitle>
      <DialogContent>
        {!editing && (
          <FormControl fullWidth size="small" sx={{ mb: 2, mt: 1 }}>
            <InputLabel id="assign-label">Class &amp; Subject</InputLabel>
            <Select
              labelId="assign-label"
              label="Class & Subject"
              value={assignment}
              onChange={(e) => setAssignment(e.target.value)}
            >
              {assignments.length === 0 && (
                <MenuItem value="" disabled>No classes assigned to you</MenuItem>
              )}
              {assignments.map((a) => (
                <MenuItem key={a.assignment_id} value={a.assignment_id}>
                  {a.subject_name} ({a.subject_code}) — {a.class_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <TextField
          label="Week number" type="number" fullWidth size="small" sx={{ mb: 2 }}
          value={week} onChange={(e) => setWeek(e.target.value)}
          inputProps={{ min: 1 }}
        />
        <TextField
          label="Lesson date" type="date" fullWidth size="small" sx={{ mb: 2 }}
          InputLabelProps={{ shrink: true }}
          value={lessonDate} onChange={(e) => setLessonDate(e.target.value)}
        />
        <TextField
          label="Topic" fullWidth size="small" multiline rows={2}
          value={topic} onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Introduction to Algebra"
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained" onClick={handleSave} disabled={saving}
          sx={{ fontWeight: 600, textTransform: 'none', borderRadius: '8px' }}
        >
          {saving ? <CircularProgress size={22} /> : (editing ? 'Save changes' : 'Add lesson')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ============================================================
   LEARNER
   ============================================================ */
function LearnerPlanner() {
  const [lessons, setLessons] = useState([]);
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get('/learner/lessons');
        setLessons(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load lessons.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Lesson Planner</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          What your teachers have planned, past and upcoming.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box sx={{ mb: 2 }}>
        <ViewToggle view={view} setView={setView} />
      </Box>

      <LessonViews lessons={lessons} view={view} renderActions={null} showTeacher={true} />
    </Box>
  );
}